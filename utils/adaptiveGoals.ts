// Adaptive Goals System
// AI adjusts targetCount based on completion rate

import { Habit } from '../types';

// Get last N PAST days as date strings (excludes today!)
const getPastNDays = (n: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= n; i++) { // Start from 1 (yesterday)
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    return dates;
};

// Calculate current target based on adaptive level
export const getAdaptiveTarget = (habit: Habit): number => {
    const ultimate = habit.ultimateTarget || habit.targetCount || 1;
    const level = habit.adaptiveLevel || 10; // Default to max level

    // Calculate target: ultimate * (level / 10), minimum 1
    const target = Math.max(1, Math.round(ultimate * (level / 10)));
    return target;
};

// Check if adaptive level should change based on recent completion
export const calculateNewAdaptiveLevel = (habit: Habit): number => {
    // Only apply to habits with ultimateTarget set
    if (!habit.ultimateTarget || habit.ultimateTarget <= 1) {
        return habit.adaptiveLevel || 10;
    }

    const currentLevel = habit.adaptiveLevel || 10;
    const last7Days = getPastNDays(7);
    const last3Days = getPastNDays(3);

    // Count completions in last 7 days
    const completionsLast7 = last7Days.filter(d =>
        habit.completedDates.includes(d)
    ).length;

    // Count completions in last 3 days
    const completionsLast3 = last3Days.filter(d =>
        habit.completedDates.includes(d)
    ).length;

    // Streak of 3+ days → increase level
    if (completionsLast3 >= 3 && currentLevel < 10) {
        return Math.min(10, currentLevel + 1);
    }

    // Degradation logic temporarily disabled to prevent "toggle loop" bug
    // where clicking repeatedly lowers level based on past history.
    // Will be moved to a daily check in future.
    return currentLevel;

    return currentLevel;
};

// Get progress percentage toward ultimate target
export const getAdaptiveProgress = (habit: Habit): number => {
    const level = habit.adaptiveLevel || 10;
    return Math.round((level / 10) * 100);
};

// Run periodic check for adaptive goals (e.g. daily/weekly)
export const processAdaptiveUpdates = (habits: Habit[]): Habit[] => {
    return habits.map(h => {
        if (!hasAdaptiveGoal(h)) return h;

        // Calculate proper level based on history
        // Note: Currently we only allow PROMOTION or MAINTENANCE to avoid bugs.
        // Degradation logic is commented out in calculateNewAdaptiveLevel
        const newLevel = calculateNewAdaptiveLevel(h);

        // Return updated habit if level changed
        if (newLevel !== h.adaptiveLevel) {
            const ultimate = h.ultimateTarget || 1;
            return {
                ...h,
                adaptiveLevel: newLevel,
                targetCount: Math.max(1, Math.round(ultimate * (newLevel / 10)))
            };
        }
        return h;
    });
};

// Check if habit has adaptive goals enabled
export const hasAdaptiveGoal = (habit: Habit): boolean => {
    return !!(habit.ultimateTarget && habit.ultimateTarget > 1);
};
