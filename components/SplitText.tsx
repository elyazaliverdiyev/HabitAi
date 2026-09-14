
import React, { useEffect, useState, useRef, useMemo } from 'react';

interface SplitTextProps {
    /** Text content to split and animate */
    text: string;
    /** Split by 'chars' or 'words' */
    splitBy?: 'chars' | 'words';
    /** Delay between each element in ms */
    delay?: number;
    /** Initial delay before animation in ms */
    initialDelay?: number;
    /** Animation duration per element in ms */
    duration?: number;
    /** Start animation when in viewport (default: true) */
    startOnView?: boolean;
    /** Additional className for wrapper */
    className?: string;
    /** ClassName applied to each animated element */
    charClassName?: string;
    /** Custom animation — 'fadeUp' | 'fadeIn' | 'blurIn' | 'scaleUp' */
    animation?: 'fadeUp' | 'fadeIn' | 'blurIn' | 'scaleUp';
    /** Callback when all animations complete */
    onComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
    text,
    splitBy = 'chars',
    delay = 30,
    initialDelay = 0,
    duration = 500,
    startOnView = true,
    className = '',
    charClassName = '',
    animation = 'fadeUp',
    onComplete
}) => {
    const [isVisible, setIsVisible] = useState(!startOnView);
    const ref = useRef<HTMLSpanElement>(null);
    const completedRef = useRef(false);

    const elements = useMemo(() => {
        if (splitBy === 'words') {
            return text.split(/(\s+)/).map((word, i) => ({ text: word, key: i }));
        }
        return text.split('').map((char, i) => ({ text: char, key: i }));
    }, [text, splitBy]);

    useEffect(() => {
        if (!startOnView) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [startOnView]);

    useEffect(() => {
        if (isVisible && !completedRef.current) {
            const totalDuration = initialDelay + (elements.length * delay) + duration;
            const timer = setTimeout(() => {
                completedRef.current = true;
                onComplete?.();
            }, totalDuration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, elements.length, delay, initialDelay, duration, onComplete]);

    const getAnimationStyle = (index: number): React.CSSProperties => {
        const animDelay = initialDelay + index * delay;
        const base: React.CSSProperties = {
            display: 'inline-block',
            transition: `all ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            transitionDelay: `${animDelay}ms`,
            whiteSpace: 'pre',
        };

        if (!isVisible) {
            switch (animation) {
                case 'fadeUp':
                    return { ...base, opacity: 0, transform: 'translateY(24px)' };
                case 'fadeIn':
                    return { ...base, opacity: 0 };
                case 'blurIn':
                    return { ...base, opacity: 0, filter: 'blur(8px)' };
                case 'scaleUp':
                    return { ...base, opacity: 0, transform: 'scale(0.5)' };
            }
        }

        return {
            ...base,
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)',
        };
    };

    return (
        <span ref={ref} className={className} aria-label={text}>
            {elements.map(({ text: char, key }) => (
                <span
                    key={key}
                    className={charClassName}
                    style={getAnimationStyle(key)}
                    aria-hidden="true"
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

export default SplitText;
