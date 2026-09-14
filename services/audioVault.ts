/**
 * audioVault.ts — Хранилище записей голоса для практик повторений.
 *
 * IndexedDB (не localStorage — Blob туда не влезает):
 *  - записи голоса пользователя (Blob) с привязкой к трансформации
 *  - прогресс повторений: currentCount, totalLifetimeRepeats, lastPracticedAt
 *
 * Реальное хранилище без заглушек: данные переживают перезагрузку.
 */

const DB_NAME = 'habitai_audio_vault';
const DB_VERSION = 1;
const STORE_AUDIO = 'audio';
const STORE_PROGRESS = 'progress';

export interface AudioRecord {
  id: string;               // ключ трансформации, напр. 'iman-1' или custom
  blob: Blob;
  durationSec: number;
  createdAt: string;        // ISO
  label: string;            // название практики
}

export interface RepeatProgress {
  id: string;               // ключ трансформации
  currentCount: number;     // прогресс текущей сессии
  targetCount: number;      // 15 | 33 | 70 | 100 | custom
  totalLifetimeRepeats: number;
  lastPracticedAt: string | null;
  isMastered: boolean;      // завершено полное запечатывание (100+)
  customTarget?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Аудио ──────────────────────────────────────────────────────

export async function saveAudio(rec: AudioRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    tx.objectStore(STORE_AUDIO).put(rec);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getAudio(id: string): Promise<AudioRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const req = tx.objectStore(STORE_AUDIO).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    tx.objectStore(STORE_AUDIO).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ── Прогресс повторений ────────────────────────────────────────

export async function getProgress(id: string): Promise<RepeatProgress | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, 'readonly');
    const req = tx.objectStore(STORE_PROGRESS).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function saveProgress(progress: RepeatProgress): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, 'readwrite');
    tx.objectStore(STORE_PROGRESS).put(progress);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Инкремент повторения: +1 к текущей сессии и к пожизненному счётчику */
export async function incrementRepeat(id: string, targetCount: number): Promise<RepeatProgress> {
  const existing = await getProgress(id);
  const next: RepeatProgress = existing
    ? {
        ...existing,
        currentCount: existing.currentCount + 1,
        totalLifetimeRepeats: existing.totalLifetimeRepeats + 1,
        lastPracticedAt: new Date().toISOString(),
        isMastered: existing.isMastered || existing.currentCount + 1 >= 100,
        targetCount,
      }
    : {
        id,
        currentCount: 1,
        targetCount,
        totalLifetimeRepeats: 1,
        lastPracticedAt: new Date().toISOString(),
        isMastered: false,
      };
  await saveProgress(next);
  return next;
}

/** Сброс текущей сессии (пожизненный счётчик сохраняется) */
export async function resetSession(id: string): Promise<RepeatProgress | null> {
  const existing = await getProgress(id);
  if (!existing) return null;
  const next: RepeatProgress = { ...existing, currentCount: 0 };
  await saveProgress(next);
  return next;
}

/** Установка кастомной цели (например, 3×, 7×) */
export async function setCustomTarget(id: string, target: number): Promise<RepeatProgress | null> {
  const existing = await getProgress(id);
  const next: RepeatProgress = existing
    ? { ...existing, targetCount: target, customTarget: target }
    : { id, currentCount: 0, targetCount: target, totalLifetimeRepeats: 0, lastPracticedAt: null, isMastered: false, customTarget: target };
  await saveProgress(next);
  return next;
}
