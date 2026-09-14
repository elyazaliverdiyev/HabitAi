import React, { useState, useEffect, useCallback } from 'react';
import { X, Flame, Star, Crown, Zap, Trophy } from 'lucide-react';

interface MilestoneCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    streak: number;
    habitName: string;
    language: 'ru' | 'en';
}

const MILESTONES: Record<number, { emoji: string; titleRu: string; titleEn: string; color: string; particles: number }> = {
    3: { emoji: '🌱', titleRu: 'Первые всходы!', titleEn: 'First Sprouts!', color: '#22c55e', particles: 12 },
    7: { emoji: '🔥', titleRu: 'Неделя огня!', titleEn: 'Week of Fire!', color: '#f97316', particles: 20 },
    14: { emoji: '⚡', titleRu: 'Двойная неделя!', titleEn: 'Double Week!', color: '#eab308', particles: 25 },
    21: { emoji: '🧠', titleRu: 'Привычка формируется!', titleEn: 'Habit is Forming!', color: '#8b5cf6', particles: 30 },
    30: { emoji: '💎', titleRu: 'Месяц стали!', titleEn: 'Month of Steel!', color: '#3b82f6', particles: 40 },
    60: { emoji: '👑', titleRu: 'Двойной мастер!', titleEn: 'Double Master!', color: '#a855f7', particles: 50 },
    90: { emoji: '🏆', titleRu: 'Легенда квартала!', titleEn: 'Quarter Legend!', color: '#ef4444', particles: 60 },
    100: { emoji: '🌟', titleRu: 'Сотня! Невероятно!', titleEn: '100! Incredible!', color: '#f59e0b', particles: 80 },
};

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
    isOpen,
    onClose,
    streak,
    habitName,
    language,
}) => {
    const [animateIn, setAnimateIn] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number; size: number }>>([]);

    const milestone = MILESTONES[streak] || MILESTONES[7]; // fallback

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setAnimateIn(true), 50);

            // Generate particles
            const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', milestone.color];
            const newParticles = Array.from({ length: milestone.particles }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.8,
                size: 4 + Math.random() * 8,
            }));
            setParticles(newParticles);

            // Auto-close after 4 seconds
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        } else {
            setAnimateIn(false);
            setParticles([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        animation: `celebrationParticle 2s ease-out ${p.delay}s forwards`,
                        opacity: 0,
                    }}
                />
            ))}

            {/* Main content */}
            <div className={`relative z-10 flex flex-col items-center text-center px-8 transition-all duration-500 ease-out ${animateIn ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}>
                {/* Big emoji */}
                <div className="text-8xl mb-4 animate-bounce" style={{ animationDuration: '1.5s' }}>
                    {milestone.emoji}
                </div>

                {/* Streak number with glow */}
                <div
                    className="text-7xl font-black mb-2"
                    style={{
                        color: milestone.color,
                        textShadow: `0 0 40px ${milestone.color}80, 0 0 80px ${milestone.color}40`,
                    }}
                >
                    {streak}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-2">
                    {language === 'ru' ? milestone.titleRu : milestone.titleEn}
                </h2>

                {/* Habit name */}
                <p className="text-sm text-white/60 mb-6 max-w-xs">
                    {habitName}
                </p>

                {/* Streak fire icons */}
                <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: Math.min(streak, 10) }, (_, i) => (
                        <Flame
                            key={i}
                            size={16}
                            className="text-orange-400"
                            style={{
                                animation: `celebrationFlame 0.5s ease ${i * 0.05}s forwards`,
                                opacity: 0,
                            }}
                        />
                    ))}
                </div>

                {/* Tap to close */}
                <p className="text-xs text-white/30">
                    {language === 'ru' ? 'Нажмите чтобы закрыть' : 'Tap to close'}
                </p>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes celebrationParticle {
                    0% { transform: scale(0) translateY(0); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: scale(1) translateY(-200px) rotate(${Math.random() * 360}deg); opacity: 0; }
                }
                @keyframes celebrationFlame {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MilestoneCelebration;
