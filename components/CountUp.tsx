import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CountUpProps {
    /** Target number to count up to */
    to: number;
    /** Starting number (default: 0) */
    from?: number;
    /** Animation duration in milliseconds (default: 2000) */
    duration?: number;
    /** Delay before animation starts in milliseconds (default: 0) */
    delay?: number;
    /** Number of decimal places (default: 0) */
    decimals?: number;
    /** Thousands separator (default: ',') */
    separator?: string;
    /** Decimal separator (default: '.') */
    decimalSeparator?: string;
    /** Prefix (e.g., '$', '€') */
    prefix?: string;
    /** Suffix (e.g., '%', ' days') */
    suffix?: string;
    /** Start animation when component enters viewport (default: true) */
    startOnView?: boolean;
    /** Easing function type */
    easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
    /** Additional className */
    className?: string;
    /** Callback when animation completes */
    onComplete?: () => void;
}

const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    spring: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

const CountUp: React.FC<CountUpProps> = ({
    to,
    from = 0,
    duration = 2000,
    delay = 0,
    decimals = 0,
    separator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
    startOnView = true,
    easing = 'easeOut',
    className = '',
    onComplete
}) => {
    const [count, setCount] = useState(from);
    const [hasStarted, setHasStarted] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const formatNumber = useCallback((num: number): string => {
        const safeNum = (typeof num === 'number' && !isNaN(num)) ? num : 0;
        const fixed = safeNum.toFixed(decimals);
        const [intPart, decPart] = fixed.split('.');

        // Add thousands separator
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

        if (decimals > 0 && decPart) {
            return `${prefix}${formattedInt}${decimalSeparator}${decPart}${suffix}`;
        }
        return `${prefix}${formattedInt}${suffix}`;
    }, [decimals, separator, decimalSeparator, prefix, suffix]);

    const animate = useCallback((timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFunctions[easing](progress);

        const currentValue = from + (to - from) * easedProgress;
        setCount(currentValue);

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            setCount(to);
            onComplete?.();
        }
    }, [from, to, duration, easing, onComplete]);

    const startAnimation = useCallback(() => {
        if (hasStarted) return;
        setHasStarted(true);

        setTimeout(() => {
            animationRef.current = requestAnimationFrame(animate);
        }, delay);
    }, [hasStarted, delay, animate]);

    // Intersection Observer for startOnView
    useEffect(() => {
        if (!startOnView) {
            startAnimation();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startAnimation();
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [startOnView, startAnimation]);

    // Reset animation when 'to' value changes
    useEffect(() => {
        if (hasStarted) {
            startTimeRef.current = null;
            setHasStarted(false);
            setCount(from);

            // Restart animation
            setTimeout(() => {
                setHasStarted(true);
                animationRef.current = requestAnimationFrame(animate);
            }, 50);
        }
    }, [to]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <span
            ref={elementRef}
            className={`tabular-nums ${className}`}
            aria-label={formatNumber(to)}
        >
            {formatNumber(count)}
        </span>
    );
};

export default CountUp;
