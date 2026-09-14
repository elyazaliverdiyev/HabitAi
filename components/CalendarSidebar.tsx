import React, { useState } from 'react';
import { Habit } from '../types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, CheckCircle, Circle, X, ChevronUp, ChevronDown } from 'lucide-react';
import Icon from './Icons';

interface CalendarSidebarProps {
    habits: Habit[];
    language: 'ru' | 'en';
    isOpen: boolean;
    onToggle: () => void;
}

// Draggable Task Item for Sidebar
const DraggableSidebarTask: React.FC<{ habit: Habit; language: 'ru' | 'en' }> = ({ habit, language }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `sidebar-${habit.id}`,
        data: {
            habit,
            fromSidebar: true,
            originalTop: 0,
            dayStr: new Date().toISOString().split('T')[0]
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const isTask = habit.type === 'task';
    const todayStr = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completedDates.includes(todayStr);

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`group flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-borderSubtle 
                hover:border-brand/30 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all apple-press
                ${isDragging ? 'shadow-lg ring-2 ring-brand' : ''}
                ${isCompleted ? 'opacity-40' : ''}`}
        >
            <div className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <GripVertical size={14} />
            </div>
            <div
                className={`w-1 h-8 shrink-0 ${isTask ? 'rounded-none' : 'rounded-full'}`}
                style={{ backgroundColor: habit.color }}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: habit.color + '20' }}
                    >
                        <Icon name={habit.icon} size={12} style={{ color: habit.color }} />
                    </div>
                    <span className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-textSecondary' : 'text-textPrimary'}`}>
                        {habit.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-textSecondary">
                    {habit.time && (
                        <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {habit.time}
                        </span>
                    )}
                    {habit.duration && <span>{habit.duration}m</span>}
                    {habit.category && (
                        <span className="px-1.5 py-0.5 bg-surfaceHighlight rounded text-[9px] truncate max-w-[60px]">
                            {habit.category}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ habits, language, isOpen, onToggle }) => {
    const [expandedSection, setExpandedSection] = useState<'unscheduled' | 'scheduled' | null>('unscheduled');

    const t = {
        ru: {
            unscheduled: 'Незапланированные',
            scheduled: 'Запланированные',
            noTasks: 'Нет задач',
            dragHint: 'Перетащи на календарь',
            taskPanel: 'Панель задач'
        },
        en: {
            unscheduled: 'Unscheduled',
            scheduled: 'Scheduled',
            noTasks: 'No tasks',
            dragHint: 'Drag to calendar',
            taskPanel: 'Task Panel'
        }
    }[language];

    const today = new Date().toISOString().split('T')[0];
    const unscheduled = habits.filter(h =>
        !h.archived &&
        (h.type === 'task' ? h.date === today : true) &&
        !h.time
    );
    const scheduled = habits.filter(h =>
        !h.archived &&
        (h.type === 'task' ? h.date === today : true) &&
        h.time
    );

    if (!isOpen) return null;

    // Detect mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    // Mobile: Bottom sheet
    if (isMobile) {
        return (
            <div className="fixed inset-x-0 bottom-0 z-50 animate-slideUp" style={{ animationDuration: '0.3s' }}>
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onToggle} />

                {/* Sheet */}
                <div className="relative bg-surface rounded-t-3xl border-t border-borderSubtle max-h-[70vh] flex flex-col shadow-2xl">
                    {/* Handle */}
                    <div className="flex justify-center py-2">
                        <div className="w-10 h-1 rounded-full bg-textSecondary/30" />
                    </div>

                    {/* Header */}
                    <div className="px-4 pb-2 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-textPrimary">{t.taskPanel}</h3>
                            <p className="text-[10px] text-textSecondary">{t.dragHint}</p>
                        </div>
                        <button onClick={onToggle} className="p-1.5 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
                        {/* Unscheduled */}
                        <div>
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'unscheduled' ? null : 'unscheduled')}
                                className="flex items-center gap-2 w-full mb-2"
                            >
                                <Circle size={14} className="text-orange-500" />
                                <span className="text-xs font-bold text-textPrimary flex-1 text-left">{t.unscheduled}</span>
                                <span className="text-[10px] text-textSecondary bg-surfaceHighlight px-1.5 py-0.5 rounded-full">
                                    {unscheduled.length}
                                </span>
                                {expandedSection === 'unscheduled' ? <ChevronUp size={14} className="text-textSecondary" /> : <ChevronDown size={14} className="text-textSecondary" />}
                            </button>
                            {expandedSection === 'unscheduled' && (
                                <div className="space-y-1.5">
                                    {unscheduled.length === 0 ? (
                                        <div className="text-center py-3 text-xs text-textSecondary">{t.noTasks}</div>
                                    ) : (
                                        unscheduled.map(habit => (
                                            <DraggableSidebarTask key={habit.id} habit={habit} language={language} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Scheduled */}
                        <div>
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'scheduled' ? null : 'scheduled')}
                                className="flex items-center gap-2 w-full mb-2"
                            >
                                <CheckCircle size={14} className="text-green-500" />
                                <span className="text-xs font-bold text-textPrimary flex-1 text-left">{t.scheduled}</span>
                                <span className="text-[10px] text-textSecondary bg-surfaceHighlight px-1.5 py-0.5 rounded-full">
                                    {scheduled.length}
                                </span>
                                {expandedSection === 'scheduled' ? <ChevronUp size={14} className="text-textSecondary" /> : <ChevronDown size={14} className="text-textSecondary" />}
                            </button>
                            {expandedSection === 'scheduled' && (
                                <div className="space-y-1.5">
                                    {scheduled.length === 0 ? (
                                        <div className="text-center py-3 text-xs text-textSecondary">{t.noTasks}</div>
                                    ) : (
                                        scheduled.map(habit => (
                                            <DraggableSidebarTask key={habit.id} habit={habit} language={language} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop: side panel
    return (
        <div className="w-72 bg-surface border-l border-borderSubtle flex flex-col h-full shrink-0 overflow-hidden animate-slideInRight" style={{ animationDuration: '0.2s' }}>
            {/* Header */}
            <div className="p-3 border-b border-borderSubtle flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-textPrimary">{t.taskPanel}</span>
                    <p className="text-[10px] text-textSecondary">{t.dragHint}</p>
                </div>
                <button
                    onClick={onToggle}
                    className="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Unscheduled Section */}
                <div className="p-3">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'unscheduled' ? null : 'unscheduled')}
                        className="flex items-center gap-2 w-full mb-2"
                    >
                        <Circle size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-textPrimary flex-1 text-left">{t.unscheduled}</span>
                        <span className="text-[10px] text-textSecondary bg-surfaceHighlight px-1.5 py-0.5 rounded-full">
                            {unscheduled.length}
                        </span>
                        {expandedSection === 'unscheduled' ? <ChevronUp size={14} className="text-textSecondary" /> : <ChevronDown size={14} className="text-textSecondary" />}
                    </button>
                    {expandedSection === 'unscheduled' && (
                        <div className="space-y-1.5">
                            {unscheduled.length === 0 ? (
                                <div className="text-center py-4 text-xs text-textSecondary">{t.noTasks}</div>
                            ) : (
                                unscheduled.map(habit => (
                                    <DraggableSidebarTask key={habit.id} habit={habit} language={language} />
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-borderSubtle mx-3" />

                {/* Scheduled Section */}
                <div className="p-3">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'scheduled' ? null : 'scheduled')}
                        className="flex items-center gap-2 w-full mb-2"
                    >
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-xs font-bold text-textPrimary flex-1 text-left">{t.scheduled}</span>
                        <span className="text-[10px] text-textSecondary bg-surfaceHighlight px-1.5 py-0.5 rounded-full">
                            {scheduled.length}
                        </span>
                        {expandedSection === 'scheduled' ? <ChevronUp size={14} className="text-textSecondary" /> : <ChevronDown size={14} className="text-textSecondary" />}
                    </button>
                    {expandedSection === 'scheduled' && (
                        <div className="space-y-1.5">
                            {scheduled.length === 0 ? (
                                <div className="text-center py-4 text-xs text-textSecondary">{t.noTasks}</div>
                            ) : (
                                scheduled.map(habit => (
                                    <DraggableSidebarTask key={habit.id} habit={habit} language={language} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarSidebar;
