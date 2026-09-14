/**
 * =========================================================
 * MOMENTUM ENGINE
 * Движок импульса — заменяет жёсткие стрики.
 *
 * Философия (Пророк ﷺ):
 * «Самые любимые дела перед Аллахом — постоянные, даже если малы»
 *
 * Проблема стриков: один пропуск → обнуление → потеря мотивации.
 * Решение: 30-дневный коэффициент + принцип «Никогда дважды подряд».
 *
 * Чистая функция: completedDates[] → MomentumScore
 * =========================================================
 */

import type { HabitSlice, MomentumScore } from './types';

const WINDOW_DAYS = 30;

// ── Вспомогательные функции ────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Определяет, должна ли привычка выполняться в конкретный день.
 * Учитывает frequency и frequencyDays.
 */
function isScheduledOn(habit: HabitSlice, date: Date): boolean {
  if (habit.type === 'task') return false;
  if (!habit.frequency || habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days' && habit.frequencyDays) {
    return habit.frequencyDays.includes(date.getDay());
  }
  // weekly/monthly — считаем как daily для упрощения
  return true;
}

// ── Основная функция ───────────────────────────────────────────────────────

/**
 * Вычисляет Momentum Score для одной привычки.
 *
 * Алгоритм:
 * 1. Смотрит последние 30 дней
 * 2. Считает только «ожидаемые» дни (по расписанию)
 * 3. completion% = выполнено / ожидалось × 100
 * 4. Добавляет бонус за consecutiveActive (дней подряд что-то сделано)
 * 5. Проверяет «Никогда дважды подряд» — вчера и позавчера пропустил?
 */
export function calcMomentum(
  habit: HabitSlice,
  now: Date = new Date()
): MomentumScore {
  const completedSet = new Set(habit.completedDates);

  let expectedDays = 0;
  let completedDays = 0;
  const dayStrings: string[] = [];

  // Собираем последние WINDOW_DAYS дней
  for (let i = 1; i <= WINDOW_DAYS; i++) {
    const d = subtractDays(now, i);
    const ds = toDateStr(d);
    dayStrings.push(ds);

    if (isScheduledOn(habit, d)) {
      expectedDays++;
      if (completedSet.has(ds)) completedDays++;
    }
  }

  const completion = expectedDays > 0
    ? Math.round((completedDays / expectedDays) * 100)
    : 0;

  // Consecutive active days (хоть что-то сделал, без пропуска 2+ дней)
  let consecutiveActive = 0;
  for (let i = 0; i < dayStrings.length; i++) {
    const ds = dayStrings[i];
    const d = subtractDays(now, i + 1);
    if (!isScheduledOn(habit, d)) continue;
    if (completedSet.has(ds)) {
      consecutiveActive++;
    } else {
      break;
    }
  }

  // Never Miss Twice: вчера И позавчера пропустил?
  const yesterday = toDateStr(subtractDays(now, 1));
  const dayBefore = toDateStr(subtractDays(now, 2));
  const missedYesterday = isScheduledOn(habit, subtractDays(now, 1)) && !completedSet.has(yesterday);
  const missedDayBefore = isScheduledOn(habit, subtractDays(now, 2)) && !completedSet.has(dayBefore);
  const neverMissTwiceAlert = missedYesterday && missedDayBefore;

  // Score = completion% + бонус за стабильность
  let score = completion;

  // Бонус за длинные серии (до +15)
  if (consecutiveActive >= 30) score = Math.min(100, score + 15);
  else if (consecutiveActive >= 14) score = Math.min(100, score + 10);
  else if (consecutiveActive >= 7) score = Math.min(100, score + 7);
  else if (consecutiveActive >= 3) score = Math.min(100, score + 3);

  // Штраф за «никогда дважды» предупреждение
  if (neverMissTwiceAlert) score = Math.max(0, score - 10);

  score = Math.min(100, Math.max(0, Math.round(score)));

  // Грейд
  const grade =
    score >= 90 ? 'S' :
    score >= 75 ? 'A' :
    score >= 55 ? 'B' :
    score >= 35 ? 'C' : 'D';

  // Тренд: сравниваем первые 15 дней с последними 15
  const first15 = dayStrings.slice(15);
  const last15 = dayStrings.slice(0, 15);
  const first15Rate = calcRate(first15, completedSet, habit, now);
  const last15Rate = calcRate(last15, completedSet, habit, now);
  const trend: MomentumScore['trend'] =
    last15Rate > first15Rate + 5 ? 'rising' :
    last15Rate < first15Rate - 5 ? 'declining' : 'stable';

  // Метки
  const labels: Record<MomentumScore['grade'], { ru: string; en: string }> = {
    S: { ru: '🔥 Легенда', en: '🔥 Legend' },
    A: { ru: '⚡ Сильный импульс', en: '⚡ Strong Momentum' },
    B: { ru: '📈 Хороший прогресс', en: '📈 Good Progress' },
    C: { ru: '🌱 Строим основу', en: '🌱 Building Base' },
    D: { ru: '💡 Начни сейчас', en: '💡 Start Now' },
  };

  return {
    score,
    grade,
    label: labels[grade],
    trend,
    consecutiveActive,
    last30Completion: completion,
    neverMissTwiceAlert,
  };
}

function calcRate(
  dateStrs: string[],
  completedSet: Set<string>,
  habit: HabitSlice,
  now: Date
): number {
  let exp = 0, comp = 0;
  dateStrs.forEach((ds, i) => {
    const d = subtractDays(now, i + 1);
    if (isScheduledOn(habit, d)) {
      exp++;
      if (completedSet.has(ds)) comp++;
    }
  });
  return exp > 0 ? (comp / exp) * 100 : 0;
}

// ── Агрегат для всех привычек ──────────────────────────────────────────────

export interface OverallMomentum {
  overallScore: number;
  grade: MomentumScore['grade'];
  trend: MomentumScore['trend'];
  bestHabitId: string | null;
  worstHabitId: string | null;
  atRiskHabitIds: string[];   // neverMissTwiceAlert = true
  message: { ru: string; en: string };
}

/**
 * Общий импульс по всем привычкам пользователя.
 * Используется для главного экрана (вместо суммарного стрика).
 */
export function calcOverallMomentum(
  habits: HabitSlice[],
  now: Date = new Date()
): OverallMomentum {
  if (habits.length === 0) {
    return {
      overallScore: 0,
      grade: 'D',
      trend: 'stable',
      bestHabitId: null,
      worstHabitId: null,
      atRiskHabitIds: [],
      message: {
        ru: 'Добавь первую привычку и начни движение',
        en: 'Add your first habit and start moving',
      },
    };
  }

  const scores = habits.map(h => ({ id: h.id, ...calcMomentum(h, now) }));

  const avgScore = Math.round(
    scores.reduce((s, m) => s + m.score, 0) / scores.length
  );

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const bestHabitId = sorted[0]?.id ?? null;
  const worstHabitId = sorted[sorted.length - 1]?.id ?? null;
  const atRiskHabitIds = scores.filter(s => s.neverMissTwiceAlert).map(s => s.id);

  // Тренд: большинство растут, падают или стабильны?
  const trends = scores.map(s => s.trend);
  const rising = trends.filter(t => t === 'rising').length;
  const declining = trends.filter(t => t === 'declining').length;
  const trend: MomentumScore['trend'] =
    rising > declining ? 'rising' :
    declining > rising ? 'declining' : 'stable';

  const grade =
    avgScore >= 90 ? 'S' :
    avgScore >= 75 ? 'A' :
    avgScore >= 55 ? 'B' :
    avgScore >= 35 ? 'C' : 'D';

  const messages: Record<MomentumScore['grade'], { ru: string; en: string }> = {
    S: { ru: 'Ты достиг легендарного уровня постоянства — продолжай!', en: 'You\'ve reached legendary consistency — keep it up!' },
    A: { ru: 'Мощный импульс! Ты на верном пути', en: 'Strong momentum! You\'re on the right track' },
    B: { ru: 'Хороший прогресс. Ещё немного стабильности', en: 'Good progress. A bit more consistency' },
    C: { ru: 'Фундамент строится. Маленькие шаги — тоже прогресс', en: 'Foundation is building. Small steps are still progress' },
    D: { ru: 'Начни с одной привычки сегодня — это уже победа', en: 'Start with one habit today — that\'s already a win' },
  };

  return {
    overallScore: avgScore,
    grade,
    trend,
    bestHabitId,
    worstHabitId,
    atRiskHabitIds,
    message: messages[grade],
  };
}

// ── Never Miss Twice Guard ─────────────────────────────────────────────────

/**
 * Возвращает привычки, нарушившие правило «Никогда дважды подряд».
 * Используется для показа красного баннера на главном экране.
 */
export function getNeverMissTwiceAlerts(
  habits: HabitSlice[],
  now: Date = new Date()
): HabitSlice[] {
  return habits.filter(h => calcMomentum(h, now).neverMissTwiceAlert);
}
