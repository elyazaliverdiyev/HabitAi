/**
 * HabitAI Motion System — единая Apple-подобная система анимаций.
 *
 * ПРИНЦИПЫ (см. docs/ANIMATION_GUIDELINES.md):
 * 1. Только эти токены. Никаких inline `stiffness/damping/ease` в компонентах.
 * 2. Функциональное движение — без overshoot. Праздник — только там, где есть повод.
 * 3. Длительности: вход ≤ 0.35с, выход ≤ 0.2с. Всё дольше 0.5с — ошибка.
 * 4. Один и тот же паттерн = одна и та же физика везде в приложении.
 *
 * Иерархия токенов (от быстрого к торжественному):
 *   press      — нажатия, чекбоксы, сегменты        (~120мс, без bounce)
 *   control    — слайдеры, переключатели, drag       (~180мс, без bounce)
 *   container  — карточки, панели, списки            (~250мс, едва заметный bounce)
 *   sheet      — модалки, шторки                     (~300мс, плавно)
 *   celebrate  — завершения, награды, миллстоуны     (единственный с явным bounce)
 */
import React from 'react';

// ═══════════════════════════════════════════════════════════
// CANONICAL TOKENS — использовать только эти
// ═══════════════════════════════════════════════════════════

/** Нажатия, чекбоксы, вкладки-сегменты: мгновенный отклик, нулевой overshoot */
export const motionPress = { type: "spring" as const, stiffness: 550, damping: 36, mass: 0.5 };

/** Слайдеры, toggle, drag-элементы: плотный, «тягучий» отклик без отскока */
export const motionControl = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/** Карточки, списки, панели: мягкое появление, bounce ≤ 0.05 (почти незаметен) */
export const motionContainer = { type: "spring" as const, bounce: 0.05, duration: 0.32 };

/** Модалки, bottom sheets, поповеры: плавный подъём без пружинного желе */
export const motionSheet = { type: "spring" as const, bounce: 0.08, duration: 0.38 };

/** Празднование: завершение привычки, стрик, ачивка — ЕДИНСТВЕННЫЙ токен с bounce */
export const motionCelebrate = { type: "spring" as const, stiffness: 300, damping: 16, mass: 0.7 };

/** Переход между экранами/табами: направленный сдвиг, короткий */
export const motionPage = { type: "spring" as const, bounce: 0.12, duration: 0.42 };

/** layoutId-морфинг (общий элемент переезжает между позициями) */
export const motionLayout = { type: "spring" as const, bounce: 0.15, duration: 0.45 };

// ═══════════════════════════════════════════════════════════
// EASING — только эти кривые для tween-анимаций
// ═══════════════════════════════════════════════════════════

/** Apple default: плавный вход-выход для прогрессов и цвета */
export const easeApple = [0.25, 0.1, 0.25, 1] as const;

/** Декелерация входа (появление контента) */
export const easeDecel = [0.16, 1, 0.3, 1] as const;

/** Ускорение выхода (исчезание) */
export const easeAccel = [0.4, 0, 1, 1] as const;

// Стандартные длительности (сек)
export const durationFast = 0.18;   // выход/исчезание
export const durationBase = 0.25;   // стандартный tween
export const durationSlow = 0.35;   // крупные переходы, цвет

// ═══════════════════════════════════════════════════════════
// LEGACY ALIASES — сохранены для совместимости импортов.
// Все ведут к каноническим токенам выше.
// ═══════════════════════════════════════════════════════════

/** @deprecated → motionPress */
export const springSnappy = motionPress;
/** @deprecated → motionContainer */
export const springGentle = { type: "spring" as const, bounce: 0.06, duration: 0.35 };
/** @deprecated → motionCelebrate */
export const springBouncy = motionCelebrate;
/** @deprecated → motionCelebrate */
export const springMajestic = motionCelebrate;
/** @deprecated → motionSheet */
export const springModal = motionSheet;
/** @deprecated → motionPage */
export const springPage = motionPage;
/** @deprecated → motionLayout */
export const springLayout = motionLayout;
/** @deprecated → motionContainer */
export const springTab = { type: "spring" as const, bounce: 0.05, duration: 0.3 };
/** @deprecated → motionControl */
export const dockSpring = motionControl;
/** @deprecated → motionCelebrate */
export const iconPop = motionCelebrate;
/** @deprecated → motionControl */
export const glassInteractive = motionControl;
/** @deprecated → motionContainer */
export const glassMaterialise = { type: "spring" as const, bounce: 0.06, duration: 0.35 };

// === Tab Content Transition Variants (direction-aware) ===

const TAB_ORDER = ['home', 'calendar', 'focus', 'stats', 'community'] as const;

/** Get direction from tab change: 1 = forward, -1 = backward */
export const getTabDirection = (from: string, to: string): number => {
    const fromIdx = TAB_ORDER.indexOf(from as any);
    const toIdx = TAB_ORDER.indexOf(to as any);
    return toIdx >= fromIdx ? 1 : -1;
};

/** Direction-aware tab content variants */
export const tabContentVariants = {
    enter: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? 32 : -32,
    }),
    center: {
        opacity: 1,
        x: 0,
        transition: { ...motionPage } as any,
    },
    exit: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? -24 : 24,
        transition: { duration: durationFast, ease: easeAccel as any },
    }),
};

// === Variant Presets ===

/** Staggered list container */
export const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.04, delayChildren: 0.03 }
    }
};

/** Staggered list item */
export const staggerItem = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: motionContainer
    }
};

/** Fade in from below — single element */
export const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.05, duration: 0.32 } }
};

/** Scale in — modals, popovers */
export const scaleIn = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: motionSheet }
};

/** Sheet up — bottom sheets, iOS-style */
export const sheetUp = {
    hidden: { opacity: 0, y: 32, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: motionSheet }
};

// === Page / Tab Transitions ===

export const slideLeft = {
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0, transition: motionPage },
    exit: { opacity: 0, x: -48, transition: { duration: durationFast } }
};

export const slideRight = {
    initial: { opacity: 0, x: -48 },
    animate: { opacity: 1, x: 0, transition: motionPage },
    exit: { opacity: 0, x: 48, transition: { duration: durationFast } }
};

export const crossFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: durationBase } },
    exit: { opacity: 0, transition: { duration: durationFast } }
};

export const getPageVariants = (direction: number) => ({
    initial: { opacity: 0, x: direction > 0 ? 56 : -56 },
    animate: { opacity: 1, x: 0, transition: motionPage },
    exit: { opacity: 0, x: direction > 0 ? -56 : 56, transition: { duration: durationFast } }
});

// === Modal Navigation (nested pages) ===

export const modalPush = {
    initial: { opacity: 0, x: '100%' },
    animate: { opacity: 1, x: 0, transition: motionSheet },
    exit: { opacity: 0, x: '100%', transition: { duration: 0.22, ease: easeAccel as any } }
};

export const modalPop = {
    initial: { opacity: 0, x: '-30%' },
    animate: { opacity: 1, x: 0, transition: motionSheet },
    exit: { opacity: 0, x: '-30%', transition: { duration: durationFast } }
};

// === List Layout Helpers ===

export const listItemLayout = {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: motionContainer },
    exit: { opacity: 0, scale: 0.96, transition: { duration: durationFast } }
};

export const listItemPop = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: motionCelebrate },
    exit: { opacity: 0, scale: 0.9, transition: { duration: durationFast } }
};

// === Interaction Helpers ===

/** Tap scale for buttons */
export const tapScale = { scale: 0.96 };

/** Tap scale for smaller elements */
export const tapScaleSmall = { scale: 0.85 };

/** Hover lift for cards (desktop only) */
export const hoverLift = { y: -2, scale: 1.01 };

/** Completion celebration pop */
export const completionPop = {
    scale: [1, 1.18, 1],
    transition: motionCelebrate,
};

// ═══════════════════════════════════════════════════════════
// DEPRECATED visual helpers — не входят в систему движения,
// сохранены для совместимости
// ═══════════════════════════════════════════════════════════

export const handle3DTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.transform =
        `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.015)`;
};

export const handle3DTiltLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform =
        'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
};

export const handleSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
};

/** Glass shimmer variant */
export const glassShimmerVariant = {
    initial: { backgroundPosition: '200% 0' },
    animate: { backgroundPosition: '-200% 0', transition: { duration: 1.5, ease: 'easeInOut' } },
};

export const glassHoverLift = { y: -3, scale: 1.02 };

export const glassTapPress = { scale: 0.97 };
