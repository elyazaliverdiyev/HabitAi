import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronsUpDown } from 'lucide-react';
import { Habit } from '../types';
import { translations } from '../translations';

export type CalendarStyleType = 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress';

interface CalendarWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  habits: Habit[];
  language?: 'ru' | 'en';
  calendarStyle?: CalendarStyleType;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  onSelectDate,
  habits,
  language = 'ru',
  calendarStyle = 'rings'
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const t = translations[language].calendar;
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const daysToRender = useMemo(() => {
    const days: Date[] = [];
    if (viewMode === 'month') {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();

      let startDayOfWeek = firstDayOfMonth.getDay();
      startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        days.push(d);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }

      const remainingSlots = 7 - (days.length % 7);
      if (remainingSlots < 7) {
        for (let i = 1; i <= remainingSlots; i++) {
          days.push(new Date(year, month + 1, i));
        }
      }
    } else {
      const startOfWeek = getStartOfWeek(viewDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
    }
    return days;
  }, [viewDate, viewMode]);

  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setViewDate(newDate);
  };

  const getDayStats = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const completed: Habit[] = [];
    const pending: Habit[] = [];

    habits.forEach(h => {
      if (h.completedDates.includes(dateStr)) {
        completed.push(h);
      } else {
        pending.push(h);
      }
    });

    const total = habits.length;
    const completedCount = completed.length;
    const ratio = total > 0 ? completedCount / total : 0;

    return {
      completed,
      pending,
      completedCount,
      total,
      hasActivity: completedCount > 0,
      ratio,
      percentage: Math.round(ratio * 100)
    };
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === viewDate.getMonth();
  };

  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return viewDate.toLocaleString(locale, { month: 'long', year: 'numeric' });
    } else {
      const start = getStartOfWeek(viewDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      if (start.getMonth() === end.getMonth()) {
        return start.toLocaleString(locale, { month: 'long', year: 'numeric' });
      } else {
        const startMonth = start.toLocaleString(locale, { month: 'short' });
        const endMonth = end.toLocaleString(locale, { month: 'short' });
        return `${startMonth} - ${endMonth} ${end.getFullYear()}`;
      }
    }
  }, [viewDate, viewMode, locale]);

  const weekdayHeaders = useMemo(() => {
    if (language === 'ru') return ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  }, [language]);

  // Get heatmap color based on percentage
  const getHeatmapColor = (percentage: number) => {
    if (percentage === 0) return 'bg-surfaceHighlight/30';
    if (percentage < 25) return 'bg-emerald-500/20';
    if (percentage < 50) return 'bg-emerald-500/40';
    if (percentage < 75) return 'bg-emerald-500/60';
    if (percentage < 100) return 'bg-emerald-500/80';
    return 'bg-emerald-500';
  };

  // Get emoji based on percentage
  const getEmoji = (percentage: number) => {
    if (percentage === 0) return '😴';
    if (percentage < 25) return '😕';
    if (percentage < 50) return '😐';
    if (percentage < 75) return '😊';
    if (percentage < 100) return '🔥';
    return '👑';
  };

  // Render day cell based on style
  const renderDayContent = (date: Date, stats: ReturnType<typeof getDayStats>, selected: boolean, today: boolean, currentMonth: boolean) => {
    const size = viewMode === 'week' ? 36 : 28;

    switch (calendarStyle) {
      case 'heatmap':
        return (
          <div className={`
            w-full h-full flex items-center justify-center rounded-lg
            ${!selected ? getHeatmapColor(stats.percentage) : ''}
            ${stats.percentage === 100 && !selected ? 'ring-2 ring-emerald-400/50' : ''}
          `}>
            <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
              {date.getDate()}
            </span>
          </div>
        );

      case 'rings':
        const ringPercent = stats.percentage;
        const ringSize = viewMode === 'week' ? 24 : 18;
        const ringRadius = (ringSize / 2) - 2;
        const circumference = 2 * Math.PI * ringRadius;
        const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
              {date.getDate()}
            </span>
            {currentMonth && stats.total > 0 && !selected && (
              <svg width={ringSize} height={ringSize} className="shrink-0">
                {/* Background ring */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-surfaceHighlight"
                />
                {/* Progress ring */}
                {stats.hasActivity && (
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke={stats.percentage === 100 ? '#22c55e' : 'var(--brand)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    style={{
                      filter: stats.percentage === 100 ? 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.6))' : undefined
                    }}
                  />
                )}
                {/* Center dot for 100% */}
                {stats.percentage === 100 && (
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r="2"
                    fill="#22c55e"
                  />
                )}
              </svg>
            )}
          </div>
        );

      case 'dots':
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
              {date.getDate()}
            </span>
            {currentMonth && stats.hasActivity && !selected && (
              <div className="flex gap-0.5">
                {stats.completed.slice(0, 3).map((habit, i) => (
                  <div
                    key={habit.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                ))}
                {stats.completedCount > 3 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-textSecondary/30" />
                )}
              </div>
            )}
            {currentMonth && stats.percentage === 100 && !selected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>
            )}
          </div>
        );

      case 'emoji':
        return (
          <div className="flex flex-col items-center">
            <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
              {date.getDate()}
            </span>
            {currentMonth && !selected && stats.total > 0 && (
              <span className="text-xs mt-0.5">{getEmoji(stats.percentage)}</span>
            )}
          </div>
        );

      case 'progress':
        return (
          <div className="flex flex-col items-center w-full px-1">
            <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
              {date.getDate()}
            </span>
            {currentMonth && stats.total > 0 && !selected && (
              <div className="w-full mt-1.5 h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stats.percentage === 100 ? 'bg-emerald-500' : stats.percentage > 0 ? 'bg-brand' : ''}`}
                  style={{
                    width: `${Math.max(stats.percentage, stats.percentage > 0 ? 10 : 0)}%`,
                    boxShadow: stats.percentage === 100 ? '0 0 6px rgba(34, 197, 94, 0.6)' : undefined
                  }}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <span className={`text-sm font-semibold ${today && !selected ? 'text-brand' : ''}`}>
            {date.getDate()}
          </span>
        );
    }
  };

  return (
    <div className="section-card p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-textPrimary capitalize text-base">
          {headerTitle}
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surfaceHighlight/50 hover:bg-surfaceHighlight text-xs font-medium text-textSecondary hover:text-textPrimary transition-colors"
          >
            <CalendarIcon size={12} />
            <span>{viewMode === 'month' ? t.month : t.week}</span>
            <ChevronsUpDown size={10} className="opacity-40" />
          </button>

          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekdayHeaders.map((d, i) => (
          <div
            key={d}
            className={`text-[10px] font-bold uppercase text-center py-1 ${i >= 5 ? 'text-brand/60' : 'text-textSecondary/70'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysToRender.map((date, idx) => {
          const stats = getDayStats(date);
          const today = isToday(date);
          const selected = isSelected(date);
          const currentMonth = viewMode === 'week' || isCurrentMonth(date);

          return (
            <button
              key={`${date.toISOString()}-${idx}`}
              onClick={() => onSelectDate(date)}
              className={`
                relative flex flex-col items-center justify-center rounded-lg transition-all duration-200 group overflow-hidden
                ${viewMode === 'month' ? 'h-12 py-1' : 'h-16 py-2'}
                ${selected
                  ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105'
                  : currentMonth
                    ? 'text-textPrimary hover:bg-surfaceHighlight hover:-translate-y-0.5 hover:shadow-sm'
                    : 'text-textSecondary/25'
                }
                ${today && !selected ? 'ring-2 ring-brand/40' : ''}
              `}
            >
              {renderDayContent(date, stats, selected, today, currentMonth)}

              {/* Tooltip on hover */}
              {currentMonth && stats.total > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  {stats.completedCount}/{stats.total} ({stats.percentage}%)
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats Summary */}
      {habits.length > 0 && (
        <div className="mt-3 pt-3 border-t border-borderSubtle flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-textSecondary">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand" />
              <span>{language === 'ru' ? 'Частично' : 'Partial'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-surfaceHighlight" />
              <span>0%</span>
            </div>
          </div>
          <div className="text-xs text-textSecondary">
            {habits.length} {language === 'ru' ? 'привычек' : 'habits'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
