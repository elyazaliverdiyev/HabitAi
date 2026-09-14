/**
 * =========================================================
 * INTENTION ENGINE
 * Движок намерений (Ниятъ).
 *
 * Основа: «Поистине, дела оцениваются по намерениям» (Бухари, Муслим)
 * Нейронаука: постановка намерения активирует префронтальную кору
 * и повышает вероятность выполнения действия на 40–70%.
 *
 * Хранит DailyIntention в Supabase через ai_insights или отдельную таблицу.
 * Этот модуль — только логика, без React-зависимостей.
 * =========================================================
 */

import type { DailyIntention } from './types';

// ── Утилиты ────────────────────────────────────────────────────────────────

function toDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Создание намерения ─────────────────────────────────────────────────────

export function createIntention(text: string, date: Date = new Date()): DailyIntention {
  return {
    date: toDateStr(date),
    text: text.trim(),
  };
}

// ── Вечерняя рефлексия ─────────────────────────────────────────────────────

export function attachReflection(
  intention: DailyIntention,
  note: string
): DailyIntention {
  return {
    ...intention,
    reflectionNote: note.trim(),
    completedAt: new Date().toISOString(),
  };
}

// ── Статус намерения ───────────────────────────────────────────────────────

export type IntentionStatus =
  | 'not_set'       // намерение не поставлено
  | 'set'           // поставлено, ещё не отражено
  | 'reflected'     // поставлено + вечерняя рефлексия есть
  | 'missed';       // день прошёл, намерения не было

export function getIntentionStatus(
  intention: DailyIntention | null,
  now: Date = new Date()
): IntentionStatus {
  if (!intention) {
    // Если вечер — пропуск дня
    return now.getHours() >= 21 ? 'missed' : 'not_set';
  }
  if (intention.reflectionNote) return 'reflected';
  return 'set';
}

// ── Утренний промпт (что спросить пользователя) ────────────────────────────

export interface IntentionPrompt {
  question: { ru: string; en: string };
  placeholder: { ru: string; en: string };
  tip: { ru: string; en: string };
}

export function getMorningPrompt(): IntentionPrompt {
  return {
    question: {
      ru: 'Что ты намереваешься сделать сегодня?',
      en: 'What do you intend to accomplish today?',
    },
    placeholder: {
      ru: 'Сегодня я сосредоточусь на...',
      en: 'Today I will focus on...',
    },
    tip: {
      ru: '«Поистине, дела оцениваются по намерениям» — одно предложение достаточно',
      en: '"Indeed, actions are by intentions" — one sentence is enough',
    },
  };
}

// ── Вечерний промпт ────────────────────────────────────────────────────────

export interface ReflectionPrompt {
  question: { ru: string; en: string };
  placeholder: { ru: string; en: string };
  intentionEcho: string; // повторяем намерение утра
}

export function getEveningPrompt(intention: DailyIntention): ReflectionPrompt {
  return {
    question: {
      ru: 'Ты сделал то, что намеревался утром?',
      en: 'Did you do what you intended this morning?',
    },
    placeholder: {
      ru: 'Что получилось, что нет и почему...',
      en: 'What worked, what didn\'t and why...',
    },
    intentionEcho: intention.text,
  };
}

// ── Серия намерений ────────────────────────────────────────────────────────

/**
 * Считает сколько дней подряд пользователь ставил намерения.
 * Используется для мотивационного показателя.
 */
export function calcIntentionStreak(
  intentions: DailyIntention[],
  now: Date = new Date()
): number {
  const byDate = new Map(intentions.map(i => [i.date, i]));
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);

    if (byDate.has(ds)) {
      streak++;
    } else if (i > 0) {
      // Позволяем пропустить сегодня (ещё утро)
      break;
    }
  }

  return streak;
}

// ── Insight: соответствие намерения результатам привычек ──────────────────

export interface IntentionInsight {
  daysWithIntention: number;
  daysWithReflection: number;
  avgCompletionOnIntentionDays: number;  // % привычек выполнено когда было намерение
  avgCompletionOnOtherDays: number;      // % привычек выполнено без намерения
  intentionBoostPercent: number;         // разница в %
}

/**
 * Считает насколько намерения коррелируют с выполнением привычек.
 * Позволяет показать пользователю: «В дни с намерением ты выполняешь X% больше».
 */
export function calcIntentionInsight(
  intentions: DailyIntention[],
  habits: { completedDates: string[] }[],
  lookbackDays = 30
): IntentionInsight {
  const now = new Date();
  const intentionDates = new Set(intentions.map(i => i.date));
  const reflectionDates = new Set(
    intentions.filter(i => i.reflectionNote).map(i => i.date)
  );

  let withIntentionTotal = 0;
  let withIntentionCompleted = 0;
  let withoutIntentionTotal = 0;
  let withoutIntentionCompleted = 0;

  for (let i = 1; i <= lookbackDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const completedOnDay = habits.filter(h => h.completedDates.includes(ds)).length;
    const totalHabits = habits.length;

    if (intentionDates.has(ds)) {
      withIntentionTotal += totalHabits;
      withIntentionCompleted += completedOnDay;
    } else {
      withoutIntentionTotal += totalHabits;
      withoutIntentionCompleted += completedOnDay;
    }
  }

  const avgWith = withIntentionTotal > 0
    ? Math.round((withIntentionCompleted / withIntentionTotal) * 100) : 0;
  const avgWithout = withoutIntentionTotal > 0
    ? Math.round((withoutIntentionCompleted / withoutIntentionTotal) * 100) : 0;

  return {
    daysWithIntention: intentionDates.size,
    daysWithReflection: reflectionDates.size,
    avgCompletionOnIntentionDays: avgWith,
    avgCompletionOnOtherDays: avgWithout,
    intentionBoostPercent: avgWith - avgWithout,
  };
}
