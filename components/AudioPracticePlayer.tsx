/**
 * AudioPracticePlayer — Apple-style плеер практики повторений (Shadowing).
 *
 * Реализация спеки «Baraka & Iman Mind» (модуль Б):
 *  1. Встроенная запись голоса пользователя (MediaRecorder) — 1 раз, в спокойном состоянии.
 *  2. Авто-повтор (loop) с паузой 500мс между повторами.
 *  3. Счётчик повторений в реальном времени — автоинкремент на `onended`.
 *  4. YouTube-style scrubbing — перемотка зажатием с live-подсчётом времени.
 *  5. Динамическая смена темы по порогам Сунны: Синий → Фиолетовый → Янтарный → Золотой.
 *  6. Кнопки скачка порога: → 33× / → 70× / → 100×.
 *  7. Haptic на каждом повторе. Прогресс и аудио — в IndexedDB (audioVault).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Mic, Square, RotateCcw, Repeat,
  ChevronRight, Info, Trash2, Volume2
} from 'lucide-react';
import { motionContainer, motionControl } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { useToast } from './Toast';
import {
  getStageInfo, getNextMilestone, getStageProgress, estimateTimeToNext, MILESTONE_STEPS,
} from '../services/spiritualMilestones';
import {
  getAudio, saveAudio, deleteAudio, getProgress, incrementRepeat, resetSession, setCustomTarget,
  type RepeatProgress,
} from '../services/audioVault';

/**
 * enhanceVoice — студийная автообработка записи голоса (Web Audio API):
 *  1. Highpass 85Hz — убирает гул/ rumble комнаты
 *  2. Пиковый компрессор — выравнивает громкость whisper↔normal
 *  3. Мягкая нормировка до -1dBFS — максимум качества без клиппинга
 * Возвращает новый Blob (webm/opus 192kbps).
 */
async function enhanceVoice(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 48000 });
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);

    // Оффлайн-рендер с эффект-цепочкой
    const offline = new OfflineAudioContext(
      1,
      decoded.length,
      decoded.sampleRate
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;

    // 1. Highpass: срез гула
    const highpass = offline.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 85;
    highpass.Q.value = 0.71;

    // 2. Компрессор (голосовой пресет)
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;

    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(offline.destination);
    source.start();

    const rendered = await offline.startRendering();

    // 3. Нормировка: находим пик, поднимаем до -1dBFS
    const data = rendered.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0) {
      const gain = 0.891 / peak; // -1dBFS
      const limited = Math.min(gain, 8); // не усиливать шум тишины более ×8
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.max(-1, Math.min(1, data[i] * limited));
      }
    }

    // Кодируем в WAV (универсальный формат для прослушивания)
    return encodeWav(rendered);
  } finally {
    audioCtx.close().catch(() => {});
  }
}

/** WAV-энкодер (PCM 16-bit) — максимальная совместимость и качество */
function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = 1;
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = data.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

interface AudioPracticePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ключ практики, напр. 'iman-1' */
  practiceId: string;
  /** Название практики/трансформации */
  title: string;
  /** Текст формулы для чтения вслух при записи */
  formulaText: string;
  language?: 'ru' | 'en';
}

type RecorderState = 'idle' | 'recording' | 'processing';

export const AudioPracticePlayer: React.FC<AudioPracticePlayerProps> = ({
  isOpen,
  onClose,
  practiceId,
  title,
  formulaText,
  language = 'ru',
}) => {
  // ── Состояние плеера ──
  const [progress, setProgress] = useState<RepeatProgress | null>(null);
  const toastRef = useRef(useToast());
  const [hasRecording, setHasRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoLoop, setAutoLoop] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [justReachedMilestone, setJustReachedMilestone] = useState(false);

  // ── Запись ──
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMilestoneRef = useRef<number>(0);

  // ── Загрузка сохранённых данных при открытии ──
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [audio, prog] = await Promise.all([
        getAudio(practiceId),
        getProgress(practiceId),
      ]);
      setHasRecording(Boolean(audio));
      setProgress(prog);
      if (prog) lastMilestoneRef.current = getNextMilestone(prog.currentCount - 1);
      if (audio) {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(audio.blob);
        setDuration(audio.durationSec || 0);
      }
    })();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [isOpen, practiceId]);

  // Подключение objectURL к audio-элементу после записи/загрузки
  useEffect(() => {
    const el = audioRef.current;
    if (el && objectUrlRef.current) {
      el.src = objectUrlRef.current;
      el.load();
    }
  }, [hasRecording]);

  // ── Очистка при закрытии ──
  useEffect(() => {
    if (isOpen) return;
    stopPlayback();
    stopRecording(false);
    setCurrentTime(0);
  }, [isOpen]);

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    if (loopPauseTimeoutRef.current) {
      clearTimeout(loopPauseTimeoutRef.current);
      loopPauseTimeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // ── Воспроизведение ──
  const startPlayback = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.playbackRate = playbackSpeed;
    try {
      await audioEl.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('[AudioPractice] play failed:', e);
    }
  }, [playbackSpeed]);

  const togglePlay = useCallback(() => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }, [isPlaying, stopPlayback, startPlayback]);

  // ── Повтор завершился: инкремент счётчика + пауза 500мс + новый круг ──
  const handleEnded = useCallback(async () => {
    if (!autoLoop) {
      setIsPlaying(false);
      return;
    }
    const next = await incrementRepeat(practiceId, progress?.targetCount ?? 15);
    setProgress(next);
    triggerHaptic();

    // Порог достигнут — празднуем
    const nextMilestone = getNextMilestone(next.currentCount - 1);
    if (next.currentCount >= nextMilestone && lastMilestoneRef.current < next.currentCount) {
      lastMilestoneRef.current = getNextMilestone(next.currentCount);
      setJustReachedMilestone(true);
      triggerStrongHaptic();
      setTimeout(() => setJustReachedMilestone(false), 3000);
    }

    // Пауза 500мс между повторами
    loopPauseTimeoutRef.current = setTimeout(() => {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
      }
    }, 500);
  }, [autoLoop, practiceId, progress?.targetCount]);

  // ── Запись голоса (высокое качество + автообработка) ──
  const startRecording = async () => {
    try {
      // Студийные ограничения: эхо-подавление, шумодав, 48kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        } as MediaTrackConstraints,
      });
      // Максимальное качество webm/opus для голоса: 192 kbps
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
      ];
      const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 192000,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        let blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        // Автообработка: highpass (срез гула <80Hz) + компрессор + нормировка
        try {
          blob = await enhanceVoice(blob);
        } catch (e) {
          console.warn('[AudioPractice] enhance failed, using raw:', e);
        }
        await saveAudio({
          id: practiceId,
          blob,
          durationSec: recordSeconds,
          createdAt: new Date().toISOString(),
          label: title,
        });
        // Создаём objectURL и подключаем к плееру
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(blob);
        setHasRecording(true);
        setDuration(recordSeconds);
        setRecorderState('idle');
        setRecordSeconds(0);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecorderState('recording');
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (e) {
      console.warn('[AudioPractice] mic denied:', e);
      toastRef.current?.warning(language === 'ru'
        ? 'Доступ к микрофону отклонён. Разрешите его в настройках браузера.'
        : 'Microphone access denied. Allow it in browser settings.');
      setRecorderState('idle');
    }
  };

  const stopRecording = (save: boolean = true) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      if (!save) rec.onstop = null;
      rec.stop();
    }
    if (!save) setRecorderState('idle');
  };

  // ── Scrubbing ──
  const handleScrubStart = () => setScrubbing(true);
  const handleScrub = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = ratio * duration;
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── Тема по стадиям ──
  const currentCount = progress?.currentCount ?? 0;
  const stage = getStageInfo(currentCount);
  const nextMilestone = getNextMilestone(currentCount);
  const stageProgress = getStageProgress(currentCount);
  const isCustomTarget = (progress?.targetCount ?? 15) < 15;
  const effectiveTarget = progress?.targetCount ?? 15;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={motionContainer}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Динамическая тема стадии — реальный морфинг цвета по порогам */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-500 rounded-3xl"
          style={{ background: stage.bgGradient }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-1 pointer-events-none transition-all duration-500"
          style={{ background: `linear-gradient(90deg, ${stage.color}00, ${stage.color}CC, ${stage.color}00)` }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-all duration-500"
                style={{ background: `${stage.color}22`, border: stage.borderStyle }}
              >
                {stage.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-textPrimary leading-tight truncate">{title}</h3>
                <span className="text-[10px] text-textSecondary">
                  {language === 'ru' ? 'Практика повторений (Shadowing)' : 'Repetition practice (Shadowing)'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Счётчик: current / target + следующий порог */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-4xl font-black tabular-nums leading-none transition-colors duration-500"
                  style={{ color: stage.color }}
                >
                  {currentCount}
                </span>
                <span className="text-lg font-black text-textSecondary opacity-60">/ {isCustomTarget ? effectiveTarget : nextMilestone}</span>
              </div>
              <span className="text-[10px] text-textSecondary">
                {progress?.totalLifetimeRepeats ?? 0} {language === 'ru' ? 'всего за всё время' : 'lifetime repeats'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-textSecondary">
                {language === 'ru' ? 'до следующего порога' : 'to next milestone'}
              </div>
              <div className="text-sm font-black tabular-nums" style={{ color: stage.color }}>
                {estimateTimeToNext(currentCount, duration || 30)}
              </div>
            </div>
          </div>

          {/* Лестница порогов 15 → 33 → 70 → 100 */}
          <div className="flex gap-1.5 mb-3">
            {MILESTONE_STEPS.map((ms, i) => {
              const reached = currentCount >= ms;
              return (
                <div key={ms} className="flex-1">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: reached ? stage.color : 'var(--surface-highlight)',
                      boxShadow: reached ? `0 0 8px ${stage.color}66` : undefined,
                    }}
                  />
                  <div
                    className={`text-[9px] font-black text-center mt-1 transition-colors duration-500 ${reached ? '' : 'opacity-40'}`}
                    style={{ color: reached ? stage.color : 'var(--text-secondary)' }}
                  >
                    {ms}×
                  </div>
                  {i < MILESTONE_STEPS.length - 1 && <div className="h-full" />}
                </div>
              );
            })}
          </div>

          {/* Текущая стадия */}
          <div
            className="p-3 rounded-2xl mb-3 transition-all duration-500"
            style={{ background: `${stage.color}12`, border: stage.borderStyle }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{stage.icon}</span>
              <span className="text-xs font-black" style={{ color: stage.color }}>{stage.title}</span>
            </div>
            <p className="text-[11px] text-textSecondary leading-relaxed mt-1">{stage.description}</p>
            <p className="text-[9px] text-textSecondary opacity-60 mt-1 italic">{stage.sunnahSource}</p>
            {/* Прогресс внутри этапа */}
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-highlight)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${stageProgress}%`, background: stage.color }}
              />
            </div>
          </div>

          {/* ── Зона записи (если нет записи) ── */}
          {!hasRecording && (
            <div className="text-center py-4">
              <p className="text-xs text-textSecondary leading-relaxed mb-4">
                {language === 'ru'
                  ? 'Запиши свой голос, читая формулу спокойно и с достоинством — один раз:'
                  : 'Record your voice reading the formula calmly, with dignity — once:'}
              </p>
              <div
                className="p-3 rounded-2xl bg-surfaceHighlight/40 border border-borderSubtle text-xs text-textPrimary leading-relaxed mb-4 max-h-32 overflow-y-auto"
                dir="auto"
              >
                {formulaText}
              </div>

              {recorderState === 'recording' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-red-500 font-black tabular-nums">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    {formatTime(recordSeconds)}
                  </div>
                  <button
                    onClick={() => stopRecording(true)}
                    className="px-6 py-3 rounded-2xl bg-red-500 text-white font-black shadow-lg flex items-center gap-2"
                  >
                    <Square size={16} />
                    {language === 'ru' ? 'Завершить запись' : 'Stop recording'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand to-purple-500 text-white font-black shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Mic size={16} />
                  {language === 'ru' ? 'Записать голос' : 'Record voice'}
                </button>
              )}
            </div>
          )}

          {/* ── Плеер (если есть запись) ── */}
          {hasRecording && (
            <>
              {/* Скрытый audio-элемент */}
              <audio
                ref={audioRef}
                onEnded={handleEnded}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => { if (!scrubbing) setCurrentTime(e.currentTarget.currentTime); }}
                preload="auto"
              />

              {/* Scrubbing-бар (YouTube-style) */}
              <div
                className="relative h-8 flex items-center cursor-pointer group mb-2 touch-none"
                onMouseDown={handleScrubStart}
                onMouseMove={(e) => { if (scrubbing) handleScrub(e); }}
                onMouseUp={() => setScrubbing(false)}
                onMouseLeave={() => setScrubbing(false)}
                onTouchStart={handleScrubStart}
                onTouchMove={handleScrub}
                onTouchEnd={() => setScrubbing(false)}
              >
                <div className="w-full h-1.5 rounded-full relative overflow-hidden" style={{ background: 'var(--surface-highlight)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-colors duration-500"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, background: stage.color }}
                  />
                </div>
                {/* Knob */}
                <div
                  className="absolute w-3.5 h-3.5 rounded-full shadow-md transition-transform"
                  style={{
                    left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 7px)`,
                    background: '#fff',
                    boxShadow: `0 0 8px ${stage.color}`,
                    transform: scrubbing ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-bold tabular-nums text-textSecondary mb-3">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Управление */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {/* Сброс сессии */}
                <button
                  onClick={async () => {
                    const reset = await resetSession(practiceId);
                    if (reset) setProgress(reset);
                    lastMilestoneRef.current = 0;
                  }}
                  className="w-10 h-10 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary flex items-center justify-center transition-colors"
                  title={language === 'ru' ? 'Сбросить счётчик сессии' : 'Reset session counter'}
                >
                  <RotateCcw size={15} />
                </button>

                {/* Play / Pause */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  transition={motionControl}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full text-white flex items-center justify-center shadow-xl"
                  style={{ background: stage.color, boxShadow: `0 4px 20px ${stage.color}66` }}
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 2 }} />}
                </motion.button>

                {/* Авто-повтор */}
                <button
                  onClick={() => { setAutoLoop(!autoLoop); triggerHaptic(); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    autoLoop ? 'text-white' : 'bg-surfaceHighlight text-textSecondary'
                  }`}
                  style={autoLoop ? { background: stage.color } : undefined}
                  title={language === 'ru' ? 'Авто-повтор (пауза 500мс)' : 'Auto-loop (500ms pause)'}
                >
                  <Repeat size={15} />
                </button>
              </div>

              {/* Скорость + кастомная цель + удалить запись */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex gap-1">
                  {[1, 1.25, 1.5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        if (audioRef.current) audioRef.current.playbackRate = speed;
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        playbackSpeed === speed ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      {speed}×
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[3, 7].map(target => (
                    <button
                      key={target}
                      onClick={async () => {
                        const p = await setCustomTarget(practiceId, target);
                        if (p) setProgress(p);
                        triggerHaptic();
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        (progress?.targetCount ?? 0) === target ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
                      }`}
                      title={language === 'ru' ? `Кастомная цель ${target}×` : `Custom target ${target}×`}
                    >
                      {target}×
                    </button>
                  ))}
                  <button
                    onClick={async () => {
                      if (audioRef.current) audioRef.current.pause();
                      await deleteAudio(practiceId);
                      setHasRecording(false);
                      setProgress(prev => prev ? { ...prev, currentCount: 0 } : prev);
                      setCurrentTime(0);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-surfaceHighlight text-textSecondary hover:text-red-500 transition-colors"
                    title={language === 'ru' ? 'Удалить запись и начать заново' : 'Delete recording and start over'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Кнопки скачка порога → 33× / → 70× / → 100× */}
              {!isCustomTarget && (
                <div className="flex gap-1.5">
                  {MILESTONE_STEPS.filter(ms => ms > currentCount && ms <= 100).map(ms => (
                    <button
                      key={ms}
                      onClick={async () => {
                        // Ручной досчёт до порога (для уже прожитых повторов офлайн)
                        let p = progress;
                        while (p && p.currentCount < ms) {
                          p = await incrementRepeat(practiceId, p.targetCount);
                        }
                        if (p) setProgress(p);
                        lastMilestoneRef.current = ms;
                        triggerStrongHaptic();
                      }}
                      className="flex-1 py-2 rounded-xl text-[11px] font-black transition-all"
                      style={{
                        background: `${getStageInfo(ms - 1).color}18`,
                        border: getStageInfo(ms - 1).borderStyle,
                        color: getStageInfo(ms - 1).color,
                      }}
                    >
                      → {ms}×
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Порог достигнут — праздничная вспышка */}
          <AnimatePresence>
            {justReachedMilestone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={motionCelebrate}
                className="absolute inset-0 rounded-3xl pointer-events-none flex items-center justify-center z-20"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-2">{stage.icon}</div>
                  <div className="text-lg font-black" style={{ color: stage.color }}>{stage.title}</div>
                  <div className="text-xs text-white/80 mt-1">{stage.description}</div>
                </div>
                <ChevronRight size={0} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AudioPracticePlayer;
