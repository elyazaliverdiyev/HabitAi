import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 1000,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef<number>();

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function - ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (endValue - startValue) * easeOut;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{displayValue.toFixed(decimals)}{suffix}
        </span>
    );
};

// Animated Progress Bar
interface AnimatedProgressBarProps {
    progress: number; // 0-100
    color?: string;
    height?: number;
    showLabel?: boolean;
    className?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
    progress,
    color = 'var(--brand)',
    height = 8,
    showLabel = false,
    className = ''
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`relative w-full ${className}`}>
            <div
                className="w-full rounded-full overflow-hidden bg-surfaceHighlight"
                style={{ height }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{
                        width: mounted ? `${Math.min(progress, 100)}%` : '0%',
                        backgroundColor: color
                    }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>
            {showLabel && (
                <span className="absolute right-0 -top-5 text-xs font-bold text-textSecondary">
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    );
};

// Animated Circular Progress with entry animation
interface AnimatedCircleProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    children?: React.ReactNode;
}

export const AnimatedCircle: React.FC<AnimatedCircleProps> = ({
    percentage,
    size = 100,
    strokeWidth = 8,
    color = 'var(--brand)',
    bgColor = 'var(--surface-highlight)',
    children
}) => {
    const [mounted, setMounted] = useState(false);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (mounted ? (percentage / 100) * circumference : circumference);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    style={{
                        filter: percentage >= 100 ? `drop-shadow(0 0 6px ${color})` : undefined
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

// Staggered List Animation
interface StaggeredListProps {
    children: React.ReactNode[];
    delay?: number;
    className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    delay = 100,
    className = ''
}) => {
    const [visibleItems, setVisibleItems] = useState<number[]>([]);

    useEffect(() => {
        children.forEach((_, index) => {
            setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
            }, index * delay);
        });

        return () => setVisibleItems([]);
    }, [children.length, delay]);

    return (
        <div className={className}>
            {children.map((child, index) => (
                <div
                    key={index}
                    className={`transition-all duration-500 ${visibleItems.includes(index)
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                        }`}
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

// Pulse animation for badges/icons
interface PulseProps {
    children: React.ReactNode;
    active?: boolean;
    color?: string;
}

export const Pulse: React.FC<PulseProps> = ({
    children,
    active = true,
    color = 'var(--brand)'
}) => {
    if (!active) return <>{children}</>;

    return (
        <div className="relative inline-flex">
            <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: color }}
            />
            <div className="relative">{children}</div>
        </div>
    );
};

// Celebration confetti trigger
export const triggerCelebration = () => {
    // Using canvas-confetti if available
    if (typeof window !== 'undefined' && (window as any).confetti) {
        const confetti = (window as any).confetti;

        // Burst of confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']
        });

        // Side bursts
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#f97316', '#eab308']
            });
        }, 200);

        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#22c55e', '#3b82f6']
            });
        }, 400);
    }
};
