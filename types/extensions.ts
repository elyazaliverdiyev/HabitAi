// ===== EXTENSION TYPES: Books, Supplements, Skincare =====

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  currentPage: number;
  totalPages: number;
  status: 'inbox' | 'reading' | 'finished';
  rating?: number;
  notes?: string;
  updatedAt: string;
}

// ===== SUPPLEMENTS TRACKING =====

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'with_food' | 'anytime';
  frequency: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  status: 'active' | 'finished' | 'paused';
  startDate?: string;
  endDate?: string;
  courseNotes?: string;
  notes?: string;
  color?: string;
  takenDates?: string[];
}

export const SUPPLEMENT_TIMING = {
  morning: { label: { ru: 'Утром', en: 'Morning' }, emoji: '☀️' },
  afternoon: { label: { ru: 'Днём', en: 'Afternoon' }, emoji: '🌤️' },
  evening: { label: { ru: 'Вечером', en: 'Evening' }, emoji: '🌙' },
  with_food: { label: { ru: 'С едой', en: 'With food' }, emoji: '🍽️' },
  anytime: { label: { ru: 'Любое время', en: 'Anytime' }, emoji: '⏰' },
} as const;

export const SUPPLEMENT_FREQUENCY = {
  daily: { label: { ru: 'Ежедневно', en: 'Daily' }, emoji: '📅' },
  twice_daily: { label: { ru: '2 раза в день', en: 'Twice daily' }, emoji: '🔄' },
  every_other_day: { label: { ru: 'Через день', en: 'Every other day' }, emoji: '↔️' },
  weekly: { label: { ru: 'Раз в неделю', en: 'Weekly' }, emoji: '📆' },
  monthly: { label: { ru: 'Раз в месяц', en: 'Monthly' }, emoji: '🗓️' },
} as const;

// ===== SKINCARE TRACKING =====

export interface SkincareProduct {
  id: string;
  name: string;
  type: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'exfoliant' | 'eye_cream' | 'other';
  routine: 'morning' | 'evening' | 'both';
  frequency: 'daily' | 'every_other_day' | 'weekly' | 'twice_weekly';
  order: number;
  status: 'active' | 'finished' | 'paused';
  notes?: string;
  color?: string;
  usedDates?: string[];
}

export const SKINCARE_PRODUCT_TYPES = {
  cleanser: { label: { ru: 'Очищающее', en: 'Cleanser' }, emoji: '🧼', order: 1 },
  toner: { label: { ru: 'Тоник', en: 'Toner' }, emoji: '💧', order: 2 },
  serum: { label: { ru: 'Сыворотка', en: 'Serum' }, emoji: '✨', order: 3 },
  eye_cream: { label: { ru: 'Крем для глаз', en: 'Eye cream' }, emoji: '👁️', order: 4 },
  moisturizer: { label: { ru: 'Увлажняющий', en: 'Moisturizer' }, emoji: '🧴', order: 5 },
  sunscreen: { label: { ru: 'SPF', en: 'Sunscreen' }, emoji: '☀️', order: 6 },
  mask: { label: { ru: 'Маска', en: 'Mask' }, emoji: '🎭', order: 10 },
  exfoliant: { label: { ru: 'Пилинг', en: 'Exfoliant' }, emoji: '🧪', order: 11 },
  other: { label: { ru: 'Другое', en: 'Other' }, emoji: '💄', order: 99 },
} as const;

export const SKINCARE_ROUTINE = {
  morning: { label: { ru: 'Утро', en: 'Morning' }, emoji: '☀️' },
  evening: { label: { ru: 'Вечер', en: 'Evening' }, emoji: '🌙' },
  both: { label: { ru: 'Утро и вечер', en: 'Both' }, emoji: '🔄' },
} as const;

export const SKINCARE_FREQUENCY = {
  daily: { label: { ru: 'Ежедневно', en: 'Daily' }, emoji: '📅' },
  every_other_day: { label: { ru: 'Через день', en: 'Every other day' }, emoji: '↔️' },
  weekly: { label: { ru: 'Раз в неделю', en: 'Weekly' }, emoji: '📆' },
  twice_weekly: { label: { ru: '2 раза в неделю', en: 'Twice weekly' }, emoji: '2️⃣' },
} as const;
