/**
 * =========================================================
 * MUHASABA ENGINE
 * Движок самоотчёта (Мухасаба).
 *
 * Умар ибн аль-Хаттаб (رضي الله عنه):
 * «Считайте себя прежде, чем вас сосчитают, и взвешивайте
 * свои поступки прежде, чем они будут взвешены»
 *
 * Это еженедельный честный разбор — без наказаний, без гейма.
 * Три вопроса. Самоанализ. AI-резюме (опционально).
 * =========================================================
 */

import type { MuhasabaSession, HabitSlice } from './types';

// ── Утилиты ────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Дата понедельника текущей недели */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Понедельник = 1
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

/** Является ли сейчас подходящее время для мухасабы (воскресенье вечером) */
export function isMuhasabaTime(now: Date = new Date()): boolean {
  return now.getDay() === 0 && now.getHours() >= 19;
}

/** Есть ли уже мухасаба за текущую неделю */
export function hasCurrentWeekMuhasaba(sessions: MuhasabaSession[], now: Date = new Date()): boolean {
  const weekStart = getWeekStart(now);
  return sessions.some(s => s.weekStart === weekStart);
}

// ── Три вопроса мухасабы ───────────────────────────────────────────────────

export interface MuhasabaQuestions {
  q1: { ru: string; en: string };
  q2: { ru: string; en: string };
  q3: { ru: string; en: string };
  quote: { ru: string; en: string };
}

export function getMuhasabaQuestions(): MuhasabaQuestions {
  return {
    q1: {
      ru: '📋 Что получилось на этой неделе?',
      en: '📋 What worked well this week?',
    },
    q2: {
      ru: '🔍 Что мешало или шло не так?',
      en: '🔍 What blocked you or went wrong?',
    },
    q3: {
      ru: '🎯 Что конкретно изменишь на следующей неделе?',
      en: '🎯 What specifically will you change next week?',
    },
    quote: {
      ru: '«Считайте себя прежде, чем вас сосчитают» — Умар ибн аль-Хаттаб',
      en: '"Account yourselves before you are accounted" — Umar ibn al-Khattab',
    },
  };
}

// ── Автоматические инсайты недели ─────────────────────────────────────────

export interface WeekStats {
  totalScheduled: number;       // сколько должно было быть выполнено
  totalCompleted: number;       // сколько выполнено
  completionPercent: number;    // %
  bestDayOfWeek: string;        // день с лучшим % выполнения
  worstDayOfWeek: string;       // день с худшим %
  topHabit: { name: string; completion: number } | null;   // самая стабильная
  bottomHabit: { name: string; completion: number } | null; // самая нестабильная
  trend: 'better_than_last' | 'same' | 'worse_than_last';
}

/**
 * Считает статистику за прошедшую неделю.
 * Вызывается для автоматического контекста к мухасабе.
 */
export function calcWeekStats(
  habits: HabitSlice[],
  weekStart: string,
  prevWeekStart?: string
): WeekStats {
  const days = getDaysOfWeek(weekStart);
  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Completion по дням недели
  const dayRates: { day: string; rate: number }[] = days.map((dateStr, idx) => {
    const habitsForDay = habits.filter(h => {
      const d = new Date(dateStr);
      if (h.type === 'task') return false;
      if (!h.frequency || h.frequency === 'daily') return true;
      if (h.frequency === 'specific_days' && h.frequencyDays) {
        return h.frequencyDays.includes(d.getDay());
      }
      return true;
    });
    const completed = habitsForDay.filter(h => h.completedDates.includes(dateStr)).length;
    return {
      day: DAY_NAMES[idx],
      rate: habitsForDay.length > 0 ? (completed / habitsForDay.length) * 100 : 0,
    };
  });

  // Лучший и худший день
  const sorted = [...dayRates].sort((a, b) => b.rate - a.rate);
  const bestDayOfWeek = sorted[0]?.day ?? '—';
  const worstDayOfWeek = sorted[sorted.length - 1]?.day ?? '—';

  // Общая статистика
  let totalScheduled = 0;
  let totalCompleted = 0;

  habits.forEach(h => {
    days.forEach(dateStr => {
      const d = new Date(dateStr);
      if (h.type === 'task') return;
      if (!h.frequency || h.frequency === 'daily' ||
         (h.frequency === 'specific_days' && h.frequencyDays?.includes(d.getDay()))) {
        totalScheduled++;
        if (h.completedDates.includes(dateStr)) totalCompleted++;
      }
    });
  });

  const completionPercent = totalScheduled > 0
    ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Топ и худшая привычка недели
  const habitRates = habits.map(h => {
    let exp = 0, comp = 0;
    days.forEach(dateStr => {
      const d = new Date(dateStr);
      if (h.type === 'task') return;
      if (!h.frequency || h.frequency === 'daily' ||
         (h.frequency === 'specific_days' && h.frequencyDays?.includes(d.getDay()))) {
        exp++;
        if (h.completedDates.includes(dateStr)) comp++;
      }
    });
    return { name: h.name, completion: exp > 0 ? Math.round((comp / exp) * 100) : 0 };
  });

  const habitsSorted = [...habitRates].sort((a, b) => b.completion - a.completion);
  const topHabit = habitsSorted[0] ?? null;
  const bottomHabit = habitsSorted[habitsSorted.length - 1] ?? null;

  // Тренд по сравнению с прошлой неделей
  let trend: WeekStats['trend'] = 'same';
  if (prevWeekStart) {
    const prevDays = getDaysOfWeek(prevWeekStart);
    let prevScheduled = 0, prevCompleted = 0;
    habits.forEach(h => {
      prevDays.forEach(dateStr => {
        const d = new Date(dateStr);
        if (h.type === 'task') return;
        if (!h.frequency || h.frequency === 'daily' ||
           (h.frequency === 'specific_days' && h.frequencyDays?.includes(d.getDay()))) {
          prevScheduled++;
          if (h.completedDates.includes(dateStr)) prevCompleted++;
        }
      });
    });
    const prevPct = prevScheduled > 0 ? (prevCompleted / prevScheduled) * 100 : 0;
    if (completionPercent > prevPct + 5) trend = 'better_than_last';
    else if (completionPercent < prevPct - 5) trend = 'worse_than_last';
  }

  return {
    totalScheduled,
    totalCompleted,
    completionPercent,
    bestDayOfWeek,
    worstDayOfWeek,
    topHabit,
    bottomHabit,
    trend,
  };
}

/** 7 дат недели начиная с weekStart (YYYY-MM-DD) */
function getDaysOfWeek(weekStart: string): string[] {
  const result: string[] = [];
  const base = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    result.push(toDateStr(d));
  }
  return result;
}

// ── Создание сессии ────────────────────────────────────────────────────────

export function createMuhasabaSession(
  q1: string,
  q2: string,
  q3: string,
  now: Date = new Date()
): Omit<MuhasabaSession, 'id'> {
  return {
    weekStart: getWeekStart(now),
    q1_worked: q1.trim(),
    q2_blocked: q2.trim(),
    q3_change: q3.trim(),
    createdAt: now.toISOString(),
  };
}

// ── Streak мухасабы ────────────────────────────────────────────────────────

/**
 * Сколько недель подряд пользователь делал мухасабу.
 */
export function calcMuhasabaStreak(sessions: MuhasabaSession[], now: Date = new Date()): number {
  let streak = 0;
  const currentWeek = new Date(getWeekStart(now));

  for (let i = 0; i <= 52; i++) {
    const wk = new Date(currentWeek);
    wk.setDate(wk.getDate() - i * 7);
    const wkStr = toDateStr(wk);
    if (sessions.some(s => s.weekStart === wkStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}
