import React, { CSSProperties, ReactNode, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface LiquidGlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'regular' | 'clear' | 'none';
    onClick?: () => void;
    style?: CSSProperties;
    animate?: boolean;
    /** iOS 26 interactive — grow on hover + shimmer light sweep */
    interactive?: boolean;
    /** Tint color overlay for the glass (e.g. "orange", "#4ade80", "rgba(139,92,246,0.3)") */
    tintColor?: string;
    /** Border radius override (default: 24px) */
    radius?: number;
    /** Padding override (default: 20px) */
    padding?: number | string;
}

// Spring for interactive grow
const glassInteractive = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/**
 * iOS 26 Liquid Glass Card Component — Web Implementation
 * 
 * Mirrors @callstack/liquid-glass native module features:
 * - interactive: grow + shimmer sweep on hover/tap
 * - variant: clear (more transparent) / regular (frosted) / none (plain)
 * - tintColor: colored glass overlay
 * - Specular highlight border (gradient from bright top to faded bottom)
 * - Mouse-tracking refraction spotlight
 * - Depth shadow system
 */
const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
    children,
    className = '',
    variant = 'regular',
    onClick,
    style,
    animate = false,
    interactive = false,
    tintColor,
    radius = 24,
    padding = 20,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse-tracking specular highlight
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--glass-mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--glass-mouse-y', `${y}px`);
    }, []);

    // Variant-based styles
    const getGlassStyles = (): CSSProperties => {
        if (variant === 'none') {
            return {
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: '1px solid transparent',
                boxShadow: 'none',
            };
        }

        const isClear = variant === 'clear';
        return {
            background: isClear
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: isClear
                ? 'blur(12px) saturate(140%)'
                : 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: isClear
                ? 'blur(12px) saturate(140%)'
                : 'blur(24px) saturate(180%)',
            border: isClear
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isClear
                ? '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                : '0 10px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        };
    };

    const baseStyles: CSSProperties = {
        position: 'relative',
        borderRadius: `${radius}px`,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        ...getGlassStyles(),
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, box-shadow 0.3s ease',
        cursor: onClick || interactive ? 'pointer' : 'default',
        overflow: 'hidden',
        ...style,
    };

    // Tint color overlay
    const tintOverlayStyles: CSSProperties | null = tintColor ? {
        position: 'absolute',
        inset: 0,
        borderRadius: `${radius}px`,
        background: tintColor.startsWith('rgba') || tintColor.startsWith('#')
            ? tintColor
            : tintColor,
        opacity: 0.12,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
        zIndex: 0,
    } : null;

    // Specular highlight border overlay (iOS 26 refraction)
    const borderOverlayStyles: CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: `${radius}px`,
        padding: '1px',
        background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.15) 30%,
            rgba(255, 255, 255, 0.05) 60%,
            rgba(255, 255, 255, 0.2) 100%
        )`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        zIndex: 2,
    };

    // Mouse-tracking spotlight
    const spotlightStyles: CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: `${radius}px`,
        background: `radial-gradient(
            300px circle at var(--glass-mouse-x, 50%) var(--glass-mouse-y, 50%),
            rgba(255, 255, 255, 0.08) 0%,
            transparent 60%
        )`,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        zIndex: 1,
    };

    // Interactive shimmer sweep
    const shimmerStyles: CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: `${radius}px`,
        background: `linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.15) 45%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0.15) 55%,
            transparent 70%
        )`,
        backgroundSize: '200% 100%',
        animation: isHovered && interactive ? 'glassShimmerSweep 1.5s ease-in-out' : 'none',
        pointerEvents: 'none',
        zIndex: 3,
    };

    const motionProps = interactive ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.97 },
        transition: glassInteractive,
    } : {};

    return (
        <motion.div
            ref={cardRef}
            className={`${animate ? 'animate-liquid-morph' : ''} ${className}`}
            style={baseStyles}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...motionProps}
        >
            {/* Tint color overlay */}
            {tintOverlayStyles && <div style={tintOverlayStyles} aria-hidden="true" />}

            {/* Mouse-tracking spotlight */}
            <div style={spotlightStyles} aria-hidden="true" />

            {/* Specular highlight border */}
            {variant !== 'none' && <div style={borderOverlayStyles} aria-hidden="true" />}

            {/* Interactive shimmer sweep */}
            {interactive && <div style={shimmerStyles} aria-hidden="true" />}

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 4 }}>
                {children}
            </div>
        </motion.div>
    );
};

export default LiquidGlassCard;
