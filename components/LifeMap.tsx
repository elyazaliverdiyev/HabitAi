import React, { useMemo } from 'react';
import { Habit } from '../types';
import { Map } from 'lucide-react';

interface LifeMapProps {
    habits: Habit[];
    language?: 'ru' | 'en';
}

const LIFE_AREAS: { key: string; emoji: string; label: { ru: string; en: string }; categories: string[] }[] = [
    { key: 'health', emoji: '❤️', label: { ru: 'Здоровье', en: 'Health' }, categories: ['Здоровье', 'Health', 'Спорт', 'Sport', 'Fitness'] },
    { key: 'mind', emoji: '🧠', label: { ru: 'Разум', en: 'Mind' }, categories: ['Обучение', 'Education', 'Learning', 'Осознанность', 'Mindfulness'] },
    { key: 'career', emoji: '💼', label: { ru: 'Карьера', en: 'Career' }, categories: ['Карьера', 'Career', 'Продуктивность', 'Productivity'] },
    { key: 'finance', emoji: '💰', label: { ru: 'Финансы', en: 'Finance' }, categories: ['Финансы', 'Finance'] },
    { key: 'social', emoji: '👥', label: { ru: 'Связи', en: 'Social' }, categories: ['Социальное', 'Social', 'Отношения', 'Relationships'] },
    { key: 'creative', emoji: '🎨', label: { ru: 'Творчество', en: 'Creative' }, categories: ['Творчество', 'Creative', 'Хобби', 'Hobby'] },
    { key: 'home', emoji: '🏠', label: { ru: 'Дом', en: 'Home' }, categories: ['Дом', 'Home'] },
    { key: 'selfcare', emoji: '🧘', label: { ru: 'Уход', en: 'Self-care' }, categories: ['Красота', 'Beauty', 'Уход', 'Self-care'] },
];

const LifeMap: React.FC<LifeMapProps> = ({ habits, language = 'ru' }) => {
    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');

    const areas = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return LIFE_AREAS.map(area => {
            const areaHabits = activeHabits.filter(h =>
                h.category && area.categories.some(cat =>
                    h.category!.toLowerCase().includes(cat.toLowerCase())
                )
            );

            if (areaHabits.length === 0) {
                return { ...area, score: 0, habitCount: 0, active: false };
            }

            let totalCompletions = 0;
            areaHabits.forEach(h => {
                totalCompletions += h.completedDates.filter(d => new Date(d) >= thirtyDaysAgo).length;
            });

            const score = Math.min(Math.round((totalCompletions / areaHabits.length / 20) * 100), 100);
            return { ...area, score, habitCount: areaHabits.length, active: true };
        });
    }, [activeHabits]);

    const activeAreas = areas.filter(a => a.active);
    if (activeAreas.length === 0) return null;

    const overallScore = activeAreas.length > 0
        ? Math.round(activeAreas.reduce((sum, a) => sum + a.score, 0) / activeAreas.length)
        : 0;

    // Radar chart math
    const cx = 130, cy = 130;
    const maxR = 100;
    const levels = 4; // concentric rings
    const n = LIFE_AREAS.length;

    const getPoint = (index: number, value: number) => {
        const angle = (2 * Math.PI * index) / n - Math.PI / 2;
        const r = (value / 100) * maxR;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
        };
    };

    const polygonPoints = areas.map((a, i) => getPoint(i, a.score));
    const polygonPath = polygonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    // Score color
    const scoreColor = overallScore >= 70 ? '#22c55e' : overallScore >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ background: `radial-gradient(circle, ${scoreColor}50 0%, transparent 70%)` }} />

            <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20">
                            <Map size={13} className="text-indigo-400" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-textPrimary">
                            {language === 'ru' ? 'Карта Жизни' : 'Life Map'}
                        </h3>
                    </div>
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${overallScore >= 70
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : overallScore >= 40
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {language === 'ru' ? 'Баланс' : 'Balance'}: {overallScore}%
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="flex justify-center">
                    <svg viewBox="-20 -25 300 310" className="w-full max-w-[300px] mx-auto">
                        <defs>
                            <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                            </linearGradient>
                            <linearGradient id="radar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                            <filter id="radar-glow">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feFlood floodColor="#8b5cf6" floodOpacity="0.3" result="color" />
                                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                <feMerge>
                                    <feMergeNode in="shadow" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Background grid levels */}
                        {Array.from({ length: levels }, (_, level) => {
                            const r = ((level + 1) / levels) * maxR;
                            const pts = Array.from({ length: n }, (_, i) => {
                                const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                            }).join(' ');
                            return (
                                <polygon
                                    key={`grid-${level}`}
                                    points={pts}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className="text-white/[0.06]"
                                />
                            );
                        })}

                        {/* Axis lines */}
                        {Array.from({ length: n }, (_, i) => {
                            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                            return (
                                <line
                                    key={`axis-${i}`}
                                    x1={cx} y1={cy}
                                    x2={cx + maxR * Math.cos(angle)}
                                    y2={cy + maxR * Math.sin(angle)}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className="text-white/[0.06]"
                                />
                            );
                        })}

                        {/* Data polygon */}
                        <path
                            d={polygonPath}
                            fill="url(#radar-fill)"
                            stroke="url(#radar-stroke)"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            filter="url(#radar-glow)"
                            style={{
                                animation: 'radar-appear 0.8s ease-out both',
                            }}
                        />

                        {/* Data points */}
                        {polygonPoints.map((point, i) => (
                            areas[i].active && (
                                <circle
                                    key={`point-${i}`}
                                    cx={point.x} cy={point.y}
                                    r="3.5"
                                    fill={areas[i].score >= 70 ? '#22c55e' : areas[i].score >= 40 ? '#f59e0b' : '#ef4444'}
                                    stroke="var(--color-surface)"
                                    strokeWidth="1.5"
                                    style={{
                                        animation: `radar-dot-pop 0.4s ease-out ${0.5 + i * 0.05}s both`,
                                    }}
                                />
                            )
                        ))}

                        {/* Labels with emoji */}
                        {LIFE_AREAS.map((area, i) => {
                            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                            const labelR = maxR + 18;
                            const lx = cx + labelR * Math.cos(angle);
                            const ly = cy + labelR * Math.sin(angle);
                            const areaData = areas[i];
                            return (
                                <g key={`label-${i}`}>
                                    <text
                                        x={lx} y={ly - 5}
                                        textAnchor="middle"
                                        style={{ fontSize: '13px' }}
                                    >
                                        {area.emoji}
                                    </text>
                                    <text
                                        x={lx} y={ly + 8}
                                        textAnchor="middle"
                                        style={{ fontSize: '7px', fontWeight: 700, fill: areaData.active ? 'var(--text-secondary)' : 'var(--text-secondary)', opacity: areaData.active ? 1 : 0.3 }}
                                    >
                                        {areaData.active ? `${areaData.score}%` : '—'}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Center label */}
                        <text
                            x={cx} y={cy + 3}
                            textAnchor="middle"
                            style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fill: 'var(--text-secondary)' }}
                        >
                            {language === 'ru' ? 'БАЛАНС' : 'BALANCE'}
                        </text>
                    </svg>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes radar-appear {
                    from {
                        opacity: 0;
                        d: path('M ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} L ${cx} ${cy} Z');
                    }
                    to { opacity: 1; }
                }
                @keyframes radar-dot-pop {
                    from { r: 0; opacity: 0; }
                    to { r: 3.5; opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LifeMap;
