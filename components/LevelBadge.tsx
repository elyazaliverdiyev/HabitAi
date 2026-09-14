import React from 'react';
import { getXPProgress, getLevelTitle } from '../types';

interface LevelBadgeProps {
    totalXP: number;
    language?: 'ru' | 'en';
    size?: 'sm' | 'md' | 'lg';
    showProgress?: boolean;
    showXP?: boolean;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({
    totalXP,
    language = 'en',
    size = 'md',
    showProgress = true,
    showXP = true
}) => {
    const xpProgress = getXPProgress(totalXP);
    const levelTitle = getLevelTitle(xpProgress.level, language as 'ru' | 'en');

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const progressHeight = {
        sm: 'h-1',
        md: 'h-1.5',
        lg: 'h-2'
    };

    const badgeSize = {
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8 text-lg',
        lg: 'w-10 h-10 text-xl'
    };

    return (
        <div className="flex items-center gap-2">
            {/* Level Circle */}
            <div
                className={`${badgeSize[size]} rounded-full bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center font-bold text-white shadow-lg relative`}
                style={{
                    boxShadow: '0 0 12px var(--brand), 0 0 24px var(--brand-muted)',
                }}
            >
                <span className="relative z-10">{xpProgress.level}</span>
                {/* Glow effect - subtle, no pulse */}
                <div
                    className="absolute inset-0 rounded-full opacity-30"
                    style={{
                        background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)',
                    }}
                />
            </div>

            {/* Level Info */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={`font-semibold text-textPrimary ${sizeClasses[size]}`}>
                        {levelTitle.emoji} {levelTitle.label}
                    </span>
                </div>

                {showXP && (
                    <span className={`text-textSecondary ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                        {xpProgress.currentXP.toLocaleString()} / {xpProgress.xpForNextLevel.toLocaleString()} XP
                    </span>
                )}

                {/* XP Progress Bar */}
                {showProgress && (
                    <div className={`w-full bg-surfaceHighlight rounded-full ${progressHeight[size]} mt-1 overflow-hidden`}>
                        <div
                            className={`${progressHeight[size]} rounded-full bg-gradient-to-r from-brand to-brand/80 transition-all duration-500 relative`}
                            style={{ width: `${xpProgress.progress * 100}%` }}
                        >
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                style={{ backgroundSize: '200% 100%' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LevelBadge;
