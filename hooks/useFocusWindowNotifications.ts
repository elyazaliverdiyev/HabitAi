/**
 * useFocusWindowNotifications — уведомления «Окно Фокуса».
 *
 * Когда наступает time-окно привычки/задачи (и она не выполнена) —
 * однократно отправляет детальное уведомление: название, время,
 * длительность, цель, место — как в примере пользователя.
 * Дедупликация: одна задача = одно уведомление за окно.
 */
import { useEffect, useRef, useState } from 'react';
import { getCurrentFocus, buildFocusNotification } from '../services/focusWindow';
import { getLocalDateString } from '../utils/helpers';
import type { Habit } from '../types';

const CHECK_INTERVAL_MS = 60 * 1000; // раз в минуту
const NOTIFIED_KEY = 'habitai_focus_notified';

/** Уже отправленные сегодня уведомления (id привычек) */
function getNotifiedToday(): Set<string> {
  const today = getLocalDateString();
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; ids: string[] };
      if (parsed.date === today) return new Set(parsed.ids);
    }
  } catch { /* ignore */ }
  return new Set();
}

function markNotified(id: string) {
  const today = getLocalDateString();
  const ids = Array.from(getNotifiedToday()).concat(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ date: today, ids }));
}

export function useFocusWindowNotifications(
  habits: Habit[],
  enabled: boolean,
  language: 'ru' | 'en' = 'ru'
) {
  // Пульс: пересчёт раз в минуту (для UI-подписки)
  const [tick, setTick] = useState(0);
  const notifiedRef = useRef<Set<string>>(getNotifiedToday());

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setTick(t => t + 1), CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || habits.length === 0) return;

    const focus = getCurrentFocus(habits);
    if (!focus) return;

    const habitId = focus.habit.id;
    // Уведомляем только когда окно только что открылось (в первые 5 минут)
    // и ещё не уведомляли эту привычку сегодня
    const notified = notifiedRef.current.has(habitId);
    if (notified) return;

    const [hh, mm] = (focus.habit.time || '').split(':').map(Number);
    if (Number.isNaN(hh)) return;
    const startMin = hh * 60 + (mm || 0);
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    // В окне и не дальше 5 минут от начала
    const inOpening = currentMin >= startMin && currentMin < startMin + 5;
    if (!inOpening) return;

    // Отправляем
    (async () => {
      try {
        const { showInstantNotification } = await import('../notifications');
        const { title, body } = buildFocusNotification(focus, language);
        await showInstantNotification(title, body, `focus-${habitId}`);
        markNotified(habitId);
        notifiedRef.current = getNotifiedToday();
      } catch (e) {
        console.warn('[FocusWindow] notification failed:', e);
      }
    })();
  }, [tick, habits, enabled, language]);
}
