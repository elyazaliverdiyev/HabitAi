/**
 * HarveeStateSlider — Горизонтальный сегментированный слайдер состояния дня в стиле Harvee.
 * 
 * Отображает:
 * - Уровень энергии / фокуса (на основе циркадного движка или ручного выбора)
 * - Рекомендацию дня
 * - Плавный скользящий переключатель с подсвеченным кружком-бегунком
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, Zap, Coffee, BatteryCharging, Sunset } from 'lucide-react';
import { useSolarCountdown } from '../hooks/useSolarCountdown';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate, motionLayout } from '../utils/motionPresets';

export type DayStateType = 'focus' | 'balance' | 'recovery';

interface HarveeStateSliderProps {
  initialState?: DayStateType;
  recommendation?: string;
  language?: 'ru' | 'en';
  onStateChange?: (state: DayStateType) => void;
  accentColor?: string;
}

const STATES: { id: DayStateType; label: { ru: string; en: string }; icon: any; color: string; desc: { ru: string; en: string } }[] = [
  {
    id: 'focus',
    label: { ru: 'Высокий фокус', en: 'High Focus' },
    icon: Zap,
    color: '#8B5CF6',
    desc: {
      ru: 'Идеальное время для сложных задач, тренировки и глубокой концентрации.',
      en: 'Optimal time for complex tasks, intense workouts, and deep focus.'
    }
  },
  {
    id: 'balance',
    label: { ru: 'Баланс', en: 'Balanced' },
    icon: Sun,
    color: '#10B981',
    desc: {
      ru: 'Умеренный темп. Держи ровный ритм и выполняй привычки по плану.',
      en: 'Steady state. Maintain a smooth rhythm and complete daily habits.'
    }
  },
  {
    id: 'recovery',
    label: { ru: 'Восстановление', en: 'Recovery' },
    icon: Moon,
    color: '#3B82F6',
    desc: {
      ru: 'Время для отдыха, чтения и легкой разгрузки. Не перегружай себя.',
      en: 'Time for rest, reading, and gentle recovery. Keep it light.'
    }
  }
];

export const HarveeStateSlider: React.FC<HarveeStateSliderProps> = ({
  initialState = 'focus',
  recommendation,
  language = 'ru',
  onStateChange,
  accentColor = '#8B5CF6'
}) => {
  const [selectedState, setSelectedState] = useState<DayStateType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('habitai_day_state') as DayStateType;
      if (saved && ['focus', 'balance', 'recovery'].includes(saved)) {
        return saved;
      }
    }
    return initialState;
  });

  const currentState = STATES.find(s => s.id === selectedState) || STATES[0];
  const activeIndex = STATES.findIndex(s => s.id === selectedState);

  // Реальный астрономический отсчёт до следующего циркадного окна (GPS + NOAA)
  const solar = useSolarCountdown(language);

  const handleSelect = (stateId: DayStateType) => {
    setSelectedState(stateId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('habitai_day_state', stateId);
    }
    if (onStateChange) onStateChange(stateId);
  };

  return (
    <div
      className="p-5 rounded-3xl mb-3 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Subtle top ambient glow */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-16 pointer-events-none opacity-20 transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse at center top, ${currentState.color} 0%, transparent 70%)`
        }}
      />

      {/* Header text */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-textSecondary uppercase">
          {language === 'ru' ? 'Состояние дня' : 'Day State'}
        </span>
        <div className="flex items-center gap-1">
          <currentState.icon size={13} style={{ color: currentState.color }} />
          <span className="text-[11px] font-bold" style={{ color: currentState.color }}>
            {currentState.label[language]}
          </span>
        </div>
      </div>

      {/* Large Title */}
      <h3 className="text-xl font-black tracking-tight text-textPrimary mb-1.5">
        {currentState.label[language]}
      </h3>

      {/* Subtitle / Recommendation */}
      <p className="text-xs text-textSecondary leading-relaxed mb-2">
        {recommendation || currentState.desc[language]}
      </p>

      {/* Солнечный таймер: реальный отсчёт до следующего баракатного окна / заката */}
      {solar.window && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',
            border: '1px solid rgba(251,191,36,0.18)',
          }}
        >
          <Sunset size={14} className="shrink-0" style={{ color: '#f59e0b' }} />
          <span className="text-[11px] font-semibold text-textSecondary leading-snug">
            {language === 'ru' ? (
              <>До времени <span className="font-black" style={{ color: '#f59e0b' }}>{solar.window.label.ru}</span>{' '}
                ({solar.window.hint.ru}) осталось{' '}
                <span className="font-black tabular-nums" style={{ color: '#f59e0b' }}>{solar.countdown}</span></>
            ) : (
              <>Time until <span className="font-black" style={{ color: '#f59e0b' }}>{solar.window.label.en}</span>{' '}
                ({solar.window.hint.en}):{' '}
                <span className="font-black tabular-nums" style={{ color: '#f59e0b' }}>{solar.countdown}</span></>
            )}
            <span className="opacity-60 ml-1.5">· {solar.atTime}</span>
          </span>
        </div>
      )}

      {/* Segmented Pill Track with Sliding Knob */}
      <div className="relative flex items-center justify-between p-1 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle/50">
        {STATES.map((state, index) => {
          const isSelected = selectedState === state.id;
          return (
            <button
              key={state.id}
              onClick={() => handleSelect(state.id)}
              className="relative flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 z-10 transition-colors"
            >
              {isSelected && (
                <motion.div
                  layoutId="harvee-state-knob"
                  className="absolute inset-0 rounded-xl shadow-md"
                  style={{
                    background: `${state.color}20`,
                    border: `1.5px solid ${state.color}60`,
                    boxShadow: `0 2px 12px ${state.color}30`
                  }}
                  transition={motionLayout}
                >
                  {/* Glowing center indicator dot */}
                  <div
                    className="absolute top-1/2 left-2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      background: state.color,
                      boxShadow: `0 0 6px ${state.color}`
                    }}
                  />
                </motion.div>
              )}
              <span
                className={`text-xs font-bold transition-colors ${
                  isSelected ? 'text-textPrimary pl-2.5' : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {state.label[language]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HarveeStateSlider;
