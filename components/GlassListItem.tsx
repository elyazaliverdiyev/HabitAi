import React, { useRef, useState, useCallback, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface GlassListItemProps {
    icon?: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    danger?: boolean;
    className?: string;
    /** iOS 26 interactive — grow on hover + shimmer */
    interactive?: boolean;
}

// Spring for interactive grow
const glassSpring = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/**
 * iOS 26 Glass List Item — Web Implementation
 * 
 * Mirrors the menuItem pattern from anything/mobile profile screen:
 * - GlassView with clear effect
 * - Interactive grow + shimmer on hover
 * - Icon + label + chevron layout
 * - Mouse-tracking spotlight
 */
const GlassListItem: React.FC<GlassListItemProps> = ({
    icon,
    label,
    sublabel,
    onClick,
    rightElement,
    showChevron = true,
    danger = false,
    className = '',
    interactive = true,
}) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!itemRef.current) return;
        const rect = itemRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        itemRef.current.style.setProperty('--glass-x', `${x}px`);
        itemRef.current.style.setProperty('--glass-y', `${y}px`);
    }, []);

    const glassStyle: CSSProperties = {
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
    };

    return (
        <motion.div
            ref={itemRef}
            className={`relative overflow-hidden cursor-pointer group ${className}`}
            style={glassStyle}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive ? { scale: 0.97 } : undefined}
            transition={glassSpring}
        >
            {/* Mouse-tracking spotlight */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: `radial-gradient(
                        250px circle at var(--glass-x, 50%) var(--glass-y, 50%),
                        rgba(255, 255, 255, 0.06) 0%,
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
                        rgba(255, 255, 255, 0.12) 45%,
                        rgba(255, 255, 255, 0.2) 50%,
                        rgba(255, 255, 255, 0.12) 55%,
                        transparent 70%
                    )`,
                    backgroundSize: '200% 100%',
                    animation: isHovered && interactive ? 'glassShimmerSweep 1.5s ease-in-out' : 'none',
                    zIndex: 1,
                }}
            />

            {/* Content */}
            <div className="relative flex items-center justify-between px-4 py-4" style={{ zIndex: 2 }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {icon && (
                        <span className={`text-xl shrink-0 ${danger ? 'opacity-80' : ''}`}>
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        <div className={`text-base font-medium truncate ${danger ? 'text-red-400' : 'text-white'}`}>
                            {label}
                        </div>
                        {sublabel && (
                            <div className="text-sm text-white/50 truncate mt-0.5">{sublabel}</div>
                        )}
                    </div>
                </div>
                {rightElement || (showChevron && (
                    <ChevronRight size={20} className="text-white/30 shrink-0 group-hover:text-white/50 transition-colors" />
                ))}
            </div>
        </motion.div>
    );
};

export default GlassListItem;
