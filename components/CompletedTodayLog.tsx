/**
 * CompletedTodayLog — «Выполнено сегодня»: лента с точным временем.
 *
 * Каждая выполненная сегодня задача/привычка с датой И временем
 * (из completionLog) — как в «Моих Задачах» нативных приложений.
 * Мотивационный эффект: видимый след дня.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock } from 'lucide-react';
import { motionContainer } from '../utils/motionPresets';
import { getLocalDateString } from '../utils/helpers';
import type { Habit } from '../types';

interface CompletedTodayLogProps {
  habits: Habit[];
  language: 'ru' | 'en';
  onOpenHabit?: (h: Habit) => void;
}

const formatTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '—';
  }
};

export const CompletedTodayLog: React.FC<CompletedTodayLogProps> = ({
  habits,
  language,
  onOpenHabit,
}) => {
  const todayStr = getLocalDateString();

  const completed = habits
    .filter(h => !h.archived && h.completedDates.includes(todayStr))
    .map(h => ({
      habit: h,
      time: h.completionLog?.[todayStr],
    }))
    // Выполненные позже — выше (живая лента дня)
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    .slice(0, 6); // компактность: до 6 записей

  if (completed.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionContainer}
      className="rounded-3xl mb-3 p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(16,185,129,0.18)',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/80">
          {language === 'ru' ? `Выполнено сегодня · ${completed.length}` : `Done today · ${completed.length}`}
        </span>
        <CheckCircle2 size={12} className="text-emerald-500/60" />
      </div>

      <div className="space-y-1">
        {completed.map(({ habit, time }) => (
          <button
            key={habit.id}
            onClick={() => onOpenHabit?.(habit)}
            className="w-full flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-xl hover:bg-surfaceHighlight/40 transition-colors text-left"
          >
            <span className="flex items-center gap-1 text-[10px] font-black tabular-nums text-emerald-500 w-11 shrink-0">
              <Clock size={9} />
              {time ? formatTime(time) : '✓'}
            </span>
            <span className="text-xs font-bold text-textPrimary truncate flex-1">
              {habit.name}
            </span>
            {habit.type === 'task' && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-surfaceHighlight text-textSecondary shrink-0">
                {language === 'ru' ? 'задача' : 'task'}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default CompletedTodayLog;
