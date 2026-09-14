/**
 * =========================================================
 * GRATITUDE ENGINE (ШУКР)
 * Движок благодарности.
 *
 * «Если вы будете благодарны, Я прибавлю вам» (Коран 14:7)
 *
 * Нейронаука: благодарность активирует выброс дофамина и серотонина.
 * Исследования UC Berkeley: ведение дневника благодарности на 25%
 * улучшает субъективное благополучие и связано с более высоким
 * выполнением привычек.
 *
 * Движок отслеживает корреляцию благодарности → выполнение привычек.
 * =========================================================
 */

import type { GratitudeEntry } from './types';

// ── Утилиты ────────────────────────────────────────────────────────────────

function toDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId(): string {
  return `gratitude_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Создание записи ────────────────────────────────────────────────────────

export function createGratitudeEntry(
  items: string[],
  mood?: 1 | 2 | 3 | 4 | 5,
  date: Date = new Date()
): GratitudeEntry {
  const cleaned = items.map(i => i.trim()).filter(Boolean).slice(0, 3);

  return {
    id: generateId(),
    date: toDateStr(date),
    items: cleaned,
    mood,
    createdAt: date.toISOString(),
  };
}

// ── Промпты для вечерней благодарности ────────────────────────────────────

export interface GratitudePrompt {
  title: { ru: string; en: string };
  instruction: { ru: string; en: string };
  placeholders: { ru: string; en: string }[];
  ayah: { ru: string; en: string; ref: string };
}

export function getGratitudePrompt(): GratitudePrompt {
  return {
    title: {
      ru: '🤲 Шукр — Благодарность',
      en: '🤲 Shukr — Gratitude',
    },
    instruction: {
      ru: 'Три вещи, за которые ты благодарен сегодня',
      en: 'Three things you are grateful for today',
    },
    placeholders: [
      { ru: 'Я благодарен за...', en: 'I am grateful for...' },
      { ru: 'Сегодня хорошо было...', en: 'Today was good because...' },
      { ru: 'Я ценю...', en: 'I appreciate...' },
    ],
    ayah: {
      ru: '«Если вы будете благодарны, Я прибавлю вам»',
      en: '"If you are grateful, I will surely increase you"',
      ref: 'Коран 14:7 / Quran 14:7',
    },
  };
}

// ── Серия благодарности ────────────────────────────────────────────────────

export function calcGratitudeStreak(
  entries: GratitudeEntry[],
  now: Date = new Date()
): number {
  const byDate = new Set(entries.map(e => e.date));
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);

    if (byDate.has(ds)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

// ── Корреляция: благодарность → выполнение привычек ──────────────────────

export interface GratitudeInsight {
  daysWithGratitude: number;
  avgCompletionOnGratitudeDays: number;
  avgCompletionOnOtherDays: number;
  boostPercent: number;
  avgMood: number | null;
  message: { ru: string; en: string } | null;
}

/**
 * Главный инсайт: «В дни благодарности ты выполняешь X% больше привычек».
 * Мощный мотивационный факт на основе реальных данных пользователя.
 */
export function calcGratitudeInsight(
  entries: GratitudeEntry[],
  habits: { completedDates: string[] }[],
  lookbackDays = 30
): GratitudeInsight {
  const now = new Date();
  const gratitudeDates = new Set(entries.map(e => e.date));

  let withGratTotal = 0, withGratComp = 0;
  let withoutGratTotal = 0, withoutGratComp = 0;

  for (let i = 1; i <= lookbackDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);

    const comp = habits.filter(h => h.completedDates.includes(ds)).length;
    const total = habits.length;

    if (gratitudeDates.has(ds)) {
      withGratTotal += total;
      withGratComp += comp;
    } else {
      withoutGratTotal += total;
      withoutGratComp += comp;
    }
  }

  const avgWith = withGratTotal > 0
    ? Math.round((withGratComp / withGratTotal) * 100) : 0;
  const avgWithout = withoutGratTotal > 0
    ? Math.round((withoutGratComp / withoutGratTotal) * 100) : 0;

  const boost = avgWith - avgWithout;

  // Средний mood
  const moodEntries = entries.filter(e => e.mood !== undefined);
  const avgMood = moodEntries.length > 0
    ? Math.round((moodEntries.reduce((s, e) => s + e.mood!, 0) / moodEntries.length) * 10) / 10
    : null;

  // Сообщение только если данных достаточно
  const message = entries.length >= 5 && boost > 0
    ? {
        ru: `В дни благодарности ты выполняешь на ${boost}% больше привычек 🌟`,
        en: `On gratitude days you complete ${boost}% more habits 🌟`,
      }
    : entries.length >= 5 && boost <= 0
    ? {
        ru: 'Продолжай практику благодарности — данные собираются',
        en: 'Keep practicing gratitude — data is being collected',
      }
    : null;

  return {
    daysWithGratitude: gratitudeDates.size,
    avgCompletionOnGratitudeDays: avgWith,
    avgCompletionOnOtherDays: avgWithout,
    boostPercent: boost,
    avgMood,
    message,
  };
}

// ── Нужно ли сейчас напомнить о благодарности? ───────────────────────────

export function shouldPromptGratitude(
  entries: GratitudeEntry[],
  now: Date = new Date()
): boolean {
  const todayStr = toDateStr(now);
  const hour = now.getHours();

  // Вечернее окно: 19:00–22:00
  if (hour < 19 || hour >= 22) return false;

  // Ещё не записывал сегодня
  return !entries.some(e => e.date === todayStr);
}
