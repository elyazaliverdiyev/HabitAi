import React from 'react';

interface ShinyTextProps {
    /** Text content to display */
    children: React.ReactNode;
    /** Animation speed in seconds (default: 3) */
    speed?: number;
    /** Animation delay in seconds (default: 0) */
    delay?: number;
    /** Shine color (default: white) */
    shineColor?: string;
    /** Additional className */
    className?: string;
    /** Whether animation is enabled (default: true) */
    animated?: boolean;
}

const ShinyText: React.FC<ShinyTextProps> = ({
    children,
    speed = 3,
    delay = 0,
    shineColor = 'rgba(255, 255, 255, 0.4)',
    className = '',
    animated = true,
}) => {
    const uniqueId = React.useId().replace(/:/g, '');

    return (
        <span className={`relative inline-block ${className}`}>
            {/* Base text */}
            {children}

            {/* Shine overlay */}
            {animated && (
                <>
                    <span
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                        style={{
                            background: `linear-gradient(
                                120deg,
                                transparent 30%,
                                ${shineColor} 50%,
                                transparent 70%
                            )`,
                            backgroundSize: '200% 100%',
                            animation: `shiny-sweep-${uniqueId} ${speed}s linear infinite`,
                            animationDelay: `${delay}s`,
                            mixBlendMode: 'overlay',
                        }}
                        aria-hidden="true"
                    />
                    <style>{`
                        @keyframes shiny-sweep-${uniqueId} {
                            0% {
                                background-position: 200% center;
                            }
                            100% {
                                background-position: -200% center;
                            }
                        }
                    `}</style>
                </>
            )}
        </span>
    );
};

// Preset variants for common use cases
export const ShinyGold: React.FC<Omit<ShinyTextProps, 'shineColor'>> = (props) => (
    <ShinyText {...props} shineColor="rgba(255, 215, 0, 0.5)" />
);

export const ShinyPro: React.FC<Omit<ShinyTextProps, 'shineColor'>> = (props) => (
    <ShinyText {...props} shineColor="rgba(255, 255, 255, 0.5)" speed={2} />
);

export const ShinyBrand: React.FC<Omit<ShinyTextProps, 'shineColor'>> = (props) => (
    <ShinyText {...props} shineColor="rgba(255, 255, 255, 0.6)" />
);

export default ShinyText;
