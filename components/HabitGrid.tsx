
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Habit } from '../types';
import { translations } from '../translations';

interface HabitGridProps {
  habit: Habit;
  onToggleDate?: (date: string) => void;
  readOnly?: boolean;
  language?: 'ru' | 'en';
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitGrid: React.FC<HabitGridProps> = ({ habit, onToggleDate, readOnly = false, language = 'ru' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeksToShow, setWeeksToShow] = useState<number>(20); // Default start

  // Track which dates are currently animating (popping)
  const [animatingDates, setAnimatingDates] = useState<Set<string>>(new Set());

  const t = translations[language].calendar; // Reuse calendar translation or app

  // Adapt weeks to show based on container width
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWeeks = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      // Each column is w-3 (12px) + gap-[3px] (3px) = 15px.
      // We leave a tiny buffer to avoid edge clipping.
      const possibleWeeks = Math.floor(width / 15);
      setWeeksToShow(Math.max(4, possibleWeeks)); // Ensure at least 4 weeks
    };

    // Initial check
    updateWeeks();

    const observer = new ResizeObserver(() => {
      updateWeeks();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const gridData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the Sunday of the current week (end of our grid)
    const currentDay = today.getDay(); // 0 is Sunday
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

    // Last date in the grid (can be in future to complete the column)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - daysSinceMonday)); // This coming Sunday

    // Calculate start date based on dynamic weeksToShow
    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - (weeksToShow * 7) + 1);

    const dates = [];
    let current = new Date(startDate);

    while (current <= endOfWeek) {
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [weeksToShow]); // Recalculate when weeksToShow changes

  // Progress Calculation
  const progress = useMemo(() => {
    const now = new Date();
    const freq = habit.frequency || 'daily';
    let completed = 0;
    let target = 0;
    let periodName = language === 'ru' ? 'Неделя' : 'Week';

    if (freq === 'monthly') {
      const year = now.getFullYear();
      const month = now.getMonth();
      // Check completions in current month
      // Format YYYY-MM to match ISO strings prefix
      const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

      completed = habit.completedDates.filter(d => d.startsWith(currentMonthPrefix)).length;
      target = habit.targetCount || 1;
      periodName = language === 'ru' ? 'Месяц' : 'Month';
    } else {
      // Weekly scope (Daily, Weekly, Specific Days)
      // Calculate Monday of current week
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      // Calculate Next Monday to define range [Monday, Next Monday)
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      completed = habit.completedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= monday && date < nextMonday;
      }).length;

      if (freq === 'daily') target = 7;
      else if (freq === 'specific_days') target = (habit.frequencyDays || []).length;
      else if (freq === 'weekly') target = habit.targetCount || 1;
    }

    if (target === 0) target = 1;
    const percent = Math.min(100, Math.round((completed / target) * 100));

    return { completed, target, percent, periodName };
  }, [habit, language]);

  const handleInteraction = (dateStr: string, e: React.MouseEvent) => {
    // Basic checks
    const dateObj = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFuture = dateObj > today;

    if (readOnly || isFuture) return;

    e.preventDefault();
    e.stopPropagation();

    // Trigger Animation State
    setAnimatingDates(prev => {
      const next = new Set(prev);
      next.add(dateStr);
      return next;
    });

    // Perform actual toggle
    onToggleDate?.(dateStr);

    // Remove animation state after transition completes to allow reset
    setTimeout(() => {
      setAnimatingDates(prev => {
        const next = new Set(prev);
        next.delete(dateStr);
        return next;
      });
    }, 300);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      {/* Heatmap Grid Wrapper - Adaptive */}
      <div ref={containerRef} className="w-full">
        <div
          className="grid grid-rows-7 grid-flow-col gap-[3px] auto-cols-max"
          // Ensure the grid doesn't force overflow if calculation is off by 1px
          style={{ width: 'fit-content' }}
        >
          {gridData.map((dateStr) => {
            const isCompleted = habit.completedDates.includes(dateStr);
            const dateObj = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isFuture = dateObj > today;
            const isAnimating = animatingDates.has(dateStr);

            return (
              <div
                key={dateStr}
                onClick={(e) => handleInteraction(dateStr, e)}
                title={dateStr}
                style={{
                  // Only apply color if completed, otherwise use class-based gray
                  backgroundColor: isCompleted ? habit.color : undefined,
                }}
                className={`
                    w-3 h-3 rounded-[2px] shrink-0
                    ${isFuture ? 'invisible' : ''}
                    ${!readOnly && !isFuture ? 'cursor-pointer' : ''}
                    
                    /* Base Appearance - GitHub Style */
                    ${isCompleted
                    ? 'opacity-100 shadow-sm'
                    : 'bg-black/10 dark:bg-white/10 opacity-100' /* Increased contrast from bg-surfaceHighlight */
                  }
                    
                    /* Animation */
                    ${isAnimating ? 'animate-pop z-50 ring-2 ring-surface shadow-md' : 'transition-colors duration-200'}
                    
                    /* Hover Effects */
                    ${!isAnimating && !isFuture && !readOnly
                    ? 'hover:ring-1 hover:ring-textSecondary/30 hover:z-10'
                    : ''}
                    `}
              />
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surfaceHighlight/50 rounded-full overflow-hidden border border-borderSubtle/50">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%`, backgroundColor: habit.color }}
          />
        </div>
        <div className="flex flex-col items-end leading-none shrink-0">
          <span className="text-[10px] font-bold text-textPrimary">
            {progress.completed} / {progress.target}
          </span>
          <span className="text-[8px] font-bold text-textSecondary uppercase tracking-wider opacity-60">
            {progress.periodName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HabitGrid;
