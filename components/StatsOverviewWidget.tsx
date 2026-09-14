import React from 'react';
import { Check, TrendingUp, Flame, Banknote, Maximize2 } from 'lucide-react';
import { Habit } from '../types';
import { translations } from '../translations';
import { getLocalDateString } from '../utils/helpers';

interface StatsOverviewWidgetProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    onOpenActivity: () => void;
}

const StatsOverviewWidget: React.FC<StatsOverviewWidgetProps> = ({ habits, language = 'ru', onOpenActivity }) => {
    const t = translations[language].stats;
    const stats = React.useMemo(() => {
        const habitList = habits.filter(h => h.type !== 'task');
        const total = habits.reduce((acc, h) => acc + h.completedDates.length, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const past7DaysStr: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            past7DaysStr.push(getLocalDateString(d));
        }

        let last7DaysCompletions = 0;
        habitList.forEach(h => {
            h.completedDates.forEach(date => {
                if (past7DaysStr.includes(date)) last7DaysCompletions++;
            });
        });

        const possible = habitList.length * 7;
        const rate = possible > 0 ? Math.round((last7DaysCompletions / possible) * 100) : 0;

        const allDates = new Set<string>();
        habitList.forEach(h => h.completedDates.forEach(d => allDates.add(d)));

        let streak = 0;
        const todayStr = getLocalDateString(today);
        const yestStr = getLocalDateString(new Date(today.getTime() - 86400000));

        if (allDates.has(todayStr) || allDates.has(yestStr)) {
            let current = new Date(today);
            if (!allDates.has(todayStr)) current.setDate(current.getDate() - 1);

            while (true) {
                const str = getLocalDateString(current);
                if (allDates.has(str)) {
                    streak++;
                    current.setDate(current.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        const history = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateString(d);
            let count = 0;
            habits.forEach(h => {
                if (h.completedDates.includes(dateStr)) count++;
            });
            history.push({ date: dateStr, count });
        }
        const maxHistory = Math.max(...history.map(d => d.count), 1);

        // Calculate today's investment (completed items with cost)
        const expenseTodayStr = getLocalDateString(today);
        const todayInvestment = habits
            .filter(h => {
                const costNum = Number(h.cost);
                return !isNaN(costNum) && costNum > 0 && h.completedDates.includes(expenseTodayStr);
            })
            .reduce((sum, h) => sum + Number(h.cost || 0), 0);

        return { total, rate, streak, history, maxHistory, todayInvestment };
    }, [habits]);

    if (habits.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 animate-fadeIn">
            <div className="grid grid-cols-4 gap-2">
                <div
                    className="bg-surface border border-borderSubtle rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-sm hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
                    style={{ animationDelay: '0ms' }}
                >
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-xl mb-0.5 group-hover:scale-110 transition-transform">
                        <Check size={16} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black text-textPrimary">{stats.total}</span>
                    <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">{t.total}</span>
                </div>
                <div
                    className="bg-surface border border-borderSubtle rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-sm hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
                    style={{ animationDelay: '50ms' }}
                >
                    <div className="p-1.5 bg-green-500/10 text-green-500 rounded-xl mb-0.5">
                        <TrendingUp size={16} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black text-textPrimary">{stats.rate}%</span>
                    <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">{t.week}</span>
                </div>
                <div
                    className="bg-surface border border-borderSubtle rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-sm hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-xl mb-0.5">
                        <Flame size={16} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black text-textPrimary">{stats.streak}</span>
                    <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">{t.streak}</span>
                </div>
                <div
                    className="bg-surface border border-borderSubtle rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-sm hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
                    style={{ animationDelay: '150ms' }}
                >
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl mb-0.5">
                        <Banknote size={16} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black text-emerald-500">{stats.todayInvestment > 0 ? `$${stats.todayInvestment}` : '—'}</span>
                    <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">{language === 'ru' ? 'Инвестиция' : 'Investment'}</span>
                </div>
            </div>

            <div
                onClick={onOpenActivity}
                className="group section-card p-4 flex items-center justify-between cursor-pointer relative overflow-hidden active:scale-[0.98]"
            >
                <div className="flex flex-col z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">{t.activity}</span>
                        <Maximize2 size={10} className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs font-medium text-textPrimary">{t.days14}</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="flex items-end gap-1.5 h-8 z-10">
                    {stats.history.map((day, i) => {
                        const height = Math.max((day.count / stats.maxHistory) * 100, 15);
                        return (
                            <div
                                key={day.date}
                                className={`w-2.5 rounded-md transition-all duration-300 ${day.count > 0 ? 'bg-brand' : 'bg-surfaceHighlight'}`}
                                style={{
                                    height: `${height}%`,
                                    opacity: day.count > 0 ? 0.8 + (i / 28) : 0.5
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StatsOverviewWidget;
