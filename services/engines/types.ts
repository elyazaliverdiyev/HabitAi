/**
 * =========================================================
 * HABITAI ENGINE TYPES
 * Общие типы для всех 7 движков приложения
 * =========================================================
 */

// ── Базовый срез привычки для движков (не зависит от полного Habit) ──
export interface HabitSlice {
  id: string;
  name: string;
  completedDates: string[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  type?: 'habit' | 'task';
  time?: string;
  isKeystone?: boolean;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
}

// ── Временные окна дня (Circadian Engine) ──
export type DayWindow =
  | 'tahajjud'   // 03:00 – 05:00  баракатное время
  | 'fajr'       // 05:00 – 07:30  рассвет, высший фокус
  | 'duha'       // 07:30 – 12:00  продуктивное утро
  | 'zuhr'       // 12:00 – 15:00  полдень, средний фокус
  | 'asr'        // 15:00 – 18:30  вторая волна энергии
  | 'maghrib'    // 18:30 – 21:00  переход к вечеру
  | 'isha'       // 21:00 – 23:00  рефлексия, мухасаба
  | 'night';     // 23:00 – 03:00  ночь, восстановление

// ── Результат Momentum Score ──
export interface MomentumScore {
  score: number;          // 0–100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  label: { ru: string; en: string };
  trend: 'rising' | 'stable' | 'declining';
  consecutiveActive: number;   // дней подряд хоть что-то сделано
  last30Completion: number;    // % выполнения за 30 дней
  neverMissTwiceAlert: boolean; // сегодня пропустил и вчера тоже?
}

// ── Намерение дня (Intention Engine) ──
export interface DailyIntention {
  date: string;           // YYYY-MM-DD
  text: string;           // "Сегодня я сфокусируюсь на..."
  completedAt?: string;   // ISO timestamp когда отметил выполненным
  reflectionNote?: string;// вечерний ответ
}

// ── Мухасаба (еженедельный аудит) ──
export interface MuhasabaSession {
  id: string;
  weekStart: string;      // YYYY-MM-DD (понедельник)
  q1_worked: string;      // что получилось
  q2_blocked: string;     // что мешало
  q3_change: string;      // что изменю
  createdAt: string;
  aiSummary?: string;     // AI-резюме недели
}

// ── Минимальный вариант привычки (MVH) ──
export interface MinimalVariant {
  habitId: string;
  description: string;   // "5 минут ходьбы вместо бега"
  durationMinutes?: number;
}

// ── Запись благодарности ──
export interface GratitudeEntry {
  id: string;
  date: string;           // YYYY-MM-DD
  items: string[];        // 3 вещи за которые благодарен
  mood?: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

// ── Партнёр по ответственности ──
export interface AccountabilityPartner {
  userId: string;
  partnerUserId: string;
  partnerName: string;
  partnerAvatar?: string;
  notifyOnMiss: boolean;    // уведомить если пропустил 2+ дня
  sharedHabitIds: string[]; // какие привычки видит партнёр
  createdAt: string;
}

// ── Умное расписание дня (выход Circadian Engine) ──
export interface SmartSchedule {
  window: DayWindow;
  windowLabel: { ru: string; en: string };
  windowEmoji: string;
  suggestedHabits: HabitSlice[];  // привычки для этого окна
  isBarakahWindow: boolean;       // особо благоприятное время
  message: { ru: string; en: string };
}
