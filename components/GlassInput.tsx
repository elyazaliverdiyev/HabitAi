import React, { useRef, useState, useCallback, CSSProperties } from 'react';

interface GlassInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'search';
    icon?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    /** iOS 26 style glass variant */
    variant?: 'clear' | 'regular';
}

/**
 * iOS 26 Liquid Glass Input — Web Implementation
 * 
 * Mirrors GlassView + TextInput from anything/mobile:
 * - Frosted glass background with backdrop blur
 * - Specular highlight border
 * - Mouse-tracking spotlight
 * - Focus glow animation
 */
const GlassInput: React.FC<GlassInputProps> = ({
    value,
    onChange,
    placeholder = '',
    type = 'text',
    icon,
    className = '',
    disabled = false,
    variant = 'clear',
}) => {
    const inputRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        inputRef.current.style.setProperty('--glass-x', `${x}px`);
        inputRef.current.style.setProperty('--glass-y', `${y}px`);
    }, []);

    const isClear = variant === 'clear';

    const glassStyle: CSSProperties = {
        background: isClear
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(255, 255, 255, 0.08)',
        backdropFilter: isClear
            ? 'blur(12px) saturate(140%)'
            : 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: isClear
            ? 'blur(12px) saturate(140%)'
            : 'blur(24px) saturate(180%)',
        border: isFocused
            ? '1px solid rgba(var(--brand-rgb, 99, 102, 241), 0.5)'
            : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isFocused
            ? '0 0 20px rgba(var(--brand-rgb, 99, 102, 241), 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    };

    return (
        <div
            ref={inputRef}
            className={`relative overflow-hidden ${className}`}
            style={glassStyle}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Mouse-tracking spotlight */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: `radial-gradient(
                        200px circle at var(--glass-x, 50%) var(--glass-y, 50%),
                        rgba(255, 255, 255, 0.06) 0%,
                        transparent 60%
                    )`,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Specular highlight border */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    zIndex: 1,
                }}
            />

            <div className="relative flex items-center gap-3 px-4 py-3.5" style={{ zIndex: 2 }}>
                {icon && <span className="text-white/50 shrink-0">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent text-white text-base outline-none placeholder:text-white/40 disabled:opacity-50"
                />
            </div>
        </div>
    );
};

export default GlassInput;
