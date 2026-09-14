/**
 * useStepTracker.ts — React хук для автоматического отслеживания шагов со смартфона.
 * 
 * Автоматически синхронизирует шаги с привычкой «Шаги» (если она есть)
 * и передает реальные данные в кольцо активности Move.
 */
import { useState, useEffect, useCallback } from 'react';
import { stepTracker } from '../services/sensors/stepTracker';
import { nativeSteps } from '../services/sensors/nativeSteps';
import { Habit } from '../types';

export interface UseStepTrackerReturn {
  stepsToday: number;
  isSupported: boolean;
  isTracking: boolean;
  startStepTracking: () => Promise<boolean>;
  stopStepTracking: () => void;
  addManualSteps: (delta: number) => void;
}

export function useStepTracker(
  habits?: Habit[],
  onUpdateHabitProgress?: (habitId: string, progress: number) => void
): UseStepTrackerReturn {
  const [stepsToday, setStepsToday] = useState<number>(() => stepTracker.getStepsToday());
  const [isSupported] = useState<boolean>(() => stepTracker.isSensorSupported());
  const [isTracking, setIsTracking] = useState<boolean>(false);

  useEffect(() => {
    // Подписка на нативные шаги (Android) — синхронизирует state
    const unsubNative = nativeSteps.subscribe((steps) => {
      setStepsToday(steps);
    });

    // Подписка на обновления шагов
    const unsubscribe = stepTracker.subscribe((steps) => {
      setStepsToday(steps);

      // Авто-синхронизация с привычкой «Шаги»
      if (habits && onUpdateHabitProgress) {
        const stepHabit = habits.find(h => {
          const lower = (h.name + ' ' + (h.icon || '')).toLowerCase();
          return lower.includes('шаг') || lower.includes('ход') || lower.includes('walk') || lower.includes('step');
        });

        if (stepHabit) {
          onUpdateHabitProgress(stepHabit.id, steps);
        }
      }
    });

    return () => {
      unsubNative();
      unsubscribe();
    };
  }, [habits, onUpdateHabitProgress]);

  const startStepTracking = useCallback(async () => {
    // 1. Пробуем нативный сенсор (Android Generic Sensor / Capacitor) — честные
    //    аппаратные шаги, тот же localStorage-ключ, что и у DeviceMotion.
    const nativeOk = await nativeSteps.start();
    if (nativeOk) {
      setIsTracking(true);
      return true;
    }
    // 2. Fallback: DeviceMotion (iOS Safari и старые браузеры)
    const success = await stepTracker.startTracking();
    setIsTracking(success);
    return success;
  }, []);

  const stopStepTracking = useCallback(() => {
    stepTracker.stopTracking();
    setIsTracking(false);
  }, []);

  const addManualSteps = useCallback((delta: number) => {
    const newTotal = stepTracker.addSteps(delta);
    setStepsToday(newTotal);
  }, []);

  return {
    stepsToday,
    isSupported,
    isTracking,
    startStepTracking,
    stopStepTracking,
    addManualSteps
  };
}
