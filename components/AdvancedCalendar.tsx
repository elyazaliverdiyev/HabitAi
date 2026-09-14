
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Habit } from '../types';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    AlignJustify, Columns, LayoutGrid, Check, GripHorizontal, PanelRightOpen
} from 'lucide-react';
import Icon from './Icons';
import { DndContext, useDraggable, useSensor, useSensors, PointerSensor, TouchSensor, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CalendarSidebar from './CalendarSidebar';

interface AdvancedCalendarProps {
    habits: Habit[];
    onToggleHabit: (habitId: string, date: string, e?: React.MouseEvent | React.TouchEvent) => void;
    language?: 'ru' | 'en';
    onUpdateHabit?: (id: string, updates: Partial<Habit>) => void;
    onBatchUpdateHabits?: (updates: { id: string, data: Partial<Habit> }[]) => void;
}

type CalendarView = 'month' | 'week' | '3day' | 'day' | 'agenda';

// Constants
const PIXELS_PER_MINUTE = 1.5; // 60 min = 90px
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Minutes to HH:MM
const minutesToTime = (totalMinutes: number) => {
    let m = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

interface DraggableHabitEventProps {
    habit: Habit;
    dayStr: string;
    top: number;
    height: number;
    isCompleted: boolean;
    onToggle: (e: React.MouseEvent | React.TouchEvent) => void;
    onResizeEnd: (habit: Habit, newTop: number, newHeight: number) => void;
}

// --- Draggable Habit Event Component with Resize ---
const DraggableHabitEvent: React.FC<DraggableHabitEventProps> = ({
    habit,
    dayStr,
    top,
    height,
    isCompleted,
    onToggle,
    onResizeEnd
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `event-${habit.id}-${dayStr}`,
        data: { habit, dayStr, originalTop: top }
    });

    // Local state for smooth visual updates during resize
    const [localHeight, setLocalHeight] = useState(height);
    const [localTop, setLocalTop] = useState(top);
    const [isResizing, setIsResizing] = useState(false);

    // Resize refs
    const resizingRef = useRef<'top' | 'bottom' | null>(null);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const startTopRef = useRef(0);

    // Sync prop height/top to local state unless resizing or dragging
    useEffect(() => {
        if (!isResizing && !isDragging) {
            setLocalHeight(height);
            setLocalTop(top);
        }
    }, [height, top, isDragging, isResizing]);

    const handleResizeStart = (e: React.PointerEvent, direction: 'top' | 'bottom') => {
        e.stopPropagation(); // Prevent drag start
        e.preventDefault(); // Prevent text selection

        setIsResizing(true);
        resizingRef.current = direction;
        startYRef.current = e.clientY;
        startHeightRef.current = localHeight;
        startTopRef.current = localTop;

        // Capture pointer to track movement even if mouse leaves the div
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e: React.PointerEvent) => {
        if (!isResizing || !resizingRef.current) return;
        e.stopPropagation();

        const deltaY = e.clientY - startYRef.current;

        if (resizingRef.current === 'bottom') {
            const rawHeight = startHeightRef.current + deltaY;
            const newH = Math.max(15, rawHeight);
            setLocalHeight(newH);
        } else {
            const maxDelta = startHeightRef.current - 15;
            const effectiveDelta = Math.min(deltaY, maxDelta);

            const newT = Math.max(0, startTopRef.current + effectiveDelta);
            const newH = Math.max(15, startHeightRef.current - (newT - startTopRef.current));

            setLocalTop(newT);
            setLocalHeight(newH);
        }
    };

    const handleResizeEnd = (e: React.PointerEvent) => {
        if (!isResizing) return;
        e.stopPropagation();

        setIsResizing(false);
        resizingRef.current = null;
        (e.target as Element).releasePointerCapture(e.pointerId);

        onResizeEnd(habit, localTop, localHeight);
    };

    // Style Calculation
    const isTask = habit.type === 'task';
    const style = {
        top: `${localTop}px`,
        height: `${localHeight}px`,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : (isResizing ? 40 : 10),
        backgroundColor: isCompleted ? habit.color : undefined,
        borderColor: isCompleted ? undefined : habit.color,
        borderLeftColor: habit.color,
        opacity: isDragging ? 0.8 : 1,
        borderRadius: isTask ? '4px' : '8px',
        touchAction: 'none' as const
    };

    // Calculate current time/duration for tooltip
    const currentStartMin = Math.round(localTop / PIXELS_PER_MINUTE);
    const currentDurMin = Math.round(localHeight / PIXELS_PER_MINUTE);
    const startStr = minutesToTime(currentStartMin);
    const endStr = minutesToTime(currentStartMin + currentDurMin);

    const isSmall = localHeight < 35;
    const isTiny = localHeight < 20;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                if (!isDragging && !isResizing) onToggle(e);
            }}
            className={`absolute left-1 right-1 overflow-visible cursor-grab active:cursor-grabbing transition-shadow hover:scale-[1.01] hover:z-20 group
               ${isCompleted ? 'border-transparent text-white' : 'bg-surface border-l-4 text-textPrimary hover:shadow-md'}
               ${isDragging ? 'shadow-xl ring-2 ring-brand' : ''}
               ${isSmall ? 'px-1.5 flex items-center border' : 'p-2 border'}
            `}
            style={style}
        >
            {/* Top Resize Handle */}
            <div
                onPointerDown={(e) => handleResizeStart(e, 'top')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -top-1.5 left-0 right-0 h-4 cursor-ns-resize flex items-start justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-black/5 rounded-t"
            >
                <div className="w-8 h-1 bg-black/20 rounded-full mt-1.5" />
            </div>

            {/* Resize Tooltip */}
            {isResizing && (
                <div className="absolute left-full ml-2 top-0 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    {startStr} - {endStr} ({currentDurMin}m)
                </div>
            )}

            <div className={`flex gap-1.5 items-center pointer-events-none min-w-0 ${isSmall ? 'w-full' : ''}`}>
                {isCompleted && !isTiny ? <Check size={10} className="shrink-0" /> : null}
                {isTask && !isCompleted && !isTiny ? <div className="w-2 h-2 border border-current rounded-sm shrink-0" /> : null}
                <span className={`font-bold leading-tight truncate ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
                    {habit.name}
                </span>
                {isSmall && habit.time && !isTiny && (
                    <span className="ml-auto text-[9px] opacity-70 whitespace-nowrap">{startStr}</span>
                )}
            </div>

            {!isSmall && (
                <div className={`text-[9px] mt-0.5 pointer-events-none flex items-center gap-1.5 flex-wrap ${isCompleted ? 'text-white/80' : 'text-textSecondary'}`}>
                    <span className="font-medium">{startStr} - {endStr}</span>
                    <span className="opacity-60">({currentDurMin}m)</span>
                    {habit.category && (
                        <span className={`px-1 py-0.5 rounded text-[8px] truncate max-w-[50px] ${isCompleted ? 'bg-white/20' : 'bg-surfaceHighlight'}`}>
                            {habit.category}
                        </span>
                    )}
                </div>
            )}

            {/* Bottom Resize Handle */}
            <div
                onPointerDown={(e) => handleResizeStart(e, 'bottom')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -bottom-1.5 left-0 right-0 h-4 cursor-ns-resize flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 z-30 rounded-b"
            >
                <div className="w-8 h-1 bg-black/20 rounded-full mb-1.5" />
            </div>
        </div>
    );
};


const AdvancedCalendar: React.FC<AdvancedCalendarProps> = ({ habits, onToggleHabit, language = 'ru', onUpdateHabit, onBatchUpdateHabits }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    // Default to 3-day view on mobile for better UX
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const [view, setView] = useState<CalendarView>(isMobile ? '3day' : 'week');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
    );

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Helper Functions ---

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
    };

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = getLocalDateString(date);
        const dayOfWeek = date.getDay();

        return habits.filter(habit => {
            if (habit.archived) return false;

            if (habit.type === 'task') {
                return habit.date === dateStr;
            }

            if (habit.frequency === 'daily') return true;
            if (habit.frequency === 'specific_days') return habit.frequencyDays?.includes(dayOfWeek);
            if (habit.frequency === 'weekly') return dayOfWeek === 1;
            if (habit.frequency === 'monthly') return date.getDate() === 1;
            return false;
        }).map(habit => {
            const isCompleted = habit.completedDates.includes(dateStr);
            return { ...habit, isCompleted };
        }).sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            return 1;
        });
    };

    const changeDate = (delta: number) => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + delta);
        else if (view === 'week') newDate.setDate(newDate.getDate() + (delta * 7));
        else if (view === '3day') newDate.setDate(newDate.getDate() + (delta * 3));
        else newDate.setDate(newDate.getDate() + delta);
        setCurrentDate(newDate);
    };

    const headerTitle = useMemo(() => {
        if (view === 'month') return currentDate.toLocaleString(locale, { month: 'long', year: 'numeric' });
        if (view === 'day') return currentDate.toLocaleString(locale, { day: 'numeric', month: 'long', weekday: 'long' });

        const start = getStartOfWeek(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        if (start.getMonth() === end.getMonth()) {
            return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString(locale, { month: 'long' })}`;
        }
        return `${start.getDate()} ${start.toLocaleString(locale, { month: 'short' })} - ${end.getDate()} ${end.toLocaleString(locale, { month: 'short' })}`;
    }, [currentDate, view, locale]);

    // --- Logic for Cascading Push ---

    const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const resolveScheduleConflicts = (
        movedHabitId: string,
        newStartTimeStr: string,
        newDuration: number | undefined,
        dayEvents: Habit[]
    ) => {
        const updates: { id: string, data: Partial<Habit> }[] = [];
        const timedEvents = dayEvents.filter(h => h.time);

        const movedStart = timeToMinutes(newStartTimeStr);
        const movedDuration = newDuration || 30;
        const movedEnd = movedStart + movedDuration;

        updates.push({
            id: movedHabitId,
            data: {
                time: newStartTimeStr,
                duration: movedDuration
            }
        });

        let schedule = timedEvents
            .filter(h => h.id !== movedHabitId)
            .map(h => ({
                id: h.id,
                start: timeToMinutes(h.time!),
                duration: h.duration || 30,
                original: h
            }));

        schedule.sort((a, b) => a.start - b.start);

        let currentEnd = movedEnd;

        for (let i = 0; i < schedule.length; i++) {
            const ev = schedule[i];

            if (ev.start < currentEnd && (ev.start + ev.duration) > movedStart) {
                const newStart = currentEnd;
                updates.push({
                    id: ev.id,
                    data: { time: minutesToTime(newStart) }
                });
                currentEnd = newStart + ev.duration;
            }
        }

        return updates;
    };

    // --- Drag Handling ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        if (!active || !onBatchUpdateHabits) return;

        const { habit, originalTop, dayStr } = active.data.current as { habit: Habit, originalTop: number, dayStr: string };

        const pixelChange = delta.y;
        const newTop = originalTop + pixelChange;

        let newTotalMinutes = Math.round(newTop / PIXELS_PER_MINUTE);

        // Snap to 15m for drag
        const remainder = newTotalMinutes % 15;
        if (remainder >= 8) newTotalMinutes += (15 - remainder);
        else newTotalMinutes -= remainder;

        newTotalMinutes = Math.max(0, Math.min(1439, newTotalMinutes));
        const newTimeStr = minutesToTime(newTotalMinutes);

        if (newTimeStr !== habit.time) {
            const dateObj = new Date(dayStr);
            const dayEvents = getEventsForDate(dateObj);
            const updates = resolveScheduleConflicts(habit.id, newTimeStr, habit.duration, dayEvents);
            onBatchUpdateHabits(updates);
        }
    };

    // --- Resize Handling ---
    const handleResizeEnd = (habit: Habit, newTop: number, newHeight: number) => {
        if (!onBatchUpdateHabits) return;

        let newDuration = Math.round(newHeight / PIXELS_PER_MINUTE);
        const durRemainder = newDuration % 5;
        if (durRemainder >= 3) newDuration += (5 - durRemainder);
        else newDuration -= durRemainder;
        newDuration = Math.max(5, newDuration);

        let newStartMinutes = Math.round(newTop / PIXELS_PER_MINUTE);
        const startRemainder = newStartMinutes % 5;
        if (startRemainder >= 3) newStartMinutes += (5 - startRemainder);
        else newStartMinutes -= startRemainder;
        newStartMinutes = Math.max(0, Math.min(1439, newStartMinutes));
        const newTimeStr = minutesToTime(newStartMinutes);

        const oldTime = habit.time || '00:00';
        const oldDuration = habit.duration || 30;

        if (newDuration !== oldDuration || newTimeStr !== oldTime) {
            const dayEvents = getEventsForDate(currentDate);
            const updates = resolveScheduleConflicts(habit.id, newTimeStr, newDuration, dayEvents);
            onBatchUpdateHabits(updates);
        }
    };


    // --- Renderers ---

    const renderTimeIndicator = () => {
        const today = new Date();
        if (view === 'month') return null;

        const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const top = minutes * PIXELS_PER_MINUTE;

        return (
            <div
                className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none flex items-center"
                style={{ top: `${top}px` }}
            >
                <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            </div>
        );
    };

    const WeekDayView = ({ isDay = false, numDays }: { isDay?: boolean; numDays?: number }) => {
        // For day view or 3day view, start from current date
        // For week view (7 days without isDay), start from Monday
        const is3DayOrDayView = isDay || (numDays && numDays < 7);
        const start = is3DayOrDayView ? currentDate : getStartOfWeek(currentDate);
        const dayCount = numDays || (isDay ? 1 : 7);
        const days = Array.from({ length: dayCount }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });

        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Calculate total workload per day
        const getWorkload = (day: Date) => {
            const events = getEventsForDate(day);
            return events.reduce((sum, h) => sum + (h.duration || 30), 0);
        };

        return (
            <div className="flex flex-col h-full bg-surface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0">
                {/* Header Days */}
                <div className="flex border-b border-borderSubtle bg-surfaceHighlight/20 sticky top-0 z-30 shadow-sm">
                    <div className="w-12 sm:w-16 border-r border-borderSubtle shrink-0"></div>
                    {days.map((day, i) => {
                        const isToday = isSameDate(day, new Date());
                        const workload = getWorkload(day);
                        const workloadHours = Math.round(workload / 60 * 10) / 10;
                        return (
                            <div key={i} className="flex-1 py-2 text-center border-r border-borderSubtle last:border-0 min-w-0">
                                <div className={`text-[10px] font-bold uppercase mb-0.5 truncate px-1 ${isToday ? 'text-brand' : 'text-textSecondary'}`}>
                                    {day.toLocaleString(locale, { weekday: 'short' })}
                                </div>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${isToday ? 'bg-brand text-white' : 'text-textPrimary'}`}>
                                    {day.getDate()}
                                </div>
                                {workload > 0 && (
                                    <div className={`text-[9px] mt-0.5 ${workloadHours > 8 ? 'text-red-500' : workloadHours > 6 ? 'text-orange-500' : 'text-green-500'}`}>
                                        ● {workloadHours}h
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-surface">
                    <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>

                        {/* Time Labels */}
                        <div className="w-12 sm:w-16 border-r border-borderSubtle bg-surface shrink-0 text-[10px] text-textSecondary font-medium text-center pt-2 relative z-20">
                            {hours.map(h => (
                                <div key={h} className="absolute w-full" style={{ top: `${h * HOUR_HEIGHT}px`, transform: 'translateY(-50%)' }}>
                                    {h}:00
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 left-12 sm:left-16 right-0 pointer-events-none z-0">
                            {hours.map(h => (
                                <div key={h} className="border-t border-borderSubtle w-full absolute" style={{ top: `${h * HOUR_HEIGHT}px` }} />
                            ))}
                        </div>

                        {/* Events Columns */}
                        {days.map((day, dayIdx) => {
                            const events = getEventsForDate(day);
                            const dayStr = getLocalDateString(day);

                            return (
                                <div key={dayIdx} className="flex-1 border-r border-borderSubtle last:border-0 relative min-w-0">
                                    {isSameDate(day, new Date()) && renderTimeIndicator()}

                                    {events.map((habit) => {
                                        let top = 0;
                                        let height = 30 * PIXELS_PER_MINUTE;

                                        if (habit.time) {
                                            const [h, m] = habit.time.split(':').map(Number);
                                            top = (h * 60 + m) * PIXELS_PER_MINUTE;
                                            const duration = habit.duration && habit.duration > 0 ? habit.duration : 30;
                                            height = duration * PIXELS_PER_MINUTE;
                                        } else {
                                            top = 10 + (events.indexOf(habit) * 35);
                                            height = 30;
                                        }

                                        const isCompleted = habit.completedDates.includes(dayStr);

                                        return (
                                            <DraggableHabitEvent
                                                key={habit.id}
                                                habit={habit}
                                                dayStr={dayStr}
                                                top={top}
                                                height={height}
                                                isCompleted={isCompleted}
                                                onToggle={(e) => onToggleHabit(habit.id, dayStr, e)}
                                                onResizeEnd={handleResizeEnd}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const MonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = (firstDay.getDay() + 6) % 7;
        const today = new Date();

        const days: (Date | null)[] = [];
        for (let i = 0; i < startingDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        while (days.length % 7 !== 0) days.push(null);

        const numRows = Math.ceil(days.length / 7);
        const weekDays = language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const [selectedDay, setSelectedDay] = useState<string | null>(getLocalDateString(today));

        const monthStats = useMemo(() => {
            let totalCompleted = 0, totalHabits = 0, perfectDays = 0, currentStreak = 0;
            let countingStreak = true;
            for (let d = lastDay.getDate(); d >= 1; d--) {
                const date = new Date(year, month, d);
                if (date > today) continue;
                const events = getEventsForDate(date);
                const completed = events.filter(e => e.isCompleted).length;
                const total = events.length;
                if (total > 0) {
                    totalCompleted += completed;
                    totalHabits += total;
                    if (completed === total) perfectDays++;
                    if (countingStreak) {
                        if (completed === total) currentStreak++;
                        else countingStreak = false;
                    }
                }
            }
            return {
                avgPercent: totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0,
                perfectDays, currentStreak, totalCompleted
            };
        }, [currentDate, habits]);

        const selectedDate = selectedDay ? new Date(selectedDay + 'T00:00:00') : null;
        const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
        const selectedCompleted = selectedEvents.filter(e => e.isCompleted).length;

        return (
            <div className="flex flex-col h-full gap-2">
                {/* Compact Stats */}
                <div className="bg-surface border border-borderSubtle rounded-2xl px-4 py-3 shrink-0">
                    <div className="flex items-center justify-around">
                        <div className="text-center">
                            <div className={`text-xl font-black ${monthStats.avgPercent >= 80 ? 'text-emerald-500' : monthStats.avgPercent >= 50 ? 'text-amber-500' : 'text-textPrimary'}`}>
                                {monthStats.avgPercent}%
                            </div>
                            <div className="text-[9px] text-textSecondary uppercase font-medium tracking-wide">
                                {language === 'ru' ? 'Месяц' : 'Month'}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-borderSubtle" />
                        <div className="text-center">
                            <div className="text-xl font-black text-emerald-500">{monthStats.perfectDays}</div>
                            <div className="text-[9px] text-textSecondary uppercase font-medium tracking-wide">
                                {language === 'ru' ? '100%' : 'Perfect'}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-borderSubtle" />
                        <div className="text-center">
                            <div className="text-xl font-black text-brand">{monthStats.currentStreak}</div>
                            <div className="text-[9px] text-textSecondary uppercase font-medium tracking-wide">
                                {language === 'ru' ? 'Подряд' : 'Streak'}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-borderSubtle" />
                        <div className="text-center">
                            <div className="text-xl font-black text-textPrimary">{monthStats.totalCompleted}</div>
                            <div className="text-[9px] text-textSecondary uppercase font-medium tracking-wide">
                                {language === 'ru' ? 'Всего' : 'Done'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${monthStats.avgPercent >= 80 ? 'bg-emerald-500' : monthStats.avgPercent >= 50 ? 'bg-amber-500' : 'bg-brand'}`}
                            style={{ width: `${monthStats.avgPercent}%` }}
                        />
                    </div>
                </div>

                {/* Compact Calendar Grid — fixed height cells */}
                <div className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm shrink-0">
                    <div className="grid grid-cols-7 border-b border-borderSubtle">
                        {weekDays.map(d => (
                            <div key={d} className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-textSecondary">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {days.map((date, i) => {
                            if (!date) return <div key={i} className="border-r border-b border-borderSubtle/50 h-14 sm:h-16 bg-surfaceHighlight/5" />;

                            const events = getEventsForDate(date);
                            const dateStr = getLocalDateString(date);
                            const isToday = isSameDate(date, today);
                            const isPast = date < today && !isToday;
                            const isFuture = date > today;
                            const isSelected = selectedDay === dateStr;
                            const completedCount = events.filter(e => e.isCompleted).length;
                            const totalCount = events.length;
                            const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                            const isFullyComplete = totalCount > 0 && completedCount === totalCount;

                            let heatBg = '';
                            if (isPast && totalCount > 0) {
                                if (isFullyComplete) heatBg = 'bg-emerald-500/15';
                                else if (percent >= 50) heatBg = 'bg-amber-500/10';
                                else if (percent > 0) heatBg = 'bg-red-500/8';
                            }

                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                                    className={`
                                        h-14 sm:h-16 border-r border-b border-borderSubtle/50 p-1 flex flex-col items-center
                                        cursor-pointer transition-all relative
                                        ${heatBg}
                                        ${isFuture ? 'opacity-50' : ''}
                                        ${isSelected ? 'ring-2 ring-inset ring-brand bg-brand/10 z-10' : 'hover:bg-surfaceHighlight/40'}
                                    `}
                                >
                                    <div className={`
                                        text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0
                                        ${isToday ? 'bg-brand text-white' : ''}
                                        ${isFullyComplete && !isToday ? 'text-emerald-600' : ''}
                                        ${!isToday && !isFullyComplete ? 'text-textPrimary' : ''}
                                    `}>
                                        {date.getDate()}
                                    </div>

                                    {totalCount > 0 && (
                                        <div className="flex flex-wrap gap-[2px] justify-center mt-0.5">
                                            {events.slice(0, 7).map((h, j) => (
                                                <div
                                                    key={j}
                                                    className={`w-[5px] h-[5px] rounded-full ${h.isCompleted ? 'opacity-100' : 'opacity-30'}`}
                                                    style={{ backgroundColor: h.color }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {totalCount > 0 && (
                                        <div className={`text-[8px] font-bold mt-auto ${isFullyComplete ? 'text-emerald-500' : percent >= 50 ? 'text-amber-600' : 'text-textSecondary'}`}>
                                            {completedCount}/{totalCount}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Detail Panel */}
                {selectedDay && selectedDate && (
                    <div className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col animate-slideUp" style={{ animationDuration: '0.2s' }}>
                        <div className="px-4 py-2.5 border-b border-borderSubtle flex items-center justify-between bg-surfaceHighlight/20 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selectedEvents.length > 0 && selectedCompleted === selectedEvents.length ? 'bg-emerald-500' : 'bg-brand'}`} />
                                <span className="text-sm font-bold text-textPrimary">
                                    {selectedDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                                {isSameDate(selectedDate, today) && (
                                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                        {language === 'ru' ? 'Сегодня' : 'Today'}
                                    </span>
                                )}
                            </div>
                            {selectedEvents.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 bg-surfaceHighlight rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${selectedCompleted === selectedEvents.length ? 'bg-emerald-500' : 'bg-brand'}`}
                                            style={{ width: `${(selectedCompleted / selectedEvents.length) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold ${selectedCompleted === selectedEvents.length ? 'text-emerald-500' : 'text-textSecondary'}`}>
                                        {selectedCompleted}/{selectedEvents.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {selectedEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-textSecondary py-8">
                                    <CalendarIcon size={28} className="text-textSecondary" />
                                    <div className="text-sm font-medium">{language === 'ru' ? 'Нет привычек на этот день' : 'No habits for this day'}</div>
                                </div>
                            ) : (
                                selectedEvents.map(habit => (
                                    <div
                                        key={habit.id}
                                        onClick={(e) => onToggleHabit(habit.id, selectedDay, e)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer apple-press
                                            ${habit.isCompleted ? 'bg-emerald-500/5 opacity-60' : 'hover:bg-surfaceHighlight/60'}`}
                                    >
                                        <div className={`w-1 h-8 shrink-0 ${habit.type === 'task' ? 'rounded-none' : 'rounded-full'}`} style={{ backgroundColor: habit.color }} />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                            ${habit.isCompleted ? 'bg-emerald-500 border-emerald-500' : ''}`}
                                            style={{ borderColor: habit.isCompleted ? undefined : habit.color }}
                                        >
                                            {habit.isCompleted && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-semibold truncate ${habit.isCompleted ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>
                                                {habit.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-textSecondary mt-0.5">
                                                {habit.category && <span className="truncate max-w-[80px]">{habit.category}</span>}
                                                {habit.duration && <span>{habit.duration}m</span>}
                                            </div>
                                        </div>
                                        {habit.time && (
                                            <div className="text-xs font-medium text-textSecondary bg-surfaceHighlight px-2 py-0.5 rounded shrink-0">
                                                {habit.time}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const AgendaView = () => {
        const days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + i);
            return d;
        });

        return (
            <div className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm h-full overflow-y-auto custom-scrollbar flex-1">
                {days.map(day => {
                    const events = getEventsForDate(day);
                    const isToday = isSameDate(day, new Date());
                    const dayStr = getLocalDateString(day);

                    if (events.length === 0) return null;

                    return (
                        <div key={dayStr} className="border-b border-borderSubtle last:border-0">
                            <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider sticky top-0 bg-surface/95 backdrop-blur z-10 border-b border-borderSubtle/50 ${isToday ? 'text-brand' : 'text-textSecondary'}`}>
                                {day.toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                {isToday && (language === 'ru' ? " (Сегодня)" : " (Today)")}
                            </div>
                            <div className="p-2 space-y-2">
                                {events.map(habit => (
                                    <div
                                        key={habit.id}
                                        onClick={(e) => onToggleHabit(habit.id, dayStr, e)}
                                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${habit.isCompleted ? 'bg-surfaceHighlight/10 border-transparent opacity-60' : 'bg-surface border-borderSubtle hover:border-brand/30 hover:shadow-sm'}`}
                                    >
                                        <div className="flex flex-col items-center w-12 shrink-0">
                                            <span className="text-sm font-bold text-textPrimary">{habit.time || '--:--'}</span>
                                            {habit.duration && <span className="text-[10px] text-textSecondary">{habit.duration}m</span>}
                                        </div>
                                        <div className={`w-1 h-8 ${habit.type === 'task' ? 'rounded-none' : 'rounded-full'}`} style={{ backgroundColor: habit.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-bold ${habit.isCompleted ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>{habit.name}</div>
                                            {habit.category && <div className="text-[10px] text-textSecondary">{habit.category}</div>}
                                        </div>
                                        <div className={`w-6 h-6 ${habit.type === 'task' ? 'rounded-md' : 'rounded-full'} border flex items-center justify-center ${habit.isCompleted ? 'bg-brand border-brand text-white' : 'border-borderSubtle'}`}>
                                            {habit.isCompleted && <Check size={14} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full animate-fadeIn">
                {/* Controls */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2 bg-surfaceHighlight/50 p-1 rounded-xl">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                        <div className="px-2 font-bold text-textPrimary min-w-[140px] text-center text-sm">{headerTitle}</div>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-surface rounded-lg transition-colors"><ChevronRight size={20} /></button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-surfaceHighlight/50 p-1 rounded-xl gap-1">
                            <button onClick={() => setView('month')} className={`p-2 rounded-lg transition-all ${view === 'month' ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`} title={language === 'ru' ? "Месяц" : "Month"}><LayoutGrid size={18} /></button>
                            <button onClick={() => setView('week')} className={`p-2 rounded-lg transition-all ${view === 'week' ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`} title={language === 'ru' ? "Неделя" : "Week"}><Columns size={18} /></button>
                            <button onClick={() => setView('3day')} className={`p-2 rounded-lg transition-all ${view === '3day' ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`} title={language === 'ru' ? "3 дня" : "3 Days"}>
                                <div className="flex items-end gap-[2px] h-[18px]">
                                    <div className="w-[4px] h-full bg-current rounded-sm opacity-80" />
                                    <div className="w-[4px] h-full bg-current rounded-sm" />
                                    <div className="w-[4px] h-full bg-current rounded-sm opacity-80" />
                                </div>
                            </button>
                            <button onClick={() => setView('day')} className={`p-2 rounded-lg transition-all ${view === 'day' ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`} title={language === 'ru' ? "День" : "Day"}><CalendarIcon size={18} /></button>
                            <button onClick={() => setView('agenda')} className={`p-2 rounded-lg transition-all ${view === 'agenda' ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`} title={language === 'ru' ? "Повестка" : "Agenda"}><AlignJustify size={18} /></button>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-lg transition-all ${isSidebarOpen ? 'bg-brand text-white' : 'bg-surfaceHighlight/50 text-textSecondary hover:text-textPrimary'}`}
                            title={language === 'ru' ? "Панель задач" : "Task Panel"}
                        >
                            <PanelRightOpen size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content with Sidebar */}
                <div className="flex-1 min-h-0 flex">
                    <div className="flex-1 flex flex-col min-w-0">
                        {view === 'month' && <MonthView />}
                        {view === 'week' && <WeekDayView />}
                        {view === '3day' && <WeekDayView numDays={3} />}
                        {view === 'day' && <WeekDayView isDay />}
                        {view === 'agenda' && <AgendaView />}
                    </div>

                    {isSidebarOpen && (
                        <CalendarSidebar
                            habits={habits}
                            language={language}
                            isOpen={isSidebarOpen}
                            onToggle={() => setIsSidebarOpen(false)}
                        />
                    )}
                </div>
            </div>
        </DndContext>
    );
};

export default AdvancedCalendar;

