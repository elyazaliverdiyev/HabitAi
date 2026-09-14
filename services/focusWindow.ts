/**
 * focusWindow.ts — Движок «Окно Фокуса»: направляй, а не заваливай.
 *
 * Инсайт пользователя (Возняк: задача за 2 недели вместо года; Тиль:
 * 10 лет → 6 месяцев): сужение времени меняет мышление. Поток привычек
 * парализует — вместо кучи карточек пользователь видит ОДНУ задачу
 * в её временном окне.
 *
 * Логика выбора:
 *  1. Задачи с датой на сегодня/просроченные — приоритет 1 (дедлайн жмёт)
 *  2. Привычка с time-окном, попадающим в текущий час — приоритет 2
 *  3. Незавершённая keystone-привычка — приоритет 3
 *  4. Любая незавершённая на сегодня — приоритет 4
 *
 * Возвращает null, если всё выполнено (и это тоже повод порадовать).
 */

import type { Habit } from '../types';
import { getLocalDateString } from '../utils/helpers';

export interface FocusTarget {
  habit: Habit;
  /** Почему именно это сейчас */
  reasonRu: string;
  reasonEn: string;
  /** Оставшееся время окна (если есть) */
  windowEndsAt?: string; // HH:MM
}

/**
 * Главная цель фокуса прямо сейчас.
 * Вызывается раз в минуту (или при изменении привычек).
 */
export function getCurrentFocus(
  habits: Habit[],
  now: Date = new Date()
): FocusTarget | null {
  const todayStr = getLocalDateString(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const active = habits.filter(h => !h.archived);
  const notCompleted = active.filter(h => !h.completedDates.includes(todayStr));
  if (notCompleted.length === 0) return null;

  // 1. Просроченные задачи и задачи на сегодня (type === 'task')
  const todaysTasks = notCompleted.filter(h => {
    if (h.type !== 'task' || !h.date) return false;
    return h.date <= todayStr;
  });
  if (todaysTasks.length > 0) {
    // Самая просроченная / ближайшая дата
    const sorted = [...todaysTasks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const t = sorted[0];
    const overdue = (t.date || '') < todayStr;
    return {
      habit: t,
      reasonRu: overdue
        ? `Задача просрочена — закрой её сейчас, чтобы расчистить путь`
        : `Задача на сегодня — её окно открыто`,
      reasonEn: overdue ? 'Overdue task — close it now' : "Today's task — its window is open",
    };
  }

  // 2. Привычка, чьё time-окно сейчас активно
  const inWindow = notCompleted.filter(h => {
    if (!h.time) return false;
    const [hh, mm] = h.time.split(':').map(Number);
    const startMin = hh * 60 + (mm || 0);
    // Окно длится 2 часа с момента time
    const endMin = startMin + 120;
    return currentMinutes >= startMin && currentMinutes < endMin;
  });
  if (inWindow.length > 0) {
    // Keystone первее
    const keystone = inWindow.find(h => h.isKeystone) || inWindow[0];
    return {
      habit: keystone,
      reasonRu: `Сейчас окно этой привычки (${keystone.time}) — идеальный момент`,
      reasonEn: `This habit's window is now (${keystone.time})`,
      windowEndsAt: keystone.time
        ? (() => {
            const [hh, mm] = (keystone.time || '0:0').split(':').map(Number);
            const end = hh * 60 + (mm || 0) + 120;
            return `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
          })()
        : undefined,
    };
  }

  // 3. Keystone-привычка
  const keystone = notCompleted.find(h => h.isKeystone && h.type !== 'task');
  if (keystone) {
    return {
      habit: keystone,
      reasonRu: 'Ключевая привычка — запускает весь остальной день',
      reasonEn: 'Keystone habit — it unlocks the rest of your day',
    };
  }

  // 4. Первая незавершённая
  const first = notCompleted.find(h => h.type !== 'task') || notCompleted[0];
  return {
    habit: first,
    reasonRu: 'Одно действие сейчас — лучше десяти в планах',
    reasonEn: 'One action now beats ten in the plan',
  };
}

/**
 * Текст детального уведомления Окна Фокуса (как в примере пользователя:
 * «все подробности задачи прямо в уведомлении»).
 */
export function buildFocusNotification(
  target: FocusTarget,
  language: 'ru' | 'en' = 'ru'
): { title: string; body: string } {
  const h = target.habit;
  const details: string[] = [];

  if (h.time) details.push(`⏰ ${h.time}`);
  if (h.duration) details.push(`⏱ ${h.duration} мин`);
  if (h.targetCount && h.targetCount > 1) {
    details.push(`🎯 ${h.targetCount}${h.dailyUnit ? ` ${h.dailyUnit}` : ''}`);
  }
  if (h.place) details.push(`📍 ${h.place}`);
  if (target.windowEndsAt) details.push(language === 'ru' ? `до ${target.windowEndsAt}` : `until ${target.windowEndsAt}`);

  const title = language === 'ru' ? '🎯 Окно Фокуса' : '🎯 Focus Window';
  const body = [
    `${h.name}${details.length > 0 ? ' — ' + details.join(' · ') : ''}`,
    language === 'ru' ? target.reasonRu : target.reasonEn,
  ].join('\n');

  return { title, body };
}
