/**
 * HarveeDotMatrixCard — Матричный точечный календарь недели в стиле Harvee App (Patterns).
 */
import React from 'react';
import { Habit } from '../types';

interface HarveeDotMatrixCardProps {
  habits: Habit[];
  language?: 'ru' | 'en';
  accentColor?: string;
}

export const HarveeDotMatrixCard: React.FC<HarveeDotMatrixCardProps> = ({
  habits,
  language = 'ru',
  accentColor = '#3B82F6'
}) => {
  const days = language === 'ru'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Generate 7 days of current week (Mon to Sun)
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDayOfWeek);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${y}-${m}-${day}`,
      dayNum: d.getDate(),
      isToday: i === currentDayOfWeek,
      isFuture: i > currentDayOfWeek
    };
  });

  // Calculate stats
  const totalHabits = habits.length;
  let weekCompleted = 0;
  let weekScheduled = 0;

  weekDates.forEach((wd, i) => {
    if (!wd.isFuture) {
      weekScheduled += totalHabits;
      habits.forEach(h => {
        if (h.completedDates.includes(wd.dateStr)) {
          weekCompleted++;
        }
      });
    }
  });

  const weekPercent = weekScheduled > 0 ? Math.round((weekCompleted / weekScheduled) * 100) : 0;

  return (
    <div
      className="p-5 rounded-3xl mb-4 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-textSecondary uppercase block mb-0.5">
            {language === 'ru' ? 'Паттерны недели' : 'Weekly Patterns'}
          </span>
          <span className="text-base font-black text-textPrimary">
            {weekPercent}% {language === 'ru' ? 'выполнено' : 'completed'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[10px] text-textSecondary">{language === 'ru' ? '100%' : 'Done'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-[10px] text-textSecondary">{language === 'ru' ? 'Частично' : 'Part'}</span>
          </div>
        </div>
      </div>

      {/* Dot Matrix Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((wd, i) => {
          const completedCount = habits.filter(h => h.completedDates.includes(wd.dateStr)).length;
          const ratio = totalHabits > 0 ? completedCount / totalHabits : 0;

          // Color for dot
          let dotColor = 'var(--surface-highlight)';
          let glow = 'none';

          if (wd.isFuture) {
            dotColor = 'var(--border-subtle)';
          } else if (ratio >= 1) {
            dotColor = '#10B981';
            glow = '0 0 8px rgba(16, 185, 129, 0.4)';
          } else if (ratio > 0) {
            dotColor = '#3B82F6';
            glow = '0 0 6px rgba(59, 130, 246, 0.35)';
          } else {
            dotColor = 'var(--surface-highlight)';
          }

          return (
            <div
              key={wd.dateStr}
              className={`flex flex-col items-center py-2.5 rounded-2xl transition-all ${
                wd.isToday ? 'bg-surfaceHighlight/80 border border-brand/20 shadow-sm' : ''
              }`}
            >
              {/* Day Name */}
              <span className={`text-[10px] font-semibold mb-1 ${wd.isToday ? 'text-brand font-bold' : 'text-textSecondary'}`}>
                {days[i]}
              </span>

              {/* Glowing Dot */}
              <div
                className="w-3.5 h-3.5 rounded-full my-1 transition-all duration-300"
                style={{
                  background: dotColor,
                  boxShadow: glow,
                  border: wd.isFuture ? '1px dashed var(--border-subtle)' : 'none'
                }}
              />

              {/* Date Number */}
              <span
                className={`text-[11px] font-bold mt-1 tabular-nums ${
                  wd.isToday ? 'text-brand font-black' : 'text-textSecondary'
                }`}
              >
                {wd.dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HarveeDotMatrixCard;
