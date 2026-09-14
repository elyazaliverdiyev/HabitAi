/**
 * =========================================================
 * ENGINES BARREL EXPORT
 * Единая точка входа для всех 7 движков HabitAI
 * =========================================================
 */

// Types
export type {
  HabitSlice,
  DayWindow,
  MomentumScore,
  DailyIntention,
  MuhasabaSession,
  MinimalVariant,
  GratitudeEntry,
  AccountabilityPartner,
  SmartSchedule,
} from './types';

// ── Engine 1: Circadian (Временны́е окна дня) ──────────────────────────────
export {
  getCurrentWindow,
  getWindowConfig,
  isBarakahTime,
  minutesToNextWindow,
  getSmartSchedule,
  getSmartGreeting,
} from './circadian';
export type { SmartGreeting } from './circadian';

// ── Engine 2: Momentum (Импульс вместо стриков) ───────────────────────────
export {
  calcMomentum,
  calcOverallMomentum,
  getNeverMissTwiceAlerts,
} from './momentum';
export type { OverallMomentum } from './momentum';

// ── Engine 3: Intention (Ниятъ) ───────────────────────────────────────────
export {
  createIntention,
  attachReflection,
  getIntentionStatus,
  getMorningPrompt,
  getEveningPrompt,
  calcIntentionStreak,
  calcIntentionInsight,
} from './intention';
export type {
  IntentionStatus,
  IntentionPrompt,
  ReflectionPrompt,
  IntentionInsight,
} from './intention';

// ── Engine 4: Muhasaba (Еженедельный самоотчёт) ───────────────────────────
export {
  getWeekStart,
  isMuhasabaTime,
  hasCurrentWeekMuhasaba,
  getMuhasabaQuestions,
  calcWeekStats,
  createMuhasabaSession,
  calcMuhasabaStreak,
} from './muhasaba';
export type {
  MuhasabaQuestions,
  WeekStats,
} from './muhasaba';

// ── Engine 5: MVH (Минимальный вариант привычки) ──────────────────────────
export {
  getMinimalVariant,
  assessHardDay,
  buildMVHList,
} from './mvh';
export type {
  HardDayAssessment,
  MVHOption,
} from './mvh';

// ── Engine 6: Gratitude (Шукр) ────────────────────────────────────────────
export {
  createGratitudeEntry,
  getGratitudePrompt,
  calcGratitudeStreak,
  calcGratitudeInsight,
  shouldPromptGratitude,
} from './gratitude';
export type { GratitudePrompt, GratitudeInsight } from './gratitude';

// ── Engine 7: Accountability (Социальная Умма) ────────────────────────────
export {
  buildPartnerReport,
  createInvite,
  buildWeeklySummary,
} from './accountability';
export type {
  PartnershipStatus,
  PartnerDailyReport,
  AccountabilityInvite,
  WeeklyPartnerSummary,
} from './accountability';
