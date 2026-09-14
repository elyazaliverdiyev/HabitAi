import React, { useCallback, useRef } from 'react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    rippleColor?: string;
}

/**
 * Button with material-style ripple effect
 */
export const RippleButton: React.FC<RippleButtonProps> = ({
    children,
    className = '',
    rippleColor = 'currentColor',
    onClick,
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = rippleColor;

        button.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });

        onClick?.(e);
    }, [onClick, rippleColor]);

    return (
        <button
            ref={buttonRef}
            className={`ripple-container ${className}`}
            onClick={createRipple}
            {...props}
        >
            {children}
        </button>
    );
};

/**
 * Hook to add ripple effect to any element
 */
export const useRipple = (color: string = 'currentColor') => {
    const ref = useRef<HTMLElement>(null);

    const triggerRipple = useCallback((e: React.MouseEvent) => {
        const element = ref.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = color;

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }, [color]);

    return { ref, triggerRipple };
};

/**
 * Wrapper to add ripple effect to any child
 */
export const RippleWrapper: React.FC<{
    children: React.ReactNode;
    className?: string;
    color?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ children, className = '', color = 'currentColor', onClick }) => {
    const divRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const element = divRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = color;

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });

        onClick?.(e);
    }, [color, onClick]);

    return (
        <div ref={divRef} className={`ripple-container ${className}`} onClick={handleClick}>
            {children}
        </div>
    );
};

export default RippleButton;
