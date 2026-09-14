import React, { useMemo } from 'react';
import { Habit, IDENTITY_MAP, IDENTITY_MILESTONES, getIdentityBadge } from '../types';
import { translations } from '../translations';
import {
    TrendingUp, Target, AlertTriangle, Sparkles,
    ChevronRight, Zap, Award, Star, ArrowUp
} from 'lucide-react';

interface IdentityDashboardProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    accentColor?: string | null;
}

interface IdentityProgress {
    category: string;
    identity: { ru: string; en: string };
    emoji: string;
    currentStreak: number;
    totalCompletions: number;
    currentLevel: number;
    currentLevelLabel: string;
    nextMilestone: number | null;
    daysToNext: number;
    progressPercent: number;
    habitCount: number;
}

interface Bottleneck {
    habit: Habit;
    category: string;
    issue: 'low_streak' | 'stalled' | 'low_completion';
    severity: 'high' | 'medium' | 'low';
    message: { ru: string; en: string };
    suggestion: { ru: string; en: string };
}

const IdentityDashboard: React.FC<IdentityDashboardProps> = ({
    habits,
    language = 'ru',
    accentColor
}) => {
    const t = {
        title: language === 'ru' ? 'Трансформация Личности' : 'Identity Transformation',
        activeIdentities: language === 'ru' ? 'Активные идентичности' : 'Active Identities',
        bottleneck: language === 'ru' ? 'Узкое горлышко' : 'Bottleneck',
        noBottlenecks: language === 'ru' ? 'Всё отлично! Продолжай в том же духе.' : 'All good! Keep it up.',
        daysTo: language === 'ru' ? 'до' : 'to',
        days: language === 'ru' ? 'дн.' : 'days',
        level: language === 'ru' ? 'Уровень' : 'Level',
        habits: language === 'ru' ? 'привычек' : 'habits',
        journey: language === 'ru' ? 'Путь трансформации' : 'Transformation Journey',
        milestones: {
            7: language === 'ru' ? 'Начало' : 'Start',
            21: language === 'ru' ? 'Формирование' : 'Forming',
            66: language === 'ru' ? 'Мастерство' : 'Mastery',
            100: language === 'ru' ? 'Легенда' : 'Legend'
        }
    };

    // Calculate identity progress for each category
    const identityProgress = useMemo((): IdentityProgress[] => {
        const categoryMap: Record<string, {
            habits: Habit[];
            totalStreak: number;
            maxStreak: number;
            totalCompletions: number;
        }> = {};

        habits.forEach(habit => {
            const cat = habit.category || 'Продуктивность';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { habits: [], totalStreak: 0, maxStreak: 0, totalCompletions: 0 };
            }

            // Calculate current streak for this habit
            const sortedDates = [...habit.completedDates].sort().reverse();
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < sortedDates.length; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const checkStr = checkDate.toISOString().split('T')[0];

                if (sortedDates.includes(checkStr)) {
                    streak++;
                } else if (i === 0) {
                    // Check if yesterday was completed
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    if (!sortedDates.includes(yesterdayStr)) break;
                } else {
                    break;
                }
            }

            categoryMap[cat].habits.push(habit);
            categoryMap[cat].totalStreak += streak;
            categoryMap[cat].maxStreak = Math.max(categoryMap[cat].maxStreak, streak);
            categoryMap[cat].totalCompletions += habit.completedDates.length;
        });

        return Object.entries(categoryMap).map(([category, data]) => {
            const identity = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };
            const avgStreak = data.habits.length > 0 ? Math.round(data.totalStreak / data.habits.length) : 0;

            // Find current milestone
            let currentMilestone = { days: 0, level: 0, labelRu: 'Новичок', labelEn: 'Novice' };
            for (const milestone of IDENTITY_MILESTONES) {
                if (data.maxStreak >= milestone.days) {
                    currentMilestone = milestone;
                }
            }

            // Find next milestone
            const nextMilestone = IDENTITY_MILESTONES.find(m => m.days > data.maxStreak);
            const daysToNext = nextMilestone ? nextMilestone.days - data.maxStreak : 0;

            // Calculate progress to next milestone
            const prevMilestone = IDENTITY_MILESTONES.filter(m => m.days <= data.maxStreak).pop();
            const prevDays = prevMilestone?.days || 0;
            const nextDays = nextMilestone?.days || 100;
            const progressPercent = nextMilestone
                ? ((data.maxStreak - prevDays) / (nextDays - prevDays)) * 100
                : 100;

            return {
                category,
                identity: { ru: identity.ru, en: identity.en },
                emoji: identity.emoji,
                currentStreak: data.maxStreak,
                totalCompletions: data.totalCompletions,
                currentLevel: currentMilestone.level,
                currentLevelLabel: language === 'ru' ? currentMilestone.labelRu : currentMilestone.labelEn,
                nextMilestone: nextMilestone?.days || null,
                daysToNext,
                progressPercent: Math.min(100, progressPercent),
                habitCount: data.habits.length
            };
        }).sort((a, b) => b.currentStreak - a.currentStreak);
    }, [habits, language]);

    // Detect bottlenecks
    const bottlenecks = useMemo((): Bottleneck[] => {
        const issues: Bottleneck[] = [];

        habits.forEach(habit => {
            const sortedDates = [...habit.completedDates].sort().reverse();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if habit is stalled (no completion in 3+ days)
            if (sortedDates.length > 0) {
                const lastDate = new Date(sortedDates[0]);
                const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

                if (daysSince >= 3 && daysSince < 7) {
                    issues.push({
                        habit,
                        category: habit.category || 'Продуктивность',
                        issue: 'stalled',
                        severity: 'medium',
                        message: {
                            ru: `"${habit.name}" не выполнялась ${daysSince} дней`,
                            en: `"${habit.name}" not done for ${daysSince} days`
                        },
                        suggestion: {
                            ru: 'Попробуй уменьшить сложность или связать с существующей привычкой',
                            en: 'Try reducing difficulty or stack it with an existing habit'
                        }
                    });
                } else if (daysSince >= 7) {
                    issues.push({
                        habit,
                        category: habit.category || 'Продуктивность',
                        issue: 'stalled',
                        severity: 'high',
                        message: {
                            ru: `"${habit.name}" заброшена уже ${daysSince} дней`,
                            en: `"${habit.name}" abandoned for ${daysSince} days`
                        },
                        suggestion: {
                            ru: 'Пересмотри эту привычку — возможно, она слишком сложная или не актуальная',
                            en: 'Reconsider this habit — it might be too complex or irrelevant'
                        }
                    });
                }
            }

            // Check for low completion rate (less than 50% in last 14 days)
            const last14Days: string[] = [];
            for (let i = 0; i < 14; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                last14Days.push(d.toISOString().split('T')[0]);
            }

            const completedIn14 = habit.completedDates.filter(d => last14Days.includes(d)).length;
            const rate = (completedIn14 / 14) * 100;

            if (rate < 30 && habit.completedDates.length > 0) {
                issues.push({
                    habit,
                    category: habit.category || 'Продуктивность',
                    issue: 'low_completion',
                    severity: rate < 15 ? 'high' : 'medium',
                    message: {
                        ru: `"${habit.name}": ${Math.round(rate)}% выполнения`,
                        en: `"${habit.name}": ${Math.round(rate)}% completion`
                    },
                    suggestion: {
                        ru: 'Сделай привычку проще — "2 минуты" вместо "30 минут"',
                        en: 'Make it easier — "2 minutes" instead of "30 minutes"'
                    }
                });
            }
        });

        // Sort by severity
        return issues.sort((a, b) => {
            const severityOrder = { high: 0, medium: 1, low: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        }).slice(0, 3); // Top 3 bottlenecks
    }, [habits]);

    const topIdentity = identityProgress[0];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-textPrimary flex items-center gap-2">
                    <Sparkles className="text-brand" size={24} />
                    {t.title}
                </h2>
            </div>

            {/* Transformation Journey Timeline */}
            {topIdentity && (
                <div className="bg-gradient-to-br from-brand/10 via-purple-500/5 to-pink-500/5 rounded-3xl p-5 border border-brand/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">{topIdentity.emoji}</div>
                        <div>
                            <div className="text-sm text-textSecondary">{t.journey}</div>
                            <div className="text-lg font-bold text-textPrimary capitalize">
                                {topIdentity.identity[language]}
                            </div>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-2xl font-black text-brand">{t.level} {topIdentity.currentLevel}</div>
                            <div className="text-xs text-textSecondary">{topIdentity.currentLevelLabel}</div>
                        </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="relative mt-6 mb-2">
                        <div className="h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (topIdentity.currentStreak / 100) * 100)}%` }}
                            />
                        </div>

                        {/* Milestone markers */}
                        <div className="flex justify-between mt-2">
                            {[7, 21, 66, 100].map(day => (
                                <div
                                    key={day}
                                    className={`flex flex-col items-center ${topIdentity.currentStreak >= day ? 'text-brand' : 'text-textSecondary/50'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full border-2 ${topIdentity.currentStreak >= day
                                        ? 'bg-brand border-brand'
                                        : 'bg-surface border-textSecondary/30'
                                        }`} />
                                    <span className="text-[10px] mt-1 font-bold">{day}d</span>
                                    <span className="text-[8px] opacity-70">{t.milestones[day as keyof typeof t.milestones]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {topIdentity.nextMilestone && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                            <ArrowUp size={14} className="text-brand" />
                            <span className="text-textSecondary">
                                <span className="font-bold text-brand">{topIdentity.daysToNext}</span> {t.daysTo} {
                                    IDENTITY_MILESTONES.find(m => m.days === topIdentity.nextMilestone)?.[language === 'ru' ? 'labelRu' : 'labelEn']
                                }
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Active Identities - Horizontal Scroll */}
            <div>
                <h3 className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Award size={14} />
                    {t.activeIdentities}
                </h3>
                <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 scrollbar-hide">
                    {identityProgress.slice(0, 6).map((identity, idx) => (
                        <div
                            key={identity.category}
                            className={`flex-shrink-0 w-40 bg-surface/50 backdrop-blur-sm border border-borderSubtle rounded-2xl p-3 transition-all hover:border-brand/30 hover:bg-surface ${idx === 0 ? 'bg-gradient-to-br from-brand/10 to-transparent border-brand/30' : ''
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="text-xl">{identity.emoji}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-textPrimary capitalize line-clamp-2 leading-tight">
                                        {identity.identity[language]}
                                    </div>
                                    <div className="text-[10px] text-textSecondary mt-0.5">
                                        {identity.currentStreak} {t.days}
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-brand">Lv.{identity.currentLevel}</div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-1 bg-surfaceHighlight rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all"
                                    style={{ width: `${identity.progressPercent}%` }}
                                />
                            </div>
                            <div className="mt-1 text-[9px] text-textSecondary">
                                {identity.habitCount} {t.habits} • {identity.currentLevelLabel}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottleneck Alert */}
            {bottlenecks.length > 0 && (
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-3xl p-5">
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        {t.bottleneck}
                    </h3>

                    <div className="space-y-3">
                        {bottlenecks.map((issue, idx) => (
                            <div
                                key={`${issue.habit.id}-${idx}`}
                                className="bg-surface/50 backdrop-blur-sm rounded-xl p-3 border border-red-500/10"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${issue.severity === 'high' ? 'bg-red-500' :
                                        issue.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                        }`} />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-textPrimary">
                                            {issue.message[language]}
                                        </div>
                                        <div className="text-xs text-textSecondary mt-1 flex items-center gap-1">
                                            <Zap size={10} className="text-brand" />
                                            {issue.suggestion[language]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No bottlenecks */}
            {bottlenecks.length === 0 && habits.length > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl p-5 text-center">
                    <Star className="mx-auto text-green-500 mb-2" size={32} />
                    <div className="text-sm font-medium text-green-600">{t.noBottlenecks}</div>
                </div>
            )}
        </div>
    );
};

export default IdentityDashboard;
