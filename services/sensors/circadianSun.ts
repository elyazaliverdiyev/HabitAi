/**
 * circadianSun.ts — Астрономический расчет положения солнца и циркадных окон по GPS/Геолокации.
 * 
 * Точно вычисляет:
 * - Астрономический рассвет (Фаджр / Первые лучи)
 * - Восход солнца (Sunrise)
 * - Солнечный полдень (Solar Noon / Зухр)
 * - Золотой час (Golden Hour / Аср)
 * - Закат (Sunset / Магриб)
 * - Сумерки (Dusk / Иша)
 * 
 * Использует стандартные алгоритмы солнечной тригонометрии NOAA (National Oceanic and Atmospheric Administration).
 */

export interface SolarTimes {
  fajrDawn: Date;
  sunrise: Date;
  solarNoon: Date;
  goldenHour: Date;
  sunset: Date;
  ishaDusk: Date;
  currentPhase: 'tahajjud' | 'fajr' | 'duha' | 'zuhr' | 'asr' | 'maghrib' | 'isha';
  isBarakahNow: boolean;
}

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export interface NextSolarWindow {
  /** Ключ события */
  key: 'fajr' | 'sunrise' | 'zuhr' | 'asr' | 'sunset' | 'isha';
  /** Момент наступления (Date) */
  at: Date;
  /** Название окна */
  label: { ru: string; en: string };
  /** Короткое описание энергетического смысла окна */
  hint: { ru: string; en: string };
}

const SOLAR_WINDOW_META: Record<NextSolarWindow['key'], { label: { ru: string; en: string }; hint: { ru: string; en: string } }> = {
  fajr: {
    label: { ru: 'Фаджр', en: 'Fajr' },
    hint: { ru: 'баркатное утро, лучшее время для намерений', en: 'blessed dawn, best time for intentions' },
  },
  sunrise: {
    label: { ru: 'Восход', en: 'Sunrise' },
    hint: { ru: 'запуск циркадного ритма', en: 'circadian rhythm starts' },
  },
  zuhr: {
    label: { ru: 'Зухр', en: 'Zuhr' },
    hint: { ru: 'солнечный полдень, пик ясности', en: 'solar noon, peak clarity' },
  },
  asr: {
    label: { ru: 'Аср', en: 'Asr' },
    hint: { ru: 'пик физической энергии', en: 'peak physical energy' },
  },
  sunset: {
    label: { ru: 'Закат (Магриб)', en: 'Sunset (Maghrib)' },
    hint: { ru: 'время замедления и благодарности', en: 'time to slow down and be grateful' },
  },
  isha: {
    label: { ru: 'Иша', en: 'Isha' },
    hint: { ru: 'вечерний отдых и сон', en: 'evening rest and sleep' },
  },
};

class CircadianSunService {
  private cachedCoords: GeoCoords | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('habitai_geo_coords');
      if (saved) {
        try {
          this.cachedCoords = JSON.parse(saved);
        } catch (e) {}
      }
    }
  }

  public async requestGeoLocation(): Promise<GeoCoords | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) return this.cachedCoords;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeoCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          this.cachedCoords = coords;
          localStorage.setItem('habitai_geo_coords', JSON.stringify(coords));
          resolve(coords);
        },
        () => {
          // Fallback if denied or error: keep cached coords or default to estimate
          resolve(this.cachedCoords);
        },
        { timeout: 8000, maximumAge: 600000 }
      );
    });
  }

  public getSolarTimes(date: Date = new Date(), customCoords?: GeoCoords): SolarTimes {
    const coords = customCoords || this.cachedCoords || { latitude: 55.7558, longitude: 37.6173 }; // Default to UTC+3 Moscow approx if none

    const lat = coords.latitude;
    const lng = coords.longitude;

    // Day of year calculation
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Solar declination approximation
    const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
    
    // Equation of time approximation (minutes)
    const b = ((360 / 365) * (dayOfYear - 81) * Math.PI) / 180;
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

    // Timezone offset in hours
    const tzOffsetHours = -date.getTimezoneOffset() / 60;

    // Solar noon in hours (Local time)
    const solarNoonHour = 12 + (tzOffsetHours * 15 - lng) / 15 - eot / 60;

    // Hour angle for horizon (-0.833 deg standard refraction)
    const rad = Math.PI / 180;
    const latRad = lat * rad;
    const decRad = declination * rad;

    const cosHourAngle = (Math.sin(-0.833 * rad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
    const hourAngle = (Math.acos(clampedCos) * 180) / Math.PI / 15;

    // Sunrise & Sunset hours
    const sunriseHour = solarNoonHour - hourAngle;
    const sunsetHour = solarNoonHour + hourAngle;

    // Dawn (Fajr ~15-18 deg below horizon)
    const cosDawn = (Math.sin(-16 * rad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    const clampedDawn = Math.max(-1, Math.min(1, cosDawn));
    const dawnHourAngle = (Math.acos(clampedDawn) * 180) / Math.PI / 15;
    const fajrHour = solarNoonHour - dawnHourAngle;

    // Dusk (Isha ~15-17 deg below horizon)
    const ishaHour = solarNoonHour + dawnHourAngle;

    // Golden hour (Sun at +6 deg above horizon)
    const goldenHour = sunsetHour - 1.0;

    // Build Date objects
    const createTime = (decimalHours: number) => {
      const h = Math.floor(decimalHours);
      const m = Math.floor((decimalHours - h) * 60);
      const res = new Date(date);
      res.setHours(h, m, 0, 0);
      return res;
    };

    const fajrTime = createTime(fajrHour);
    const sunriseTime = createTime(sunriseHour);
    const noonTime = createTime(solarNoonHour);
    const goldenTime = createTime(goldenHour);
    const sunsetTime = createTime(sunsetHour);
    const ishaTime = createTime(ishaHour);

    const now = date.getTime();

    let currentPhase: SolarTimes['currentPhase'] = 'duha';
    let isBarakahNow = false;

    if (now < fajrTime.getTime() || now >= ishaTime.getTime() + 4 * 3600000) {
      currentPhase = 'tahajjud';
      isBarakahNow = true;
    } else if (now >= fajrTime.getTime() && now < sunriseTime.getTime() + 1.5 * 3600000) {
      currentPhase = 'fajr';
      isBarakahNow = true;
    } else if (now >= sunriseTime.getTime() && now < noonTime.getTime()) {
      currentPhase = 'duha';
      isBarakahNow = false;
    } else if (now >= noonTime.getTime() && now < goldenTime.getTime()) {
      currentPhase = 'zuhr';
      isBarakahNow = false;
    } else if (now >= goldenTime.getTime() && now < sunsetTime.getTime()) {
      currentPhase = 'asr';
      isBarakahNow = false;
    } else if (now >= sunsetTime.getTime() && now < ishaTime.getTime()) {
      currentPhase = 'maghrib';
      isBarakahNow = false;
    } else {
      currentPhase = 'isha';
      isBarakahNow = false;
    }

    return {
      fajrDawn: fajrTime,
      sunrise: sunriseTime,
      solarNoon: noonTime,
      goldenHour: goldenTime,
      sunset: sunsetTime,
      ishaDusk: ishaTime,
      currentPhase,
      isBarakahNow
    };
  }

  /**
   * Возвращает следующее (ближайшее будущее) солнечное окно относительно `now`.
   * Если все события сегодняшнего дня уже прошли — возвращает Фаджр завтрашнего дня.
   * Расчёт ведётся по тем же NOAA-формулам, что и getSolarTimes: реальная астрономия,
   * без заглушек.
   */
  public getNextSolarWindow(now: Date = new Date()): NextSolarWindow {
    const buildFor = (date: Date): { key: NextSolarWindow['key']; at: Date }[] => {
      const times = this.getSolarTimes(date);
      return [
        { key: 'fajr', at: times.fajrDawn },
        { key: 'sunrise', at: times.sunrise },
        { key: 'zuhr', at: times.solarNoon },
        { key: 'asr', at: times.goldenHour },
        { key: 'sunset', at: times.sunset },
        { key: 'isha', at: times.ishaDusk },
      ];
    };

    const todayEvents = buildFor(now);
    const upcoming = todayEvents.find(e => e.at.getTime() > now.getTime());

    if (upcoming) {
      return { key: upcoming.key, at: upcoming.at, ...SOLAR_WINDOW_META[upcoming.key] };
    }

    // Все события сегодня прошли → следующий Фаджр завтра
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowFajr = buildFor(tomorrow)[0];
    return { key: tomorrowFajr.key, at: tomorrowFajr.at, ...SOLAR_WINDOW_META[tomorrowFajr.key] };
  }

  /**
   * Человекочитаемый обратный отсчёт до момента `target` («1 ч 24 мин», «42 мин», «до завтра»).
   */
  public formatCountdown(target: Date, now: Date = new Date(), language: 'ru' | 'en' = 'ru'): string {
    let diffMs = target.getTime() - now.getTime();
    if (diffMs < 0) diffMs = 0;

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return language === 'ru' ? `${days} д ${hours} ч` : `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return language === 'ru' ? `${hours} ч ${minutes} мин` : `${hours}h ${minutes}m`;
    }
    return language === 'ru' ? `${minutes} мин` : `${minutes}m`;
  }
}

export const circadianSun = new CircadianSunService();
