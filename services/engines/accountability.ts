/**
 * =========================================================
 * ACCOUNTABILITY ENGINE (СОЦИАЛЬНАЯ УММА)
 * Движок партнёрской ответственности.
 *
 * Пророк ﷺ: «Мусульмане как один организм — если одна часть
 * болеет, весь организм страдает бессонницей и жаром»
 *
 * Исследования: социальная ответственность повышает вероятность
 * достижения цели на 65% (ASTD).
 *
 * Модель: 1 партнёр (не публично) → видит твой прогресс →
 * получает мягкое уведомление при 2+ пропусках подряд.
 * =========================================================
 */

import type { AccountabilityPartner, HabitSlice } from './types';
import { calcMomentum, getNeverMissTwiceAlerts } from './momentum';

// ── Статус партнёрства ─────────────────────────────────────────────────────

export type PartnershipStatus =
  | 'active'          // партнёрство активно
  | 'pending_invite'  // приглашение отправлено, не принято
  | 'no_partner';     // партнёра нет

// ── Дневной отчёт для партнёра ────────────────────────────────────────────

export interface PartnerDailyReport {
  date: string;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  atRiskHabits: string[];  // имена привычек под угрозой
  needsSupport: boolean;   // нужна ли поддержка (NeverMissTwice)
  supportMessage: { ru: string; en: string } | null;
}

/**
 * Формирует дневной отчёт для передачи партнёру.
 * Только shared привычки (из partner.sharedHabitIds).
 */
export function buildPartnerReport(
  habits: HabitSlice[],
  partner: AccountabilityPartner,
  now: Date = new Date()
): PartnerDailyReport {
  const todayStr = toDateStr(now);

  // Только привычки, которые пользователь разрешил показывать
  const sharedHabits = partner.sharedHabitIds.length > 0
    ? habits.filter(h => partner.sharedHabitIds.includes(h.id))
    : habits.filter(h => h.type !== 'task');

  const total = sharedHabits.length;
  const completed = sharedHabits.filter(h => h.completedDates.includes(todayStr)).length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const atRisk = getNeverMissTwiceAlerts(sharedHabits, now);
  const needsSupport = partner.notifyOnMiss && atRisk.length > 0;

  const supportMessage = needsSupport
    ? {
        ru: `${partner.partnerName}, твой партнёр пропустил ${atRisk.map(h => h.name).join(', ')} 2 дня подряд. Поддержи его словом 🤲`,
        en: `${partner.partnerName}, your partner missed ${atRisk.map(h => h.name).join(', ')} 2 days in a row. Send them some support 🤲`,
      }
    : null;

  return {
    date: todayStr,
    completionPercent,
    completedCount: completed,
    totalCount: total,
    atRiskHabits: atRisk.map(h => h.name),
    needsSupport,
    supportMessage,
  };
}

// ── Инвайт-ссылка ─────────────────────────────────────────────────────────

export interface AccountabilityInvite {
  inviteCode: string;
  inviterUserId: string;
  inviterName: string;
  sharedHabitIds: string[];
  expiresAt: string;  // ISO timestamp (48 часов)
  createdAt: string;
}

export function createInvite(
  userId: string,
  userName: string,
  sharedHabitIds: string[]
): AccountabilityInvite {
  return {
    inviteCode: generateInviteCode(),
    inviterUserId: userId,
    inviterName: userName,
    sharedHabitIds,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ── Недельная сводка для партнёра ─────────────────────────────────────────

export interface WeeklyPartnerSummary {
  weekStart: string;
  partnerName: string;
  avgCompletion: number;
  bestDay: string;
  worstDay: string;
  momentum: { score: number; trend: 'rising' | 'stable' | 'declining' };
  encouragement: { ru: string; en: string };
}

export function buildWeeklySummary(
  habits: HabitSlice[],
  partner: AccountabilityPartner,
  now: Date = new Date()
): WeeklyPartnerSummary {
  const sharedHabits = partner.sharedHabitIds.length > 0
    ? habits.filter(h => partner.sharedHabitIds.includes(h.id))
    : habits.filter(h => h.type !== 'task');

  // Считаем за 7 дней
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return toDateStr(d);
  });

  const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayRates = days.map((ds, idx) => {
    const comp = sharedHabits.filter(h => h.completedDates.includes(ds)).length;
    const rate = sharedHabits.length > 0 ? (comp / sharedHabits.length) * 100 : 0;
    return { label: DAY_LABELS[idx], rate };
  });

  const sorted = [...dayRates].sort((a, b) => b.rate - a.rate);
  const avgCompletion = Math.round(
    dayRates.reduce((s, d) => s + d.rate, 0) / dayRates.length
  );

  // Momentum одной ключевой привычки
  const keyHabit = sharedHabits.find(h => h.isKeystone) ?? sharedHabits[0];
  const mom = keyHabit ? calcMomentum(keyHabit, now) : null;

  const encouragements = [
    { ru: 'Машаллах! Продолжай в том же духе 💪', en: 'MashaAllah! Keep it up 💪' },
    { ru: 'Постоянство — ключ к успеху 🔑', en: 'Consistency is the key to success 🔑' },
    { ru: 'Каждый маленький шаг имеет значение 🌱', en: 'Every small step matters 🌱' },
    { ru: 'Твой партнёр гордится твоим прогрессом ⭐', en: 'Your partner is proud of your progress ⭐' },
  ];

  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return {
    weekStart: toDateStr(new Date(now.getTime() - 6 * 86400000)),
    partnerName: partner.partnerName,
    avgCompletion,
    bestDay: sorted[0]?.label ?? '—',
    worstDay: sorted[sorted.length - 1]?.label ?? '—',
    momentum: mom
      ? { score: mom.score, trend: mom.trend }
      : { score: 0, trend: 'stable' },
    encouragement,
  };
}

// ── Утилиты ────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
