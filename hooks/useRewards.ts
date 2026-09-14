import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Habit, UserRewards, DEFAULT_USER_REWARDS, getCurrentStreak, calculateRewardsFromStreak, calculateXPEarned, checkLevelUp } from '../types';
import { triggerProCelebration, removeUndefined } from '../utils/helpers';

export const useRewards = (user: User | null, habits: Habit[], setIsRewardsModalOpen?: (open: boolean) => void) => {
    const [userRewards, setUserRewards] = useState<UserRewards>(() => {
        try {
            const saved = localStorage.getItem('userRewards');
            return saved ? { ...DEFAULT_USER_REWARDS, ...JSON.parse(saved) } : DEFAULT_USER_REWARDS;
        } catch { return DEFAULT_USER_REWARDS; }
    });

    // Sync with Firebase
    useEffect(() => {
        if (userRewards) localStorage.setItem('userRewards', JSON.stringify(userRewards));
        if (user) {
            const timeout = setTimeout(() => {
                supabase.from('users').update({ rewards: removeUndefined(userRewards) }).eq('id', user.id)
                    .then(({ error }) => { if (error) console.error('Failed to sync userRewards', error); });
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [userRewards, user]);

    // Calculate rewards from streaks - DEBOUNCED to not block UI
    const streakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (habits.length === 0) return;

        // Clear previous timeout
        if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);

        // Debounce 300ms - don't calculate on every single toggle
        streakTimeoutRef.current = setTimeout(() => {
            // Run calculation in next tick to not block current render
            requestAnimationFrame(() => {
                const highestStreak = Math.max(...habits.map(h => getCurrentStreak(h)), 0);
                const earned = calculateRewardsFromStreak(highestStreak);

                if (earned.totalSlots > userRewards.bonusHabitSlots || highestStreak > userRewards.highestStreak) {
                    const isNewUnlock = earned.totalSlots > userRewards.bonusHabitSlots;
                    setUserRewards(prev => ({
                        ...prev,
                        bonusHabitSlots: Math.max(prev.bonusHabitSlots, earned.totalSlots),
                        highestStreak: Math.max(prev.highestStreak, highestStreak),
                        unlockedBadges: [...new Set([...prev.unlockedBadges, ...earned.badges])],
                        unlockedThemes: [...new Set([...prev.unlockedThemes, ...earned.themes])]
                    }));
                    if (isNewUnlock) {
                        setTimeout(() => triggerProCelebration(), 0);
                    }
                }
            });
        }, 300);

        return () => {
            if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
        };
    }, [habits]);

    // XP Logic with State Diffing - OPTIMIZED
    const prevHabitsState = useRef<Habit[]>([]);
    const isFirstXPRender = useRef(true);
    const xpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (habits.length === 0) {
            prevHabitsState.current = habits;
            return;
        }

        if (isFirstXPRender.current) {
            isFirstXPRender.current = false;
            prevHabitsState.current = habits;
            return;
        }

        // Clear previous timeout
        if (xpTimeoutRef.current) clearTimeout(xpTimeoutRef.current);

        // Capture previous state before it changes
        const prevHabits = prevHabitsState.current;
        prevHabitsState.current = habits;

        // Debounce XP calculation to not block UI
        xpTimeoutRef.current = setTimeout(() => {
            requestAnimationFrame(() => {
                habits.forEach(habit => {
                    const prevHabit = prevHabits.find(h => h.id === habit.id);
                    if (!prevHabit) return;

                    const currentCompletions = habit.completedDates.length;
                    const prevCompletions = prevHabit.completedDates.length;

                    if (currentCompletions !== prevCompletions) {
                        const diff = currentCompletions - prevCompletions;
                        let xpChange = 0;

                        if (diff > 0) {
                            for (let i = 0; i < diff; i++) {
                                xpChange += calculateXPEarned(habit);
                            }
                        } else if (diff < 0) {
                            for (let i = 0; i < Math.abs(diff); i++) {
                                xpChange -= calculateXPEarned(habit);
                            }
                        }

                        if (xpChange !== 0) {
                            setUserRewards(prev => {
                                const newXP = Math.max(0, prev.totalXP + xpChange);
                                const levelCheck = checkLevelUp(prev.totalXP, newXP);

                                if (levelCheck.didLevelUp && xpChange > 0) {
                                    setTimeout(() => {
                                        triggerProCelebration();
                                        if (setIsRewardsModalOpen) {
                                            setTimeout(() => setIsRewardsModalOpen(true), 500);
                                        }
                                    }, 0);
                                }

                                return {
                                    ...prev,
                                    totalXP: newXP,
                                    level: levelCheck.newLevel
                                };
                            });
                        }
                    }
                });
            });
        }, 100);

        return () => {
            if (xpTimeoutRef.current) clearTimeout(xpTimeoutRef.current);
        };
    }, [habits]);

    const handleUseStreakSaver = (habitId: string, setHabits: (updater: (prev: Habit[]) => Habit[]) => void) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        setHabits(prev => prev.map(h => {
            if (h.id !== habitId) return h;
            if (h.completedDates.includes(yesterdayStr)) return h;
            return { ...h, completedDates: [...h.completedDates, yesterdayStr] };
        }));

        setUserRewards(prev => ({ ...prev, streakSaverUsedAt: new Date().toISOString() }));
        triggerProCelebration();
    };

    return { userRewards, setUserRewards, handleUseStreakSaver };
};
