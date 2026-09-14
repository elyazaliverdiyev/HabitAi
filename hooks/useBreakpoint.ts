import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions matching Tailwind config.
 * Provides reactive device-type detection.
 * 
 * Usage:
 *   const { isPhone, isTablet, isDesktop, breakpoint } = useBreakpoint();
 */

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointResult {
    /** Current breakpoint label */
    breakpoint: Breakpoint;
    /** < 640px */
    isXs: boolean;
    /** < 768px (portrait phone) */
    isPhone: boolean;
    /** 768px – 1023px (tablet portrait, phone landscape) */
    isTablet: boolean;
    /** >= 1024px */
    isDesktop: boolean;
    /** >= 1280px (large desktop) */
    isLargeDesktop: boolean;
    /** Current window width */
    width: number;
}

const getBreakpoint = (width: number): Breakpoint => {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
};

export function useBreakpoint(): BreakpointResult {
    const [width, setWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    const handleResize = useCallback(() => {
        setWidth(window.innerWidth);
    }, []);

    useEffect(() => {
        // Use ResizeObserver on documentElement for better perf than window resize
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                setWidth(window.innerWidth);
            });
            observer.observe(document.documentElement);
            return () => observer.disconnect();
        } else {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [handleResize]);

    const breakpoint = getBreakpoint(width);

    return {
        breakpoint,
        isXs: width < 640,
        isPhone: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isLargeDesktop: width >= 1280,
        width,
    };
}
