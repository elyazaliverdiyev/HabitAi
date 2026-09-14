/**
 * HarveeHabitGrid — 2x2 сетка привычек в стиле Harvee App.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Habit } from '../types';
import HarveeHabitCard from './HarveeHabitCard';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface HarveeHabitGridProps {
  habits: Habit[];
  todayStr: string;
  onToggle: (habitId: string) => void;
  onOpenHabit: (habit: Habit) => void;
  onAddHabit: () => void;
  language?: 'ru' | 'en';
  accentColor?: string;
}

export const HarveeHabitGrid: React.FC<HarveeHabitGridProps> = ({
  habits,
  todayStr,
  onToggle,
  onOpenHabit,
  onAddHabit,
  language = 'ru',
  accentColor
}) => {
  return (
    <div className="mb-4">
      {/* Header with Title & Add button */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-semibold tracking-wider text-textSecondary uppercase">
          {language === 'ru' ? 'Привычки дня' : 'Daily Habits'}
        </span>
        <button
          onClick={onAddHabit}
          className="flex items-center gap-1 text-[11px] font-bold text-brand hover:opacity-80 transition-opacity"
        >
          <Plus size={14} />
          {language === 'ru' ? 'Добавить' : 'Add'}
        </button>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => {
            const isCompleted = habit.completedDates.includes(todayStr);
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={motionControl}
              >
                <HarveeHabitCard
                  habit={habit}
                  isCompleted={isCompleted}
                  onToggle={onToggle}
                  onClick={onOpenHabit}
                  language={language}
                  accentColor={accentColor}
                  todayStr={todayStr}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HarveeHabitGrid;
