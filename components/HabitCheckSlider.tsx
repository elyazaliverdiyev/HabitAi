/**
 * HabitCheckSlider — Apple-style вертикальный переключатель отметки привычки.
 *
 * Дизайн-решения (вместо старого «ползунка с пружиной»):
 * 1. Жест «свайп вверх» — как кнопки watchOS / закрытие плеера Apple Music:
 *    палец тянет круглый knob вверх, трек заполняется цветом.
 * 2. Магнитный снап: отпустил выше 55% → выполнение (100%), ниже → откат к прогрессу.
 * 3. Тактильные стадии (haptic): пересечение 50% — тихий тик, завершение — сильный отклик.
 * 4. Простой тап = быстрое переключение (старый UX сохранён).
 * 5. Физика: только токены motionControl/motionCelebrate из единой системы движения.
 */
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check } from 'lucide-react';
import { motionControl, motionCelebrate } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';

interface HabitCheckSliderProps {
  /** 0–100: текущий реальный прогресс привычки за день */
  progressPercent: number;
  isCompleted: boolean;
  color: string;
  onToggle: () => void;
  language?: 'ru' | 'en';
}

const TRACK_HEIGHT = 64;   // px
const KNOB_SIZE = 22;
const PADDING = 4;         // px от краёв трека
const SNAP_THRESHOLD = 0.55; // выше 55% → выполнить

export const HabitCheckSlider: React.FC<HabitCheckSliderProps> = ({
  progressPercent,
  isCompleted,
  color,
  onToggle,
  language = 'ru',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const hapticStageRef = useRef(0);

  const TOP_Y = PADDING;
  const BOTTOM_Y = TRACK_HEIGHT - KNOB_SIZE - PADDING;
  const RANGE = BOTTOM_Y - TOP_Y;

  // knobY (px, 0 сверху) — единственный источник истины позиции бегунка.
  // framer-drag двигает элемент и обновляет этот motion value напрямую.
  const knobY = useMotionValue(
    isCompleted ? TOP_Y : BOTTOM_Y - (Math.min(Math.max(progressPercent, 0), 100) / 100) * RANGE
  );

  // 0..1: доля заполнения трека (1 = вверху, выполнено)
  const progress = useTransform(knobY, [BOTTOM_Y, TOP_Y], [0, 1]);
  const fillHeight = useTransform(progress, (p) => `${p * 100}%`);

  // Внешние изменения состояния (тап в другом месте, синхронизация) — плавно доводим knob
  React.useEffect(() => {
    const targetY = isCompleted
      ? TOP_Y
      : BOTTOM_Y - (Math.min(Math.max(progressPercent, 0), 100) / 100) * RANGE;
    animate(knobY, targetY, motionControl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted, progressPercent]);

  const fillColor = isCompleted ? '#10B981' : color;
  const isDoneVisual = isCompleted || previewDone;

  const handleDrag = () => {
    const p = 1 - (knobY.get() - TOP_Y) / RANGE; // 0..1 снизу вверх

    // Тактильная стадия 50% — тихий тик при пересечении
    if (p >= 0.5 && hapticStageRef.current < 0.5) {
      hapticStageRef.current = 0.5;
      triggerHaptic();
    } else if (p < 0.5 && hapticStageRef.current >= 0.5) {
      hapticStageRef.current = 0;
    }

    setPreviewDone(p >= SNAP_THRESHOLD);
  };

  const handleDragEnd = () => {
    setDragging(false);
    const p = 1 - (knobY.get() - TOP_Y) / RANGE;
    hapticStageRef.current = 0;

    if (p >= SNAP_THRESHOLD) {
      // Магнит: доводим до верха и отмечаем выполнение
      animate(knobY, TOP_Y, motionCelebrate);
      if (!isCompleted) {
        triggerStrongHaptic();
        onToggle();
      }
    } else {
      // Откат к реальному прогрессу дня
      const targetY = isCompleted
        ? TOP_Y
        : BOTTOM_Y - (Math.min(Math.max(progressPercent, 0), 100) / 100) * RANGE;
      animate(knobY, targetY, motionControl);
    }
    setPreviewDone(false);
  };

  return (
    <div
      className="shrink-0 flex items-center justify-center select-none touch-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={trackRef}
        className="relative rounded-full cursor-grab active:cursor-grabbing"
        style={{ width: 28, height: TRACK_HEIGHT }}
        onClick={() => {
          // Простой тап — быстрое переключение (старый UX сохранён)
          triggerStrongHaptic();
          onToggle();
        }}
      >
        {/* Трек с заполнением */}
        <div
          className="absolute left-1/2 -translate-x-1/2 inset-y-0 rounded-full overflow-hidden transition-colors duration-300"
          style={{
            width: 12,
            background: 'var(--surface-highlight)',
            border: `1px solid ${isDoneVisual ? 'rgba(16,185,129,0.45)' : 'var(--border-subtle)'}`,
          }}
        >
          <motion.div
            className="absolute bottom-0 inset-x-0"
            style={{
              height: fillHeight,
              background: isDoneVisual
                ? 'linear-gradient(180deg, #34D399, #10B981)'
                : `linear-gradient(180deg, ${fillColor}CC, ${fillColor}88)`,
            }}
          />
        </div>

        {/* Линия срабатывания (зона магнита 55%) — видна только при drag */}
        {dragging && (
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              top: TOP_Y + (1 - SNAP_THRESHOLD) * RANGE + KNOB_SIZE / 2 - 1,
              width: 20,
              height: 2,
              background: 'rgba(255,255,255,0.4)',
            }}
          />
        )}

        {/* Knob — перетаскиваемый бегунок */}
        <motion.div
          drag="y"
          dragConstraints={trackRef}
          dragElastic={0.05}
          dragMomentum={false}
          onDragStart={() => { setDragging(true); hapticStageRef.current = 0; }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ y: knobY, x: '-50%', left: '50%', width: KNOB_SIZE, height: KNOB_SIZE }}
          whileTap={{ scale: 1.1 }}
          className="absolute top-0 rounded-full flex items-center justify-center shadow-md z-10 cursor-grab active:cursor-grabbing"
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center transition-colors duration-200"
            style={{
              background: isDoneVisual ? '#10B981' : '#ffffff',
              boxShadow: `0 1px 4px rgba(0,0,0,0.25), 0 0 ${dragging ? 12 : 6}px ${isDoneVisual ? 'rgba(16,185,129,0.45)' : fillColor + '55'}`,
            }}
          >
            {(isDoneVisual) && (
              <Check size={12} strokeWidth={3.5} className="text-white" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HabitCheckSlider;
