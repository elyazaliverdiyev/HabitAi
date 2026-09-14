import React, { useEffect, useState, useRef } from 'react';

interface ActivityRingsProps {
    movePercent: number;
    streakPercent: number;
    xpPercent: number;
    size?: number;
    showLabels?: boolean;
    language?: 'ru' | 'en';
}

const LABELS = {
    ru: { move: 'Прогресс', streak: 'Стрики', xp: 'Опыт' },
    en: { move: 'Progress', streak: 'Streak', xp: 'XP' }
};

// Apple Watch ring colors — always on dark background
const RING_CONFIGS = [
    {
        id: 'move',
        colorStart: '#FF0534',
        colorEnd: '#FF2D55',
        bgColor: '#3D0410',
        label: 'move'
    },
    {
        id: 'exercise',
        colorStart: '#2ECC09',
        colorEnd: '#C6F700',
        bgColor: '#142E00',
        label: 'streak'
    },
    {
        id: 'stand',
        colorStart: '#00CEBC',
        colorEnd: '#65E9FF',
        bgColor: '#002E38',
        label: 'xp'
    }
];

function mixColor(hex1: string, hex2: string, ratio: number): string {
    const parse = (h: string) => {
        const c = h.replace('#', '');
        return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
    };
    const c1 = parse(hex1);
    const c2 = parse(hex2);
    const mix = c1.map((v, i) => Math.round(v + (c2[i] - v) * ratio));
    return `#${mix.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
    movePercent,
    streakPercent,
    xpPercent,
    size = 120,
    showLabels = true,
    language = 'en'
}) => {
    const [animated, setAnimated] = useState(false);
    const labels = LABELS[language];
    const uid = useRef(`ar-${Math.random().toString(36).slice(2)}`).current;

    const isDark = typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark');

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const vs = 100;
    const center = vs / 2;
    const sw = 14;
    const gap = 2;
    const outerR = 43;

    const percents = [movePercent, streakPercent, xpPercent];

    const rings = RING_CONFIGS.map((config, i) => ({
        config,
        radius: outerR - i * (sw + gap),
        percent: percents[i]
    }));

    const circ = (r: number) => 2 * Math.PI * r;

    const mainOffset = (r: number, pct: number) => {
        const c = circ(r);
        if (!animated) return c;
        return c - (c * Math.min(Math.max(pct, 0), 100)) / 100;
    };

    const overflowOffset = (r: number, pct: number) => {
        const c = circ(r);
        if (!animated || pct <= 100) return c;
        const overflow = Math.min(pct - 100, 100);
        return c - (c * overflow) / 100;
    };

    const getTipPos = (radius: number, pct: number) => {
        if (!animated || pct <= 100) return null;
        const overflow = Math.min(pct - 100, 100);
        const angle = (overflow / 100) * 2 * Math.PI;
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle)
        };
    };

    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

    return (
        <div className="flex items-center gap-4">
            {/* Dark circular background — like Apple Fitness app */}
            <div
                className={`ring-hover-target ${movePercent >= 100 ? 'streak-glow' : ''}`}
                style={{
                    width: size,
                    height: size,
                    position: 'relative',
                    borderRadius: '50%',
                    background: isDark ? 'transparent' : '#1C1C1E',
                    padding: isDark ? 0 : 2,
                    boxSizing: 'border-box',
                }}
            >
                <svg
                    viewBox="-6 -6 112 112"
                    width={isDark ? size : size - 4}
                    height={isDark ? size : size - 4}
                    style={{
                        transform: 'rotate(-90deg)',
                        overflow: 'visible',
                        display: 'block',
                        margin: isDark ? 0 : 'auto',
                    }}
                >
                    <defs>
                        {rings.map(({ config, radius }, i) => {
                            const r = radius;
                            return (
                                <React.Fragment key={config.id}>
                                    <linearGradient
                                        id={`${uid}-full-${i}`}
                                        gradientUnits="userSpaceOnUse"
                                        x1={center} y1={center - r}
                                        x2={center - r * 0.7} y2={center + r * 0.7}
                                    >
                                        <stop offset="0%" stopColor={config.colorStart} />
                                        <stop offset="50%" stopColor={mixColor(config.colorStart, config.colorEnd, 0.5)} />
                                        <stop offset="100%" stopColor={config.colorEnd} />
                                    </linearGradient>

                                    <filter id={`${uid}-blur-${i}`} x="-200%" y="-200%" width="500%" height="500%">
                                        <feGaussianBlur stdDeviation="3" />
                                    </filter>
                                </React.Fragment>
                            );
                        })}
                    </defs>

                    {rings.map(({ config, radius, percent }, i) => {
                        const c = circ(radius);
                        const mOff = mainOffset(radius, percent);
                        const hasOverflow = percent > 100;
                        const oOff = overflowOffset(radius, percent);
                        const tip = getTipPos(radius, percent);

                        return (
                            <g key={i}>
                                {/* Background track — always dark */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke={config.bgColor}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                />

                                {/* Main progress ring */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke={`url(#${uid}-full-${i})`}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    strokeDasharray={c}
                                    strokeDashoffset={mOff}
                                    style={{
                                        transition: animated
                                            ? `stroke-dashoffset 1.4s ${easing}`
                                            : 'none',
                                        filter: percent >= 100
                                            ? `drop-shadow(0 0 4px ${config.colorStart}40)`
                                            : 'none'
                                    }}
                                />

                                {/* Overflow shadow at tip */}
                                {hasOverflow && tip && (
                                    <circle
                                        cx={tip.x}
                                        cy={tip.y}
                                        r={sw * 0.6}
                                        fill="black"
                                        opacity={0.5}
                                        filter={`url(#${uid}-blur-${i})`}
                                        style={{
                                            transition: animated
                                                ? `cx 1.4s ${easing}, cy 1.4s ${easing}`
                                                : 'none',
                                        }}
                                    />
                                )}

                                {/* Overflow arc */}
                                {hasOverflow && (
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        fill="none"
                                        stroke={`url(#${uid}-full-${i})`}
                                        strokeWidth={sw}
                                        strokeLinecap="round"
                                        strokeDasharray={c}
                                        strokeDashoffset={oOff}
                                        style={{
                                            transition: animated
                                                ? `stroke-dashoffset 1.4s ${easing}`
                                                : 'none',
                                        }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {showLabels && (
                <div className="flex flex-col gap-1.5 text-sm">
                    {rings.map(({ config, percent }, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${config.colorStart}, ${config.colorEnd})`,
                                    boxShadow: percent >= 100
                                        ? `0 0 8px ${config.colorStart}`
                                        : 'none'
                                }}
                            />
                            <span className="text-textSecondary text-xs">
                                {labels[config.label as keyof typeof labels]}
                            </span>
                            <span
                                className="font-bold text-textPrimary text-xs tabular-nums"
                                style={{
                                    color: percent >= 100 ? config.colorStart : undefined
                                }}
                            >
                                {Math.round(percent)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityRings;
