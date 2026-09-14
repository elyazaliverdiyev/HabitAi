/**
 * FocusNowCard — «Что сейчас»: одна главная задача в её окне.
 *
 * Против паралича потока: вместо кучи карточек пользователь видит
 * ОДНО действие с причиной и деталями. Принцип Возняка/Тиля:
 * суженное окно времени меняет мышление.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Check, Clock, Sparkles } from 'lucide-react';
import { motionContainer } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { getCurrentFocus, type FocusTarget } from '../services/focusWindow';
import { getLocalDateString } from '../utils/helpers';
import type { Habit } from '../types';

interface FocusNowCardProps {
  habits: Habit[];
  language: 'ru' | 'en';
  /** Отметить выполнение */
  onComplete: (habitId: string) => void;
  /** Открыть детали */
  onOpenHabit: (habit: Habit) => void;
}

export const FocusNowCard: React.FC<FocusNowCardProps> = ({
  habits,
  language,
  onComplete,
  onOpenHabit,
}) => {
  const todayStr = getLocalDateString();
  const focus = React.useMemo(() => getCurrentFocus(habits), [habits]);

  if (!focus) {
    // Всё выполнено — тихая радость
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionContainer}
        className="rounded-3xl mb-3 p-5 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(5,150,105,0.05) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
        }}
      >
        <Check size={22} strokeWidth={3} className="text-emerald-500 mx-auto mb-1.5" />
        <p className="text-sm font-black text-emerald-600">
          {language === 'ru' ? 'Всё выполнено на сегодня' : 'All done for today'}
        </p>
        <p className="text-[11px] text-textSecondary mt-0.5">
          {language === 'ru' ? 'Альхамдулиллях — день закрыт чисто' : 'Alhamdulillah — a clean day'}
        </p>
      </motion.div>
    );
  }

  const h = focus.habit;
  const details: string[] = [];
  if (h.time) details.push(h.time);
  if (h.duration) details.push(language === 'ru' ? `${h.duration} мин` : `${h.duration} min`);
  if (h.targetCount && h.targetCount > 1) details.push(`${h.targetCount}${h.dailyUnit ? ` ${h.dailyUnit}` : ''}`);
  if (h.place) details.push(h.place);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionContainer}
      className="rounded-3xl mb-3 relative overflow-hidden breathe-glow"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.07) 100%)',
        border: '1px solid rgba(99,102,241,0.30)',
      }}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 pt-3.5">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/90 flex items-center gap-1.5">
          <Crosshair size={11} />
          {language === 'ru' ? 'Что сейчас' : 'Right now'}
        </span>
        {focus.windowEndsAt && (
          <span className="text-[9px] font-bold text-indigo-400/70 flex items-center gap-1 tabular-nums">
            <Clock size={9} />
            {language === 'ru' ? 'до' : 'until'} {focus.windowEndsAt}
          </span>
        )}
      </div>

      {/* Главная задача */}
      <div className="px-4 pb-4 pt-2.5">
        <AnimatePresence mode="wait">
          <motion.button
            key={h.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onOpenHabit(h); triggerHaptic(); }}
            className="w-full text-left group"
          >
            <h3 className="text-lg font-black text-textPrimary leading-tight group-active:opacity-70 transition-opacity">
              {h.name}
            </h3>
            {details.length > 0 && (
              <p className="text-[11px] text-textSecondary font-semibold mt-0.5 tabular-nums">
                {details.join(' · ')}
              </p>
            )}
            <p className="text-[11px] text-indigo-400/90 mt-1.5 italic leading-relaxed">
              {language === 'ru' ? focus.reasonRu : focus.reasonEn}
            </p>
          </motion.button>
        </AnimatePresence>

        {/* Выполнить сейчас */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { triggerStrongHaptic(); onComplete(h.id); }}
            className="flex-1 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={14} strokeWidth={3} />
            {language === 'ru' ? 'Выполнено' : 'Done'}
          </button>
          {h.time && (
            <button
              onClick={() => { onOpenHabit(h); triggerHaptic(); }}
              className="px-4 py-3 rounded-2xl bg-surfaceHighlight/70 hover:bg-surfaceHighlight text-textPrimary font-bold text-xs transition-all"
              title={language === 'ru' ? 'Подробности' : 'Details'}
            >
              <Sparkles size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FocusNowCard;
