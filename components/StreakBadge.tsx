import React from 'react';
import { Flame } from 'lucide-react';
import { getCurrentStreak, getStreakMilestone, Habit } from '../types';

interface StreakBadgeProps {
    habit: Habit;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    language?: 'ru' | 'en';
}

const StreakBadge: React.FC<StreakBadgeProps> = ({
    habit,
    size = 'md',
    showLabel = false,
    language = 'ru'
}) => {
    const streak = getCurrentStreak(habit);

    if (streak < 1) return null;

    const milestone = getStreakMilestone(streak);

    // Size configurations
    const sizeConfig = {
        xs: { icon: 10, text: 'text-[9px]', padding: 'px-1 py-0.5', gap: 'gap-0.5' },
        sm: { icon: 12, text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-0.5' },
        md: { icon: 14, text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1' },
        lg: { icon: 18, text: 'text-sm', padding: 'px-3 py-1.5', gap: 'gap-1.5' },
    };

    const config = sizeConfig[size];
    const color = milestone?.color || '#f97316';
    const hasGlow = milestone?.glow || false;

    // Dynamic glow class based on streak
    const getGlowClass = () => {
        if (streak >= 100) return 'streak-glow-100';
        if (streak >= 30) return 'streak-glow-30';
        if (streak >= 7) return 'streak-glow-7';
        return '';
    };

    return (
        <div
            className={`
        inline-flex items-center ${config.gap} ${config.padding}
        rounded-full font-bold ${config.text}
        transition-all duration-300
        ${hasGlow ? 'shadow-lg' : ''}
        ${getGlowClass()}
      `}
            style={{
                backgroundColor: `${color}20`,
                color: color,
                boxShadow: hasGlow && streak < 7 ? `0 0 12px ${color}50` : undefined,
            }}
        >
            <Flame
                size={config.icon}
                className={streak >= 7 ? 'animate-pulse' : ''}
                fill={streak >= 7 ? color : 'none'}
            />
            <span className="counter-value">{streak}</span>
            {showLabel && milestone && (
                <span className="opacity-80 font-medium">
                    {milestone.label[language]}
                </span>
            )}
        </div>
    );
};

export default StreakBadge;
