import React, { useMemo } from 'react';
import { Habit } from '../types';
import { AlertTriangle, Flame, Clock, Shield, ChevronRight } from 'lucide-react';

interface StreakRiskProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

const StreakRisk: React.FC<StreakRiskProps> = ({ habits, language = 'ru' }) => {
    const riskData = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

        const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');

        return activeHabits
            .map(habit => {
                // Calculate current streak
                let streak = 0;
                let check = new Date();
                const completed = new Set(habit.completedDates);
                if (!completed.has(todayStr)) check.setDate(check.getDate() - 1);
                while (streak < 365) {
                    const dateStr = check.toISOString().slice(0, 10);
                    if (completed.has(dateStr)) {
                        streak++;
                        check.setDate(check.getDate() - 1);
                    } else break;
                }

                const doneToday = completed.has(todayStr);
                const doneYesterday = completed.has(yesterdayStr);

                // Risk levels:
                // CRITICAL: streak >= 3, not done today
                // WARNING: streak >= 7, not done today (even more to lose)
                // SAFE: done today or no streak
                let risk: 'critical' | 'warning' | 'safe' = 'safe';
                if (streak >= 7 && !doneToday) risk = 'critical';
                else if (streak >= 3 && !doneToday) risk = 'warning';

                return {
                    id: habit.id,
                    name: habit.name,
                    icon: habit.icon,
                    color: habit.color || '#6366f1',
                    streak,
                    doneToday,
                    risk,
                };
            })
            .filter(h => h.risk !== 'safe' && h.streak > 0)
            .sort((a, b) => b.streak - a.streak);
    }, [habits]);

    if (riskData.length === 0) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/10"
            style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Danger glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)' }} />

            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
                            <AlertTriangle size={13} className="text-red-400" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                            {language === 'ru' ? 'Стрики под угрозой' : 'Streaks at Risk'}
                        </h3>
                    </div>
                    <div className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        {riskData.length} {language === 'ru' ? (riskData.length === 1 ? 'стрик' : 'стриков') : (riskData.length === 1 ? 'streak' : 'streaks')}
                    </div>
                </div>

                <div className="space-y-2">
                    {riskData.slice(0, 5).map(item => (
                        <div key={item.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${item.risk === 'critical'
                                    ? 'bg-red-500/5 border-red-500/15'
                                    : 'bg-amber-500/5 border-amber-500/15'
                                }`}
                        >
                            <div className="text-lg shrink-0">{item.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-textPrimary truncate">{item.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Flame size={10} className="text-orange-400" />
                                    <span className="text-[10px] font-bold text-orange-400">
                                        {item.streak} {language === 'ru' ? 'дней' : 'days'}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${item.risk === 'critical'
                                    ? 'bg-red-500/15 text-red-400'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}>
                                {item.risk === 'critical'
                                    ? (language === 'ru' ? '🚨 Критично!' : '🚨 Critical!')
                                    : (language === 'ru' ? '⚠️ Внимание' : '⚠️ Warning')
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StreakRisk;
