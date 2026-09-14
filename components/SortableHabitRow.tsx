
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import HabitRow from './HabitRow';
import { Habit } from '../types';
import { GripVertical } from 'lucide-react';

interface SortableHabitRowProps {
  habit: Habit;
  selectedDate: Date;
  onToggleDate: (date: string, e?: React.MouseEvent | React.TouchEvent) => void;
  onClick: () => void;
  currentTime?: string;
  timeFocusMode?: boolean;
  justCompleted?: boolean;
}

export const SortableHabitRow: React.FC<SortableHabitRowProps> = React.memo((props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    touchAction: 'none' // Important for mobile to prevent scrolling while dragging
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-textSecondary/30 hover:text-brand cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <HabitRow {...props} justCompleted={props.justCompleted} />
      </div>
    </div>
  );
}, (prev, next) => (
  prev.habit.id === next.habit.id &&
  prev.habit.name === next.habit.name &&
  prev.habit.completedDates.length === next.habit.completedDates.length &&
  prev.selectedDate.getTime() === next.selectedDate.getTime() &&
  prev.currentTime === next.currentTime &&
  prev.timeFocusMode === next.timeFocusMode &&
  prev.justCompleted === next.justCompleted
));
