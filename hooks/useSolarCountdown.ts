/**
 * useSolarCountdown — хук обратного отсчёта до следующего солнечного окна.
 *
 * Реальные астрономические данные от circadianSun (NOAA) по GPS-координатам
 * пользователя. Тикает каждые 30 секунд и возвращает отформатированный
 * остаток времени («42 мин», «1 ч 24 мин»).
 */
import { useState, useEffect } from 'react';
import { circadianSun, NextSolarWindow } from '../services/sensors/circadianSun';

export interface SolarCountdown {
  window: NextSolarWindow | null;
  /** Отформатированный остаток времени до окна */
  countdown: string;
  /** Локальное время наступления окна, например «16:42» */
  atTime: string;
}

const REFRESH_INTERVAL_MS = 30 * 1000;

export function useSolarCountdown(language: 'ru' | 'en' = 'ru'): SolarCountdown {
  const compute = (): SolarCountdown => {
    const now = new Date();
    const win = circadianSun.getNextSolarWindow(now);
    return {
      window: win,
      countdown: circadianSun.formatCountdown(win.at, now, language),
      atTime: `${String(win.at.getHours()).padStart(2, '0')}:${String(win.at.getMinutes()).padStart(2, '0')}`,
    };
  };

  const [state, setState] = useState<SolarCountdown>(compute);

  useEffect(() => {
    const id = setInterval(() => setState(compute()), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return state;
}
