// Streak Rewards and Streak Saver System
// Extracted from types.ts

import { Rarity, SoundPack } from '../types';
import { Habit } from './habit';
import { getCurrentStreak } from '../types';

// ===== STREAK REWARDS SYSTEM (Hormozi-style) =====
export const FREE_HABIT_LIMIT = 5; // Base free tier limit (generous!)

export interface StreakReward {
  streakDays: number;
  habitSlots: number;
  badge?: { id: string; emoji: string; label: { ru: string; en: string } };
  theme?: string; // Theme ID to unlock
  soundPack?: SoundPack;
  label: { ru: string; en: string };
  description: { ru: string; en: string };
}

export const STREAK_REWARDS: StreakReward[] = [
  {
    streakDays: 7,
    habitSlots: 1,
    badge: { id: 'week_warrior', emoji: '🔥', label: { ru: 'Недельный воин', en: 'Week Warrior' } },
    label: { ru: '7 дней подряд!', en: '7 days streak!' },
    description: { ru: '+1 бесплатная привычка', en: '+1 free habit' }
  },
  {
    streakDays: 21,
    habitSlots: 1,
    badge: { id: 'habit_former', emoji: '💪', label: { ru: 'Формирующий', en: 'Habit Former' } },
    theme: 'ocean',
    label: { ru: '21 день — привычка формируется!', en: '21 days — habit forming!' },
    description: { ru: '+1 привычка + тема "Океан"', en: '+1 habit + Ocean theme' }
  },
  {
    streakDays: 30,
    habitSlots: 1,
    badge: { id: 'monthly_champion', emoji: '🏆', label: { ru: 'Месячный чемпион', en: 'Monthly Champion' } },
    label: { ru: 'Месяц! Ты невероятен!', en: 'One month! You\'re amazing!' },
    description: { ru: '+1 привычка + бейдж Чемпион', en: '+1 habit + Champion badge' }
  },
  {
    streakDays: 66,
    habitSlots: 2,
    badge: { id: 'master', emoji: '🧙', label: { ru: 'Мастер привычек', en: 'Habit Master' } },
    soundPack: 'premium',
    theme: 'aurora',
    label: { ru: '66 дней — научно доказанная привычка!', en: '66 days — scientifically proven habit!' },
    description: { ru: '+2 привычки + звуковой пак + тема Aurora', en: '+2 habits + sound pack + Aurora theme' }
  },
  {
    streakDays: 100,
    habitSlots: 3,
    badge: { id: 'legend', emoji: '👑', label: { ru: 'Легенда', en: 'Legend' } },
    theme: 'cyberpunk',
    label: { ru: '100 дней! Ты — ЛЕГЕНДА!', en: '100 days! You are a LEGEND!' },
    description: { ru: '+3 привычки + статус VIP + тема Cyberpunk', en: '+3 habits + VIP status + Cyberpunk theme' }
  }
];

export interface UserRewards {
  unlockedBadges: string[]; // Badge IDs
  unlockedThemes: string[]; // Theme IDs
  unlockedSoundPacks: SoundPack[];
  bonusHabitSlots: number; // Total earned slots from streaks
  highestStreak: number; // All-time highest streak achieved
  totalXP: number; // For future XP system
  level: number; // User level
  streakSaverUsedAt?: string; // ISO date of last streak saver usage (monthly limit)
}

export const DEFAULT_USER_REWARDS: UserRewards = {
  unlockedBadges: [],
  unlockedThemes: ['daylight', 'ios-dark'], // Default themes
  unlockedSoundPacks: ['off', 'synth'],
  bonusHabitSlots: 0,
  highestStreak: 0,
  totalXP: 0,
  level: 1
  // streakSaverUsedAt is optional, not included until first use
};

// Calculate max habits allowed for user
export const getMaxHabits = (rewards: UserRewards, isPremium: boolean = false): number => {
  if (isPremium) return 999; // Unlimited for premium
  return FREE_HABIT_LIMIT + rewards.bonusHabitSlots;
};

// Check if user can add more habits
export const canAddHabit = (currentCount: number, rewards: UserRewards, isPremium: boolean = false): boolean => {
  return currentCount < getMaxHabits(rewards, isPremium);
};

// Get next reward to unlock
export const getNextReward = (currentStreak: number): StreakReward | null => {
  return STREAK_REWARDS.find(r => r.streakDays > currentStreak) || null;
};

// Calculate rewards earned from a streak
export const calculateRewardsFromStreak = (streak: number): {
  rewards: StreakReward[];
  totalSlots: number;
  badges: string[];
  themes: string[];
} => {
  const earned = STREAK_REWARDS.filter(r => streak >= r.streakDays);
  return {
    rewards: earned,
    totalSlots: earned.reduce((sum, r) => sum + r.habitSlots, 0),
    badges: earned.filter(r => r.badge).map(r => r.badge!.id),
    themes: earned.filter(r => r.theme).map(r => r.theme!)
  };
};

// ===== STREAK SAVER =====

// Check if streak saver is available (once per month)
export const canUseStreakSaver = (streakSaverUsedAt?: string): boolean => {
  if (!streakSaverUsedAt) return true;

  const lastUsed = new Date(streakSaverUsedAt);
  const now = new Date();
  const daysSinceLastUse = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceLastUse >= 30; // Available every 30 days
};

// Get days until streak saver is available
export const getDaysUntilStreakSaver = (streakSaverUsedAt?: string): number => {
  if (!streakSaverUsedAt) return 0;

  const lastUsed = new Date(streakSaverUsedAt);
  const now = new Date();
  const daysSinceLastUse = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, 30 - daysSinceLastUse);
};
