import React from 'react';

interface BorderGlowProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    glowColorTwo?: string;
    borderRadius?: string;
    animationSpeed?: number;
    borderWidth?: number;
}

/**
 * BorderGlow — rotating conic-gradient border effect.
 * Pure CSS animation, no external dependencies.
 */
const BorderGlow: React.FC<BorderGlowProps> = ({
    children,
    className = '',
    glowColor = '#7c3aed',
    glowColorTwo = '#06b6d4',
    borderRadius = '1rem',
    animationSpeed = 3,
    borderWidth = 2,
}) => {
    return (
        <div
            className={`relative ${className}`}
            style={{ borderRadius }}
        >
            {/* Rotating gradient border */}
            <div
                className="absolute inset-0 rounded-[inherit] overflow-hidden"
                style={{ padding: borderWidth }}
            >
                <div
                    className="absolute inset-[-50%] rounded-[inherit]"
                    style={{
                        background: `conic-gradient(from 0deg, ${glowColor}, ${glowColorTwo}, transparent, ${glowColor})`,
                        animation: `border-glow-spin ${animationSpeed}s linear infinite`,
                    }}
                />
                {/* Inner background to create border effect */}
                <div
                    className="absolute rounded-[inherit] bg-surface"
                    style={{
                        inset: borderWidth,
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            <style>{`
                @keyframes border-glow-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default React.memo(BorderGlow);
