// ===== XP AND LEVEL SYSTEM =====
// Extracted from types.ts — pure functions for XP/level calculations

import { getCurrentStreak } from './streaks';

// XP configuration
export const XP_CONFIG = {
  baseXP: 10,
  streakMultiplier: 0.1,
  difficultyMultiplier: {
    1: 1.0,
    2: 1.25,
    3: 1.5,
    4: 1.75,
    5: 2.0,
  } as Record<number, number>,
  maxStreakBonus: 2.0,
};

// Level titles with localization
export const LEVEL_TITLES: { minLevel: number; label: { ru: string; en: string }; emoji: string }[] = [
  { minLevel: 1, label: { ru: 'Новичок', en: 'Novice' }, emoji: '🌱' },
  { minLevel: 5, label: { ru: 'Ученик', en: 'Apprentice' }, emoji: '📚' },
  { minLevel: 10, label: { ru: 'Практик', en: 'Practitioner' }, emoji: '🎯' },
  { minLevel: 20, label: { ru: 'Знаток', en: 'Expert' }, emoji: '⭐' },
  { minLevel: 30, label: { ru: 'Мастер', en: 'Master' }, emoji: '🏆' },
  { minLevel: 50, label: { ru: 'Грандмастер', en: 'Grandmaster' }, emoji: '👑' },
  { minLevel: 75, label: { ru: 'Легенда', en: 'Legend' }, emoji: '🌟' },
  { minLevel: 100, label: { ru: 'Бессмертный', en: 'Immortal' }, emoji: '💎' },
];

// Calculate XP required for a specific level (exponential curve)
export const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Calculate total XP needed to reach a level (cumulative)
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// Get current level from total XP
export const getLevelFromXP = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded + getXPForLevel(level) <= totalXP) {
    xpNeeded += getXPForLevel(level);
    level++;
    if (level > 100) break;
  }
  return level;
};

// Get XP progress within current level
export const getXPProgress = (totalXP: number): {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  progress: number;
  totalXP: number;
} => {
  const level = getLevelFromXP(totalXP);
  const xpForCurrentLevel = getTotalXPForLevel(level);
  const currentXP = totalXP - xpForCurrentLevel;
  const xpForNextLevel = getXPForLevel(level);
  const progress = Math.min(currentXP / xpForNextLevel, 1);

  return { level, currentXP, xpForNextLevel, progress, totalXP };
};

// Get level title for a level
export const getLevelTitle = (level: number, language: 'ru' | 'en' = 'en'): { label: string; emoji: string } => {
  const title = [...LEVEL_TITLES].reverse().find(t => level >= t.minLevel) || LEVEL_TITLES[0];
  return { label: title.label[language], emoji: title.emoji };
};

// Calculate XP earned for completing a habit
export const calculateXPEarned = (habit: {
  difficulty?: number;
  completedDates: string[];
}): number => {
  const baseXP = XP_CONFIG.baseXP;
  const difficultyMult = XP_CONFIG.difficultyMultiplier[habit.difficulty || 1] || 1.0;
  const streak = getCurrentStreak(habit);
  const streakBonus = Math.min(streak * XP_CONFIG.streakMultiplier, XP_CONFIG.maxStreakBonus);
  const xp = Math.floor(baseXP * difficultyMult * (1 + streakBonus));
  return xp;
};

// Check if user leveled up
export const checkLevelUp = (oldXP: number, newXP: number): {
  didLevelUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
} => {
  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);
  return {
    didLevelUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel
  };
};
