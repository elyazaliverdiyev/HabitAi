import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Habit } from '../types';
import { removeUndefined } from '../utils/helpers';
import { useRealtimeSync } from './useRealtimeSync';

export const useHabits = (user: User | null) => {
  const [habits, setHabitsState] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');

  // Ref to track pending save operations and avoid race conditions
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Единый сокет рассылки для мгновенной синхронизации между устройствами
  const { broadcast } = useRealtimeSync(user, useCallback((type, data) => {
    if (type === 'HABITS_UPDATE' && Array.isArray(data)) {
      setHabitsState(data);
      if (user) {
        const localKey = `habits_${user.id}`;
        localStorage.setItem(localKey, JSON.stringify(data));
      }
      setSaveStatus('saved');
    }
  }, [user]));

  // Инициализация и Подписка на данные (Fallback через postgres_changes)
  useEffect(() => {
    setLoading(true);

    const initData = async () => {
      const localKey = user ? `habits_${user.id}` : 'habits_guest';
      const localData = localStorage.getItem(localKey);

      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            setHabitsState(parsed);
          }
        } catch (e) {
          console.error("Local storage parse error", e);
        }
      }

      if (user) {
        const fetchHabits = async () => {
            const { data, error } = await supabase.from('users').select('habits').eq('id', user.id).single();
            if (data?.habits && Array.isArray(data.habits)) {
                setHabitsState(data.habits);
                setTimeout(() => {
                    localStorage.setItem(localKey, JSON.stringify(data.habits));
                }, 0);
                setSaveStatus('saved');
            } else if (localData && !error) {
                try {
                    const initialData = JSON.parse(localData);
                    await supabase.from('users').update({ habits: removeUndefined(initialData) }).eq('id', user.id);
                } catch (e) {
                    console.error("Failed to push initial local data", e);
                }
            }
            setLoading(false);
        };
        fetchHabits();
      } else {
        setLoading(false);
      }
    };

    initData();

    if (!user) return () => {};

    // Subscribe to real-time changes as DB fallback
    const channel = supabase
      .channel('public:users:habits')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
          const data = payload.new as any;
          // Only update if there are actual new habits and not in the middle of a local pending save
          if (data && data.habits && Array.isArray(data.habits) && !pendingSaveRef.current) {
              setHabitsState((current) => {
                  if (JSON.stringify(current) === JSON.stringify(data.habits)) return current;
                  const localKey = `habits_${user.id}`;
                  localStorage.setItem(localKey, JSON.stringify(data.habits));
                  return data.habits;
              });
              setSaveStatus('saved');
          }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. Оптимизированная функция сохранения
  const setHabits = useCallback((newHabitsOrFn: Habit[] | ((prev: Habit[]) => Habit[])) => {
    // STEP 1: Мгновенное обновление UI
    setHabitsState((prev) => {
      const nextHabits = typeof newHabitsOrFn === 'function' ? newHabitsOrFn(prev) : newHabitsOrFn;

      // Broadcast мгновенно всем ведомым устройствам (15-40ms)
      broadcast('HABITS_UPDATE', nextHabits);

      // STEP 2: Асинхронное локальное сохранение & фоновый Push в DB
      const scheduleAsyncSave = () => {
        const localKey = user ? `habits_${user.id}` : 'habits_guest';

        const saveToLocalStorage = () => {
          try {
            localStorage.setItem(localKey, JSON.stringify(nextHabits));
          } catch (e) {
            console.error("localStorage save failed", e);
          }
        };

        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(saveToLocalStorage, { timeout: 1000 });
        } else {
          setTimeout(saveToLocalStorage, 50);
        }

        // Supabase async DB save with 300ms debounce
        if (user) {
          setSaveStatus('saving');

          if (pendingSaveRef.current) {
            clearTimeout(pendingSaveRef.current);
          }

          pendingSaveRef.current = setTimeout(() => {
            const scheduleSupabaseSave = async () => {
              try {
                let totalCompletions = 0;
                for (let i = 0; i < nextHabits.length; i++) {
                  totalCompletions += nextHabits[i].completedDates?.length || 0;
                }

                const cleanHabits = removeUndefined(nextHabits);

                const { error } = await supabase.from('users').update({
                  habits: cleanHabits,
                  totalCompletions
                }).eq('id', user.id);
                
                if (error) {
                    console.error("Save to cloud failed", error);
                    setSaveStatus('error');
                } else {
                    setSaveStatus('saved');
                }
              } catch (e) {
                console.error("Async save exception", e);
                setSaveStatus('error');
              }
            };
            scheduleSupabaseSave();
          }, 300);
        }
      };

      scheduleAsyncSave();
      return nextHabits;
    });
  }, [user, broadcast]);

  return { habits, setHabits, loading, saveStatus };
};
