import React, { useMemo } from 'react';
import { Habit, IDENTITY_MAP } from '../types';
import { TrendingUp, Sparkles } from 'lucide-react';

interface IdentityEvolutionChartProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    accentColor?: string | null;
}

interface IdentityProgress {
    category: string;
    identity: { ru: string; en: string };
    emoji: string;
    weeklyProgress: number; // 0-100%
    habitCount: number;
    completedThisWeek: number;
    totalOpportunities: number;
}

const IdentityEvolutionChart: React.FC<IdentityEvolutionChartProps> = ({
    habits,
    language = 'ru',
    accentColor
}) => {
    const t = {
        title: language === 'ru' ? 'Эволюция Идентичности' : 'Identity Evolution',
        subtitle: language === 'ru' ? 'Прогресс за неделю' : 'Weekly Progress',
        noData: language === 'ru' ? 'Добавьте привычки для отслеживания' : 'Add habits to track',
        days: language === 'ru' ? 'дн/нед' : 'd/wk'
    };

    // Calculate weekly progress for each identity
    const identityProgress = useMemo((): IdentityProgress[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get last 7 days
        const last7Days: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const categoryMap: Record<string, {
            habits: Habit[];
            completedThisWeek: number;
            totalOpportunities: number;
        }> = {};

        habits.forEach(habit => {
            if (habit.archived) return;

            const cat = habit.category || 'Продуктивность';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { habits: [], completedThisWeek: 0, totalOpportunities: 0 };
            }

            const createdAt = new Date(habit.createdAt);
            createdAt.setHours(0, 0, 0, 0);

            last7Days.forEach(dateStr => {
                const date = new Date(dateStr);
                if (date >= createdAt) {
                    categoryMap[cat].totalOpportunities++;
                    if (habit.completedDates.includes(dateStr)) {
                        categoryMap[cat].completedThisWeek++;
                    }
                }
            });

            categoryMap[cat].habits.push(habit);
        });

        return Object.entries(categoryMap)
            .map(([category, data]) => {
                const identityInfo = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };
                const weeklyProgress = data.totalOpportunities > 0
                    ? Math.round((data.completedThisWeek / data.totalOpportunities) * 100)
                    : 0;

                return {
                    category,
                    identity: { ru: identityInfo.ru, en: identityInfo.en },
                    emoji: identityInfo.emoji,
                    weeklyProgress,
                    habitCount: data.habits.length,
                    completedThisWeek: data.completedThisWeek,
                    totalOpportunities: data.totalOpportunities
                };
            })
            .sort((a, b) => b.weeklyProgress - a.weeklyProgress)
            .slice(0, 5); // Top 5 identities
    }, [habits]);

    // Get color based on progress
    const getProgressColor = (progress: number) => {
        if (progress >= 80) return { ring: '#22c55e', bg: 'from-green-500/20 to-emerald-500/10' };
        if (progress >= 60) return { ring: '#3b82f6', bg: 'from-blue-500/20 to-cyan-500/10' };
        if (progress >= 40) return { ring: '#f59e0b', bg: 'from-amber-500/20 to-yellow-500/10' };
        return { ring: '#ef4444', bg: 'from-red-500/20 to-orange-500/10' };
    };

    if (identityProgress.length === 0) {
        return (
            <div className="bg-surface rounded-3xl p-6 border border-borderSubtle">
                <div className="text-center text-textSecondary py-8">
                    <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                    <p>{t.noData}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-3xl p-5 border border-borderSubtle">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-brand" size={20} />
                    <h3 className="font-bold text-textPrimary">{t.title}</h3>
                </div>
                <span className="text-xs text-textSecondary">{t.subtitle}</span>
            </div>

            {/* Identity Progress Grid */}
            <div className="flex flex-wrap justify-center gap-4">
                {identityProgress.map((identity) => {
                    const colors = getProgressColor(identity.weeklyProgress);
                    const circumference = 2 * Math.PI * 28; // radius = 28
                    const strokeDashoffset = circumference - (identity.weeklyProgress / 100) * circumference;

                    return (
                        <div
                            key={identity.category}
                            className="flex flex-col items-center w-[80px]"
                        >
                            {/* Radial Progress */}
                            <div className="relative w-14 h-14">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                                    {/* Background circle */}
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-surfaceHighlight"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke={colors.ring}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                {/* Center emoji */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg">{identity.emoji}</span>
                                </div>
                            </div>

                            {/* Progress percentage */}
                            <div className="mt-1 text-center">
                                <div className="text-sm font-bold text-textPrimary">
                                    {identity.weeklyProgress}%
                                </div>
                                <div className="text-[9px] text-textSecondary text-center leading-snug capitalize break-words max-w-full">
                                    {identity.identity[language]}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary row */}
            <div className="mt-4 pt-3 border-t border-borderSubtle flex justify-center gap-6 text-xs text-textSecondary">
                {identityProgress.slice(0, 3).map(id => (
                    <span key={id.category} className="flex items-center gap-1">
                        <span>{id.emoji}</span>
                        <span>{Math.round(id.completedThisWeek / 7 * 10) / 10} {t.days}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default IdentityEvolutionChart;
