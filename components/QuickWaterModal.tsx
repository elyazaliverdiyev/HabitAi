/**
 * QuickWaterModal — Быстрое и элегантное логирование воды в стиле Harvee App.
 * 
 * Особенности:
 * - Удобное добавление и убавление (+250 / -250 / +500 / -500 / Сброс)
 * - Прямой ввод любого значения (мл или литры)
 * - Кнопка редактирования привычки (переход в полные настройки)
 * - Плавный анимированный уровень воды
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, X, Plus, Minus, Check, Sparkles, Settings, RotateCcw } from 'lucide-react';
import { Habit } from '../types';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface QuickWaterModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onSaveProgress: (amount: number, unit: 'ml' | 'L') => void;
  onEditHabit?: (habit: Habit) => void;
  language?: 'ru' | 'en';
  todayStr: string;
}

export const QuickWaterModal: React.FC<QuickWaterModalProps> = ({
  habit,
  isOpen,
  onClose,
  onSaveProgress,
  onEditHabit,
  language = 'ru',
  todayStr
}) => {
  const currentAmount = habit.dailyProgress?.[todayStr] !== undefined
    ? habit.dailyProgress[todayStr]
    : (habit.completedDates.includes(todayStr) ? (habit.targetCount || 2000) : 0);
  const target = habit.targetCount || habit.ultimateTarget || 2000;
  
  const [amount, setAmount] = useState<number>(currentAmount);
  const [unit, setUnit] = useState<'ml' | 'L'>((habit.dailyUnit as 'ml' | 'L') || 'ml');

  const addAmount = (delta: number) => {
    setAmount(prev => Math.max(0, prev + delta));
  };

  const handleSave = () => {
    onSaveProgress(amount, unit);
    onClose();
  };

  if (!isOpen) return null;

  const pct = Math.min(100, Math.round((amount / target) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={motionControl}
          className="relative w-full max-w-sm rounded-3xl p-6 overflow-hidden z-10"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Droplets size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-textPrimary leading-tight">
                  {language === 'ru' ? 'Трекер воды' : 'Water Tracker'}
                </h3>
                <span className="text-[11px] font-semibold text-textSecondary">
                  {language === 'ru' ? `Цель: ${target.toLocaleString()} мл` : `Goal: ${target.toLocaleString()} ml`}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {onEditHabit && (
                <button
                  onClick={() => {
                    onClose();
                    onEditHabit(habit);
                  }}
                  className="p-1.5 rounded-full text-textSecondary hover:bg-surfaceHighlight hover:text-textPrimary transition-colors"
                  title={language === 'ru' ? 'Редактировать привычку' : 'Edit habit'}
                >
                  <Settings size={17} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-textSecondary hover:bg-surfaceHighlight hover:text-textPrimary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Water Bottle Visualization & Direct Input */}
          <div className="flex flex-col items-center my-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <input
                type="number"
                min="0"
                step={unit === 'L' ? '0.1' : '50'}
                value={unit === 'L' ? (amount / 1000).toFixed(2) : amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAmount(unit === 'L' ? Math.round(val * 1000) : Math.round(val));
                }}
                className="w-28 text-3xl font-black text-center text-textPrimary bg-surfaceHighlight/50 border border-borderSubtle rounded-2xl py-1 outline-none focus:border-blue-500 tabular-nums"
              />
              <span className="text-base font-bold text-textSecondary">{unit}</span>
            </div>

            <span className="text-xs font-bold text-blue-500">
              {pct}% {language === 'ru' ? 'от нормы' : 'of goal'}
            </span>

            {/* Visual Level Bar */}
            <div className="w-full h-3.5 bg-surfaceHighlight rounded-full mt-3 overflow-hidden relative p-0.5 border border-borderSubtle">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={motionControl}
              />
            </div>
          </div>

          {/* Unit Toggle & Quick Reset */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-1 bg-surfaceHighlight p-1 rounded-xl border border-borderSubtle">
              <button
                onClick={() => setUnit('ml')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  unit === 'ml' ? 'bg-surface text-brand shadow-sm' : 'text-textSecondary'
                }`}
              >
                мл
              </button>
              <button
                onClick={() => setUnit('L')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  unit === 'L' ? 'bg-surface text-brand shadow-sm' : 'text-textSecondary'
                }`}
              >
                Литры
              </button>
            </div>

            <button
              onClick={() => setAmount(0)}
              disabled={amount === 0}
              className="flex items-center gap-1 text-[11px] font-bold text-textSecondary hover:text-red-500 disabled:opacity-30 transition-colors"
            >
              <RotateCcw size={12} /> {language === 'ru' ? 'Сброс (0 мл)' : 'Reset (0 ml)'}
            </button>
          </div>

          {/* Quick Add Buttons */}
          <div className="mb-2">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-1.5 pl-1">
              {language === 'ru' ? 'Добавить воду:' : 'Add Water:'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '+250', val: 250, desc: 'Стакан' },
                { label: '+500', val: 500, desc: 'Бутылка' },
                { label: '+750', val: 750, desc: 'Фляга' },
                { label: '+1000', val: 1000, desc: '1 Литр' },
              ].map((btn) => (
                <button
                  key={`add-${btn.val}`}
                  onClick={() => addAmount(btn.val)}
                  className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 transition-all active:scale-95 flex flex-col items-center group"
                >
                  <span className="text-xs font-black">{btn.label}</span>
                  <span className="text-[8px] opacity-75">{btn.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Subtract Buttons */}
          <div className="mb-5">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-1.5 pl-1">
              {language === 'ru' ? 'Убрать / Убавить:' : 'Subtract:'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[-100, -250, -500].map((delta) => (
                <button
                  key={`sub-${delta}`}
                  onClick={() => addAmount(delta)}
                  disabled={amount <= 0}
                  className="py-1.5 rounded-xl bg-surfaceHighlight hover:bg-red-500/10 hover:text-red-500 border border-borderSubtle disabled:opacity-30 text-textSecondary font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Minus size={12} />
                  <span>{Math.abs(delta)} мл</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center gap-2">
            {onEditHabit && (
              <button
                onClick={() => {
                  onClose();
                  onEditHabit(habit);
                }}
                className="px-3.5 py-3 rounded-2xl bg-surfaceHighlight hover:bg-surface border border-borderSubtle text-textSecondary hover:text-textPrimary text-xs font-bold flex items-center gap-1.5 transition-colors"
                title={language === 'ru' ? 'Редактировать привычку' : 'Edit habit'}
              >
                <Settings size={15} />
                {language === 'ru' ? 'Настройки' : 'Edit'}
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-2xl bg-brand text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
            >
              <Check size={16} strokeWidth={3} />
              {language === 'ru' ? 'Сохранить прогресс' : 'Save Progress'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickWaterModal;

