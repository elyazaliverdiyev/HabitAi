import React, { useMemo, useState } from 'react';
import { Habit } from '../types';
import { triggerHaptic } from '../utils/helpers';
import Icon from './Icons';
import {
    AlertTriangle, Clock, Flame, Trash2, Users,
    ChevronDown, ChevronUp, GripVertical, CheckCircle2
} from 'lucide-react';

interface EisenhowerMatrixProps {
    habits: Habit[];
    onToggleHabit: (id: string, dateStr: string) => void;
    onUpdateHabit: (id: string, updates: Partial<Habit>) => void;
    onOpenHabit: (habit: Habit) => void;
    selectedDate: Date;
    language?: 'ru' | 'en';
}

type Quadrant = 'do' | 'schedule' | 'delegate' | 'delete';

const QUADRANT_CONFIG: Record<Quadrant, {
    titleRu: string; titleEn: string;
    subtitleRu: string; subtitleEn: string;
    emoji: string;
    color: string; bgFrom: string; bgTo: string;
    borderColor: string; badgeBg: string; badgeText: string;
    glowColor: string;
}> = {
    do: {
        titleRu: 'Сделай Сейчас', titleEn: 'Do First',
        subtitleRu: 'Срочно + Важно', subtitleEn: 'Urgent + Important',
        emoji: '🔥',
        color: '#ef4444', bgFrom: 'rgba(239,68,68,0.08)', bgTo: 'rgba(239,68,68,0.02)',
        borderColor: 'rgba(239,68,68,0.2)', badgeBg: 'rgba(239,68,68,0.12)', badgeText: '#f87171',
        glowColor: 'rgba(239,68,68,0.3)',
    },
    schedule: {
        titleRu: 'Запланируй', titleEn: 'Schedule',
        subtitleRu: 'Важно, но не срочно', subtitleEn: 'Important, Not Urgent',
        emoji: '📅',
        color: '#3b82f6', bgFrom: 'rgba(59,130,246,0.08)', bgTo: 'rgba(59,130,246,0.02)',
        borderColor: 'rgba(59,130,246,0.2)', badgeBg: 'rgba(59,130,246,0.12)', badgeText: '#60a5fa',
        glowColor: 'rgba(59,130,246,0.3)',
    },
    delegate: {
        titleRu: 'Делегируй', titleEn: 'Delegate',
        subtitleRu: 'Срочно, но не важно', subtitleEn: 'Urgent, Not Important',
        emoji: '👥',
        color: '#eab308', bgFrom: 'rgba(234,179,8,0.08)', bgTo: 'rgba(234,179,8,0.02)',
        borderColor: 'rgba(234,179,8,0.2)', badgeBg: 'rgba(234,179,8,0.12)', badgeText: '#facc15',
        glowColor: 'rgba(234,179,8,0.3)',
    },
    delete: {
        titleRu: 'Удали / Отложи', titleEn: 'Eliminate',
        subtitleRu: 'Не срочно + Не важно', subtitleEn: 'Not Urgent, Not Important',
        emoji: '🗑️',
        color: '#6b7280', bgFrom: 'rgba(107,114,128,0.08)', bgTo: 'rgba(107,114,128,0.02)',
        borderColor: 'rgba(107,114,128,0.2)', badgeBg: 'rgba(107,114,128,0.12)', badgeText: '#9ca3af',
        glowColor: 'rgba(107,114,128,0.3)',
    },
};

const QUADRANT_ORDER: Quadrant[] = ['do', 'schedule', 'delegate', 'delete'];

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
    habits,
    onToggleHabit,
    onUpdateHabit,
    onOpenHabit,
    selectedDate,
    language = 'ru',
}) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverQuadrant, setDragOverQuadrant] = useState<Quadrant | null>(null);
    const [showUnsorted, setShowUnsorted] = useState(true);

    const dateStr = selectedDate.toISOString().slice(0, 10);

    // Separate tasks into quadrants (only incomplete tasks)
    const { quadrants, unsorted } = useMemo(() => {
        const tasks = habits.filter(h => {
            if (h.archived || h.type !== 'task') return false;
            // Filter out completed tasks
            const targetDate = h.date || dateStr;
            return !h.completedDates.includes(targetDate);
        });

        const q: Record<Quadrant, Habit[]> = { do: [], schedule: [], delegate: [], delete: [] };
        const unassigned: Habit[] = [];

        tasks.forEach(task => {
            if (task.quadrant && QUADRANT_ORDER.includes(task.quadrant)) {
                q[task.quadrant].push(task);
            } else {
                unassigned.push(task);
            }
        });

        return { quadrants: q, unsorted: unassigned };
    }, [habits, dateStr]);

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTaskId(taskId);
    };

    const handleDragOver = (e: React.DragEvent, quadrant: Quadrant) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverQuadrant(quadrant);
    };

    const handleDragLeave = () => {
        setDragOverQuadrant(null);
    };

    const handleDrop = (e: React.DragEvent, quadrant: Quadrant) => {
        e.preventDefault();
        if (draggedTaskId) {
            onUpdateHabit(draggedTaskId, { quadrant });
            triggerHaptic();
        }
        setDraggedTaskId(null);
        setDragOverQuadrant(null);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverQuadrant(null);
    };

    const isCompleted = (task: Habit) => {
        const target = task.date || dateStr;
        return task.completedDates.includes(target);
    };

    const handleToggle = (task: Habit) => {
        const target = task.date || dateStr;
        onToggleHabit(task.id, target);
        triggerHaptic();
    };

    // Quick assign from unsorted
    const quickAssign = (taskId: string, quadrant: Quadrant) => {
        onUpdateHabit(taskId, { quadrant });
        triggerHaptic();
    };

    const renderTask = (task: Habit, cfg: typeof QUADRANT_CONFIG['do']) => {
        const done = isCompleted(task);

        return (
            <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onOpenHabit(task)}
                className={`group flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all duration-200
                    ${done
                        ? 'opacity-50 border-white/[0.03] bg-white/[0.01]'
                        : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1]'
                    }
                    ${draggedTaskId === task.id ? 'opacity-30 scale-95' : ''}
                `}
            >
                {/* Drag handle */}
                <GripVertical size={12} className="text-textSecondary/30 shrink-0 group-hover:text-textSecondary/60 transition-colors cursor-grab" />

                {/* Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggle(task); }}
                    className="shrink-0"
                >
                    {done ? (
                        <CheckCircle2 size={18} style={{ color: cfg.color }} className="drop-shadow-sm" />
                    ) : (
                        <div
                            className="w-[18px] h-[18px] rounded-full border-2 transition-all hover:scale-110"
                            style={{ borderColor: cfg.color + '60' }}
                        />
                    )}
                </button>

                {/* Icon + Name */}
                <span className="text-sm shrink-0"><Icon name={task.icon} size={16} /></span>
                <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold truncate block ${done ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>
                        {task.name}
                    </span>
                    {task.time && (
                        <span className="text-[9px] text-textSecondary flex items-center gap-0.5 mt-0.5">
                            <Clock size={8} /> {task.time}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUADRANT_ORDER.map(q => {
                    const cfg = QUADRANT_CONFIG[q];
                    const tasks = quadrants[q];
                    const isDragOver = dragOverQuadrant === q;

                    return (
                        <div
                            key={q}
                            onDragOver={(e) => handleDragOver(e, q)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, q)}
                            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isDragOver ? 'scale-[1.02] ring-2' : ''
                                }`}
                            style={{
                                background: `linear-gradient(135deg, ${cfg.bgFrom} 0%, ${cfg.bgTo} 100%)`,
                                borderColor: isDragOver ? cfg.color : cfg.borderColor,
                                ringColor: isDragOver ? cfg.color : undefined,
                                backdropFilter: 'blur(12px)',
                                minHeight: '140px',
                            }}
                        >
                            {/* Glow */}
                            <div
                                className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300"
                                style={{
                                    background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)`,
                                    opacity: isDragOver ? 0.4 : 0.15,
                                }}
                            />

                            <div className="relative p-2.5">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">{cfg.emoji}</span>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-wider text-textPrimary leading-tight">
                                                {language === 'ru' ? cfg.titleRu : cfg.titleEn}
                                            </h4>
                                            <p className="text-[8px] font-medium leading-tight" style={{ color: cfg.badgeText }}>
                                                {language === 'ru' ? cfg.subtitleRu : cfg.subtitleEn}
                                            </p>
                                        </div>
                                    </div>
                                    {tasks.length > 0 && (
                                        <div
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: cfg.badgeBg, color: cfg.badgeText }}
                                        >
                                            {tasks.length}
                                        </div>
                                    )}
                                </div>

                                {/* Tasks list */}
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {tasks.length === 0 ? (
                                        <div className="flex items-center justify-center h-16 text-[10px] text-textSecondary/50 font-medium">
                                            {isDragOver
                                                ? (language === 'ru' ? '📥 Отпусти сюда' : '📥 Drop here')
                                                : (language === 'ru' ? 'Перетащи задачу сюда' : 'Drag tasks here')
                                            }
                                        </div>
                                    ) : (
                                        tasks.map(task => renderTask(task, cfg))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Unsorted Tasks */}
            {unsorted.length > 0 && (
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <button
                        onClick={() => { setShowUnsorted(!showUnsorted); triggerHaptic(); }}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📋</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-textPrimary">
                                {language === 'ru' ? 'Не распределённые' : 'Unsorted'}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-textSecondary">
                                {unsorted.length}
                            </span>
                        </div>
                        {showUnsorted ? <ChevronUp size={14} className="text-textSecondary" /> : <ChevronDown size={14} className="text-textSecondary" />}
                    </button>

                    {showUnsorted && (
                        <div className="px-3 pb-3 space-y-2">
                            {unsorted.map(task => (
                                <div key={task.id} className="flex items-center gap-2">
                                    {/* Task info */}
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onOpenHabit(task)}
                                        className={`flex-1 flex items-center gap-2 p-2 rounded-xl border border-white/[0.05] bg-white/[0.02] cursor-pointer
                                            hover:bg-white/[0.05] transition-all ${draggedTaskId === task.id ? 'opacity-30' : ''}`}
                                    >
                                        <GripVertical size={12} className="text-textSecondary/30 cursor-grab shrink-0" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggle(task); }}
                                            className="shrink-0"
                                        >
                                            {isCompleted(task) ? (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-textSecondary/30" />
                                            )}
                                        </button>
                                        <span className="text-sm shrink-0"><Icon name={task.icon} size={16} /></span>
                                        <span className={`text-xs font-bold truncate ${isCompleted(task) ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>
                                            {task.name}
                                        </span>
                                    </div>

                                    {/* Quick assign buttons */}
                                    <div className="flex gap-0.5 shrink-0">
                                        {QUADRANT_ORDER.map(q => (
                                            <button
                                                key={q}
                                                onClick={() => quickAssign(task.id, q)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110 border"
                                                style={{
                                                    background: QUADRANT_CONFIG[q].badgeBg,
                                                    borderColor: QUADRANT_CONFIG[q].borderColor,
                                                }}
                                                title={language === 'ru' ? QUADRANT_CONFIG[q].titleRu : QUADRANT_CONFIG[q].titleEn}
                                            >
                                                {QUADRANT_CONFIG[q].emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EisenhowerMatrix;
