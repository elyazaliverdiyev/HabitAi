import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Trash2, Edit2, GripVertical, PlusCircle, Check } from 'lucide-react';
import { Habit, KanbanColumn, getCurrentStreak, getStreakMilestone } from '../types';
import Icon from './Icons';
import { Flame } from 'lucide-react';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- KANBAN COLUMN COMPONENT ---
interface KanbanColumnProps {
    column: KanbanColumn;
    habits: Habit[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onAddCard: (colId: string) => void;
    onCardClick: (id: string) => void;
    onToggle: (id: string, dateStr: string) => void;
    language: 'ru' | 'en';
}

const SortableColumn: React.FC<KanbanColumnProps> = ({ column, habits, onEdit, onDelete, onAddCard, onCardClick, onToggle, language }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: { type: 'Column', column }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-surfaceHighlight/30 w-[260px] h-[500px] rounded-2xl border-2 border-brand/50 border-dashed opacity-40 shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-surface w-[75vw] sm:w-[260px] max-h-full flex flex-col rounded-2xl border border-borderSubtle shrink-0 shadow-sm snap-start"
        >
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-3 flex items-center justify-between border-b border-borderSubtle cursor-grab active:cursor-grabbing group"
            >
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || '#a1a1aa' }} />
                    <h3 className="font-bold text-sm text-textPrimary truncate max-w-[150px]">{column.title}</h3>
                    <span className="text-xs text-textSecondary bg-surfaceHighlight px-1.5 py-0.5 rounded-full">{habits.length}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(column.id)} className="p-1 hover:bg-surfaceHighlight rounded text-textSecondary">
                        <Edit2 size={12} />
                    </button>
                    <button onClick={() => onDelete(column.id)} className="p-1 hover:bg-red-500/10 text-textSecondary hover:text-red-500 rounded">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Habits List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                    {habits.map(habit => (
                        <KanbanItem key={habit.id} habit={habit} onClick={onCardClick} onToggle={onToggle} />
                    ))}
                </SortableContext>

                <button
                    onClick={() => onAddCard(column.id)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-textSecondary hover:text-brand hover:bg-brand/5 rounded-xl border border-dashed border-borderSubtle hover:border-brand/30 transition-all text-xs font-medium mt-2"
                >
                    <PlusCircle size={14} />
                    {language === 'ru' ? 'Добавить задачу' : 'Add Task'}
                </button>
            </div>
        </div>
    );
};

// --- KANBAN ITEM WRAPPER ---
interface KanbanItemProps {
    habit: Habit;
    onClick: (id: string) => void;
    onToggle: (id: string, dateStr: string) => void;
}

const KanbanItem: React.FC<KanbanItemProps> = ({ habit, onClick, onToggle }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: habit.id,
        data: { type: 'Habit', habit }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const todayStr = getLocalDateString();
    const isCompleted = habit.completedDates?.includes(todayStr) || (habit.date && habit.completedDates?.includes(habit.date));

    if (isDragging) {
        return (
            <div ref={setNodeRef} style={style} className="h-16 bg-surfaceHighlight/50 rounded-xl border-2 border-brand/50 border-dashed opacity-50" />
        );
    }

    return (
        <div ref={setNodeRef} style={style} className="touch-manipulation">
            <div
                onClick={() => onClick(habit.id)}
                className={`p-2.5 rounded-xl border cursor-pointer group transition-all hover:shadow-sm ${isCompleted
                    ? 'bg-green-500/5 border-green-500/20 opacity-70'
                    : 'bg-surfaceHighlight/10 hover:bg-surfaceHighlight/30 border-borderSubtle hover:-translate-y-0.5'
                    }`}
            >
                <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(habit.id, habit.date || todayStr); }}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 ${isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-borderSubtle text-transparent hover:border-brand'
                            }`}
                        {...attributes}
                        {...listeners}
                    >
                        <Check size={12} strokeWidth={3} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-base"><Icon name={habit.icon} size={18} /></span>
                            {habit.difficulty && (
                                <div className={`w-1.5 h-1.5 rounded-full ${habit.difficulty >= 5 ? 'bg-orange-500' :
                                    habit.difficulty >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                            )}
                            {/* Streak Badge */}
                            {(() => {
                                const streak = getCurrentStreak(habit);
                                if (streak < 1) return null;
                                const milestone = getStreakMilestone(streak);
                                const color = milestone?.color || '#f97316';
                                return (
                                    <div
                                        className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-bold"
                                        style={{ backgroundColor: `${color}20`, color }}
                                    >
                                        <Flame size={8} fill={streak >= 7 ? color : 'none'} />
                                        <span>{streak}</span>
                                    </div>
                                );
                            })()}
                        </div>
                        <h4 className={`font-bold text-xs leading-tight line-clamp-2 ${isCompleted ? 'line-through text-textSecondary' : 'text-textPrimary'
                            }`}>{habit.name}</h4>

                        {/* Sub-items progress */}
                        {habit.items && habit.items.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                                <div className="flex-1 h-0.5 bg-surfaceHighlight rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand"
                                        style={{ width: `${(habit.items.filter(i => i.status === 'done').length / habit.items.length) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[8px] text-textSecondary">{habit.items.filter(i => i.status === 'done').length}/{habit.items.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN BOARD COMPONENT ---
interface KanbanBoardProps {
    columns: KanbanColumn[];
    habits: Habit[];
    onColumnsChange: (cols: KanbanColumn[]) => void;
    onHabitMove: (habitId: string, overColumnId: string) => void;
    onAddColumn: () => void;
    onEditColumn: (id: string) => void;
    onDeleteColumn: (id: string) => void;
    onAddCard: (columnId: string) => void;
    onCardClick: (cardId: string) => void;
    onToggle: (id: string, dateStr: string) => void;
    language: 'ru' | 'en';
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    columns, habits, onColumnsChange, onHabitMove,
    onAddColumn, onEditColumn, onDeleteColumn, onAddCard, onCardClick, onToggle,
    language
}) => {
    const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
    const [activeHabit, setActiveHabit] = useState<Habit | null>(null);

    const columnsId = useMemo(() => columns.map(c => c.id), [columns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Column') {
            setActiveColumn(event.active.data.current.column);
            return;
        }
        if (event.active.data.current?.type === 'Habit') {
            setActiveHabit(event.active.data.current.habit);
            return;
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveHabit = active.data.current?.type === 'Habit';
        const isOverHabit = over.data.current?.type === 'Habit';
        const isOverColumn = over.data.current?.type === 'Column';

        // Drop Habit over Column (empty or not)
        if (isActiveHabit && isOverColumn) {
            // Logic handled in onDragEnd usually, but for real-time visual update we might need local state.
            // For simplicity, we just let dnd-kit handle the 'over' detection and do logic in DragEnd
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveHabit(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // 1. Column Sorting
        if (active.data.current?.type === 'Column') {
            if (activeId !== overId) {
                const oldIndex = columns.findIndex(c => c.id === activeId);
                const newIndex = columns.findIndex(c => c.id === overId);
                onColumnsChange(arrayMove(columns, oldIndex, newIndex));
            }
            return;
        }

        // 2. Habit Moving
        if (active.data.current?.type === 'Habit') {
            const activeHabit = active.data.current.habit as Habit;

            // Dropped over another Habit
            if (over.data.current?.type === 'Habit') {
                const overHabit = over.data.current.habit as Habit;
                if (activeHabit.columnId !== overHabit.columnId) {
                    onHabitMove(activeId as string, overHabit.columnId || ''); // Move to new column
                    // Note: Reordering within column requires specific 'order' field in habit which we don't have yet.
                    // We only support moving between columns for now.
                }
            }
            // Dropped over a Column
            else if (over.data.current?.type === 'Column') {
                const overColumnId = overId as string;
                if (activeHabit.columnId !== overColumnId) {
                    onHabitMove(activeId as string, overColumnId);
                }
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] px-4 snap-x snap-mandatory sm:snap-none">
                <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {columns.map((col, index) => {
                        const isFirst = index === 0;
                        const isLast = index === columns.length - 1;

                        const colHabits = habits.filter(h => {
                            if (h.columnId === col.id) return true;
                            if (!h.columnId) {
                                const isCompleted = h.completedDates && h.completedDates.length > 0;
                                if (isCompleted && isLast) return true;
                                if (!isCompleted && isFirst) return true;
                            }
                            return false;
                        });

                        return (
                            <SortableColumn
                                key={col.id}
                                column={col}
                                habits={colHabits}
                                onEdit={onEditColumn}
                                onDelete={onDeleteColumn}
                                onAddCard={onAddCard}
                                onCardClick={onCardClick}
                                onToggle={onToggle}
                                language={language}
                            />
                        );
                    })}
                </SortableContext>

                {/* Add Column Button */}
                <button
                    onClick={onAddColumn}
                    className="w-[75vw] sm:w-[280px] h-[100px] shrink-0 rounded-2xl border-2 border-dashed border-borderSubtle hover:border-brand/50 flex flex-col items-center justify-center text-textSecondary hover:text-brand transition-colors bg-surfaceHighlight/10 snap-start"
                >
                    <Plus size={24} />
                    <span className="font-bold text-sm mt-2">{language === 'ru' ? 'Новая колонка' : 'New Column'}</span>
                </button>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeColumn && (
                    <div className="bg-surface w-[280px] h-[500px] rounded-2xl border border-brand shadow-xl opacity-90 p-4">
                        <h3 className="font-bold">{activeColumn.title}</h3>
                    </div>
                )}
                {activeHabit && (
                    <div className="bg-surface w-[260px] p-3 rounded-xl border border-brand shadow-xl cursor-grabbing">
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-xl"><Icon name={activeHabit.icon} size={20} /></span>
                        </div>
                        <h4 className="font-bold text-sm text-textPrimary">{activeHabit.name}</h4>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
