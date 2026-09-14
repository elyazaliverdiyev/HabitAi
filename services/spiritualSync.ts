/**
 * spiritualSync.ts — Синхронизация духовного прогресса в Supabase.
 *
 * Подход повторяет паттерн useHabits: JSONB-колонки таблицы `users`
 * (asmaSrs, transformationJournal). При авторизации — push/pull с merge:
 *  - локальный прогресс отправляется в облако (debounce 3с)
 *  - при загрузке — облачные данные мержатся с локальными (по дате/ключам)
 *
 * Если пользователь не залогинен или Supabase недоступен — молча работаем
 * локально (духовная практика не должна зависеть от сети).
 */

import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

const ASMA_SRS_KEY = 'habitai_asma_srs';
const JOURNAL_KEY = 'habitai_transformation_journal';

// ── Локальное чтение/запись ─────────────────────────────────

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[SpiritualSync] localStorage write failed:', e);
  }
}

// ── Публичный API для SRS (99 Имён) ────────────────────────

export interface SyncedNameSRS {
  level: number;
  nextReview: string;
  reviews: number;
}

/** Прочитать SRS-прогресс: локально, а если пусто — из облака (merge) */
export async function loadSrs(user: User | null): Promise<Record<number, SyncedNameSRS>> {
  const local = readLocal<Record<number, SyncedNameSRS>>(ASMA_SRS_KEY, {});
  if (!user || Object.keys(local).length > 0) return local;

  // Локально пусто, но пользователь залогинен — пробуем облако
  try {
    const { data, error } = await supabase
      .from('users')
      .select('asmaSrs')
      .eq('id', user.id)
      .single();
    if (!error && data?.asmaSrs && typeof data.asmaSrs === 'object') {
      const cloud = data.asmaSrs as Record<string, SyncedNameSRS>;
      // ключи приходят строками из JSONB — нормализуем в числа
      const normalized: Record<number, SyncedNameSRS> = {};
      for (const [k, v] of Object.entries(cloud)) {
        normalized[Number(k)] = v;
      }
      // Merge: берём лучшее (выше уровень / больше повторов)
      for (const n of Object.keys(local).map(Number)) {
        const l = local[n];
        const c = normalized[n];
        if (l && (!c || l.level > c.level || l.reviews > c.reviews)) {
          normalized[n] = l;
        }
      }
      writeLocal(ASMA_SRS_KEY, normalized);
      return normalized;
    }
  } catch (e) {
    console.warn('[SpiritualSync] cloud load failed:', e);
  }
  return local;
}

/** Отправить SRS-прогресс в облако (вызывается после markKnown/markAgain) */
let srsPushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSrsPush(user: User | null) {
  if (!user) return;
  if (srsPushTimer) clearTimeout(srsPushTimer);
  srsPushTimer = setTimeout(async () => {
    try {
      const local = readLocal<Record<number, SyncedNameSRS>>(ASMA_SRS_KEY, {});
      await supabase.from('users').update({ asmaSrs: local }).eq('id', user.id);
    } catch (e) {
      console.warn('[SpiritualSync] srs push failed:', e);
    }
  }, 3000);
}

// ── Публичный API для Журнала Трансформаций ────────────────

export interface SyncedJournalEntry {
  id: string;
  transformationId: string;
  title: string;
  divineName: string;
  heartAnswer: string;
  microAction?: string;
  finalIntention: string;
  completedAt: string;
}

/** Загрузить журнал: merge локального и облачного по id записи */
export async function loadJournal(user: User | null): Promise<SyncedJournalEntry[]> {
  const local = readLocal<SyncedJournalEntry[]>(JOURNAL_KEY, []);
  if (!user) return local;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('transformationJournal')
      .eq('id', user.id)
      .single();
    if (!error && Array.isArray(data?.transformationJournal)) {
      const cloud = data.transformationJournal as SyncedJournalEntry[];
      const byId = new Map<string, SyncedJournalEntry>();
      // Сортируем по дате (новые сверху после merge)
      for (const e of [...cloud, ...local]) {
        const existing = byId.get(e.id);
        if (!existing || new Date(e.completedAt) > new Date(existing.completedAt)) {
          byId.set(e.id, e);
        }
      }
      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 200);
      writeLocal(JOURNAL_KEY, merged);
      return merged;
    }
  } catch (e) {
    console.warn('[SpiritualSync] journal load failed:', e);
  }
  return local;
}

/** Отправить журнал в облако (debounce) */
let journalPushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleJournalPush(user: User | null) {
  if (!user) return;
  if (journalPushTimer) clearTimeout(journalPushTimer);
  journalPushTimer = setTimeout(async () => {
    try {
      const local = readLocal<SyncedJournalEntry[]>(JOURNAL_KEY, []);
      await supabase.from('users').update({ transformationJournal: local }).eq('id', user.id);
    } catch (e) {
      console.warn('[SpiritualSync] journal push failed:', e);
    }
  }, 3000);
}
