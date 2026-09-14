import React from 'react';
import { Sparkles } from 'lucide-react';

interface GeminiLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    showText?: boolean;
}

/**
 * Gemini-style loading indicator with pulsing gradient orb
 * Based on Google's Gemini AI visual design language
 */
const GeminiLoader: React.FC<GeminiLoaderProps> = ({
    size = 'md',
    text,
    showText = true
}) => {
    const dimensions = {
        sm: { orb: 40, icon: 16, glow1: 60, glow2: 80 },
        md: { orb: 60, icon: 24, glow1: 90, glow2: 120 },
        lg: { orb: 84, icon: 32, glow1: 130, glow2: 180 }
    }[size];

    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <div className="relative flex items-center justify-center" style={{ width: dimensions.glow2, height: dimensions.glow2 }}>

                {/* Layer 1: Massive soft outer glow (Liquid vibe) */}
                <div
                    className="absolute rounded-full opacity-20 blur-[40px] animate-pulse-slow"
                    style={{
                        width: dimensions.glow2,
                        height: dimensions.glow2,
                        background: 'conic-gradient(from var(--gemini-angle, 0deg), #4285f4, #9b72cb, #d96570, #f4b400, #34a853, #4285f4)',
                        animation: 'gemini-rotate 4s linear infinite'
                    }}
                />

                {/* Layer 2: Medium glow with hue-rotate */}
                <div
                    className="absolute rounded-full opacity-40 blur-[20px]"
                    style={{
                        width: dimensions.glow1,
                        height: dimensions.glow1,
                        background: 'linear-gradient(135deg, #4285f4, #9b72cb, #d96570)',
                        animation: 'gemini-rotate 3s linear infinite reverse'
                    }}
                />

                {/* Layer 3: The "Conic Rainbow" Orb Border */}
                <div
                    className="absolute rounded-full p-[3px] shadow-2xl"
                    style={{
                        width: dimensions.orb,
                        height: dimensions.orb,
                        background: 'conic-gradient(from var(--gemini-angle, 0deg), #4285f4, #9161eb, #d96570, #f4b400, #34a853, #4285f4)',
                        animation: 'gemini-rotate 2s linear infinite'
                    }}
                >
                    {/* Inner Orb - Deep surface */}
                    <div className="w-full h-full rounded-full bg-[#0a0a0b] flex items-center justify-center relative overflow-hidden">
                        {/* Subtle inner gradient movement */}
                        <div
                            className="absolute inset-0 opacity-40 blur-md"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #4285f4, transparent), radial-gradient(circle at 70% 70%, #d96570, transparent)',
                                animation: 'subtle-float 4s ease-in-out infinite'
                            }}
                        />

                        <Sparkles
                            size={dimensions.icon}
                            className="text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        />
                    </div>
                </div>

                {/* Layer 4: Floating "Satellites" (particles of light) */}
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff] opacity-60"
                        style={{
                            animation: `gemini-rotate ${3 + i}s linear infinite`,
                            transform: `rotate(${i * 120}deg) translateX(${dimensions.orb / 1.5}px)`
                        }}
                    />
                ))}
            </div>

            {showText && text && (
                <div className="relative">
                    <p className="text-sm font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand via-purple-400 to-brand animate-gradient-rotate bg-[length:200%_auto]">
                        {text}
                    </p>
                    <div className="h-[1px] w-full mt-1 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
                </div>
            )}
        </div>
    );
};

/**
 * Gemini-style shimmer effect for skeleton loading
 */
export const GeminiShimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
        className={`relative overflow-hidden ${className}`}
        style={{
            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05) 0%, rgba(155, 114, 203, 0.08) 50%, rgba(217, 101, 112, 0.05) 100%)'
        }}
    >
        <div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
            }}
        />
    </div>
);

/**
 * Gemini button with gradient styling
 */
export const GeminiButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}> = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', icon }) => {
    const baseStyles = "font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    }[size];

    const variantStyles = {
        primary: {
            background: 'linear-gradient(135deg, #4285f4 0%, #9b72cb 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(155, 114, 203, 0.4)'
        },
        secondary: {
            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1) 0%, rgba(155, 114, 203, 0.15) 100%)',
            color: '#9b72cb',
            border: '1px solid rgba(155, 114, 203, 0.3)'
        },
        ghost: {
            background: 'transparent',
            color: '#9b72cb'
        }
    }[variant];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${sizeStyles} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={variantStyles}
        >
            {icon}
            {children}
        </button>
    );
};

/**
 * Gemini card with subtle gradient border
 */
export const GeminiCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    accentGradient?: string;
    frosted?: boolean;
}> = ({ children, className = '', onClick, hoverable = false, accentGradient, frosted = false }) => (
    <div
        onClick={onClick}
        className={`
            relative rounded-2xl overflow-hidden 
            ${frosted ? 'frosted-card' : 'bg-surface'}
            ${hoverable ? 'cursor-pointer card-interactive' : ''}
            ${className}
        `}
        style={frosted ? undefined : {
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
        }}
    >
        {/* Top gradient accent */}
        <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
                background: accentGradient || 'linear-gradient(90deg, #4285f4 0%, #9b72cb 50%, #d96570 100%)'
            }}
        />
        {children}
    </div>
);

/**
 * iOS-style Frosted Glass Card
 * "Less blur = more elegance" - crisp, vibrant backdrop
 */
export const FrostedCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => (
    <div
        onClick={onClick}
        className={`
            frosted-card overflow-hidden
            ${hoverable ? 'cursor-pointer card-interactive' : ''}
            ${className}
        `}
    >
        {children}
    </div>
);

/**
 * Frosted Modal wrapper for iOS-style modal dialogs
 */
export const FrostedModal: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`frosted-modal overflow-hidden ${className}`}>
        {children}
    </div>
);


/**
 * Gemini gradient text
 */
export const GeminiText: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <span
        className={`font-bold ${className}`}
        style={{
            background: 'linear-gradient(135deg, #4285f4 0%, #9b72cb 50%, #d96570 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}
    >
        {children}
    </span>
);

export default GeminiLoader;
