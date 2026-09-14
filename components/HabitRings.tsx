/**
 * HabitRings — Переработанные кольца активности в стиле Apple Watch / Harvee.
 *
 * Особенности:
 * - Три концентрических кольца с градиентом и glow
 * - Толстые strokeLinecap="round" — плавные концы
 * - Плавная CSS-анимация stroke-dashoffset (spring easing)
 * - Тёмный трек каждого кольца
 * - Поддержка overflow (>100%) — дуга перекрывает себя
 * - Опциональные метрики под кольцом в стиле Harvee
 */
import React, { useEffect, useRef, useState } from 'react';

export interface RingConfig {
  percent: number;      // 0–200 (>100 = overflow)
  label:   string;      // отображаемое название
  value?:  string;      // "8 163" / "73%" / "12 дней"
  status?: string;      // "Отлично" / "Ok" / "Слабо"
  colorA:  string;      // начало градиента
  colorB:  string;      // конец градиента
  bgColor: string;      // трек (тёмный оттенок того же цвета)
}

interface HabitRingsProps {
  rings:       RingConfig[];   // 1–3 кольца
  size?:       number;          // px, default 130
  strokeWidth?: number;         // толщина, default 10
  showMetrics?: boolean;        // показать карточки под кольцом
  className?:  string;
}

// ---------- helpers ----------

function arc(cx: number, cy: number, r: number, pct: number, total: number) {
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(pct, 0), total) / 100;
  return { dasharray: c, dashoffset: c - c * Math.min(clamped, 1) };
}

// ─────────────────────────────────────────────────────────────────────────────

const HabitRings: React.FC<HabitRingsProps> = ({
  rings,
  size = 130,
  strokeWidth = 10,
  showMetrics = true,
  className = '',
}) => {
  const [animated, setAnimated] = useState(false);
  const uid = useRef(`hr-${Math.random().toString(36).slice(2)}`).current;
  const gap = 4;  // gap between rings

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const viewBox = size + 12; // extra padding for glow
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const maxR = (size - strokeWidth) / 2;

  // Apple Watch easing — feels spring-like in CSS
  const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const DURATION = '1.2s';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* SVG rings */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          <defs>
            {rings.map((ring, i) => {
              const r = maxR - i * (strokeWidth + gap);
              return (
                <React.Fragment key={i}>
                  {/* Progress gradient */}
                  <linearGradient
                    id={`${uid}-grad-${i}`}
                    gradientUnits="userSpaceOnUse"
                    x1={cx - r} y1={cy}
                    x2={cx + r} y2={cy}
                  >
                    <stop offset="0%"   stopColor={ring.colorA} />
                    <stop offset="100%" stopColor={ring.colorB} />
                  </linearGradient>

                  {/* Glow filter */}
                  <filter id={`${uid}-glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Overflow gradient (slightly lighter) */}
                  <linearGradient
                    id={`${uid}-overflow-${i}`}
                    gradientUnits="userSpaceOnUse"
                    x1={cx - r} y1={cy}
                    x2={cx + r} y2={cy}
                  >
                    <stop offset="0%"   stopColor={ring.colorA} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={ring.colorB} stopOpacity="0.7" />
                  </linearGradient>
                </React.Fragment>
              );
            })}
          </defs>

          {rings.map((ring, i) => {
            const r = maxR - i * (strokeWidth + gap);
            const { dasharray, dashoffset } = arc(cx, cy, r, ring.percent, 100);

            // Overflow (>100%)
            const hasOverflow = ring.percent > 100;
            const overflowPct = ring.percent - 100;
            const { dashoffset: overflowOffset } = arc(cx, cy, r, overflowPct, 100);

            return (
              <g key={i}>
                {/* Track (dark background) */}
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={ring.bgColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                />

                {/* Progress arc */}
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={`url(#${uid}-grad-${i})`}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={dasharray}
                  strokeDashoffset={animated ? dashoffset : dasharray}
                  style={{
                    transition: animated
                      ? `stroke-dashoffset ${DURATION} ${EASING}`
                      : 'none',
                    filter: ring.percent >= 50
                      ? `drop-shadow(0 0 ${strokeWidth / 2}px ${ring.colorA}80)`
                      : 'none',
                  }}
                />

                {/* Overflow arc (wraps back from start) */}
                {hasOverflow && (
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={`url(#${uid}-overflow-${i})`}
                    strokeWidth={strokeWidth - 1}
                    strokeLinecap="round"
                    strokeDasharray={dasharray}
                    strokeDashoffset={animated ? overflowOffset : dasharray}
                    style={{
                      transition: animated
                        ? `stroke-dashoffset ${DURATION} ${EASING} 0.1s`
                        : 'none',
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Center dot — tiny circle in the middle */}
        {rings.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6, height: 6,
              borderRadius: '50%',
              background: rings[0]?.colorA ?? '#fff',
              opacity: 0.4,
            }}
          />
        )}
      </div>

      {/* Harvee-style metric pills */}
      {showMetrics && rings.length > 0 && (
        <div className="flex gap-2 mt-2">
          {rings.map((ring, i) => (
            <div
              key={i}
              className="flex flex-col items-center px-2 py-1 rounded-xl"
              style={{
                background: `${ring.colorA}12`,
                border: `1px solid ${ring.colorA}25`,
                minWidth: 44,
              }}
            >
              {/* Color dot */}
              <div
                className="w-1.5 h-1.5 rounded-full mb-0.5"
                style={{ background: `linear-gradient(135deg, ${ring.colorA}, ${ring.colorB})` }}
              />
              {/* Value */}
              {ring.value && (
                <span className="text-[11px] font-black tabular-nums" style={{ color: ring.colorA }}>
                  {ring.value}
                </span>
              )}
              {/* Label */}
              <span className="text-[8px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {ring.label}
              </span>
              {/* Status badge */}
              {ring.status && (
                <span className="text-[7px] font-bold mt-0.5" style={{ color: ring.colorA, opacity: 0.8 }}>
                  {ring.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HabitRings;
