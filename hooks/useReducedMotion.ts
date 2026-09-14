import { useState, useEffect } from 'react';

/**
 * Detects user's prefers-reduced-motion setting.
 * When true, all animations should be disabled or simplified.
 * 
 * Usage:
 *   const reducedMotion = useReducedMotion();
 *   <motion.div transition={reducedMotion ? { duration: 0 } : springGentle} />
 */
export function useReducedMotion(): boolean {
    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return reducedMotion;
}

/** No-op transition for reduced motion users */
export const noMotionTransition = { duration: 0 };

/** No-op variants for reduced motion users */
export const noMotionVariants = {
    initial: {},
    animate: {},
    exit: {}
};
