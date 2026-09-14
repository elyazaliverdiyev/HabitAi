import React, { useState, useCallback, useRef, useEffect } from 'react';

interface Spark {
    id: number;
    x: number;
    y: number;
    angle: number;
}

interface ClickSparkProps {
    /** Color of sparks (default: brand color) */
    sparkColor?: string;
    /** Number of sparks per click (default: 8) */
    sparkCount?: number;
    /** Length of spark lines in pixels (default: 10) */
    sparkSize?: number;
    /** How far sparks travel in pixels (default: 30) */
    sparkRadius?: number;
    /** Animation duration in ms (default: 400) */
    duration?: number;
    /** Children to wrap with click spark effect */
    children: React.ReactNode;
    /** Additional className for wrapper */
    className?: string;
    /** Whether the effect is enabled (default: true) */
    enabled?: boolean;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
    sparkColor = 'var(--brand)',
    sparkCount = 8,
    sparkSize = 10,
    sparkRadius = 30,
    duration = 400,
    children,
    className = '',
    enabled = true
}) => {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const sparkIdRef = useRef(0);

    const createSparks = useCallback((e: React.MouseEvent) => {
        if (!enabled || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newSparks: Spark[] = [];
        const angleStep = (2 * Math.PI) / sparkCount;

        for (let i = 0; i < sparkCount; i++) {
            newSparks.push({
                id: sparkIdRef.current++,
                x,
                y,
                angle: angleStep * i + (Math.random() - 0.5) * 0.3 // Slight randomness
            });
        }

        setSparks(prev => [...prev, ...newSparks]);

        // Clean up sparks after animation
        setTimeout(() => {
            setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id)));
        }, duration);
    }, [enabled, sparkCount, duration]);

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            onClick={createSparks}
            style={{ overflow: 'visible' }}
        >
            {children}

            {/* Sparks container */}
            <div className="pointer-events-none absolute inset-0" style={{ overflow: 'visible', zIndex: 50 }}>
                {sparks.map(spark => {
                    const uniqueAnimName = `spark-fly-${spark.id}`;
                    return (
                        <React.Fragment key={spark.id}>
                            <style>{`
                                @keyframes ${uniqueAnimName} {
                                    0% {
                                        opacity: 1;
                                        transform: rotate(${spark.angle}rad) translateX(0) scaleX(1);
                                    }
                                    100% {
                                        opacity: 0;
                                        transform: rotate(${spark.angle}rad) translateX(${sparkRadius}px) scaleX(0.3);
                                    }
                                }
                            `}</style>
                            <div
                                className="absolute"
                                style={{
                                    left: spark.x,
                                    top: spark.y,
                                    width: sparkSize,
                                    height: 2,
                                    backgroundColor: sparkColor,
                                    borderRadius: 1,
                                    transformOrigin: 'left center',
                                    animation: `${uniqueAnimName} ${duration}ms ease-out forwards`,
                                    boxShadow: `0 0 4px ${sparkColor}, 0 0 8px ${sparkColor}`,
                                }}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ClickSpark;
