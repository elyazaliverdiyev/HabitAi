import React from 'react';
import { Habit, UserIdentity, IDENTITY_PRESETS, getCurrentStreak } from '../types';
import { Flame, Zap, CheckCircle, Target, Sparkles, Crown, Star } from 'lucide-react';
import Icon from './Icons';

interface HabitIdentityMapProps {
    habits: Habit[];
    userIdentity?: UserIdentity;
    language: 'ru' | 'en';
}

const HabitIdentityMap: React.FC<HabitIdentityMapProps> = ({
    habits,
    userIdentity,
    language
}) => {
    if (!userIdentity) {
        return (
            <div className="p-8 text-center">
                <div
                    className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30"
                    style={{ animation: 'subtle-float 3s ease-in-out infinite' }}
                >
                    <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-textPrimary mb-2">
                    {language === 'ru' ? 'Создай видение' : 'Create Vision'}
                </h3>
                <p className="text-sm text-textSecondary">
                    {language === 'ru' ? 'Определи кем хочешь стать' : 'Define who you want to become'}
                </p>
            </div>
        );
    }

    const preset = IDENTITY_PRESETS.find(p => p.id === userIdentity.targetIdentity);
    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');

    const totalCompletions = activeHabits.reduce((sum, h) => sum + h.completedDates.length, 0);
    const bestStreak = Math.max(...activeHabits.map(h => getCurrentStreak(h)), 0);
    const habitsWithStreak = activeHabits.filter(h => getCurrentStreak(h) > 0).length;

    // Stats config
    const stats = [
        {
            icon: CheckCircle,
            value: totalCompletions,
            label: language === 'ru' ? 'Сделано' : 'Done',
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.12)'
        },
        {
            icon: Flame,
            value: bestStreak,
            label: language === 'ru' ? 'Стрик' : 'Streak',
            color: '#f97316',
            bgColor: 'rgba(249, 115, 22, 0.12)'
        },
        {
            icon: Zap,
            value: habitsWithStreak,
            label: language === 'ru' ? 'Активно' : 'Active',
            color: '#22c55e',
            bgColor: 'rgba(34, 197, 94, 0.12)'
        }
    ];

    return (
        <div className="p-4 space-y-4">
            {/* Stats Grid - Premium Bento Style */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="group bg-surface border border-borderSubtle rounded-2xl p-4 hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default animate-fadeIn"
                            style={{
                                animationDelay: `${i * 60}ms`,
                                animationFillMode: 'both'
                            }}
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110"
                                style={{ backgroundColor: stat.bgColor }}
                            >
                                <IconComponent size={18} style={{ color: stat.color }} />
                            </div>
                            <p
                                className="text-2xl font-black transition-all duration-300"
                                style={{ color: stat.color }}
                            >
                                {stat.value}
                            </p>
                            <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-1 font-bold">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Habits List - Modern Card */}
            <div
                className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden animate-fadeIn"
                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
                <div className="px-4 py-3 border-b border-borderSubtle flex items-center justify-between bg-surfaceHighlight/30">
                    <p className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                        {language === 'ru' ? 'Привычки' : 'Habits'}
                    </p>
                    <Crown size={14} className="text-amber-500" />
                </div>
                <div className="divide-y divide-borderSubtle">
                    {activeHabits.slice(0, 5).map((habit, index) => {
                        const streak = getCurrentStreak(habit);
                        return (
                            <div
                                key={habit.id}
                                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surfaceHighlight/50 transition-all duration-200 cursor-default group animate-fadeIn"
                                style={{
                                    animationDelay: `${280 + index * 60}ms`,
                                    animationFillMode: 'both'
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                                    style={{
                                        backgroundColor: habit.color,
                                        boxShadow: `0 4px 12px ${habit.color}30`
                                    }}
                                >
                                    <Icon name={habit.icon} size={20} />
                                </div>
                                <p className="flex-1 text-sm font-semibold text-textPrimary truncate">
                                    {habit.name}
                                </p>
                                {streak > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 transition-all duration-300 group-hover:scale-105">
                                        <Flame size={14} className="text-orange-500" />
                                        <span className="text-xs font-black text-orange-500">{streak}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {activeHabits.length > 5 && (
                        <div className="px-4 py-3 text-center bg-surfaceHighlight/20">
                            <p className="text-xs text-textSecondary font-medium">
                                +{activeHabits.length - 5} {language === 'ru' ? 'ещё' : 'more'}
                            </p>
                        </div>
                    )}

                    {activeHabits.length === 0 && (
                        <div className="px-4 py-10 text-center">
                            <Star size={28} className="text-textSecondary/30 mx-auto mb-3" />
                            <p className="text-sm text-textSecondary">
                                {language === 'ru' ? 'Создай привычки для этого видения' : 'Create habits for this vision'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HabitIdentityMap;
