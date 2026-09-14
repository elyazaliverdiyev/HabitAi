import React, { useState } from 'react';
import { Plus, Sparkles, LayoutGrid, AlertTriangle, ArrowRightCircle, Banknote, Check, Moon, Zap, Clapperboard, Gift } from 'lucide-react';
import SmartGreeting from './SmartGreeting';
import IntentionCard from './IntentionCard';
import MuhasabaSheet from './MuhasabaSheet';
import GratitudePrompt from './GratitudePrompt';
import HarveeStateSlider from './HarveeStateSlider';
import HarveeFitnessCard from './HarveeFitnessCard';
import HarveeHabitGrid from './HarveeHabitGrid';
import HarveeDotMatrixCard from './HarveeDotMatrixCard';
import QuickWaterModal from './QuickWaterModal';
import QuickReadingModal from './QuickReadingModal';
import ResistanceReleaseModal from './ResistanceReleaseModal';
import MindmapView from './MindmapView';
import CollapsibleCard from './CollapsibleCard';
import DivineNameDaily from './DivineNameDaily';
import AsmaulHusnaModal from './AsmaulHusnaModal';
import DhikrCounter from './DhikrCounter';
import TadabburCard from './TadabburCard';
import HusnulZanModal from './HusnulZanModal';
import FocusNowCard from './FocusNowCard';
import CompletedTodayLog from './CompletedTodayLog';
import { useStepTracker } from '../hooks/useStepTracker';
import { useFocusWindowNotifications } from '../hooks/useFocusWindowNotifications';
import { useSedentaryReminder } from '../hooks/useSedentaryReminder';

import { Habit, HabitAnalysis, getCurrentStreak, getMissedDaysStreak, getCurrencySymbol, KanbanColumn, HabitConnection } from '../types';
import { getLocalDateString } from '../utils/helpers';

// Components
import Icon from './Icons';
import ActivityRings from './ActivityRings';
import { getXPProgress } from '../types';
import { UserRewards, UserIdentity, Goal, DeepAnalysis } from '../types';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

// =============================================
// Props Interface
// =============================================

export interface HomeTabProps {
    // Data
    habits: Habit[];
    activeHabits: Habit[];
    todaysTasks: Habit[];
    overdueTasks: Habit[];
    goals: Goal[];
    userRewards: UserRewards;
    activeIdentity?: UserIdentity;
    reflectionEntries: any[];
    savedAiInsights: any[];
    deepAnalysisHistory: DeepAnalysis[];
    user: User | null;
    
    // AI state
    analysis: HabitAnalysis | null;
    isAnalyzing: boolean;
    aiSectionTab: 'analytics' | 'history';
    insightSaved: boolean;
    
    // Settings
    language: 'ru' | 'en';
    viewMode: 'grid' | 'compact' | 'kanban' | 'matrix' | 'circles';
    accentColor: string;
    calendarStyle: string;
    timeFocusMode: boolean;
    currentTime: string;
    isPro: boolean;
    dataLoading: boolean;
    notificationsEnabled?: boolean;
    
    // Kanban
    kanbanColumns: KanbanColumn[];
    kanbanTasks: Habit[];
    
    // Selected state
    selectedDate: Date;
    selectedDateStr: string;
    activeTagFilter: string | null;
    justCompletedId: string | null;
    
    // Actions
    setActiveTagFilter: (tag: string | null) => void;
    setViewMode: (mode: 'grid' | 'compact' | 'kanban' | 'matrix' | 'circles') => void;
    setAiSectionTab: (tab: 'analytics' | 'history') => void;
    setSelectedDate: (date: Date) => void;
    setSelectedHabit: (habit: Habit | null) => void;
    setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
    
    // Handlers
    toggleDate: (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent | null) => void;
    handleToggleDate: (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent) => void;
    handleUpdateHabit: (id: string, updates: Partial<Habit>) => void;
    handleBatchUpdateHabits: (updates: { id: string, data: Partial<Habit> }[]) => void;
    handleMoveToToday: (id: string) => void;
    handleAnalyze: (habits: Habit[], count: number) => void;
    handleSaveAIInsight: (analysis: HabitAnalysis) => void;
    handleSaveDeepAnalysis: (analysis: DeepAnalysis) => void;
    setAnalysis: (analysis: HabitAnalysis | null) => void;
    aiSuggestionCount: number;
    
    // Modal openers
    setIsRewardsModalOpen: (open: boolean) => void;
    setIsMindMovieOpen: (open: boolean) => void;
    setIsAICoachOpen?: (open: boolean) => void;
    setIsVoiceAssistantOpen: (open: boolean) => void;
    onOpenWealthDashboard?: () => void;
    onOpenAIGoalChain?: () => void;
    vaultData?: any;
    setIsAIReflectionOpen: (open: boolean) => void;
    setIsEveningReviewOpen: (open: boolean) => void;
    setIsActivityModalOpen: (open: boolean) => void;
    setIsGoalsModalOpen: (open: boolean) => void;
    setIsAddModalOpen: (open: boolean) => void;
    setIsActivityRingsModalOpen: (open: boolean) => void;
    
    // Kanban handlers
    handleAddColumn: () => void;
    handleEditColumn: (id: string) => void;
    handleDeleteColumn: (id: string) => void;

    // Translations
    t: any;
    // Behavioral Engines (optional — gracefully degrades without it)
    engines?: import('../hooks/useEngines').EnginesState & import('../hooks/useEngines').EnginesActions;
}

// =============================================
// HomeTab Component
// =============================================

const HomeTab: React.FC<HomeTabProps> = ({
    habits,
    activeHabits,
    todaysTasks,
    overdueTasks,
    goals,
    userRewards,
    activeIdentity,
    reflectionEntries,
    savedAiInsights,
    deepAnalysisHistory,
    user,
    analysis,
    isAnalyzing,
    aiSectionTab,
    insightSaved,
    language,
    viewMode,
    accentColor,
    calendarStyle,
    timeFocusMode,
    currentTime,
    isPro,
    dataLoading,
    notificationsEnabled = false,
    kanbanColumns,
    kanbanTasks,
    selectedDate,
    selectedDateStr,
    activeTagFilter,
    justCompletedId,
    setActiveTagFilter,
    setViewMode,
    setAiSectionTab,
    setSelectedDate,
    setSelectedHabit,
    setHabits,
    toggleDate,
    handleToggleDate,
    handleUpdateHabit,
    handleBatchUpdateHabits,
    handleMoveToToday,
    handleAnalyze,
    handleSaveAIInsight,
    handleSaveDeepAnalysis,
    setAnalysis,
    aiSuggestionCount,
    setIsRewardsModalOpen,
    setIsMindMovieOpen,
    setIsAICoachOpen,
    setIsVoiceAssistantOpen,
    onOpenWealthDashboard,
    onOpenAIGoalChain,
    vaultData,
    setIsAIReflectionOpen,
    setIsEveningReviewOpen,
    setIsActivityModalOpen,
    setIsGoalsModalOpen,
    setIsAddModalOpen,
    setIsActivityRingsModalOpen,
    handleAddColumn,
    handleEditColumn,
    handleDeleteColumn,
    t,
    engines,
}) => {
    // Engine UI state
    const [muhasabaOpen, setMuhasabaOpen] = useState(false);
    const [gratitudeDismissed, setGratitudeDismissed] = useState(false);
    const [waterModalHabit, setWaterModalHabit] = useState<Habit | null>(null);
    const [readingModalHabit, setReadingModalHabit] = useState<Habit | null>(null);
    const [resistanceHabit, setResistanceHabit] = useState<Habit | null>(null);
    const [isAsmaOpen, setIsAsmaOpen] = useState(false);
    const [isDhikrOpen, setIsDhikrOpen] = useState(false);
    const [isHusnulZanOpen, setIsHusnulZanOpen] = useState(false);

    const handleSaveWaterProgress = (amount: number, unit: 'ml' | 'L') => {
        if (!waterModalHabit) return;
        const target = waterModalHabit.targetCount || waterModalHabit.ultimateTarget || 2000;
        const todayS = todayStr;
        const newProgress = { ...(waterModalHabit.dailyProgress || {}), [todayS]: amount };
        let completedDates = [...waterModalHabit.completedDates];

        if (amount >= target && !completedDates.includes(todayS)) {
            completedDates.push(todayS);
        } else if (amount < target && completedDates.includes(todayS)) {
            completedDates = completedDates.filter(d => d !== todayS);
        }

        handleUpdateHabit(waterModalHabit.id, {
            dailyProgress: newProgress,
            dailyUnit: unit,
            completedDates
        });
    };

    // Calculated values
    const todayStr = getLocalDateString();
    const completedToday = activeHabits.filter(h => h.completedDates.includes(todayStr)).length;
    const todayCompletedCount = completedToday;

    // Move ring
    let movePercent = activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0;
    if (movePercent >= 100 && activeHabits.length > 0) {
        const streakBonus = activeHabits.filter(h => getCurrentStreak(h) >= 2).length;
        movePercent += streakBonus * 15;
    }

    // Streak ring
    const streaks = activeHabits.map(h => getCurrentStreak(h));
    const avgStreak = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
    const streakPercent = Math.round((avgStreak / 5) * 100);

    // XP ring
    const xpProgress = getXPProgress(userRewards.totalXP);
    let xpPercent = xpProgress.progress * 100;
    if (movePercent >= 100 && activeHabits.length > 0) {
        const activeStreakCount = activeHabits.filter(h => getCurrentStreak(h) > 0).length;
        xpPercent += 30 + activeStreakCount * 5;
    }

    // Habits at risk
    const habitsAtRisk = activeHabits.filter(h =>
        getMissedDaysStreak(h) >= 2 && !h.completedDates.includes(todayStr)
    );

    // Hardware Step Tracker (iPhone / Android DeviceMotionEvent)
    const stepTrackerState = useStepTracker(activeHabits, (habitId, progress) => {
        handleUpdateHabit(habitId, {
            dailyProgress: {
                ...(activeHabits.find(h => h.id === habitId)?.dailyProgress || {}),
                [todayStr]: progress
            }
        });
    });

    // Sedentary Reminder: ≥90 мин без движения в дневное циркадное окно
    const sedentary = useSedentaryReminder(stepTrackerState.isTracking, language);

    // Окно Фокуса: уведомление в момент открытия окна главной задачи
    useFocusWindowNotifications(activeHabits, notificationsEnabled ?? false, language);

    return (
        <>
            {/* ── ЧТО СЕЙЧАС: одна главная задача в её окне (анти-паралич) ── */}
            <FocusNowCard
                habits={activeHabits}
                language={language}
                onComplete={(habitId) => handleToggleDate(habitId, todayStr)}
                onOpenHabit={(h) => setSelectedHabit(h)}
            />

            {/* Quick Water Modal */}
            {waterModalHabit && (
                <QuickWaterModal
                    habit={waterModalHabit}
                    isOpen={Boolean(waterModalHabit)}
                    onClose={() => setWaterModalHabit(null)}
                    onSaveProgress={handleSaveWaterProgress}
                    onEditHabit={(h) => setSelectedHabit(h)}
                    language={language}
                    todayStr={todayStr}
                />
            )}

            {/* Quick Reading Modal */}
            {readingModalHabit && (
                <QuickReadingModal
                    habit={readingModalHabit}
                    isOpen={Boolean(readingModalHabit)}
                    onClose={() => setReadingModalHabit(null)}
                    onUpdateHabit={handleUpdateHabit}
                    onOpenFullLibrary={() => {
                        setSelectedHabit(readingModalHabit);
                    }}
                    onEditHabit={(h) => setSelectedHabit(h)}
                    language={language}
                    todayStr={todayStr}
                />
            )}

            {/* Resistance Release: Never Miss Twice × 5 Стадий (Кашф + Тахрир) */}
            <ResistanceReleaseModal
                isOpen={Boolean(resistanceHabit)}
                habit={resistanceHabit}
                onClose={() => setResistanceHabit(null)}
                onMicroStep={(h) => {
                    // Микрошаг засчитывает привычку — серия спасена
                    if (!h.completedDates.includes(todayStr)) {
                        handleToggleDate(h.id, todayStr);
                    }
                }}
                language={language}
            />

            {/* ── ДУХОВНЫЙ ЯКОРЬ: Имя Аллаха дня (против страха — от Шайтана) ── */}
            <DivineNameDaily
                language={language}
                onOpenLibrary={() => setIsAsmaOpen(true)}
                onOpenDhikr={() => setIsDhikrOpen(true)}
                onOpenHusnulZan={() => setIsHusnulZanOpen(true)}
                onOpenTransformation={() => {
                    const transformBtn = document.getElementById('btn-open-transformation') || document.getElementById('btn-open-transformation-set');
                    if (transformBtn) transformBtn.click();
                }}
            />

            {/* ── Быстрые действия (перенесены из дока): Видение · Награды · AI Коуч ── */}
            <div className="flex items-center justify-center gap-2 mb-3">
                <button
                    onClick={() => setIsMindMovieOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/25 border border-purple-500/20 transition-colors"
                >
                    <Clapperboard size={13} />
                    {language === 'ru' ? 'Видение' : 'Vision'}
                </button>
                <button
                    onClick={() => setIsRewardsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/25 border border-amber-500/20 transition-colors"
                >
                    <Gift size={13} />
                    {language === 'ru' ? 'Награды' : 'Rewards'}
                </button>
                <button
                    onClick={() => setIsAICoachOpen(true)}
                    className="ai-coach-btn relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-transform active:scale-95"
                    title={language === 'ru' ? 'AI Коуч' : 'AI Coach'}
                >
                    <Sparkles size={13} />
                    {language === 'ru' ? 'Коуч' : 'Coach'}
                </button>
            </div>

            {/* ── ТАДАББУР: Аят дня для размышления ── */}
            <TadabburCard language={language} user={user} />

            {/* ── Библиотека 99 Прекрасных Имён (Асма уль-Хусна) ── */}
            <AsmaulHusnaModal
                isOpen={isAsmaOpen}
                onClose={() => setIsAsmaOpen(false)}
                language={language}
                user={user}
            />

            {/* ── Зикр-счётчик (электронный тасбих) ── */}
            <DhikrCounter
                isOpen={isDhikrOpen}
                onClose={() => setIsDhikrOpen(false)}
                language={language}
            />

            {/* ── Хуснуль-Зан: Сдвиг Парадигмы + Маппер Страха ── */}
            <HusnulZanModal
                isOpen={isHusnulZanOpen}
                onClose={() => setIsHusnulZanOpen(false)}
                language={language}
            />

            {/* ── ENGINE: Smart Greeting (Circadian) ── */}
            {engines?.smartGreeting && (
                <SmartGreeting
                    greeting={engines.smartGreeting}
                    language={language}
                />
            )}

            {/* ── HARVEE: Day State Slider ── */}
            <HarveeStateSlider
                initialState="focus"
                recommendation={engines?.smartGreeting?.message?.[language] || undefined}
                language={language}
                accentColor={accentColor}
            />

            {/* ── HARVEE: Fitness Card (Activity with Apple Watch Rings & Hardware Steps) ── */}
            <HarveeFitnessCard
                movePercent={movePercent}
                streakPercent={streakPercent}
                xpPercent={xpPercent}
                streakDays={Math.max(0, ...activeHabits.map(h => getCurrentStreak(h)))}
                totalXP={userRewards.totalXP}
                stepsToday={stepTrackerState.stepsToday}
                isTrackingSteps={stepTrackerState.isTracking}
                onToggleStepTracking={() => {
                    if (stepTrackerState.isTracking) {
                        stepTrackerState.stopStepTracking();
                    } else {
                        stepTrackerState.startStepTracking();
                    }
                }}
                onOpenModal={() => setIsActivityRingsModalOpen(true)}
                language={language}
                sedentaryMinutes={sedentary.isSedentary ? sedentary.minutesIdle : undefined}
            />

            {/* ── HARVEE: 2x2 Habit Grid with Vertical Sliders ── */}
            <HarveeHabitGrid
                habits={activeHabits}
                todayStr={todayStr}
                onToggle={(id) => {
                    const habit = activeHabits.find(h => h.id === id);
                    if (!habit) return;
                    const lower = habit.name.toLowerCase();
                    if (lower.includes('вод') || lower.includes('water')) {
                        setWaterModalHabit(habit);
                    } else if (lower.includes('книг') || lower.includes('чита') || lower.includes('read')) {
                        setReadingModalHabit(habit);
                    } else {
                        handleToggleDate(id, todayStr);
                    }
                }}
                onOpenHabit={(h) => {
                    const lower = h.name.toLowerCase();
                    if (lower.includes('вод') || lower.includes('water')) {
                        setWaterModalHabit(h);
                    } else if (lower.includes('книг') || lower.includes('чита') || lower.includes('read')) {
                        setReadingModalHabit(h);
                    } else {
                        setSelectedHabit(h);
                    }
                }}
                onAddHabit={() => setIsAddModalOpen(true)}
                language={language}
                accentColor={accentColor}
            />

            {/* ── HARVEE: Weekly Dot Matrix Patterns (сворачиваемая) ── */}
            <CollapsibleCard
                storageKey="dotmatrix"
                title={language === 'ru' ? 'Матрица паттернов недели' : 'Weekly Patterns'}
                collapsedSummary={`${completedToday}/${activeHabits.length} ${language === 'ru' ? 'сегодня' : 'today'}`}
                defaultCollapsed
                language={language}
                icon={
                    <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <LayoutGrid size={14} />
                    </div>
                }
            >
                <HarveeDotMatrixCard
                    habits={activeHabits}
                    language={language}
                    accentColor={accentColor}
                />
            </CollapsibleCard>

            {/* ── ENGINE: Intention Card (Ниятъ & 5 Стадий) ── */}
            {engines && (
                <IntentionCard
                    intention={engines.todayIntention}
                    status={engines.intentionStatus}
                    language={language}
                    onSave={engines.saveIntention}
                    onReflect={engines.saveIntentionReflection}
                    user={user}
                />
            )}

            {/* ── MINDMAP: Interactive Habit & Identity Neural Connections (сворачиваемая) ── */}
            <CollapsibleCard
                storageKey="mindmap"
                title={language === 'ru' ? 'Mindmap Трансформации' : 'Transformation Mindmap'}
                collapsedSummary={`${todayCompletedCount}/${activeHabits.length} ${language === 'ru' ? 'питают ядро' : 'feeding core'}`}
                defaultCollapsed
                language={language}
                icon={
                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                        <Sparkles size={14} />
                    </div>
                }
            >
                <MindmapView
                    habits={activeHabits}
                    activeIdentity={activeIdentity}
                    language={language}
                    onOpenHabit={(h) => setSelectedHabit(h)}
                    onOpenTransformation={() => {
                        // Trigger transformation modal
                        const transformBtn = document.getElementById('btn-open-transformation') || document.getElementById('btn-open-transformation-set');
                        if (transformBtn) transformBtn.click();
                    }}
                />
            </CollapsibleCard>

            {/* ── ENGINE: Gratitude Prompt (вечер 19:00–22:00) ── */}
            {engines && engines.shouldPromptGratitude && !gratitudeDismissed && (
                <GratitudePrompt
                    show={true}
                    language={language}
                    onSave={engines.saveGratitude}
                    onDismiss={() => setGratitudeDismissed(true)}
                />
            )}

            {/* Capital & AI Goal Chain Top Widgets */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Capital Card */}
                <div
                    onClick={onOpenWealthDashboard}
                    className="relative p-4 rounded-2xl cursor-pointer overflow-hidden group transition-all active:scale-95"
                    style={{
                        background: 'var(--surface)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        boxShadow: '0 2px 16px rgba(245,158,11,0.05)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity"
                        style={{ background: 'radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 70%)' }} />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'rgba(245,158,11,0.15)' }}>
                        <Banknote className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {language === 'ru' ? 'Общий Капитал' : 'Total Capital'}
                    </div>
                    <div className="text-lg font-black tabular-nums" style={{ color: '#f59e0b' }}>
                        ${((vaultData?.assets || []).reduce((s: number, a: any) => s + (a.amount || 1) * (a.currentPrice || a.buyPrice || 0), 0)
                            + (vaultData?.yields || []).reduce((s: number, y: any) => s + (y.invested || 0), 0)).toLocaleString()}
                    </div>
                    <div className="text-[9px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        {(vaultData?.assets || []).length} {language === 'ru' ? 'актив.' : 'assets'}
                        <span className="ml-auto" style={{ color: 'rgba(245,158,11,0.7)' }}>→</span>
                    </div>
                </div>

                {/* AI Goal Chain Card */}
                <div
                    onClick={onOpenAIGoalChain}
                    className="relative p-4 rounded-2xl cursor-pointer overflow-hidden group transition-all active:scale-95"
                    style={{
                        background: 'var(--surface)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        boxShadow: '0 2px 16px rgba(139,92,246,0.05)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity"
                        style={{ background: 'radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 70%)' }} />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {language === 'ru' ? 'AI Цепочка' : 'AI Chain'}
                    </div>
                    <div className="text-sm font-black leading-snug" style={{ color: '#a78bfa' }}>
                        {language === 'ru' ? 'Генератор шагов' : 'Step Planner'}
                    </div>
                    <div className="text-[9px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        {language === 'ru' ? 'ИИ разобьёт цель на шаги' : 'AI breaks goals into steps'}
                        <span className="ml-auto" style={{ color: 'rgba(139,92,246,0.7)' }}>→</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 stagger">

                {/* Never Miss Twice Warning */}
                {habitsAtRisk.length > 0 && (
                    <div className="animate-fadeIn bg-gradient-to-r from-indigo-500/10 to-purple-500/8 border border-indigo-500/20 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 text-white">
                                <Sparkles size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-textPrimary text-sm leading-tight">
                                    {language === 'ru' ? 'Удели 2 минуты!' : 'Just 2 minutes!'}
                                </p>
                                <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">
                                    {language === 'ru'
                                        ? 'Даже мини-версия сохранит импульс'
                                        : 'Even a tiny effort keeps momentum'
                                    }
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {habitsAtRisk.slice(0, 3).map(h => (
                                        <div
                                            key={h.id}
                                            className="flex items-center gap-1 px-2 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20"
                                        >
                                            <Icon name={h.icon} size={16} />
                                            <span className="text-xs font-bold text-textPrimary pr-1">{h.name}</span>
                                            <button
                                                onClick={() => {
                                                    const habit = habits.find(x => x.id === h.id);
                                                    if (!habit || habit.completedDates.includes(todayStr)) return;
                                                    handleToggleDate(h.id, todayStr);
                                                }}
                                                className="px-2.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black transition-all active:scale-95 flex items-center gap-1"
                                            >
                                                <Plus size={12} />
                                                {language === 'ru' ? 'Отметить' : 'Done'}
                                            </button>
                                            <button
                                                onClick={() => setResistanceHabit(h)}
                                                className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-[10px] font-black transition-all active:scale-95"
                                                title={language === 'ru' ? 'Снять психоэмоциональный блок за 60 секунд (Кашф + Тахрир)' : 'Release the block in 60s (Kashf + Tahrir)'}
                                            >
                                                {language === 'ru' ? '🧠 Снять сопротивление' : '🧠 Release'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                    <div className="animate-fadeIn">
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4 pl-1">
                            <AlertTriangle size={12} strokeWidth={3} /> {language === 'ru' ? 'ВНИМАНИЕ: ПРОСРОЧЕНО' : 'URGENT: OVERDUE'}
                        </div>
                        <div className="space-y-3">
                            {overdueTasks.map(task => {
                                const isCompleted = task.completedDates.includes(task.date!);
                                return (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 group hover:border-red-500/40 transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-textPrimary truncate">{task.name}</div>
                                            <div className="text-[9px] text-red-500 font-bold mt-1 bg-red-500/10 w-fit px-1.5 py-0.5 rounded">{task.date}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleMoveToToday(task.id)}
                                                className="text-[10px] bg-surfaceHighlight hover:bg-surface border border-borderSubtle px-2.5 py-1.5 rounded-lg font-bold text-textPrimary flex items-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <ArrowRightCircle size={12} /> {language === 'ru' ? 'Сегодня' : 'Today'}
                                            </button>
                                            {task.cost !== undefined && task.cost > 0 && (
                                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/10 px-2 py-1 rounded-lg border border-green-500/20 shadow-sm dark:border-green-500/30">
                                                    <Banknote size={12} className="text-green-500" />
                                                    <span className="text-[10px] font-black text-green-600 dark:text-green-400">{getCurrencySymbol(task.currency || 'USD')}{task.cost}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleDate(task.id, task.date!, e); }}
                                                className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 relative shrink-0
                                                    ${isCompleted
                                                        ? 'bg-red-500 text-white scale-100 shadow-lg'
                                                        : 'dark:bg-red-500/10 dark:border-red-500/20 bg-red-500/5 border border-red-500/20 text-red-500/40 hover:text-red-500 hover:border-red-500/40'
                                                    }
                                                `}
                                                style={{
                                                    backdropFilter: 'blur(20px)',
                                                    WebkitBackdropFilter: 'blur(20px)',
                                                    boxShadow: isCompleted ? '0 4px 15px rgba(239, 68, 68, 0.4)' : undefined,
                                                }}
                                            >
                                                <Check size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Evening Review Button */}
                {new Date().getHours() >= 19 && (
                    <div className="animate-fadeIn">
                        <button
                            onClick={() => setIsEveningReviewOpen(true)}
                            className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center gap-3 hover:from-indigo-500/15 hover:to-purple-500/15 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Moon size={20} className="text-indigo-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-primary">
                                    {language === 'ru' ? 'Вечерний обзор' : 'Evening Review'}
                                </p>
                                <p className="text-xs text-secondary">
                                    {language === 'ru' ? 'AI подведёт итоги дня' : 'AI will review your day'}
                                </p>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* ── ЛЕНТА ДНЯ: выполнено с точным временем ── */}
            <CompletedTodayLog
                habits={habits}
                language={language}
                onOpenHabit={(h) => setSelectedHabit(h)}
            />

            {/* ── ENGINE: Muhasaba Sheet (воскресенье 20:00–23:00) ── */}
            {engines && (
                <MuhasabaSheet
                    isOpen={muhasabaOpen || (
                        // Не дёргаем шторку пока данные грузятся (гонка загрузки)
                        !engines.loading &&
                        engines.isMuhasabaTime && !engines.hasThisWeekMuhasaba &&
                        // Локальный фолбэк: если уже заполняли на этом устройстве — не показываем
                        localStorage.getItem(`habitai_muhasaba_done_${engines.thisWeekStats?.weekStart || ''}`) !== 'true'
                    )}
                    weekStats={engines.thisWeekStats}
                    language={language}
                    onSave={(...args) => {
                        // Запоминаем локально немедленно — шторка не мигает и не вернётся
                        try {
                            const ws = engines.thisWeekStats?.weekStart || '';
                            localStorage.setItem(`habitai_muhasaba_done_${ws}`, 'true');
                        } catch { /* noop */ }
                        return engines.saveMuhasaba(...args);
                    }}
                    onClose={() => setMuhasabaOpen(false)}
                />
            )}
        </>
    );
};

export default HomeTab;
