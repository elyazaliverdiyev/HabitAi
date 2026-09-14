import React, { useMemo } from 'react';
import { Habit } from '../types';

interface ActivityChartProps {
    habits: Habit[];
    days?: number;
    height?: number;
    language?: 'ru' | 'en';
}

// TradingView-style activity chart showing daily completions
const ActivityChart: React.FC<ActivityChartProps> = ({
    habits,
    days = 30,
    height = 180,
    language = 'ru'
}) => {
    // Generate activity data from habits
    const activityData = useMemo(() => {
        if (!habits || !habits.length) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const data: { date: string; value: number; label: string }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Count completions for this date
            let completions = 0;
            habits.forEach(h => {
                if (h.completedDates?.includes(dateStr)) {
                    completions++;
                }
            });

            // Format label (Mon, Tue, etc)
            const dayLabel = d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }).slice(0, 2);
            const dateLabel = `${d.getDate()}`;

            data.push({
                date: dateStr,
                value: completions,
                label: i < 7 ? dayLabel : dateLabel
            });
        }

        return data;
    }, [habits, days, language]);

    // Check if there's any actual activity
    const hasActivity = activityData.some(d => d.value > 0);

    if (!activityData.length || !hasActivity) {
        return (
            <div
                className="bg-surface border border-borderSubtle rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                style={{ minHeight: height }}
            >
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" className="opacity-60">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                </div>
                <span className="text-sm font-medium text-textPrimary mb-1">
                    {language === 'ru' ? 'Нет активности за период' : 'No activity yet'}
                </span>
                <span className="text-xs text-textSecondary max-w-[200px]">
                    {language === 'ru'
                        ? 'Выполняй привычки — здесь появится твой прогресс!'
                        : 'Complete habits and your progress will appear here!'}
                </span>
            </div>
        );
    }

    const maxValue = Math.max(...activityData.map(d => d.value), 1);
    const totalCompletions = activityData.reduce((sum, d) => sum + d.value, 0);
    const avgPerDay = (totalCompletions / days).toFixed(1);

    return (
        <div
            className="bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm"
            style={{ minHeight: height }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand/20 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-brand uppercase tracking-wider">
                        {language === 'ru' ? 'Активность' : 'Activity'}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-textSecondary">{language === 'ru' ? 'Всего:' : 'Total:'}</span>
                        <span className="font-bold text-textPrimary">{totalCompletions}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-textSecondary">{language === 'ru' ? 'Среднее:' : 'Avg:'}</span>
                        <span className="font-bold text-textPrimary">{avgPerDay}/{language === 'ru' ? 'день' : 'day'}</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-0.5 h-24">
                {activityData.map((item, index) => {
                    const barHeight = (item.value / maxValue) * 100;
                    const isToday = index === activityData.length - 1;
                    const isEmpty = item.value === 0;

                    return (
                        <div
                            key={index}
                            className="flex-1 flex flex-col items-center group relative"
                        >
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-borderSubtle rounded-lg px-2 py-1 text-xs font-medium shadow-lg z-10 whitespace-nowrap pointer-events-none">
                                {item.value} {language === 'ru' ? 'выполнено' : 'completed'}
                            </div>

                            {/* Bar */}
                            <div
                                className={`w-full rounded-t transition-all duration-300 ${isToday ? 'ring-2 ring-brand/30' : ''}`}
                                style={{
                                    height: `${Math.max(barHeight, isEmpty ? 2 : 8)}%`,
                                    background: isEmpty
                                        ? 'var(--surface-highlight)'
                                        : `linear-gradient(180deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 60%, transparent) 100%)`,
                                    opacity: isEmpty ? 0.3 : 0.5 + (barHeight / 100) * 0.5,
                                    boxShadow: !isEmpty && barHeight > 30
                                        ? `0 0 10px color-mix(in srgb, var(--brand) 30%, transparent)`
                                        : 'none'
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* X-axis labels (show every 5th) */}
            <div className="flex justify-between mt-2 text-[9px] text-textSecondary/60">
                {activityData.filter((_, i) => i % Math.ceil(days / 7) === 0 || i === activityData.length - 1).map((item, index) => (
                    <span key={index}>{item.label}</span>
                ))}
            </div>
        </div>
    );
};

export default ActivityChart;
