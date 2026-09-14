import React, { useRef, useState, useCallback, CSSProperties } from 'react';

interface GlassInfoPanelProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    /** Glass background variant */
    variant?: 'clear' | 'regular';
}

/**
 * iOS 26 Glass Info Panel — Web Implementation
 * 
 * Mirrors the infoPanel pattern from anything/mobile components screen:
 * - GlassView with regular/clear effect
 * - Structured header + content layout
 * - Mouse-tracking specular highlight
 * - Nested glass stat rows
 */
const GlassInfoPanel: React.FC<GlassInfoPanelProps> = ({
    title,
    subtitle,
    children,
    className = '',
    variant = 'clear',
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        panelRef.current.style.setProperty('--glass-x', `${x}px`);
        panelRef.current.style.setProperty('--glass-y', `${y}px`);
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
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
    };

    return (
        <div
            ref={panelRef}
            className={`relative overflow-hidden ${className}`}
            style={glassStyle}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Mouse-tracking spotlight */}
            <div
                className="absolute inset-0 rounded-[20px] pointer-events-none"
                style={{
                    background: `radial-gradient(
                        300px circle at var(--glass-x, 50%) var(--glass-y, 50%),
                        rgba(255, 255, 255, 0.05) 0%,
                        transparent 60%
                    )`,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Specular border */}
            <div
                className="absolute inset-0 rounded-[20px] pointer-events-none"
                style={{
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    zIndex: 1,
                }}
            />

            {/* Content */}
            <div className="relative p-5" style={{ zIndex: 2 }}>
                {(title || subtitle) && (
                    <div className="flex items-center justify-between mb-4">
                        {title && (
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        )}
                        {subtitle && (
                            <span className="text-sm text-white/60">{subtitle}</span>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

export default GlassInfoPanel;
