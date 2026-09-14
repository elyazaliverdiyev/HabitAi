import React from 'react';
import { Target, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Goal, Habit, calculateGoalProgress, getAccentGradient } from '../types';
import { GeminiCard, GeminiText } from './GeminiUI';

interface GoalsWidgetProps {
    goals: Goal[];
    habits: Habit[];
    onOpenGoals: () => void;
    language: 'ru' | 'en';
    accentColor?: string | null;
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, habits, onOpenGoals, language, accentColor }) => {
    const activeGoals = goals.filter(g => !g.archived && !g.completedAt).slice(0, 3);
    const accent = getAccentGradient(accentColor);

    const t = {
        ru: {
            title: 'ЦЕЛИ',
            noGoals: 'Добавьте цель',
            viewAll: 'Все цели'
        },
        en: {
            title: 'GOALS',
            noGoals: 'Add a goal',
            viewAll: 'View all'
        }
    }[language];

    if (activeGoals.length === 0) {
        return (
            <GeminiCard
                onClick={onOpenGoals}
                hoverable
                className="p-4"
                accentGradient={accent.isGradient ? accent.gradient : accent.primary}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${accent.primary}20` }}
                    >
                        <Target size={20} style={{ color: accent.primary }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-textPrimary">{t.noGoals}</p>
                        <p className="text-xs text-textSecondary">{language === 'ru' ? 'Начните с большой цели' : 'Start with a big goal'}</p>
                    </div>
                    <Plus size={18} className="ml-auto text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </GeminiCard>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                    >
                        <Target size={10} className="text-white" strokeWidth={3} />
                    </div>
                    <span style={{
                        background: accent.isGradient ? accent.gradient : accent.primary,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>{t.title}</span>
                </div>
                <button
                    onClick={onOpenGoals}
                    className="text-xs hover:underline flex items-center gap-1 font-medium"
                    style={{ color: accent.primary }}
                >
                    {t.viewAll}
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Goals cards */}
            <div className="space-y-2">
                {activeGoals.map(goal => {
                    const progress = calculateGoalProgress(goal, habits);
                    const isNearComplete = progress >= 80;

                    return (
                        <GeminiCard
                            key={goal.id}
                            onClick={onOpenGoals}
                            hoverable
                            className="p-3"
                            accentGradient={accent.isGradient ? accent.gradient : accent.primary}
                        >
                            <div className="flex items-center gap-3">
                                {/* Emoji with gradient progress ring */}
                                <div className="relative">
                                    <svg className="w-10 h-10 -rotate-90">
                                        <defs>
                                            <linearGradient id={`goalGradient-${goal.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                {accent.colors.map((color, i) => (
                                                    <stop key={i} offset={`${accent.colors.length > 1 ? (i / (accent.colors.length - 1)) * 100 : 0}%`} stopColor={color} />
                                                ))}
                                            </linearGradient>
                                        </defs>
                                        <circle
                                            cx="20"
                                            cy="20"
                                            r="18"
                                            fill="none"
                                            stroke={`${accent.primary}25`}
                                            strokeWidth="3"
                                        />
                                        <circle
                                            cx="20"
                                            cy="20"
                                            r="18"
                                            fill="none"
                                            stroke={`url(#goalGradient-${goal.id})`}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 18}`}
                                            strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                                            className="transition-all duration-500"
                                            style={{
                                                filter: isNearComplete ? `drop-shadow(0 0 8px ${accent.primary}99)` : 'none'
                                            }}
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-lg">
                                        {progress === 100 ? '🏆' : goal.emoji}
                                    </span>
                                </div>

                                {/* Title & info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-textPrimary truncate">{goal.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-textSecondary">
                                        <span>{goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length} {language === 'ru' ? 'этапов' : 'milestones'}</span>
                                        {goal.targetDate && (
                                            <>
                                                <span>•</span>
                                                <span>{new Date(goal.targetDate).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Progress badge with dynamic gradient */}
                                <div
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                                    style={{
                                        background: accent.isGradient ? accent.gradient : accent.primary
                                    }}
                                >
                                    {progress}%
                                </div>
                            </div>

                            {/* Milestones preview */}
                            {goal.milestones.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-borderSubtle/30 flex gap-1 overflow-hidden">
                                    {goal.milestones.slice(0, 3).map(m => (
                                        <span
                                            key={m.id}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[80px] ${m.isCompleted
                                                ? 'text-white'
                                                : 'bg-surfaceHighlight text-textSecondary'
                                                }`}
                                            style={m.isCompleted ? {
                                                background: accent.isGradient ? accent.gradient : accent.primary
                                            } : undefined}
                                        >
                                            {m.isCompleted ? '✓ ' : ''}{m.title}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </GeminiCard>
                    );
                })}
            </div>
        </div>
    );
};

export default GoalsWidget;
