import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { springSnappy, springBouncy } from '../utils/motionPresets';

// =============================================
// Animated SVG Icons — Premium Micro-animations
// =============================================

/**
 * Animated Checkmark — SVG path draw-on effect (like Apple Pay ✓)
 */
export const AnimatedCheckmark: React.FC<{
    checked: boolean;
    size?: number;
    color?: string;
    strokeWidth?: number;
}> = ({ checked, size = 24, color = 'currentColor', strokeWidth = 2.5 }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <motion.path
                d="M5 13l4 4L19 7"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={checked
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={checked
                    ? { pathLength: { ...springBouncy, duration: 0.4 }, opacity: { duration: 0.1 } }
                    : { pathLength: { duration: 0.2 }, opacity: { duration: 0.15, delay: 0.1 } }
                }
            />
        </svg>
    );
};

/**
 * Animated Flame — flickering streak icon
 */
export const AnimatedFlame: React.FC<{
    active: boolean;
    size?: number;
    color?: string;
}> = ({ active, size = 20, color = '#f97316' }) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            animate={active ? {
                scale: [1, 1.1, 0.95, 1.05, 1],
                rotate: [0, -3, 2, -1, 0],
            } : {}}
            transition={active ? {
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
            } : {}}
        >
            <motion.path
                d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z"
                fill={active ? color : 'none'}
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={active ? {
                    fillOpacity: [0.7, 1, 0.8, 1, 0.7],
                } : { fillOpacity: 0 }}
                transition={active ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                } : {}}
            />
            {/* Inner flame */}
            {active && (
                <motion.path
                    d="M12 8c0 2-2 3-2 5a2 2 0 0 0 4 0c0-2-2-3-2-5z"
                    fill="#fbbf24"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        opacity: [0.5, 1, 0.6, 1, 0.5],
                        scale: [0.8, 1.1, 0.9, 1.05, 0.8],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{ transformOrigin: 'center bottom' }}
                />
            )}
        </motion.svg>
    );
};

/**
 * Animated Progress Ring — smooth fill with optional glow at 100%
 */
export const AnimatedProgressRing: React.FC<{
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    showGlow?: boolean;
}> = ({ progress, size = 48, strokeWidth = 4, color = 'var(--brand)', bgColor = 'rgba(128,128,128,0.15)', showGlow = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const animatedProgress = useMotionValue(0);
    const dashoffset = useTransform(animatedProgress, (v) => circumference * (1 - v));

    useEffect(() => {
        const controls = animate(animatedProgress, Math.min(progress, 1), {
            duration: 0.8,
            ease: [0.32, 0.72, 0, 1],
        });
        return () => controls.stop();
    }, [progress, animatedProgress]);

    const isComplete = progress >= 1;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Glow filter */}
            {showGlow && isComplete && (
                <defs>
                    <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            )}
            {/* Background track */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={bgColor}
                strokeWidth={strokeWidth}
            />
            {/* Animated progress arc */}
            <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashoffset }}
                filter={showGlow && isComplete ? `url(#glow-${size})` : undefined}
            />
            {/* Pulse on complete */}
            {isComplete && showGlow && (
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth * 0.5}
                    strokeDasharray={circumference}
                    strokeDashoffset={0}
                    opacity={0}
                    animate={{ opacity: [0, 0.4, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: 'center' }}
                />
            )}
        </svg>
    );
};

/**
 * Animated Success — draw-on circle + checkmark (like Apple Pay completion)
 */
export const AnimatedSuccess: React.FC<{
    show: boolean;
    size?: number;
    color?: string;
}> = ({ show, size = 64, color = '#22c55e' }) => {
    if (!show) return null;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springBouncy}
        >
            {/* Circle */}
            <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke={color}
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            />
            {/* Checkmark */}
            <motion.path
                d="M20 33l8 8L44 25"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            />
        </motion.svg>
    );
};

/**
 * Animated Spinner — smooth SVG rotation
 */
export const AnimatedSpinner: React.FC<{
    size?: number;
    color?: string;
}> = ({ size = 20, color = 'var(--brand)' }) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.2}
            />
            <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="62.83"
                strokeDashoffset="47.12"
            />
        </motion.svg>
    );
};

/**
 * Animated Bell — wobble on notification
 */
export const AnimatedBell: React.FC<{
    ring: boolean;
    size?: number;
    color?: string;
}> = ({ ring, size = 20, color = 'currentColor' }) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={ring ? {
                rotate: [0, 15, -12, 8, -5, 3, 0],
            } : {}}
            transition={ring ? {
                duration: 0.6,
                ease: "easeInOut",
            } : {}}
            style={{ transformOrigin: 'top center' }}
        >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            {ring && (
                <motion.circle
                    cx="18"
                    cy="5"
                    r="3"
                    fill="#ef4444"
                    stroke="none"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springBouncy}
                />
            )}
        </motion.svg>
    );
};
