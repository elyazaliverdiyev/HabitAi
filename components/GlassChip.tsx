import React, { CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface GlassChipProps {
    children: React.ReactNode;
    onClick?: () => void;
    isActive?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

const chipSpring = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/**
 * iOS 26 Glass Chip — Web Implementation
 * 
 * Mirrors the tag chips from anything/mobile components screen:
 * - GlassView pill shape
 * - Interactive grow on hover/tap
 * - Active state with brand accent
 */
const GlassChip: React.FC<GlassChipProps> = ({
    children,
    onClick,
    isActive = false,
    className = '',
    icon,
}) => {
    const glassStyle: CSSProperties = {
        background: isActive
            ? 'rgba(var(--brand-rgb, 99, 102, 241), 0.25)'
            : 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: isActive
            ? '1px solid rgba(var(--brand-rgb, 99, 102, 241), 0.4)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isActive
            ? '0 0 12px rgba(var(--brand-rgb, 99, 102, 241), 0.2)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        borderRadius: '24px',
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
    };

    return (
        <motion.button
            onClick={onClick}
            className={`relative overflow-hidden px-4 py-2 ${className}`}
            style={glassStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={chipSpring}
        >
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                {icon && <span className="shrink-0">{icon}</span>}
                {children}
            </span>
        </motion.button>
    );
};

export default GlassChip;
