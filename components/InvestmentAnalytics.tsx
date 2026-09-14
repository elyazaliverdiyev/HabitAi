import React, { useMemo } from 'react';
import { Habit, getCurrencySymbol, IDENTITY_MAP } from '../types';
import { translations } from '../translations';
import {
    Clock, DollarSign, TrendingUp, PieChart,
    Target, Zap, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';

interface InvestmentAnalyticsProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    accentColor?: string | null;
    defaultCurrency?: string;
}

interface CategoryInvestment {
    category: string;
    identity: { ru: string; en: string };
    emoji: string;
    timeMinutes: number;
    completions: number;
    cost: number;
    currency: string;
    color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Здоровье': '#ef4444',
    'Health': '#ef4444',
    'Спорт': '#f97316',
    'Fitness': '#f97316',
    'Продуктивность': '#22c55e',
    'Productivity': '#22c55e',
    'Карьера': '#3b82f6',
    'Career': '#3b82f6',
    'Финансы': '#10b981',
    'Finance': '#10b981',
    'Обучение': '#8b5cf6',
    'Learning': '#8b5cf6',
    'Осознанность': '#a855f7',
    'Mindfulness': '#a855f7',
    'Социальное': '#eab308',
    'Social': '#eab308',
    'Отношения': '#ec4899',
    'Relationships': '#ec4899',
    'Творчество': '#d946ef',
    'Creative': '#d946ef',
};

const InvestmentAnalytics: React.FC<InvestmentAnalyticsProps> = ({
    habits,
    language = 'ru',
    accentColor,
    defaultCurrency = 'USD'
}) => {
    const t = {
        title: language === 'ru' ? 'Инвестиции и Урожай' : 'Investments & Returns',
        time: language === 'ru' ? 'Инвестиции в себя' : 'Self-Investment',
        money: language === 'ru' ? 'Финансовые инвестиции' : 'Money Invested',
        thisWeek: language === 'ru' ? 'За неделю' : 'This week',
        thisMonth: language === 'ru' ? 'За месяц' : 'This month',
        allTime: language === 'ru' ? 'Всё время' : 'All time',
        hours: language === 'ru' ? 'ч' : 'h',
        minutes: language === 'ru' ? 'мин' : 'min',
        completions: language === 'ru' ? 'выполнений' : 'completions',
        invested: language === 'ru' ? 'инвестировано' : 'invested',
        byCategory: language === 'ru' ? 'По идентичностям' : 'By identities',
        noData: language === 'ru' ? 'Добавь время или стоимость к привычкам' : 'Add duration or cost to your habits',
        roi: language === 'ru' ? 'Эффективность' : 'Efficiency',
    };

    // Calculate investments
    const investments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get date ranges
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        let totalTimeWeek = 0;
        let totalTimeMonth = 0;
        let totalTimeAll = 0;
        let totalCostWeek = 0;
        let totalCostMonth = 0;
        let totalCostAll = 0;
        let totalCompletionsWeek = 0;
        let totalCompletionsMonth = 0;
        let totalCompletionsAll = 0;

        const categoryMap: Record<string, CategoryInvestment> = {};

        habits.forEach(habit => {
            const duration = habit.duration || 0; // in minutes
            const cost = habit.cost || 0;
            const currency = habit.currency || defaultCurrency;
            const category = habit.category || 'Продуктивность';
            const identity = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };

            // Initialize category if not exists
            if (!categoryMap[category]) {
                categoryMap[category] = {
                    category,
                    identity: { ru: identity.ru, en: identity.en },
                    emoji: identity.emoji,
                    timeMinutes: 0,
                    completions: 0,
                    cost: 0,
                    currency,
                    color: CATEGORY_COLORS[category] || '#6b7280'
                };
            }

            habit.completedDates.forEach(dateStr => {
                // All time
                totalTimeAll += duration;
                totalCostAll += cost;
                totalCompletionsAll++;
                categoryMap[category].timeMinutes += duration;
                categoryMap[category].completions++;
                categoryMap[category].cost += cost;

                // Week
                if (dateStr >= weekAgoStr) {
                    totalTimeWeek += duration;
                    totalCostWeek += cost;
                    totalCompletionsWeek++;
                }

                // Month
                if (dateStr >= monthAgoStr) {
                    totalTimeMonth += duration;
                    totalCostMonth += cost;
                    totalCompletionsMonth++;
                }
            });
        });

        // Sort categories by time invested
        const sortedCategories = Object.values(categoryMap)
            .sort((a, b) => b.timeMinutes - a.timeMinutes);

        // Calculate max for percentage bars
        const maxTime = Math.max(...sortedCategories.map(c => c.timeMinutes), 1);

        return {
            time: {
                week: totalTimeWeek,
                month: totalTimeMonth,
                all: totalTimeAll
            },
            cost: {
                week: totalCostWeek,
                month: totalCostMonth,
                all: totalCostAll
            },
            completions: {
                week: totalCompletionsWeek,
                month: totalCompletionsMonth,
                all: totalCompletionsAll
            },
            categories: sortedCategories,
            maxTime,
            hasData: totalTimeAll > 0 || totalCostAll > 0
        };
    }, [habits, defaultCurrency]);

    const formatTime = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}${t.hours} ${mins}${t.minutes}` : `${hours}${t.hours}`;
        }
        return `${minutes}${t.minutes}`;
    };

    const formatCurrency = (amount: number): string => {
        const symbol = getCurrencySymbol(defaultCurrency);
        return `${symbol}${amount.toLocaleString()}`;
    };

    // If no time/cost data, show helper
    if (!investments.hasData) {
        return (
            <div className="bg-surface/50 backdrop-blur-sm border border-borderSubtle rounded-3xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-surfaceHighlight flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-textSecondary" />
                </div>
                <div className="text-sm font-medium text-textSecondary">{t.noData}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-brand" />
                <h3 className="text-lg font-bold text-textPrimary">{t.title}</h3>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Time Investment */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-500 uppercase">{t.time}</span>
                    </div>

                    <div className="text-2xl font-black text-textPrimary">
                        {formatTime(investments.time.month)}
                    </div>
                    <div className="text-xs text-textSecondary">{t.thisMonth}</div>

                    <div className="mt-3 pt-3 border-t border-blue-500/10 flex justify-between text-xs">
                        <span className="text-textSecondary">
                            <span className="font-bold text-textPrimary">{formatTime(investments.time.week)}</span> / {language === 'ru' ? 'нед' : 'wk'}
                        </span>
                        <span className="text-textSecondary">
                            <span className="font-bold text-textPrimary">{formatTime(investments.time.all)}</span> {t.allTime.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* Money Investment */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="text-xs font-bold text-green-500 uppercase">{t.money}</span>
                    </div>

                    <div className="text-2xl font-black text-textPrimary">
                        {formatCurrency(investments.cost.month)}
                    </div>
                    <div className="text-xs text-textSecondary">{t.thisMonth}</div>

                    <div className="mt-3 pt-3 border-t border-green-500/10 flex justify-between text-xs">
                        <span className="text-textSecondary">
                            <span className="font-bold text-textPrimary">{formatCurrency(investments.cost.week)}</span> / {language === 'ru' ? 'нед' : 'wk'}
                        </span>
                        <span className="text-textSecondary">
                            <span className="font-bold text-textPrimary">{formatCurrency(investments.cost.all)}</span> {t.allTime.toLowerCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div>
                <h4 className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PieChart size={14} />
                    {t.byCategory}
                </h4>

                <div className="space-y-2">
                    {investments.categories.slice(0, 5).map((cat) => (
                        <div
                            key={cat.category}
                            className="bg-surface/50 border border-borderSubtle rounded-xl p-3"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">{cat.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-textPrimary truncate capitalize">
                                        {cat.identity[language]}
                                    </div>
                                    <div className="text-xs text-textSecondary">
                                        {cat.completions} {t.completions}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-textPrimary">
                                        {formatTime(cat.timeMinutes)}
                                    </div>
                                    {cat.cost > 0 && (
                                        <div className="text-xs text-green-500">
                                            {formatCurrency(cat.cost)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(cat.timeMinutes / investments.maxTime) * 100}%`,
                                        backgroundColor: cat.color
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Efficiency Score */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={18} className="text-purple-500" />
                        <span className="text-sm font-bold text-purple-500">{t.roi}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-2xl font-black text-textPrimary">
                            {investments.completions.month > 0
                                ? Math.round(investments.time.month / investments.completions.month)
                                : 0}
                        </span>
                        <span className="text-xs text-textSecondary">{t.minutes}/{language === 'ru' ? 'выполнение' : 'completion'}</span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-textSecondary">
                    {language === 'ru'
                        ? `${investments.completions.month} выполнений за ${formatTime(investments.time.month)}`
                        : `${investments.completions.month} completions in ${formatTime(investments.time.month)}`}
                </div>
            </div>
        </div>
    );
};

export default InvestmentAnalytics;
