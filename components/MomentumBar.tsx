/**
 * MomentumBar — заменяет жёсткий стрик-счётчик.
 * Показывает 30-дневный импульс (Momentum Score) вместо «дней подряд».
 * Никогда не обнуляется от одного пропуска.
 */
import React from 'react';
import { motion } from 'framer-motion';
import type { OverallMomentum } from '../services/engines';

interface MomentumBarProps {
  momentum: OverallMomentum;
  language: 'ru' | 'en';
  onClick?: () => void;
}

const GRADE_CONFIG = {
  S: { color: '#f97316', glow: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.1)' },
  A: { color: '#a78bfa', glow: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.1)' },
  B: { color: '#34d399', glow: 'rgba(52,211,153,0.25)', bg: 'rgba(52,211,153,0.08)' },
  C: { color: '#60a5fa', glow: 'rgba(96,165,250,0.25)', bg: 'rgba(96,165,250,0.08)' },
  D: { color: '#9ca3af', glow: 'transparent', bg: 'rgba(156,163,175,0.08)' },
} as const;

const TREND_ICONS = {
  rising:   '↑',
  stable:   '→',
  declining:'↓',
} as const;

const TREND_COLORS = {
  rising:   '#34d399',
  stable:   'var(--text-secondary)',
  declining:'#f87171',
} as const;

// Метки по грейду (OverallMomentum не содержит label, выводим из grade)
const GRADE_LABELS: Record<string, { ru: string; en: string }> = {
  S: { ru: 'Легенда',           en: 'Legend' },
  A: { ru: 'Сильный импульс',   en: 'Strong Momentum' },
  B: { ru: 'Хороший прогресс',  en: 'Good Progress' },
  C: { ru: 'Строим основу',     en: 'Building Base' },
  D: { ru: 'Начни сейчас',      en: 'Start Now' },
};

const MomentumBar: React.FC<MomentumBarProps> = ({ momentum, language, onClick }) => {
  const cfg = GRADE_CONFIG[momentum.grade];
  const gradeLabel = GRADE_LABELS[momentum.grade] ?? { ru: '', en: '' };
  const label = language === 'ru' ? gradeLabel.ru : gradeLabel.en;
  const msg = momentum.message
    ? (language === 'ru' ? momentum.message.ru : momentum.message.en)
    : '';


  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        boxShadow: `0 2px 20px ${cfg.glow}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Левая часть: грейд + лейбл */}
        <div className="flex items-center gap-3">
          {/* Большая буква грейда */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl shrink-0"
            style={{
              background: `${cfg.color}18`,
              color: cfg.color,
              border: `2px solid ${cfg.color}40`,
              boxShadow: `0 0 16px ${cfg.glow}`,
            }}
          >
            {momentum.grade}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-black"
                style={{ color: cfg.color }}
              >
                {label}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: TREND_COLORS[momentum.trend] }}
              >
                {TREND_ICONS[momentum.trend]}
              </span>
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {language === 'ru' ? '30-дневный импульс' : '30-day momentum'}
            </div>
          </div>
        </div>

        {/* Правая часть: числовой score + progress arc */}
        <div className="shrink-0 flex flex-col items-end">
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-2xl font-black tabular-nums"
              style={{ color: cfg.color }}
            >
              {momentum.overallScore}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--text-secondary)' }}
            >
              /100
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="mt-3 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-highlight)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${momentum.overallScore}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})`,
            boxShadow: `0 0 8px ${cfg.glow}`,
          }}
        />
      </div>

      {/* Сообщение */}
      {msg && (
        <p
          className="text-[10px] mt-2 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {msg}
        </p>
      )}

      {/* Never Miss Twice предупреждение */}
      {momentum.atRiskHabitIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.25)',
          }}
        >
          <span className="text-xs">⚠️</span>
          <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
            {language === 'ru'
              ? `${momentum.atRiskHabitIds.length} привычки пропущены 2 дня подряд — не допусти третий`
              : `${momentum.atRiskHabitIds.length} habits missed 2 days in a row — don't miss a third`}
          </span>
        </motion.div>
      )}
    </motion.button>
  );
};

export default MomentumBar;
