import React, { useRef, useState, useCallback, CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface GlassStatBoxProps {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    className?: string;
    onClick?: () => void;
    /** Accent color for the value */
    accentColor?: string;
}

const statsSpring = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/**
 * iOS 26 Glass Stat Box — Web Implementation
 * 
 * Mirrors the statBox pattern from anything/mobile profile screen:
 * - GlassView with clear effect
 * - Large value number with label below
 * - Interactive grow + shimmer
 * - Mouse-tracking spotlight
 */
const GlassStatBox: React.FC<GlassStatBoxProps> = ({
    value,
    label,
    icon,
    className = '',
    onClick,
    accentColor,
}) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!boxRef.current) return;
        const rect = boxRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        boxRef.current.style.setProperty('--glass-x', `${x}px`);
        boxRef.current.style.setProperty('--glass-y', `${y}px`);
    }, []);

    const glassStyle: CSSProperties = {
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
    };

    return (
        <motion.div
            ref={boxRef}
            className={`relative overflow-hidden flex-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            style={glassStyle}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={onClick ? { scale: 0.97 } : undefined}
            transition={statsSpring}
        >
            {/* Mouse-tracking spotlight */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: `radial-gradient(
                        200px circle at var(--glass-x, 50%) var(--glass-y, 50%),
                        rgba(255, 255, 255, 0.08) 0%,
                        transparent 60%
                    )`,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Shimmer sweep */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: `linear-gradient(
                        105deg,
                        transparent 30%,
                        rgba(255, 255, 255, 0.1) 45%,
                        rgba(255, 255, 255, 0.18) 50%,
                        rgba(255, 255, 255, 0.1) 55%,
                        transparent 70%
                    )`,
                    backgroundSize: '200% 100%',
                    animation: isHovered ? 'glassShimmerSweep 1.5s ease-in-out' : 'none',
                    zIndex: 1,
                }}
            />

            {/* Specular border */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    zIndex: 2,
                }}
            />

            {/* Content */}
            <div className="relative flex flex-col items-center gap-1 p-5" style={{ zIndex: 3 }}>
                {icon && <span className="text-2xl mb-1">{icon}</span>}
                <div
                    className="text-2xl font-bold"
                    style={{ color: accentColor || '#fff' }}
                >
                    {value}
                </div>
                <div className="text-sm text-white/60 font-medium">{label}</div>
            </div>
        </motion.div>
    );
};

export default GlassStatBox;
