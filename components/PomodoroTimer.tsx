import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Coffee, Flame } from 'lucide-react';

interface PomodoroTimerProps {
    habitName: string;
    habitColor: string;
    habitIcon?: string;
    defaultMinutes?: number;
    onComplete?: () => void;
    onClose: () => void;
    language?: 'ru' | 'en';
}

type Phase = 'work' | 'break' | 'longBreak';

const PHASE_LABELS: Record<Phase, { ru: string; en: string }> = {
    work: { ru: 'Работа', en: 'Work' },
    break: { ru: 'Перерыв', en: 'Break' },
    longBreak: { ru: 'Длинный перерыв', en: 'Long Break' },
};

const BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const SESSIONS_BEFORE_LONG_BREAK = 4;

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
    habitName,
    habitColor,
    defaultMinutes = 25,
    onComplete,
    onClose,
    language = 'ru',
}) => {
    const [workMinutes, setWorkMinutes] = useState(defaultMinutes);
    const [phase, setPhase] = useState<Phase>('work');
    const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [totalFocusTime, setTotalFocusTime] = useState(0); // in seconds

    const intervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Create a beep sound using Web Audio API
    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
            // Vibrate if available
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) { }
    }, []);

    const getTotalTime = useCallback(() => {
        switch (phase) {
            case 'work': return workMinutes * 60;
            case 'break': return BREAK_MINUTES * 60;
            case 'longBreak': return LONG_BREAK_MINUTES * 60;
        }
    }, [phase, workMinutes]);

    // Timer tick
    useEffect(() => {
        if (!isRunning) return;

        intervalRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Phase complete
                    playBeep();
                    setIsRunning(false);

                    if (phase === 'work') {
                        const newSessions = sessions + 1;
                        setSessions(newSessions);
                        setTotalFocusTime(f => f + workMinutes * 60);

                        // onComplete triggers after each work session
                        onComplete?.();

                        // Decide next phase
                        if (newSessions % SESSIONS_BEFORE_LONG_BREAK === 0) {
                            setPhase('longBreak');
                            return LONG_BREAK_MINUTES * 60;
                        } else {
                            setPhase('break');
                            return BREAK_MINUTES * 60;
                        }
                    } else {
                        // Break done => start new work session
                        setPhase('work');
                        return workMinutes * 60;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, phase, sessions, workMinutes, playBeep, onComplete]);

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setPhase('work');
        setTimeLeft(workMinutes * 60);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = 1 - (timeLeft / getTotalTime());
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference * (1 - progress);

    const phaseColor = phase === 'work' ? habitColor : phase === 'break' ? '#22c55e' : '#8b5cf6';

    const presets = [15, 25, 30, 45, 60];

    return (
        <div className="fixed inset-0 z-[70] bg-background/98 backdrop-blur-[8px] flex flex-col items-center justify-center p-6 animate-fadeIn">
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-textSecondary hover:text-textPrimary transition-colors"
            >
                <X size={24} />
            </button>

            {/* Phase Label */}
            <div className="mb-2">
                <span
                    className="text-xs font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
                    style={{ backgroundColor: phaseColor + '20', color: phaseColor }}
                >
                    {phase === 'work' ? '🔥' : phase === 'break' ? '☕' : '🌿'} {PHASE_LABELS[phase][language]}
                </span>
            </div>

            {/* Habit Name */}
            <h2 className="text-lg font-bold text-textPrimary mt-2 mb-6 text-center max-w-xs truncate">{habitName}</h2>

            {/* Circular Timer */}
            <div className="relative w-56 h-56 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-surfaceHighlight"
                    />
                    {/* Progress arc */}
                    <circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke={phaseColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 ease-linear"
                        style={{ filter: `drop-shadow(0 0 8px ${phaseColor}60)` }}
                    />
                </svg>
                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-textPrimary tabular-nums tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-textSecondary mt-1 font-bold">
                        {language === 'ru' ? `Сессия ${sessions + 1}` : `Session ${sessions + 1}`}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={resetTimer}
                    className="p-3 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
                <button
                    onClick={toggleTimer}
                    className="p-5 rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                    style={{
                        background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}cc)`,
                        boxShadow: `0 8px 30px ${phaseColor}40`,
                    }}
                >
                    {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Time Presets (only when not running and in work phase) */}
            {!isRunning && phase === 'work' && (
                <div className="flex gap-2 mb-6">
                    {presets.map(m => (
                        <button
                            key={m}
                            onClick={() => { setWorkMinutes(m); setTimeLeft(m * 60); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${workMinutes === m
                                    ? 'text-white shadow-sm'
                                    : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
                                }`}
                            style={workMinutes === m ? { backgroundColor: phaseColor } : undefined}
                        >
                            {m}m
                        </button>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-center">
                <div>
                    <div className="flex items-center gap-1 justify-center text-orange-500">
                        <Flame size={14} />
                        <span className="text-lg font-black">{sessions}</span>
                    </div>
                    <p className="text-[10px] text-textSecondary font-bold uppercase">
                        {language === 'ru' ? 'Сессий' : 'Sessions'}
                    </p>
                </div>
                <div>
                    <div className="flex items-center gap-1 justify-center text-cyan-500">
                        <Coffee size={14} />
                        <span className="text-lg font-black">{Math.floor(totalFocusTime / 60)}</span>
                    </div>
                    <p className="text-[10px] text-textSecondary font-bold uppercase">
                        {language === 'ru' ? 'мин фокуса' : 'min focused'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;
