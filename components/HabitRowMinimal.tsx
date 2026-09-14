import React from 'react';
import { motion } from 'framer-motion';
import { Habit, getCurrentStreak } from '../types';
import Icon from './Icons';
import { Check, Flame, Clock } from 'lucide-react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface HabitRowMinimalProps {
    habit: Habit;
    selectedDate: Date;
    onToggleDate: (date: string, e?: React.MouseEvent | React.TouchEvent) => void;
    onClick: () => void;
    language?: 'ru' | 'en';
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HabitRowMinimal: React.FC<HabitRowMinimalProps> = ({
    habit,
    selectedDate,
    onToggleDate,
    onClick,
    language = 'en'
}) => {
    const targetDateStr = getLocalDateString(selectedDate);
    const isCompleted = habit.completedDates.includes(targetDateStr);
    const streak = getCurrentStreak(habit);

    // Format duration/time info
    const getSubtitle = () => {
        const parts: string[] = [];
        if (habit.targetCount && habit.targetCount > 1) {
            parts.push(`${habit.targetCount}${habit.unit === 'minutes' ? ' min' : 'x'}`);
        }
        if (habit.time) {
            parts.push(habit.time);
        }
        return parts.length > 0 ? parts.join(' · ') : null;
    };

    const subtitle = getSubtitle();

    return (
        <motion.div
            className={`
                flex items-center gap-3 p-3 rounded-xl transition-colors
                ${isCompleted
                    ? 'bg-brand/10 border border-brand/20'
                    : 'bg-surface border border-borderSubtle hover:border-brand/20'
                }
                cursor-pointer
            `}
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            transition={motionControl}
            layout
        >
            {/* Color Dot / Icon */}
            <motion.div
                className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${isCompleted ? 'opacity-80' : ''}
                `}
                style={{ backgroundColor: habit.color }}
                animate={{ scale: isCompleted ? 0.95 : 1 }}
                transition={{ type: "spring", damping: 20 }}
            >
                <Icon name={habit.icon} size={18} className="text-white" />
            </motion.div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
                <h3 className={`
                    font-semibold text-sm truncate transition-colors
                    ${isCompleted ? 'text-textSecondary line-through' : 'text-textPrimary'}
                `}>
                    {habit.isKeystone && <span className="text-amber-500 mr-1">🔑</span>}
                    {habit.name}
                </h3>

                {(subtitle || streak > 0) && (
                    <div className="flex items-center gap-2 mt-0.5">
                        {subtitle && (
                            <span className="text-xs text-textSecondary flex items-center gap-1">
                                {habit.time && <Clock size={10} className="opacity-60" />}
                                {subtitle}
                            </span>
                        )}
                        {streak > 0 && (
                            <motion.span
                                className="text-xs font-bold text-orange-500 flex items-center gap-0.5"
                                animate={{
                                    scale: streak >= 7 ? [1, 1.1, 1] : 1
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: streak >= 7 ? Infinity : 0,
                                    repeatDelay: 2
                                }}
                            >
                                <Flame size={10} />
                                {streak}
                            </motion.span>
                        )}
                    </div>
                )}
            </div>

            {/* Completion Button - Optimized for mobile performance */}
            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleDate(targetDateStr, e);
                }}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform
                    ${isCompleted
                        ? 'bg-brand text-white shadow-md shadow-brand/20 scale-105'
                        : 'border text-textSecondary hover:border-brand/50 hover:text-brand'
                    }
                `}
                style={!isCompleted ? {
                    backgroundColor: 'color-mix(in srgb, var(--brand) 20%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--brand) 35%, transparent)',
                    boxShadow: '0 0 8px color-mix(in srgb, var(--brand) 30%, transparent)',
                } : undefined}
                whileTap={{ scale: 0.9 }}
            >
                <Check size={16} strokeWidth={3} className={isCompleted ? 'opacity-100' : 'opacity-40'} />
            </motion.button>
        </motion.div>
    );
};

export default HabitRowMinimal;
