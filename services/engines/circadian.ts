/**
 * =========================================================
 * CIRCADIAN ENGINE
 * Движок временны́х окон дня.
 *
 * Основан на:
 * - Исламских временны́х окнах (Тахаджжуд, Фаджр, Духа, Зухр, Аср, Магриб, Иша)
 * - Циркадных ритмах человека (кортизол, мелатонин, температура тела)
 * - Принципе «Баракатного времени» — ранний рассвет максимально продуктивен
 *
 * Ничего не знает о Supabase, React или компонентах.
 * Чистая функция: время → рекомендации.
 * =========================================================
 */

import type { HabitSlice, DayWindow, SmartSchedule } from './types';

// ── Конфигурация окон ──────────────────────────────────────────────────────
interface WindowConfig {
  start: number; // час (0-23)
  end: number;
  label: { ru: string; en: string };
  emoji: string;
  isBarakah: boolean;
  energyLevel: 'peak' | 'high' | 'medium' | 'low' | 'recovery';
  focus: 'deep' | 'active' | 'light' | 'reflective' | 'rest';
  message: { ru: string; en: string };
}

const WINDOW_CONFIG: Record<DayWindow, WindowConfig> = {
  tahajjud: {
    start: 3, end: 5,
    label: { ru: 'Тахаджжуд', en: 'Tahajjud' },
    emoji: '🌙',
    isBarakah: true,
    energyLevel: 'peak',
    focus: 'deep',
    message: {
      ru: 'Баракатное время — глубокая тишина, максимальная ясность ума',
      en: 'Blessed time — deep silence, maximum mental clarity',
    },
  },
  fajr: {
    start: 5, end: 8,
    label: { ru: 'Фаджр', en: 'Fajr' },
    emoji: '🌅',
    isBarakah: true,
    energyLevel: 'peak',
    focus: 'deep',
    message: {
      ru: 'Рассветное окно — лучшее время для ключевых привычек',
      en: 'Dawn window — best time for keystone habits',
    },
  },
  duha: {
    start: 8, end: 12,
    label: { ru: 'Духа', en: 'Duha' },
    emoji: '☀️',
    isBarakah: false,
    energyLevel: 'high',
    focus: 'active',
    message: {
      ru: 'Пик продуктивности — время для сложных задач и активных привычек',
      en: 'Peak productivity — time for challenging tasks and active habits',
    },
  },
  zuhr: {
    start: 12, end: 15,
    label: { ru: 'Зухр', en: 'Zuhr' },
    emoji: '🌞',
    isBarakah: false,
    energyLevel: 'medium',
    focus: 'light',
    message: {
      ru: 'Полуденное окно — лёгкие задачи, восстановление',
      en: 'Midday window — light tasks, recovery',
    },
  },
  asr: {
    start: 15, end: 18,
    label: { ru: 'Аср', en: 'Asr' },
    emoji: '🌤',
    isBarakah: false,
    energyLevel: 'high',
    focus: 'active',
    message: {
      ru: 'Вторая волна энергии — физические привычки, движение',
      en: 'Second energy peak — physical habits, movement',
    },
  },
  maghrib: {
    start: 18, end: 21,
    label: { ru: 'Магриб', en: 'Maghrib' },
    emoji: '🌆',
    isBarakah: false,
    energyLevel: 'medium',
    focus: 'reflective',
    message: {
      ru: 'Переходное время — завершение дел, семья, благодарность',
      en: 'Transition time — wrapping up, family, gratitude',
    },
  },
  isha: {
    start: 21, end: 23,
    label: { ru: 'Иша — Мухасаба', en: 'Isha — Muhasaba' },
    emoji: '🌃',
    isBarakah: false,
    energyLevel: 'low',
    focus: 'reflective',
    message: {
      ru: 'Время мухасабы — честный отчёт перед самим собой',
      en: 'Muhasaba time — honest self-accountability',
    },
  },
  night: {
    start: 23, end: 3,
    label: { ru: 'Ночь', en: 'Night' },
    emoji: '💤',
    isBarakah: false,
    energyLevel: 'recovery',
    focus: 'rest',
    message: {
      ru: 'Время восстановления — сон это ибадат, он закрепляет привычки',
      en: 'Recovery time — sleep reinforces neural pathways of habits',
    },
  },
};

// ── Утилиты ────────────────────────────────────────────────────────────────

/** Возвращает текущее временно́е окно */
export function getCurrentWindow(now: Date = new Date()): DayWindow {
  const hour = now.getHours();
  if (hour >= 3 && hour < 5) return 'tahajjud';
  if (hour >= 5 && hour < 8) return 'fajr';
  if (hour >= 8 && hour < 12) return 'duha';
  if (hour >= 12 && hour < 15) return 'zuhr';
  if (hour >= 15 && hour < 18) return 'asr';
  if (hour >= 18 && hour < 21) return 'maghrib';
  if (hour >= 21 && hour < 23) return 'isha';
  return 'night';
}

/** Информация о конкретном окне */
export function getWindowConfig(window: DayWindow): WindowConfig {
  return WINDOW_CONFIG[window];
}

/** Является ли сейчас «баракатным» временем */
export function isBarakahTime(now: Date = new Date()): boolean {
  return WINDOW_CONFIG[getCurrentWindow(now)].isBarakah;
}

/** Минуты до следующего окна */
export function minutesToNextWindow(now: Date = new Date()): number {
  const hour = now.getHours();
  const min = now.getMinutes();
  const currentMinutes = hour * 60 + min;

  const windowStarts = [3, 5, 8, 12, 15, 18, 21, 23].map(h => h * 60);
  const next = windowStarts.find(s => s > currentMinutes)
    ?? (windowStarts[0] + 24 * 60); // wrap to tomorrow 3:00

  return next - currentMinutes;
}

// ── Основная функция: умное расписание дня ─────────────────────────────────

/**
 * Возвращает рекомендуемые привычки для текущего временно́го окна.
 *
 * Приоритеты подбора:
 * 1. Привычки с time совпадающим с текущим окном
 * 2. Keystone-привычки → в Фаджр/Тахаджжуд окна
 * 3. Физические (по тегу 'physical', 'sport') → в Аср
 * 4. Рефлексивные (по тегу 'mind', 'reflect') → в Иша/Магриб
 * 5. Остальные — по difficulty (сложные утром, лёгкие вечером)
 */
export function getSmartSchedule(
  habits: HabitSlice[],
  now: Date = new Date()
): SmartSchedule {
  const window = getCurrentWindow(now);
  const config = WINDOW_CONFIG[window];
  const todayStr = toDateStr(now);

  // Не предлагаем уже выполненные сегодня
  const pending = habits.filter(
    h => h.type !== 'task' && !h.completedDates.includes(todayStr)
  );

  const scored = pending.map(h => ({
    habit: h,
    score: scoreHabitForWindow(h, window, now),
  }));

  scored.sort((a, b) => b.score - a.score);

  const suggestedHabits = scored.slice(0, 5).map(s => s.habit);

  return {
    window,
    windowLabel: config.label,
    windowEmoji: config.emoji,
    suggestedHabits,
    isBarakahWindow: config.isBarakah,
    message: config.message,
  };
}

/**
 * Оценивает насколько привычка подходит для данного окна.
 * Возвращает число — чем выше, тем лучше.
 */
function scoreHabitForWindow(
  habit: HabitSlice,
  window: DayWindow,
  now: Date
): number {
  let score = 0;
  const config = WINDOW_CONFIG[window];

  // 1. Если у привычки задано время — близость к текущему окну
  if (habit.time) {
    const [hh, mm] = habit.time.split(':').map(Number);
    const habitMinutes = hh * 60 + (mm || 0);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = Math.abs(habitMinutes - nowMinutes);
    if (diff <= 30) score += 50;
    else if (diff <= 60) score += 30;
    else if (diff <= 120) score += 15;
  }

  // 2. Keystone привычки → максимальный приоритет утром
  if (habit.isKeystone && (window === 'fajr' || window === 'tahajjud' || window === 'duha')) {
    score += 40;
  }

  // 3. Теги и окно
  const tags = (habit.tags || []).map(t => t.toLowerCase());
  if (config.focus === 'active') {
    if (tags.some(t => ['sport', 'physical', 'exercise', 'run', 'gym', 'физ'].includes(t))) score += 25;
  }
  if (config.focus === 'reflective') {
    if (tags.some(t => ['mind', 'reflect', 'journal', 'read', 'read', 'медит', 'чтен'].includes(t))) score += 25;
  }
  if (config.focus === 'deep') {
    if (tags.some(t => ['learn', 'study', 'code', 'write', 'учёб', 'работ'].includes(t))) score += 20;
  }

  // 4. Сложность: сложные (4-5) → утро/тахаджжуд, лёгкие (1-2) → вечер
  const diff = habit.difficulty || 3;
  if ((window === 'fajr' || window === 'tahajjud') && diff >= 4) score += 15;
  if ((window === 'isha' || window === 'maghrib') && diff <= 2) score += 10;

  // 5. Штраф за ночь и восстановление
  if (window === 'night') score -= 30;

  return score;
}

// ── Персонализированное приветствие ────────────────────────────────────────

export interface SmartGreeting {
  greeting: { ru: string; en: string };
  subtext: { ru: string; en: string };
  emoji: string;
  isBarakah: boolean;
}

export function getSmartGreeting(
  name: string = '',
  now: Date = new Date()
): SmartGreeting {
  const window = getCurrentWindow(now);
  const firstName = name.split(' ')[0] || '';

  const greetings: Record<DayWindow, SmartGreeting> = {
    tahajjud: {
      greeting: {
        ru: `Машаллах${firstName ? `, ${firstName}` : ''} 🤲`,
        en: `MashaAllah${firstName ? `, ${firstName}` : ''} 🤲`,
      },
      subtext: {
        ru: 'Ты в баракатном времени. Аллах с теми, кто встаёт',
        en: "You're in the blessed hour. Allah is with those who rise",
      },
      emoji: '🌙',
      isBarakah: true,
    },
    fajr: {
      greeting: {
        ru: `Доброе утро${firstName ? `, ${firstName}` : ''}`,
        en: `Good morning${firstName ? `, ${firstName}` : ''}`,
      },
      subtext: {
        ru: 'Лучшее время дня — твои привычки закрепляются в памяти',
        en: 'Best time of the day — habits anchor deeply at dawn',
      },
      emoji: '🌅',
      isBarakah: true,
    },
    duha: {
      greeting: {
        ru: `Отличное утро${firstName ? `, ${firstName}` : ''}`,
        en: `Great morning${firstName ? `, ${firstName}` : ''}`,
      },
      subtext: {
        ru: 'Ты на пике фокуса — время для главных дел',
        en: "You're at peak focus — tackle the important ones",
      },
      emoji: '☀️',
      isBarakah: false,
    },
    zuhr: {
      greeting: {
        ru: `Добрый день${firstName ? `, ${firstName}` : ''}`,
        en: `Good afternoon${firstName ? `, ${firstName}` : ''}`,
      },
      subtext: {
        ru: 'Полдень — восстановись и продолжи',
        en: 'Midday — restore and continue',
      },
      emoji: '🌞',
      isBarakah: false,
    },
    asr: {
      greeting: {
        ru: `${firstName ? `${firstName}, ` : ''}вторая волна`,
        en: `${firstName ? `${firstName}, ` : ''}second wind`,
      },
      subtext: {
        ru: 'Энергия возвращается — отличное время для движения',
        en: 'Energy is back — great time for physical habits',
      },
      emoji: '🌤',
      isBarakah: false,
    },
    maghrib: {
      greeting: {
        ru: `Добрый вечер${firstName ? `, ${firstName}` : ''}`,
        en: `Good evening${firstName ? `, ${firstName}` : ''}`,
      },
      subtext: {
        ru: 'Закат — время завершения и благодарности',
        en: 'Sunset — time for completion and gratitude',
      },
      emoji: '🌆',
      isBarakah: false,
    },
    isha: {
      greeting: {
        ru: `${firstName || 'Время'} мухасабы`,
        en: `${firstName || 'Time'} for muhasaba`,
      },
      subtext: {
        ru: 'Честный отчёт перед собой — основа роста',
        en: 'Honest self-audit — the foundation of growth',
      },
      emoji: '🌃',
      isBarakah: false,
    },
    night: {
      greeting: {
        ru: `Спокойной ночи${firstName ? `, ${firstName}` : ''}`,
        en: `Good night${firstName ? `, ${firstName}` : ''}`,
      },
      subtext: {
        ru: 'Сон укрепляет нейронные пути твоих привычек',
        en: 'Sleep reinforces the neural pathways of your habits',
      },
      emoji: '💤',
      isBarakah: false,
    },
  };

  return greetings[window];
}

// ── Утилита ────────────────────────────────────────────────────────────────
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
