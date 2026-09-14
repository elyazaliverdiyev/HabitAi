
import React from 'react';

interface AuroraProps {
    /** Aurora color stops as CSS colors */
    colors?: [string, string, string];
    /** Animation speed in seconds (default: 6) */
    speed?: number;
    /** Blur intensity in px (default: 80) */
    blur?: number;
    /** Opacity (default: 0.6) */
    opacity?: number;
    /** Additional className */
    className?: string;
}

const Aurora: React.FC<AuroraProps> = ({
    colors = ['#4285f4', '#ea4335', '#34a853'],
    speed = 6,
    blur = 80,
    opacity = 0.6,
    className = ''
}) => {
    const uniqueId = React.useId().replace(/:/g, '');

    return (
        <div className={`aurora-container ${className}`} style={{ opacity }}>
            <div
                className="aurora-blob aurora-blob-1"
                style={{
                    background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
                    animationDuration: `${speed}s`,
                }}
            />
            <div
                className="aurora-blob aurora-blob-2"
                style={{
                    background: `radial-gradient(circle, ${colors[1]} 0%, transparent 70%)`,
                    animationDuration: `${speed * 1.3}s`,
                }}
            />
            <div
                className="aurora-blob aurora-blob-3"
                style={{
                    background: `radial-gradient(circle, ${colors[2]} 0%, transparent 70%)`,
                    animationDuration: `${speed * 0.8}s`,
                }}
            />
            <style>{`
                .aurora-container {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: 0;
                    filter: blur(${blur}px);
                }
                .aurora-blob {
                    position: absolute;
                    width: 60%;
                    height: 60%;
                    border-radius: 50%;
                    mix-blend-mode: screen;
                    will-change: transform;
                }
                .aurora-blob-1 {
                    top: -20%;
                    left: -10%;
                    animation: aurora-move-1-${uniqueId} var(--aurora-speed, ${speed}s) ease-in-out infinite alternate;
                }
                .aurora-blob-2 {
                    top: 10%;
                    right: -20%;
                    animation: aurora-move-2-${uniqueId} var(--aurora-speed, ${speed * 1.3}s) ease-in-out infinite alternate;
                }
                .aurora-blob-3 {
                    bottom: -20%;
                    left: 20%;
                    animation: aurora-move-3-${uniqueId} var(--aurora-speed, ${speed * 0.8}s) ease-in-out infinite alternate;
                }
                @keyframes aurora-move-1-${uniqueId} {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(30%, 20%) scale(1.2); }
                }
                @keyframes aurora-move-2-${uniqueId} {
                    0% { transform: translate(0, 0) scale(1.1); }
                    100% { transform: translate(-25%, 15%) scale(0.9); }
                }
                @keyframes aurora-move-3-${uniqueId} {
                    0% { transform: translate(0, 0) scale(0.9); }
                    100% { transform: translate(20%, -25%) scale(1.3); }
                }
            `}</style>
        </div>
    );
};

export default Aurora;
