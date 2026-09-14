// Daily Challenges and Combo System
// Extracted from types.ts

import { Habit } from './habit';
import { getCurrentStreak } from '../types';

// ===== DAILY CHALLENGES =====
export type ChallengeType = 'early_bird' | 'category_sweep' | 'perfect_day' | 'streak_builder' | 'speed_run' | 'focus_master';

export interface DailyChallenge {
  id: string;
  type: ChallengeType;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  targetCount: number;
  currentCount: number;
  xpReward: number;
  emoji: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

const CHALLENGE_TEMPLATES: Array<{
  type: ChallengeType;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  emoji: string;
  xp: number;
  getTarget: (habits: Habit[]) => number;
  getProgress: (habits: Habit[], dateStr: string) => number;
}> = [
    {
      type: 'early_bird',
      title: { ru: 'Ранняя пташка', en: 'Early Bird' },
      description: { ru: 'Выполни 3 привычки до 10:00', en: 'Complete 3 habits before 10:00' },
      emoji: '🌅',
      xp: 25,
      getTarget: () => 3,
      getProgress: (habits, dateStr) => {
        const hour = new Date().getHours();
        if (hour >= 10) return habits.filter(h => h.completedDates.includes(dateStr)).length >= 3 ? 3 : 0;
        return Math.min(3, habits.filter(h => h.completedDates.includes(dateStr) && !h.archived).length);
      }
    },
    {
      type: 'perfect_day',
      title: { ru: 'Идеальный день', en: 'Perfect Day' },
      description: { ru: 'Выполни все привычки', en: 'Complete all habits' },
      emoji: '⭐',
      xp: 50,
      getTarget: (habits) => habits.filter(h => h.type !== 'task' && !h.archived).length,
      getProgress: (habits, dateStr) => habits.filter(h => h.type !== 'task' && !h.archived && h.completedDates.includes(dateStr)).length,
    },
    {
      type: 'streak_builder',
      title: { ru: 'Строитель стриков', en: 'Streak Builder' },
      description: { ru: 'Продли стрик у 3+ привычек', en: 'Extend streak on 3+ habits' },
      emoji: '🔥',
      xp: 30,
      getTarget: () => 3,
      getProgress: (habits, dateStr) => habits.filter(h => {
        if (h.type === 'task' || h.archived) return false;
        const streak = getCurrentStreak(h);
        return streak >= 2 && h.completedDates.includes(dateStr);
      }).length,
    },
    {
      type: 'speed_run',
      title: { ru: 'Скоростной забег', en: 'Speed Run' },
      description: { ru: 'Выполни 5 привычек за час', en: 'Complete 5 habits in an hour' },
      emoji: '⚡',
      xp: 35,
      getTarget: () => 5,
      getProgress: (habits, dateStr) => Math.min(5, habits.filter(h => !h.archived && h.completedDates.includes(dateStr)).length),
    },
    {
      type: 'focus_master',
      title: { ru: 'Мастер фокусировки', en: 'Focus Master' },
      description: { ru: 'Проведи 30+ мин в фокус-режиме', en: 'Spend 30+ min in focus mode' },
      emoji: '🎯',
      xp: 40,
      getTarget: () => 30,
      getProgress: () => 0, // Updated by FocusMode component
    },
  ];

export const generateDailyChallenges = (habits: Habit[], dateStr: string): DailyChallenge[] => {
  // Use date as seed for consistent daily selection
  const seed = dateStr.split('-').reduce((acc, n) => acc + parseInt(n), 0);

  // Always include "Perfect Day" and pick 2 random others
  const others = CHALLENGE_TEMPLATES.filter(t => t.type !== 'perfect_day');
  const shuffled = others.sort((a, b) => {
    const hashA = (seed * 31 + a.type.charCodeAt(0)) % 100;
    const hashB = (seed * 31 + b.type.charCodeAt(0)) % 100;
    return hashA - hashB;
  });

  const perfectDay = CHALLENGE_TEMPLATES.find(t => t.type === 'perfect_day')!;
  const selected = [perfectDay, shuffled[0], shuffled[1]];

  return selected.map((t, i) => ({
    id: `${dateStr}-${t.type}`,
    type: t.type,
    title: t.title,
    description: t.description,
    targetCount: t.getTarget(habits),
    currentCount: t.getProgress(habits, dateStr),
    xpReward: t.xp,
    emoji: t.emoji,
    completed: t.getProgress(habits, dateStr) >= t.getTarget(habits),
    date: dateStr,
  }));
};

export const updateChallengeProgress = (
  challenges: DailyChallenge[],
  habits: Habit[],
  dateStr: string
): DailyChallenge[] => {
  return challenges.map(ch => {
    const template = CHALLENGE_TEMPLATES.find(t => t.type === ch.type);
    if (!template) return ch;
    const progress = template.getProgress(habits, dateStr);
    return {
      ...ch,
      currentCount: progress,
      completed: progress >= ch.targetCount,
    };
  });
};

// ===== COMBO SYSTEM =====
export const COMBO_THRESHOLDS = [
  { count: 3, multiplier: 1.5, label: { ru: 'COMBO x3!', en: 'COMBO x3!' }, emoji: '🔥' },
  { count: 5, multiplier: 2.0, label: { ru: 'COMBO x5!', en: 'COMBO x5!' }, emoji: '⚡' },
  { count: 7, multiplier: 2.5, label: { ru: 'MEGA COMBO!', en: 'MEGA COMBO!' }, emoji: '💥' },
];

export const getComboMultiplier = (recentCompletions: number): { multiplier: number; label: { ru: string; en: string }; emoji: string } | null => {
  // Find the highest threshold met
  const sorted = [...COMBO_THRESHOLDS].sort((a, b) => b.count - a.count);
  for (const t of sorted) {
    if (recentCompletions >= t.count) {
      return { multiplier: t.multiplier, label: t.label, emoji: t.emoji };
    }
  }
  return null;
};
