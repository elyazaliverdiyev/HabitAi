/**
 * unifiedJournal.ts — Единый журнал пользователя (база знаний о человеке).
 *
 * Архитектура «информации о пользователе»: ВСЕ записи — благодарности,
 * рефлексии, тадаббур, ответы сердца, микродействия — идут в одну
 * таблицу user_journal_entries (Supabase) + локальный зеркальный кэш.
 *
 * Зачем: со временем накапливается полная картина жизни человека →
 * ИИ подбирает персональные трансформации и решения именно для него.
 *
 * Надёжность: если облако недоступно (нет SQL-миграции/сети) — запись
 * живёт в localStorage и доехывает в облако при следующем успехе (outbox).
 */

import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export type JournalEntryType =
  | 'gratitude'      // благодарность дня
  | 'reflection'     // рефлексия/ответ на вопрос
  | 'tadabbur'       // размышление над аятом
  | 'heart_answer'   // ответ сердца в трансформации
  | 'micro_action'   // микродействие
  | 'muhasaba'       // недельная мухасаба
  | 'custom';        // произвольная запись

export interface UnifiedEntry {
  id?: string;
  entry_type: JournalEntryType;
  content: Record<string, any>;
  ref_id?: string | null;
  entry_date: string; // YYYY-MM-DD
  created_at?: string;
}

const OUTBOX_KEY = 'habitai_journal_outbox';

// ── Локальный outbox (записи, не доехавшие в облако) ────────

function getOutbox(): UnifiedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  } catch {
    return [];
  }
}

function setOutbox(entries: UnifiedEntry[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries.slice(-200)));
}

// ── Публичный API ───────────────────────────────────────────

/**
 * Записать событие в единый журнал. Оптимистично: сначала локально,
 * затем облако; при неудаче — в outbox на повтор.
 */
export async function journal(
  user: User | null,
  entry_type: JournalEntryType,
  content: Record<string, any>,
  ref_id?: string,
  entryDate?: string,
): Promise<void> {
  const entry: UnifiedEntry = {
    entry_type,
    content,
    ref_id: ref_id ?? null,
    entry_date: entryDate || new Date().toISOString().split('T')[0],
  };

  if (!user) {
    // Гость — только локальный outbox (дождётся входа)
    setOutbox([...getOutbox(), entry]);
    return;
  }

  try {
    const { error } = await supabase.from('user_journal_entries').upsert(
      { user_id: user.id, ...entry },
      { onConflict: 'user_id,entry_type,entry_date,ref_id' }
    );
    if (error) throw error;
    // Облако ок — пробуем дослать старые
    await flushOutbox(user);
  } catch (e) {
    console.warn('[Journal] cloud failed, queued locally:', e);
    setOutbox([...getOutbox(), entry]);
  }
}

/** Дослать накопленный outbox в облако */
export async function flushOutbox(user: User | null): Promise<void> {
  if (!user) return;
  const outbox = getOutbox();
  if (outbox.length === 0) return;
  const remaining: UnifiedEntry[] = [];
  for (const entry of outbox) {
    try {
      const { error } = await supabase.from('user_journal_entries').upsert(
        { user_id: user.id, ...entry },
        { onConflict: 'user_id,entry_type,entry_date,ref_id' }
      );
      if (error) throw error;
    } catch {
      remaining.push(entry);
    }
  }
  setOutbox(remaining);
}

/**
 * Полная история записей пользователя (для ИИ-контекста и аналитики).
 * limit — сколько последних (по умолчанию 200).
 */
export async function getJournalHistory(
  user: User | null,
  limit = 200,
): Promise<UnifiedEntry[]> {
  if (!user) return [];
  try {
    const { data, error } = await supabase
      .from('user_journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Journal] history fetch failed:', e);
    return [];
  }
}

/** Сводка для дашборда: сколько записей каждого типа */
export function summarizeHistory(entries: UnifiedEntry[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const e of entries) {
    summary[e.entry_type] = (summary[e.entry_type] || 0) + 1;
  }
  return summary;
}
