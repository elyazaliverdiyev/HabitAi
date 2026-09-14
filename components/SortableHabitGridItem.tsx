
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Habit, getCurrencySymbol, getRarity, getCurrentStreak, shouldDoHabitOnDate } from '../types';
import Icon from './Icons';
import HabitGrid from './HabitGrid';
import StreakBadge from './StreakBadge';
import { Check, Plus, Flame, Clock, Banknote } from 'lucide-react';
import { translations } from '../translations';
import { getTimeStatus } from '../utils/helpers';
import { handle3DTiltMove, handle3DTiltLeave } from '../utils/motionPresets';

interface SortableHabitGridItemProps {
  habit: Habit;
  selectedDate: Date;
  isCompleted: boolean;
  onToggleDate: (e?: React.MouseEvent | React.TouchEvent) => void;
  onClick: () => void;
  language?: 'ru' | 'en';
  isCompact?: boolean;
  timeFocusMode?: boolean;
  currentTime?: string;
  isFocusedGoal?: boolean;
  justCompleted?: boolean;
}

const SortableHabitGridItemBase: React.FC<SortableHabitGridItemProps> = ({
  habit,
  isCompleted,
  onToggleDate,
  onClick,
  language = 'ru',
  isCompact = false,
  timeFocusMode = false,
  currentTime = '',
  isFocusedGoal = false,
  justCompleted = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const getScheduleLabel = () => {
    if (habit.frequency === 'specific_days' && habit.frequencyDays && habit.frequencyDays.length > 0) {
      const days = habit.frequencyDays.sort().map(d => {
        const map = language === 'ru'
          ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return map[d];
      });
      return days.join(', ');
    }

    if (habit.category) {
      const cats = translations[language].categories as Record<string, string>;
      return cats[habit.category] || habit.category;
    }

    return null;
  };

  const scheduleLabel = getScheduleLabel();
  const streak = getCurrentStreak(habit);

  // Helper: format Date → "YYYY-MM-DD"
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Smart mini-grid: last 5 RELEVANT days based on habit frequency
  const getLast5RelevantDays = () => {
    const days: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const freq = habit.frequency;

    // Monthly: show last 5 months (check if completed any day that month)
    if (freq === 'monthly') {
      for (let m = 0; days.length < 5; m++) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
        // Use last day of month as representative date
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const useDate = m === 0 ? today : lastDay;
        days.push(fmt(useDate));
        if (m > 24) break; // safety
      }
      return days.reverse();
    }

    // Weekly (no specific days): show last 5 weeks
    if (freq === 'weekly') {
      const dayOfWeek = today.getDay();
      for (let w = 0; days.length < 5; w++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (w * 7));
        days.push(fmt(d));
        if (w > 52) break; // safety
      }
      return days.reverse();
    }

    // Specific days or daily: walk backwards and collect relevant days
    let cursor = new Date(today);
    for (let i = 0; days.length < 5 && i < 60; i++) {
      if (shouldDoHabitOnDate(habit, cursor)) {
        days.push(fmt(cursor));
      }
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    return days.reverse();
  };

  // Check completion for monthly habits (any day in that month counts)
  const isCompletedForDate = (dateStr: string) => {
    if (habit.frequency === 'monthly') {
      const [year, month] = dateStr.split('-');
      return habit.completedDates.some(d => d.startsWith(`${year}-${month}`));
    }
    if (habit.frequency === 'weekly' && !(habit.frequency === 'specific_days')) {
      // For weekly, check if completed within ±3 days of that date
      const target = new Date(dateStr + 'T00:00:00');
      return habit.completedDates.some(d => {
        const completed = new Date(d + 'T00:00:00');
        const diff = Math.abs(target.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      });
    }
    return habit.completedDates.includes(dateStr);
  };

  // Calculate weekly progress (frequency-aware)
  const getWeeklyProgress = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    let completed = 0;
    let total = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      if (d <= today && shouldDoHabitOnDate(habit, d)) {
        total++;
        const dateStr = fmt(d);
        if (habit.completedDates.includes(dateStr)) {
          completed++;
        }
      }
    }

    // For weekly/monthly, if no days are "scheduled" this week, show based on completion
    if (total === 0 && (habit.frequency === 'weekly' || habit.frequency === 'monthly')) {
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        if (d <= today) weekDates.push(fmt(d));
      }
      const hasCompletion = habit.completedDates.some(d => weekDates.includes(d));
      return { completed: hasCompletion ? 1 : 0, total: 1, percent: hasCompletion ? 100 : 0 };
    }

    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Time-Based Focus Mode Status
  const getTimeStatus = (habitTime?: string, currTime?: string): 'now' | 'soon' | 'later' | null => {
    if (!habitTime || !currTime) return null;
    const [habitH, habitM] = habitTime.split(':').map(Number);
    const [currH, currM] = currTime.split(':').map(Number);
    const habitMinutes = habitH * 60 + habitM;
    const currentMinutes = currH * 60 + currM;
    const diff = habitMinutes - currentMinutes;
    if (diff >= -30 && diff <= 30) return 'now';
    if (diff > 30 && diff <= 90) return 'soon';
    return 'later';
  };

  const timeStatus = timeFocusMode ? getTimeStatus(habit.time, currentTime) : null;
  const isNow = timeStatus === 'now';
  const isNoise = timeFocusMode && !isNow && !isFocusedGoal && !isCompleted;

  // ==================== COMPACT APPLE HEALTH STYLE ====================
  const weekProgress = getWeeklyProgress();
  const last5Days = getLast5RelevantDays();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: (isNow || isFocusedGoal) ? 10 : (isDragging ? 50 : 'auto')
      }}
      {...attributes}
      {...listeners}
      className={`
        relative rounded-2xl p-4 border card-interactive group touch-manipulation
        transition-all duration-300 ease-out
        ${isCompleted
          ? 'bg-brand/5 border-brand/20 opacity-70'
          : isNow || isFocusedGoal
            ? 'bg-surface border-brand shadow-[0_4px_20px_rgba(var(--brand-rgb,99,102,241),0.15)] scale-[1.02]'
            : isNoise
              ? 'bg-surface border-borderSubtle opacity-30 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
              : 'bg-surface border-borderSubtle hover:shadow-md'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Left Icon — Apple SF Symbols style (single div) */}
        <div
          className={`w-12 h-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${isCompleted ? 'opacity-60' : ''}`}
          style={{
            borderRadius: '27%',
            background: `linear-gradient(160deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 50%), linear-gradient(145deg, ${habit.color}ee, ${habit.color}bb)`,
            boxShadow: `0 3px 10px ${habit.color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          <Icon name={habit.icon} size={22} className="text-white drop-shadow-sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className={`
            font-bold text-base truncate transition-colors
            ${isCompleted ? 'text-textSecondary line-through' : 'text-textPrimary group-hover:text-brand'}
          `}>
            {habit.name}
          </h3>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-textSecondary font-medium">
               {weekProgress.completed} / {weekProgress.total} {language === 'ru' ? 'на этой неделе' : 'this week'}
            </span>
            <StreakBadge habit={habit} size="xs" language={language} />
            {habit.time && (
              <span className="text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded font-bold">
                {habit.time}
              </span>
            )}
          </div>
        </div>

        {/* Action Button (Right Side) */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleDate(e); }}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
            ${isCompleted 
              ? 'bg-brand text-white shadow-md scale-105' 
              : 'bg-surfaceHighlight text-textSecondary hover:bg-brand/10 hover:text-brand'
            }
          `}
          style={isCompleted ? { backgroundColor: habit.color, boxShadow: `0 4px 12px ${habit.color}40` } : {}}
        >
          {isCompleted ? <Check size={20} strokeWidth={3} className="animate-scaleIn" /> : <Plus size={20} />}
        </button>
      </div>

      {/* Mini Progress Bar (Bottom Edge) */}
      <div className="absolute bottom-0 left-4 right-4 h-1 rounded-t-full bg-surfaceHighlight overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${weekProgress.percent}%`, 
            backgroundColor: habit.color,
            opacity: isCompleted ? 0.5 : 1
          }}
        />
      </div>
      
      {/* Labels */}
      {isNow ? (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-20 animate-pulse">
          {language === 'ru' ? 'СЕЙЧАС' : 'NOW'}
        </div>
      ) : isFocusedGoal && !isCompleted && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface border border-brand text-brand text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">
          {language === 'ru' ? 'СЛЕДУЮЩАЯ' : 'NEXT'}
        </div>
      )}
    </div>
  );
};

// React.memo to prevent unnecessary re-renders when other habits change
export const SortableHabitGridItem = React.memo(SortableHabitGridItemBase, (prev, next) => {
  return (
    prev.habit.id === next.habit.id &&
    prev.isCompleted === next.isCompleted &&
    prev.habit.completedDates.length === next.habit.completedDates.length &&
    prev.isFocusedGoal === next.isFocusedGoal &&
    prev.currentTime === next.currentTime &&
    prev.language === next.language &&
    prev.isCompact === next.isCompact &&
    prev.timeFocusMode === next.timeFocusMode
  );
});
