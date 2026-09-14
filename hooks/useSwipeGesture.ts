import React, { useRef, useCallback } from 'react';

/**
 * Swipe gesture detection hook for mobile interactions.
 * 
 * Usage:
 *   const swipe = useSwipeGesture({
 *     onSwipeLeft: () => console.log('swiped left'),
 *     onSwipeRight: () => console.log('swiped right'),
 *     threshold: 50,
 *   });
 *   <div {...swipe.handlers}>...</div>
 */

interface SwipeConfig {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    /** Minimum distance in px to trigger swipe (default: 50) */
    threshold?: number;
    /** Maximum time in ms for a swipe (default: 300) */
    maxTime?: number;
}

interface SwipeHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeGesture(config: SwipeConfig): { handlers: SwipeHandlers } {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        maxTime = 300,
    } = config;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStart.current) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        const dt = Date.now() - touchStart.current.time;

        touchStart.current = null;

        if (dt > maxTime) return;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Determine primary direction
        if (absDx > absDy && absDx > threshold) {
            if (dx > 0) onSwipeRight?.();
            else onSwipeLeft?.();
        } else if (absDy > absDx && absDy > threshold) {
            if (dy > 0) onSwipeDown?.();
            else onSwipeUp?.();
        }
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, maxTime]);

    return {
        handlers: { onTouchStart, onTouchEnd },
    };
}
