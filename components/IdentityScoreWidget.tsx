import React, { useMemo } from 'react';
import { Crown, Zap, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { Habit, UserIdentity, IDENTITY_PRESETS } from '../types';
import { calculateDailyIdentityScore, countIdentityProofs, getIdentityMilestone, calculateWeeklyIdentityTrend } from '../utils/helpers';
import IdentityProgressRing from './IdentityProgressRing';

interface IdentityScoreWidgetProps {
    habits: Habit[];
    activeIdentity: UserIdentity | null;
    language: 'ru' | 'en';
    onOpenVision: () => void;
}

export const IdentityScoreWidget: React.FC<IdentityScoreWidgetProps> = ({
    habits,
    activeIdentity,
    language,
    onOpenVision
}) => {
    const preset = activeIdentity
        ? IDENTITY_PRESETS.find(p => p.id === activeIdentity.targetIdentity)
        : null;

    const identityScore = useMemo(() =>
        calculateDailyIdentityScore(habits, activeIdentity),
        [habits, activeIdentity]
    );

    const proofCount = useMemo(() =>
        countIdentityProofs(habits, activeIdentity),
        [habits, activeIdentity]
    );

    const weeklyTrend = useMemo(() =>
        calculateWeeklyIdentityTrend(habits, activeIdentity),
        [habits, activeIdentity]
    );

    const milestone = getIdentityMilestone(identityScore);
    const avgScore = weeklyTrend.reduce((a, b) => a + b, 0) / 7;
    const isImproving = weeklyTrend[6] > weeklyTrend[0];

    // Empty state
    if (!activeIdentity) {
        return (
            <div
                onClick={onOpenVision}
                className="group section-card relative overflow-hidden p-5 cursor-pointer active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 flex items-center justify-center">
                        <Sparkles size={24} className="text-brand" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-textPrimary group-hover:text-brand transition-colors">
                            {language === 'ru' ? 'Создай своё Видение' : 'Create Your Vision'}
                        </h3>
                        <p className="text-sm text-textSecondary mt-0.5">
                            {language === 'ru'
                                ? 'Определи, кем ты хочешь стать'
                                : 'Define who you want to become'
                            }
                        </p>
                    </div>

                    <ChevronRight
                        size={18}
                        className="text-textSecondary/50 group-hover:text-brand group-hover:translate-x-1 transition-all"
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onOpenVision}
            className="group section-card relative overflow-hidden p-4 cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                {/* Progress Ring */}
                <div className="flex-shrink-0">
                    <IdentityProgressRing
                        score={identityScore}
                        identity={activeIdentity}
                        size={72}
                        compact={true}
                        language={language}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Identity name */}
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-textPrimary truncate">
                            {preset?.label[language] || activeIdentity.targetIdentity}
                        </h3>
                        {identityScore >= 100 && (
                            <Crown size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                    </div>

                    {/* Milestone */}
                    <div
                        className="text-xs font-medium uppercase tracking-wide mb-2"
                        style={{ color: milestone.color }}
                    >
                        {milestone.emoji} {milestone.label[language]}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <Zap size={11} className="text-amber-500" />
                            <span className="text-textSecondary">
                                <span className="font-semibold text-textPrimary">{proofCount}</span>
                                {' '}{language === 'ru' ? 'доказательств' : 'proofs'}
                            </span>
                        </div>

                        <div className={`flex items-center gap-1 ${isImproving ? 'text-emerald-500' : 'text-textSecondary'}`}>
                            <TrendingUp size={11} className={isImproving ? '' : 'rotate-180'} />
                            <span className="font-medium">{Math.round(avgScore)}%</span>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                    size={18}
                    className="text-textSecondary/40 group-hover:text-brand group-hover:translate-x-1 transition-all flex-shrink-0"
                />
            </div>

            {/* Weekly chart */}
            <div className="mt-4 pt-3 border-t border-borderSubtle">
                <div className="flex items-end justify-between gap-1 h-5">
                    {weeklyTrend.map((score, i) => (
                        <div key={i} className="flex-1 relative">
                            <div
                                className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300"
                                style={{
                                    height: `${Math.max(score * 0.2, 2)}px`,
                                    backgroundColor: i === 6 ? milestone.color : 'var(--surface-highlight)',
                                    opacity: i === 6 ? 1 : 0.7
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-textSecondary/50">
                        {language === 'ru' ? '7 дней назад' : '7 days ago'}
                    </span>
                    <span className="text-[10px] text-textSecondary/50">
                        {language === 'ru' ? 'Сегодня' : 'Today'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default IdentityScoreWidget;
