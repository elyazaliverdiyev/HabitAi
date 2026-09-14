import React, { useMemo } from 'react';
import { Trophy, Lock, Star, Flame, Zap, Crown, Target, Heart, BookOpen, Dumbbell } from 'lucide-react';
import { Habit, getCurrentStreak } from '../types';

export interface Achievement {
    id: string;
    emoji: string;
    titleRu: string;
    titleEn: string;
    descriptionRu: string;
    descriptionEn: string;
    category: 'streak' | 'completion' | 'special';
    xpReward: number;
    check: (habits: Habit[], stats: AchievementStats) => boolean;
}

export interface AchievementStats {
    totalCompletions: number;
    maxStreak: number;
    perfectDays: number;
    totalHabits: number;
    categoriesUsed: number;
    daysActive: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Streak achievements
    { id: 'streak_3', emoji: '🌱', titleRu: 'Росток', titleEn: 'Sprout', descriptionRu: '3 дня подряд', descriptionEn: '3 day streak', category: 'streak', xpReward: 10, check: (_, s) => s.maxStreak >= 3 },
    { id: 'streak_7', emoji: '🔥', titleRu: 'В огне', titleEn: 'On Fire', descriptionRu: '7 дней подряд', descriptionEn: '7 day streak', category: 'streak', xpReward: 25, check: (_, s) => s.maxStreak >= 7 },
    { id: 'streak_14', emoji: '⚡', titleRu: 'Неудержимый', titleEn: 'Unstoppable', descriptionRu: '14 дней подряд', descriptionEn: '14 day streak', category: 'streak', xpReward: 50, check: (_, s) => s.maxStreak >= 14 },
    { id: 'streak_30', emoji: '💎', titleRu: 'Алмаз', titleEn: 'Diamond', descriptionRu: '30 дней подряд', descriptionEn: '30 day streak', category: 'streak', xpReward: 100, check: (_, s) => s.maxStreak >= 30 },
    { id: 'streak_60', emoji: '👑', titleRu: 'Корона', titleEn: 'Crown', descriptionRu: '60 дней подряд', descriptionEn: '60 day streak', category: 'streak', xpReward: 200, check: (_, s) => s.maxStreak >= 60 },
    { id: 'streak_100', emoji: '🏆', titleRu: 'Легенда', titleEn: 'Legend', descriptionRu: '100 дней подряд', descriptionEn: '100 day streak', category: 'streak', xpReward: 500, check: (_, s) => s.maxStreak >= 100 },

    // Completion achievements
    { id: 'complete_10', emoji: '✅', titleRu: 'Начало пути', titleEn: 'Journey Starts', descriptionRu: '10 выполнений', descriptionEn: '10 completions', category: 'completion', xpReward: 10, check: (_, s) => s.totalCompletions >= 10 },
    { id: 'complete_50', emoji: '📊', titleRu: 'Полсотни', titleEn: 'Half Century', descriptionRu: '50 выполнений', descriptionEn: '50 completions', category: 'completion', xpReward: 30, check: (_, s) => s.totalCompletions >= 50 },
    { id: 'complete_100', emoji: '💯', titleRu: 'Сотня', titleEn: 'Century', descriptionRu: '100 выполнений', descriptionEn: '100 completions', category: 'completion', xpReward: 50, check: (_, s) => s.totalCompletions >= 100 },
    { id: 'complete_500', emoji: '🚀', titleRu: 'Ракета', titleEn: 'Rocket', descriptionRu: '500 выполнений', descriptionEn: '500 completions', category: 'completion', xpReward: 150, check: (_, s) => s.totalCompletions >= 500 },
    { id: 'complete_1000', emoji: '🌟', titleRu: 'Тысяча!', titleEn: 'Thousand!', descriptionRu: '1000 выполнений', descriptionEn: '1000 completions', category: 'completion', xpReward: 300, check: (_, s) => s.totalCompletions >= 1000 },

    // Special achievements
    { id: 'perfect_1', emoji: '⭐', titleRu: 'Идеальный день', titleEn: 'Perfect Day', descriptionRu: '1 день 100% выполнения', descriptionEn: '1 day at 100%', category: 'special', xpReward: 15, check: (_, s) => s.perfectDays >= 1 },
    { id: 'perfect_7', emoji: '🌈', titleRu: 'Идеальная неделя', titleEn: 'Perfect Week', descriptionRu: '7 идеальных дней', descriptionEn: '7 perfect days', category: 'special', xpReward: 75, check: (_, s) => s.perfectDays >= 7 },
    { id: 'habits_5', emoji: '🎯', titleRu: 'Мастер привычек', titleEn: 'Habit Master', descriptionRu: '5+ активных привычек', descriptionEn: '5+ active habits', category: 'special', xpReward: 20, check: (_, s) => s.totalHabits >= 5 },
    { id: 'habits_10', emoji: '🏅', titleRu: 'Декатлон', titleEn: 'Decathlon', descriptionRu: '10+ привычек', descriptionEn: '10+ habits', category: 'special', xpReward: 40, check: (_, s) => s.totalHabits >= 10 },
    { id: 'categories_3', emoji: '🎨', titleRu: 'Разносторонний', titleEn: 'Well-Rounded', descriptionRu: '3+ категории', descriptionEn: '3+ categories', category: 'special', xpReward: 20, check: (_, s) => s.categoriesUsed >= 3 },
];

export const calculateAchievementStats = (habits: Habit[]): AchievementStats => {
    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');
    const allDates = activeHabits.flatMap(h => h.completedDates);
    const uniqueDates = [...new Set(allDates)];

    // Calculate max streak across all habits
    let maxStreak = 0;
    activeHabits.forEach(h => {
        const streak = getCurrentStreak(h);
        if (streak > maxStreak) maxStreak = streak;
    });

    // Calculate perfect days
    let perfectDays = 0;
    uniqueDates.forEach(date => {
        const allDone = activeHabits.every(h => h.completedDates.includes(date));
        if (allDone && activeHabits.length > 0) perfectDays++;
    });

    const categories = new Set(activeHabits.map(h => h.category).filter(Boolean));

    return {
        totalCompletions: allDates.length,
        maxStreak,
        perfectDays,
        totalHabits: activeHabits.length,
        categoriesUsed: categories.size,
        daysActive: uniqueDates.length,
    };
};

interface AchievementsWidgetProps {
    habits: Habit[];
    language: 'ru' | 'en';
}

const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ habits, language }) => {
    const stats = useMemo(() => calculateAchievementStats(habits), [habits]);
    const unlockedIds = useMemo(() => {
        return new Set(ACHIEVEMENTS.filter(a => a.check(habits, stats)).map(a => a.id));
    }, [habits, stats]);

    const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id));
    const locked = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id));
    const progress = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);

    return (
        <div className="rounded-2xl bg-surface border border-divider overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surfaceHighlight">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Trophy size={16} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-primary">
                            {language === 'ru' ? 'Достижения' : 'Achievements'}
                        </h3>
                        <p className="text-xs text-secondary">
                            {unlocked.length}/{ACHIEVEMENTS.length} • {progress}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mx-4 mt-3 h-2 rounded-full bg-surfaceHighlight overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Unlocked achievements */}
            {unlocked.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">
                        {language === 'ru' ? 'Разблокированы' : 'Unlocked'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {unlocked.map(a => (
                            <div
                                key={a.id}
                                className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
                                title={language === 'ru' ? a.descriptionRu : a.descriptionEn}
                            >
                                <span className="text-base">{a.emoji}</span>
                                <span className="text-xs font-semibold text-primary">
                                    {language === 'ru' ? a.titleRu : a.titleEn}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next locked achievements (show 3) */}
            <div className="px-4 pt-2 pb-4">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">
                    {language === 'ru' ? 'Следующие' : 'Next'}
                </p>
                <div className="space-y-1.5">
                    {locked.slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-surfaceHighlight/50 opacity-60">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                                <Lock size={12} className="text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-secondary truncate">
                                    {language === 'ru' ? a.titleRu : a.titleEn}
                                </p>
                                <p className="text-[10px] text-secondary/70 truncate">
                                    {language === 'ru' ? a.descriptionRu : a.descriptionEn}
                                </p>
                            </div>
                            <div className="text-[10px] font-bold text-secondary px-1.5 py-0.5 rounded bg-surface">
                                +{a.xpReward}XP
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AchievementsWidget;
