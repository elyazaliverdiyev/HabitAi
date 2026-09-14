import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Habit, getCurrentStreak } from '../types';

interface WeeklyProgressWidgetProps {
  habits: Habit[];
  language: 'ru' | 'en';
  accentColor: string;
}

const getDateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getDayLabel = (offset: number, language: 'ru' | 'en') => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const ru = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const en = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return language === 'ru' ? ru[d.getDay()] : en[d.getDay()];
};

const getDateNum = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.getDate();
};

const WeeklyProgressWidget: React.FC<WeeklyProgressWidgetProps> = ({
  habits,
  language,
  accentColor,
}) => {
  // Last 7 days data
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i; // 6 days ago → today
      const dateStr = getDateStr(offset);
      const done = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const total = habits.length;
      const pct = total > 0 ? done / total : 0;
      return {
        offset,
        dateStr,
        done,
        total,
        pct,
        dayLabel: getDayLabel(offset, language),
        dayNum: getDateNum(offset),
        isToday: offset === 0,
      };
    }), [habits, language]);

  const weekTotal = days.reduce((sum, d) => sum + d.done, 0);
  const weekMax = days.reduce((sum, d) => sum + d.total, 0);
  const weekPct = weekMax > 0 ? Math.round((weekTotal / weekMax) * 100) : 0;

  const bestStreak = useMemo(() =>
    Math.max(0, ...habits.map(h => getCurrentStreak(h))),
    [habits]);

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 20,
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(40px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
            {language === 'ru' ? 'Неделя' : 'This Week'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
            {weekTotal}/{weekMax} {language === 'ru' ? 'выполнено' : 'completed'}
          </div>
        </div>
        <div style={{
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          borderRadius: 8,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 800,
          color: accentColor,
        }}>
          {weekPct}%
        </div>
      </div>

      {/* Day columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        alignItems: 'end',
      }}>
        {days.map((day, i) => {
          const barHeight = Math.max(4, day.pct * 40);
          const color = day.pct >= 0.8 ? '#4ade80'
            : day.pct >= 0.5 ? accentColor
            : day.pct > 0 ? `${accentColor}66`
            : 'rgba(255,255,255,0.06)';

          return (
            <div key={day.dateStr} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              {/* Bar */}
              <div style={{
                width: '100%', height: 40,
                display: 'flex', alignItems: 'flex-end',
                justifyContent: 'center',
              }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    width: '100%',
                    borderRadius: 4,
                    background: day.isToday
                      ? `linear-gradient(to top, ${color}, ${color}bb)`
                      : color,
                    boxShadow: day.isToday && day.pct > 0
                      ? `0 0 8px ${color}66` : 'none',
                    minHeight: 4,
                  }}
                />
              </div>

              {/* Date number */}
              <div style={{
                fontSize: 11,
                fontWeight: day.isToday ? 800 : 500,
                color: day.isToday ? accentColor : 'var(--text-secondary)',
                lineHeight: 1,
              }}>
                {day.dayNum}
              </div>

              {/* Day label */}
              <div style={{
                fontSize: 9,
                fontWeight: 600,
                color: day.isToday ? accentColor : 'rgba(255,255,255,0.3)',
                lineHeight: 1,
              }}>
                {day.dayLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Best streak row */}
      {bestStreak > 0 && (
        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#f97316', fontWeight: 700,
          }}>
            🔥 {language === 'ru' ? `${bestStreak} дней лучший стрик` : `${bestStreak} day best streak`}
          </div>
          {weekPct >= 80 && (
            <div style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              color: '#4ade80',
              background: 'rgba(74,222,128,0.1)',
              padding: '2px 8px', borderRadius: 6,
            }}>
              {language === 'ru' ? '🌟 Отличная неделя!' : '🌟 Great week!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyProgressWidget;
