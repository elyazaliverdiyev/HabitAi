

// Currency definitions
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
] as const;

export const DEFAULT_CURRENCY = 'USD';

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '$';
};

// ===== RARITY SYSTEM =====
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ===== SOUND PACK =====
export type SoundPack = 'off' | 'synth' | 'premium';

export const RARITY_CONFIG: Record<Rarity, { label: { ru: string; en: string }; color: string }> = {
  common: { label: { ru: 'Обычная', en: 'Common' }, color: '#a1a1aa' },
  uncommon: { label: { ru: 'Необычная', en: 'Uncommon' }, color: '#22c55e' },
  rare: { label: { ru: 'Редкая', en: 'Rare' }, color: '#3b82f6' },
  epic: { label: { ru: 'Эпическая', en: 'Epic' }, color: '#a855f7' },
  legendary: { label: { ru: 'Легендарная', en: 'Legendary' }, color: '#f97316' },
};

// Calculate rarity based on difficulty, streak, cost, and time
export const getRarity = (habit: {
  difficulty?: number;
  completedDates: string[];
  cost?: number;
  time?: string;
}): Rarity => {
  let score = 0;

  // Difficulty (1-5) → 0-60 points (multiplier 15)
  score += ((habit.difficulty || 1) - 1) * 15;

  // Streak bonus (up to 20 points)
  const streak = habit.completedDates.length;
  if (streak >= 30) score += 20;
  else if (streak >= 14) score += 15;
  else if (streak >= 7) score += 10;
  else if (streak >= 3) score += 5;

  // Cost bonus (up to 15 points)
  const costNum = Number(habit.cost) || 0;
  if (costNum >= 100) score += 15;
  else if (costNum >= 50) score += 10;
  else if (costNum >= 20) score += 5;

  // Time relevance bonus (up to 15 points)
  if (habit.time) {
    const now = new Date();
    const [h, m] = habit.time.split(':').map(Number);
    const habitMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = Math.abs(habitMinutes - nowMinutes);
    if (diff <= 30) score += 15; // Within 30 min
    else if (diff <= 60) score += 10; // Within 1 hour
    else if (diff <= 120) score += 5; // Within 2 hours
  }

  // Convert score to rarity
  if (score >= 60) return 'legendary';
  if (score >= 40) return 'epic';
  if (score >= 25) return 'rare';
  if (score >= 10) return 'uncommon';
  return 'common';
};

// Helper to get local date string
const getLocalDateStr = (date: Date = new Date()) => {
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

  // Check up to last 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    // Only count days where habit should be done
    if (!shouldDoHabitOnDate(habit, checkDate)) continue;

    const dateStr = getLocalDateStr(checkDate);
    if (habit.completedDates.includes(dateStr)) {
      break; // Found a completed day, stop counting
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

  // Sort dates descending (newest first)
  const sortedDates = [...habit.completedDates].sort().reverse();

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today or yesterday is completed to start counting
  const todayStr = getLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  // If neither today nor yesterday is completed, streak is 0
  if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
    return 0;
  }

  // Start from today and count backwards
  let checkDate = new Date(today);

  // If today is not completed but yesterday is, start from yesterday
  if (!sortedDates.includes(todayStr)) {
    checkDate = yesterday;
  }

  // Count consecutive days
  for (let i = 0; i < 365; i++) { // Max 1 year
    const dateStr = getLocalDateStr(checkDate);

    // Check if this day should be counted based on frequency
    if (!shouldDoHabitOnDate(habit, checkDate)) {
      // Skip this day but don't break the streak
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (sortedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Streak broken
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

// Check if habit streak is broken (missed yesterday)
export const isStreakBroken = (habit: Habit): boolean => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if missed yesterday and has an existing streak
  const streak = getCurrentStreak(habit);
  return streak === 0 && habit.completedDates.length > 0 && !habit.completedDates.includes(yesterdayStr);
};

// ===== XP AND LEVEL SYSTEM =====

// XP configuration
export const XP_CONFIG = {
  baseXP: 10, // Base XP for completing a habit
  streakMultiplier: 0.1, // +10% per streak day (max 200%)
  difficultyMultiplier: {
    1: 1.0, // Easy
    2: 1.25,
    3: 1.5, // Medium
    4: 1.75,
    5: 2.0, // Hard
  } as Record<number, number>,
  maxStreakBonus: 2.0, // Max 200% bonus from streak
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
  // Formula: XP = 100 * level^1.5
  // Level 1: 100, Level 2: 283, Level 5: 1118, Level 10: 3162, Level 50: 35355
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
    if (level > 100) break; // Cap at level 100
  }
  return level;
};

// Get XP progress within current level
export const getXPProgress = (totalXP: number): {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  progress: number; // 0-1
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

  // Difficulty multiplier (1-5 -> 1.0-2.0)
  const difficultyMult = XP_CONFIG.difficultyMultiplier[habit.difficulty || 1] || 1.0;

  // Streak bonus (up to 200% extra based on streak length)
  const streak = getCurrentStreak(habit);
  const streakBonus = Math.min(streak * XP_CONFIG.streakMultiplier, XP_CONFIG.maxStreakBonus);

  // Final XP = base * difficulty * (1 + streak bonus)
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

// ===== IDENTITY BADGES (Atomic Habits) =====

// Category to Identity mapping
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

// Streak milestones for identity progression
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

// Get identity badge for a habit based on its streak
export const getIdentityBadge = (habit: {
  completedDates: string[];
  category?: string;
}): IdentityBadge | null => {
  const streak = habit.completedDates.length;
  if (streak < 7) return null; // Need at least 7 days for first badge

  const category = habit.category || 'Продуктивность';
  const identity = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };

  // Find current milestone
  let currentMilestone = IDENTITY_MILESTONES[0];
  for (const milestone of IDENTITY_MILESTONES) {
    if (streak >= milestone.days) {
      currentMilestone = milestone;
    }
  }

  // Find next milestone
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


export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string; // URL or null
  currentPage: number;
  totalPages: number;
  status: 'inbox' | 'reading' | 'finished';
  rating?: number; // 1-5
  notes?: string;
  updatedAt: string;
}

// ===== SUPPLEMENTS TRACKING =====
export interface Supplement {
  id: string;
  name: string;           // e.g., "Vitamin D3", "Omega-3"
  dosage: string;         // e.g., "5000 IU", "500mg"
  timing: 'morning' | 'afternoon' | 'evening' | 'with_food' | 'anytime';
  frequency: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly' | 'monthly';
  daysOfWeek?: number[];  // For weekly: specific days [0=Sun, 1=Mon, ...]
  status: 'active' | 'finished' | 'paused';
  startDate?: string;     // Course start date
  endDate?: string;       // Course end date (when finished)
  courseNotes?: string;   // Notes about the course
  notes?: string;         // General notes
  color?: string;
  takenDates?: string[];
}

export const SUPPLEMENT_TIMING = {
  morning: { label: { ru: 'Утром', en: 'Morning' }, emoji: '☀️' },
  afternoon: { label: { ru: 'Днём', en: 'Afternoon' }, emoji: '🌤️' },
  evening: { label: { ru: 'Вечером', en: 'Evening' }, emoji: '🌙' },
  with_food: { label: { ru: 'С едой', en: 'With food' }, emoji: '🍽️' },
  anytime: { label: { ru: 'Любое время', en: 'Anytime' }, emoji: '⏰' },
} as const;

export const SUPPLEMENT_FREQUENCY = {
  daily: { label: { ru: 'Ежедневно', en: 'Daily' }, emoji: '📅' },
  twice_daily: { label: { ru: '2 раза в день', en: 'Twice daily' }, emoji: '🔄' },
  every_other_day: { label: { ru: 'Через день', en: 'Every other day' }, emoji: '↔️' },
  weekly: { label: { ru: 'Раз в неделю', en: 'Weekly' }, emoji: '📆' },
  monthly: { label: { ru: 'Раз в месяц', en: 'Monthly' }, emoji: '🗓️' },
} as const;

// ===== SKINCARE TRACKING =====
export interface SkincareProduct {
  id: string;
  name: string;           // e.g., "CeraVe Moisturizer"
  type: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'exfoliant' | 'eye_cream' | 'other';
  routine: 'morning' | 'evening' | 'both';
  frequency: 'daily' | 'every_other_day' | 'weekly' | 'twice_weekly';
  order: number;          // Order of application (1, 2, 3...)
  status: 'active' | 'finished' | 'paused';
  notes?: string;
  color?: string;
  usedDates?: string[];
}

export const SKINCARE_PRODUCT_TYPES = {
  cleanser: { label: { ru: 'Очищающее', en: 'Cleanser' }, emoji: '🧼', order: 1 },
  toner: { label: { ru: 'Тоник', en: 'Toner' }, emoji: '💧', order: 2 },
  serum: { label: { ru: 'Сыворотка', en: 'Serum' }, emoji: '✨', order: 3 },
  eye_cream: { label: { ru: 'Крем для глаз', en: 'Eye cream' }, emoji: '👁️', order: 4 },
  moisturizer: { label: { ru: 'Увлажняющий', en: 'Moisturizer' }, emoji: '🧴', order: 5 },
  sunscreen: { label: { ru: 'SPF', en: 'Sunscreen' }, emoji: '☀️', order: 6 },
  mask: { label: { ru: 'Маска', en: 'Mask' }, emoji: '🎭', order: 10 },
  exfoliant: { label: { ru: 'Пилинг', en: 'Exfoliant' }, emoji: '🧪', order: 11 },
  other: { label: { ru: 'Другое', en: 'Other' }, emoji: '💄', order: 99 },
} as const;

export const SKINCARE_ROUTINE = {
  morning: { label: { ru: 'Утро', en: 'Morning' }, emoji: '☀️' },
  evening: { label: { ru: 'Вечер', en: 'Evening' }, emoji: '🌙' },
  both: { label: { ru: 'Утро и вечер', en: 'Both' }, emoji: '🔄' },
} as const;

export const SKINCARE_FREQUENCY = {
  daily: { label: { ru: 'Ежедневно', en: 'Daily' }, emoji: '📅' },
  every_other_day: { label: { ru: 'Через день', en: 'Every other day' }, emoji: '↔️' },
  weekly: { label: { ru: 'Раз в неделю', en: 'Weekly' }, emoji: '📆' },
  twice_weekly: { label: { ru: '2 раза в неделю', en: 'Twice weekly' }, emoji: '2️⃣' },
} as const;

export interface Habit {
  id: string;
  type?: 'habit' | 'task';
  name: string;
  description?: string;
  color: string;
  icon: string;
  completedDates: string[];
  createdAt: string;
  category?: string;
  archived?: boolean;

  // Habit Specific
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  targetCount?: number;

  // Adaptive Goals System
  ultimateTarget?: number;  // Final goal (e.g., 50 pages)
  adaptiveLevel?: number;   // 1-10, AI adjusts based on completion

  // Task Specific
  date?: string;

  // Eisenhower Matrix (for tasks)
  quadrant?: 'do' | 'schedule' | 'delegate' | 'delete';

  // Common Scheduling
  time?: string;
  duration?: number;
  reminderTime?: string;  // HH:MM format for push notifications

  // Implementation Intentions (Atomic Habits)
  place?: string;  // Where to do the habit: "в спальне", "на кухне", etc.

  // Expense Tracking
  cost?: number;      // Cost per completion (e.g., coffee = 3₼)
  currency?: string;  // Currency code (default: 'USD')

  // Rarity System
  difficulty?: 1 | 2 | 3 | 4 | 5; // 1=Easy, 5=Legendary

  // Keystone Habits (Atomic Habits)
  isKeystone?: boolean;  // Key habits that influence all other behaviors

  // Daily Detailed Progress Tracking (e.g. { '2026-08-22': 1300 })
  dailyProgress?: Record<string, number>;
  dailyUnit?: string; // 'ml' | 'L' | 'стр' | 'мин' | 'шагов' | 'mg'

  // Точный лог выполнений: { '2026-08-30': '2026-08-30T14:23:05.123Z' }
  // Фиксирует КОГДА (дата+время) выполнена привычка/задача —
  // для «Моих Задач», уведомлений и персональной аналитики ИИ.
  completionLog?: Record<string, string>;

  // --- EXTENSIONS (New) ---
  extension?: {
    type: 'reading' | 'tracker' | 'supplements' | 'skincare';
    data: {
      books?: Book[];           // For 'reading'
      supplements?: Supplement[]; // For 'supplements'
      skincare?: SkincareProduct[]; // For 'skincare'
    }
  };

  // --- SUB-ITEMS (Kanban-style) ---
  items?: SubItem[];

  // --- KANBAN ---
  columnId?: string; // For Kanban board

  // --- IDENTITY SYSTEM ---
  identityId?: string; // Link habit to a specific identity

  // --- QUICK TAGS ---
  tags?: string[];

  // --- PHOTO JOURNAL ---
  photoJournal?: PhotoEntry[];
}

// ===== PHOTO JOURNAL =====
export interface PhotoEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  note?: string;       // Short caption
  imageData: string;   // base64 data URL (compressed thumbnail)
  createdAt: string;   // ISO timestamp
}

// ===== SUB-ITEM SYSTEM =====
export interface SubItemNote {
  id: string;
  content: string;
  emoji?: string; // 💡📝🔥⭐
  createdAt: string;
  // NEW: Image support
  imageUrl?: string;
  imageCaption?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order?: number;
}

export interface SubItem {
  id: string;
  name: string;
  status: 'queued' | 'active' | 'done';
  progress?: number;  // 0-100
  notes: SubItemNote[];
  createdAt: string;
  // Checklist support
  checklist?: ChecklistItem[];
  // Nested sub-items (tree)
  children?: SubItem[];
  // Priority
  priority?: 'low' | 'medium' | 'high';
  // Deadline
  dueDate?: string;
  // Link URL
  linkUrl?: string;
}

// ===== KANBAN SYSTEM =====
export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  order: number;
}

// ===== HABIT NETWORK GRAPH =====
export interface HabitConnection {
  id: string;
  sourceId: string;  // Habit that triggers
  targetId: string;  // Habit that follows
  type: 'triggers' | 'enables' | 'blocks' | 'related';
  strength: number;  // 1-5 (visual line thickness)
}

export const CONNECTION_TYPES = {
  triggers: { label: { ru: 'Запускает', en: 'Triggers' }, color: '#22c55e' },
  enables: { label: { ru: 'Помогает', en: 'Enables' }, color: '#3b82f6' },
  blocks: { label: { ru: 'Мешает', en: 'Blocks' }, color: '#ef4444' },
  related: { label: { ru: 'Связано', en: 'Related' }, color: '#a855f7' },
} as const;

// ===== GOALS & MILESTONES SYSTEM =====

export interface Milestone {
  id: string;
  title: string;
  targetDate?: string;  // ISO date
  isCompleted: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  color: string;
  targetDate?: string;        // Deadline
  milestones: Milestone[];
  linkedHabitIds: string[];   // Connected habits
  createdAt: string;
  completedAt?: string;
  archived?: boolean;
}

// Goal progress calculation helper
export const calculateGoalProgress = (goal: Goal, habits: { id: string; completedDates: string[] }[]): number => {
  const totalItems = goal.milestones.length + goal.linkedHabitIds.length;
  if (totalItems === 0) return 0;

  // Count completed milestones
  const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;

  // Count habits with good streak (7+ days)
  const habitsWithStreak = goal.linkedHabitIds.filter(hid => {
    const habit = habits.find(h => h.id === hid);
    return habit && habit.completedDates.length >= 7;
  }).length;

  const completedItems = completedMilestones + habitsWithStreak;
  return Math.round((completedItems / totalItems) * 100);
};

// Goal preset emojis
export const GOAL_EMOJIS = ['🎯', '🏆', '💪', '📚', '💰', '🏃', '🧘', '✍️', '🎨', '🚀', '⭐', '🌟', '💎', '🔥', '🌱', '🏅'];

// Goal preset colors
export const GOAL_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];


export interface HabitAnalysis {
  overallScore: number;
  streakAnalysis: string;
  motivationalMessage: string;
  suggestions: string[];
}

export interface FocusRecommendation {
  habitId: string | null;
  reasoning: string;
  estimatedDuration: number; // in minutes
  matchScore: number; // 0-100
  actionType: 'do' | 'rest' | 'plan';
  customTitle?: string;
}

export interface DeepAnalysis {
  id: string;
  date: string;
  insight: string;
  language: 'ru' | 'en';
}

export interface UserSettings {
  themeId: string;
  language: 'ru' | 'en';
  accentColor: string | null;
  aiSuggestionCount: number;
  viewMode: 'grid' | 'compact' | 'kanban' | 'matrix' | 'list' | 'calendar' | 'graph';
  voiceId: string;
  isWakeWordEnabled: boolean;
  displayOptions: {
    showStreak: boolean;
    showPercentage: boolean;
    showTotal: boolean;
  };
  // Time-Based Focus Mode
  timeFocusMode?: boolean;  // Highlight current habit, dim others
  // Push Notifications
  notificationsEnabled?: boolean;
  // Daily Visualization (Mind Movie auto-show)
  dailyVisualizationEnabled?: boolean;
  // Avatar settings
  avatarType?: 'emoji' | 'photo' | 'preset' | 'google';  // Avatar source type
  avatarValue?: string;  // Emoji character, photo URL, or preset ID
}

// ===== MIND MOVIE - FUTURE SELF VISUALIZATION =====

export interface UserIdentity {
  id: string;                  // Unique ID for this vision
  targetIdentity: string;       // "Athlete", "Reader", "Entrepreneur"
  futureImageUrl?: string;      // Uploaded or AI-generated image
  qualities: string[];          // Max 3 key qualities
  affirmation?: string;         // Daily mantra/affirmation
  createdAt: string;            // ISO date
  lastViewedAt?: string;        // Track when user last saw visualization
}

// Preset identity templates
export const IDENTITY_PRESETS: {
  id: string;
  emoji: string;
  label: { ru: string; en: string };
  qualities: { ru: string[]; en: string[] };
  affirmation: { ru: string; en: string };
}[] = [
    {
      id: 'athlete',
      emoji: '🏃',
      label: { ru: 'Атлет', en: 'Athlete' },
      qualities: {
        ru: ['Дисциплина', 'Выносливость', 'Сила'],
        en: ['Discipline', 'Endurance', 'Strength']
      },
      affirmation: {
        ru: 'Я становлюсь сильнее каждый день',
        en: 'I become stronger every day'
      }
    },
    {
      id: 'reader',
      emoji: '📚',
      label: { ru: 'Читатель', en: 'Reader' },
      qualities: {
        ru: ['Мудрость', 'Любопытство', 'Фокус'],
        en: ['Wisdom', 'Curiosity', 'Focus']
      },
      affirmation: {
        ru: 'Знания — моя суперсила',
        en: 'Knowledge is my superpower'
      }
    },
    {
      id: 'entrepreneur',
      emoji: '🚀',
      label: { ru: 'Предприниматель', en: 'Entrepreneur' },
      qualities: {
        ru: ['Решительность', 'Креативность', 'Упорство'],
        en: ['Decisiveness', 'Creativity', 'Persistence']
      },
      affirmation: {
        ru: 'Я создаю свою реальность',
        en: 'I create my own reality'
      }
    },
    {
      id: 'mindful',
      emoji: '🧘',
      label: { ru: 'Осознанный', en: 'Mindful' },
      qualities: {
        ru: ['Спокойствие', 'Присутствие', 'Благодарность'],
        en: ['Calm', 'Presence', 'Gratitude']
      },
      affirmation: {
        ru: 'Я выбираю покой в каждый момент',
        en: 'I choose peace in every moment'
      }
    },
    {
      id: 'creator',
      emoji: '🎨',
      label: { ru: 'Творец', en: 'Creator' },
      qualities: {
        ru: ['Креативность', 'Смелость', 'Аутентичность'],
        en: ['Creativity', 'Courage', 'Authenticity']
      },
      affirmation: {
        ru: 'Мои идеи ценны и уникальны',
        en: 'My ideas are valuable and unique'
      }
    },
    {
      id: 'leader',
      emoji: '👑',
      label: { ru: 'Лидер', en: 'Leader' },
      qualities: {
        ru: ['Ответственность', 'Эмпатия', 'Видение'],
        en: ['Responsibility', 'Empathy', 'Vision']
      },
      affirmation: {
        ru: 'Я вдохновляю других своим примером',
        en: 'I inspire others by my example'
      }
    }
  ];

export interface AppTheme {
  id: string;
  labels: { ru: string, en: string };
  isDark: boolean;
  // Glassmorphism 2026
  isGlass?: boolean;
  glassBlur?: string; // e.g., '20px'
  glassOpacity?: number; // 0.08 - 0.6
  backgroundGradient?: string; // for Aurora-style themes
  colors: {
    background: string;
    surface: string;
    surfaceHighlight: string;
    textPrimary: string;
    textSecondary: string;
    brand: string;
    borderSubtle: string;
  }
}

export const THEMES: AppTheme[] = [
  // ===== APPLE SYSTEM THEMES =====
  // Чистые системные палитры Apple: полный контраст, ноль шума.
  {
    id: 'daylight',
    labels: { ru: 'Дневной', en: 'Daylight' },
    isDark: false,
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHighlight: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      brand: '#6366f1',
      borderSubtle: 'rgba(99, 102, 241, 0.08)'
    }
  },
  {
    id: 'ios-light',
    labels: { ru: 'Apple Light', en: 'Apple Light' },
    isDark: false,
    isGlass: true,
    glassBlur: '20px',
    glassOpacity: 0.72,
    colors: {
      background: '#f2f2f7',
      surface: 'rgba(255, 255, 255, 0.72)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.9)',
      textPrimary: '#1c1c1e',
      textSecondary: '#8e8e93',
      brand: '#007aff',
      borderSubtle: 'rgba(0, 0, 0, 0.04)'
    }
  },
  {
    id: 'ios-dark',
    labels: { ru: 'Apple Dark', en: 'Apple Dark' },
    isDark: true,
    isGlass: true,
    glassBlur: '20px',
    glassOpacity: 0.72,
    colors: {
      background: '#000000',
      surface: 'rgba(28, 28, 30, 0.72)',
      surfaceHighlight: 'rgba(44, 44, 46, 0.72)',
      textPrimary: '#ffffff',
      textSecondary: '#8e8e93',
      brand: '#0a84ff',
      borderSubtle: 'rgba(255, 255, 255, 0.08)'
    }
  },
  // ===== LIQUID GLASS (iOS 26) =====
  {
    id: 'frosted-glass',
    labels: { ru: 'Жидкое стекло', en: 'Liquid Glass' },
    isDark: false,
    isGlass: true,
    glassBlur: '60px',
    glassOpacity: 0.35,
    backgroundGradient: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4f7 25%, #e0e7f0 50%, #dce8f4 75%, #edf2f8 100%)',
    colors: {
      background: '#edf2f8',
      surface: 'rgba(255, 255, 255, 0.32)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.55)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      brand: '#6366f1',
      borderSubtle: 'rgba(255, 255, 255, 0.45)'
    }
  },
  {
    id: 'liquid-glass-dark',
    labels: { ru: 'Жидкое стекло (тёмное)', en: 'Liquid Glass Dark' },
    isDark: true,
    isGlass: true,
    glassBlur: '60px',
    glassOpacity: 0.25,
    backgroundGradient: 'linear-gradient(135deg, #0a0a1a 0%, #111128 25%, #0d0d20 50%, #0f0f24 75%, #0a0a18 100%)',
    colors: {
      background: '#0a0a18',
      surface: 'rgba(255, 255, 255, 0.06)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.10)',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      brand: '#818cf8',
      borderSubtle: 'rgba(255, 255, 255, 0.08)'
    }
  },
  // ===== ПРЕМИУМ АКЦЕНТНЫЕ (тёмные, откалиброваны по Apple system colors) =====
  {
    id: 'obsidian-gold',
    labels: { ru: 'Обсидиан и Золото', en: 'Obsidian Gold' },
    isDark: true,
    colors: {
      background: '#0c0a09',
      surface: '#1c1917',
      surfaceHighlight: '#292524',
      textPrimary: '#fafaf9',
      textSecondary: '#a8a29e',
      brand: '#f59e0b',
      borderSubtle: 'rgba(245, 158, 11, 0.15)'
    }
  },
  {
    id: 'midnight',
    labels: { ru: 'Полночь', en: 'Midnight' },
    isDark: true,
    colors: {
      background: '#060a14',
      surface: '#0d1526',
      surfaceHighlight: '#16213c',
      textPrimary: '#eaf1ff',
      textSecondary: '#7d94bd',
      brand: '#38bdf8',
      borderSubtle: 'rgba(56, 189, 248, 0.10)'
    }
  },
  {
    id: 'forest',
    labels: { ru: 'Лес', en: 'Forest' },
    isDark: true,
    colors: {
      background: '#0a1410',
      surface: '#122019',
      surfaceHighlight: '#1b2f24',
      textPrimary: '#e9f7ee',
      textSecondary: '#7fae92',
      brand: '#4ade80',
      borderSubtle: 'rgba(74, 222, 128, 0.12)'
    }
  },
  {
    id: 'lavender',
    labels: { ru: 'Лаванда', en: 'Lavender' },
    isDark: true,
    colors: {
      background: '#100c1c',
      surface: '#191330',
      surfaceHighlight: '#241d40',
      textPrimary: '#f0ecfe',
      textSecondary: '#a695cf',
      brand: '#a78bfa',
      borderSubtle: 'rgba(167, 139, 250, 0.12)'
    }
  },
  {
    id: 'rosewood',
    labels: { ru: 'Сандровое Дерево', en: 'Rosewood' },
    isDark: true,
    colors: {
      background: '#160c10',
      surface: '#23141b',
      surfaceHighlight: '#2f1d26',
      textPrimary: '#fdeef4',
      textSecondary: '#c08da1',
      brand: '#fb7185',
      borderSubtle: 'rgba(251, 113, 133, 0.12)'
    }
  }
];

// Map for AI to know color names
export const COLOR_PALETTE = [
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#d946ef', name: 'Fuchsia' },
  { hex: '#f43f5e', name: 'Rose' },
  { hex: '#64748b', name: 'Slate' },
  { hex: '#71717a', name: 'Zinc' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#a855f7', name: 'Purple' },
  { hex: '#111827', name: 'Black' },
];

export const AVAILABLE_COLORS = COLOR_PALETTE.map(c => c.hex);

// Gradient options for accent colors
export const ACCENT_GRADIENTS = [
  {
    id: 'gemini',
    name: 'Gemini Rainbow',
    gradient: 'linear-gradient(135deg, #4285f4 0%, #9b72cb 50%, #d96570 100%)',
    colors: ['#4285f4', '#9b72cb', '#d96570']
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
    colors: ['#8b5cf6', '#d946ef']
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    colors: ['#3b82f6', '#06b6d4']
  },
  {
    id: 'emerald',
    name: 'Emerald',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    colors: ['#10b981', '#34d399']
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
    colors: ['#f97316', '#f43f5e']
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    colors: ['#ec4899', '#f472b6']
  },
];

// Helper to get gradient CSS from accentColor setting
export const getAccentGradient = (accentColor: string | null): { isGradient: boolean; gradient: string; colors: string[]; primary: string } => {
  const defaultGradient = ACCENT_GRADIENTS[0]; // Gemini as default

  if (!accentColor) {
    return {
      isGradient: true,
      gradient: defaultGradient.gradient,
      colors: defaultGradient.colors,
      primary: defaultGradient.colors[0]
    };
  }

  if (accentColor.startsWith('gradient-')) {
    const gradientId = accentColor.replace('gradient-', '');
    const found = ACCENT_GRADIENTS.find(g => g.id === gradientId);
    if (found) {
      return {
        isGradient: true,
        gradient: found.gradient,
        colors: found.colors,
        primary: found.colors[0]
      };
    }
  }

  // Solid color
  return {
    isGradient: false,
    gradient: accentColor,
    colors: [accentColor],
    primary: accentColor
  };
};

export const ICON_CATEGORIES = {
  'General': ['Activity', 'Check', 'Star', 'Zap', 'Flame', 'Trophy', 'Target', 'Flag', 'Bell', 'Clock', 'Calendar'],
  'Health': ['Heart', 'Droplet', 'GlassWater', 'Moon', 'BedDouble', 'Sun', 'Coffee', 'Utensils', 'Apple', 'Brain', 'Smile', 'Bath', 'Thermometer'],
  'Fitness': ['Dumbbell', 'Bike', 'Footprints', 'Timer', 'Watch', 'Mountain', 'Navigation', 'Map', 'Bicycle', 'Leaf'],
  'Nature': ['Leaf', 'Flower', 'TreeDeciduous', 'Sunrise', 'Sunset', 'Cloud', 'Umbrella', 'Wind', 'Tent'],
  'Productivity': ['Book', 'Briefcase', 'Code', 'Monitor', 'Laptop', 'Smartphone', 'Calculator', 'PenTool', 'FileText', 'Folder', 'Archive', 'Layers'],
  'Finance': ['DollarSign', 'CreditCard', 'Wallet', 'PiggyBank', 'TrendingUp', 'BarChart', 'Percent'],
  'Creative': ['Palette', 'Brush', 'Scissors', 'Music', 'Headphones', 'Camera', 'Image', 'Video', 'Gamepad', 'Gamepad2'],
  'Lifestyle': ['ShoppingBag', 'Gift', 'Plane', 'Rocket', 'Car', 'Bus', 'Train', 'Home', 'Anchor', 'Key', 'Shirt'],
  'Social': ['Users', 'User', 'MessageCircle', 'Phone', 'Mail', 'Share2']
};

export const EMOJIS = [
  '😀', '😂', '🥰', '😎', '🤔', '😴', '🤯', '🥳', '🧘', '💆', '💇',
  '💪', '🧠', '🫀', '👀', '🦵', '🦶',
  '🔥', '💧', '☀️', '🌙', '⭐', '🌈', '🌊', '🌱', '🌵', '🌲', '🍂', '🌸', '🍄',
  '🐶', '🐱', '🐭', '🦊', '🐻', '🐼', '🦁', '🐮', '🐷', '🐸', '🐔', '🐧', '🦉', '🦋',
  '🍏', '🥑', '🥕', '🌽', '🍟', '🍕', '🍔', '🥗', '🍙', '🍦', '🍩', '🍪', '🍫', '🍷', '🍺', '☕', '🥤',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '🥅', '🎯', '⛳', '⛸', '🎣', '🤿', '🎿', '🛷', '🧘‍♀️', '🏄', '🏊', '🏋️', '🚴',
  '🚗', '🚕', '🚙', '🚌', '🏎', '🚓', '🚑', '🚒', '🚜', '🚲', '🛴', '🛵', '🛵', '🏎', '🚅', '✈️', '🚀', '🛸', '⛺', '🏠', '🏥', '🏦', '🏫',
  '⌚', '📱', '💻', '⌨', '🖥', '🖨', '🖱', '📷', '📹', '📼', '🔍', '💡', '🔦', '📕', '📚', '💰', '💵', '💳', '💎', '⚖', '🔧', '🔨', '💊', '💉', '🧬', '🔭', '🧹', '🧺', '🧻', '🧼', '🧽',
  '❤', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💣', '💬', '👁‍🗨', '🗨', '🗯', '💭', '💤', '🛑', '⛔', '🚫'
];

export const CATEGORIES: string[] = [
  'Здоровье', 'Спорт', 'Продуктивность', 'Творчество', 'Финансы', 'Осознанность', 'Обучение', 'Социальное', 'Карьера', 'Отношения', 'Дом', 'Хобби', 'Другое'
];

// --- QUICK TAGS ---
export const TAG_PRESETS: { emoji: string; label: { ru: string; en: string } }[] = [
  { emoji: '☀️', label: { ru: 'Утро', en: 'Morning' } },
  { emoji: '🌙', label: { ru: 'Вечер', en: 'Evening' } },
  { emoji: '💪', label: { ru: 'Спорт', en: 'Fitness' } },
  { emoji: '🧠', label: { ru: 'Разум', en: 'Mind' } },
  { emoji: '❤️', label: { ru: 'Здоровье', en: 'Health' } },
  { emoji: '📚', label: { ru: 'Учёба', en: 'Study' } },
  { emoji: '💰', label: { ru: 'Финансы', en: 'Finance' } },
  { emoji: '🏠', label: { ru: 'Дом', en: 'Home' } },
  { emoji: '🎨', label: { ru: 'Творчество', en: 'Creative' } },
  { emoji: '🧘', label: { ru: 'Осознанность', en: 'Mindful' } },
  { emoji: '⚡', label: { ru: 'Энергия', en: 'Energy' } },
  { emoji: '🔥', label: { ru: 'Челлендж', en: 'Challenge' } },
];

// --- PRESET TEMPLATES ---
export const HABIT_TEMPLATES = [
  { name: 'Выпить воды', nameEn: 'Drink Water', icon: 'GlassWater', color: '#3b82f6', category: 'Здоровье', targetCount: 2000 },
  { name: 'Чтение', nameEn: 'Read Book', icon: 'Book', color: '#8b5cf6', category: 'Обучение', targetCount: 20 },
  { name: 'Тренировка', nameEn: 'Workout', icon: 'Dumbbell', color: '#f97316', category: 'Спорт', targetCount: 45 },
  { name: 'Медитация', nameEn: 'Meditate', icon: 'Moon', color: '#6366f1', category: 'Осознанность', targetCount: 15 },
  { name: 'Прогулка', nameEn: 'Walk', icon: 'Footprints', color: '#22c55e', category: 'Здоровье', targetCount: 5000 },
  { name: 'Бег', nameEn: 'Run', icon: 'Activity', color: '#ef4444', category: 'Спорт', targetCount: 5 },
  { name: 'Сон 8ч', nameEn: 'Sleep 8h', icon: 'BedDouble', color: '#0f172a', category: 'Здоровье', targetCount: 8 },
  { name: 'Учить язык', nameEn: 'Learn Lang', icon: 'Globe', color: '#06b6d4', category: 'Обучение', targetCount: 30 },
  { name: 'Без сахара', nameEn: 'No Sugar', icon: 'Apple', color: '#84cc16', category: 'Здоровье', targetCount: 1 },
  { name: 'Бюджет', nameEn: 'Budget', icon: 'Wallet', color: '#10b981', category: 'Финансы', targetCount: 1 },
  { name: 'Кодинг', nameEn: 'Coding', icon: 'Code', color: '#111827', category: 'Карьера', targetCount: 60 },
  { name: 'Дневник', nameEn: 'Journal', icon: 'PenTool', color: '#d946ef', category: 'Осознанность', targetCount: 1 },
  { name: 'Уборка', nameEn: 'Cleaning', icon: 'Home', color: '#f43f5e', category: 'Дом', targetCount: 15 },
  { name: 'Витамины', nameEn: 'Vitamins', icon: 'Pill', color: '#eab308', category: 'Здоровье', targetCount: 1 },
];

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