/**
 * =========================================================
 * MINIMAL VIABLE HABIT ENGINE (MVH)
 * Движок минимального варианта привычки.
 *
 * Принцип «Никогда не пропускай» через снижение планки.
 * В плохой день: 5 минут лучше, чем 0.
 * «Даже малое постоянное дело любимее Аллахом» (Бухари)
 *
 * Умный алгоритм:
 * - Обнаруживает «тяжёлый день» (мало выполнено к вечеру)
 * - Предлагает MVH вместо полной привычки
 * - Считает MVH-выполнение успехом (не нулём!)
 * =========================================================
 */

import type { HabitSlice, MinimalVariant } from './types';

// ── Шаблоны MVH по категориям ─────────────────────────────────────────────

const MVH_TEMPLATES: Record<string, { ru: string; en: string; minutes: number }> = {
  // По тегам
  sport:     { ru: '5 мин прогулки вместо тренировки', en: '5 min walk instead of full workout', minutes: 5 },
  run:       { ru: '10 мин лёгкой пробежки', en: '10 min easy jog', minutes: 10 },
  gym:       { ru: '5 мин растяжки дома', en: '5 min home stretching', minutes: 5 },
  meditation:{ ru: '3 глубоких вдоха — 1 минута', en: '3 deep breaths — 1 minute', minutes: 1 },
  read:      { ru: '2 страницы — 5 минут', en: '2 pages — 5 minutes', minutes: 5 },
  write:     { ru: '3 предложения в дневник', en: '3 sentences in journal', minutes: 3 },
  study:     { ru: '10 минут повторения', en: '10 min review', minutes: 10 },
  water:     { ru: 'Один стакан воды прямо сейчас', en: 'One glass of water right now', minutes: 1 },
  sleep:     { ru: 'Лечь на 30 минут раньше обычного', en: 'Go to bed 30 min earlier than usual', minutes: 0 },
  // По дефолту
  default:   { ru: '5 минут на привычку — начни', en: '5 minutes on the habit — just start', minutes: 5 },
};

// ── Определить MVH для привычки ───────────────────────────────────────────

/**
 * Генерирует минимальный вариант на основе тегов и имени привычки.
 * Если пользователь уже задал свой MVH — возвращает его.
 */
export function getMinimalVariant(
  habit: HabitSlice,
  userDefined?: MinimalVariant
): MinimalVariant {
  if (userDefined) return userDefined;

  // Поиск по тегам
  const tags = (habit.tags || []).map(t => t.toLowerCase());
  for (const tag of tags) {
    if (MVH_TEMPLATES[tag]) {
      return {
        habitId: habit.id,
        description: MVH_TEMPLATES[tag].ru,
        durationMinutes: MVH_TEMPLATES[tag].minutes,
      };
    }
  }

  // Поиск по ключевым словам в имени
  const name = habit.name.toLowerCase();
  for (const [key, tmpl] of Object.entries(MVH_TEMPLATES)) {
    if (name.includes(key)) {
      return {
        habitId: habit.id,
        description: tmpl.ru,
        durationMinutes: tmpl.minutes,
      };
    }
  }

  return {
    habitId: habit.id,
    description: MVH_TEMPLATES.default.ru,
    durationMinutes: MVH_TEMPLATES.default.minutes,
  };
}

// ── Определить «тяжёлый день» ─────────────────────────────────────────────

export interface HardDayAssessment {
  isHardDay: boolean;
  completionSoFar: number; // %
  hoursLeft: number;
  habitsMissingSoFar: HabitSlice[];
  suggestion: { ru: string; en: string };
}

/**
 * Анализирует текущий день и определяет, нужен ли режим MVH.
 * «Тяжёлый день» = уже 17:00+, а выполнено менее 30% привычек.
 */
export function assessHardDay(
  habits: HabitSlice[],
  now: Date = new Date()
): HardDayAssessment {
  const todayStr = toDateStr(now);
  const hour = now.getHours();

  const scheduled = habits.filter(h => h.type !== 'task');
  const completed = scheduled.filter(h => h.completedDates.includes(todayStr));
  const completionSoFar = scheduled.length > 0
    ? Math.round((completed.length / scheduled.length) * 100) : 100;

  const missing = scheduled.filter(h => !h.completedDates.includes(todayStr));
  const hoursLeft = Math.max(0, 23 - hour);

  // Триггер: после 17:00 и менее 35% выполнено
  const isHardDay = hour >= 17 && completionSoFar < 35 && missing.length > 0;

  const suggestion = isHardDay
    ? {
        ru: `Тяжёлый день? Просто 5 минут на ${missing[0]?.name ?? 'привычку'} — это уже победа`,
        en: `Hard day? Just 5 min on ${missing[0]?.name ?? 'your habit'} — that's already a win`,
      }
    : {
        ru: 'Ты справляешься отлично сегодня',
        en: 'You are doing great today',
      };

  return {
    isHardDay,
    completionSoFar,
    hoursLeft,
    habitsMissingSoFar: missing,
    suggestion,
  };
}

// ── Список MVH для быстрого выбора ────────────────────────────────────────

export interface MVHOption {
  id: string;
  habitId: string;
  habitName: string;
  description: { ru: string; en: string };
  durationMinutes: number;
}

export function buildMVHList(
  habits: HabitSlice[],
  userVariants: MinimalVariant[] = [],
  now: Date = new Date()
): MVHOption[] {
  const todayStr = toDateStr(now);
  const missing = habits.filter(
    h => h.type !== 'task' && !h.completedDates.includes(todayStr)
  );

  return missing.map(h => {
    const userVariant = userVariants.find(v => v.habitId === h.id);
    const mvh = getMinimalVariant(h, userVariant);
    const template = findTemplate(h);

    return {
      id: `mvh_${h.id}`,
      habitId: h.id,
      habitName: h.name,
      description: {
        ru: mvh.description,
        en: template?.en ?? mvh.description,
      },
      durationMinutes: mvh.durationMinutes ?? 5,
    };
  });
}

function findTemplate(habit: HabitSlice) {
  const tags = (habit.tags || []).map(t => t.toLowerCase());
  for (const tag of tags) {
    if (MVH_TEMPLATES[tag]) return MVH_TEMPLATES[tag];
  }
  const name = habit.name.toLowerCase();
  for (const [key, tmpl] of Object.entries(MVH_TEMPLATES)) {
    if (name.includes(key)) return tmpl;
  }
  return MVH_TEMPLATES.default;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
