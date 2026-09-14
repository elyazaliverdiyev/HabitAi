import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface ActivityRingsCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    language?: 'ru' | 'en';
}

// Apple Watch ring colors — always on dark background
const RING_CONFIGS = [
    {
        colorStart: '#FF0534',
        colorEnd: '#FF2D55',
        bgColor: '#3D0410'
    },
    {
        colorStart: '#2ECC09',
        colorEnd: '#C6F700',
        bgColor: '#142E00'
    },
    {
        colorStart: '#00CEBC',
        colorEnd: '#65E9FF',
        bgColor: '#002E38'
    }
];

function mixColor(hex1: string, hex2: string, ratio: number): string {
    const parse = (h: string) => {
        const c = h.replace('#', '');
        return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
    };
    const c1 = parse(hex1);
    const c2 = parse(hex2);
    const mix = c1.map((v, i) => Math.round(v + (c2[i] - v) * ratio));
    return `#${mix.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// Mini rings component for calendar cells — with overflow + dark bg
const MiniRings: React.FC<{
    movePercent: number;
    streakPercent: number;
    xpPercent: number;
    size?: number;
    isToday?: boolean;
}> = ({ movePercent, streakPercent, xpPercent, size = 36, isToday = false }) => {
    const viewBoxSize = 100;
    const strokeWidth = 14;
    const isDark = typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark');
    const uid = `mini-${size}-${Math.random().toString(36).slice(2, 6)}`;

    const rings = [
        { radius: 40, percent: movePercent, config: RING_CONFIGS[0] },
        { radius: 28, percent: streakPercent, config: RING_CONFIGS[1] },
        { radius: 16, percent: xpPercent, config: RING_CONFIGS[2] }
    ];

    const circ = (r: number) => 2 * Math.PI * r;
    const mainOffset = (r: number, pct: number) => {
        const c = circ(r);
        return c - (c * Math.min(Math.max(pct, 0), 100)) / 100;
    };
    const overflowOffset = (r: number, pct: number) => {
        const c = circ(r);
        if (pct <= 100) return c;
        return c - (c * Math.min(pct - 100, 100)) / 100;
    };

    return (
        <div
            className={`relative ${isToday ? 'ring-2 ring-red-500 rounded-full' : ''}`}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: isDark ? 'transparent' : '#1C1C1E',
            }}
        >
            <svg
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)', display: 'block' }}
            >
                <defs>
                    {rings.map((ring, idx) => (
                        <linearGradient
                            key={idx}
                            id={`${uid}-g-${idx}`}
                            gradientUnits="userSpaceOnUse"
                            x1={viewBoxSize / 2}
                            y1={viewBoxSize / 2 - ring.radius}
                            x2={viewBoxSize / 2 - ring.radius * 0.7}
                            y2={viewBoxSize / 2 + ring.radius * 0.7}
                        >
                            <stop offset="0%" stopColor={ring.config.colorStart} />
                            <stop offset="50%" stopColor={mixColor(ring.config.colorStart, ring.config.colorEnd, 0.5)} />
                            <stop offset="100%" stopColor={ring.config.colorEnd} />
                        </linearGradient>
                    ))}
                </defs>

                {rings.map((ring, idx) => {
                    const c = circ(ring.radius);
                    const hasOverflow = ring.percent > 100;

                    return (
                        <g key={idx}>
                            {/* Background track — always dark */}
                            <circle
                                cx={viewBoxSize / 2}
                                cy={viewBoxSize / 2}
                                r={ring.radius}
                                fill="none"
                                stroke={ring.config.bgColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                            />

                            {/* Main progress */}
                            <circle
                                cx={viewBoxSize / 2}
                                cy={viewBoxSize / 2}
                                r={ring.radius}
                                fill="none"
                                stroke={`url(#${uid}-g-${idx})`}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={c}
                                strokeDashoffset={mainOffset(ring.radius, ring.percent)}
                                style={{
                                    transition: 'stroke-dashoffset 0.5s ease-out',
                                    filter: ring.percent >= 100
                                        ? `drop-shadow(0 0 3px ${ring.config.colorStart}40)`
                                        : 'none'
                                }}
                            />

                            {/* Overflow arc */}
                            {hasOverflow && (
                                <circle
                                    cx={viewBoxSize / 2}
                                    cy={viewBoxSize / 2}
                                    r={ring.radius}
                                    fill="none"
                                    stroke={`url(#${uid}-g-${idx})`}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={c}
                                    strokeDashoffset={overflowOffset(ring.radius, ring.percent)}
                                    style={{
                                        transition: 'stroke-dashoffset 0.5s ease-out',
                                    }}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const ActivityRingsCalendarModal: React.FC<ActivityRingsCalendarModalProps> = ({
    isOpen,
    onClose,
    habits,
    language = 'ru'
}) => {
    const [currentMonth, setCurrentMonth] = useState(() => new Date());

    const t = {
        title: language === 'ru' ? 'Активность' : 'Activity',
        move: language === 'ru' ? 'Прогресс' : 'Progress',
        streak: language === 'ru' ? 'Стрики' : 'Streaks',
        xp: language === 'ru' ? 'Опыт' : 'XP',
        today: language === 'ru' ? 'Сегодня' : 'Today',
        perfect: language === 'ru' ? 'Идеальный день' : 'Perfect Day',
        monthNames: language === 'ru'
            ? ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        days: language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };

    // Calculate streak length for a habit at a specific date
    const getStreakAtDate = (habit: Habit, dateStr: string): number => {
        const sortedDates = [...(habit.completedDates || [])].sort();
        if (!sortedDates.includes(dateStr)) return 0;

        let streak = 1;
        let checkDate = new Date(dateStr);
        while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const prevStr = checkDate.toISOString().split('T')[0];
            if (sortedDates.includes(prevStr)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    // Calculate ring data with overflow formulas (matching App.tsx)
    const getRingsForDate = (dateStr: string): { move: number; streak: number; xp: number } => {
        const activeHabits = habits.filter(h => !h.archived);
        if (!activeHabits.length) return { move: 0, streak: 0, xp: 0 };

        const totalHabits = activeHabits.length;
        const completedOnDate = activeHabits.filter(h =>
            h.completedDates?.includes(dateStr)
        ).length;

        // Move: base + streak bonus when all completed
        let move = totalHabits > 0 ? (completedOnDate / totalHabits) * 100 : 0;
        if (move >= 100 && totalHabits > 0) {
            const streakBonus = activeHabits.filter(h => getStreakAtDate(h, dateStr) >= 2).length;
            move += streakBonus * 15;
        }

        // Streak: average streak length / 5-day target
        const streaks = activeHabits.map(h => getStreakAtDate(h, dateStr));
        const avgStreak = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
        const streak = Math.round((avgStreak / 5) * 100);

        // XP: based on completion ratio + bonus when all done
        let xp = totalHabits > 0 ? (completedOnDate / totalHabits) * 100 : 0;
        if (move >= 100 && totalHabits > 0) {
            const activeStreakCount = activeHabits.filter(h => getStreakAtDate(h, dateStr) > 0).length;
            xp += 30 + activeStreakCount * 5;
        }

        return { move, streak, xp };
    };

    // Generate calendar days for current month
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;

        const days: { date: Date | null; rings: { move: number; streak: number; xp: number } }[] = [];

        for (let i = 0; i < startOffset; i++) {
            days.push({ date: null, rings: { move: 0, streak: 0, xp: 0 } });
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const dateStr = date.toISOString().split('T')[0];
            days.push({ date, rings: getRingsForDate(dateStr) });
        }

        return days;
    }, [currentMonth, habits]);

    // Today's stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRings = getRingsForDate(todayStr);
    const perfectDaysCount = useMemo(() => {
        return calendarData.filter(d => d.date && d.rings.move >= 100).length;
    }, [calendarData]);

    const prevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-3xl w-full max-w-md max-h-[90vh] overflow-auto border border-borderSubtle shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-borderSubtle">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-red-500" size={20} />
                        <span className="font-bold text-textPrimary">{t.title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-brand/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Today Summary */}
                <div className="p-4 border-b border-borderSubtle">
                    <div className="flex items-center gap-4">
                        <MiniRings
                            movePercent={todayRings.move}
                            streakPercent={todayRings.streak}
                            xpPercent={todayRings.xp}
                            size={80}
                        />
                        <div className="flex-1">
                            <div className="text-xs text-textSecondary uppercase mb-1">{t.today}</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF0534] to-[#FF2D55]" />
                                    <span className="text-textSecondary text-sm">{t.move}</span>
                                    <span className={`font-bold ml-auto ${todayRings.move >= 100 ? 'text-[#FF0534]' : 'text-textPrimary'}`}>
                                        {Math.round(todayRings.move)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#2ECC09] to-[#C6F700]" />
                                    <span className="text-textSecondary text-sm">{t.streak}</span>
                                    <span className={`font-bold ml-auto ${todayRings.streak >= 100 ? 'text-[#2ECC09]' : 'text-textPrimary'}`}>
                                        {Math.round(todayRings.streak)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#00CEBC] to-[#65E9FF]" />
                                    <span className="text-textSecondary text-sm">{t.xp}</span>
                                    <span className={`font-bold ml-auto ${todayRings.xp >= 100 ? 'text-[#00CEBC]' : 'text-textPrimary'}`}>
                                        {Math.round(todayRings.xp)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={prevMonth}
                        className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-brand/10 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-red-500 font-bold text-lg">
                        {t.monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-brand/10 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1 px-4 pb-2">
                    {t.days.map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-textSecondary font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 px-4 pb-4">
                    {calendarData.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center py-1">
                            {item.date ? (
                                <>
                                    <span className={`text-[10px] mb-0.5 ${isToday(item.date) ? 'text-red-500 font-bold' : 'text-textSecondary'}`}>
                                        {item.date.getDate()}
                                    </span>
                                    <MiniRings
                                        movePercent={item.rings.move}
                                        streakPercent={item.rings.streak}
                                        xpPercent={item.rings.xp}
                                        size={36}
                                        isToday={isToday(item.date)}
                                    />
                                </>
                            ) : (
                                <div className="w-9 h-9" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Perfect Days Counter */}
                <div className="px-4 pb-4">
                    <div className="bg-surfaceHighlight rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0534] to-[#FF2D55] flex items-center justify-center text-white font-bold">
                            {perfectDaysCount}
                        </div>
                        <div>
                            <div className="text-textPrimary font-medium">{t.perfect}</div>
                            <div className="text-textSecondary text-xs">{t.monthNames[currentMonth.getMonth()]}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityRingsCalendarModal;
