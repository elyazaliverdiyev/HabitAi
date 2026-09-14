/**
 * DhikrCounter — Зикр-счётчик (электронный тасбих) в Apple-стиле.
 *
 * Постпрандиальный тасбих Пророка ﷺ: СубханАллах ×33 → Альхамдулиллях ×33 →
 * Аллаху Акбар ×34 (иногда 33+ завершение «Ля иляха илля Аллах»).
 * Также: режимы Астигфар ×100 (Сунна 70×/100×) и свободный зикр.
 *
 * UX: большой тап-круг (вся площадь — кнопка, удобно большим пальцем),
 * хаптика на каждом счёте, мягкий «клик»-звук, завершение круга —
 * праздникуется, автопереход к следующему зикру. Прогресс дня
 * сохраняется в localStorage.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Volume2, VolumeX, Check } from 'lucide-react';
import { motionControl, motionCelebrate } from '../utils/motionPresets';
import { triggerHaptic, playSound } from '../utils/sound';

interface DhikrStep {
  arabic: string;
  translit: string;
  /** число повторений в этом шаге */
  count: number;
  color: string;
}

/** Классический тасбих после молитвы */
const TASBIH_SEQUENCE: DhikrStep[] = [
  { arabic: 'سُبْحَانَ اللَّه', translit: 'СубханАллах', count: 33, color: '#10b981' },
  { arabic: 'الْحَمْدُ لِلَّه', translit: 'Альхамдулиллях', count: 33, color: '#f59e0b' },
  { arabic: 'اللَّهُ أَكْبَر', translit: 'Аллаху Акбар', count: 34, color: '#8b5cf6' },
];

/** Астигфар — Сунна 100× в день */
const ISTIGHFAR_SEQUENCE: DhikrStep[] = [
  { arabic: 'أَسْتَغْفِرُ اللَّه', translit: 'АстагфируЛлах', count: 100, color: '#3b82f6' },
];

const STORAGE_KEY = 'habitai_dhikr_progress';
const SETTINGS_KEY = 'habitai_dhikr_settings';

interface DhikrDayProgress {
  date: string;           // YYYY-MM-DD
  completedCircles: number; // завершённых полных кругов тасбиха
  istighfarCount: number;  // астигфаров за день
  freeCount: number;       // свободный зикр
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadDay(): DhikrDayProgress {
  if (typeof window === 'undefined') return { date: todayStr(), completedCircles: 0, istighfarCount: 0, freeCount: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DhikrDayProgress;
      if (parsed.date === todayStr()) return parsed;
    }
  } catch { /* ignore */ }
  return { date: todayStr(), completedCircles: 0, istighfarCount: 0, freeCount: 0 };
}

function saveDay(p: DhikrDayProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

interface DhikrCounterProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
}

type Mode = 'tasbih' | 'istighfar' | 'free';

export const DhikrCounter: React.FC<DhikrCounterProps> = ({
  isOpen,
  onClose,
  language = 'ru',
}) => {
  const [mode, setMode] = useState<Mode>('tasbih');
  const [stepIdx, setStepIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [dayProgress, setDayProgress] = useState<DhikrDayProgress>(loadDay);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SETTINGS_KEY + '_sound') !== 'off');
  const [celebrate, setCelebrate] = useState(false);
  const circleJustCompleted = useRef(false);

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setDayProgress(loadDay());
    }
  }, [isOpen]);

  const steps = mode === 'tasbih' ? TASBIH_SEQUENCE : mode === 'istighfar' ? ISTIGHFAR_SEQUENCE : null;
  const currentStep = steps ? steps[stepIdx] : null;
  const target = currentStep ? currentStep.count : 0;

  const switchMode = (m: Mode) => {
    setMode(m);
    setStepIdx(0);
    setCount(0);
    triggerHaptic();
  };

  const handleTap = useCallback(() => {
    if (!currentStep) {
      // Свободный режим
      triggerHaptic();
      if (soundOn) playSound('click');
      setDayProgress(p => {
        const next = { ...p, freeCount: p.freeCount + 1 };
        saveDay(next);
        return next;
      });
      return;
    }

    const nextCount = count + 1;
    triggerHaptic();
    if (soundOn) playSound('click');

    if (nextCount >= target) {
      // Шаг завершён
      setCount(target);
      const isLastStep = stepIdx >= (steps as DhikrStep[]).length - 1;

      if (isLastStep) {
        // Полный круг завершён!
        triggerHaptic('heavy');
        if (soundOn) playSound('celebration');
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2200);
        setDayProgress(p => {
          const next = mode === 'istighfar'
            ? { ...p, istighfarCount: p.istighfarCount + (steps as DhikrStep[])[0].count }
            : { ...p, completedCircles: p.completedCircles + 1 };
          saveDay(next);
          return next;
        });
        circleJustCompleted.current = true;
        setTimeout(() => {
          setStepIdx(0);
          setCount(0);
          circleJustCompleted.current = false;
        }, 1200);
      } else {
        // Переход к следующему зикру круга
        triggerHaptic('medium');
        if (soundOn) playSound('success');
        setTimeout(() => {
          setStepIdx(i => i + 1);
          setCount(0);
        }, 700);
        setCount(target); // показать полный до перехода
      }
    } else {
      setCount(nextCount);
      // Каждые 11 — чуть сильнее хаптика (ориентир в кармане)
      if (nextCount % 11 === 0) triggerHaptic('medium');
    }
  }, [count, currentStep, stepIdx, steps, target, soundOn, mode]);

  if (!isOpen) return null;

  const progressPercent = target > 0 ? (count / target) * 100 : (dayProgress.freeCount % 100);
  const circlesDone = dayProgress.completedCircles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={motionControl}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="text-lg leading-none" style={{ fontFamily: "'Amiri', serif", color: '#10b981' }}>﷽</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-textPrimary leading-tight">
                {language === 'ru' ? 'Зикр-счётчик' : 'Dhikr Counter'}
              </h3>
              <span className="text-[10px] text-textSecondary">
                {language === 'ru' ? '«Поминайте Аллаха много» (33:41)' : '"Remember Allah often" (33:41)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                localStorage.setItem(SETTINGS_KEY + '_sound', next ? 'on' : 'off');
              }}
              className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
              title={language === 'ru' ? 'Звук счёта' : 'Count sound'}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Сегменты режимов */}
        <div className="flex bg-surfaceHighlight rounded-xl p-1 gap-1 mb-5">
          {([
            { id: 'tasbih', label: language === 'ru' ? 'Тасбих 33×' : 'Tasbih 33×' },
            { id: 'istighfar', label: language === 'ru' ? 'Астигфар ×100' : 'Istighfar ×100' },
            { id: 'free', label: language === 'ru' ? 'Свободный' : 'Free' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id as Mode)}
              className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-bold transition-all ${
                mode === m.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── ТАП-КРУГ ── */}
        <div className="flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={motionControl}
            onClick={handleTap}
            disabled={circleJustCompleted.current}
            className="relative w-64 h-64 rounded-full flex flex-col items-center justify-center select-none touch-none active:cursor-pointer cursor-pointer"
            style={{
              background: currentStep
                ? `radial-gradient(circle at 50% 35%, ${currentStep.color}22 0%, ${currentStep.color}08 60%, transparent 100%)`
                : 'radial-gradient(circle at 50% 35%, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 60%, transparent 100%)',
              border: `2px solid ${currentStep ? currentStep.color + '55' : 'rgba(59,130,246,0.3)'}`,
              boxShadow: `0 0 40px ${currentStep ? currentStep.color + '18' : 'rgba(59,130,246,0.1)'}, inset 0 0 30px rgba(0,0,0,0.15)`,
            }}
            aria-label={language === 'ru' ? 'Считать' : 'Count'}
          >
            {/* Круговой прогресс */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="47" fill="none" stroke="transparent" strokeWidth="1.5" />
              <circle
                cx="50" cy="50" r="47" fill="none"
                stroke={currentStep ? currentStep.color : '#3b82f6'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 295.3} 295.3`}
                style={{ transition: 'stroke-dasharray 0.15s ease-out' }}
                opacity="0.85"
              />
            </svg>

            {currentStep ? (
              <>
                <span
                  className="text-3xl mb-2 leading-none"
                  style={{ fontFamily: "'Amiri', serif", color: currentStep.color }}
                  dir="rtl"
                >
                  {currentStep.arabic}
                </span>
                <span className="text-sm font-black text-textPrimary mb-3">{currentStep.translit}</span>
                <span className="text-5xl font-black tabular-nums leading-none" style={{ color: currentStep.color }}>
                  {count}
                </span>
                <span className="text-xs font-bold text-textSecondary mt-1">/ {target}</span>
                {mode === 'tasbih' && (
                  <span className="text-[10px] text-textSecondary opacity-60 mt-2">
                    {language === 'ru' ? 'шаг' : 'step'} {stepIdx + 1} {language === 'ru' ? 'из' : 'of'} {(steps as DhikrStep[]).length}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-4xl font-black tabular-nums text-blue-400 leading-none">{dayProgress.freeCount}</span>
                <span className="text-[11px] text-textSecondary mt-2 text-center px-6 leading-relaxed">
                  {language === 'ru'
                    ? 'Любой зикр: салават, тахлиль, хаукуля… Тап — счёт.'
                    : 'Any dhikr: salawat, tahlil… Tap to count.'}
                </span>
              </>
            )}
          </motion.button>

          {/* Сброс шага */}
          {count > 0 && !circleJustCompleted.current && (
            <button
              onClick={() => { setCount(0); triggerHaptic(); }}
              className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-textSecondary hover:text-red-500 transition-colors"
            >
              <RotateCcw size={12} />
              {language === 'ru' ? 'Сбросить шаг' : 'Reset step'}
            </button>
          )}
        </div>

        {/* Итог дня */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle text-center">
            <div className="text-xl font-black tabular-nums text-emerald-500">{circlesDone}</div>
            <div className="text-[9px] font-bold text-textSecondary leading-tight mt-0.5">
              {language === 'ru' ? 'кругов тасбиха' : 'tasbih circles'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle text-center">
            <div className="text-xl font-black tabular-nums text-blue-500">{dayProgress.istighfarCount}</div>
            <div className="text-[9px] font-bold text-textSecondary leading-tight mt-0.5">
              {language === 'ru' ? 'астигфаров' : 'istighfar'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle text-center">
            <div className="text-xl font-black tabular-nums text-purple-500">{dayProgress.freeCount}</div>
            <div className="text-[9px] font-bold text-textSecondary leading-tight mt-0.5">
              {language === 'ru' ? 'свободных' : 'free dhikr'}
            </div>
          </div>
        </div>

        {/* Празднование завершённого круга */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={motionCelebrate}
              className="absolute inset-0 rounded-3xl pointer-events-none flex items-center justify-center z-20"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              <div className="text-center px-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...motionCelebrate, delay: 0.1 }}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 text-white shadow-xl"
                >
                  <Check size={30} strokeWidth={3} />
                </motion.div>
                <div className="text-lg font-black text-white mb-1">
                  {language === 'ru' ? 'Круг завершён — Такбир!' : 'Circle complete — Takbir!'}
                </div>
                <div className="text-xs text-white/70">
                  {language === 'ru' ? '«Кто скажет после каждой молитвы… тому простятся грехи» (Муслим)' : '"Whoever says after each prayer… his sins are forgiven" (Muslim)'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DhikrCounter;
