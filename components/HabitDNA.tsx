import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Dna } from 'lucide-react';

interface HabitDNAProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

// Premium Activity Rings DNA visualization
const HabitDNA: React.FC<HabitDNAProps> = ({ habits, language = 'ru' }) => {
    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');

    const dnaData = useMemo(() => {
        if (activeHabits.length === 0) return null;

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const segments = activeHabits.slice(0, 8).map(habit => {
            const recent = habit.completedDates.filter(d => new Date(d) >= thirtyDaysAgo).length;
            const consistency = Math.min(recent / 20, 1);

            let currentStreak = 0;
            const todayStr = new Date().toISOString().slice(0, 10);
            let check = new Date();
            if (!habit.completedDates.includes(todayStr)) check.setDate(check.getDate() - 1);
            while (currentStreak < 100) {
                const dateStr = check.toISOString().slice(0, 10);
                if (habit.completedDates.includes(dateStr)) {
                    currentStreak++;
                    check.setDate(check.getDate() - 1);
                } else break;
            }

            const streakBonus = Math.min(currentStreak / 30, 1);
            const strength = Math.min((consistency * 0.6 + streakBonus * 0.4) * 1.2, 1);

            return {
                name: habit.name,
                color: habit.color || '#6366f1',
                strength,
                total: habit.completedDates.length,
                streak: currentStreak,
                icon: habit.icon,
            };
        });

        const overallScore = Math.round(
            (segments.reduce((sum, s) => sum + s.strength, 0) / segments.length) * 100
        );

        return { segments, overallScore };
    }, [activeHabits]);

    if (!dnaData || dnaData.segments.length === 0) return null;

    const cx = 100, cy = 100;
    const ringWidth = 7;
    const ringGap = 3;
    const maxR = 90;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Ambient glows */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: `radial-gradient(circle, ${dnaData.segments[0]?.color}40 0%, transparent 70%)` }} />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: `radial-gradient(circle, ${dnaData.segments[Math.min(1, dnaData.segments.length - 1)]?.color}30 0%, transparent 70%)` }} />

            <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
                            <Dna size={13} className="text-violet-400" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                            {language === 'ru' ? 'ДНК Привычек' : 'Habit DNA'}
                        </h3>
                    </div>
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${dnaData.overallScore >= 70
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : dnaData.overallScore >= 40
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {language === 'ru' ? 'Сила' : 'Power'}: {dnaData.overallScore}%
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Activity Rings SVG */}
                    <div className="relative shrink-0">
                        <svg width="200" height="200" viewBox="0 0 200 200" className="w-[180px] h-[180px]">
                            <defs>
                                {dnaData.segments.map((seg, i) => (
                                    <linearGradient key={`grad-${i}`} id={`ring-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                                        <stop offset="100%" stopColor={seg.color} stopOpacity="0.6" />
                                    </linearGradient>
                                ))}
                                {dnaData.segments.map((seg, i) => (
                                    <filter key={`glow-${i}`} id={`ring-glow-${i}`}>
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feFlood floodColor={seg.color} floodOpacity="0.4" result="color" />
                                        <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                        <feMerge>
                                            <feMergeNode in="shadow" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                ))}
                            </defs>

                            {/* Background tracks */}
                            {dnaData.segments.map((_, i) => {
                                const r = maxR - i * (ringWidth + ringGap);
                                if (r < 20) return null;
                                const circumference = 2 * Math.PI * r;
                                return (
                                    <circle
                                        key={`bg-${i}`}
                                        cx={cx} cy={cy} r={r}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={ringWidth}
                                        strokeLinecap="round"
                                        className="text-white/[0.04]"
                                        strokeDasharray={`${circumference}`}
                                    />
                                );
                            })}

                            {/* Active rings */}
                            {dnaData.segments.map((seg, i) => {
                                const r = maxR - i * (ringWidth + ringGap);
                                if (r < 20) return null;
                                const circumference = 2 * Math.PI * r;
                                const progress = seg.strength * circumference;
                                return (
                                    <circle
                                        key={`ring-${i}`}
                                        cx={cx} cy={cy} r={r}
                                        fill="none"
                                        stroke={`url(#ring-grad-${i})`}
                                        strokeWidth={ringWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={`${progress} ${circumference}`}
                                        filter={`url(#ring-glow-${i})`}
                                        className="-rotate-90 origin-center"
                                        style={{
                                            transformOrigin: `${cx}px ${cy}px`,
                                            animation: `dna-ring-appear 1s ease-out ${i * 0.1}s both`,
                                        }}
                                    />
                                );
                            })}

                            {/* Glowing end caps */}
                            {dnaData.segments.map((seg, i) => {
                                const r = maxR - i * (ringWidth + ringGap);
                                if (r < 20) return null;
                                const angle = (seg.strength * 2 * Math.PI) - Math.PI / 2;
                                const capX = cx + r * Math.cos(angle);
                                const capY = cy + r * Math.sin(angle);
                                return (
                                    <circle
                                        key={`cap-${i}`}
                                        cx={capX} cy={capY}
                                        r={ringWidth / 2 + 1}
                                        fill={seg.color}
                                        opacity="0.8"
                                        style={{
                                            animation: `dna-pulse 2s ease-in-out ${i * 0.3}s infinite`,
                                        }}
                                    />
                                );
                            })}

                            {/* Center orb */}
                            <circle cx={cx} cy={cy} r="25" fill="var(--color-surface)" />
                            <circle cx={cx} cy={cy} r="24"
                                fill="none"
                                stroke="url(#center-orb-grad)"
                                strokeWidth="1.5"
                                opacity="0.3"
                            />
                            <defs>
                                <linearGradient id="center-orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="50%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                            <text
                                x={cx} y={cy - 3}
                                textAnchor="middle"
                                style={{ fontSize: '20px', fontWeight: 900, fill: 'var(--text-primary)' }}
                            >
                                {dnaData.overallScore}
                            </text>
                            <text
                                x={cx} y={cy + 10}
                                textAnchor="middle"
                                style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fill: 'var(--text-secondary)' }}
                            >
                                {language === 'ru' ? 'БАЛЛОВ' : 'SCORE'}
                            </text>
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-1 max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
                        {dnaData.segments.map((seg, i) => {
                            const r = maxR - i * (ringWidth + ringGap);
                            if (r < 20) return null;
                            return (
                                <div key={i} className="flex items-center gap-2 group">
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0 ring-2 ring-offset-1"
                                        style={{
                                            backgroundColor: seg.color,
                                            boxShadow: `0 0 6px ${seg.color}60`,
                                            ringColor: `${seg.color}30`,
                                            // @ts-ignore
                                            '--tw-ring-offset-color': 'var(--color-surface)',
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-textPrimary truncate">{seg.name}</p>
                                            <span className="text-[9px] text-textSecondary font-bold shrink-0 ml-1">
                                                {Math.round(seg.strength * 100)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${seg.strength * 100}%`,
                                                        background: `linear-gradient(90deg, ${seg.color}90, ${seg.color})`,
                                                        boxShadow: `0 0 4px ${seg.color}40`,
                                                    }}
                                                />
                                            </div>
                                            {seg.streak > 0 && (
                                                <span className="text-[8px] text-amber-400/80 font-bold shrink-0">
                                                    {seg.streak}🔥
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes dna-ring-appear {
                    from {
                        stroke-dasharray: 0 1000;
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes dna-pulse {
                    0%, 100% { opacity: 0.5; r: ${ringWidth / 2 + 1}; }
                    50% { opacity: 1; r: ${ringWidth / 2 + 2}; }
                }
            `}</style>
        </div>
    );
};

export default HabitDNA;
