import React from 'react';
import { Activity, ChevronRight, Footprints, Play, Pause, AlertTriangle } from 'lucide-react';
import ActivityRings from './ActivityRings';

interface HarveeFitnessCardProps {
  movePercent: number;
  streakPercent: number;
  xpPercent: number;
  streakDays: number;
  totalXP: number;
  stepsToday?: number;
  isTrackingSteps?: boolean;
  onToggleStepTracking?: () => void;
  onOpenModal: () => void;
  language?: 'ru' | 'en';
  /** Детектор простоя: показывается, когда шагомер активен, но движения нет ≥90 мин днём */
  sedentaryMinutes?: number;
}

export const HarveeFitnessCard: React.FC<HarveeFitnessCardProps> = ({
  movePercent,
  streakPercent,
  xpPercent,
  streakDays,
  totalXP,
  stepsToday = 0,
  isTrackingSteps = false,
  onToggleStepTracking,
  onOpenModal,
  language = 'ru',
  sedentaryMinutes
}) => {
  return (
    <div
      className="p-5 rounded-3xl mb-3 relative overflow-hidden flex items-center justify-between group transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-15 transition-opacity group-hover:opacity-25"
        style={{
          background: 'radial-gradient(circle at 80% 20%, #FF0534 0%, #2ECC09 50%, transparent 70%)'
        }}
      />

      {/* Left side: Header + 3 Metric Columns */}
      <div className="flex-1 min-w-0 pr-4">
        {/* Header with Step Sensor Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div
            onClick={onOpenModal}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Activity size={14} className="text-textSecondary" />
            <span className="text-[11px] font-semibold tracking-wider text-textSecondary uppercase">
              {language === 'ru' ? 'Активность' : 'Fitness'}
            </span>
            <ChevronRight size={12} className="text-textSecondary opacity-40" />
          </div>

          {/* Hardware Step Tracking Pill */}
          {onToggleStepTracking && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStepTracking();
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                isTrackingSteps
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm'
                  : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary border border-borderSubtle'
              }`}
              title={language === 'ru' ? 'Включить датчик шагов смартфона' : 'Toggle phone step sensor'}
            >
              <Footprints size={12} className={isTrackingSteps ? 'animate-pulse' : ''} />
              <span>
                {stepsToday > 0
                  ? `${stepsToday.toLocaleString()} ${language === 'ru' ? 'шагов' : 'steps'}`
                  : (isTrackingSteps ? (language === 'ru' ? 'Сенсор активен' : 'Sensor on') : (language === 'ru' ? 'Сенсор шагов' : 'Step sensor'))}
              </span>
            </button>
          )}
        </div>

        {/* 3 Columns in a Row */}
        <div
          onClick={onOpenModal}
          className="grid grid-cols-3 gap-2 cursor-pointer"
        >
          {/* Move */}
          <div>
            <div className="text-[10px] font-semibold text-textSecondary mb-0.5">
              {language === 'ru' ? 'Движение' : 'Move'}
            </div>
            <div className="text-base font-black text-textPrimary tabular-nums">
              {Math.round(movePercent)}%
            </div>
          </div>

          {/* Streaks */}
          <div>
            <div className="text-[10px] font-semibold text-textSecondary mb-0.5">
              {language === 'ru' ? 'Стрики' : 'Streak'}
            </div>
            <div className="text-base font-black text-textPrimary tabular-nums">
              {streakDays} <span className="text-[10px] font-normal opacity-60">{language === 'ru' ? 'дн' : 'd'}</span>
            </div>
          </div>

          {/* XP */}
          <div>
            <div className="text-[10px] font-semibold text-textSecondary mb-0.5">
              {language === 'ru' ? 'Опыт' : 'XP'}
            </div>
            <div className="text-base font-black text-textPrimary tabular-nums">
              {totalXP}
            </div>
          </div>
        </div>

        {/* Sedentary Reminder: шагомер активен, но движения нет ≥90 мин днём */}
        {sedentaryMinutes !== undefined && sedentaryMinutes >= 90 && (
          <div
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl animate-fadeIn"
            style={{
              background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <AlertTriangle size={14} className="text-amber-500 shrink-0 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-600 leading-snug">
              {language === 'ru'
                ? `Нет движения ${sedentaryMinutes} мин — время размяться! 2 минуты ходьбы перезапустят энергию.`
                : `No movement for ${sedentaryMinutes} min — time to stretch! 2 minutes of walking will reboot your energy.`}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Compact Apple Watch Rings */}
      <div onClick={onOpenModal} className="shrink-0 cursor-pointer">
        <ActivityRings
          movePercent={movePercent}
          streakPercent={streakPercent}
          xpPercent={xpPercent}
          size={72}
          showLabels={false}
          language={language}
        />
      </div>
    </div>
  );
};

export default HarveeFitnessCard;
