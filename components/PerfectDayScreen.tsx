import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface PerfectDayScreenProps {
  show: boolean;
  onDismiss: () => void;
  language?: 'ru' | 'en';
  accentColor?: string;
  habitCount?: number;
  streak?: number;
}

// Simple canvas confetti
const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      '#a78bfa', '#7c3aed', '#c4b5fd',
      '#60a5fa', '#34d399', '#fbbf24',
      '#f87171', '#fb923c', '#f0abfc',
      '#ffffff',
    ];

    interface Piece {
      x: number; y: number;
      w: number; h: number;
      color: string;
      vx: number; vy: number;
      rot: number; rotV: number;
      shape: 'rect' | 'circle' | 'star';
    }

    const pieces: Piece[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      shape: ['rect', 'circle', 'star'][Math.floor(Math.random() * 3)] as 'rect' | 'circle' | 'star',
    }));

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const b = a + (2 * Math.PI) / 5;
        ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        ctx.lineTo(x + r * 0.4 * Math.cos(b), y + r * 0.4 * Math.sin(b));
      }
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.w / 2);
        }

        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.05; // gravity
        p.vx *= 0.99; // air resistance
      });

      const stillActive = pieces.some(p => p.y < canvas.height + 20);
      if (stillActive) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

const PerfectDayScreen: React.FC<PerfectDayScreenProps> = ({
  show,
  onDismiss,
  language = 'ru',
  accentColor = '#7c3aed',
  habitCount = 0,
  streak = 0,
}) => {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <ConfettiCanvas />

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            transition={motionPress}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 2,
              borderRadius: 32,
              padding: '40px 48px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(60px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: `
                0 40px 120px rgba(0,0,0,0.4),
                inset 0 1px 0 rgba(255,255,255,0.2),
                0 0 80px ${accentColor}30
              `,
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            {/* Shimmer top edge */}
            <div style={{
              position: 'absolute',
              top: 0, left: '20%', right: '20%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              borderRadius: 1,
            }} />

            {/* Emoji burst */}
            <motion.div
              animate={{
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 0.95, 1.05, 1],
              }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ fontSize: 72, marginBottom: 16 }}
            >
              🎉
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}>
                {language === 'ru' ? 'Идеальный день!' : 'Perfect Day!'}
              </h2>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 8,
                marginBottom: 24,
                lineHeight: 1.4,
              }}
            >
              {language === 'ru'
                ? `Все ${habitCount} привычки выполнены. Ты становишься лучшей версией себя!`
                : `All ${habitCount} habits completed. You're becoming your best self!`
              }
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginBottom: 28,
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
                  {habitCount}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  {language === 'ru' ? 'привычек' : 'habits'}
                </div>
              </div>
              {streak > 0 && (
                <>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f97316' }}>
                      🔥 {streak}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                      {language === 'ru' ? 'день серии' : 'day streak'}
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Dismiss hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5 }}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
            >
              {language === 'ru' ? 'Нажми чтобы закрыть' : 'Tap to dismiss'}
            </motion.div>

            {/* Progress bar countdown */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: 3,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '0 0 32px 32px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{ height: '100%', background: accentColor, borderRadius: 'inherit' }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PerfectDayScreen;
