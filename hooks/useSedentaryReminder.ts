/**
 * useSedentaryReminder — Детектор сидячего образа жизни для шагомера.
 *
 * Если шагомер активен, но не фиксировал движения ≥90 минут в дневное
 * циркадное окно (между Восходом и Закатом по GPS-астрономии NOAA),
 * показывает бейдж-напоминание о разминке и (однократно за окно простоя)
 * отправляет системное уведомление через notifications.ts
 * (Web Notifications API / Capacitor Local Notifications).
 *
 * Никаких заглушек: состояние строится из реальных данных stepTracker
 * (lastStepAt) и circadianSun (sunrise/sunset).
 */
import { useState, useEffect, useRef } from 'react';
import { stepTracker } from '../services/sensors/stepTracker';
import { circadianSun } from '../services/sensors/circadianSun';

export interface SedentaryState {
  /** Простой превышает порог — пора показать напоминание */
  isSedentary: boolean;
  /** Минут с последнего шага (или с начала отслеживания) */
  minutesIdle: number;
}

const IDLE_THRESHOLD_MS = 90 * 60 * 1000; // 90 минут
const CHECK_INTERVAL_MS = 60 * 1000;      // проверка раз в минуту

export function useSedentaryReminder(
  isTracking: boolean,
  language: 'ru' | 'en' = 'ru'
): SedentaryState {
  const [state, setState] = useState<SedentaryState>({ isSedentary: false, minutesIdle: 0 });
  const notifiedRef = useRef(false);
  const trackingStartRef = useRef<number>(0);

  useEffect(() => {
    if (!isTracking) {
      setState({ isSedentary: false, minutesIdle: 0 });
      return;
    }

    trackingStartRef.current = Date.now();

    const check = async () => {
      const now = Date.now();
      const lastStepAt = stepTracker.getLastStepAt();
      // Если шагов ещё не было — считаем от начала отслеживания
      const idleSince = lastStepAt > 0 ? lastStepAt : trackingStartRef.current;
      const idleMs = now - idleSince;

      // Только дневное циркадное окно: Восход → Закат (реальная астрономия по GPS)
      const solar = circadianSun.getSolarTimes(new Date());
      const isDaylight = now >= solar.sunrise.getTime() && now < solar.sunset.getTime();

      if (!isDaylight) {
        // Ночью не дёргаем пользователя; сбрасываем флаг уведомления для следующего дня
        notifiedRef.current = false;
        setState(prev => ({ ...prev, isSedentary: false }));
        return;
      }

      const minutesIdle = Math.floor(idleMs / 60000);
      const isSedentary = idleMs >= IDLE_THRESHOLD_MS;

      if (isSedentary && !notifiedRef.current) {
        notifiedRef.current = true;
        try {
          const { showInstantNotification } = await import('../notifications');
          await showInstantNotification(
            language === 'ru' ? '👟 Время размяться!' : '👟 Time to move!',
            language === 'ru'
              ? `Шагомер не фиксировал движение ${minutesIdle} мин. Сделай 2-минутную разминку — кольцо Move скажет спасибо.`
              : `No movement detected for ${minutesIdle} min. Take a 2-minute stretch — your Move ring will thank you.`,
            'sedentary-reminder'
          );
        } catch (e) {
          // Уведомления не разрешены — бейдж в UI всё равно покажется
          console.warn('[SedentaryReminder] notification failed:', e);
        }
      }

      // Если пользователь снова пошёл — разрешаем следующее уведомление
      if (!isSedentary) {
        notifiedRef.current = false;
      }

      setState({ isSedentary, minutesIdle });
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isTracking, language]);

  return state;
}
