// ===== STREAK CALCULATIONS =====
// Extracted from types.ts — pure functions for streak logic

import type { Habit } from '../types';

// Helper to get local date string
export const getLocalDateStr = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a habit should be done on a specific date (considers frequency)
export const shouldDoHabitOnDate = (habit: {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  type?: 'habit' | 'task';
}, date: Date): boolean => {
  if (habit.type === 'task') return false;
  if (!habit.frequency || habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days' && habit.frequencyDays) {
    return habit.frequencyDays.includes(date.getDay());
  }
  return true;
};

// Get number of consecutive days missed (for Never Miss Twice)
export const getMissedDaysStreak = (habit: {
  completedDates: string[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  type?: 'habit' | 'task';
}): number => {
  if (habit.type === 'task') return 0;

  let missedDays = 0;
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    if (!shouldDoHabitOnDate(habit, checkDate)) continue;

    const dateStr = getLocalDateStr(checkDate);
    if (habit.completedDates.includes(dateStr)) {
      break;
    }
    missedDays++;
  }

  return missedDays;
};

// ===== STREAK CALCULATION =====
export const getCurrentStreak = (habit: {
  completedDates: string[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  type?: 'habit' | 'task';
}): number => {
  if (habit.type === 'task') return 0;
  if (!habit.completedDates || habit.completedDates.length === 0) return 0;

  const sortedDates = [...habit.completedDates].sort().reverse();

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = getLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
    return 0;
  }

  let checkDate = new Date(today);

  if (!sortedDates.includes(todayStr)) {
    checkDate = yesterday;
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = getLocalDateStr(checkDate);

    if (!shouldDoHabitOnDate(habit, checkDate)) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (sortedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Get streak milestone info
export const getStreakMilestone = (streak: number): {
  color: string;
  glow: boolean;
  label: { ru: string; en: string }
} | null => {
  if (streak >= 100) return { color: '#ef4444', glow: true, label: { ru: 'Легенда!', en: 'Legend!' } };
  if (streak >= 66) return { color: '#f97316', glow: true, label: { ru: 'Мастер', en: 'Master' } };
  if (streak >= 30) return { color: '#f97316', glow: false, label: { ru: 'На огне!', en: 'On fire!' } };
  if (streak >= 21) return { color: '#eab308', glow: false, label: { ru: 'Формируется', en: 'Forming' } };
  if (streak >= 7) return { color: '#eab308', glow: false, label: { ru: 'Неделя!', en: 'Week!' } };
  if (streak >= 3) return { color: '#a1a1aa', glow: false, label: { ru: 'Начало', en: 'Starting' } };
  return null;
};

// Check if habit streak is broken (missed yesterday)
export const isStreakBroken = (habit: Habit): boolean => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const streak = getCurrentStreak(habit);
  return streak === 0 && habit.completedDates.length > 0 && !habit.completedDates.includes(yesterdayStr);
};

// ===== STREAK SAVER =====

export const canUseStreakSaver = (streakSaverUsedAt?: string): boolean => {
  if (!streakSaverUsedAt) return true;
  const lastUsed = new Date(streakSaverUsedAt);
  const now = new Date();
  const daysSinceLastUse = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceLastUse >= 30;
};

export const getDaysUntilStreakSaver = (streakSaverUsedAt?: string): number => {
  if (!streakSaverUsedAt) return 0;
  const lastUsed = new Date(streakSaverUsedAt);
  const now = new Date();
  const daysSinceLastUse = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 30 - daysSinceLastUse);
};
