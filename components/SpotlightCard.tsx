
import React, { useRef } from 'react';

interface SpotlightCardProps extends React.PropsWithChildren {
    /** Additional className */
    className?: string;
    /** Spotlight color as rgba string */
    spotlightColor?: string;
    /** Spotlight size in % (default: 250) */
    spotlightSize?: number;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    className = '',
    spotlightColor = 'rgba(255, 255, 255, 0.08)',
    spotlightSize = 250
}) => {
    const divRef = useRef<HTMLDivElement>(null);

    const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        divRef.current.style.setProperty('--spotlight-x', `${x}px`);
        divRef.current.style.setProperty('--spotlight-y', `${y}px`);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`spotlight-card ${className}`}
            style={{
                '--spotlight-color': spotlightColor,
                '--spotlight-size': `${spotlightSize}px`
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

export default SpotlightCard;
