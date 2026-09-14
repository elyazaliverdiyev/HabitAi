/**
 * asmaMemorization.ts — Курс запоминания 99 Прекрасных Имён.
 *
 * Метод: интервальное повторение (Spaced Repetition).
 *  - «Знаю» → интервал повторения этого Имени растёт (1 → 2 → 4 → 8 → 16 → 32 дня)
 *  - «Повторить» → сброс до завтра
 *  Цель — чтобы все 99 Имён закрепились в долговременной памяти сердца.
 *
 * Прогресс хранится в localStorage: { n: { level, nextReview, reviews } }.
 * «Сердца находят покой только в упоминании Аллаха» (13:28).
 */

const STORAGE_KEY = 'habitai_asma_srs';

export interface NameSRS {
  /** уровень интервала: 0..5 (1,2,4,8,16,32 дня) */
  level: number;
  /** ISO-дата следующего повторения */
  nextReview: string;
  /** сколько раз повторено всего */
  reviews: number;
}

type SRSMap = Record<number, NameSRS>;

const INTERVALS_DAYS = [1, 2, 4, 8, 16, 32];

function load(): SRSMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(map: SRSMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function toDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Отметить «Знаю» — интервал растёт */
export function markKnown(n: number, onSync?: () => void): NameSRS {
  const map = load();
  const cur = map[n] || { level: 0, nextReview: toDaysFromNow(1), reviews: 0 };
  const nextLevel = Math.min(cur.level + 1, INTERVALS_DAYS.length - 1);
  const next: NameSRS = {
    level: nextLevel,
    nextReview: toDaysFromNow(INTERVALS_DAYS[nextLevel]),
    reviews: cur.reviews + 1,
  };
  map[n] = next;
  save(map);
  onSync?.();
  return next;
}

/** Отметить «Повторить» — сброс до завтра */
export function markAgain(n: number, onSync?: () => void): NameSRS {
  const map = load();
  const cur = map[n] || { level: 0, nextReview: toDaysFromNow(1), reviews: 0 };
  const next: NameSRS = {
    level: 0,
    nextReview: toDaysFromNow(1),
    reviews: cur.reviews + 1,
  };
  map[n] = next;
  save(map);
  onSync?.();
  return next;
}

/** Все просроченные и новые Имена для сегодняшней сессии (порядок канонический) */
export function getTodayQueue(allNames: number[]): number[] {
  const map = load();
  const now = new Date().toISOString();
  return allNames.filter(n => {
    const s = map[n];
    return !s || s.nextReview <= now;
  });
}

/** Полная карта прогресса */
export function getProgressMap(): SRSMap {
  return load();
}

/** Статистика: сколько изучено (level>=3 — закреплено), всего повторений */
export function getStats(allNames: number[]): {
  total: number;
  learned: number;    // level >= 3 (интервал ≥ 8 дней)
  mastered: number;   // level = 5 (32 дня)
  reviews: number;
  dueToday: number;
} {
  const map = load();
  const now = new Date().toISOString();
  let learned = 0, mastered = 0, reviews = 0, dueToday = 0;
  for (const n of allNames) {
    const s = map[n];
    if (!s) continue;
    reviews += s.reviews;
    if (s.level >= 3) learned++;
    if (s.level >= INTERVALS_DAYS.length - 1) mastered++;
    if (s.nextReview <= now) dueToday++;
  }
  return { total: allNames.length, learned, mastered, reviews, dueToday };
}
