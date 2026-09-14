
import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Target, Zap, Check, X } from 'lucide-react';
import { TEMPLATE_PACKS, TemplatePack, packToHabits } from '../data/habitTemplates';
import { Habit } from '../types';
import SplitText from './SplitText';

interface OnboardingFlowProps {
    language: 'ru' | 'en';
    onComplete: (habits: Habit[]) => void;
    onSkip: () => void;
}

type Step = 'welcome' | 'goal' | 'templates' | 'finish';

const STEPS: Step[] = ['welcome', 'goal', 'templates', 'finish'];

const GOALS = [
    { id: 'health', emoji: '💪', name: 'Health & Fitness', nameRu: 'Здоровье и фитнес' },
    { id: 'productivity', emoji: '🚀', name: 'Productivity', nameRu: 'Продуктивность' },
    { id: 'mindfulness', emoji: '🧘', name: 'Mindfulness', nameRu: 'Осознанность' },
    { id: 'learning', emoji: '📚', name: 'Learning', nameRu: 'Обучение' },
    { id: 'custom', emoji: '✨', name: 'My own path', nameRu: 'Свой путь' },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ language, onComplete, onSkip }) => {
    const [step, setStep] = useState<Step>('welcome');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedPacks, setSelectedPacks] = useState<string[]>([]);

    const currentIndex = STEPS.indexOf(step);
    const progress = ((currentIndex + 1) / STEPS.length) * 100;

    const nextStep = useCallback(() => {
        const next = STEPS[currentIndex + 1];
        if (next) setStep(next);
    }, [currentIndex]);

    const prevStep = useCallback(() => {
        const prev = STEPS[currentIndex - 1];
        if (prev) setStep(prev);
    }, [currentIndex]);

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const togglePack = (id: string) => {
        setSelectedPacks(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleFinish = useCallback(() => {
        const habits: Habit[] = [];
        selectedPacks.forEach(packId => {
            const pack = TEMPLATE_PACKS.find(p => p.id === packId);
            if (pack) {
                habits.push(...packToHabits(pack, language));
            }
        });
        onComplete(habits);
    }, [selectedPacks, language, onComplete]);

    // Recommended packs based on goals
    const recommendedPacks = TEMPLATE_PACKS.filter(pack => {
        if (selectedGoals.includes('custom')) return true;
        if (selectedGoals.includes('health') && ['morning-routine', 'fitness'].includes(pack.id)) return true;
        if (selectedGoals.includes('productivity') && ['productivity'].includes(pack.id)) return true;
        if (selectedGoals.includes('mindfulness') && ['mindfulness', 'morning-routine'].includes(pack.id)) return true;
        if (selectedGoals.includes('learning') && ['student', 'productivity'].includes(pack.id)) return true;
        return false;
    });

    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
            {/* Progress Bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex-1 h-1.5 bg-surfaceHighlight rounded-full overflow-hidden mr-4">
                    <div
                        className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <button
                    onClick={onSkip}
                    className="text-xs text-textSecondary hover:text-textPrimary transition-colors px-2 py-1"
                >
                    {language === 'ru' ? 'Пропустить' : 'Skip'}
                </button>
            </div>

            {/* Step Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">

                {/* === STEP 1: Welcome === */}
                {step === 'welcome' && (
                    <div className="text-center max-w-sm animate-fadeIn">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand to-purple-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/20">
                            <Sparkles className="text-white" size={36} />
                        </div>

                        <SplitText
                            text={language === 'ru' ? 'Добро пожаловать!' : 'Welcome!'}
                            className="text-3xl font-black text-textPrimary mb-4"
                            animationType="blurIn"
                            staggerDelay={40}
                        />

                        <p className="text-textSecondary leading-relaxed mb-2">
                            {language === 'ru'
                                ? 'HabitAI поможет тебе построить жизнь мечты через маленькие ежедневные действия.'
                                : 'HabitAI will help you build your dream life through small daily actions.'}
                        </p>
                        <p className="text-textSecondary/60 text-sm">
                            {language === 'ru'
                                ? 'Давай настроим всё за 60 секунд ⚡'
                                : "Let's set everything up in 60 seconds ⚡"}
                        </p>
                    </div>
                )}

                {/* === STEP 2: Goals === */}
                {step === 'goal' && (
                    <div className="w-full max-w-sm animate-fadeIn">
                        <div className="text-center mb-6">
                            <Target className="text-brand mx-auto mb-3" size={32} />
                            <h2 className="text-2xl font-black text-textPrimary mb-2">
                                {language === 'ru' ? 'Что тебе важно?' : 'What matters to you?'}
                            </h2>
                            <p className="text-sm text-textSecondary">
                                {language === 'ru' ? 'Выбери одну или несколько целей' : 'Pick one or more goals'}
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            {GOALS.map(goal => {
                                const isSelected = selectedGoals.includes(goal.id);
                                return (
                                    <button
                                        key={goal.id}
                                        onClick={() => toggleGoal(goal.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                                            isSelected
                                                ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10'
                                                : 'border-borderSubtle bg-surface hover:bg-surfaceHighlight'
                                        }`}
                                    >
                                        <span className="text-2xl">{goal.emoji}</span>
                                        <span className="font-bold text-textPrimary text-left flex-1">
                                            {language === 'ru' ? goal.nameRu : goal.name}
                                        </span>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                                                <Check size={14} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === STEP 3: Templates === */}
                {step === 'templates' && (
                    <div className="w-full max-w-sm animate-fadeIn">
                        <div className="text-center mb-6">
                            <Zap className="text-brand mx-auto mb-3" size={32} />
                            <h2 className="text-2xl font-black text-textPrimary mb-2">
                                {language === 'ru' ? 'Готовые наборы' : 'Starter Packs'}
                            </h2>
                            <p className="text-sm text-textSecondary">
                                {language === 'ru' ? 'Мы подобрали для тебя наборы привычек' : "We've curated habit packs for you"}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {(recommendedPacks.length > 0 ? recommendedPacks : TEMPLATE_PACKS).map(pack => {
                                const isSelected = selectedPacks.includes(pack.id);
                                return (
                                    <button
                                        key={pack.id}
                                        onClick={() => togglePack(pack.id)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                                            isSelected
                                                ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10'
                                                : 'border-borderSubtle bg-surface hover:bg-surfaceHighlight'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{pack.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-textPrimary text-sm">
                                                    {language === 'ru' ? pack.nameRu : pack.name}
                                                </h3>
                                                <p className="text-[11px] text-textSecondary">
                                                    {language === 'ru' ? pack.descriptionRu : pack.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shrink-0">
                                                    <Check size={14} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {pack.habits.map((h, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceHighlight text-textSecondary"
                                                >
                                                    {language === 'ru' ? h.nameRu : h.name}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === STEP 4: Finish === */}
                {step === 'finish' && (
                    <div className="text-center max-w-sm animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
                            <Check className="text-white" size={40} strokeWidth={3} />
                        </div>

                        <h2 className="text-2xl font-black text-textPrimary mb-3">
                            {language === 'ru' ? 'Всё готово! 🎉' : "You're all set! 🎉"}
                        </h2>
                        <p className="text-textSecondary leading-relaxed mb-2">
                            {selectedPacks.length > 0
                                ? (language === 'ru'
                                    ? `${selectedPacks.reduce((acc, id) => acc + (TEMPLATE_PACKS.find(p => p.id === id)?.habits.length || 0), 0)} привычек добавлено. Начни с малого — отмечай по одной в день.`
                                    : `${selectedPacks.reduce((acc, id) => acc + (TEMPLATE_PACKS.find(p => p.id === id)?.habits.length || 0), 0)} habits added. Start small — check off one per day.`)
                                : (language === 'ru'
                                    ? 'Никаких привычек пока. Ты можешь добавить их позже.'
                                    : 'No habits yet. You can add them later.')
                            }
                        </p>
                        <p className="text-xs text-textSecondary/50 mt-4">
                            {language === 'ru' ? 'Совет: Начни с 2-3 привычек, не больше' : 'Tip: Start with 2-3 habits, no more'}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6 pt-3">
                <div className="flex gap-3">
                    {currentIndex > 0 && (
                        <button
                            onClick={prevStep}
                            className="px-5 py-3.5 rounded-2xl bg-surfaceHighlight text-textPrimary font-bold transition-all active:scale-95"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <button
                        onClick={step === 'finish' ? handleFinish : nextStep}
                        disabled={step === 'goal' && selectedGoals.length === 0}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {step === 'finish'
                            ? (language === 'ru' ? 'Начать путь 🚀' : "Let's go 🚀")
                            : (language === 'ru' ? 'Далее' : 'Next')}
                        {step !== 'finish' && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>

            {/* CSS animation */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default OnboardingFlow;
