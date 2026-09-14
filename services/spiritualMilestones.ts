/**
 * spiritualMilestones.ts — Движок духовных порогов повторений (Сунна & Нейробиология).
 *
 * Лестница повторений из спекфикации «Baraka & Iman Mind»:
 *   15  — Осознание ума: отсечение автоматической мысли страха
 *   33  — Порог сердца (Сунна Тасбиха): синхронизация, уход зажима
 *   70  — Растворение сопротивления (Сунна Истигфара): полнота очищения
 *   100+ — Печать защиты (Сунна Тахлиля): несокрушимый щит от васваса
 *
 * Точная реализация getStageInfo/getNextMilestone из спеки, с динамической
 * темой плеера (Синий → Фиолетовый → Янтарный → Золотой).
 */

export type SpiritualLevel = 1 | 2 | 3 | 4 | 5;

export interface MilestoneStage {
  level: SpiritualLevel;
  minCount: number;
  maxCount: number;
  title: string;
  description: string;
  icon: string;
  color: string;      // HEX — акцент плеера
  bgGradient: string; // CSS Background карточки
  borderStyle: string;
  boxShadow: string;
  sunnahSource: string;
}

export function getNextMilestone(currentCount: number): number {
  if (currentCount < 15) return 15;
  if (currentCount < 33) return 33;
  if (currentCount < 70) return 70;
  if (currentCount < 100) return 100;
  return currentCount + 33; // После 100 добавляем круги по 33
}

export function getStageInfo(count: number): MilestoneStage {
  if (count < 15) {
    return {
      level: 1,
      minCount: 0,
      maxCount: 14,
      title: 'Уровень 1: Осознание ума',
      description: 'Отсечение мысли страха, ум перестаёт соглашаться с ложью',
      icon: '🧠',
      color: '#0a84ff',
      bgGradient: 'rgba(10, 132, 255, 0.08)',
      borderStyle: '1px solid rgba(10, 132, 255, 0.25)',
      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
      sunnahSource: 'Стартовый импульс осознанности',
    };
  } else if (count < 33) {
    return {
      level: 2,
      minCount: 15,
      maxCount: 32,
      title: 'Уровень 2: Порог сердца (Сунна 33×)',
      description: 'Мысль переходит в грудь, откликается тело и уходит зажим',
      icon: '🫀',
      color: '#bf5af2',
      bgGradient: 'rgba(191, 90, 242, 0.09)',
      borderStyle: '1px solid rgba(191, 90, 242, 0.35)',
      boxShadow: '0 4px 20px rgba(191, 90, 242, 0.14), 0 0 10px rgba(191, 90, 242, 0.08)',
      sunnahSource: 'Сунна Тасбиха (33×)',
    };
  } else if (count < 70) {
    return {
      level: 3,
      minCount: 33,
      maxCount: 69,
      title: 'Уровень 3: Растворение сопротивления',
      description: 'Уходит внутренний спор, старая программа теряет силу',
      icon: '🌊',
      color: '#ff9f0a',
      bgGradient: 'rgba(255, 159, 10, 0.09)',
      borderStyle: '1px solid rgba(255, 159, 10, 0.38)',
      boxShadow: '0 4px 22px rgba(255, 159, 10, 0.16), 0 0 12px rgba(255, 159, 10, 0.08)',
      sunnahSource: 'Послойное вымывание наслоений',
    };
  } else if (count < 100) {
    return {
      level: 4,
      minCount: 70,
      maxCount: 99,
      title: 'Уровень 4: Пророческий масштаб (Сунна 70×)',
      description: 'Полнота очищения от наслоений, глубокий внутренний покой',
      icon: '🛡️',
      color: '#ffd60a',
      bgGradient: 'rgba(255, 214, 10, 0.10)',
      borderStyle: '1.2px solid rgba(255, 214, 10, 0.50)',
      boxShadow: '0 4px 26px rgba(255, 214, 10, 0.22), 0 0 16px rgba(255, 214, 10, 0.14)',
      sunnahSource: 'Сунна Истигфара (70×)',
    };
  } else {
    return {
      level: 5,
      minCount: 100,
      maxCount: Infinity,
      title: 'Уровень 5: Печать защиты (Сунна 100×)',
      description: 'Тотальное квантовое перепрограммирование, несокрушимый щит',
      icon: '👑',
      color: '#ffd60a',
      bgGradient: 'linear-gradient(135deg, rgba(255, 214, 10, 0.15) 0%, rgba(255, 179, 0, 0.10) 100%)',
      borderStyle: '1.5px solid rgba(255, 214, 10, 0.75)',
      boxShadow: '0 6px 32px rgba(255, 214, 10, 0.32), 0 0 22px rgba(255, 214, 10, 0.25)',
      sunnahSource: 'Сунна Тахлиля (100×)',
    };
  }
}

/** Все пороги для отрисовки лестницы прогресса */
export const MILESTONE_STEPS = [15, 33, 70, 100] as const;

/**
 * Прогресс внутри текущего этапа (0–100%) — для прогресс-бара плеера.
 */
export function getStageProgress(count: number): number {
  const stage = getStageInfo(count);
  if (stage.maxCount === Infinity) {
    // После 100: прогресс внутри текущего круга по 33
    const circlePos = (count - 100) % 33;
    return Math.round((circlePos / 33) * 100);
  }
  const span = stage.maxCount - stage.minCount + 1;
  return Math.round(((count - stage.minCount) / span) * 100);
}

/**
 * Оценка оставшегося времени до следующего порога при известной длине трека.
 */
export function estimateTimeToNext(currentCount: number, trackDurationSec: number): string {
  const next = getNextMilestone(currentCount);
  const repeatsLeft = next - currentCount;
  const secondsLeft = repeatsLeft * (trackDurationSec + 0.5); // +500мс пауза между повторами
  if (secondsLeft < 60) return `${Math.round(secondsLeft)} сек`;
  const minutes = Math.round(secondsLeft / 60);
  if (minutes < 60) return `~${minutes} мин`;
  return `~${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}
