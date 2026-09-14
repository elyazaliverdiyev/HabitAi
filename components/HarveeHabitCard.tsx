/**
 * HarveeHabitCard — Минималистичная карточка привычки в стиле Harvee App.
 *
 * Особенности:
 * - Верх: Аккуратная контурная иконка Lucide + Название привычки
 * - Центр: Крупное четкое значение (прогресс, объем или счетчик)
 * - Низ: Статус выполнения
 * - Справа: Apple-style вертикальный Swipe-переключатель (см. HabitCheckSlider)
 */
import React from 'react';
import { Droplets, BookOpen, Footprints, Coffee, Heart, Sparkles, Brain, Sun, Dumbbell, Clock } from 'lucide-react';
import { Habit } from '../types';
import HabitCheckSlider from './HabitCheckSlider';

interface HarveeHabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  onClick: (habit: Habit) => void;
  language?: 'ru' | 'en';
  accentColor?: string;
  todayStr?: string;
}

// Icon mapping to clean Lucide icons instead of raw emojis
function getMinimalIcon(name: string, iconName?: string) {
  const lower = (name + ' ' + (iconName || '')).toLowerCase();
  if (lower.includes('вод') || lower.includes('water') || lower.includes('drink')) return Droplets;
  if (lower.includes('книг') || lower.includes('read') || lower.includes('book')) return BookOpen;
  if (lower.includes('шаг') || lower.includes('walk') || lower.includes('step')) return Footprints;
  if (lower.includes('кофе') || lower.includes('coffee') || lower.includes('caffeine')) return Coffee;
  if (lower.includes('медит') || lower.includes('mind') || lower.includes('peace')) return Brain;
  if (lower.includes('спорт') || lower.includes('gym') || lower.includes('тренир') || lower.includes('fit')) return Dumbbell;
  if (lower.includes('сердц') || lower.includes('heart') || lower.includes('health')) return Heart;
  if (lower.includes('утро') || lower.includes('morning') || lower.includes('sun')) return Sun;
  return Sparkles;
}

export const HarveeHabitCard: React.FC<HarveeHabitCardProps> = ({
  habit,
  isCompleted,
  onToggle,
  onClick,
  language = 'ru',
  accentColor,
  todayStr = new Date().toISOString().split('T')[0]
}) => {
  const IconComponent = getMinimalIcon(habit.name, habit.icon);
  const color = habit.color || accentColor || '#3B82F6';
  
  // Find active book from reading extension if any
  const activeBook = habit.extension?.data?.books?.find(b => b.status === 'reading');
  const dailyProg = habit.dailyProgress?.[todayStr];

  // Progress percent calculation: based on DAILY goal so user gets daily dopamine win
  const getProgressPercent = () => {
    // 1. Reading habit with active book or daily pages target
    const lower = habit.name.toLowerCase();
    if (activeBook || lower.includes('книг') || lower.includes('чита') || lower.includes('read')) {
      const dailyTarget = habit.targetCount || habit.ultimateTarget || 15; // default 15 pages/day
      if (dailyProg !== undefined && dailyProg > 0) {
        return Math.min(100, Math.round((dailyProg / dailyTarget) * 100));
      }
      return isCompleted ? 100 : 0;
    }

    // 2. Numeric progress (water, steps, minutes, etc.)
    if (dailyProg !== undefined) {
      const target = habit.targetCount || habit.ultimateTarget || 100;
      return Math.min(100, Math.round((dailyProg / target) * 100));
    }

    return isCompleted ? 100 : 0;
  };

  const progressPercent = getProgressPercent();

  // Dynamic Status badge with vibrant Dopamine labels
  const getStatus = () => {
    if (progressPercent >= 100 || isCompleted) {
      return {
        label: language === 'ru' ? '↑ Выполнено!' : '↑ Completed!',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.16)'
      };
    }
    if (progressPercent > 0) {
      return {
        label: `${progressPercent}% ${language === 'ru' ? 'готово' : 'done'}`,
        color: color || '#3B82F6',
        bg: `${color}20`
      };
    }
    return {
      label: language === 'ru' ? '○ Начни сегодня' : '○ Start today',
      color: 'var(--text-secondary)',
      bg: 'var(--surface-highlight)'
    };
  };

  const status = getStatus();

  // Smart value and unit detection based on habit type/extension
  const getSmartDisplay = () => {
    const lower = habit.name.toLowerCase();
    const prog = habit.dailyProgress?.[todayStr];

    // 1. Reading habit with active book
    if (activeBook) {
      const dailyTarget = habit.targetCount || 15;
      const todayRead = prog || (isCompleted ? dailyTarget : 0);
      return {
        value: `${todayRead}`,
        target: `/${dailyTarget}`,
        unit: language === 'ru' ? 'стр/день' : 'pg/day',
        subtitle: `${activeBook.title} (${activeBook.currentPage}/${activeBook.totalPages} стр)`
      };
    }

    // 2. Reading habit general
    if (lower.includes('книг') || lower.includes('чита') || lower.includes('read')) {
      const target = habit.targetCount || habit.ultimateTarget || 15;
      const val = prog !== undefined ? prog : (isCompleted ? target : 0);
      return {
        value: `${val}`,
        target: `/${target}`,
        unit: language === 'ru' ? 'стр' : 'pg',
        subtitle: undefined
      };
    }

    // 3. Water habit (support Liters / ml)
    if (lower.includes('вод') || lower.includes('water')) {
      const target = habit.targetCount || habit.ultimateTarget || 2000;
      const val = prog !== undefined ? prog : (isCompleted ? target : 0);
      if (habit.dailyUnit === 'L' || target <= 10) {
        return {
          value: (val / (val > 10 ? 1000 : 1)).toFixed(1),
          target: `/${(target / (target > 10 ? 1000 : 1)).toFixed(1)}`,
          unit: 'L',
          subtitle: undefined
        };
      }
      return {
        value: `${val.toLocaleString()}`,
        target: `/${target.toLocaleString()}`,
        unit: 'ml',
        subtitle: undefined
      };
    }

    // 4. Steps habit
    if (lower.includes('шаг') || lower.includes('ход') || lower.includes('walk') || lower.includes('step')) {
      const target = habit.targetCount || habit.ultimateTarget || 8000;
      const val = prog !== undefined ? prog : (isCompleted ? target : 0);
      return {
        value: `${val.toLocaleString()}`,
        target: undefined,
        unit: language === 'ru' ? 'шагов' : 'steps',
        subtitle: undefined
      };
    }

    // 5. Mindfulness / Workout with minutes
    if (lower.includes('медит') || lower.includes('тренир') || lower.includes('спорт') || lower.includes('fit')) {
      const target = habit.targetCount || habit.duration || 15;
      const val = prog !== undefined ? prog : (isCompleted ? target : 0);
      return {
        value: `${val}`,
        target: undefined,
        unit: language === 'ru' ? 'мин' : 'min',
        subtitle: undefined
      };
    }

    // 6. General / Percentage habit
    return {
      value: isCompleted ? '100%' : '0%',
      target: undefined,
      unit: '',
      subtitle: undefined
    };
  };

  const smartData = getSmartDisplay();

  // Knob color
  const isDone = progressPercent >= 100 || isCompleted;

  // Время выполнения (из completionLog) — маленьким серым на карточке
  const completedTime = (() => {
    const iso = habit.completionLog?.[todayStr];
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return null; }
  })();
  const knobColor = isDone ? '#10B981' : (progressPercent > 0 ? (color || '#3B82F6') : (color || '#8B5CF6'));

  return (
    <div
      onClick={() => onClick(habit)}
      className="p-4 rounded-3xl relative overflow-hidden flex items-center justify-between cursor-pointer group transition-all duration-300 active:scale-[0.98]"
      style={{
        background: 'var(--surface)',
        border: isDone
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : progressPercent > 0
          ? `1px solid ${knobColor}35`
          : '1px solid var(--border-subtle)',
        boxShadow: isDone
          ? '0 4px 24px rgba(16, 185, 129, 0.15)'
          : progressPercent > 0
          ? `0 4px 18px ${knobColor}15`
          : '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Radiant ambient background glow */}
      {isDone && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-opacity"
          style={{
            background: `radial-gradient(circle at top right, #10B981 0%, transparent 70%)`
          }}
        />
      )}
      {!isDone && progressPercent > 0 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10 transition-opacity"
          style={{
            background: `radial-gradient(circle at top right, ${knobColor} 0%, transparent 70%)`
          }}
        />
      )}

      {/* Left Column: Icon + Name + Value + Status */}
      <div className="flex-1 min-w-0 pr-3">
        {/* Top: Icon + Name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm"
            style={{
              background: isDone
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.12))'
                : progressPercent > 0
                ? `linear-gradient(135deg, ${knobColor}30, ${knobColor}15)`
                : `linear-gradient(135deg, ${knobColor}20, ${knobColor}08)`,
              color: isDone ? '#10B981' : knobColor,
              border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.4)' : knobColor + '30'}`,
              boxShadow: isDone ? '0 0 10px rgba(16, 185, 129, 0.3)' : (progressPercent > 0 ? `0 0 8px ${knobColor}25` : 'none')
            }}
          >
            <IconComponent size={14} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-textSecondary truncate block">
              {smartData.subtitle || habit.name}
            </span>
          </div>
        </div>

        {/* Middle: Prominent Bold Value */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-black tracking-tight text-textPrimary tabular-nums">
            {smartData.value}
          </span>
          {smartData.target && (
            <span className="text-xs font-bold text-textSecondary opacity-60">
              {smartData.target}
            </span>
          )}
          {smartData.unit && (
            <span className="text-[11px] font-semibold text-textSecondary ml-0.5">
              {smartData.unit}
            </span>
          )}
        </div>

        {/* Bottom: Status Badge + время выполнения (серым, незаметно) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: status.bg }}>
            <span className="text-[10px] font-bold" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>
          {isDone && completedTime && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium tabular-nums" style={{ color: 'var(--text-secondary)', opacity: 0.55 }}>
              <Clock size={8} />
              {completedTime}
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Apple-style Swipe Check Slider */}
      <HabitCheckSlider
        progressPercent={progressPercent}
        isCompleted={isCompleted}
        color={knobColor}
        onToggle={() => onToggle(habit.id)}
        language={language}
      />
    </div>
  );
};

export default HarveeHabitCard;
