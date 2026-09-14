import React, { useMemo } from 'react';
import { DailyChallenge } from '../types';
import { Zap, Trophy, ChevronRight } from 'lucide-react';

interface DailyChallengesProps {
    challenges: DailyChallenge[];
    language: 'ru' | 'en';
    comboCount?: number;
    comboInfo?: { multiplier: number; label: { ru: string; en: string }; emoji: string } | null;
}

const t = {
    ru: {
        title: 'Дневные вызовы',
        subtitle: 'Заработай бонусный XP',
        completed: 'Выполнено!',
        xp: 'XP',
        combo: 'Комбо активно',
        allDone: 'Все вызовы выполнены! 🎉',
    },
    en: {
        title: 'Daily Challenges',
        subtitle: 'Earn bonus XP',
        completed: 'Completed!',
        xp: 'XP',
        combo: 'Combo active',
        allDone: 'All challenges done! 🎉',
    }
};

const DailyChallenges: React.FC<DailyChallengesProps> = ({
    challenges,
    language,
    comboCount = 0,
    comboInfo
}) => {
    const lang = t[language];
    const completedCount = useMemo(() => challenges.filter(c => c.completed).length, [challenges]);
    const allDone = completedCount === challenges.length && challenges.length > 0;

    return (
        <div className="rounded-2xl bg-surface border border-divider overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surfaceHighlight">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                        <Trophy size={16} className="text-brand" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-primary">{lang.title}</h3>
                        <p className="text-xs text-secondary">{lang.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-brand">
                    <span>{completedCount}/{challenges.length}</span>
                </div>
            </div>

            {/* Combo indicator */}
            {comboInfo && (
                <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <span className="text-lg">{comboInfo.emoji}</span>
                    <span className="font-bold text-sm text-amber-500">
                        {comboInfo.label[language]}
                    </span>
                    <span className="text-xs text-secondary ml-auto">
                        x{comboInfo.multiplier} {lang.xp}
                    </span>
                </div>
            )}

            {/* Challenges list */}
            <div className="px-4 py-3 space-y-2">
                {challenges.map(challenge => {
                    const progress = Math.min(1, challenge.currentCount / Math.max(1, challenge.targetCount));
                    return (
                        <div
                            key={challenge.id}
                            className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${challenge.completed
                                    ? 'bg-brand/10 border border-brand/20'
                                    : 'bg-surfaceHighlight border border-transparent hover:border-divider'
                                }`}
                        >
                            {/* Emoji */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${challenge.completed ? 'bg-brand/20' : 'bg-surface'
                                }`}>
                                {challenge.completed ? '✅' : challenge.emoji}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`font-semibold text-sm truncate ${challenge.completed ? 'text-brand line-through' : 'text-primary'
                                        }`}>
                                        {challenge.title[language]}
                                    </p>
                                </div>
                                <p className="text-xs text-secondary truncate">
                                    {challenge.completed ? lang.completed : challenge.description[language]}
                                </p>

                                {/* Progress bar */}
                                {!challenge.completed && (
                                    <div className="mt-1.5 h-1.5 rounded-full bg-surface overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
                                            style={{ width: `${progress * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* XP reward */}
                            <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${challenge.completed
                                    ? 'bg-brand/20 text-brand'
                                    : 'bg-surface text-secondary'
                                }`}>
                                <Zap size={12} />
                                +{challenge.xpReward}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All done celebration */}
            {allDone && (
                <div className="px-4 pb-4 pt-1">
                    <div className="text-center py-3 rounded-xl bg-gradient-to-r from-brand/10 to-amber-500/10 border border-brand/20">
                        <p className="text-sm font-bold text-brand">{lang.allDone}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyChallenges;
