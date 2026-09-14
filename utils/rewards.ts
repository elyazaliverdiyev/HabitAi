// ===== RARITY SYSTEM + REWARDS =====
// Extracted from types.ts

// ===== RARITY =====
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SoundPack = 'off' | 'synth' | 'premium';

export const RARITY_CONFIG: Record<Rarity, { label: { ru: string; en: string }; color: string }> = {
  common: { label: { ru: 'Обычная', en: 'Common' }, color: '#a1a1aa' },
  uncommon: { label: { ru: 'Необычная', en: 'Uncommon' }, color: '#22c55e' },
  rare: { label: { ru: 'Редкая', en: 'Rare' }, color: '#3b82f6' },
  epic: { label: { ru: 'Эпическая', en: 'Epic' }, color: '#a855f7' },
  legendary: { label: { ru: 'Легендарная', en: 'Legendary' }, color: '#f97316' },
};

export const getRarity = (habit: {
  difficulty?: number;
  completedDates: string[];
  cost?: number;
  time?: string;
}): Rarity => {
  let score = 0;

  score += ((habit.difficulty || 1) - 1) * 15;

  const streak = habit.completedDates.length;
  if (streak >= 30) score += 20;
  else if (streak >= 14) score += 15;
  else if (streak >= 7) score += 10;
  else if (streak >= 3) score += 5;

  const costNum = Number(habit.cost) || 0;
  if (costNum >= 100) score += 15;
  else if (costNum >= 50) score += 10;
  else if (costNum >= 20) score += 5;

  if (habit.time) {
    const now = new Date();
    const [h, m] = habit.time.split(':').map(Number);
    const habitMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = Math.abs(habitMinutes - nowMinutes);
    if (diff <= 30) score += 15;
    else if (diff <= 60) score += 10;
    else if (diff <= 120) score += 5;
  }

  if (score >= 60) return 'legendary';
  if (score >= 40) return 'epic';
  if (score >= 25) return 'rare';
  if (score >= 10) return 'uncommon';
  return 'common';
};

// ===== STREAK REWARDS SYSTEM =====
export const FREE_HABIT_LIMIT = 5;

export interface StreakReward {
  streakDays: number;
  habitSlots: number;
  badge?: { id: string; emoji: string; label: { ru: string; en: string } };
  theme?: string;
  soundPack?: SoundPack;
  label: { ru: string; en: string };
  description: { ru: string; en: string };
}

export const STREAK_REWARDS: StreakReward[] = [
  {
    streakDays: 7, habitSlots: 1,
    badge: { id: 'week_warrior', emoji: '🔥', label: { ru: 'Недельный воин', en: 'Week Warrior' } },
    label: { ru: '7 дней подряд!', en: '7 days streak!' },
    description: { ru: '+1 бесплатная привычка', en: '+1 free habit' }
  },
  {
    streakDays: 21, habitSlots: 1,
    badge: { id: 'habit_former', emoji: '💪', label: { ru: 'Формирующий', en: 'Habit Former' } },
    theme: 'ocean',
    label: { ru: '21 день — привычка формируется!', en: '21 days — habit forming!' },
    description: { ru: '+1 привычка + тема "Океан"', en: '+1 habit + Ocean theme' }
  },
  {
    streakDays: 30, habitSlots: 1,
    badge: { id: 'monthly_champion', emoji: '🏆', label: { ru: 'Месячный чемпион', en: 'Monthly Champion' } },
    label: { ru: 'Месяц! Ты невероятен!', en: 'One month! You\'re amazing!' },
    description: { ru: '+1 привычка + бейдж Чемпион', en: '+1 habit + Champion badge' }
  },
  {
    streakDays: 66, habitSlots: 2,
    badge: { id: 'master', emoji: '🧙', label: { ru: 'Мастер привычек', en: 'Habit Master' } },
    soundPack: 'premium', theme: 'aurora',
    label: { ru: '66 дней — научно доказанная привычка!', en: '66 days — scientifically proven habit!' },
    description: { ru: '+2 привычки + звуковой пак + тема Aurora', en: '+2 habits + sound pack + Aurora theme' }
  },
  {
    streakDays: 100, habitSlots: 3,
    badge: { id: 'legend', emoji: '👑', label: { ru: 'Легенда', en: 'Legend' } },
    theme: 'cyberpunk',
    label: { ru: '100 дней! Ты — ЛЕГЕНДА!', en: '100 days! You are a LEGEND!' },
    description: { ru: '+3 привычки + статус VIP + тема Cyberpunk', en: '+3 habits + VIP status + Cyberpunk theme' }
  }
];

export interface UserRewards {
  unlockedBadges: string[];
  unlockedThemes: string[];
  unlockedSoundPacks: SoundPack[];
  bonusHabitSlots: number;
  highestStreak: number;
  totalXP: number;
  level: number;
  streakSaverUsedAt?: string;
}

export const DEFAULT_USER_REWARDS: UserRewards = {
  unlockedBadges: [],
  unlockedThemes: ['daylight', 'ios-dark'],
  unlockedSoundPacks: ['off', 'synth'],
  bonusHabitSlots: 0,
  highestStreak: 0,
  totalXP: 0,
  level: 1
};

export const getMaxHabits = (rewards: UserRewards, isPremium: boolean = false): number => {
  if (isPremium) return 999;
  return FREE_HABIT_LIMIT + rewards.bonusHabitSlots;
};

export const canAddHabit = (currentCount: number, rewards: UserRewards, isPremium: boolean = false): boolean => {
  return currentCount < getMaxHabits(rewards, isPremium);
};

export const getNextReward = (currentStreak: number): StreakReward | null => {
  return STREAK_REWARDS.find(r => r.streakDays > currentStreak) || null;
};

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

// ===== IDENTITY BADGES (Atomic Habits) =====
export const IDENTITY_MAP: Record<string, { ru: string; en: string; emoji: string }> = {
  'Здоровье': { ru: 'здоровый человек', en: 'healthy person', emoji: '💪' },
  'Health': { ru: 'здоровый человек', en: 'healthy person', emoji: '💪' },
  'Спорт': { ru: 'спортсмен', en: 'athlete', emoji: '🏃' },
  'Fitness': { ru: 'спортсмен', en: 'athlete', emoji: '🏃' },
  'Продуктивность': { ru: 'продуктивный человек', en: 'productive person', emoji: '⚡' },
  'Productivity': { ru: 'продуктивный человек', en: 'productive person', emoji: '⚡' },
  'Обучение': { ru: 'ученик', en: 'learner', emoji: '📚' },
  'Learning': { ru: 'ученик', en: 'learner', emoji: '📚' },
  'Финансы': { ru: 'финансово грамотный', en: 'financially savvy', emoji: '💰' },
  'Finance': { ru: 'финансово грамотный', en: 'financially savvy', emoji: '💰' },
  'Осознанность': { ru: 'осознанный человек', en: 'mindful person', emoji: '🧘' },
  'Mindfulness': { ru: 'осознанный человек', en: 'mindful person', emoji: '🧘' },
};

export const IDENTITY_MILESTONES = [
  { days: 7, level: 1, labelRu: 'Начинающий', labelEn: 'Beginner' },
  { days: 21, level: 2, labelRu: 'Формирующий', labelEn: 'Forming' },
  { days: 30, level: 3, labelRu: 'Стабильный', labelEn: 'Stable' },
  { days: 66, level: 4, labelRu: 'Мастер', labelEn: 'Master' },
  { days: 100, level: 5, labelRu: 'Легенда', labelEn: 'Legend' },
];

export interface IdentityBadge {
  identity: { ru: string; en: string };
  emoji: string;
  level: number;
  levelLabel: { ru: string; en: string };
  streak: number;
  nextMilestone: number | null;
  daysToNext: number;
}

export const getIdentityBadge = (habit: {
  completedDates: string[];
  category?: string;
}): IdentityBadge | null => {
  const streak = habit.completedDates.length;
  if (streak < 7) return null;

  const category = habit.category || 'Продуктивность';
  const identity = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };

  let currentMilestone = IDENTITY_MILESTONES[0];
  for (const milestone of IDENTITY_MILESTONES) {
    if (streak >= milestone.days) {
      currentMilestone = milestone;
    }
  }

  const nextMilestone = IDENTITY_MILESTONES.find(m => m.days > streak);

  return {
    identity: { ru: identity.ru, en: identity.en },
    emoji: identity.emoji,
    level: currentMilestone.level,
    levelLabel: { ru: currentMilestone.labelRu, en: currentMilestone.labelEn },
    streak,
    nextMilestone: nextMilestone?.days || null,
    daysToNext: nextMilestone ? nextMilestone.days - streak : 0,
  };
};

// ===== COMBO SYSTEM =====
export const COMBO_THRESHOLDS = [
  { count: 3, multiplier: 1.5, label: { ru: 'COMBO x3!', en: 'COMBO x3!' }, emoji: '🔥' },
  { count: 5, multiplier: 2.0, label: { ru: 'COMBO x5!', en: 'COMBO x5!' }, emoji: '⚡' },
  { count: 7, multiplier: 2.5, label: { ru: 'MEGA COMBO!', en: 'MEGA COMBO!' }, emoji: '💥' },
];

export const getComboMultiplier = (recentCompletions: number): { multiplier: number; label: { ru: string; en: string }; emoji: string } | null => {
  const sorted = [...COMBO_THRESHOLDS].sort((a, b) => b.count - a.count);
  for (const t of sorted) {
    if (recentCompletions >= t.count) {
      return { multiplier: t.multiplier, label: t.label, emoji: t.emoji };
    }
  }
  return null;
};
