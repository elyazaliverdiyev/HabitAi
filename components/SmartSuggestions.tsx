import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Sparkles, TrendingUp, Rocket, Clock, Calendar, Star } from 'lucide-react';

interface SmartSuggestionsProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

interface Suggestion {
    type: 'celebrate' | 'growth' | 'tip';
    icon: React.ReactNode;
    text: string;
    accent: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ habits, language = 'ru' }) => {
    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');

    const suggestions = useMemo((): Suggestion[] => {
        if (activeHabits.length === 0) return [];

        const result: Suggestion[] = [];
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const dayOfWeek = now.getDay();
        const dayNames = language === 'ru'
            ? ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 1. Find best day of week — celebrate it!
        const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        activeHabits.forEach(h => {
            h.completedDates.forEach(d => {
                const day = new Date(d).getDay();
                dayCompletions[day]++;
            });
        });
        for (let w = 0; w < 8; w++) {
            for (let d = 0; d < 7; d++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (w * 7 + ((dayOfWeek - d + 7) % 7)));
                if (date <= now) dayCounts[d]++;
            }
        }
        const dayAvg = dayCompletions.map((c, i) => dayCounts[i] > 0 ? c / dayCounts[i] : 0);
        const bestDay = dayAvg.indexOf(Math.max(...dayAvg));

        if (dayAvg[bestDay] > 0) {
            result.push({
                type: 'celebrate',
                icon: <Calendar size={14} />,
                text: language === 'ru'
                    ? `⭐ ${dayNames[bestDay]} — ваш день силы! В среднем ${Math.round(dayAvg[bestDay])} выполнений. Используйте эту энергию!`
                    : `⭐ ${dayNames[bestDay]} is your power day! Average ${Math.round(dayAvg[bestDay])} completions. Harness that energy!`,
                accent: 'amber',
            });
        }

        // 2. Growing habits — positive momentum!
        activeHabits.forEach(h => {
            const last7 = h.completedDates.filter(d => {
                const diff = (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }).length;
            if (last7 >= 6) {
                result.push({
                    type: 'celebrate',
                    icon: <Star size={14} />,
                    text: language === 'ru'
                        ? `🚀 «${h.name}» — ${last7}/7 дней! Вы строите мощную привычку, так держать!`
                        : `🚀 "${h.name}" — ${last7}/7 days! You're building an amazing habit, keep going!`,
                    accent: 'emerald',
                });
            }
        });

        // 3. Potential for growth (reframed from "declining") — positive framing
        activeHabits.forEach(h => {
            const last14 = h.completedDates.filter(d => {
                const diff = (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 14;
            }).length;
            const prev14 = h.completedDates.filter(d => {
                const diff = (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                return diff > 14 && diff <= 28;
            }).length;

            if (prev14 > 3 && last14 < prev14 * 0.5) {
                result.push({
                    type: 'growth',
                    icon: <Rocket size={14} />,
                    text: language === 'ru'
                        ? `💪 «${h.name}» — сейчас самое время вернуть темп! Вы уже доказали что можете (${prev14} за прошлые 2 недели). Один шаг — и вы снова в деле!`
                        : `💪 "${h.name}" — time to reclaim your momentum! You already proved you can (${prev14} in previous 2 weeks). One step and you're back!`,
                    accent: 'sky',
                });
            }
        });

        // 4. Morning routine power
        const habitsWithTime = activeHabits.filter(h => h.time);
        if (habitsWithTime.length > 0) {
            const morningHabits = habitsWithTime.filter(h => {
                const hour = parseInt(h.time!.split(':')[0]);
                return hour < 12;
            });
            if (morningHabits.length >= 2) {
                result.push({
                    type: 'tip',
                    icon: <Clock size={14} />,
                    text: language === 'ru'
                        ? `✨ ${morningHabits.length} привычек утром — отличная стратегия! Утренняя рутина = суперсила. Попробуйте связать их в цепочку!`
                        : `✨ ${morningHabits.length} morning habits — great strategy! Morning routine = superpower. Try chaining them together!`,
                    accent: 'violet',
                });
            }
        }

        // 5. Encouraging start — reframed from "nothing done today"
        const completedToday = activeHabits.filter(h => h.completedDates.includes(todayStr)).length;
        if (completedToday === 0 && activeHabits.length > 0 && now.getHours() > 10) {
            result.push({
                type: 'tip',
                icon: <Sparkles size={14} />,
                text: language === 'ru'
                    ? `🌟 Новый день — новые возможности! Начните с самой лёгкой привычки, и остальные подтянутся за ней.`
                    : `🌟 New day, new opportunities! Start with the easiest habit, and the rest will follow.`,
                accent: 'amber',
            });
        }

        // 6. Total progress milestone
        const totalAll = activeHabits.reduce((sum, h) => sum + h.completedDates.length, 0);
        if (totalAll > 0) {
            const milestone = totalAll >= 1000 ? 1000 : totalAll >= 500 ? 500 : totalAll >= 100 ? 100 : totalAll >= 50 ? 50 : null;
            if (milestone && totalAll < milestone * 1.2) {
                result.push({
                    type: 'celebrate',
                    icon: <TrendingUp size={14} />,
                    text: language === 'ru'
                        ? `🏆 ${totalAll} выполнений всего — вы преодолели отметку ${milestone}! Каждое выполнение формирует вас.`
                        : `🏆 ${totalAll} total completions — you passed the ${milestone} mark! Every completion shapes who you are.`,
                    accent: 'emerald',
                });
            }
        }

        return result.slice(0, 4);
    }, [activeHabits, language]);

    if (suggestions.length === 0) return null;

    const accentMap: Record<string, { bg: string; border: string; text: string }> = {
        amber: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-400' },
        emerald: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', text: 'text-emerald-400' },
        sky: { bg: 'bg-sky-500/8', border: 'border-sky-500/15', text: 'text-sky-400' },
        violet: { bg: 'bg-violet-500/8', border: 'border-violet-500/15', text: 'text-violet-400' },
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                        <Sparkles size={13} className="text-amber-400" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                        {language === 'ru' ? 'Умные советы' : 'Smart Insights'}
                    </h3>
                </div>

                <div className="space-y-2">
                    {suggestions.map((s, i) => {
                        const colors = accentMap[s.accent] || accentMap.amber;
                        return (
                            <div
                                key={i}
                                className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all border ${colors.bg} ${colors.border} ${colors.text}`}
                                style={{
                                    animation: `smart-fade-in 0.4s ease-out ${i * 0.1}s both`,
                                }}
                            >
                                <div className="mt-0.5 shrink-0 opacity-80">{s.icon}</div>
                                <p className="leading-relaxed">{s.text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes smart-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SmartSuggestions;
