/**
 * =========================================================
 * useEngines — React-хук для всех 7 движков HabitAI
 *
 * Единая точка подключения к App.tsx.
 * Загружает данные из Supabase, вычисляет результаты всех движков,
 * обновляется в реальном времени через useRealtimeSync.
 * =========================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { journal } from '../services/unifiedJournal';
import type { Habit } from '../types';

import {
  // Circadian
  getCurrentWindow, getSmartSchedule, getSmartGreeting, isBarakahTime,
  // Momentum
  calcOverallMomentum, getNeverMissTwiceAlerts,
  // Intention
  createIntention, attachReflection, getIntentionStatus, calcIntentionInsight,
  // Muhasaba
  isMuhasabaTime, hasCurrentWeekMuhasaba, calcWeekStats, createMuhasabaSession, calcMuhasabaStreak, getWeekStart,
  // MVH
  assessHardDay, buildMVHList,
  // Gratitude
  createGratitudeEntry, calcGratitudeInsight, shouldPromptGratitude, calcGratitudeStreak,
  // Types
  type DayWindow, type OverallMomentum, type DailyIntention,
  type MuhasabaSession, type GratitudeEntry, type HardDayAssessment,
  type MVHOption, type SmartGreeting, type GratitudeInsight,
  type IntentionInsight, type IntentionStatus, type WeekStats,
  type SmartSchedule,
} from '../services/engines';

// ── Типы состояния хука ────────────────────────────────────────────────────

export interface EnginesState {
  // Circadian
  currentWindow: DayWindow;
  isBarakah: boolean;
  smartGreeting: SmartGreeting | null;
  smartSchedule: SmartSchedule | null;

  // Momentum
  overallMomentum: OverallMomentum | null;
  neverMissTwiceHabits: string[];  // ids

  // Intention
  todayIntention: DailyIntention | null;
  intentionStatus: IntentionStatus;
  intentionStreak: number;
  intentionInsight: IntentionInsight | null;

  // Muhasaba
  muhasabaSessions: MuhasabaSession[];
  isMuhasabaTime: boolean;
  hasThisWeekMuhasaba: boolean;
  muhasabaStreak: number;
  thisWeekStats: WeekStats | null;

  // MVH
  hardDayAssessment: HardDayAssessment | null;
  mvhOptions: MVHOption[];

  // Gratitude
  gratitudeEntries: GratitudeEntry[];
  gratitudeStreak: number;
  shouldPromptGratitude: boolean;
  gratitudeInsight: GratitudeInsight | null;

  // Loading
  loading: boolean;
}

export interface EnginesActions {
  // Intention
  saveIntention: (text: string) => Promise<void>;
  saveIntentionReflection: (note: string) => Promise<void>;

  // Muhasaba
  saveMuhasaba: (q1: string, q2: string, q3: string) => Promise<void>;

  // Gratitude
  saveGratitude: (items: string[], mood?: 1 | 2 | 3 | 4 | 5) => Promise<void>;

  // Refetch
  refetch: () => Promise<void>;
}

// ── Утилита ────────────────────────────────────────────────────────────────

function toDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Основной хук ───────────────────────────────────────────────────────────

export function useEngines(
  user: User | null,
  habits: Habit[],
  userName?: string
): EnginesState & EnginesActions {
  const now = useRef(new Date());

  // Обновляем `now` каждую минуту — чтобы окно не устарело
  useEffect(() => {
    const interval = setInterval(() => {
      now.current = new Date();
      setTick(t => t + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);
  const [tick, setTick] = useState(0);

  // ── Данные из Supabase ────────────────────────────────────────────────────
  const [intentions, setIntentions] = useState<DailyIntention[]>([]);
  const [muhasabaSessions, setMuhasabaSessions] = useState<MuhasabaSession[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Загрузка из Supabase ──────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    try {
      const [intRes, muhRes, gratRes] = await Promise.all([
        supabase
          .from('daily_intentions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(60),

        supabase
          .from('muhasaba_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(52),

        supabase
          .from('gratitude_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(90),
      ]);

      if (intRes.data) {
        setIntentions(intRes.data.map(r => ({
          date: r.date,
          text: r.text,
          completedAt: r.completed_at,
          reflectionNote: r.reflection_note,
        })));
      }

      if (muhRes.data) {
        setMuhasabaSessions(muhRes.data.map(r => ({
          id: r.id,
          weekStart: r.week_start,
          q1_worked: r.q1_worked,
          q2_blocked: r.q2_blocked,
          q3_change: r.q3_change,
          createdAt: r.created_at,
          aiSummary: r.ai_summary,
        })));
      }

      if (gratRes.data) {
        setGratitudeEntries(gratRes.data.map(r => ({
          id: r.id,
          date: r.date,
          items: r.items ?? [],
          mood: r.mood,
          createdAt: r.created_at,
        })));
      }
    } catch (err) {
      console.error('[useEngines] Failed to load engine data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Адаптация habits к HabitSlice (без тяжёлых полей) ────────────────────

  const habitSlices = habits
    .filter(h => !h.archived && h.type !== 'task')
    .map(h => ({
      id: h.id,
      name: h.name,
      completedDates: h.completedDates,
      frequency: h.frequency,
      frequencyDays: h.frequencyDays,
      type: h.type,
      time: h.time,
      isKeystone: h.isKeystone,
      difficulty: h.difficulty,
      tags: h.tags,
    }));

  // ── Вычисления движков (memo-образно через useMemo-логику) ────────────────

  const n = now.current;
  const todayStr = toDateStr(n);

  // Circadian
  const currentWindow = getCurrentWindow(n);
  const barakah = isBarakahTime(n);
  const smartGreeting = getSmartGreeting(userName ?? '', n);
  const smartSchedule = habitSlices.length > 0 ? getSmartSchedule(habitSlices, n) : null;

  // Momentum
  const overallMomentum = habitSlices.length > 0 ? calcOverallMomentum(habitSlices, n) : null;
  const neverMissTwiceHabits = getNeverMissTwiceAlerts(habitSlices, n).map(h => h.id);

  // Intention
  const todayIntention = intentions.find(i => i.date === todayStr) ?? null;
  const intentionStatus = getIntentionStatus(todayIntention, n);
  const intentionStreak = intentions.filter((_, idx) => {
    const d = new Date(n);
    d.setDate(d.getDate() - idx);
    return intentions.some(i => i.date === toDateStr(d));
  }).length;
  const intentionInsight = intentions.length >= 5
    ? calcIntentionInsight(intentions, habitSlices.map(h => ({ completedDates: h.completedDates })))
    : null;

  // Muhasaba
  const muhasabaActive = isMuhasabaTime(n);
  const hasThisWeek = hasCurrentWeekMuhasaba(muhasabaSessions, n);
  const muhasabaStreak = calcMuhasabaStreak(muhasabaSessions, n);
  const prevWeekStart = (() => {
    const d = new Date(getWeekStart(n));
    d.setDate(d.getDate() - 7);
    return toDateStr(d);
  })();
  const thisWeekStats = habitSlices.length > 0
    ? calcWeekStats(habitSlices, getWeekStart(n), prevWeekStart)
    : null;

  // MVH
  const hardDayAssessment = habitSlices.length > 0 ? assessHardDay(habitSlices, n) : null;
  const mvhOptions = habitSlices.length > 0 ? buildMVHList(habitSlices, [], n) : [];

  // Gratitude
  const gratitudeStreak = calcGratitudeStreak(gratitudeEntries, n);
  const promptGratitude = shouldPromptGratitude(gratitudeEntries, n);
  const gratitudeInsight = gratitudeEntries.length >= 5
    ? calcGratitudeInsight(
        gratitudeEntries,
        habitSlices.map(h => ({ completedDates: h.completedDates }))
      )
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const saveIntention = useCallback(async (text: string) => {
    if (!user) return;
    const intention = createIntention(text, n);

    // Оптимистичное обновление
    setIntentions(prev => {
      const filtered = prev.filter(i => i.date !== todayStr);
      return [intention, ...filtered];
    });

    await supabase.from('daily_intentions').upsert({
      user_id: user.id,
      date: intention.date,
      text: intention.text,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });
  }, [user, n, todayStr]);

  const saveIntentionReflection = useCallback(async (note: string) => {
    if (!user || !todayIntention) return;
    const updated = attachReflection(todayIntention, note);

    setIntentions(prev => prev.map(i => i.date === todayStr ? updated : i));

    await supabase.from('daily_intentions').update({
      reflection_note: note,
      completed_at: updated.completedAt,
    }).eq('user_id', user.id).eq('date', todayStr);
  }, [user, todayIntention, todayStr]);

  const saveMuhasaba = useCallback(async (q1: string, q2: string, q3: string) => {
    if (!user) return;
    const session = createMuhasabaSession(q1, q2, q3, n);

    const { data } = await supabase.from('muhasaba_sessions').insert({
      user_id: user.id,
      week_start: session.weekStart,
      q1_worked: session.q1_worked,
      q2_blocked: session.q2_blocked,
      q3_change: session.q3_change,
      created_at: session.createdAt,
    }).select().single();

    if (data) {
      setMuhasabaSessions(prev => [{
        id: data.id,
        weekStart: data.week_start,
        q1_worked: data.q1_worked,
        q2_blocked: data.q2_blocked,
        q3_change: data.q3_change,
        createdAt: data.created_at,
      }, ...prev]);
    }
  }, [user, n]);

  const saveGratitude = useCallback(async (
    items: string[],
    mood?: 1 | 2 | 3 | 4 | 5
  ) => {
    if (!user) return;
    const entry = createGratitudeEntry(items, mood, n);

    // Оптимистичное обновление
    setGratitudeEntries(prev => {
      const filtered = prev.filter(e => e.date !== todayStr);
      return [entry, ...filtered];
    });

    await supabase.from('gratitude_entries').upsert({
      id: entry.id,
      user_id: user.id,
      date: entry.date,
      items: entry.items,
      mood: entry.mood ?? null,
      created_at: entry.createdAt,
    }, { onConflict: 'user_id,date' });

    // Единый журнал (база знаний о человеке)
    journal(user, 'gratitude', { items: entry.items, mood: entry.mood ?? null }, undefined, entry.date).catch(() => {});
  }, [user, n, todayStr]);

  return {
    // State
    currentWindow,
    isBarakah: barakah,
    smartGreeting,
    smartSchedule,
    overallMomentum,
    neverMissTwiceHabits,
    todayIntention,
    intentionStatus,
    intentionStreak,
    intentionInsight,
    muhasabaSessions,
    isMuhasabaTime: muhasabaActive,
    hasThisWeekMuhasaba: hasThisWeek,
    muhasabaStreak,
    thisWeekStats,
    hardDayAssessment,
    mvhOptions,
    gratitudeEntries,
    gratitudeStreak,
    shouldPromptGratitude: promptGratitude,
    gratitudeInsight,
    loading,
    // Actions
    saveIntention,
    saveIntentionReflection,
    saveMuhasaba,
    saveGratitude,
    refetch: loadData,
  };
}
