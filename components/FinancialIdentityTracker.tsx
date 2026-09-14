import React, { useMemo } from 'react';
import { Habit, getCurrencySymbol } from '../types';
import { Wallet, TrendingUp, PiggyBank, Crown, ChevronRight, Sparkles } from 'lucide-react';

interface FinancialIdentityTrackerProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    accentColor?: string | null;
    defaultCurrency?: string;
}

// Financial identity stages
const FINANCIAL_STAGES = [
    { id: 'spender', emoji: '💸', ru: 'Транжира', en: 'Spender', color: '#ef4444', threshold: 0 },
    { id: 'saver', emoji: '🐷', ru: 'Сберегатель', en: 'Saver', color: '#f59e0b', threshold: 30 },
    { id: 'investor', emoji: '📈', ru: 'Инвестор', en: 'Investor', color: '#3b82f6', threshold: 60 },
    { id: 'free', emoji: '👑', ru: 'Свободный', en: 'Free', color: '#22c55e', threshold: 90 }
];

const FinancialIdentityTracker: React.FC<FinancialIdentityTrackerProps> = ({
    habits,
    language = 'ru',
    accentColor,
    defaultCurrency = 'USD'
}) => {
    const t = {
        title: language === 'ru' ? 'Финансовая Идентичность' : 'Financial Identity',
        currentStage: language === 'ru' ? 'Текущий этап' : 'Current Stage',
        invested: language === 'ru' ? 'Инвестировано в себя' : 'Self-Investment',
        thisMonth: language === 'ru' ? 'за месяц' : 'this month',
        progress: language === 'ru' ? 'Прогресс к следующему уровню' : 'Progress to next level',
        tip: language === 'ru'
            ? 'Добавляй стоимость к привычкам, чтобы отслеживать инвестиции в себя'
            : 'Add cost to habits to track self-investment',
        noData: language === 'ru' ? 'Начни отслеживать инвестиции в себя' : 'Start tracking self-investment'
    };

    // Calculate financial metrics
    const metrics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        let totalCostMonth = 0;
        let totalCostAll = 0;
        let habitsWithCost = 0;

        habits.forEach(habit => {
            const cost = habit.cost || 0;
            if (cost > 0) habitsWithCost++;

            habit.completedDates.forEach(dateStr => {
                totalCostAll += cost;
                if (dateStr >= monthAgoStr) {
                    totalCostMonth += cost;
                }
            });
        });

        // Calculate financial score (0-100) based on:
        // - Investment in self (habits with cost)
        // - Consistency (completion rate of habits with cost)
        // - Growth (trend over time)

        const habitsWithCostArr = habits.filter(h => (h.cost || 0) > 0);
        let costHabitCompletionRate = 0;

        if (habitsWithCostArr.length > 0) {
            const last30Days: string[] = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                last30Days.push(d.toISOString().split('T')[0]);
            }

            let opportunities = 0;
            let completions = 0;
            habitsWithCostArr.forEach(habit => {
                const createdAt = new Date(habit.createdAt);
                last30Days.forEach(dateStr => {
                    if (new Date(dateStr) >= createdAt) {
                        opportunities++;
                        if (habit.completedDates.includes(dateStr)) {
                            completions++;
                        }
                    }
                });
            });

            costHabitCompletionRate = opportunities > 0 ? (completions / opportunities) * 100 : 0;
        }

        // Financial score calculation
        // 40% from having habits with investments
        // 60% from completion rate of those habits
        const hasInvestmentScore = habitsWithCost > 0 ? Math.min(40, habitsWithCost * 10) : 0;
        const completionScore = (costHabitCompletionRate / 100) * 60;
        const financialScore = Math.round(hasInvestmentScore + completionScore);

        // Determine current stage
        let currentStage = FINANCIAL_STAGES[0];
        let nextStage = FINANCIAL_STAGES[1];

        for (let i = FINANCIAL_STAGES.length - 1; i >= 0; i--) {
            if (financialScore >= FINANCIAL_STAGES[i].threshold) {
                currentStage = FINANCIAL_STAGES[i];
                nextStage = FINANCIAL_STAGES[i + 1] || null;
                break;
            }
        }

        // Progress to next stage
        let progressToNext = 100;
        if (nextStage) {
            const range = nextStage.threshold - currentStage.threshold;
            const current = financialScore - currentStage.threshold;
            progressToNext = Math.round((current / range) * 100);
        }

        return {
            totalCostMonth,
            totalCostAll,
            habitsWithCost,
            financialScore,
            currentStage,
            nextStage,
            progressToNext,
            costHabitCompletionRate
        };
    }, [habits]);

    const currSymbol = getCurrencySymbol(defaultCurrency);

    // Don't show if no habits with cost
    if (metrics.habitsWithCost === 0) {
        return (
            <div className="bg-surface rounded-3xl p-5 border border-borderSubtle">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="text-brand" size={20} />
                    <h3 className="font-bold text-textPrimary">{t.title}</h3>
                </div>
                <div className="text-center py-6 text-textSecondary">
                    <PiggyBank className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">{t.noData}</p>
                    <p className="text-xs mt-1 opacity-70">{t.tip}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-3xl p-5 border border-borderSubtle">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="text-brand" size={20} />
                    <h3 className="font-bold text-textPrimary">{t.title}</h3>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-brand">
                        {currSymbol}{metrics.totalCostMonth.toLocaleString()}
                    </div>
                    <div className="text-xs text-textSecondary">{t.thisMonth}</div>
                </div>
            </div>

            {/* Current Stage Banner */}
            <div
                className="rounded-2xl p-4 mb-4 relative overflow-hidden"
                style={{ backgroundColor: `${metrics.currentStage.color}15` }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${metrics.currentStage.color}25` }}
                    >
                        {metrics.currentStage.emoji}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-textSecondary">{t.currentStage}</div>
                        <div
                            className="text-xl font-bold"
                            style={{ color: metrics.currentStage.color }}
                        >
                            {metrics.currentStage[language]}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-textPrimary">
                            {metrics.financialScore}
                        </div>
                        <div className="text-xs text-textSecondary">/ 100</div>
                    </div>
                </div>
            </div>

            {/* Stage Progress Timeline */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    {FINANCIAL_STAGES.map((stage, idx) => {
                        const isActive = metrics.financialScore >= stage.threshold;
                        const isCurrent = stage.id === metrics.currentStage.id;

                        return (
                            <div key={stage.id} className="flex items-center">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm
                                        transition-all duration-300
                                        ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-surface scale-110' : ''}
                                    `}
                                    style={{
                                        backgroundColor: isActive ? stage.color : 'var(--surface-highlight)',
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                        ringColor: isCurrent ? stage.color : 'transparent'
                                    }}
                                >
                                    {stage.emoji}
                                </div>
                                {idx < FINANCIAL_STAGES.length - 1 && (
                                    <div className="flex-1 mx-1">
                                        <ChevronRight
                                            size={14}
                                            className={isActive ? 'text-textPrimary' : 'text-textSecondary/30'}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Labels */}
                <div className="flex justify-between text-[10px] text-textSecondary">
                    {FINANCIAL_STAGES.map(stage => (
                        <span
                            key={stage.id}
                            className={`w-8 text-center ${stage.id === metrics.currentStage.id ? 'font-bold text-textPrimary' : ''}`}
                        >
                            {stage[language].slice(0, 4)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Progress to Next Level */}
            {metrics.nextStage && (
                <div className="bg-surfaceHighlight/50 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-textSecondary">{t.progress}</span>
                        <span className="font-bold text-textPrimary">
                            {metrics.nextStage.emoji} {metrics.nextStage[language]}
                        </span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${metrics.progressToNext}%`,
                                backgroundColor: metrics.nextStage.color
                            }}
                        />
                    </div>
                    <div className="text-right text-xs text-textSecondary mt-1">
                        {metrics.progressToNext}%
                    </div>
                </div>
            )}

            {/* Completion Badge */}
            {metrics.financialScore >= 90 && (
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 rounded-full px-4 py-2 border border-yellow-500/30">
                        <Crown className="text-yellow-500" size={16} />
                        <span className="text-sm font-bold text-yellow-600">
                            {language === 'ru' ? 'Финансово Свободен!' : 'Financially Free!'}
                        </span>
                        <Sparkles className="text-yellow-500" size={14} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialIdentityTracker;
