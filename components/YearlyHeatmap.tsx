import React, { useMemo, useState } from 'react';
import { Habit } from '../types';
import { ChevronLeft, ChevronRight, Flame, Calendar } from 'lucide-react';

// Helper to get local date string YYYY-MM-DD
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface YearlyHeatmapProps {
    habits: Habit[];
    language: 'ru' | 'en';
    year?: number;
}

const MONTHS = {
    ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

const DAYS = {
    ru: ['Пн', '', 'Ср', '', 'Пт', '', 'Вс'],
    en: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
};

// Get color intensity based on completion count
const getIntensity = (count: number, max: number): string => {
    if (count === 0) return 'bg-surfaceHighlight';
    const ratio = count / Math.max(max, 1);
    if (ratio >= 0.8) return 'bg-green-500';
    if (ratio >= 0.6) return 'bg-green-400';
    if (ratio >= 0.4) return 'bg-green-300';
    if (ratio >= 0.2) return 'bg-green-200';
    return 'bg-green-100';
};

const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({
    habits,
    language,
    year: initialYear
}) => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(initialYear || currentYear);
    const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    const t = {
        contributions: language === 'ru' ? 'выполнений' : 'completions',
        lessActive: language === 'ru' ? 'Меньше' : 'Less',
        moreActive: language === 'ru' ? 'Больше' : 'More',
        totalYear: language === 'ru' ? 'Всего за год' : 'Total this year',
        bestStreak: language === 'ru' ? 'Лучший streak' : 'Best streak',
        currentStreak: language === 'ru' ? 'Текущий streak' : 'Current streak',
        days: language === 'ru' ? 'дней' : 'days',
        noActivity: language === 'ru' ? 'Нет активности' : 'No activity',
    };

    // Calculate data for the year
    const { weeks, stats, maxCount } = useMemo(() => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        // Adjust to start from Monday
        const firstMonday = new Date(startDate);
        while (firstMonday.getDay() !== 1) {
            firstMonday.setDate(firstMonday.getDate() - 1);
        }

        // Build completion map
        const completionMap: Record<string, number> = {};
        habits.forEach(habit => {
            habit.completedDates.forEach(dateStr => {
                if (dateStr.startsWith(String(year))) {
                    completionMap[dateStr] = (completionMap[dateStr] || 0) + 1;
                }
            });
        });

        // Build weeks array
        const weeksData: { date: Date; count: number; dateStr: string }[][] = [];
        let currentDate = new Date(firstMonday);
        let currentWeek: { date: Date; count: number; dateStr: string }[] = [];
        let maxC = 0;
        let totalCompletions = 0;

        while (currentDate <= endDate || currentWeek.length > 0) {
            const dateStr = getLocalDateStr(currentDate);
            const count = completionMap[dateStr] || 0;

            if (currentDate.getFullYear() === year) {
                maxC = Math.max(maxC, count);
                totalCompletions += count;
            }

            currentWeek.push({
                date: new Date(currentDate),
                count: currentDate.getFullYear() === year ? count : -1, // -1 for out of year
                dateStr
            });

            if (currentWeek.length === 7) {
                weeksData.push(currentWeek);
                currentWeek = [];
            }

            currentDate.setDate(currentDate.getDate() + 1);

            if (currentDate > endDate && currentWeek.length === 0) break;
        }

        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let streak = 0;
        const today = new Date();
        const todayStr = getLocalDateStr(today);

        // Check backwards from today for current streak
        const checkDate = new Date(today);
        while (true) {
            const checkStr = getLocalDateStr(checkDate);
            if (completionMap[checkStr] && completionMap[checkStr] > 0) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (checkStr === todayStr) {
                // Today not done yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Find best streak in year
        const sortedDates = Object.keys(completionMap).filter(d => d.startsWith(String(year))).sort();
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0 || dateDiff(sortedDates[i - 1], sortedDates[i]) === 1) {
                streak++;
                bestStreak = Math.max(bestStreak, streak);
            } else {
                streak = 1;
            }
        }

        return {
            weeks: weeksData,
            stats: {
                total: totalCompletions,
                currentStreak,
                bestStreak
            },
            maxCount: maxC
        };
    }, [habits, year]);

    // Helper to calculate date difference in days
    function dateDiff(date1: string, date2: string): number {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Get month labels positions
    const monthLabels = useMemo(() => {
        const labels: { month: number; weekIndex: number }[] = [];
        let lastMonth = -1;

        weeks.forEach((week, weekIndex) => {
            const firstDayOfWeek = week.find(d => d.count >= 0);
            if (firstDayOfWeek) {
                const month = firstDayOfWeek.date.getMonth();
                if (month !== lastMonth) {
                    labels.push({ month, weekIndex });
                    lastMonth = month;
                }
            }
        });

        return labels;
    }, [weeks]);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-brand" />
                    <h3 className="font-bold text-lg text-textPrimary">
                        {stats.total.toLocaleString()} {t.contributions}
                    </h3>
                </div>

                {/* Year selector */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setYear(y => y - 1)}
                        className="p-1.5 rounded-lg hover:bg-surfaceHighlight transition-colors text-textSecondary hover:text-textPrimary"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="font-bold text-textPrimary min-w-[60px] text-center">{year}</span>
                    <button
                        onClick={() => setYear(y => Math.min(y + 1, currentYear))}
                        disabled={year >= currentYear}
                        className="p-1.5 rounded-lg hover:bg-surfaceHighlight transition-colors text-textSecondary hover:text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-surface rounded-xl p-3 border border-borderSubtle">
                    <div className="text-2xl font-black text-brand">{stats.total}</div>
                    <div className="text-xs text-textSecondary">{t.totalYear}</div>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-borderSubtle">
                    <div className="text-2xl font-black text-orange-500 flex items-center gap-1">
                        <Flame size={20} />
                        {stats.currentStreak}
                    </div>
                    <div className="text-xs text-textSecondary">{t.currentStreak}</div>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-borderSubtle">
                    <div className="text-2xl font-black text-green-500">{stats.bestStreak}</div>
                    <div className="text-xs text-textSecondary">{t.bestStreak}</div>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="relative overflow-x-auto pb-4">
                {/* Month labels */}
                <div className="flex mb-1 ml-8" style={{ gap: '3px' }}>
                    {monthLabels.map(({ month, weekIndex }, i) => (
                        <div
                            key={i}
                            className="text-[10px] text-textSecondary font-medium"
                            style={{
                                position: 'absolute',
                                left: `${32 + weekIndex * 13}px`
                            }}
                        >
                            {MONTHS[language][month]}
                        </div>
                    ))}
                </div>

                <div className="flex mt-4">
                    {/* Day labels */}
                    <div className="flex flex-col mr-2" style={{ gap: '3px' }}>
                        {DAYS[language].map((day, i) => (
                            <div
                                key={i}
                                className="text-[9px] text-textSecondary font-medium h-[10px] flex items-center"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex" style={{ gap: '3px' }}>
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col" style={{ gap: '3px' }}>
                                {week.map((day, dayIndex) => {
                                    const isOutOfYear = day.count === -1;
                                    const isToday = day.dateStr === getLocalDateStr(new Date());

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`
                        w-[10px] h-[10px] rounded-sm transition-all duration-200 cursor-pointer
                        ${isOutOfYear ? 'bg-transparent' : getIntensity(day.count, maxCount)}
                        ${isToday ? 'ring-2 ring-brand ring-offset-1 ring-offset-background' : ''}
                        hover:scale-150 hover:z-10
                      `}
                                            onMouseEnter={(e) => {
                                                if (!isOutOfYear) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredDay({
                                                        date: day.dateStr,
                                                        count: day.count,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top
                                                    });
                                                }
                                            }}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="text-[10px] text-textSecondary">{t.lessActive}</span>
                    <div className="flex gap-[2px]">
                        <div className="w-[10px] h-[10px] rounded-sm bg-surfaceHighlight" />
                        <div className="w-[10px] h-[10px] rounded-sm bg-green-100" />
                        <div className="w-[10px] h-[10px] rounded-sm bg-green-200" />
                        <div className="w-[10px] h-[10px] rounded-sm bg-green-300" />
                        <div className="w-[10px] h-[10px] rounded-sm bg-green-400" />
                        <div className="w-[10px] h-[10px] rounded-sm bg-green-500" />
                    </div>
                    <span className="text-[10px] text-textSecondary">{t.moreActive}</span>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 px-3 py-2 bg-surface border border-borderSubtle rounded-lg shadow-xl text-xs pointer-events-none animate-fadeIn"
                    style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y - 40,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="font-bold text-textPrimary">
                        {hoveredDay.count > 0
                            ? `${hoveredDay.count} ${t.contributions}`
                            : t.noActivity
                        }
                    </div>
                    <div className="text-textSecondary">
                        {new Date(hoveredDay.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YearlyHeatmap;
