
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Habit, FocusRecommendation } from '../types';
import { getSmartFocusRecommendation } from '../services/ai';
import { Zap, Clock, Sparkles, Check, X, Battery, Brain, Coffee, ArrowRight, Play, Pause, Timer, BookOpen } from 'lucide-react';
import { useToast } from './Toast';
import Icon from './Icons';
import { triggerQuickCelebration } from '../utils/helpers';
import { soundscapes, SoundscapeType } from '../services/audio/soundscapes';

interface FocusModeProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[]; // All habits
    onComplete: (id: string) => void;
    language?: 'ru' | 'en';
    initialContext?: { energy?: number, timeAvailable?: number };
}

interface EnergyButtonProps {
    level: 'low' | 'med' | 'high';
    label: string;
    icon: React.ReactNode;
    value: number;
    currentEnergy: number;
    setEnergy: (v: number) => void;
}

const EnergyButton: React.FC<EnergyButtonProps> = ({ level, label, icon, value, currentEnergy, setEnergy }) => {
    const isSelected = (level === 'low' && currentEnergy < 40) || (level === 'med' && currentEnergy >= 40 && currentEnergy <= 70) || (level === 'high' && currentEnergy > 70);
    let bgClass = "bg-surfaceHighlight text-textSecondary";
    if (isSelected) {
        if (level === 'low') bgClass = "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105";
        if (level === 'med') bgClass = "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105";
        if (level === 'high') bgClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105";
    }

    return (
        <button
            onClick={() => setEnergy(value)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 ${bgClass} border border-transparent ${!isSelected ? 'hover:border-borderSubtle' : ''}`}
        >
            <div className="mb-2">{icon}</div>
            <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </button>
    );
};

interface TimeButtonProps {
    val: number;
    currentTime: number;
    setTime: (v: number) => void;
}

const TimeButton: React.FC<TimeButtonProps> = ({ val, currentTime, setTime }) => (
    <button
        onClick={() => setTime(val)}
        className={`py-3 rounded-xl text-sm font-bold transition-all ${currentTime === val ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
    >
        {val}m
    </button>
);

const FocusMode: React.FC<FocusModeProps> = ({ isOpen, onClose, habits, onComplete, language = 'ru', initialContext }) => {
    const toast = useToast();
    // Step 1: Context Gathering, Step 2: Result
    const [step, setStep] = useState<'context' | 'loading' | 'result'>('context');

    // Context State
    const [energy, setEnergy] = useState(50);
    const [timeAvailable, setTimeAvailable] = useState(30);

    // Result State
    const [recommendation, setRecommendation] = useState<FocusRecommendation | null>(null);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

    // Timer State (Visual)
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>('none');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-detect bio-rhythm or use initial context on open
    useEffect(() => {
        if (isOpen) {
            if (initialContext) {
                // Use provided context from Voice or other source
                if (initialContext.energy !== undefined) setEnergy(initialContext.energy);
                if (initialContext.timeAvailable !== undefined) setTimeAvailable(initialContext.timeAvailable);

                // Auto-start if context is fully provided
                if (initialContext.energy !== undefined && initialContext.timeAvailable !== undefined) {
                    handleGenerate(initialContext.energy, initialContext.timeAvailable);
                    return;
                }
            } else {
                // Default heuristic
                const hour = new Date().getHours();
                if (hour >= 6 && hour < 11) setEnergy(80); // Morning peak
                else if (hour >= 11 && hour < 14) setEnergy(60); // Mid-day
                else if (hour >= 14 && hour < 17) setEnergy(30); // Post-lunch dip
                else if (hour >= 17 && hour < 21) setEnergy(70); // Evening rebound
                else setEnergy(20); // Night wind-down
            }

            setStep('context');
            setRecommendation(null);
            setIsTimerRunning(false);
            setTimeLeft(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            soundscapes.stop();
        };
    }, [isOpen, initialContext]);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        soundscapes.stop();
                        playSound('ding');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isTimerRunning, timeLeft]);

    const playSound = (type: 'ding') => {
        // Simple beep
    };

    const handleGenerate = async (currentEnergy = energy, currentTime = timeAvailable) => {
        setStep('loading');

        const todayStr = new Date().toISOString().split('T')[0];
        const pending = habits.filter(h => {
            if (h.archived) return false;
            const isDone = h.completedDates.includes(todayStr) || (h.type === 'task' && h.date === todayStr && h.completedDates.includes(todayStr));
            return !isDone;
        });

        const timeOfDay = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const result = await getSmartFocusRecommendation(
            pending,
            { energy: currentEnergy, timeAvailable: currentTime, timeOfDay },
            language as 'ru' | 'en'
        );

        if (result) {
            setRecommendation(result);
            if (result.habitId) {
                const h = habits.find(habit => habit.id === result.habitId);
                setSelectedHabit(h || null);
            } else {
                setSelectedHabit(null);
            }
            // Set timer based on estimated duration
            setTimeLeft((result.estimatedDuration || currentTime) * 60);
            setStep('result');
        } else {
            setStep('context');
            toast.error("AI Brain freeze. Try again.");
        }
    };

    const handleDone = () => {
        soundscapes.stop();
        if (selectedHabit) {
            onComplete(selectedHabit.id);
            triggerQuickCelebration();
            onClose();
        } else {
            onClose();
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Check for active book
    const activeBook = selectedHabit?.extension?.type === 'reading'
        ? selectedHabit.extension.data.books?.find(b => b.status === 'reading')
        : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Focus Mode" closeOnBackdropClick={false}>
            <div className="py-2">
                {step === 'context' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-textPrimary mb-2">
                                {language === 'ru' ? 'Как ты сейчас?' : 'How are you feeling?'}
                            </h2>
                            <p className="text-textSecondary text-sm">
                                {language === 'ru' ? 'Мы подберем идеальную задачу под твое состояние.' : 'We will pick the perfect task for your current state.'}
                            </p>
                        </div>

                        {/* Energy Selection (Buttons) */}
                        <div className="grid grid-cols-3 gap-3">
                            <EnergyButton level="low" value={20} icon={<Battery size={24} className="opacity-80" />} label={language === 'ru' ? 'Низкая' : 'Low'} currentEnergy={energy} setEnergy={setEnergy} />
                            <EnergyButton level="med" value={60} icon={<Zap size={24} className="opacity-80" />} label={language === 'ru' ? 'Средняя' : 'Medium'} currentEnergy={energy} setEnergy={setEnergy} />
                            <EnergyButton level="high" value={90} icon={<Sparkles size={24} className="opacity-80" />} label={language === 'ru' ? 'Высокая' : 'High'} currentEnergy={energy} setEnergy={setEnergy} />
                        </div>

                        {/* Time Selector */}
                        <div>
                            <div className="flex justify-between mb-3 font-bold text-sm text-textPrimary">
                                <span className="flex items-center gap-2"><Clock size={16} /> {language === 'ru' ? 'Есть времени' : 'Time Available'}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 60, 90].map(m => <TimeButton key={m} val={m} currentTime={timeAvailable} setTime={setTimeAvailable} />)}
                            </div>
                        </div>

                        <button
                            onClick={() => handleGenerate()}
                            className="w-full bg-gradient-to-r from-brand to-purple-600 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Sparkles size={24} />
                            {language === 'ru' ? 'ЧТО ДЕЛАТЬ?' : 'WHAT TO DO?'}
                        </button>
                    </div>
                )}

                {step === 'loading' && (
                    <div className="py-20 flex flex-col items-center justify-center text-center animate-fadeIn">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand rounded-full border-t-transparent animate-spin"></div>
                            <Brain className="absolute inset-0 m-auto text-brand" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-textPrimary mb-1">
                            {language === 'ru' ? 'Анализируем...' : 'Analyzing...'}
                        </h3>
                    </div>
                )}

                {step === 'result' && recommendation && (
                    <div className="animate-pop space-y-6">

                        {/* Result Card */}
                        <div className="bg-gradient-to-br from-surface to-surfaceHighlight/30 border border-brand/20 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-20 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-4 bg-brand/10 px-3 py-1 rounded-full border border-brand/20 flex items-center gap-2">
                                    <Sparkles size={12} /> {language === 'ru' ? 'ЛУЧШИЙ ВЫБОР' : 'BEST CHOICE'}
                                </div>

                                {selectedHabit ? (
                                    <>
                                        <div
                                            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4 text-4xl transform hover:rotate-6 transition-transform"
                                            style={{ backgroundColor: selectedHabit.color }}
                                        >
                                            <Icon name={selectedHabit.icon} size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-textPrimary leading-tight mb-2">
                                            {selectedHabit.name}
                                        </h2>

                                        {/* ACTIVE BOOK CONTEXT */}
                                        {activeBook && (
                                            <div className="flex items-center gap-3 bg-surface/80 p-2 rounded-xl mb-2 border border-brand/20 animate-slideUp">
                                                <div className="w-8 h-10 bg-brand/20 rounded flex items-center justify-center">
                                                    <BookOpen size={14} className="text-brand" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[10px] text-textSecondary uppercase font-bold">{language === 'ru' ? 'Читаю сейчас' : 'Reading Now'}</div>
                                                    <div className="text-xs font-bold text-textPrimary truncate max-w-[150px]">{activeBook.title}</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center text-white shadow-lg mb-4 text-4xl">
                                            <Coffee size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-textPrimary leading-tight mb-2">
                                            {recommendation.customTitle || (language === 'ru' ? 'Отдохни' : 'Take a Break')}
                                        </h2>
                                    </>
                                )}

                                <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-3 border border-borderSubtle mt-2">
                                    <p className="text-sm text-textSecondary font-medium italic">
                                        "{recommendation.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timer & Soundscape Section */}
                        <div className="bg-surfaceHighlight/30 rounded-2xl p-4 border border-borderSubtle space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface rounded-lg text-textPrimary shadow-sm">
                                        <Timer size={20} />
                                    </div>
                                    <span className="text-3xl font-mono font-bold text-textPrimary tracking-widest">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        const nextState = !isTimerRunning;
                                        setIsTimerRunning(nextState);
                                        if (nextState && activeSoundscape !== 'none') {
                                            soundscapes.play(activeSoundscape);
                                        } else {
                                            soundscapes.stop();
                                        }
                                    }}
                                    className={`p-3 rounded-xl transition-all ${isTimerRunning ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-brand text-white shadow-lg shadow-brand/20'}`}
                                >
                                    {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                </button>
                            </div>

                            {/* Ambient Soundscapes Selector */}
                            <div className="pt-2 border-t border-borderSubtle/50">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">
                                        {language === 'ru' ? 'Аудио-фон (Web Audio):' : 'Soundscape:'}
                                    </span>
                                    {activeSoundscape !== 'none' && isTimerRunning && (
                                        <span className="text-[9px] font-bold text-brand animate-pulse">
                                            ● {language === 'ru' ? 'Воспроизведение' : 'Playing'}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { id: 'none', label: language === 'ru' ? 'Тишина' : 'Off' },
                                        { id: 'brown', label: 'Brown Noise' },
                                        { id: 'theta432', label: '432 Hz Theta' },
                                        { id: 'stream', label: language === 'ru' ? 'Поток' : 'Stream' },
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                const next = s.id as SoundscapeType;
                                                setActiveSoundscape(next);
                                                if (isTimerRunning) {
                                                    soundscapes.play(next);
                                                }
                                            }}
                                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all truncate text-center ${
                                                activeSoundscape === s.id
                                                    ? 'bg-brand text-white shadow-sm'
                                                    : 'bg-surface hover:bg-surfaceHighlight text-textSecondary border border-borderSubtle'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handleDone}
                                className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {selectedHabit ? (
                                    <><Check size={20} strokeWidth={3} /> {language === 'ru' ? 'ГОТОВО!' : 'DONE!'}</>
                                ) : (
                                    <><Check size={20} strokeWidth={3} /> {language === 'ru' ? 'ПРИНЯТО' : 'ACCEPT'}</>
                                )}
                            </button>

                            <button
                                onClick={() => { setStep('context'); }}
                                className="w-full bg-surfaceHighlight text-textSecondary font-bold py-3 rounded-2xl hover:bg-surfaceHighlight/80 transition-colors"
                            >
                                {language === 'ru' ? 'Другое...' : 'Something else...'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default FocusMode;
