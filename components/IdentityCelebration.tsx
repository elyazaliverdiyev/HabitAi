import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, Star, Zap, X, ChevronRight } from 'lucide-react';
import { UserIdentity, IDENTITY_PRESETS } from '../types';
import { triggerIdentityCelebration } from '../utils/helpers';
import { playSound } from '../utils/sound';

interface IdentityCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    identity: UserIdentity | null;
    milestone: number; // 25, 50, 75, 100
    proofCount: number;
    language: 'ru' | 'en';
}

const MILESTONE_CONFIG: Record<number, {
    title: { ru: string; en: string };
    subtitle: { ru: string; en: string };
    emoji: string;
    colors: string[];
    accentGlow: string;
    confettiShapes: ('circle' | 'star' | 'square')[];
}> = {
    25: {
        title: { ru: 'Начало пути!', en: 'Journey Begins!' },
        subtitle: { ru: 'Ты делаешь первые шаги к новой идентичности', en: 'Taking first steps towards your new identity' },
        emoji: '🌱',
        colors: ['#60A5FA', '#3B82F6', '#1D4ED8'],
        accentGlow: 'rgba(59, 130, 246, 0.5)',
        confettiShapes: ['circle']
    },
    50: {
        title: { ru: 'На полпути!', en: 'Halfway There!' },
        subtitle: { ru: 'Половина пути пройдена. Ты уже меняешься!', en: 'Half the journey complete. You are changing!' },
        emoji: '⚡',
        colors: ['#C084FC', '#A855F7', '#7C3AED'],
        accentGlow: 'rgba(168, 85, 247, 0.5)',
        confettiShapes: ['circle', 'star']
    },
    75: {
        title: { ru: 'Почти там!', en: 'Almost There!' },
        subtitle: { ru: 'Твоя новая идентичность формируется', en: 'Your new identity is taking shape' },
        emoji: '🔥',
        colors: ['#FCD34D', '#F59E0B', '#D97706'],
        accentGlow: 'rgba(245, 158, 11, 0.5)',
        confettiShapes: ['star', 'circle']
    },
    100: {
        title: { ru: 'ИДЕНТИЧНОСТЬ!', en: 'FULL IDENTITY!' },
        subtitle: { ru: 'Ты достиг своей цели! Ты — это ты!', en: 'You achieved your goal! You ARE it!' },
        emoji: '👑',
        colors: ['#FDE68A', '#F59E0B', '#DC2626'],
        accentGlow: 'rgba(251, 191, 36, 0.6)',
        confettiShapes: ['star', 'circle', 'square']
    }
};

export const IdentityCelebration: React.FC<IdentityCelebrationProps> = ({
    isOpen,
    onClose,
    identity,
    milestone,
    proofCount,
    language
}) => {
    const [animateIn, setAnimateIn] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [iconPulse, setIconPulse] = useState(false);

    const preset = identity ? IDENTITY_PRESETS.find(p => p.id === identity.targetIdentity) : null;
    const config = MILESTONE_CONFIG[milestone] || MILESTONE_CONFIG[25];

    useEffect(() => {
        if (isOpen) {
            setAnimateIn(true);

            setTimeout(() => {
                setShowContent(true);
                setIconPulse(true);
                playSound('celebration');

                // CSS-based celebration (replaces canvas-confetti)
                triggerIdentityCelebration(milestone);
            }, 400);
        } else {
            setAnimateIn(false);
            setShowContent(false);
            setIconPulse(false);
        }
    }, [isOpen, milestone]);

    if (!isOpen || !identity) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Premium backdrop with blur */}
            <div
                className="absolute inset-0 backdrop-blur-2xl"
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)'
                }}
                onClick={onClose}
            />

            {/* Animated gradient orbs in background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
                    style={{
                        background: `radial-gradient(circle, ${config.colors[0]} 0%, transparent 70%)`,
                        top: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: 'float 6s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
                    style={{
                        background: `radial-gradient(circle, ${config.colors[2]} 0%, transparent 70%)`,
                        bottom: '20%',
                        right: '10%',
                        animation: 'float 8s ease-in-out infinite reverse'
                    }}
                />
            </div>

            {/* Floating sparkles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <Sparkles
                        key={i}
                        size={8 + i * 2}
                        className="absolute text-white/20"
                        style={{
                            top: `${15 + i * 12}%`,
                            left: `${10 + (i % 3) * 30}%`,
                            animation: `sparkle ${2 + i * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`
                        }}
                    />
                ))}
            </div>

            {/* Main modal card */}
            <div
                className={`relative max-w-sm w-full transition-all duration-500 ${showContent ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10 opacity-0'}`}
            >
                {/* Glassmorphism card */}
                <div
                    className="relative overflow-hidden rounded-[2rem] p-8 text-center"
                    style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: `
                            0 25px 50px -12px rgba(0,0,0,0.5),
                            0 0 60px -15px ${config.accentGlow},
                            inset 0 1px 0 rgba(255,255,255,0.2)
                        `
                    }}
                >
                    {/* Inner glow at top */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${config.colors[0]}80, transparent)`
                        }}
                    />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <X size={18} className="text-white/60 hover:text-white transition-colors" />
                    </button>

                    {/* Milestone badge */}
                    <div className="mb-8 flex justify-center">
                        <div
                            className="relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${config.colors[0]}30, ${config.colors[2]}20)`,
                                border: `1px solid ${config.colors[0]}40`
                            }}
                        >
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    animation: 'shimmer 2s infinite'
                                }}
                            />
                            <span style={{ color: config.colors[0] }}>
                                {milestone}% {language === 'ru' ? 'ДОСТИГНУТО' : 'ACHIEVED'}
                            </span>
                        </div>
                    </div>

                    {/* Identity avatar with premium effects */}
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        {/* Outer rotating ring */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(from 0deg, ${config.colors[0]}, ${config.colors[1]}, ${config.colors[2]}, ${config.colors[0]})`,
                                animation: 'spin 8s linear infinite',
                                opacity: 0.6
                            }}
                        />

                        {/* Inner background circle */}
                        <div
                            className="absolute inset-1 rounded-full"
                            style={{
                                background: 'linear-gradient(145deg, rgba(30,30,40,0.9), rgba(20,20,30,0.95))'
                            }}
                        />

                        {/* Pulsing glow rings */}
                        {milestone >= 100 && (
                            <>
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        boxShadow: `0 0 30px ${config.colors[0]}60`,
                                        animation: 'pulse 2s ease-in-out infinite'
                                    }}
                                />
                                <div
                                    className="absolute -inset-2 rounded-full"
                                    style={{
                                        border: `2px solid ${config.colors[0]}40`,
                                        animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                                    }}
                                />
                            </>
                        )}

                        {/* Main emoji container */}
                        <div
                            className={`relative w-full h-full rounded-full flex items-center justify-center text-5xl ${iconPulse ? 'animate-bounce' : ''}`}
                            style={{
                                background: `linear-gradient(145deg, ${config.colors[0]}40, ${config.colors[2]}30)`,
                                boxShadow: `
                                    0 10px 40px ${config.colors[0]}50,
                                    inset 0 2px 20px rgba(255,255,255,0.1)
                                `,
                                animationDuration: '2s'
                            }}
                        >
                            {preset?.emoji || config.emoji}

                            {/* Crown for 100% - premium positioned */}
                            {milestone >= 100 && (
                                <div
                                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                                    style={{
                                        filter: `drop-shadow(0 0 8px ${config.colors[0]})`
                                    }}
                                >
                                    <Crown
                                        size={28}
                                        fill={config.colors[0]}
                                        color={config.colors[1]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title with gradient text */}
                    <h2
                        className="text-3xl font-black mb-3 tracking-tight"
                        style={{
                            background: `linear-gradient(135deg, ${config.colors[0]} 0%, #fff 50%, ${config.colors[1]} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: `0 0 60px ${config.accentGlow}`
                        }}
                    >
                        {config.title[language]} ✨
                    </h2>

                    {/* Identity name */}
                    <p
                        className="text-xl font-bold mb-2"
                        style={{ color: config.colors[0] }}
                    >
                        {preset?.label[language] || identity.targetIdentity}
                    </p>

                    {/* Subtitle */}
                    <p className="text-white/50 text-sm mb-8 px-4 leading-relaxed">
                        {config.subtitle[language]}
                    </p>

                    {/* Proof count with icon */}
                    <div
                        className="flex items-center justify-center gap-2 text-sm font-semibold mb-8 px-4 py-2.5 rounded-xl mx-auto w-fit"
                        style={{
                            background: `${config.colors[0]}15`,
                            border: `1px solid ${config.colors[0]}25`
                        }}
                    >
                        <Zap size={16} style={{ color: config.colors[0] }} />
                        <span className="text-white/80">
                            {proofCount} {language === 'ru' ? 'доказательств идентичности' : 'identity proofs'}
                        </span>
                    </div>

                    {/* Premium continue button */}
                    <button
                        onClick={onClose}
                        className="group w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative"
                        style={{
                            background: `linear-gradient(135deg, ${config.colors[0]}, ${config.colors[1]})`,
                            boxShadow: `0 10px 30px -5px ${config.accentGlow}`
                        }}
                    >
                        {/* Button shimmer */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                animation: 'shimmer 1.5s infinite'
                            }}
                        />
                        <span className="relative z-10">
                            {language === 'ru' ? 'Продолжить' : 'Continue'}
                        </span>
                        <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Decorative corner accents */}
                    <div
                        className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 rounded-tl-xl opacity-30"
                        style={{ borderColor: config.colors[0] }}
                    />
                    <div
                        className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 rounded-br-xl opacity-30"
                        style={{ borderColor: config.colors[1] }}
                    />
                </div>
            </div>

            {/* Custom keyframes styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-20px); }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default IdentityCelebration;
