import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Sun, Moon, Star, Crown, ChevronRight, Flame, Target, Zap, Play, Volume2, VolumeX } from 'lucide-react';
import { Habit, UserIdentity, IDENTITY_PRESETS } from '../types';
import Icon from './Icons';
import { calculateDailyIdentityScore, countIdentityProofs } from '../utils/helpers';
import { playSound } from '../utils/sound';

interface MorningRitualModalProps {
    isOpen: boolean;
    onClose: () => void;
    identity: UserIdentity | null;
    habits: Habit[];
    language: 'ru' | 'en';
    gender?: 'male' | 'female';
    onStartDay: () => void;
}

const GREETING = {
    morning: { ru: 'Доброе утро', en: 'Good morning', emoji: '☀️' },
    afternoon: { ru: 'Добрый день', en: 'Good afternoon', emoji: '🌤️' },
    evening: { ru: 'Добрый вечер', en: 'Good evening', emoji: '🌙' },
    night: { ru: 'Доброй ночи', en: 'Good night', emoji: '✨' }
};

const getTimeOfDay = (): keyof typeof GREETING => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};

export const MorningRitualModal: React.FC<MorningRitualModalProps> = ({
    isOpen,
    onClose,
    identity,
    habits,
    language,
    gender = 'male',
    onStartDay
}) => {
    const [step, setStep] = useState<'greeting' | 'affirmation' | 'habits' | 'ready'>(isOpen ? 'greeting' : 'greeting');
    const [animateIn, setAnimateIn] = useState(false);
    const [showAffirmation, setShowAffirmation] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const preset = identity ? IDENTITY_PRESETS.find(p => p.id === identity.targetIdentity) : null;
    const timeOfDay = getTimeOfDay();
    const greeting = GREETING[timeOfDay];

    const proofCount = countIdentityProofs(habits, identity);

    // Get top 3 habits for today related to identity
    const todayHabits = habits
        .filter(h => h.type !== 'task' && !h.archived)
        .slice(0, 3);

    useEffect(() => {
        if (isOpen) {
            setStep('greeting');
            setShowAffirmation(false);
            setTimeout(() => setAnimateIn(true), 50);

            // Play morning chime sound
            if (!isMuted) {
                setTimeout(() => playSound('morning'), 300);
            }
            // Auto-advance through steps
            const timers = [
                setTimeout(() => setStep('affirmation'), 2500),
                setTimeout(() => setShowAffirmation(true), 3000),
                setTimeout(() => setStep('habits'), 6000),
                setTimeout(() => setStep('ready'), 9000),
            ];

            return () => timers.forEach(clearTimeout);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);

    if (!isOpen || !identity) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Animated gradient background */}
            <div
                className="absolute inset-0"
                onClick={onClose}
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 60%),
                        linear-gradient(135deg, #0a0a0b 0%, #1a1a2e 50%, #0a0a0b 100%)
                    `,
                    animation: 'gradient-rotate 15s ease infinite',
                    backgroundSize: '400% 400%'
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-white/20"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50"
            >
                <X size={24} />
            </button>

            {/* Mute button */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-6 left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-50"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-8 text-center max-w-lg">

                {/* Step: Greeting */}
                {step === 'greeting' && (
                    <div className="animate-fadeIn space-y-6">
                        <div className="text-6xl mb-4" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
                            {greeting.emoji}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            {greeting[language]}
                        </h1>
                        <p className="text-xl text-white/60 font-medium">
                            {language === 'ru' ? (gender === 'male' ? 'Готов стать лучше?' : 'Готова стать лучше?') : 'Ready to level up?'}
                        </p>
                    </div>
                )}

                {/* Step: Identity + Affirmation */}
                {step === 'affirmation' && (
                    <div className="animate-fadeIn space-y-8">
                        {/* Identity avatar */}
                        <div className="relative mx-auto">
                            {/* Glow */}
                            <div
                                className="absolute inset-0 rounded-full blur-3xl opacity-60"
                                style={{
                                    background: `radial-gradient(circle, #fbbf24 0%, transparent 70%)`,
                                    animation: 'pulse 2s ease-in-out infinite'
                                }}
                            />
                            {/* Avatar */}
                            <div
                                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/30"
                                style={{ animation: 'subtle-float 4s ease-in-out infinite' }}
                            >
                                {preset?.emoji || '✨'}
                                <Crown
                                    size={28}
                                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-yellow-300"
                                    style={{ animation: 'bounce 2s ease-in-out infinite' }}
                                />
                            </div>
                        </div>

                        {/* Identity label */}
                        <div>
                            <p className="text-white/50 text-sm uppercase tracking-wider mb-2">
                                {language === 'ru' ? 'Ты —' : 'You are'}
                            </p>
                            <h2 className="text-3xl font-black text-white mb-2">
                                {preset?.label[language] || identity.targetIdentity}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
                                <Zap size={16} />
                                <span>{proofCount} {language === 'ru' ? 'доказательств' : 'proofs'}</span>
                            </div>
                        </div>

                        {/* Affirmation */}
                        {showAffirmation && identity.affirmation && (
                            <div className="animate-fadeIn mt-4">
                                <p className="text-xl md:text-2xl text-white/90 italic font-medium leading-relaxed">
                                    "{identity.affirmation}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Today's habits */}
                {step === 'habits' && (
                    <div className="animate-fadeIn space-y-6 w-full">
                        <div className="text-center mb-8">
                            <Target size={32} className="text-purple-400 mx-auto mb-3" />
                            <h2 className="text-2xl font-black text-white">
                                {language === 'ru' ? 'Фокус на сегодня' : "Today's Focus"}
                            </h2>
                            <p className="text-white/50 text-sm mt-1">
                                {language === 'ru' ? 'Твои главные привычки' : 'Your key habits'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {todayHabits.map((habit, i) => (
                                <div
                                    key={habit.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/10 animate-fadeIn"
                                    style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: habit.color + '30' }}
                                    >
                                        <Icon name={habit.icon} size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-white">{habit.name}</p>
                                        {habit.time && (
                                            <p className="text-sm text-white/50">{habit.time}</p>
                                        )}
                                    </div>
                                    <ChevronRight size={20} className="text-white/30" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step: Ready */}
                {step === 'ready' && (
                    <div className="animate-fadeIn space-y-8">
                        <div className="relative">
                            <Flame
                                size={80}
                                className="text-orange-500 mx-auto"
                                style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                            />
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                                {language === 'ru' ? 'Ты готов!' : "You're Ready!"}
                            </h2>
                            <p className="text-white/60 mt-2 text-lg">
                                {language === 'ru'
                                    ? 'Сделай сегодня шаг к своей идентичности'
                                    : 'Take one step towards your identity today'
                                }
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                onStartDay();
                                onClose();
                            }}
                            className="mt-8 px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xl rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                        >
                            <Play size={24} fill="white" />
                            {language === 'ru' ? 'Начать день' : 'Start Day'}
                        </button>
                    </div>
                )}

                {/* Progress indicators */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                    {['greeting', 'affirmation', 'habits', 'ready'].map((s, i) => (
                        <button
                            key={s}
                            onClick={() => setStep(s as typeof step)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${step === s
                                ? 'w-8 bg-white'
                                : 'bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* CSS for float animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
                    50% { transform: translateY(-40px) translateX(-10px); opacity: 0.3; }
                    75% { transform: translateY(-20px) translateX(15px); opacity: 0.4; }
                }
                @keyframes subtle-float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
            `}</style>
        </div>
    );
};

export default MorningRitualModal;
