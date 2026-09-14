import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface WeekdayAnalyticsProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_FULL_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const WEEKDAY_FULL_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeekdayAnalytics: React.FC<WeekdayAnalyticsProps> = ({ habits, language = 'ru' }) => {
    const data = useMemo(() => {
        const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');
        if (activeHabits.length === 0) return null;

        const now = new Date();
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Count completions per day of week (Mon=0 .. Sun=6)
        const dayCounts = new Array(7).fill(0);
        const dayOpportunities = new Array(7).fill(0);

        // Count opportunities per day
        for (let d = new Date(sixtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
            const dayIndex = (d.getDay() + 6) % 7; // Mon=0, Sun=6
            dayOpportunities[dayIndex] += activeHabits.length;
        }

        // Count actual completions per day
        activeHabits.forEach(habit => {
            habit.completedDates.forEach(dateStr => {
                const date = new Date(dateStr);
                if (date >= sixtyDaysAgo && date <= now) {
                    const dayIndex = (date.getDay() + 6) % 7;
                    dayCounts[dayIndex]++;
                }
            });
        });

        // Calculate rates
        const rates = dayCounts.map((count, i) =>
            dayOpportunities[i] > 0 ? Math.round((count / dayOpportunities[i]) * 100) : 0
        );

        const maxRate = Math.max(...rates);
        const minRate = Math.min(...rates);
        const bestDay = rates.indexOf(maxRate);
        const worstDay = rates.indexOf(minRate);

        return { rates, maxRate, minRate, bestDay, worstDay };
    }, [habits]);

    if (!data) return null;

    const labels = language === 'ru' ? WEEKDAYS_RU : WEEKDAYS_EN;
    const fullLabels = language === 'ru' ? WEEKDAY_FULL_RU : WEEKDAY_FULL_EN;

    const getBarColor = (rate: number) => {
        if (rate >= 70) return '#22c55e';
        if (rate >= 50) return '#eab308';
        if (rate >= 30) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)' }} />

            <div className="relative p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
                            <Calendar size={13} className="text-blue-400" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                            {language === 'ru' ? 'Дни Недели' : 'Weekday Patterns'}
                        </h3>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="flex items-end gap-1.5 h-[100px] mb-3">
                    {data.rates.map((rate, i) => {
                        const height = data.maxRate > 0 ? (rate / data.maxRate) * 100 : 0;
                        const isBest = i === data.bestDay;
                        const isWorst = i === data.worstDay;
                        const color = getBarColor(rate);

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[8px] font-bold text-textSecondary">{rate}%</span>
                                <div className="w-full relative flex-1 flex items-end">
                                    <div
                                        className="w-full rounded-t-md transition-all duration-500"
                                        style={{
                                            height: `${Math.max(height, 4)}%`,
                                            background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
                                            boxShadow: isBest ? `0 0 10px ${color}40` : 'none',
                                            animation: `grow-bar 0.8s ease-out ${i * 0.05}s both`,
                                        }}
                                    />
                                </div>
                                <span className={`text-[9px] font-bold ${isBest ? 'text-emerald-400' : isWorst ? 'text-red-400' : 'text-textSecondary'}`}>
                                    {labels[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Insights */}
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                        <div>
                            <div className="text-[9px] font-bold text-emerald-400 uppercase">{language === 'ru' ? 'Лучший день' : 'Best Day'}</div>
                            <div className="text-[11px] font-black text-textPrimary">{fullLabels[data.bestDay]}</div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                        <TrendingDown size={14} className="text-red-400 shrink-0" />
                        <div>
                            <div className="text-[9px] font-bold text-red-400 uppercase">{language === 'ru' ? 'Слабый день' : 'Weak Day'}</div>
                            <div className="text-[11px] font-black text-textPrimary">{fullLabels[data.worstDay]}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekdayAnalytics;
