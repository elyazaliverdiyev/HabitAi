/**
 * ResistanceReleaseModal — Микро-интерфейс «Снять сопротивление за 60 секунд».
 *
 * Запускается вместо чувства вины, когда привычка пропущена 2-й день подряд
 * (Never Miss Twice). Проводит пользователя через экспресс-версию Стадии 2 и 3
 * из IntentionTransformationModal:
 *   • КАШФ (كَشْف) — обнаружение блока: где в теле напряжение + шкала 0–10
 *   • ТАХРИР (تَحرِير) — когнитивная дефузия: 10 повторений формулы отпускания
 * Финиш — микродействие на 60 секунд, сохраняющее серию.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Unlock, Check, Timer, HeartHandshake } from 'lucide-react';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { Habit } from '../types';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface ResistanceReleaseModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  /** Вызывается, когда пользователь завершил протокол (нажал «Сделать микрошаг») */
  onMicroStep: (habit: Habit) => void;
  language?: 'ru' | 'en';
}

const BODY_ZONES = [
  { id: 'chest', ru: 'Грудь', en: 'Chest' },
  { id: 'belly', ru: 'Живот', en: 'Belly' },
  { id: 'throat', ru: 'Горло', en: 'Throat' },
  { id: 'head', ru: 'Голова', en: 'Head' },
  { id: 'shoulders', ru: 'Плечи', en: 'Shoulders' },
];

export const ResistanceReleaseModal: React.FC<ResistanceReleaseModalProps> = ({
  isOpen,
  habit,
  onClose,
  onMicroStep,
  language = 'ru'
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Стадия КАШФ: соматика
  const [zone, setZone] = useState<string>('chest');
  const [intensity, setIntensity] = useState<number>(5);
  // Стадия ТАХРИР: счётчик отпусканий (цель — 10)
  const [releaseCount, setReleaseCount] = useState(0);

  // 60-секундный таймер обратного отсчёта всего протокола
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setZone('chest');
    setIntensity(5);
    setReleaseCount(0);
    setSecondsLeft(60);
  }, [isOpen, habit?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen || !habit) return null;

  const RELEASE_TARGET = 10;

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
        transition={motionControl}
        className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl p-5 shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              <HeartHandshake size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-textPrimary leading-tight">
                {language === 'ru' ? 'Снять сопротивление за 60 сек' : 'Release resistance in 60s'}
              </h3>
              <span className="text-[10px] text-textSecondary">
                «{habit.name}» · {language === 'ru' ? 'без вины, с заботой' : 'no guilt, with care'}
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

        {/* Таймер протокола */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-surfaceHighlight/60 border border-borderSubtle">
          <Timer size={14} className="text-indigo-400" />
          <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(secondsLeft / 60) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }}
            />
          </div>
          <span className="text-[11px] font-black tabular-nums text-indigo-400">{secondsLeft}s</span>
        </div>

        {/* ── Шаг 1: КАШФ — где в теле напряжение ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-indigo-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                {language === 'ru' ? 'Кашф · Обнаружение блока' : 'Kashf · Locate the block'}
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              {language === 'ru'
                ? 'Закрой глаза на мгновение. Где в теле живёт сопротивление к этой привычке? Просто заметь — без осуждения.'
                : 'Close your eyes for a moment. Where in your body does the resistance live? Just notice — no judgment.'}
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              {BODY_ZONES.map(z => (
                <button
                  key={z.id}
                  onClick={() => { setZone(z.id); triggerHaptic(); }}
                  className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    zone === z.id
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                      : 'bg-surface border-borderSubtle text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {language === 'ru' ? z.ru : z.en}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-textSecondary mb-1.5">
                <span>{language === 'ru' ? 'Интенсивность ощущения' : 'Intensity'}</span>
                <span className="text-indigo-400 tabular-nums">{intensity}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <button
              onClick={() => { setStep(2); triggerHaptic(); }}
              className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {language === 'ru' ? 'Да, я чувствую это — отпустить' : 'Yes, I feel it — release it'}
            </button>
          </div>
        )}

        {/* ── Шаг 2: ТАХРИР — формула отпускания ×10 ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn text-center">
            <div className="flex items-center gap-2 justify-center">
              <Unlock size={14} className="text-purple-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                {language === 'ru' ? 'Тахрир · Освобождение' : 'Tahrir · Release'}
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              {language === 'ru'
                ? 'Читай вслух и нажимай после каждого повтора:'
                : 'Read aloud and tap after each repetition:'}
            </p>

            <div className="p-4 rounded-2xl bg-purple-500/8 border border-purple-500/25">
              <p className="text-sm font-bold text-textPrimary leading-relaxed">
                {language === 'ru'
                  ? '«Мне можно было так думать… Да, мне можно было верить в эти мысли… но это были только мои мысли, и я отпускаю их»'
                  : '"I was allowed to think this… Yes, I was allowed to believe these thoughts… but they were only my thoughts, and I let them go"'}
              </p>
            </div>

            {/* Счётчик повторений */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setReleaseCount(c => Math.min(RELEASE_TARGET, c + 1));
                  triggerHaptic();
                }}
                disabled={releaseCount >= RELEASE_TARGET}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {language === 'ru' ? 'Отпустить' : 'Release'}
              </button>
              <div className="text-left">
                <div className="text-2xl font-black tabular-nums text-purple-400">
                  {releaseCount}<span className="text-sm text-textSecondary">/{RELEASE_TARGET}</span>
                </div>
                <div className="text-[9px] text-textSecondary uppercase tracking-wider">
                  {language === 'ru' ? 'повторов' : 'reps'}
                </div>
              </div>
            </div>

            {/* Точки прогресса */}
            <div className="flex justify-center gap-1">
              {Array.from({ length: RELEASE_TARGET }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i < releaseCount ? '#8b5cf6' : 'var(--surface-highlight)',
                    boxShadow: i < releaseCount ? '0 0 6px rgba(139,92,246,0.5)' : undefined,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => { setStep(3); triggerHaptic(); }}
              disabled={releaseCount < RELEASE_TARGET}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-white shadow-lg transition-all text-sm"
            >
              {releaseCount < RELEASE_TARGET
                ? (language === 'ru' ? `Ещё ${RELEASE_TARGET - releaseCount} повторов…` : `${RELEASE_TARGET - releaseCount} more…`)
                : (language === 'ru' ? 'Готово — стало легче →' : 'Done — feeling lighter →')}
            </button>
          </div>
        )}

        {/* ── Шаг 3: Микрошаг на 60 секунд ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-white shadow-lg">
              <Check size={26} strokeWidth={3} />
            </div>
            <h4 className="text-sm font-black text-textPrimary">
              {language === 'ru' ? 'Сопротивление снято. Один микрошаг — и серия жива.' : 'Resistance released. One micro-step — streak saved.'}
            </h4>
            <p className="text-xs text-textSecondary leading-relaxed">
              {language === 'ru'
                ? `Не нужно «наверстывать». Сделай самую маленькую версию «${habit.name}» прямо сейчас — 60 секунд достаточно, чтобы день был засчитан.`
                : `No need to catch up. Do the tiniest version of "${habit.name}" right now — 60 seconds counts.`}
            </p>

            <button
              onClick={() => {
                triggerStrongHaptic();
                onMicroStep(habit);
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Timer size={16} />
              {language === 'ru' ? 'Сделать микрошаг сейчас' : 'Do the micro-step now'}
            </button>
            <button
              onClick={onClose}
              className="text-[11px] text-textSecondary hover:text-textPrimary transition-colors"
            >
              {language === 'ru' ? 'Позже' : 'Later'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResistanceReleaseModal;
