import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Circle, Zap } from 'lucide-react';
import { Habit, getCurrentStreak } from '../types';
import { getLocalDateString } from '../utils/helpers';
import HabitCircle from './HabitCircle';
import PerfectDayScreen from './PerfectDayScreen';
import EveningCoachWidget from './EveningCoachWidget';
import WeeklyProgressWidget from './WeeklyProgressWidget';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface CirclesHomeViewProps {
  habits: Habit[];                             // all active habits for today
  accentColor: string;
  language: 'ru' | 'en';
  onToggle: (habitId: string, dateStr: string) => void;
  onOpenHabit: (habit: Habit) => void;
  onAddHabit: () => void;
  userRewards?: { totalXP: number };
  userName?: string;
  userAvatar?: string;
  apiKey?: string;
  isPro?: boolean;
}

// ---------------------------------------------------------------
// Motivational quotes based on progress
// ---------------------------------------------------------------
const getMotivation = (pct: number, language: 'ru' | 'en'): string => {
  if (language === 'ru') {
    if (pct === 0) return 'Начни — и импульс появится сам 🚀';
    if (pct < 30) return 'Хорошее начало! Продолжай 💪';
    if (pct < 60) return 'Ты на верном пути. Не останавливайся ⚡';
    if (pct < 90) return 'Финишная прямая! Ты почти у цели 🔥';
    if (pct < 100) return 'Последний шаг до идеального дня! ✨';
    return 'Идеальный день завершён! 🎉';
  } else {
    if (pct === 0) return 'Start and the momentum will come 🚀';
    if (pct < 30) return 'Good start! Keep going 💪';
    if (pct < 60) return 'You\'re on the right track ⚡';
    if (pct < 90) return 'Almost there! Push through 🔥';
    if (pct < 100) return 'One more step to a perfect day! ✨';
    return 'Perfect day complete! 🎉';
  }
};

// ---------------------------------------------------------------
// Animated progress arc (SVG)
// ---------------------------------------------------------------
const ProgressArc: React.FC<{ pct: number; size: number; accent: string; stroke?: number }> = ({
  pct, size, accent, stroke = 8
}) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const uid = React.useRef(`pa-${Math.random().toString(36).slice(2)}`).current;

  // Lighten accent for gradient end
  const accentLight = accent + 'cc';

  return (
    <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse"
          x1={size / 2} y1={0} x2={0} y2={size}>
          <stop offset="0%"   stopColor={accent} />
          <stop offset="100%" stopColor={accentLight} />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={`${accent}18`} strokeWidth={stroke} strokeLinecap="round" />
      {/* Fill */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={`url(#${uid}-g)`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - filled }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 ${stroke}px ${accent}70)` }}
      />
    </svg>
  );
};

// ---------------------------------------------------------------
// Daily score header
// ---------------------------------------------------------------
const DailyHeader: React.FC<{
  done: number;
  total: number;
  bestStreak: number;
  language: 'ru' | 'en';
  accent: string;
}> = ({ done, total, bestStreak, language, accent }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const now = new Date();
  const days = language === 'ru'
    ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = language === 'ru'
    ? ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;

  return (
    <div style={{
      borderRadius: 24,
      padding: '20px 20px 16px',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(40px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle top gradient glow */}
      <div style={{
        position: 'absolute',
        top: -40, left: '30%', right: '30%',
        height: 80,
        background: `radial-gradient(ellipse, ${accent}25, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <ProgressArc pct={pct} size={72} accent={accent} stroke={5} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 0,
          }}>
            <span style={{
              fontSize: 18, fontWeight: 900, color: 'var(--text-primary)',
              lineHeight: 1,
            }}>{pct}%</span>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
            {dateStr}
          </div>
          <motion.div
            key={Math.floor(pct / 10)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              marginBottom: 8,
            }}
          >
            {getMotivation(pct, language)}
          </motion.div>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.06)', borderRadius: 8,
              padding: '3px 8px',
            }}>
              <Circle size={9} color={accent} fill={accent} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                {done}/{total}
              </span>
            </div>
            {bestStreak > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(249,115,22,0.1)', borderRadius: 8,
                padding: '3px 8px',
              }}>
                <Flame size={9} color="#f97316" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>
                  {bestStreak} {language === 'ru' ? 'дн' : 'd'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 12,
        height: 3, background: 'rgba(255,255,255,0.06)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <motion.div
          style={{ height: '100%', borderRadius: 4, background: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Main CirclesHomeView
// ---------------------------------------------------------------
const CirclesHomeView: React.FC<CirclesHomeViewProps> = ({
  habits,
  accentColor,
  language,
  onToggle,
  onOpenHabit,
  onAddHabit,
  apiKey,
  isPro = false,
}) => {
  const todayStr = getLocalDateString();
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(-1);

  const completed = useMemo(() =>
    habits.filter(h => h.completedDates.includes(todayStr)).length,
    [habits, todayStr]
  );
  const total = habits.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const bestStreak = useMemo(() =>
    Math.max(0, ...habits.map(h => getCurrentStreak(h))),
    [habits]
  );

  // Trigger perfect day when all done
  const handleToggle = useCallback((habitId: string, dateStr: string) => {
    onToggle(habitId, dateStr);
    const newCompleted = habits.filter(h =>
      h.id === habitId
        ? !h.completedDates.includes(dateStr)
        : h.completedDates.includes(dateStr)
    ).length;

    if (newCompleted === total && total > 0 && prevCompleted !== total) {
      setTimeout(() => setShowPerfectDay(true), 400);
    }
    setPrevCompleted(newCompleted);
  }, [habits, total, prevCompleted, onToggle]);

  // Group habits: incomplete first, then completed
  const sortedHabits = useMemo(() => {
    const incomplete = habits.filter(h => !h.completedDates.includes(todayStr));
    const done = habits.filter(h => h.completedDates.includes(todayStr));
    return [...incomplete, ...done];
  }, [habits, todayStr]);

  if (habits.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 20px', textAlign: 'center', gap: 16,
      }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 64 }}
        >
          🌱
        </motion.div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
          {language === 'ru' ? 'Начни свой путь' : 'Start your journey'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 240, lineHeight: 1.5 }}>
          {language === 'ru'
            ? 'Добавь первую привычку и сделай сегодняшний день лучше'
            : 'Add your first habit and make today better'}
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAddHabit}
          style={{
            marginTop: 8,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            borderRadius: 14,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
            color: '#fff',
            fontWeight: 700, fontSize: 14,
            border: 'none', cursor: 'pointer',
            boxShadow: `0 8px 24px ${accentColor}44`,
          }}
        >
          <Plus size={18} />
          {language === 'ru' ? 'Добавить привычку' : 'Add Habit'}
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Perfect Day Celebration */}
      <PerfectDayScreen
        show={showPerfectDay}
        onDismiss={() => setShowPerfectDay(false)}
        language={language}
        accentColor={accentColor}
        habitCount={total}
        streak={bestStreak}
      />

      {/* Header */}
      <DailyHeader
        done={completed}
        total={total}
        bestStreak={bestStreak}
        language={language}
        accent={accentColor}
      />

      {/* Weekly chart */}
      <div style={{ marginBottom: 20 }}>
        <WeeklyProgressWidget
          habits={habits}
          language={language}
          accentColor={accentColor}
        />
      </div>

      {/* Section label */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingLeft: 4,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 800,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          <Zap size={11} style={{ color: accentColor }} />
          {language === 'ru' ? 'Сегодня' : "Today's Habits"}
          <span style={{
            background: `${accentColor}22`,
            color: accentColor,
            borderRadius: 6,
            padding: '1px 6px',
            fontSize: 9,
            fontWeight: 800,
          }}>
            {completed}/{total}
          </span>
        </div>

        {/* Add button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={onAddHabit}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px',
            borderRadius: 10,
            background: `${accentColor}18`,
            color: accentColor,
            fontWeight: 700, fontSize: 11,
            border: `1px solid ${accentColor}30`,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} />
          {language === 'ru' ? 'Добавить' : 'Add'}
        </motion.button>
      </div>

      {/* Circles grid */}
      <motion.div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px 8px',
          justifyContent: 'flex-start',
          paddingBottom: 8,
        }}
        layout
      >
        <AnimatePresence>
          {sortedHabits.map((habit, i) => {
            const isCompleted = habit.completedDates.includes(todayStr);
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{
                  opacity: isCompleted ? 0.7 : 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.7, y: -10 }}
                transition={motionControl}
              >
                <HabitCircle
                  habit={habit}
                  accentColor={accentColor}
                  onToggle={handleToggle}
                  onClick={() => onOpenHabit(habit)}
                  todayStr={todayStr}
                  size="md"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Completed separator */}
      {completed > 0 && completed < total && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 8,
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span>{language === 'ru' ? `${completed} выполнено` : `${completed} done`}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </motion.div>
      )}

      {/* All done state (no confetti overlay) */}
      {completed === total && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: '16px 20px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
            border: `1px solid ${accentColor}30`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            {language === 'ru' ? 'Все привычки выполнены!' : 'All habits complete!'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            {language === 'ru' ? 'Ты строишь лучшую версию себя каждый день' : 'You\'re building your best self every day'}
          </div>
        </motion.div>
      )}

      {/* Evening AI Coach */}
      <div style={{ marginTop: 20 }}>
        <EveningCoachWidget
          habits={habits}
          language={language}
          accentColor={accentColor}
          apiKey={apiKey}
          isPro={isPro}
        />
      </div>
    </div>
  );
};

export default CirclesHomeView;
