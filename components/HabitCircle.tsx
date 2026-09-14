import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { Habit, getCurrentStreak } from '../types';
import Icon from './Icons';
import { getLocalDateString } from '../utils/helpers';
import { Flame } from 'lucide-react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface HabitCircleProps {
  habit: Habit;
  accentColor?: string;
  onToggle: (habitId: string, dateStr: string) => void;
  onClick: () => void;
  todayStr: string;
  justCompleted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Particle component for burst effect
const Particle: React.FC<{
  angle: number;
  distance: number;
  color: string;
  size: number;
}> = ({ angle, distance, color, size }) => {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x,
        y,
        scale: 0,
        opacity: 0,
      }}
      transition={{
        duration: 0.7,
        ease: [0.2, 0, 0.8, 1],
      }}
    />
  );
};

// Ripple ring effect
const RippleRing: React.FC<{ color: string }> = ({ color }) => (
  <motion.div
    style={{
      position: 'absolute',
      inset: -8,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      pointerEvents: 'none',
    }}
    initial={{ opacity: 0.8, scale: 1 }}
    animate={{ opacity: 0, scale: 1.5 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  />
);

const PARTICLE_COLORS_MAP: Record<string, string[]> = {
  '#7c3aed': ['#a78bfa', '#c4b5fd', '#ddd6fe', '#8b5cf6', '#ffffff'],
  '#2563eb': ['#60a5fa', '#93c5fd', '#bfdbfe', '#3b82f6', '#ffffff'],
  '#059669': ['#34d399', '#6ee7b7', '#a7f3d0', '#10b981', '#ffffff'],
  '#dc2626': ['#f87171', '#fca5a5', '#fecaca', '#ef4444', '#ffffff'],
  '#d97706': ['#fbbf24', '#fcd34d', '#fde68a', '#f59e0b', '#ffffff'],
};

const getParticleColors = (accent: string) => {
  return PARTICLE_COLORS_MAP[accent] || ['#a78bfa', '#c4b5fd', '#ddd6fe', '#8b5cf6', '#ffffff'];
};

const HabitCircle: React.FC<HabitCircleProps> = ({
  habit,
  accentColor = '#7c3aed',
  onToggle,
  onClick,
  todayStr,
  size = 'md',
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const isCompleted = habit.completedDates.includes(todayStr);
  const streak = getCurrentStreak(habit);
  const particleColors = getParticleColors(accentColor);

  // Sizes
  const circleSizes = {
    sm: { outer: 64, inner: 52, icon: 20, fontSize: 10 },
    md: { outer: 80, inner: 66, icon: 28, fontSize: 11 },
    lg: { outer: 96, inner: 80, icon: 32, fontSize: 12 },
  };
  const s = circleSizes[size];

  // Spring scale on press
  const scaleSpring = useSpring(1, { stiffness: 550, damping: 36 });

  const handlePointerDown = () => {
    isLongPress.current = false;
    scaleSpring.set(0.88);
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onClick();
    }, 500);
  };

  const handlePointerUp = useCallback(() => {
    scaleSpring.set(1);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      handleToggle();
    }
  }, [isCompleted, todayStr]);

  const handlePointerLeave = () => {
    scaleSpring.set(1);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleToggle = () => {
    if (!isCompleted) {
      // Trigger burst
      setShowParticles(true);
      setRippleKey(k => k + 1);
      setTimeout(() => setShowParticles(false), 800);

      // Haptic via vibration API
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    } else {
      if (navigator.vibrate) navigator.vibrate(5);
    }
    onToggle(habit.id, todayStr);
  };

  // Generate 10 particles in a circle
  const particles = showParticles
    ? Array.from({ length: 10 }, (_, i) => ({
        angle: i * 36 + Math.random() * 20 - 10,
        distance: 40 + Math.random() * 20,
        color: particleColors[i % particleColors.length],
        size: 4 + Math.random() * 4,
      }))
    : [];

  return (
    <div
      className="flex flex-col items-center gap-2 select-none"
      style={{ width: s.outer + 24 }}
    >
      {/* The Circle */}
      <div style={{ position: 'relative', width: s.outer, height: s.outer }}>
        {/* Ripple on complete */}
        <AnimatePresence>
          {showParticles && (
            <RippleRing key={`ripple-${rippleKey}`} color={accentColor} />
          )}
        </AnimatePresence>

        {/* Particles */}
        <AnimatePresence>
          {showParticles && particles.map((p, i) => (
            <Particle key={i} {...p} />
          ))}
        </AnimatePresence>

        {/* Outer glow ring (streak indicator) */}
        {streak >= 3 && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              background: `conic-gradient(${accentColor} ${Math.min(streak / 30 * 100, 100)}%, transparent 0%)`,
              opacity: 0.6,
              filter: `blur(1px) drop-shadow(0 0 6px ${accentColor})`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Main circle button */}
        <motion.button
          style={{
            scale: scaleSpring,
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            border: 'none',
            overflow: 'hidden',
            transition: 'background 0.35s ease, box-shadow 0.35s ease',
            background: isCompleted
              ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
              : 'var(--surface)',
            boxShadow: isCompleted
              ? `0 4px 20px ${accentColor}55, 0 0 0 2px ${accentColor}33, inset 0 1px 0 rgba(255,255,255,0.2)`
              : '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          aria-label={`${isCompleted ? 'Completed' : 'Complete'}: ${habit.name}`}
        >
          {/* Liquid Glass shimmer overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: isCompleted
              ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* Icon or Checkmark */}
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={motionPress}
                style={{ color: '#fff', display: 'flex' }}
              >
                <svg width={s.icon * 0.85} height={s.icon * 0.85} viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 12l5 5L19 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={motionPress}
                style={{ opacity: 0.7 }}
              >
                <Icon name={habit.icon || 'star'} size={s.icon} style={{ color: 'var(--text-primary)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Streak badge */}
        {streak >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              borderRadius: 20,
              padding: '1px 5px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 2px 8px rgba(249,115,22,0.5)',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          >
            <Flame size={9} color="#fff" />
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, lineHeight: 1 }}>
              {streak}
            </span>
          </motion.div>
        )}
      </div>

      {/* Label */}
      <button
        onClick={onClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 4px',
          textAlign: 'center',
          maxWidth: s.outer + 24,
        }}
      >
        <div style={{
          fontSize: s.fontSize,
          fontWeight: 700,
          color: isCompleted ? accentColor : 'var(--text-primary)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: s.outer + 16,
          transition: 'color 0.3s ease',
        }}>
          {habit.name}
        </div>
        {habit.time && (
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
            {habit.time}
          </div>
        )}
      </button>
    </div>
  );
};

export default HabitCircle;
