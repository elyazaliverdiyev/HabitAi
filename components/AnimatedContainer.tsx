import React from 'react';

interface AnimatedContainerProps {
    children: React.ReactNode;
    className?: string;
    animation?: 'fadeIn' | 'slideUp' | 'frostedIn' | 'scaleIn';
    delay?: number; // delay in ms
    duration?: number; // duration in ms
    stagger?: boolean; // Auto-stagger children
}

/**
 * Animated Container for smooth entrance animations
 * 
 * Use this to wrap elements that should animate on mount
 */
const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
    children,
    className = '',
    animation = 'fadeIn',
    delay = 0,
    duration = 400,
    stagger = false,
}) => {
    const animationClasses = {
        fadeIn: 'animate-fadeIn',
        slideUp: 'animate-slideUp',
        frostedIn: 'animate-[frosted-in_0.5s_ease-out_forwards]',
        scaleIn: 'animate-[scale-in_0.3s_ease-out_forwards]',
    };

    const style: React.CSSProperties = {
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
    };

    if (stagger && React.Children.count(children) > 1) {
        return (
            <div className={className}>
                {React.Children.map(children, (child, index) => (
                    <div
                        key={index}
                        className={`${animationClasses[animation]} opacity-0`}
                        style={{
                            ...style,
                            animationDelay: `${delay + index * 50}ms`,
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${animationClasses[animation]} opacity-0 ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default AnimatedContainer;
