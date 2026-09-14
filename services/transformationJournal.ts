/**
 * transformationJournal.ts — Журнал Трансформаций.
 *
 * Сохраняет каждый завершённый сеанс 5-стадийного ритуала:
 * ответ сердца, выбранную трансформацию, Имя Аллаха, дату и микро-действие.
 * Реализует требование спеки: answerHistory с историей ответов.
 * Хранение: localStorage (тексты — не Blob'ы, IndexedDB не нужен).
 */

const JOURNAL_KEY = 'habitai_transformation_journal';

export interface JournalEntry {
  id: string;
  /** id трансформации, напр. 'root-1', 'titan-3', 'iman-5' */
  transformationId: string;
  title: string;
  /** Имя Аллаха (транслитерация) */
  divineName: string;
  /** Ответ сердца пользователя */
  heartAnswer: string;
  /** Микро-действие из Стадии 5 */
  microAction?: string;
  /** Итоговое намерение */
  finalIntention: string;
  /** ISO-дата завершения */
  completedAt: string;
}

export function getJournal(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

export function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'completedAt'>): JournalEntry {
  const full: JournalEntry = {
    ...entry,
    id: `je-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    completedAt: new Date().toISOString(),
  };
  const journal = getJournal();
  journal.unshift(full); // новые сверху
  // Ограничиваем 200 записями, чтобы localStorage не разрастался
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal.slice(0, 200)));
  return full;
}

export function getEntriesFor(transformationId: string): JournalEntry[] {
  return getJournal().filter(e => e.transformationId === transformationId);
}

/** Статистика для дашборда: всего сеансов, уникальные трансформации, последнее Имя */
export function getJournalStats(): { total: number; unique: number; lastCompletedAt: string | null } {
  const journal = getJournal();
  return {
    total: journal.length,
    unique: new Set(journal.map(e => e.transformationId)).size,
    lastCompletedAt: journal.length > 0 ? journal[0].completedAt : null,
  };
}
