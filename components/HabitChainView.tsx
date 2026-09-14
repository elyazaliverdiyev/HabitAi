import React, { useState } from 'react';
import { Habit } from '../types';
import Icon from './Icons';
import { CheckCircle2, Circle, ChevronRight, Zap, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Chain color palette — each chain gets a unique accent
const CHAIN_COLORS = [
    { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },  // amber
    { border: '#6366f1', bg: 'rgba(99,102,241,0.08)', text: '#818cf8', glow: 'rgba(99,102,241,0.2)' },   // indigo
    { border: '#10b981', bg: 'rgba(16,185,129,0.08)', text: '#34d399', glow: 'rgba(16,185,129,0.2)' },   // emerald
    { border: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  text: '#fb7185', glow: 'rgba(244,63,94,0.2)' },    // rose
    { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', text: '#a78bfa', glow: 'rgba(139,92,246,0.2)' },   // violet
    { border: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  text: '#22d3ee', glow: 'rgba(6,182,212,0.2)' },    // cyan
];

// Global counter to assign colors to chains
let colorIndex = 0;
const chainColorMap: Record<string, typeof CHAIN_COLORS[0]> = {};

const getChainColor = (chainName: string) => {
    if (!chainColorMap[chainName]) {
        chainColorMap[chainName] = CHAIN_COLORS[colorIndex % CHAIN_COLORS.length];
        colorIndex++;
    }
    return chainColorMap[chainName];
};

interface HabitChainViewProps {
    chainName: string;
    habits: Habit[];
    selectedDate: Date;
    onToggle: (habitId: string, dateStr: string) => void;
    onHabitClick: (habit: Habit) => void;
    language?: 'ru' | 'en';
    colorAccent?: string;
}

const HabitChainView: React.FC<HabitChainViewProps> = ({
    chainName,
    habits,
    selectedDate,
    onToggle,
    onHabitClick,
    language = 'ru',
}) => {
    const dateStr = getLocalDateString(selectedDate);
    const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
    const totalCount = habits.length;
    const allDone = completedCount === totalCount && totalCount > 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const [justToggled, setJustToggled] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(!allDone); // Auto-collapse if all done

    const accent = getChainColor(chainName);

    const handleToggle = (habitId: string) => {
        setJustToggled(habitId);
        onToggle(habitId, dateStr);
        setTimeout(() => setJustToggled(null), 600);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionContainer}
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                background: 'var(--surface)',
                border: `1px solid ${allDone ? '#22c55e33' : 'var(--border-subtle)'}`,
                boxShadow: allDone
                    ? '0 4px 24px rgba(34,197,94,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
            }}
        >
            {/* Colored left accent border */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{
                    background: allDone
                        ? 'linear-gradient(180deg, #4ade80, #22c55e)'
                        : `linear-gradient(180deg, ${accent.border}, ${accent.border}88)`,
                    boxShadow: `0 0 12px ${allDone ? 'rgba(34,197,94,0.4)' : accent.glow}`,
                }}
            />

            {/* Header */}
            <div className="pl-5 pr-4 pt-3 pb-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: allDone ? 'rgba(34,197,94,0.15)' : accent.bg }}
                        >
                            {allDone
                                ? <Zap size={12} className="text-green-500" />
                                : <Link2 size={12} style={{ color: accent.text }} />
                            }
                        </div>
                        <h3
                            className="text-[11px] font-black uppercase tracking-[0.15em]"
                            style={{ color: allDone ? '#4ade80' : 'var(--text-primary)' }}
                        >
                            {chainName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Counter badge */}
                        <div
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: allDone ? 'rgba(34,197,94,0.15)' : 'var(--surface-highlight)',
                                color: allDone ? '#4ade80' : 'var(--text-secondary)',
                            }}
                        >
                            <span>{completedCount}/{totalCount}</span>
                            {allDone && <span>✨</span>}
                        </div>
                        
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className="text-textSecondary"
                        >
                            <ChevronRight size={16} />
                        </motion.div>
                    </div>
                </div>

                {/* Progress bar */}
                <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--surface-highlight)' }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={motionSheet}
                        style={{
                            background: allDone
                                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                : `linear-gradient(90deg, ${accent.border}, ${accent.border}88)`,
                        }}
                    />
                </div>
            </div>

            {/* Accordion Content (Habit rows) */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={motionContainer}
                        className="overflow-hidden"
                    >
                        <div className="pl-5 pr-2 pb-2">
                            {habits.map((habit, index) => {
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isLast = index === habits.length - 1;
                                const wasJustToggled = justToggled === habit.id;

                                return (
                                    <div key={habit.id} className="relative">
                                        {/* Subtle divider */}
                                        {!isLast && (
                                            <div
                                                className="absolute bottom-0 left-8 right-3"
                                                style={{ height: '1px', backgroundColor: 'var(--border-subtle)', opacity: 0.5 }}
                                            />
                                        )}

                                        <div
                                            className="flex items-center gap-2.5 py-2.5 cursor-default"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Animated checkbox */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleToggle(habit.id); }}
                                                className="shrink-0 transition-transform active:scale-90"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {isCompleted ? (
                                                        <motion.div
                                                            key="checked"
                                                            initial={wasJustToggled ? { scale: 0, rotate: -180 } : false}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={motionCelebrate}
                                                        >
                                                            <CheckCircle2
                                                                size={22}
                                                                style={{ color: habit.color || '#22c55e' }}
                                                                className="drop-shadow-sm"
                                                            />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="unchecked"
                                                            initial={wasJustToggled ? { scale: 1.3 } : false}
                                                            animate={{ scale: 1 }}
                                                        >
                                                            <Circle
                                                                size={22}
                                                                className="transition-colors"
                                                                style={{ color: 'var(--text-secondary)', opacity: 0.35 }}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>

                                            {/* Icon */}
                                            {habit.icon && (
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                                                    style={{
                                                        backgroundColor: isCompleted
                                                            ? 'rgba(34,197,94,0.10)'
                                                            : accent.bg,
                                                    }}
                                                >
                                                    <Icon
                                                        name={habit.icon}
                                                        size={14}
                                                        className="transition-all"
                                                        style={{ color: isCompleted ? '#4ade80' : accent.text } as React.CSSProperties}
                                                    />
                                                </div>
                                            )}

                                            {/* Name */}
                                            <span
                                                className="flex-1 text-sm font-semibold truncate transition-all"
                                                style={{
                                                    color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                                    opacity: isCompleted ? 0.6 : 1,
                                                }}
                                            >
                                                {habit.name}
                                            </span>

                                            {/* Detail arrow */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onHabitClick(habit); }}
                                                className="p-1.5 rounded-lg transition-all hover:bg-surface-highlight shrink-0 opacity-30 hover:opacity-80"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* All done celebration */}
            <AnimatePresence>
                {allDone && (
                    <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={motionCelebrate}
                        className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-20"
                        style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
                    >
                        <span className="text-xs">🎉</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default React.memo(HabitChainView);
