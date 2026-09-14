
import React, { useState, useEffect, useRef, Suspense, startTransition } from 'react';
import { Plus, Check, RotateCcw, Cloud, AlertCircle, WifiOff, Star, Sparkles } from 'lucide-react';

import { confettiMilestone, confettiAllDone } from './utils/confetti';
import { supabase } from './supabaseClient';

import { signInWithNativeGoogle, initGoogleAuth, isCapacitorNative, signOutNativeGoogle } from './nativeAuth';

// Hooks
import { useHabits } from './hooks/useHabits';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import { useModals } from './hooks/useModals';
import { useAI } from './hooks/useAI';
import { useRewards } from './hooks/useRewards';
import { useGoals } from './hooks/useGoals';
import { useReflections } from './hooks/useReflections';
import { useVault } from './hooks/useVault';
import { useAIInsights } from './hooks/useAIInsights';
import { useEngines } from './hooks/useEngines';
import { playSound, playRaritySound, initAudio, preloadSounds, stopCurrentSound } from './utils/sound';
import { ADMIN_EMAILS, PRO_THEMES, MAX_FREE_HABITS, MAX_FREE_HABITS_BONUS } from './constants';
import { calculateNewAdaptiveLevel, processAdaptiveUpdates } from './utils/adaptiveGoals';
import { translations } from './translations'; // Import translations
import { motion, AnimatePresence } from 'framer-motion';
import { tabContentVariants, springTab, motionControl } from './utils/motionPresets';



import { Habit, AppTheme, THEMES, HabitAnalysis, AVAILABLE_COLORS, getRarity, SoundPack, KanbanColumn, HabitConnection, UserRewards, getCurrentStreak, getStreakMilestone, calculateRewardsFromStreak, getXPProgress, UserIdentity, DeepAnalysis, getAccentGradient } from './types';
import { Goal } from './types';
import { EMPTY_VAULT } from './types/vault';

// Direct imports for components still rendered in App.tsx
const StatsTab = React.lazy(() => import('./components/StatsTab'));
import { DisplayOptions } from './components/SettingsModal';
const AdvancedCalendar = React.lazy(() => import('./components/AdvancedCalendar'));
const LeaderboardView = React.lazy(() => import('./components/LeaderboardView'));
import LoginScreen from './components/LoginScreen';
import LiquidDock from './components/LiquidDock';

// Extracted components
import HomeTab from './components/HomeTab';
import ModalManager from './components/ModalManager';
import SplitText from './components/SplitText';
import Aurora from './components/Aurora';
import { HabitHeatmap } from './components/HabitHeatmap';
import { QuickActionModal } from './components/QuickActionModal';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitDetailsModal } from './components/HabitDetailsModal';

import OnboardingScreen from './components/OnboardingScreen';
import RotatingText from './components/RotatingText';
import { WealthDashboard } from './components/WealthDashboard';
import { AIGoalChainModal } from './components/AIGoalChainModal';
const AICoachModal = React.lazy(() => import('./components/AICoachModal'));
import UpdateBanner from './components/UpdateBanner';
import { useAppUpdate } from './hooks/useAppUpdate';

import { generateId, triggerHaptic, triggerStrongHaptic, triggerProCelebration, getLocalDateString, countIdentityProofs, removeUndefined } from './utils/helpers';


// Limits, PRO_THEMES, and ADMIN_EMAILS are imported from constants.ts




const App: React.FC = () => {
    // --- Init: Cache Busting ---
    useEffect(() => {
        // Force SW update check on mount to ensure we have the latest version (v13.0.0)
        // and avoid serving the old firebaseapp.com redirect logic.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }, []);

    // --- CUSTOM HOOKS (ORDER MATTERS) ---
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
        // Animate progress bar to 90% quickly on mount
        const startTime = Date.now();
        const duration = 600;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 90, 90);
            setLoadingProgress(progress);
            if (progress >= 90) clearInterval(interval);
        }, 20);

        return () => clearInterval(interval);
    }, []);

    const {
        user, authLoading, isPro, proExpiry, isAdmin,
        isPublicProfile, isExpansionUnlocked, userIdentities, activeIdentityId,
        setUserIdentity, deleteUserIdentity, setActiveIdentity,
        handleLogin, handleEmailLogin, handleLogout, setIsPublicProfile, handleRedeemCode
    } = useAuth();

    // Complete progress bar when auth finishes loading
    useEffect(() => {
        if (!authLoading) setLoadingProgress(100);
    }, [authLoading]);

    const {
        language, setLanguage, currentTheme, setTheme,
        accentColor, setAccentColor, viewMode, setViewMode,
        aiSuggestionCount, setAiSuggestionCount, voiceId, setVoiceId,
        isWakeWordEnabled, setIsWakeWordEnabled, displayOptions, setDisplayOptions,
        notificationsEnabled, setNotificationsEnabled, morningBriefingTime, setMorningBriefingTime,
        soundPack, setSoundPack, defaultCurrency, setDefaultCurrency,
        calendarStyle, setCalendarStyle,
        avatarType, avatarValue, setAvatar,
        gender, setGender
    } = useSettings(user, isPro);

    const { habits, setHabits, loading: dataLoading, saveStatus } = useHabits(user);
    const { analysis, isAnalyzing, setAnalysis, handleAnalyze, insightSaved, setInsightSaved } = useAI(user, isPro, language);

    const activeIdentity = userIdentities.find(i => i.id === activeIdentityId) || userIdentities[0];

    const {
        isAddModalOpen, setIsAddModalOpen, isAIModalOpen, setIsAIModalOpen,
        isSettingsModalOpen, setIsSettingsModalOpen, isArchiveOpen, setIsArchiveOpen,
        isVoiceAssistantOpen, setIsVoiceAssistantOpen, isFeedbackModalOpen, setIsFeedbackModalOpen,
        isFeedbackListModalOpen, setIsFeedbackListModalOpen, isActivityModalOpen, setIsActivityModalOpen,
        isFocusModeOpen, setIsFocusModeOpen, isRewardsModalOpen, setIsRewardsModalOpen,
        isMindMovieOpen, setIsMindMovieOpen, isWealthDashboardOpen, setIsWealthDashboardOpen,
        isAIGoalChainOpen, setIsAIGoalChainOpen, closeAll
    } = useModals();

    const [aiGoalChainTitle, setAiGoalChainTitle] = useState('');

    const handleOpenAIGoalChain = (title?: string) => {
        if (title) setAiGoalChainTitle(title);
        setIsAIGoalChainOpen(true);
    };

    // --- EXTRACTED HOOKS ---
    const { goals, isGoalsModalOpen, setIsGoalsModalOpen, saveGoal: handleSaveGoal, deleteGoal: handleDeleteGoal } = useGoals(user);
    const { reflectionEntries, reflectionSessions, saveReflection: handleSaveReflection, saveFullSession: handleSaveFullReflectionSession } = useReflections(user);
    const { isVaultOpen, setIsVaultOpen, vaultData, updateVault: handleUpdateVault } = useVault(user);
    const { savedAiInsights, deepAnalysisHistory, aiSectionTab, setAiSectionTab, saveAIInsight, saveDeepAnalysis: handleSaveDeepAnalysis } = useAIInsights(user, language);

    // --- 7 BEHAVIORAL ENGINES ---
    const engines = useEngines(user, habits, user?.user_metadata?.full_name || user?.email?.split('@')[0]);

    // --- APP UPDATE DETECTION ---
    const appUpdate = useAppUpdate();


    // Daily Interrupt Modal state (for reflection questions)
    const [isDailyInterruptOpen, setIsDailyInterruptOpen] = useState(false);
    const [isEveningReviewOpen, setIsEveningReviewOpen] = useState(false);
    const [milestoneCelebration, setMilestoneCelebration] = useState<{ isOpen: boolean; streak: number; habitName: string }>({ isOpen: false, streak: 0, habitName: '' });
    const [isAIReflectionOpen, setIsAIReflectionOpen] = useState(false);
    const [isReflectionHistoryOpen, setIsReflectionHistoryOpen] = useState(false);
    const [isActivityRingsModalOpen, setIsActivityRingsModalOpen] = useState(false);

    // Identity System state
    const [isMorningRitualOpen, setIsMorningRitualOpen] = useState(false);
    const [identityCelebration, setIdentityCelebration] = useState<{ isOpen: boolean; milestone: number }>({ isOpen: false, milestone: 0 });

    // Onboarding state — only for brand new users (no habits yet)
    const [showOnboarding, setShowOnboarding] = useState(false);

    // AI Coach Modal state
    const [isAICoachOpen, setIsAICoachOpen] = useState(false);

    // Onboarding disabled - no auto-trigger


    // Just completed animation state (clears after 1.2s)
    const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

    // handleSaveAIInsight wrapper (bridges hook and existing setInsightSaved)
    const handleSaveAIInsight = async (analysisData: HabitAnalysis) => {
        await saveAIInsight(analysisData, setInsightSaved);
    };


    const { userRewards, setUserRewards, handleUseStreakSaver } = useRewards(user, habits, setIsRewardsModalOpen);

    const [processedAdaptive, setProcessedAdaptive] = useState(false);

    // Run Daily Adaptive Check once on load
    useEffect(() => {
        if (!dataLoading && habits.length > 0 && !processedAdaptive) {
            const updatedHabits = processAdaptiveUpdates(habits);
            const hasChanges = JSON.stringify(updatedHabits) !== JSON.stringify(habits);
            if (hasChanges) setHabits(updatedHabits);
            setProcessedAdaptive(true);
        }
    }, [dataLoading, habits, processedAdaptive, setHabits]);

    // Smart onboarding: show ONLY when data loaded + truly 0 habits + never done before
    useEffect(() => {
        if (!dataLoading && user && habits.length === 0 &&
            !localStorage.getItem('onboarding_done') &&
            !localStorage.getItem('onboarding_skipped')) {
            setShowOnboarding(true);
        }
    }, [dataLoading, user, habits.length]);

    // Unlock Audio Context
    useEffect(() => {
        const handleInteract = () => {
            initAudio();
            preloadSounds();
            window.removeEventListener('touchstart', handleInteract);
            window.removeEventListener('click', handleInteract);
        };
        window.addEventListener('touchstart', handleInteract);
        window.addEventListener('click', handleInteract);
        return () => {
            window.removeEventListener('touchstart', handleInteract);
            window.removeEventListener('click', handleInteract);
        };
    }, []);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

    const activeHabits = habits.filter(h => !h.archived && h.type !== 'task' && (!activeTagFilter || (h.tags && h.tags.includes(activeTagFilter))));
    const allTasks = habits.filter(h => !h.archived && h.type === 'task');
    const kanbanTasks = allTasks.filter(h => {
        // Hide completed one-time tasks from Kanban
        if (h.date && h.completedDates.includes(h.date)) return false;
        return true;
    });
    const archivedHabits = habits.filter(h => h.archived);

    const selectedDateStr = getLocalDateString(selectedDate);
    const todaysTasks = habits.filter(h => !h.archived && h.type === 'task' && h.date === selectedDateStr);

    const overdueTasks = habits.filter(h => {
        if (h.type !== 'task' || h.archived || !h.date) return false;
        const todayStr = getLocalDateString();
        if (h.date >= todayStr) return false;
        return !h.completedDates.includes(h.date);
    });

    const TAB_ORDER = ['home', 'calendar', 'stats', 'community'] as const;
    const [activeTab, setActiveTabRaw] = useState<'home' | 'calendar' | 'stats' | 'community'>('home');
    const tabDirection = useRef(1); // 1 = forward, -1 = backward
    const setActiveTab = (tab: typeof activeTab) => {
        const oldIdx = TAB_ORDER.indexOf(activeTab);
        const newIdx = TAB_ORDER.indexOf(tab);
        tabDirection.current = newIdx >= oldIdx ? 1 : -1;
        startTransition(() => {
            setActiveTabRaw(tab);
        });
    };

    // Remaining non-hook state (Layout/UI specific)
    const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => {
        const saved = localStorage.getItem('kanbanColumns');
        if (saved) return JSON.parse(saved);
        return [
            { id: 'todo', title: 'To Do', color: '#3b82f6', order: 0 },
            { id: 'in_progress', title: 'In Progress', color: '#eab308', order: 1 },
            { id: 'done', title: 'Done', color: '#22c55e', order: 2 }
        ];
    });

    useEffect(() => {
        localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    }, [kanbanColumns]);

    const [habitConnections, setHabitConnections] = useState<HabitConnection[]>(() => {
        const saved = localStorage.getItem('habitConnections');
        return saved ? JSON.parse(saved) : [];
    });

    const [graphPositions, setGraphPositions] = useState<Record<string, { x: number; y: number }>>(() => {
        const saved = localStorage.getItem('graphPositions');
        return saved ? JSON.parse(saved) : {};
    });

    const [timeFocusMode, setTimeFocusMode] = useState(() => localStorage.getItem('timeFocusMode') === 'true');
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem('timeFocusMode', String(timeFocusMode));
        if (user) supabase.from('users').update({ settings: { timeFocusMode } }).eq('id', user.id).then(({ error }) => { if (error) console.error(error); });
    }, [timeFocusMode, user]);

    useEffect(() => {
        localStorage.setItem('habitConnections', JSON.stringify(habitConnections));
        localStorage.setItem('graphPositions', JSON.stringify(graphPositions));
        if (user) {
            const timeout = setTimeout(() => {
                supabase.from('users').update(removeUndefined({ habitConnections })).eq('id', user.id).then(({ error }) => { if (error) console.log(error); });
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [habitConnections, graphPositions, user]);
    useEffect(() => {
        if (accentColor) localStorage.setItem('accentColor', accentColor);
        else localStorage.removeItem('accentColor');
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('themeId', currentTheme.id);
        const root = document.documentElement;
        root.setAttribute('data-theme', currentTheme.id);  // For theme detection in components
        root.style.setProperty('--background', currentTheme.colors.background);
        root.style.setProperty('--surface', currentTheme.colors.surface);
        root.style.setProperty('--surface-highlight', currentTheme.colors.surfaceHighlight);
        root.style.setProperty('--text-primary', currentTheme.colors.textPrimary);
        root.style.setProperty('--text-secondary', currentTheme.colors.textSecondary);
        const accent = getAccentGradient(accentColor);
        root.style.setProperty('--brand', accent.primary || currentTheme.colors.brand);
        root.style.setProperty('--border-subtle', currentTheme.colors.borderSubtle);

        // Dark mode class toggle
        if (currentTheme.isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Glassmorphism 2026
        if (currentTheme.isGlass) {
            root.style.setProperty('--glass-blur', currentTheme.glassBlur || '0px');
            root.style.setProperty('--glass-opacity', String(currentTheme.glassOpacity || 1));
            root.style.setProperty('--bg-gradient', currentTheme.backgroundGradient || 'none');
            root.setAttribute('data-glass', 'true');
        } else {
            root.style.setProperty('--glass-blur', '0px');
            root.style.setProperty('--glass-opacity', '1');
            root.style.setProperty('--bg-gradient', 'none');
            root.removeAttribute('data-glass');
        }
    }, [currentTheme, accentColor]);

    // Guard: PRO-тема у не-PRO пользователя. Не ослепляем тёмного пользователя
    // светлым Daylight — откатываем на ближайшую СВОБОДНУЮ тему того же режима.
    useEffect(() => {
        if (!isPro && PRO_THEMES.includes(currentTheme.id)) {
            const fallback = currentTheme.isDark
                ? (THEMES.find(t => t.id === 'ios-dark') || THEMES[0])
                : THEMES[0];
            setTheme(fallback);
        }
    }, [isPro, currentTheme, setTheme]);

    // --- MIND MOVIE LOGIC ---
    useEffect(() => {
        if (!activeIdentity) return;
        const today = new Date().toISOString().split('T')[0];
        const lastViewed = activeIdentity.lastViewedAt?.split('T')[0];
        if (lastViewed !== today) {
            const timer = setTimeout(() => {
                setIsMindMovieOpen(true);
                setUserIdentity({ ...activeIdentity, lastViewedAt: new Date().toISOString() });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [activeIdentity?.id, setUserIdentity, setIsMindMovieOpen]);


    // Schedule notifications for habits with reminderTime
    // OPTIMIZATION: Heavy debounce to prevent running on every toggle
    const notificationScheduleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!notificationsEnabled || habits.length === 0) return;

        // Cancel any pending schedule
        if (notificationScheduleTimerRef.current) {
            clearTimeout(notificationScheduleTimerRef.current);
        }

        // DEBOUNCE 5 seconds - only run after user stops interacting
        // This prevents 154+ setTimeout calls on every checkbox toggle
        notificationScheduleTimerRef.current = setTimeout(async () => {
            try {
                const { scheduleHabitReminders, cancelAllHabitNotifications, scheduleMorningBriefing, scheduleWeeklySummary } = await import('./notifications');

                // OPTIMIZATION: Don't await each one - fire all in parallel to not block
                // Use Promise.allSettled to run all concurrently without blocking
                const habitPromises = habits
                    .filter(h => !h.archived)
                    .map(habit => {
                        if (habit.reminderTime) {
                            return scheduleHabitReminders(
                                habit.id,
                                habit.name,
                                habit.reminderTime,
                                habit.frequency || 'daily',
                                habit.frequencyDays,
                                language
                            );
                        } else {
                            return cancelAllHabitNotifications(habit.id);
                        }
                    });

                // Fire all at once, don't wait for results (they're just setTimeout inside)
                Promise.allSettled(habitPromises).catch(() => { });

                // Schedule morning briefing
                if (morningBriefingTime) {
                    const [hour, minute] = morningBriefingTime.split(':').map(Number);
                    const activeHabitsCount = habits.filter(h => !h.archived && h.type !== 'task').length;
                    await scheduleMorningBriefing(hour, minute, activeHabitsCount, language);
                }

                // Schedule weekly summary (Sunday 18:00)
                const activeHabits = habits.filter(h => !h.archived && h.type !== 'task');
                if (activeHabits.length > 0) {
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;

                    let weeklyCompletions = 0;
                    let bestStreak = 0;
                    let possibleCompletions = 0;

                    for (const habit of activeHabits) {
                        const completionsThisWeek = habit.completedDates.filter(d => d >= weekAgoStr).length;
                        weeklyCompletions += completionsThisWeek;
                        const streak = getCurrentStreak(habit);
                        if (streak > bestStreak) bestStreak = streak;
                        possibleCompletions += habit.frequency === 'daily' ? 7 :
                            habit.frequency === 'weekly' ? 1 :
                                habit.frequencyDays?.length || 7;
                    }

                    const completionRate = possibleCompletions > 0 ? (weeklyCompletions / possibleCompletions) * 100 : 0;
                    await scheduleWeeklySummary(weeklyCompletions, bestStreak, completionRate, language);
                }
            } catch (e) {
                console.warn('Failed to schedule notifications:', e);
            }
        }, 5000); // 5 second debounce

        return () => {
            if (notificationScheduleTimerRef.current) {
                clearTimeout(notificationScheduleTimerRef.current);
            }
        };
    }, [habits, notificationsEnabled, morningBriefingTime, language]);

    // Focus Mode Context State - passed from Voice to Focus
    const [focusInitialContext, setFocusInitialContext] = useState<{ energy?: number, timeAvailable?: number } | undefined>(undefined);

    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);



    // --- Wake Word Logic ---
    // On native Android, uses longer restart delay to reduce mic indicator flashing.
    const wakeWordRecognition = useRef<any>(null);
    const isNative = isCapacitorNative();

    useEffect(() => {
        if (!isWakeWordEnabled || !user || isVoiceAssistantOpen) {
            if (wakeWordRecognition.current) {
                wakeWordRecognition.current.onend = null;
                wakeWordRecognition.current.abort();
                wakeWordRecognition.current = null;
            }
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';

        recognition.onresult = (event: any) => {
            const lastIndex = event.results.length - 1;
            const transcript = event.results[lastIndex][0].transcript.toLowerCase().trim();

            const triggers = language === 'ru'
                ? ['эй тренер', 'привет тренер', 'тренер', 'слушай тренер']
                : ['hey coach', 'hi coach', 'hello coach', 'coach'];

            if (triggers.some(t => transcript.includes(t))) {
                playSound('success');
                recognition.onend = null;
                recognition.abort();
                setIsVoiceAssistantOpen(true);
            }
        };

        recognition.onend = () => {
            if (!isVoiceAssistantOpen && user && isWakeWordEnabled) {
                // On Android: longer delay (10s) to reduce mic indicator flashing
                // On browser: shorter delay (2.5s) for responsiveness
                const restartDelay = isNative ? 10000 : 2500;
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, restartDelay);
            }
        };

        const startTimeout = setTimeout(() => {
            try {
                recognition.start();
                wakeWordRecognition.current = recognition;
            } catch (e) {
                console.warn("Wake word start failed", e);
            }
        }, 500);

        return () => {
            clearTimeout(startTimeout);
            if (wakeWordRecognition.current) {
                wakeWordRecognition.current.onend = null;
                wakeWordRecognition.current.abort();
            }
        };
    }, [user, isVoiceAssistantOpen, language, isWakeWordEnabled]);


    // --- Actions ---

    // ... Rest of the component (handlers, render) ...
    // Note: I'm reusing the existing code from the user prompt for the rest of the file
    // to keep it concise, as only the Auth logic needed changes.
    // The previous implementation of these handlers is preserved below.

    // --- Voice -> Focus Mode Bridge ---
    const handleVoiceRequestFocus = (energy: number, time: number) => {
        setIsVoiceAssistantOpen(false);
        setFocusInitialContext({ energy, timeAvailable: time });
        setIsFocusModeOpen(true);
    };

    const handleSaveHabit = (habitData: Partial<Habit>) => {
        const currentLimit = isPro ? Infinity : (isExpansionUnlocked ? MAX_FREE_HABITS_BONUS : MAX_FREE_HABITS);

        if (habitData.type === 'habit' && activeHabits.length >= currentLimit && !editingHabit) {
            setIsAddModalOpen(false);
            if (!isPro && !isExpansionUnlocked) {
                const msg = language === 'ru'
                    ? `В бесплатной версии доступно ${MAX_FREE_HABITS} привычек. Будьте активны 30 дней, чтобы получить 10!`
                    : `Free limit is ${MAX_FREE_HABITS} habits. Stay active for 30 days to unlock 10!`;
                alert(msg);
                setIsSettingsModalOpen(true);
            } else if (!isPro) {
                setIsSettingsModalOpen(true);
                setTimeout(() => alert(language === 'ru' ? `Вы достигли бонусного лимита (${MAX_FREE_HABITS_BONUS}). Для безлимита нужен Pro.` : `You reached the bonus limit (${MAX_FREE_HABITS_BONUS}). Go Pro for unlimited.`), 300);
            }
            return;
        }

        setHabits(prev => {
            if (editingHabit) {
                const updated = prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } : h);
                if (selectedHabit?.id === editingHabit.id) setSelectedHabit(prev => prev ? ({ ...prev, ...habitData }) : null);
                return updated;
            } else {
                const newHabit: Habit = {
                    ...habitData,
                    id: (habitData.id && habitData.id !== 'temp-id') ? habitData.id : generateId(),
                    type: habitData.type || 'habit',
                    name: habitData.name || 'Unnamed',
                    description: habitData.description || '',
                    color: habitData.color || '#3b82f6',
                    icon: habitData.icon || 'Star',
                    category: habitData.category || (language === 'ru' ? 'Другое' : 'Other'),
                    frequency: habitData.frequency || 'daily',
                    frequencyDays: habitData.frequencyDays || [],
                    targetCount: habitData.targetCount || 1,
                    completedDates: habitData.completedDates || [],
                    createdAt: habitData.createdAt || new Date().toISOString(),
                    archived: false
                } as Habit;
                return [...prev, newHabit];
            }
        });
        setEditingHabit(null);
        setIsAddModalOpen(false);
    };

    const handleUpdateHabit = (id: string, updates: Partial<Habit>) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
        triggerHaptic();
    };

    const handleBatchUpdateHabits = (updates: { id: string, data: Partial<Habit> }[]) => {
        setHabits(prev => prev.map(h => {
            const update = updates.find(u => u.id === h.id);
            return update ? { ...h, ...update.data } : h;
        }));
        triggerStrongHaptic();
    };

    const deleteHabit = (id: string) => {
        if (confirm(language === 'ru' ? 'Вы уверены?' : 'Are you sure?')) {
            setHabits(prev => prev.filter(h => h.id !== id));
            if (selectedHabit?.id === id) setSelectedHabit(null);
        }
    };

    const archiveHabit = (id: string) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: !h.archived } : h));
        if (selectedHabit?.id === id) setSelectedHabit(null);
    };

    const handleVoiceArchive = (id: string) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: true } : h));
        triggerStrongHaptic();
        if (selectedHabit?.id === id) setSelectedHabit(null);
    };

    const handleMoveToToday = (id: string) => {
        const todayStr = getLocalDateString();
        setHabits(prev => prev.map(h => h.id === id ? { ...h, date: todayStr } : h));
        triggerStrongHaptic();
    };

    // Throttle to prevent rapid double-taps on mobile
    const lastToggleRef = React.useRef<{ [key: string]: number }>({});
    const TOGGLE_THROTTLE_MS = 200;

    const toggleDate = (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent | null) => {
        // Throttle check: prevent rapid double-taps
        const key = `${habitId}-${dateStr}`;
        const now = Date.now();
        if (lastToggleRef.current[key] && (now - lastToggleRef.current[key]) < TOGGLE_THROTTLE_MS) {
            return; // Ignore rapid double-tap
        }
        lastToggleRef.current[key] = now;

        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const isCompleted = habit.completedDates.includes(dateStr);

        // Set "just completed" ID for CSS animation (ONLY for habits, not tasks)
        // Tasks have a different animation that doesn't need this state
        const todayStr = getLocalDateString();
        if (dateStr === todayStr && !isCompleted && habit.type !== 'task') {
            setJustCompletedId(habitId);
            setTimeout(() => setJustCompletedId(null), 1200);
        }

        // STATE UPDATE
        setHabits(prevHabits => {
            return prevHabits.map(h => {
                if (h.id !== habitId) return h;
                const exists = h.completedDates.includes(dateStr);
                const newDates = exists
                    ? h.completedDates.filter(d => d !== dateStr)
                    : [...h.completedDates, dateStr];
                // Лог выполнения с точным временем (для «Моих Задач» и аналитики ИИ)
                const prevLog = h.completionLog || {};
                const newLog = { ...prevLog };
                if (exists) {
                    delete newLog[dateStr];
                } else {
                    newLog[dateStr] = new Date().toISOString();
                }
                return { ...h, completedDates: newDates, completionLog: newLog };
            });
        });

        // SOUNDS + HAPTIC (delayed to not block UI)
        setTimeout(() => {
            if (!isCompleted) {
                const rarity = getRarity(habit);
                playRaritySound(rarity, soundPack);
                triggerHaptic();

                // Check for streak milestone (visual celebration only, no extra sound)
                const updatedHabit = { ...habit, completedDates: [...habit.completedDates, dateStr] };
                const streak = getCurrentStreak(updatedHabit);
                const milestone = getStreakMilestone(streak);
                if (milestone && [3, 7, 14, 21, 30, 60, 90, 100].includes(streak)) {
                    setTimeout(() => {
                        triggerStrongHaptic();
                        setMilestoneCelebration({ isOpen: true, streak, habitName: habit.name });
                        confettiMilestone();
                    }, 600);
                }
            } else {
                playSound('click');
            }
        }, 50);

        // Confetti when ALL habits completed today
        if (!isCompleted) {
            setTimeout(() => {
                const todayStr2 = getLocalDateString();
                const allDone = activeHabits.length > 0 && activeHabits.every(h =>
                    h.completedDates.includes(todayStr2) || h.id === habitId
                );
                if (allDone) confettiAllDone();
            }, 300);
        }
    };

    const handleToggleDate = (habitId: string, dateStr: string, e?: React.MouseEvent | React.TouchEvent) => {
        toggleDate(habitId, dateStr, e);
        if (selectedHabit && selectedHabit.id === habitId) {
            setSelectedHabit(prev => {
                if (!prev) return null;
                const exists = prev.completedDates.includes(dateStr);
                return {
                    ...prev,
                    completedDates: exists ? prev.completedDates.filter(d => d !== dateStr) : [...prev.completedDates, dateStr]
                };
            });
        }
    };

    const handleMarkAllDone = () => {
        const todayStr = getLocalDateString();
        setHabits(prev => {
            let hasChange = false;
            const newHabits = prev.map(h => {
                if (h.archived || h.completedDates.includes(todayStr)) return h;
                hasChange = true;
                return { ...h, completedDates: [...h.completedDates, todayStr] };
            });

            if (hasChange) {
                setTimeout(() => {
                    triggerProCelebration();
                }, 300);
            }
            return newHabits;
        });
    };


    const handleGenerateCode = async (type: 'year' | 'lifetime' | '6months', maxUses: number = 1): Promise<string> => {
        if (!user || !isAdmin) { alert("Admin only."); return ''; }

        let prefix = 'PRO';
        if (type === 'lifetime') prefix += '-LIFE';
        if (type === 'year') prefix += '-YEAR';
        if (type === '6months') prefix += '-6MON';

        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const code = `${prefix}-${randomStr}`;

        try {
            await supabase.from('promoCodes').upsert({
                code,
                duration: type,
                maxUses: maxUses,
                usageCount: 0,
                redeemedBy: [],
                used: false,
                createdAt: new Date().toISOString(),
                createdBy: user.email
            });
            return code;
        } catch (e: any) {
            console.error("Code Generation Failed:", e);
            alert(`Error: ${e.message}`);
            return '';
        }
    };

    const handleExport = () => {
        try {
            const data = {
                version: 1,
                timestamp: new Date().toISOString(),
                habits: habits,
                settings: {
                    displayOptions,
                    themeId: currentTheme.id,
                    accentColor,
                    aiSuggestionCount,
                    language
                }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `habitai-backup-${getLocalDateString()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export error");
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                if (!json.habits || !Array.isArray(json.habits)) {
                    throw new Error("Invalid file format");
                }

                if (window.confirm(language === 'ru' ? `Найдено ${json.habits.length} привычек. Заменить текущие данные?` : `Found ${json.habits.length} habits. Replace current data?`)) {
                    setHabits(json.habits);
                    if (json.settings) {
                        if (json.settings.displayOptions) setDisplayOptions(json.settings.displayOptions);
                        if (json.settings.themeId) {
                            const th = THEMES.find(t => t.id === json.settings.themeId);
                            if (th) setTheme(th);
                        }
                        if (json.settings.accentColor !== undefined) setAccentColor(json.settings.accentColor);
                        if (json.settings.aiSuggestionCount) setAiSuggestionCount(json.settings.aiSuggestionCount);
                        if (json.settings.language) setLanguage(json.settings.language);
                    }
                    alert(language === 'ru' ? "Данные восстановлены!" : "Data restored!");
                    setIsSettingsModalOpen(false);
                }
            } catch (e: any) {
                console.error("Import error", e);
                alert(`Import error: ${e.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    if (authLoading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Aurora Animated Background */}
            <Aurora
                colors={['#4285f4', '#ea4335', '#34a853']}
                speed={5}
                blur={100}
                opacity={0.7}
            />

            {/* Mesh gradient overlay for richness */}
            <div className="mesh-gradient-bg !opacity-40" />

            {/* Branding - SplitText Animation */}
            <div className="relative z-10 flex flex-col items-center gap-16">
                <div className="relative group">
                    <h1 className="text-7xl font-black tracking-[-0.08em] text-transparent bg-clip-text bg-[length:200%_auto] animate-gradient-rotate bg-gradient-to-r from-[#4285f4] via-[#ea4335] via-[#fbbc05] via-[#34a853] to-[#4285f4]">
                        <SplitText
                            text="HabitAI"
                            splitBy="chars"
                            animation="blurIn"
                            delay={80}
                            duration={600}
                            startOnView={false}
                        />
                    </h1>
                    {/* Glowing Aura for depth */}
                    <h1 className="absolute inset-0 text-7xl font-black tracking-[-0.08em] text-white/10 blur-[40px] select-none -z-10 animate-pulse-slow">
                        HabitAI
                    </h1>
                </div>

                {/* Dynamic Progress Bar */}
                <div className="flex flex-col items-center gap-4 animate-slideUp">
                    <div className="h-[3px] w-64 rounded-full bg-white/10 overflow-hidden relative shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                        <div
                            className="h-full bg-white transition-all duration-200 ease-linear shadow-[0_0_20px_rgba(255,255,255,1)]"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Animated Watermark */}
            <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-center opacity-30">
                <SplitText
                    text="INTELLIGENT SYSTEMS"
                    splitBy="chars"
                    animation="fadeUp"
                    delay={40}
                    initialDelay={400}
                    duration={500}
                    startOnView={false}
                    className="text-[9px] font-black uppercase tracking-[0.5em] text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
            </div>
        </div>
    );
    if (!user) return <LoginScreen onLogin={handleLogin} onEmailLogin={handleEmailLogin} language={language} />;

    if (showOnboarding) {
        return (
            <OnboardingScreen
                language={language}
                accentColor={accentColor || '#7c3aed'}
                onComplete={(identities, habitNames) => {
                    const newHabits: Habit[] = [];
                    if (habitNames.length > 0) {
                        habitNames.forEach((name, i) => {
                            newHabits.push({
                                id: generateId(),
                                type: 'habit' as const,
                                name,
                                description: '',
                                color: ['#7c3aed', '#4ade80', '#60a5fa', '#f97316', '#a78bfa'][i % 5],
                                icon: 'Star',
                                category: language === 'ru' ? 'Другое' : 'Other',
                                frequency: 'daily' as const,
                                frequencyDays: [],
                                targetCount: 1,
                                completedDates: [],
                                createdAt: new Date().toISOString(),
                                archived: false,
                            });
                        });
                    }

                    // Авто-подключение аппаратного шагомера: привычка «Шаги» создаётся сразу,
                    // если пользователь не выбрал её сам на онбординге. useStepTracker и
                    // HarveeFitnessCard находят её по ключевым словам (шаг/ходьба/walk/step).
                    const isStepHabit = (n: string) => {
                        const l = n.toLowerCase();
                        return l.includes('шаг') || l.includes('ходьб') || l.includes('walk') || l.includes('step');
                    };
                    const hasStepHabit = habitNames.some(isStepHabit);
                    if (!hasStepHabit) {
                        newHabits.push({
                            id: generateId(),
                            type: 'habit' as const,
                            name: language === 'ru' ? 'Шаги (авто-датчик)' : 'Steps (auto-sensor)',
                            description: language === 'ru'
                                ? 'Автоматически считается датчиком движения смартфона. Цель: 10 000 шагов в день.'
                                : 'Automatically tracked by your phone motion sensor. Goal: 10,000 steps a day.',
                            color: '#10b981',
                            icon: 'Footprints',
                            category: 'health',
                            frequency: 'daily' as const,
                            frequencyDays: [],
                            targetCount: 10000,
                            dailyUnit: language === 'ru' ? 'шагов' : 'steps',
                            completedDates: [],
                            createdAt: new Date().toISOString(),
                            archived: false,
                        });
                    }

                    if (newHabits.length > 0) {
                        setHabits(prev => [...prev, ...newHabits]);
                    }
                    localStorage.setItem('onboarding_done', 'true');
                    setShowOnboarding(false);
                }}
            />
        );
    }

    const t = translations[language].app;

    // --- Kanban Handlers ---
    const handleKanbanMove = (habitId: string, overColumnId: string) => {
        handleUpdateHabit(habitId, { columnId: overColumnId });
    };

    const handleAddColumn = () => {
        const newCol: KanbanColumn = {
            id: generateId(),
            title: language === 'ru' ? 'Новая колонка' : 'New Column',
            order: kanbanColumns.length,
            color: AVAILABLE_COLORS[kanbanColumns.length % AVAILABLE_COLORS.length]
        };
        setKanbanColumns([...kanbanColumns, newCol]);
    };

    const handleEditColumn = (id: string) => {
        const col = kanbanColumns.find(c => c.id === id);
        if (!col) return;
        const newName = prompt(language === 'ru' ? 'Название колонки:' : 'Column Name:', col.title);
        if (newName) {
            setKanbanColumns(cols => cols.map(c => c.id === id ? { ...c, title: newName } : c));
        }
    };

    const handleDeleteColumn = (id: string) => {
        if (confirm(language === 'ru' ? 'Удалить колонку?' : 'Delete column?')) {
            setKanbanColumns(cols => cols.filter(c => c.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-background text-textPrimary pb-24 sm:pb-8 transition-colors duration-500 w-full flex flex-col overflow-x-hidden relative">

            {/* Dynamic Background Layer for Liquid Glass Refraction */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-500 bg-background mix-blend-screen opacity-50 dark:opacity-20">
                {/* Floating Orbs for "Liquid/Glow" effect under frosted glass */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-brand rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
            </div>

            <div className={`w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6 flex-1 flex flex-col relative z-10 
                 ${isCapacitorNative ? 'pt-safe-top pb-safe-bottom' : ''}
            `}>

                {/* Header Area - Glass-enhanced in dark mode */}
                <header className="flex items-center justify-between sticky top-0 z-10 py-4 transition-all w-full dark:bg-transparent dark:backdrop-blur-2xl dark:border-b dark:border-white/5 bg-background/80 backdrop-blur-md" style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-purple-400 flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
                            <Check className="text-white" size={24} strokeWidth={4} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-textPrimary leading-none">HabitAi</h1>
                            {user && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand/10 rounded-md border border-brand/20">
                                        <Star size={10} className="text-brand fill-brand" />
                                        <span className="text-[10px] font-bold text-brand uppercase">Lvl {userRewards.level}</span>
                                    </div>
                                    <div className="h-1 w-12 bg-surfaceHighlight rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand transition-all duration-500"
                                            style={{ width: `${getXPProgress(userRewards.totalXP).progress * 100}%` }}
                                        />
                                    </div>
                                    <RotatingText
                                        texts={language === 'ru'
                                            ? ['делай привычки ✨', 'будь лучше 🚀', 'не сдавайся 💪', 'ты молодец 🎯']
                                            : ['build habits ✨', 'be better 🚀', 'keep going 💪', 'you rock 🎯']}
                                        rotationInterval={3000}
                                        staggerDuration={0.02}
                                        staggerFrom="first"
                                        splitBy="characters"
                                        mainClassName="text-[10px] font-bold text-textSecondary/60 overflow-hidden h-4"
                                        transition={motionControl}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all 
                    ${saveStatus === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                    saveStatus === 'offline' ? 'bg-orange-500/10 border-orange-500/30' :
                                        'bg-surfaceHighlight/50 border-borderSubtle'}`}
                        >
                            {saveStatus === 'saving' ? (
                                <RotateCcw size={14} className="animate-spin text-textSecondary" />
                            ) : saveStatus === 'error' ? (
                                <AlertCircle size={14} className="text-red-500" />
                            ) : saveStatus === 'offline' ? (
                                <WifiOff size={14} className="text-orange-500" />
                            ) : (
                                <Cloud size={14} className="text-brand" />
                            )}
                        </div>

                        {/* AI Коуч — единый вход в быстром ряду HomeTab (анти-дубль) */}
                        <button
                            onClick={() => { setEditingHabit(null); setIsAddModalOpen(true); }}
                            className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center hover:opacity-90 active:scale-90 transition-all shadow-md shadow-brand/30"
                        >
                            <Plus size={22} />
                        </button>
                    </div>
                </header>

                {activeTab === 'home' && (
                    <>

                        <HomeTab
                        habits={habits}
                        activeHabits={activeHabits}
                        todaysTasks={todaysTasks}
                        overdueTasks={overdueTasks}
                        goals={goals}
                        userRewards={userRewards}
                        activeIdentity={activeIdentity}
                        reflectionEntries={reflectionEntries}
                        savedAiInsights={savedAiInsights}
                        deepAnalysisHistory={deepAnalysisHistory}
                        user={user}
                        analysis={analysis}
                        isAnalyzing={isAnalyzing}
                        aiSectionTab={aiSectionTab}
                        insightSaved={insightSaved}
                        language={language}
                        viewMode={viewMode}
                        accentColor={accentColor}
                        calendarStyle={calendarStyle}
                        timeFocusMode={timeFocusMode}
                        currentTime={currentTime}
                        isPro={isPro}
                        dataLoading={dataLoading}
                        notificationsEnabled={notificationsEnabled}
                        kanbanColumns={kanbanColumns}
                        kanbanTasks={kanbanTasks}
                        selectedDate={selectedDate}
                        selectedDateStr={selectedDateStr}
                        activeTagFilter={activeTagFilter}
                        justCompletedId={justCompletedId}
                        setActiveTagFilter={setActiveTagFilter}
                        setViewMode={setViewMode}
                        setAiSectionTab={setAiSectionTab}
                        setSelectedDate={setSelectedDate}
                        setSelectedHabit={setSelectedHabit}
                        setHabits={setHabits}
                        toggleDate={toggleDate}
                        handleToggleDate={handleToggleDate}
                        handleUpdateHabit={handleUpdateHabit}
                        handleBatchUpdateHabits={handleBatchUpdateHabits}
                        handleMoveToToday={handleMoveToToday}
                        handleAnalyze={handleAnalyze}
                        handleSaveAIInsight={handleSaveAIInsight}
                        handleSaveDeepAnalysis={handleSaveDeepAnalysis}
                        setAnalysis={setAnalysis}
                        aiSuggestionCount={aiSuggestionCount}
                        setIsRewardsModalOpen={setIsRewardsModalOpen}
                        setIsMindMovieOpen={setIsMindMovieOpen}
                    setIsAICoachOpen={setIsAICoachOpen}
                        setIsVoiceAssistantOpen={setIsVoiceAssistantOpen}
                        onOpenWealthDashboard={() => setIsWealthDashboardOpen(true)}
                        onOpenAIGoalChain={() => handleOpenAIGoalChain()}
                        vaultData={vaultData}
                        setIsAIReflectionOpen={setIsAIReflectionOpen}
                        setIsEveningReviewOpen={setIsEveningReviewOpen}
                        setIsActivityModalOpen={setIsActivityModalOpen}
                        setIsGoalsModalOpen={setIsGoalsModalOpen}
                        setIsAddModalOpen={setIsAddModalOpen}
                        setIsActivityRingsModalOpen={setIsActivityRingsModalOpen}
                        handleAddColumn={handleAddColumn}
                        handleEditColumn={handleEditColumn}
                        handleDeleteColumn={handleDeleteColumn}
                        t={t}
                        engines={engines}
                    />
                    </>
                )}


                {/* Cached tabs: use display:none instead of unmount to preserve state/images */}
                <div key="tab-calendar" className="flex-1 flex flex-col min-h-0" style={{ display: activeTab === 'calendar' ? 'flex' : 'none' }}>
                    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>}>
                        <AdvancedCalendar
                            habits={habits}
                            onToggleHabit={(id, d, e) => toggleDate(id, d, e)}
                            language={language}
                            onUpdateHabit={handleUpdateHabit}
                            onBatchUpdateHabits={handleBatchUpdateHabits}
                        />
                    </Suspense>
                </div>

                <div key="tab-stats" style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
                    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>}>
                        <StatsTab
                            habits={habits}
                            activeHabits={activeHabits}
                            goals={goals}
                            language={language}
                            accentColor={accentColor}
                            deepAnalysisHistory={deepAnalysisHistory}
                            onSaveDeepAnalysis={handleSaveDeepAnalysis}
                            habitConnections={habitConnections}
                            setHabitConnections={setHabitConnections}
                            graphPositions={graphPositions}
                            setGraphPositions={setGraphPositions}
                            onHabitClick={(h) => setSelectedHabit(h)}
                            onGoalClick={() => setIsGoalsModalOpen(true)}
                        />
                    </Suspense>
                </div>

                <div key="tab-community" style={{ display: activeTab === 'community' ? 'block' : 'none' }}>
                    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>}>
                        <LeaderboardView
                            currentUser={user}
                            isPublic={isPublicProfile}
                            onTogglePublic={setIsPublicProfile}
                            language={language}
                        />
                    </Suspense>
                </div>

            </div>

            {/* Bottom Navigation - LiquidDock Zerion Style */}
            <LiquidDock
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onFocusPress={() => setIsFocusModeOpen(true)}
                setIsSettingsOpen={setIsSettingsModalOpen}
                onRewardsOpen={() => setIsRewardsModalOpen(true)}
                onMindMovieOpen={() => setIsMindMovieOpen(true)}
                onVoiceAssistantOpen={() => setIsVoiceAssistantOpen(true)}
                isPro={isPro}
                language={language}
            />

            <ModalManager
                user={user}
                isPro={isPro}
                proExpiry={proExpiry}
                isAdmin={isAdmin}
                habits={habits}
                activeHabits={activeHabits}
                archivedHabits={archivedHabits}
                goals={goals}
                userRewards={userRewards}
                userIdentities={userIdentities}
                activeIdentityId={activeIdentityId}
                activeIdentity={activeIdentity}
                reflectionEntries={reflectionEntries}
                reflectionSessions={reflectionSessions}
                vaultData={vaultData}
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                language={language}
                currentTheme={currentTheme}
                displayOptions={displayOptions}
                accentColor={accentColor}
                aiSuggestionCount={aiSuggestionCount}
                voiceId={voiceId}
                isWakeWordEnabled={isWakeWordEnabled}
                defaultCurrency={defaultCurrency}
                soundPack={soundPack}
                timeFocusMode={timeFocusMode}
                notificationsEnabled={notificationsEnabled}
                morningBriefingTime={morningBriefingTime}
                calendarStyle={calendarStyle}
                avatarType={avatarType}
                avatarValue={avatarValue}
                gender={gender}
                viewMode={viewMode}
                isAddModalOpen={isAddModalOpen}
                isAIModalOpen={isAIModalOpen}
                isSettingsModalOpen={isSettingsModalOpen}
                isArchiveOpen={isArchiveOpen}
                isVoiceAssistantOpen={isVoiceAssistantOpen}
                isFeedbackModalOpen={isFeedbackModalOpen}
                isFeedbackListModalOpen={isFeedbackListModalOpen}
                isActivityModalOpen={isActivityModalOpen}
                isFocusModeOpen={isFocusModeOpen}
                isRewardsModalOpen={isRewardsModalOpen}
                isMindMovieOpen={isMindMovieOpen}
                isDailyInterruptOpen={isDailyInterruptOpen}
                isEveningReviewOpen={isEveningReviewOpen}
                isAIReflectionOpen={isAIReflectionOpen}
                isReflectionHistoryOpen={isReflectionHistoryOpen}
                isGoalsModalOpen={isGoalsModalOpen}
                onOpenAIGoalChain={handleOpenAIGoalChain}
                isMorningRitualOpen={isMorningRitualOpen}
                isVaultOpen={isVaultOpen}
                isActivityRingsModalOpen={isActivityRingsModalOpen}
                milestoneCelebration={milestoneCelebration}
                identityCelebration={identityCelebration}
                focusInitialContext={focusInitialContext}
                selectedHabit={selectedHabit}
                editingHabit={editingHabit}
                setIsAddModalOpen={setIsAddModalOpen}
                setIsAIModalOpen={setIsAIModalOpen}
                setIsSettingsModalOpen={setIsSettingsModalOpen}
                setIsArchiveOpen={setIsArchiveOpen}
                setIsVoiceAssistantOpen={setIsVoiceAssistantOpen}
                setIsFeedbackModalOpen={setIsFeedbackModalOpen}
                setIsFeedbackListModalOpen={setIsFeedbackListModalOpen}
                setIsActivityModalOpen={setIsActivityModalOpen}
                setIsFocusModeOpen={setIsFocusModeOpen}
                setIsRewardsModalOpen={setIsRewardsModalOpen}
                setIsMindMovieOpen={setIsMindMovieOpen}
                setIsDailyInterruptOpen={setIsDailyInterruptOpen}
                setIsEveningReviewOpen={setIsEveningReviewOpen}
                setIsAIReflectionOpen={setIsAIReflectionOpen}
                setIsReflectionHistoryOpen={setIsReflectionHistoryOpen}
                setIsGoalsModalOpen={setIsGoalsModalOpen}
                setIsMorningRitualOpen={setIsMorningRitualOpen}
                setIsVaultOpen={setIsVaultOpen}
                setIsActivityRingsModalOpen={setIsActivityRingsModalOpen}
                setMilestoneCelebration={setMilestoneCelebration}
                setIdentityCelebration={setIdentityCelebration}
                setFocusInitialContext={setFocusInitialContext}
                setSelectedHabit={setSelectedHabit}
                setEditingHabit={setEditingHabit}
                handleSaveHabit={handleSaveHabit}
                handleUpdateHabit={handleUpdateHabit}
                handleBatchUpdateHabits={handleBatchUpdateHabits}
                toggleDate={toggleDate}
                handleToggleDate={handleToggleDate}
                handleMarkAllDone={handleMarkAllDone}
                handleVoiceArchive={handleVoiceArchive}
                handleVoiceRequestFocus={handleVoiceRequestFocus}
                deleteHabit={deleteHabit}
                archiveHabit={archiveHabit}
                handleExport={handleExport}
                handleImport={handleImport}
                handleLogout={handleLogout}
                handleRedeemCode={handleRedeemCode}
                handleGenerateCode={handleGenerateCode}
                handleSaveGoal={handleSaveGoal}
                handleDeleteGoal={handleDeleteGoal}
                handleSaveReflection={handleSaveReflection}
                handleSaveFullReflectionSession={handleSaveFullReflectionSession}
                handleUpdateVault={handleUpdateVault}
                handleUseStreakSaver={handleUseStreakSaver}
                countIdentityProofs={countIdentityProofs}
                setDisplayOptions={setDisplayOptions}
                setTheme={setTheme}
                setAccentColor={setAccentColor}
                setAiSuggestionCount={setAiSuggestionCount}
                setLanguage={setLanguage}
                setVoiceId={setVoiceId}
                setIsWakeWordEnabled={setIsWakeWordEnabled}
                setDefaultCurrency={setDefaultCurrency}
                setSoundPack={setSoundPack}
                setTimeFocusMode={setTimeFocusMode}
                setNotificationsEnabled={setNotificationsEnabled}
                setMorningBriefingTime={setMorningBriefingTime}
                setCalendarStyle={setCalendarStyle}
                setAvatar={setAvatar}
                setGender={setGender}
                setViewMode={setViewMode}
                setIsPublicProfile={setIsPublicProfile}
                setUserIdentity={setUserIdentity}
                deleteUserIdentity={deleteUserIdentity}
                setActiveIdentity={setActiveIdentity}
                onShowOnboarding={() => setShowOnboarding(true)}
                t={t}
            />

            {/* Wealth & AI Goal Chain Modals */}
            <WealthDashboard
                isOpen={isWealthDashboardOpen}
                onClose={() => setIsWealthDashboardOpen(false)}
                vaultData={vaultData}
                onUpdateVault={handleUpdateVault}
                language={language}
                currency={defaultCurrency}
            />

            <AIGoalChainModal
                isOpen={isAIGoalChainOpen}
                onClose={() => setIsAIGoalChainOpen(false)}
                initialGoalTitle={aiGoalChainTitle}
                habits={habits}
                totalCapital={(vaultData?.assets || []).reduce((s: number, a: any) => s + (a.amount || 1) * (a.currentPrice || a.buyPrice || 0), 0)}
                language={language}
            />

            {/* AI Coach Modal */}
            <Suspense fallback={null}>
                <AICoachModal
                    isOpen={isAICoachOpen}
                    onClose={() => setIsAICoachOpen(false)}
                    habits={habits}
                    language={language}
                    isPro={isPro}
                />
            </Suspense>

            {/* ── UPDATE BANNER (показывается когда новая версия доступна) ── */}
            <UpdateBanner
                show={appUpdate.showUpdate}
                isUpdating={appUpdate.isUpdating}
                language={language}
                onUpdate={appUpdate.applyUpdate}
                onDismiss={appUpdate.dismissUpdate}
            />

        </div>

    );
};

export default App;
