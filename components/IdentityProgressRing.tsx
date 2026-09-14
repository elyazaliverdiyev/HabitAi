import React, { useEffect, useState, useRef } from 'react';
import { Crown } from 'lucide-react';
import { UserIdentity, IDENTITY_PRESETS } from '../types';

interface IdentityProgressRingProps {
    score: number;
    identity?: UserIdentity;
    size?: number;
    showLabel?: boolean;
    language?: 'ru' | 'en';
    compact?: boolean;
    proofCount?: number;
    onClick?: () => void;
}

const MILESTONE_CONFIG = [
    { threshold: 100, label: { ru: 'Мастер', en: 'Master' }, color: '#F59E0B', colorEnd: '#F97316' },
    { threshold: 75, label: { ru: 'Эксперт', en: 'Expert' }, color: '#8B5CF6', colorEnd: '#EC4899' },
    { threshold: 50, label: { ru: 'Практик', en: 'Practitioner' }, color: '#3B82F6', colorEnd: '#8B5CF6' },
    { threshold: 25, label: { ru: 'Начало пути', en: 'Starting' }, color: '#3B82F6', colorEnd: '#06B6D4' },
    { threshold: 0, label: { ru: 'Новичок', en: 'Beginner' }, color: '#9CA3AF', colorEnd: '#6B7280' },
];

const getMilestone = (score: number) => {
    return MILESTONE_CONFIG.find(m => score >= m.threshold) || MILESTONE_CONFIG[MILESTONE_CONFIG.length - 1];
};

const getPreset = (id: string) => IDENTITY_PRESETS.find(p => p.id === id);

export const IdentityProgressRing: React.FC<IdentityProgressRingProps> = ({
    score,
    identity,
    size = 200,
    compact = false,
    onClick
}) => {
    const preset = identity ? getPreset(identity.targetIdentity) : null;
    const milestone = getMilestone(score);
    const isComplete = score >= 100;

    // SVG calculations
    const strokeWidth = compact ? 6 : 8;
    const ringSize = compact ? size : size;
    const center = ringSize / 2;
    const radius = (ringSize / 2) - strokeWidth - 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * Math.min(score, 100)) / 100;

    const progressColor = milestone.color;
    const progressColorEnd = milestone.colorEnd;
    const uniqueId = useRef(`ring-${Math.random().toString(36).slice(2)}`).current;

    return (
        <div
            className={`relative flex items-center justify-center ring-hover-target ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{ width: ringSize, height: ringSize }}
        >
            {/* SVG Ring */}
            <svg
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                className="transform -rotate-90"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    {/* Progress gradient — two-tone */}
                    <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={progressColor} />
                        <stop offset="100%" stopColor={progressColorEnd} />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={compact ? 3 : 6} result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Background ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="var(--surface-highlight)"
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.6}
                />

                {/* Glow layer — pulsing behind the main ring */}
                {score >= 50 && (
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={progressColor}
                        strokeWidth={strokeWidth + 6}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            opacity: 0.2,
                            filter: `drop-shadow(0 0 8px ${progressColor}80)`,
                            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                )}

                {/* Progress ring — main */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${uniqueId}-grad)`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    filter={isComplete ? `url(#${uniqueId}-glow)` : undefined}
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                />

            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Emoji or Crown */}
                {isComplete ? (
                    <Crown size={compact ? 20 : 28} className="text-amber-500 mb-1" />
                ) : (
                    <span className="text-2xl mb-0.5">{preset?.emoji || '🎯'}</span>
                )}

                {/* Score */}
                {(!compact || score > 0) && (
                    <span
                        className="font-bold text-textPrimary tabular-nums"
                        style={{ fontSize: compact ? 14 : 18 }}
                    >
                        {Math.round(score)}%
                    </span>
                )}
            </div>

            {/* Subtle glow for high scores */}
            {score >= 75 && (
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        boxShadow: `inset 0 0 ${compact ? 15 : 25}px ${progressColor}20`,
                    }}
                />
            )}
        </div>
    );
};

export default IdentityProgressRing;
