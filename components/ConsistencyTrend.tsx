import React, { useMemo } from 'react';
import { Habit } from '../types';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ConsistencyTrendProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

const ConsistencyTrend: React.FC<ConsistencyTrendProps> = ({ habits, language = 'ru' }) => {
    const data = useMemo(() => {
        const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');
        if (activeHabits.length === 0) return null;

        const now = new Date();
        const weeks: { label: string; rate: number; completions: number; total: number }[] = [];

        // Calculate 8 weeks of data
        for (let w = 7; w >= 0; w--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);

            let completions = 0;
            let total = 0;

            activeHabits.forEach(habit => {
                for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                    total++;
                    const dateStr = d.toISOString().slice(0, 10);
                    if (habit.completedDates.includes(dateStr)) completions++;
                }
            });

            const rate = total > 0 ? Math.round((completions / total) * 100) : 0;

            // Week label
            const monthDay = weekStart.getDate();
            const monthName = weekStart.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
            weeks.push({
                label: `${monthDay} ${monthName}`,
                rate,
                completions,
                total,
            });
        }

        // Calculate trend
        const recentAvg = weeks.slice(-3).reduce((s, w) => s + w.rate, 0) / 3;
        const olderAvg = weeks.slice(0, 3).reduce((s, w) => s + w.rate, 0) / 3;
        const trendDelta = Math.round(recentAvg - olderAvg);

        return { weeks, trendDelta, currentRate: weeks[weeks.length - 1].rate };
    }, [habits]);

    if (!data) return null;

    const maxRate = Math.max(...data.weeks.map(w => w.rate), 1);

    // SVG line chart
    const svgW = 280, svgH = 80;
    const padding = { left: 5, right: 5, top: 10, bottom: 5 };
    const chartW = svgW - padding.left - padding.right;
    const chartH = svgH - padding.top - padding.bottom;

    const points = data.weeks.map((w, i) => ({
        x: padding.left + (i / (data.weeks.length - 1)) * chartW,
        y: padding.top + chartH - (w.rate / Math.max(maxRate, 1)) * chartH,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${svgH} L ${points[0].x} ${svgH} Z`;

    const trendColor = data.trendDelta > 3 ? '#22c55e' : data.trendDelta < -3 ? '#ef4444' : '#eab308';
    const TrendIcon = data.trendDelta > 3 ? ArrowUpRight : data.trendDelta < -3 ? ArrowDownRight : Minus;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ background: `radial-gradient(circle, ${trendColor}50 0%, transparent 70%)` }} />

            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
                            <TrendingUp size={13} className="text-cyan-400" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                            {language === 'ru' ? 'Тренд Консистентности' : 'Consistency Trend'}
                        </h3>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${data.trendDelta > 3
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : data.trendDelta < -3
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        <TrendIcon size={12} />
                        {data.trendDelta > 0 ? '+' : ''}{data.trendDelta}%
                    </div>
                </div>

                {/* Area chart */}
                <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="mb-2">
                    <defs>
                        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={trendColor} stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={trendColor} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={trendColor} />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#trend-fill)" />
                    <path d={linePath} fill="none" stroke="url(#trend-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3"
                            fill={trendColor}
                            stroke="var(--surface)"
                            strokeWidth="1.5"
                            opacity={i === points.length - 1 ? 1 : 0.6}
                        />
                    ))}
                </svg>

                {/* Week labels */}
                <div className="flex justify-between px-1">
                    {data.weeks.map((w, i) => (
                        <div key={i} className="text-center">
                            <div className="text-[7px] text-textSecondary font-medium">{w.label}</div>
                            <div className="text-[9px] font-bold text-textPrimary">{w.rate}%</div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="mt-3 p-2.5 rounded-xl bg-surface/50 border border-borderSubtle">
                    <p className="text-[10px] text-textSecondary leading-relaxed">
                        {data.trendDelta > 5
                            ? (language === 'ru'
                                ? `📈 Отличная динамика! Ваша консистентность выросла на ${data.trendDelta}% за последние недели.`
                                : `📈 Great momentum! Your consistency improved by ${data.trendDelta}% over recent weeks.`)
                            : data.trendDelta > 0
                                ? (language === 'ru'
                                    ? `📊 Стабильный рост. Консистентность растёт на ${data.trendDelta}%. Продолжайте!`
                                    : `📊 Steady growth. Consistency up ${data.trendDelta}%. Keep going!`)
                                : data.trendDelta > -5
                                    ? (language === 'ru'
                                        ? `Стабильно. Держите текущий темп — ${data.currentRate}% на этой неделе.`
                                        : `Stable. Holding steady at ${data.currentRate}% this week.`)
                                    : (language === 'ru'
                                        ? `⚠️ Снижение на ${Math.abs(data.trendDelta)}%. Попробуйте сфокусироваться на 2-3 ключевых привычках.`
                                        : `⚠️ Down ${Math.abs(data.trendDelta)}%. Try focusing on 2-3 key habits.`)
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConsistencyTrend;
