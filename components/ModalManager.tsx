import React, { Suspense } from 'react';
import { Habit, HabitAnalysis, AppTheme, THEMES, UserRewards, UserIdentity, Goal, DeepAnalysis, HabitConnection, SoundPack } from '../types';
import { VaultData } from '../types/vault';
import { ReflectionEntry } from './ReflectionHistoryModal';
import { ReflectionSession } from './AIReflectionSession';
import { DisplayOptions } from './SettingsModal';
import { User } from '@supabase/supabase-js';
import { getLocalDateString } from '../utils/helpers';
import Modal from './Modal';
import Icon from './Icons';

// Direct imports for frequently used modals
import HabitFormModal from './HabitFormModal';
import FeedbackModal from './FeedbackModal';
import FeedbackListModal from './FeedbackListModal';
import ActivityModal from './ActivityModal';
import RewardsModal from './RewardsModal';
import DailyInterruptModal from './DailyInterruptModal';
import MilestoneCelebrationComponent from './MilestoneCelebration';
import IdentityCelebration from './IdentityCelebration';
import ActivityRingsCalendarModal from './ActivityRingsCalendarModal';

// Lazy-loaded heavy/infrequent modals
const AIModal = React.lazy(() => import('./AIModal'));
const VoiceAssistantModal = React.lazy(() => import('./VoiceAssistantModal'));
const MindMovieModal = React.lazy(() => import('./MindMovieModal'));
const VaultModal = React.lazy(() => import('./VaultModal'));
const HabitDetailsModal = React.lazy(() => import('./HabitDetailsModal'));
const SettingsModal = React.lazy(() => import('./SettingsModal'));
const FocusMode = React.lazy(() => import('./FocusMode'));
const GoalsModal = React.lazy(() => import('./GoalsModal'));
const AIReflectionSession = React.lazy(() => import('./AIReflectionSession'));
const ReflectionHistoryModal = React.lazy(() => import('./ReflectionHistoryModal'));
const MorningRitualModal = React.lazy(() => import('./MorningRitualModal'));
const EveningReviewModal = React.lazy(() => import('./EveningReviewModal'));

// =============================================
// Props Interface
// =============================================

export interface ModalManagerProps {
    // User
    user: User | null;
    isPro: boolean;
    proExpiry: string | null;
    isAdmin: boolean;

    // Data
    habits: Habit[];
    activeHabits: Habit[];
    archivedHabits: Habit[];
    goals: Goal[];
    userRewards: UserRewards;
    userIdentities: UserIdentity[];
    activeIdentityId: string | undefined;
    activeIdentity?: UserIdentity;
    reflectionEntries: ReflectionEntry[];
    reflectionSessions: ReflectionSession[];
    vaultData: VaultData;

    // AI
    analysis: HabitAnalysis | null;
    isAnalyzing: boolean;

    // Settings
    language: 'ru' | 'en';
    currentTheme: AppTheme;
    displayOptions: DisplayOptions;
    accentColor: string;
    aiSuggestionCount: number;
    voiceId: string;
    isWakeWordEnabled: boolean;
    defaultCurrency: string;
    soundPack: SoundPack;
    timeFocusMode: boolean;
    notificationsEnabled: boolean;
    morningBriefingTime: string;
    calendarStyle: string;
    avatarType: string;
    avatarValue: string;
    gender: string;
    viewMode: string;

    // Modal states
    isAddModalOpen: boolean;
    isAIModalOpen: boolean;
    isSettingsModalOpen: boolean;
    isArchiveOpen: boolean;
    isVoiceAssistantOpen: boolean;
    isFeedbackModalOpen: boolean;
    isFeedbackListModalOpen: boolean;
    isActivityModalOpen: boolean;
    isFocusModeOpen: boolean;
    isRewardsModalOpen: boolean;
    isMindMovieOpen: boolean;
    isDailyInterruptOpen: boolean;
    isEveningReviewOpen: boolean;
    isAIReflectionOpen: boolean;
    isReflectionHistoryOpen: boolean;
    isGoalsModalOpen: boolean;
    onOpenAIGoalChain?: (goalTitle?: string) => void;
    isMorningRitualOpen: boolean;
    isVaultOpen: boolean;
    isActivityRingsModalOpen: boolean;

    // Celebration states
    milestoneCelebration: { isOpen: boolean; streak: number; habitName: string };
    identityCelebration: { isOpen: boolean; milestone: number };
    focusInitialContext?: { energy?: number; timeAvailable?: number };

    // Selected
    selectedHabit: Habit | null;
    editingHabit: Habit | null;

    // Modal setters
    setIsAddModalOpen: (open: boolean) => void;
    setIsAIModalOpen: (open: boolean) => void;
    setIsSettingsModalOpen: (open: boolean) => void;
    setIsArchiveOpen: (open: boolean) => void;
    setIsVoiceAssistantOpen: (open: boolean) => void;
    setIsFeedbackModalOpen: (open: boolean) => void;
    setIsFeedbackListModalOpen: (open: boolean) => void;
    setIsActivityModalOpen: (open: boolean) => void;
    setIsFocusModeOpen: (open: boolean) => void;
    setIsRewardsModalOpen: (open: boolean) => void;
    setIsMindMovieOpen: (open: boolean) => void;
    setIsDailyInterruptOpen: (open: boolean) => void;
    setIsEveningReviewOpen: (open: boolean) => void;
    setIsAIReflectionOpen: (open: boolean) => void;
    setIsReflectionHistoryOpen: (open: boolean) => void;
    setIsGoalsModalOpen: (open: boolean) => void;
    setIsMorningRitualOpen: (open: boolean) => void;
    setIsVaultOpen: (open: boolean) => void;
    setIsActivityRingsModalOpen: (open: boolean) => void;
    setMilestoneCelebration: React.Dispatch<React.SetStateAction<{ isOpen: boolean; streak: number; habitName: string }>>;
    setIdentityCelebration: React.Dispatch<React.SetStateAction<{ isOpen: boolean; milestone: number }>>;
    setFocusInitialContext: (ctx: { energy?: number; timeAvailable?: number } | undefined) => void;
    setSelectedHabit: (habit: Habit | null) => void;
    setEditingHabit: (habit: Habit | null) => void;

    // Handlers
    handleSaveHabit: (data: Partial<Habit>) => void;
    handleUpdateHabit: (id: string, updates: Partial<Habit>) => void;
    handleBatchUpdateHabits: (updates: { id: string; data: Partial<Habit> }[]) => void;
    toggleDate: (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent | null) => void;
    handleToggleDate: (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent) => void;
    handleMarkAllDone: () => void;
    handleVoiceArchive: (id: string) => void;
    handleVoiceRequestFocus: (energy: number, time: number) => void;
    deleteHabit: (id: string) => void;
    archiveHabit: (id: string) => void;
    handleExport: () => void;
    handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleLogout: () => void;
    handleRedeemCode: (code: string) => Promise<boolean>;
    handleGenerateCode: (type: 'year' | 'lifetime' | '6months', maxUses?: number) => Promise<string>;
    handleSaveGoal: (goal: Goal) => void;
    handleDeleteGoal: (id: string) => void;
    handleSaveReflection: (question: string, answer: string, insight?: string) => void;
    handleSaveFullReflectionSession: (session: ReflectionSession) => void;
    handleUpdateVault: (data: VaultData) => void;
    handleUseStreakSaver: () => void;
    countIdentityProofs: (habits: Habit[], identity?: UserIdentity) => number;

    // Settings setters
    setDisplayOptions: (options: DisplayOptions) => void;
    setTheme: (theme: AppTheme) => void;
    setAccentColor: (color: string) => void;
    setAiSuggestionCount: (count: number) => void;
    setLanguage: (lang: 'ru' | 'en') => void;
    setVoiceId: (id: string) => void;
    setIsWakeWordEnabled: (enabled: boolean) => void;
    setDefaultCurrency: (currency: string) => void;
    setSoundPack: (pack: SoundPack) => void;
    setTimeFocusMode: (mode: boolean) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setMorningBriefingTime: (time: string) => void;
    setCalendarStyle: (style: string) => void;
    setAvatar: (type: string, value: string) => void;
    setGender: (gender: string) => void;
    setViewMode: (mode: string) => void;
    setIsPublicProfile: (pub: boolean) => void;

    // Identity
    setUserIdentity: (identity: UserIdentity) => void;
    deleteUserIdentity: (id: string) => void;
    setActiveIdentity: (id: string) => void;

    // Misc
    onShowOnboarding?: () => void;

    // Translations
    t: any;
}

// =============================================
// ModalManager Component
// =============================================

const ModalManager: React.FC<ModalManagerProps> = (props) => {
    const {
        user, isPro, proExpiry, isAdmin,
        habits, activeHabits, archivedHabits, goals,
        userRewards, userIdentities, activeIdentityId, activeIdentity,
        reflectionEntries, reflectionSessions, vaultData,
        analysis, isAnalyzing,
        language, currentTheme, displayOptions, accentColor,
        aiSuggestionCount, voiceId, isWakeWordEnabled,
        defaultCurrency, soundPack, timeFocusMode,
        notificationsEnabled, morningBriefingTime,
        calendarStyle, avatarType, avatarValue, gender,
        viewMode,
        // Modal states
        isAddModalOpen, isAIModalOpen, isSettingsModalOpen,
        isArchiveOpen, isVoiceAssistantOpen, isFeedbackModalOpen,
        isFeedbackListModalOpen, isActivityModalOpen, isFocusModeOpen,
        isRewardsModalOpen, isMindMovieOpen, isDailyInterruptOpen,
        isEveningReviewOpen, isAIReflectionOpen, isReflectionHistoryOpen,
        isGoalsModalOpen, onOpenAIGoalChain, isMorningRitualOpen, isVaultOpen,
        isActivityRingsModalOpen,
        milestoneCelebration, identityCelebration, focusInitialContext,
        selectedHabit, editingHabit,
        // Setters
        setIsAddModalOpen, setIsAIModalOpen, setIsSettingsModalOpen,
        setIsArchiveOpen, setIsVoiceAssistantOpen, setIsFeedbackModalOpen,
        setIsFeedbackListModalOpen, setIsActivityModalOpen, setIsFocusModeOpen,
        setIsRewardsModalOpen, setIsMindMovieOpen, setIsDailyInterruptOpen,
        setIsEveningReviewOpen, setIsAIReflectionOpen, setIsReflectionHistoryOpen,
        setIsGoalsModalOpen, setIsMorningRitualOpen, setIsVaultOpen,
        setIsActivityRingsModalOpen,
        setMilestoneCelebration, setIdentityCelebration, setFocusInitialContext,
        setSelectedHabit, setEditingHabit,
        // Handlers
        handleSaveHabit, handleUpdateHabit, handleBatchUpdateHabits,
        toggleDate, handleToggleDate, handleMarkAllDone,
        handleVoiceArchive, handleVoiceRequestFocus,
        deleteHabit, archiveHabit,
        handleExport, handleImport, handleLogout,
        handleRedeemCode, handleGenerateCode,
        handleSaveGoal, handleDeleteGoal,
        handleSaveReflection, handleSaveFullReflectionSession,
        handleUpdateVault, handleUseStreakSaver, countIdentityProofs,
        // Settings setters
        setDisplayOptions, setTheme, setAccentColor,
        setAiSuggestionCount, setLanguage, setVoiceId,
        setIsWakeWordEnabled, setDefaultCurrency, setSoundPack,
        setTimeFocusMode, setNotificationsEnabled, setMorningBriefingTime,
        setCalendarStyle, setAvatar, setGender, setViewMode, setIsPublicProfile,
        setUserIdentity, deleteUserIdentity, setActiveIdentity,
        onShowOnboarding,
        t,
    } = props;

    return (
        <Suspense fallback={null}>
            {/* Habit Form (Create/Edit) */}
            <HabitFormModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditingHabit(null); }}
                onSave={handleSaveHabit}
                initialData={editingHabit}
                language={language}
                defaultCurrency={defaultCurrency}
            />

            {/* AI Analysis Modal */}
            <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} analysis={analysis} loading={isAnalyzing} language={language} />

            {/* Feedback */}
            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                user={user}
                language={language}
            />
            <FeedbackListModal
                isOpen={isFeedbackListModalOpen}
                onClose={() => setIsFeedbackListModalOpen(false)}
                language={language}
            />

            {/* Activity */}
            <ActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                habits={activeHabits}
                language={language}
            />

            {/* Voice Assistant */}
            <VoiceAssistantModal
                isOpen={isVoiceAssistantOpen}
                onClose={() => setIsVoiceAssistantOpen(false)}
                onCreateHabit={handleSaveHabit}
                onUpdateHabit={handleUpdateHabit}
                onBatchUpdateHabits={handleBatchUpdateHabits}
                onToggleHabit={toggleDate}
                onMarkAll={handleMarkAllDone}
                onArchiveHabit={handleVoiceArchive}
                onRequestFocus={handleVoiceRequestFocus}
                onStartPomodoro={(habitId, minutes) => {
                    const habit = habits.find(h => h.id === habitId);
                    if (habit) {
                        setSelectedHabit(habit);
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('startPomodoro', { detail: { minutes } }));
                        }, 500);
                    }
                }}
                onNavigateTo={(screen) => {
                    setIsVoiceAssistantOpen(false);
                    if (screen === 'settings') setIsSettingsModalOpen(true);
                    else if (screen === 'activity') setIsActivityModalOpen(true);
                }}
                onUpdateSettings={(updated) => {
                    if (updated.theme) {
                        const theme = THEMES.find(t => t.id.toLowerCase() === updated.theme?.toLowerCase());
                        if (theme) setTheme(theme as AppTheme);
                    }
                    if (updated.language) setLanguage(updated.language);
                    if (updated.timeFocusMode !== undefined) setTimeFocusMode(updated.timeFocusMode);
                    if (updated.isWakeWordEnabled !== undefined) setIsWakeWordEnabled(updated.isWakeWordEnabled);
                }}
                currentSettings={{
                    theme: currentTheme.id,
                    language,
                    timeFocusMode,
                    accentColor,
                    isWakeWordEnabled
                }}
                habits={habits.filter(h => !h.archived)}
                reflections={reflectionEntries}
                language={language}
                voiceId={voiceId}
                defaultCurrency={defaultCurrency}
            />

            {/* Focus Mode */}
            <FocusMode
                isOpen={isFocusModeOpen}
                onClose={() => { setIsFocusModeOpen(false); setFocusInitialContext(undefined); }}
                initialContext={focusInitialContext}
                habits={habits}
                onComplete={(id) => toggleDate(id, getLocalDateString())}
                language={language}
            />

            {/* Settings */}
            <SettingsModal
                isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)}
                options={displayOptions} setOptions={setDisplayOptions}
                onExport={handleExport} onImport={handleImport}
                onOpenArchive={() => { setIsSettingsModalOpen(false); setIsArchiveOpen(true); }}
                currentThemeId={currentTheme.id} onSetTheme={setTheme}
                user={user} onLogout={handleLogout}
                isPro={isPro} proExpiry={proExpiry}
                onRedeemCode={handleRedeemCode} onGenerateCode={handleGenerateCode} isAdmin={!!isAdmin}
                accentColor={accentColor} setAccentColor={setAccentColor}
                aiSuggestionCount={aiSuggestionCount} setAiSuggestionCount={setAiSuggestionCount}
                language={language} setLanguage={setLanguage}
                voiceId={voiceId} setVoiceId={setVoiceId}
                isWakeWordEnabled={isWakeWordEnabled} setIsWakeWordEnabled={setIsWakeWordEnabled}
                onOpenFeedback={() => { setIsSettingsModalOpen(false); setIsFeedbackModalOpen(true); }}
                onOpenFeedbackList={() => { setIsSettingsModalOpen(false); setIsFeedbackListModalOpen(true); }}
                defaultCurrency={defaultCurrency}
                setDefaultCurrency={setDefaultCurrency}
                soundPack={soundPack}
                setSoundPack={setSoundPack}
                timeFocusMode={timeFocusMode}
                setTimeFocusMode={setTimeFocusMode}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                morningBriefingTime={morningBriefingTime}
                setMorningBriefingTime={setMorningBriefingTime}
                calendarStyle={calendarStyle}
                setCalendarStyle={setCalendarStyle}
                avatarType={avatarType}
                avatarValue={avatarValue}
                setAvatar={setAvatar}
                gender={gender}
                setGender={setGender}
                onOpenVault={() => { setIsSettingsModalOpen(false); setIsVaultOpen(true); }}
                onShowOnboarding={() => { setIsSettingsModalOpen(false); onShowOnboarding?.(); }}
            />

            {/* Habit Details */}
            {selectedHabit && (
                <HabitDetailsModal
                    isOpen={!!selectedHabit}
                    onClose={() => setSelectedHabit(null)}
                    habit={selectedHabit}
                    onToggleDate={(d) => handleToggleDate(selectedHabit.id, d)}
                    onEdit={() => { setEditingHabit(selectedHabit); setSelectedHabit(null); setIsAddModalOpen(true); }}
                    onDelete={deleteHabit}
                    onArchive={archiveHabit}
                    onUpdate={handleUpdateHabit}
                    onOpenTransformation={() => {
                        setSelectedHabit(null);
                        const transformBtn = document.getElementById('btn-open-transformation') || document.getElementById('btn-open-transformation-set');
                        if (transformBtn) transformBtn.click();
                    }}
                    language={language}
                />
            )}

            {/* Archive */}
            <Modal isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} title={t.tabHome}>
                <div className="space-y-4">
                    {archivedHabits.length === 0 && <p className="text-textSecondary text-center py-8">Empty</p>}
                    {archivedHabits.map(h => (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-surfaceHighlight/30 rounded-xl border border-borderSubtle">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-surfaceHighlight flex items-center justify-center text-textSecondary"><Icon name={h.icon} size={16} /></div>
                                <span className="font-medium text-textPrimary">{h.name}</span>
                            </div>
                            <button onClick={() => archiveHabit(h.id)} className="text-xs bg-textPrimary text-background px-3 py-1.5 rounded-lg font-bold hover:opacity-80">Restore</button>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Rewards */}
            <RewardsModal
                isOpen={isRewardsModalOpen}
                onClose={() => setIsRewardsModalOpen(false)}
                userRewards={userRewards}
                habits={habits}
                language={language}
                onUseStreakSaver={handleUseStreakSaver}
            />

            {/* Mind Movie */}
            <MindMovieModal
                isOpen={isMindMovieOpen}
                onClose={() => setIsMindMovieOpen(false)}
                userIdentities={userIdentities}
                activeIdentityId={activeIdentityId}
                onSave={setUserIdentity}
                onDelete={deleteUserIdentity}
                onSetActive={setActiveIdentity}
                language={language}
                habits={habits}
            />

            {/* Daily Interrupt */}
            <DailyInterruptModal
                isOpen={isDailyInterruptOpen}
                onClose={() => setIsDailyInterruptOpen(false)}
                onAnswer={handleSaveReflection}
                onOpenHistory={() => {
                    setIsDailyInterruptOpen(false);
                    setIsReflectionHistoryOpen(true);
                }}
                language={language}
                gender={gender}
            />

            {/* AI Reflection */}
            <AIReflectionSession
                isOpen={isAIReflectionOpen}
                onClose={() => setIsAIReflectionOpen(false)}
                onSaveReflection={(q, a, insight) => handleSaveReflection(q, a, insight)}
                onSaveFullSession={handleSaveFullReflectionSession}
                onOpenHistory={() => {
                    setIsAIReflectionOpen(false);
                    setIsReflectionHistoryOpen(true);
                }}
                habits={habits}
                language={language}
                gender={gender}
            />

            {/* Reflection History */}
            <ReflectionHistoryModal
                isOpen={isReflectionHistoryOpen}
                onClose={() => setIsReflectionHistoryOpen(false)}
                entries={reflectionEntries}
                sessions={reflectionSessions}
                language={language}
            />

            {/* Goals */}
            <GoalsModal
                isOpen={isGoalsModalOpen}
                onClose={() => setIsGoalsModalOpen(false)}
                goals={goals}
                habits={habits}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
                onOpenAIGoalChain={onOpenAIGoalChain}
                language={language}
            />

            {/* Morning Ritual */}
            <MorningRitualModal
                isOpen={isMorningRitualOpen}
                onClose={() => setIsMorningRitualOpen(false)}
                identity={activeIdentity}
                habits={habits.filter(h => !h.archived)}
                language={language}
                gender={gender}
                onStartDay={() => setIsMorningRitualOpen(false)}
            />

            {/* Evening Review */}
            <EveningReviewModal
                isOpen={isEveningReviewOpen}
                onClose={() => setIsEveningReviewOpen(false)}
                habits={habits}
                language={language}
            />

            {/* Milestone Celebration */}
            <MilestoneCelebrationComponent
                isOpen={milestoneCelebration.isOpen}
                onClose={() => setMilestoneCelebration(prev => ({ ...prev, isOpen: false }))}
                streak={milestoneCelebration.streak}
                habitName={milestoneCelebration.habitName}
                language={language}
            />

            {/* Identity Celebration */}
            <IdentityCelebration
                isOpen={identityCelebration.isOpen}
                onClose={() => setIdentityCelebration({ isOpen: false, milestone: 0 })}
                identity={activeIdentity}
                milestone={identityCelebration.milestone}
                proofCount={countIdentityProofs(habits, activeIdentity)}
                language={language}
            />

            {/* Activity Rings Calendar */}
            <ActivityRingsCalendarModal
                isOpen={isActivityRingsModalOpen}
                onClose={() => setIsActivityRingsModalOpen(false)}
                habits={habits}
                language={language}
            />

            {/* Vault */}
            <VaultModal
                isOpen={isVaultOpen}
                onClose={() => setIsVaultOpen(false)}
                vaultData={vaultData}
                onUpdateVault={handleUpdateVault}
                language={language}
                currency={defaultCurrency}
            />
        </Suspense>
    );
};

export default ModalManager;
