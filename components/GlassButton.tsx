import React, { useRef, useState, useCallback, CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface GlassButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    /** iOS 26 interactive grow effect */
    interactive?: boolean;
}

const buttonSpring = { type: "spring" as const, stiffness: 450, damping: 32, mass: 0.6 };

/**
 * iOS 26 Glass Button Component — Web Implementation
 * 
 * Mirrors GlassView + isInteractive from anything/mobile:
 * - Frosted glass background with backdrop blur
 * - Interactive grow on hover + shimmer
 * - Mouse-tracking specular highlight
 * - Multiple variants: primary (brand gradient), secondary (glass), ghost, danger
 */
const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    icon,
    fullWidth = false,
    interactive = true,
}) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btnRef.current.style.setProperty('--glass-x', `${x}px`);
        btnRef.current.style.setProperty('--glass-y', `${y}px`);
    }, []);

    const sizeClasses = {
        sm: 'px-4 py-2 text-xs gap-1.5',
        md: 'px-5 py-3 text-sm gap-2',
        lg: 'px-7 py-4 text-base gap-2.5',
    };

    const getVariantStyle = (): CSSProperties => {
        const base: CSSProperties = {
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
            borderRadius: '14px',
            transition: 'box-shadow 0.3s ease',
        };

        switch (variant) {
            case 'primary':
                return {
                    ...base,
                    background: 'linear-gradient(135deg, var(--brand) 0%, rgba(var(--brand-rgb, 99, 102, 241), 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: isHovered
                        ? '0 8px 32px rgba(var(--brand-rgb, 99, 102, 241), 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                        : '0 4px 16px rgba(var(--brand-rgb, 99, 102, 241), 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                };
            case 'secondary':
                return {
                    ...base,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: isHovered
                        ? '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                };
            case 'ghost':
                return {
                    ...base,
                    background: 'transparent',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                };
            case 'danger':
                return {
                    ...base,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 68, 68, 0.2)',
                    boxShadow: isHovered
                        ? '0 4px 16px rgba(255, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                };
            default:
                return base;
        }
    };

    const textColor = variant === 'danger' ? 'text-red-400' : variant === 'ghost' ? 'text-white/70 hover:text-white' : 'text-white';

    return (
        <motion.button
            ref={btnRef}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative overflow-hidden inline-flex items-center justify-center font-semibold
                ${sizeClasses[size]}
                ${textColor}
                ${fullWidth ? 'w-full' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
                ${className}
            `}
            style={getVariantStyle()}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={interactive ? { scale: 1.03 } : undefined}
            whileTap={interactive ? { scale: 0.97 } : undefined}
            transition={buttonSpring}
        >
            {/* Mouse-tracking spotlight */}
            <div
                className="absolute inset-0 rounded-[14px] pointer-events-none"
                style={{
                    background: `radial-gradient(
                        200px circle at var(--glass-x, 50%) var(--glass-y, 50%),
                        rgba(255, 255, 255, 0.1) 0%,
                        transparent 60%
                    )`,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Shimmer sweep */}
            <div
                className="absolute inset-0 rounded-[14px] pointer-events-none"
                style={{
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
                    zIndex: 1,
                }}
            />

            {/* Content */}
            <span className="relative inline-flex items-center gap-2" style={{ zIndex: 2 }}>
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
            </span>
        </motion.button>
    );
};

export default GlassButton;
