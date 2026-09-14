import { playSound } from './sound';

// --- Helpers ---
export const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // Light tap
    }
};

export const triggerStrongHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20); // Medium tap
    }
};

// --- CSS-Based Celebration System (replaces canvas-confetti to prevent freezing) ---

const createParticle = (
    x: number,
    y: number,
    color: string,
    shape: 'circle' | 'star' | 'square' = 'circle',
    spread: number = 360,
    velocity: number = 400,
    duration: number = 1200
): HTMLElement => {
    const el = document.createElement('div');
    const size = shape === 'star' ? 10 : 6 + Math.random() * 6;
    const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
    const speed = velocity * (0.5 + Math.random() * 0.5);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - 200; // upward bias

    el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape === 'square' ? '2px' : '50%'};
        pointer-events: none;
        z-index: 10000;
        will-change: transform, opacity;
    `;

    if (shape === 'star') {
        el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        el.style.borderRadius = '0';
    }

    document.body.appendChild(el);

    const startTime = performance.now();
    const animate = (now: number) => {
        const t = (now - startTime) / duration;
        if (t >= 1) {
            el.remove();
            return;
        }
        const easedT = t;
        const currentX = x + dx * easedT;
        const currentY = y + dy * easedT + 500 * easedT * easedT; // gravity
        el.style.transform = `translate(${currentX - x}px, ${currentY - y}px) rotate(${easedT * 720}deg) scale(${1 - easedT * 0.5})`;
        el.style.opacity = String(1 - easedT);
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    return el;
};

const burstParticles = (
    count: number,
    colors: string[],
    originX: number = window.innerWidth / 2,
    originY: number = window.innerHeight / 2,
    shape: 'circle' | 'star' | 'square' = 'circle',
    spread: number = 360,
    velocity: number = 400,
    duration: number = 1200
) => {
    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        setTimeout(() => {
            createParticle(originX, originY, color, shape, spread, velocity, duration);
        }, Math.random() * 200);
    }
};

// Celebration Effect
export const triggerProCelebration = () => {
    playSound('celebration');
    triggerStrongHaptic();

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // 3 bursts over 2 seconds
    burstParticles(30, ['#FFD700', '#FF4500', '#8b5cf6', '#38bdf8'], cx * 0.3, cy, 'star', 360, 500, 1500);
    burstParticles(30, ['#FFD700', '#FF4500', '#8b5cf6', '#38bdf8'], cx * 1.7, cy, 'circle', 360, 500, 1500);
    setTimeout(() => {
        burstParticles(40, ['#FFD700', '#FF4500', '#F59E0B'], cx, cy * 0.6, 'star', 360, 400, 1800);
    }, 500);
    setTimeout(() => {
        burstParticles(20, ['#8b5cf6', '#38bdf8', '#22c55e'], cx, cy, 'circle', 360, 350, 1400);
    }, 1000);
};

// Streak Celebration - triggered at milestones
export const triggerStreakCelebration = (streak: number) => {
    if (![3, 7, 14, 21, 30, 50, 100].includes(streak)) return;

    playSound('celebration');
    triggerStrongHaptic();

    const isMajor = streak >= 21;
    const isLegendary = streak >= 50;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.5;

    const colors = isLegendary
        ? ['#FFD700', '#FF6B00', '#FF0000']
        : isMajor
            ? ['#8B5CF6', '#EC4899', '#F59E0B']
            : ['#3B82F6', '#06B6D4', '#10B981'];

    const count = isLegendary ? 60 : isMajor ? 40 : 20;
    const shape: 'circle' | 'star' = isLegendary ? 'star' : 'circle';

    burstParticles(count, colors, cx, cy, shape, 360, isLegendary ? 500 : 400, isLegendary ? 2000 : 1400);

    if (isMajor) {
        setTimeout(() => burstParticles(count / 2, colors, cx * 0.2, cy, 'star', 180, 400, 1500), 300);
        setTimeout(() => burstParticles(count / 2, colors, cx * 1.8, cy, 'star', 180, 400, 1500), 300);
    }
};

// Quick celebration for habit completion
export const triggerQuickCelebration = () => {
    triggerHaptic();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.7;
    burstParticles(15, ['#10B981', '#34D399', '#6EE7B7'], cx, cy, 'circle', 60, 250, 800);
};

// Helper to get local date string YYYY-MM-DD
export const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ============================
// IDENTITY SYSTEM HELPERS
// ============================

import { Habit, UserIdentity, IDENTITY_PRESETS } from '../types';

/**
 * Calculate daily identity score - percentage of identity-aligned habits completed today
 */
export const calculateDailyIdentityScore = (
    habits: Habit[],
    identity: UserIdentity | null
): number => {
    if (!identity || !habits.length) return 0;

    const today = getLocalDateString();
    const preset = IDENTITY_PRESETS.find(p => p.id === identity.targetIdentity);
    if (!preset) return 0;

    // Get habits that are linked to this identity (by category matching or explicit link)
    const identityCategories = getIdentityCategories(identity.targetIdentity);
    const linkedHabits = habits.filter(h =>
        h.type !== 'task' && // Only habits, not tasks
        (h.identityId === identity.id ||
            identityCategories.includes(h.category.toLowerCase()) ||
            h.category.toLowerCase().includes(identity.targetIdentity.toLowerCase()))
    );

    if (linkedHabits.length === 0) {
        // Fallback: count all habits if no specific ones are linked
        const allHabits = habits.filter(h => h.type !== 'task');
        const completed = allHabits.filter(h => h.completedDates.includes(today));
        return allHabits.length > 0 ? Math.round((completed.length / allHabits.length) * 100) : 0;
    }

    const completedToday = linkedHabits.filter(h => h.completedDates.includes(today));
    return Math.round((completedToday.length / linkedHabits.length) * 100);
};

/**
 * Count total identity proofs - actions taken that align with identity
 */
export const countIdentityProofs = (
    habits: Habit[],
    identity: UserIdentity | null
): number => {
    if (!identity || !habits.length) return 0;

    const identityCategories = getIdentityCategories(identity.targetIdentity);
    const linkedHabits = habits.filter(h =>
        h.type !== 'task' &&
        (h.identityId === identity.id ||
            identityCategories.includes(h.category.toLowerCase()) ||
            h.category.toLowerCase().includes(identity.targetIdentity.toLowerCase()))
    );

    if (linkedHabits.length === 0) {
        // Fallback: count all habit completions
        return habits.filter(h => h.type !== 'task')
            .reduce((sum, h) => sum + h.completedDates.length, 0);
    }

    return linkedHabits.reduce((sum, h) => sum + h.completedDates.length, 0);
};

/**
 * Get categories associated with an identity
 */
const getIdentityCategories = (identityId: string): string[] => {
    const categoryMap: Record<string, string[]> = {
        'athlete': ['health', 'fitness', 'sport', 'exercise', 'здоровье', 'спорт', 'фитнес'],
        'reader': ['learning', 'reading', 'education', 'книги', 'чтение', 'обучение'],
        'entrepreneur': ['career', 'business', 'productivity', 'карьера', 'бизнес', 'продуктивность', 'work'],
        'mindful': ['mindfulness', 'meditation', 'wellness', 'медитация', 'осознанность', 'mental'],
        'creator': ['creativity', 'art', 'design', 'творчество', 'искусство', 'дизайн'],
        'leader': ['leadership', 'communication', 'management', 'лидерство', 'коммуникация', 'social'],
    };
    return categoryMap[identityId] || [];
};

/**
 * Get identity milestone info
 */
export const getIdentityMilestone = (score: number): {
    threshold: number;
    label: { ru: string; en: string };
    color: string;
    emoji: string;
    isComplete: boolean;
} => {
    if (score >= 100) return { threshold: 100, label: { ru: 'ИДЕНТИЧНОСТЬ!', en: 'FULL IDENTITY!' }, color: '#FFD700', emoji: '👑', isComplete: true };
    if (score >= 75) return { threshold: 75, label: { ru: 'Почти там!', en: 'Almost there!' }, color: '#F59E0B', emoji: '🔥', isComplete: false };
    if (score >= 50) return { threshold: 50, label: { ru: 'На полпути', en: 'Halfway' }, color: '#8B5CF6', emoji: '⚡', isComplete: false };
    if (score >= 25) return { threshold: 25, label: { ru: 'Начало пути', en: 'Starting' }, color: '#3B82F6', emoji: '✨', isComplete: false };
    return { threshold: 0, label: { ru: 'Новый путь', en: 'New path' }, color: '#6B7280', emoji: '🌱', isComplete: false };
};

/**
 * Trigger identity milestone celebration
 */
export const triggerIdentityCelebration = (milestone: number) => {
    playSound('celebration');
    triggerStrongHaptic();

    const colors = milestone >= 100
        ? ['#FFD700', '#FFA500', '#FF6B00']
        : milestone >= 75
            ? ['#F59E0B', '#EAB308', '#FBBF24']
            : ['#8B5CF6', '#A855F7', '#C084FC'];

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const count = milestone >= 100 ? 50 : 25;
    const shape: 'circle' | 'star' = milestone >= 100 ? 'star' : 'circle';

    burstParticles(count, colors, cx, cy, shape, milestone >= 100 ? 360 : 120, 450, milestone >= 100 ? 2000 : 1400);

    if (milestone >= 100) {
        setTimeout(() => burstParticles(30, colors, cx * 0.3, cy, 'star', 180, 400, 1800), 400);
        setTimeout(() => burstParticles(30, colors, cx * 1.7, cy, 'star', 180, 400, 1800), 400);
    }
};

/**
 * Calculate weekly identity consistency (for trends)
 */
export const calculateWeeklyIdentityTrend = (
    habits: Habit[],
    identity: UserIdentity | null
): number[] => {
    if (!identity || !habits.length) return [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    const scores: number[] = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateString(date);

        const identityCategories = getIdentityCategories(identity.targetIdentity);
        const linkedHabits = habits.filter(h =>
            h.type !== 'task' &&
            (h.identityId === identity.id ||
                identityCategories.includes(h.category.toLowerCase()))
        );

        const habitsOnDay = linkedHabits.length || habits.filter(h => h.type !== 'task').length;
        const completedOnDay = (linkedHabits.length > 0 ? linkedHabits : habits.filter(h => h.type !== 'task'))
            .filter(h => h.completedDates.includes(dateStr)).length;

        scores.push(habitsOnDay > 0 ? Math.round((completedOnDay / habitsOnDay) * 100) : 0);
    }

    return scores;
};
// Helper to determine time status: 'now' | 'soon' | 'later' | null
export type TimeStatus = 'now' | 'soon' | 'later';

export const getTimeStatus = (habitTime?: string, currentTime?: string): TimeStatus | null => {
    if (!habitTime || !currentTime) return null;

    try {
        const [habitH, habitM] = habitTime.split(':').map(Number);
        const [currH, currM] = currentTime.split(':').map(Number);

        if (isNaN(habitH) || isNaN(habitM) || isNaN(currH) || isNaN(currM)) return null;

        const habitMinutes = habitH * 60 + habitM;
        const currentMinutes = currH * 60 + currM;
        const diff = habitMinutes - currentMinutes;

        if (diff >= -30 && diff <= 30) return 'now';  // ±30 minutes
        if (diff > 30 && diff <= 90) return 'soon';   // Next 1.5 hours
        return 'later';
    } catch (e) {
        return null;
    }
};

export const findFocusHabitId = (habits: Habit[], currentTime: string, selectedDateStr: string): string | null => {
    if (!habits.length || !currentTime) return null;

    // Filter habits that are for today and not completed
    const pendingHabits = habits.filter(h => {
        // Simple check: has time and not completed today
        if (!h.time) return false;
        return !h.completedDates.includes(selectedDateStr);
    });

    if (!pendingHabits.length) return null;

    const [currH, currM] = currentTime.split(':').map(Number);
    const currTotalMinutes = currH * 60 + currM;

    // 1. First, check if there's anything "NOW" (±30 mins)
    const nowHabit = pendingHabits.find(h => {
        const [hH, hM] = h.time!.split(':').map(Number);
        const hTotalMinutes = hH * 60 + hM;
        const diff = hTotalMinutes - currTotalMinutes;
        return diff >= -30 && diff <= 30;
    });

    if (nowHabit) return nowHabit.id;

    // 2. If nothing now, find the closest one in the FUTURE
    const futureHabits = pendingHabits
        .map(h => {
            const [hH, hM] = h.time!.split(':').map(Number);
            return {
                id: h.id,
                diff: (hH * 60 + hM) - currTotalMinutes
            };
        })
        .filter(h => h.diff > 30) // Only future ones beyond 'now' window
        .sort((a, b) => a.diff - b.diff);

    if (futureHabits.length > 0) return futureHabits[0].id;

    // 3. Fallback: if all tasks are in the past, maybe focus on the last one or nothing
    // For now, let's focus on the closest past one if no future ones exist
    const pastHabits = pendingHabits
        .map(h => {
            const [hH, hM] = h.time!.split(':').map(Number);
            return {
                id: h.id,
                diff: currTotalMinutes - (hH * 60 + hM)
            };
        })
        .sort((a, b) => a.diff - b.diff);

    return pastHabits.length > 0 ? pastHabits[0].id : null;
};

/**
 * Recursively removes undefined values from an object or array.
 * Firebase Firestore does not support 'undefined' values.
 */
export const removeUndefined = <T>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return null as any;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)) as any;
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            const value = (obj as any)[key];
            if (value !== undefined) {
                result[key] = removeUndefined(value);
            }
        }
        return result;
    }

    return obj;
};
