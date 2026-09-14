import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Trophy, Flame, Star, Calendar, Zap, Target } from 'lucide-react';

interface PersonalRecordsProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

const PersonalRecords: React.FC<PersonalRecordsProps> = ({ habits, language = 'ru' }) => {
    const records = useMemo(() => {
        const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');
        if (activeHabits.length === 0) return null;

        // 1. Max streak ever (across all habits)
        let maxStreak = 0;
        let maxStreakHabit = '';
        let maxStreakIcon = '';

        activeHabits.forEach(habit => {
            let streak = 0;
            let best = 0;
            const sorted = [...habit.completedDates].sort();
            for (let i = 0; i < sorted.length; i++) {
                if (i === 0) {
                    streak = 1;
                } else {
                    const prev = new Date(sorted[i - 1]);
                    const curr = new Date(sorted[i]);
                    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
                    streak = diff === 1 ? streak + 1 : 1;
                }
                best = Math.max(best, streak);
            }
            if (best > maxStreak) {
                maxStreak = best;
                maxStreakHabit = habit.name;
                maxStreakIcon = habit.icon;
            }
        });

        // 2. Best single week (most completions in any 7-day window)
        const allDates = new Set<string>();
        activeHabits.forEach(h => h.completedDates.forEach(d => allDates.add(d)));
        const sortedDates = [...allDates].sort();

        let bestWeek = 0;
        let bestWeekDate = '';
        if (sortedDates.length > 0) {
            const firstDate = new Date(sortedDates[0]);
            const lastDate = new Date(sortedDates[sortedDates.length - 1]);

            for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
                let weekCount = 0;
                for (let i = 0; i < 7; i++) {
                    const checkDate = new Date(d);
                    checkDate.setDate(checkDate.getDate() + i);
                    const dateStr = checkDate.toISOString().slice(0, 10);
                    activeHabits.forEach(h => {
                        if (h.completedDates.includes(dateStr)) weekCount++;
                    });
                }
                if (weekCount > bestWeek) {
                    bestWeek = weekCount;
                    bestWeekDate = d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                    });
                }
            }
        }

        // 3. Total completions
        const totalCompletions = activeHabits.reduce((sum, h) => sum + h.completedDates.length, 0);

        // 4. Most consistent habit (highest completion rate over 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let mostConsistent = { name: '', icon: '', rate: 0 };
        activeHabits.forEach(habit => {
            const recent = habit.completedDates.filter(d => new Date(d) >= thirtyDaysAgo).length;
            const rate = Math.round((recent / 30) * 100);
            if (rate > mostConsistent.rate) {
                mostConsistent = { name: habit.name, icon: habit.icon, rate };
            }
        });

        // 5. Current total active streaks
        let totalActiveStreaks = 0;
        activeHabits.forEach(habit => {
            const todayStr = now.toISOString().slice(0, 10);
            const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
            const completed = new Set(habit.completedDates);
            let streak = 0;
            let check = new Date();
            if (!completed.has(todayStr)) check.setDate(check.getDate() - 1);
            while (streak < 365) {
                if (completed.has(check.toISOString().slice(0, 10))) {
                    streak++;
                    check.setDate(check.getDate() - 1);
                } else break;
            }
            if (streak > 0) totalActiveStreaks++;
        });

        return [
            {
                icon: <Flame size={18} className="text-orange-400" />,
                label: language === 'ru' ? 'Рекорд стрика' : 'Best Streak',
                value: `${maxStreak}`,
                unit: language === 'ru' ? 'дней' : 'days',
                detail: `${maxStreakIcon} ${maxStreakHabit}`,
                color: '#f97316',
            },
            {
                icon: <Star size={18} className="text-amber-400" />,
                label: language === 'ru' ? 'Лучшая неделя' : 'Best Week',
                value: `${bestWeek}`,
                unit: language === 'ru' ? 'выполнений' : 'completions',
                detail: bestWeekDate,
                color: '#eab308',
            },
            {
                icon: <Target size={18} className="text-emerald-400" />,
                label: language === 'ru' ? 'Самая стабильная' : 'Most Consistent',
                value: `${mostConsistent.rate}%`,
                unit: '',
                detail: `${mostConsistent.icon} ${mostConsistent.name}`,
                color: '#22c55e',
            },
            {
                icon: <Zap size={18} className="text-blue-400" />,
                label: language === 'ru' ? 'Всего выполнено' : 'Total Done',
                value: `${totalCompletions}`,
                unit: '',
                detail: `${totalActiveStreaks} ${language === 'ru' ? 'активных стриков' : 'active streaks'}`,
                color: '#3b82f6',
            },
        ];
    }, [habits, language]);

    if (!records) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.4) 0%, transparent 70%)' }} />

            <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                        <Trophy size={13} className="text-amber-400" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                        {language === 'ru' ? 'Личные Рекорды' : 'Personal Records'}
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {records.map((record, i) => (
                        <div key={i}
                            className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                {record.icon}
                                <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wide">
                                    {record.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-textPrimary">{record.value}</span>
                                {record.unit && (
                                    <span className="text-[9px] font-bold text-textSecondary">{record.unit}</span>
                                )}
                            </div>
                            <div className="text-[9px] text-textSecondary mt-0.5 truncate">{record.detail}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalRecords;
