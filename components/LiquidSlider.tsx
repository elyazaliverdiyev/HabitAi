import React, { useRef, useState, useCallback, useEffect } from 'react';

interface LiquidSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    accentColor?: string;
    className?: string;
}

const LiquidSlider: React.FC<LiquidSliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    accentColor = '#7c3aed',
    className = ''
}) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Convert value to percentage
    const percent = ((value - min) / (max - min)) * 100;

    const updateValue = useCallback((clientX: number) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        let newPercent = (offsetX / rect.width) * 100;
        newPercent = Math.max(0, Math.min(100, newPercent));

        // Convert percentage to value
        let newValue = min + (newPercent / 100) * (max - min);

        // Apply step
        if (step > 0) {
            newValue = Math.round(newValue / step) * step;
        }

        // Clamp to min/max
        newValue = Math.max(min, Math.min(max, newValue));

        onChange(newValue);
    }, [min, max, step, onChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setIsActive(true);
        updateValue(e.clientX);
    }, [updateValue]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        setIsActive(true);
        updateValue(e.touches[0].clientX);
    }, [updateValue]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            updateValue(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            updateValue(e.touches[0].clientX);
        };

        const handleEnd = () => {
            setIsDragging(false);
            setIsActive(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, updateValue]);

    return (
        <div
            ref={sliderRef}
            className={`relative h-2.5 rounded-full cursor-pointer touch-none ${className}`}
            style={{
                background: 'var(--surface-highlight, #D6D6DA)',
                width: '100%'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Progress Track */}
            <div
                className="absolute h-full rounded-full"
                style={{
                    width: `${percent}%`,
                    background: accentColor,
                    zIndex: 1
                }}
            />

            {/* Simple Thumb */}
            <div
                className="absolute top-1/2 rounded-full"
                style={{
                    left: `${percent}%`,
                    transform: `translate(-50%, -50%)`,
                    width: isActive ? '24px' : '20px',
                    height: isActive ? '24px' : '20px',
                    zIndex: 2,
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.15)',
                    transition: 'width 100ms, height 100ms',
                }}
            />
        </div>
    );
};

export default LiquidSlider;
