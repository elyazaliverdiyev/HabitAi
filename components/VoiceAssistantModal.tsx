
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Sparkles, Volume2, Command, Palette, CheckCircle2, BarChart3, Plus, ChevronDown, Check, Settings } from 'lucide-react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Habit, COLOR_PALETTE, ICON_CATEGORIES, AVAILABLE_COLORS, CATEGORIES, getAccentGradient, TAG_PRESETS } from '../types';
import { translations } from '../translations';

import { playSound } from '../utils/sound';

// Reflection Entry interface
export interface ReflectionEntry {
    id: string;
    date: string;
    question: string;
    answer: string;
    category?: string;
}

// --- Audio Utils ---


// Downsample from device rate (e.g. 44.1k/48k) to 16k for Gemini
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number = 16000) {
    if (outputRate >= inputRate) return buffer;
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        // Average the samples to prevent aliasing
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

function floatTo16BitPCM(input: Float32Array) {
    let output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function base64EncodeAudio(float32Array: Float32Array) {
    const int16Array = floatTo16BitPCM(float32Array);
    const chars = [];
    const bytes = new Uint8Array(int16Array.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        chars.push(String.fromCharCode(bytes[i]));
    }
    return btoa(chars.join(''));
}

function decodeAudio(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get random item
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to capitalize first letter
const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper to generate context string from habit list
const generateHabitsContext = (habits: Habit[], language: 'ru' | 'en') => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const dayOfWeek = today.getDay(); // 0 = Sun

    // Filter out archived and completed tasks (one-time tasks that are done)
    const activeHabits = habits.filter(h => {
        if (h.archived) return false;
        // Hide completed one-time tasks
        if (h.type === 'task' && h.date && h.completedDates.includes(h.date)) return false;
        return true;
    });

    if (activeHabits.length === 0) return { text: language === 'ru' ? "Список пуст." : "List is empty.", stats: { tasksToday: 0, habitsToday: 0 } };

    const pendingToday: string[] = [];
    const completedToday: string[] = [];
    const otherItems: string[] = [];
    let tasksTodayCount = 0;
    let habitsTodayCount = 0;

    activeHabits.forEach(h => {
        if (h.archived) return;

        const isTask = h.type === 'task';
        let isForToday = false;

        // Determine if item is relevant for TODAY
        if (isTask) {
            isForToday = h.date === todayStr;
        } else {
            // Habit logic
            if (h.frequency === 'daily') isForToday = true;
            else if (h.frequency === 'weekly') isForToday = dayOfWeek === 1;
            else if (h.frequency === 'specific_days') isForToday = (h.frequencyDays || []).includes(dayOfWeek);
            else if (h.frequency === 'monthly') isForToday = today.getDate() === 1;
        }

        const targetDate = isTask ? h.date : todayStr;
        const isDone = h.completedDates.includes(isTask ? (h.date || todayStr) : todayStr);

        const typeLabel = isTask
            ? (language === 'ru' ? '[ЗАДАЧА]' : '[TASK]')
            : (language === 'ru' ? '[ПРИВЫЧКА]' : '[HABIT]');

        const timeInfo = h.time ? `@ ${h.time}` : '';
        const status = isDone
            ? (language === 'ru' ? '✅ ВЫПОЛНЕНО' : '✅ DONE')
            : (language === 'ru' ? '⬜ ОЖИДАЕТ' : '⬜ PENDING');
        const extraInfo = isTask ? (h.date ? `(${h.date})` : '') : `(${h.frequency})`;

        // Include cost if present
        const costInfo = h.cost && Number(h.cost) > 0 ? ` 💰$${h.cost}` : '';

        // Include ID for precise updates
        const idInfo = `[id:${h.id.substring(0, 8)}]`;

        // Book Context
        let bookInfo = "";
        if (h.extension?.type === 'reading' && h.extension.data.books) {
            const activeBook = h.extension.data.books.find(b => b.status === 'reading');
            if (activeBook) {
                bookInfo = ` [READING: "${activeBook.title}" p.${activeBook.currentPage}/${activeBook.totalPages}]`;
            }
        }

        // Include tags if present
        const tagsInfo = h.tags && h.tags.length > 0 ? ` [tags: ${h.tags.join(', ')}]` : '';

        const line = `- ${idInfo} ${typeLabel} "${h.name}" ${timeInfo} ${extraInfo}${costInfo}${bookInfo}${tagsInfo} \u2192 ${status}`;

        if (isForToday) {
            if (isDone) {
                completedToday.push(line);
            } else {
                pendingToday.push(line);
            }
            if (isTask) tasksTodayCount++;
            else habitsTodayCount++;
        } else {
            otherItems.push(line);
        }
    });

    // Sort by time
    const sortByTime = (a: string, b: string) => {
        const timeA = a.match(/@ (\d{2}:\d{2})/) ? a.match(/@ (\d{2}:\d{2})/)![1] : '23:59';
        const timeB = b.match(/@ (\d{2}:\d{2})/) ? b.match(/@ (\d{2}:\d{2})/)![1] : '23:59';
        return timeA.localeCompare(timeB);
    };
    pendingToday.sort(sortByTime);
    completedToday.sort(sortByTime);

    const headerPending = language === 'ru'
        ? `=== ⬜ НЕВЫПОЛНЕННЫЕ СЕГОДНЯ (${todayStr}) ===`
        : `=== ⬜ PENDING TODAY (${todayStr}) ===`;
    const headerCompleted = language === 'ru'
        ? `=== ✅ ВЫПОЛНЕННЫЕ СЕГОДНЯ ===`
        : `=== ✅ COMPLETED TODAY ===`;
    const headerOther = language === 'ru'
        ? `=== ДРУГИЕ / ПРЕДСТОЯЩИЕ ===`
        : `=== OTHER / UPCOMING ===`;

    let result = `${headerPending}\n`;
    result += pendingToday.length > 0
        ? pendingToday.join('\n')
        : (language === 'ru' ? "(Всё выполнено! 🎉)" : "(All done! 🎉)");

    result += `\n\n${headerCompleted}\n`;
    result += completedToday.length > 0
        ? completedToday.join('\n')
        : (language === 'ru' ? "(Пока ничего)" : "(Nothing yet)");

    if (otherItems.length > 0) {
        result += `\n\n${headerOther}\n`;
        result += otherItems.join('\n');
    }

    // === CHAINS (tag-based groupings) ===
    const tagGroups: Record<string, string[]> = {};
    habits.filter(h => !h.archived && h.type !== 'task' && h.tags && h.tags.length > 0).forEach(h => {
        h.tags!.forEach(tag => {
            if (!tagGroups[tag]) tagGroups[tag] = [];
            tagGroups[tag].push(h.name);
        });
    });
    const chains = Object.entries(tagGroups).filter(([, names]) => names.length >= 2);
    if (chains.length > 0) {
        result += `\n\n${language === 'ru' ? '=== \u{1F517} \u0426\u0415\u041F\u041E\u0427\u041A\u0418 \u041F\u0420\u0418\u0412\u042B\u0427\u0415\u041A ===' : '=== \u{1F517} HABIT CHAINS ==='}\n`;
        chains.forEach(([tag, names]) => {
            result += `- "${tag}": ${names.join(' \u2192 ')}\n`;
        });
    }

    // === AVAILABLE TAGS ===
    const allTags = [...new Set(habits.filter(h => !h.archived && h.tags).flatMap(h => h.tags!))];
    if (allTags.length > 0) {
        result += `\n\n${language === 'ru' ? '=== \u{1F3F7}\uFE0F \u0418\u0421\u041F\u041E\u041B\u042C\u0417\u0423\u0415\u041C\u042B\u0415 \u0422\u0415\u0413\u0418 ===' : '=== \u{1F3F7}\uFE0F ACTIVE TAGS ==='}\n`;
        result += allTags.join(', ');
    }

    return { text: result, stats: { tasksToday: tasksTodayCount, habitsToday: habitsTodayCount } };
};

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateHabit: (habit: Partial<Habit>) => void;
    onUpdateHabit: (id: string, updates: Partial<Habit>) => void;
    onBatchUpdateHabits: (updates: { id: string, data: Partial<Habit> }[]) => void;
    onToggleHabit: (id: string, date: string) => void;
    onMarkAll: () => void;
    onArchiveHabit: (id: string) => void;
    onRequestFocus?: (energy: number, time: number) => void;
    onStartPomodoro?: (habitId: string, minutes?: number) => void;
    // NEW: Settings & Navigation
    onNavigateTo?: (screen: 'home' | 'calendar' | 'settings' | 'activity' | 'expenses' | 'graph') => void;
    onUpdateSettings?: (settings: {
        theme?: string;
        language?: 'ru' | 'en';
        timeFocusMode?: boolean;
        accentColor?: string;
        isWakeWordEnabled?: boolean;
    }) => void;
    currentSettings?: {
        theme: string;
        language: 'ru' | 'en';
        timeFocusMode: boolean;
        accentColor: string;
        isWakeWordEnabled: boolean;
    };
    habits: Habit[];
    reflections?: ReflectionEntry[];
    language?: 'ru' | 'en';
    voiceId?: string;
    defaultCurrency?: string;
}

// --- VAD CONFIGURATION ---
const VAD_THRESHOLD = 0.005;
const VAD_HANGOVER_MS = 600;

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
    isOpen, onClose, onCreateHabit, onUpdateHabit, onBatchUpdateHabits, onToggleHabit, onMarkAll, onArchiveHabit, onRequestFocus, onStartPomodoro, onNavigateTo, onUpdateSettings, currentSettings, habits, reflections = [], language = 'ru', voiceId = 'Puck', defaultCurrency = 'USD'
}) => {
    const t = translations[language].voice;
    const accent = getAccentGradient(currentSettings?.accentColor || null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    // Refs for session management
    const sessionRef = useRef<Promise<any> | null>(null);
    const isConnected = useRef(false);

    const nextStartTimeRef = useRef<number>(0);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const isSessionActive = useRef(false);

    // VAD Refs
    const lastSpeechTimeRef = useRef<number>(0);
    const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs for callbacks & data
    const onCreateHabitRef = useRef(onCreateHabit);
    const onUpdateHabitRef = useRef(onUpdateHabit);
    const onBatchUpdateHabitsRef = useRef(onBatchUpdateHabits);
    const onToggleHabitRef = useRef(onToggleHabit);
    const onMarkAllRef = useRef(onMarkAll);
    const onArchiveHabitRef = useRef(onArchiveHabit);
    const onRequestFocusRef = useRef(onRequestFocus);
    const onStartPomodoroRef = useRef(onStartPomodoro);
    const habitsRef = useRef(habits);
    const onCloseRef = useRef(onClose);
    const pendingActionRef = useRef<(() => void) | null>(null);

    // Debounce ref to prevent duplicate tool calls
    const recentToolCallsRef = useRef<Set<string>>(new Set());
    const toolCallDebounceMs = 2000; // 2 seconds debounce

    useEffect(() => {
        onCreateHabitRef.current = onCreateHabit;
        onUpdateHabitRef.current = onUpdateHabit;
        onBatchUpdateHabitsRef.current = onBatchUpdateHabits;
        onToggleHabitRef.current = onToggleHabit;
        onMarkAllRef.current = onMarkAll;
        onArchiveHabitRef.current = onArchiveHabit;
        onRequestFocusRef.current = onRequestFocus;
        onStartPomodoroRef.current = onStartPomodoro;
        onCloseRef.current = onClose;
        habitsRef.current = habits;
    }, [onCreateHabit, onUpdateHabit, onBatchUpdateHabits, onToggleHabit, onMarkAll, onArchiveHabit, onRequestFocus, onStartPomodoro, habits, onClose]);

    // Show visual feedback briefly
    const showActionFeedback = (text: string) => {
        setLastAction(text);
        setTimeout(() => setLastAction(null), 3000);
    };

    // Helper to calculate delay to let AI finish speaking
    const getCloseDelay = () => {
        const now = audioContextRef.current?.currentTime || 0;
        const remainingTime = Math.max(0, (nextStartTimeRef.current - now) * 1000);
        return Math.max(remainingTime + 400, 1000); // Slower buffer for natural feel
    };

    const executeAfterSpeech = (action: () => void) => {
        const now = audioContextRef.current?.currentTime || 0;
        const remainingTime = (nextStartTimeRef.current - now) * 1000;

        if (remainingTime <= 100) {
            // No speech pending, execute with aesthetic pause
            setTimeout(action, 800);
        } else {
            // Schedule for when speech ends
            pendingActionRef.current = action;
        }
    };

    const suggestions = language === 'ru' ? [
        { icon: Plus, text: "Напомни позвонить маме в 18:00", category: "План" },
        { icon: Palette, text: "Прочитал 20 страниц Грокаем", category: "Книги" },
        { icon: CheckCircle2, text: "Что у меня на сегодня?", category: "Обзор" },
        { icon: BarChart3, text: "Что мне поделать сейчас?", category: "ИИ" },
    ] : [
        { icon: Plus, text: "Remind me to call Mom at 6 PM", category: "Plan" },
        { icon: Palette, text: "Read 20 pages of Grokking", category: "Books" },
        { icon: CheckCircle2, text: "What's on for today?", category: "Overview" },
        { icon: BarChart3, text: "What should I focus on?", category: "AI" },
    ];

    const stopSession = async () => {
        isSessionActive.current = false;
        isConnected.current = false;

        if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);

        if (sessionRef.current) {
            try {
                const session = await sessionRef.current;
                if (session) session.close();
            } catch (e) { }
            sessionRef.current = null;
        }

        try {
            if (processorRef.current) {
                processorRef.current.onaudioprocess = null;
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current) {
                await audioContextRef.current.close().catch(() => { });
                audioContextRef.current = null;
            }
            if (inputContextRef.current) {
                await inputContextRef.current.close().catch(() => { });
                inputContextRef.current = null;
            }
        } catch (e) { console.error("Cleanup error", e); }

        setStatus('idle');
        setLastAction(null);
    };

    useEffect(() => {
        if (!isOpen) stopSession();
        else startSession();
        return () => { stopSession(); };
    }, [isOpen]);

    const startSession = async () => {
        if (isSessionActive.current) return;

        setStatus('connecting');
        setError(null);
        isSessionActive.current = true;
        isConnected.current = false;
        lastSpeechTimeRef.current = Date.now();

        try {
            // API Key - temporarily hardcoded until env issue is resolved
            // TODO: Revert to import.meta.env.VITE_GEMINI_API_KEY after confirming it works
            const apiKey = 'AIzaSyAG4obbjuZv_Vl__Ro48qAhYOJb3rVP6eo';

            if (!apiKey || apiKey.length < 20) throw new Error("API Key missing");

            console.log("Voice Assistant using API Key (last 4):", apiKey.slice(-4));

            // 1. MIC CHECK
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (micErr: any) {
                console.error("Mic Permission Error:", micErr);
                throw new Error(`Mic Error: ${micErr.message}`);
            }

            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey });

            // Input Context
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            await inputContextRef.current.resume();

            const source = inputContextRef.current.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            source.connect(processor);
            processor.connect(inputContextRef.current.destination);

            // Output Context (Don't enforce sampleRate in constructor to avoid browser errors, set it on buffer later)
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            await audioContextRef.current.resume();
            nextStartTimeRef.current = audioContextRef.current.currentTime;

            // --- TOOLS DEFINITION ---
            const createHabitTool = {
                name: 'createHabit',
                description: "Create a new Habit (recurring) or Task (one-off). IMPORTANT: You must infer the 'category' from the name if the user doesn't say it.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['habit', 'task'], description: "Use 'task' for one-off to-dos (e.g. 'Call Mom', 'Buy milk'), 'habit' for recurring goals (e.g. 'Run daily')." },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING, description: "Must pick one from: " + CATEGORIES.join(', ') + ". Infer intelligently (e.g., 'Run' -> 'Спорт')." },
                        frequency: { type: Type.STRING, enum: ['daily', 'weekly', 'monthly', 'specific_days'] },
                        date: { type: Type.STRING, description: "YYYY-MM-DD. Mandatory for 'task' type. Default to today if not specified." },
                        targetCount: { type: Type.NUMBER },
                        time: { type: Type.STRING, description: "HH:MM format (24h). Only if user specifies a time." },
                        place: { type: Type.STRING, description: "Where the habit will be done, e.g. 'в парке', 'на кухне', 'bedroom'. Implementation Intentions." },
                        duration: { type: Type.NUMBER },
                        icon: { type: Type.STRING, description: "Icon name or Emoji. MUST be inferred from context if not provided." },
                        color: { type: Type.STRING, description: "Hex Color. MUST be inferred from context if not provided." },
                        cost: { type: Type.NUMBER, description: "Cost/price if user mentions money in ANY currency. Extract the NUMBER only." },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags for categorization and habit chains. Auto-suggest relevant tags from presets or existing tags. Presets: " + TAG_PRESETS.map(t => t.emoji + t.label.ru).join(', ') },
                        quadrant: { type: Type.STRING, enum: ['do', 'schedule', 'delegate', 'delete'], description: "Eisenhower Matrix quadrant for TASKS only. Infer from urgency/importance: 'do' = urgent+important (deadline today, emergency), 'schedule' = important but not urgent (goals, learning), 'delegate' = urgent but not important (someone else can do), 'delete' = not urgent nor important (timewasters). ALWAYS set this for task type." }
                    },
                    required: ['name', 'type']
                }
            };

            const updateHabitTool = {
                name: 'updateHabit',
                description: "Update a SINGLE existing habit or task. Use this to: move tasks to different dates, change names, add/edit costs, update icons, colors, etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        currentName: { type: Type.STRING, description: "Current name of the habit/task to update" },
                        time: { type: Type.STRING },
                        newName: { type: Type.STRING },
                        category: { type: Type.STRING },
                        date: { type: Type.STRING, description: "YYYY-MM-DD. Use this to move a task to a different day." },
                        targetCount: { type: Type.NUMBER },
                        icon: { type: Type.STRING },
                        color: { type: Type.STRING },
                        place: { type: Type.STRING, description: "Where the habit will be done. Implementation Intentions." },
                        duration: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER, description: "Add or update cost/price. Set to 0 to remove cost." },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Set/update tags. Send full array to replace existing tags." },
                        quadrant: { type: Type.STRING, enum: ['do', 'schedule', 'delegate', 'delete'], description: "Move task to Eisenhower Matrix quadrant. 'do' = urgent+important, 'schedule' = important not urgent, 'delegate' = urgent not important, 'delete' = neither." }
                    },
                    required: ['currentName']
                }
            };

            const deleteHabitTool = {
                name: 'deleteHabit',
                description: "Archive/Delete a habit or task. CRITICAL: You MUST ask the user for confirmation (e.g., 'Are you sure?') verbally BEFORE calling this tool.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING }
                    },
                    required: ['habitName']
                }
            };

            const batchUpdateHabitsTool = {
                name: 'batchUpdateHabits',
                description: "Update MULTIPLE habits at once. Useful for scheduling (setting time), coloring, organizing, OR TRANSLATING/RENAMING multiple items.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        updates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    currentName: { type: Type.STRING },
                                    newName: { type: Type.STRING, description: "The NEW name for the habit (e.g. for renaming or translating)." },
                                    color: { type: Type.STRING },
                                    icon: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    time: { type: Type.STRING, description: "HH:MM 24h format" },
                                    place: { type: Type.STRING, description: "Where the habit will be done." },
                                    duration: { type: Type.NUMBER, description: "Minutes" },
                                    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags to set" }
                                },
                                required: ['currentName']
                            }
                        }
                    },
                    required: ['updates']
                }
            };

            const markHabitTool = {
                name: 'markHabit',
                description: "Mark habit/task as done/undone. Matches items loosely by name from the list. IMPORTANT: Use the EXACT name from the list.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING, description: "The name of the task or habit to check/uncheck." },
                        isCompleted: { type: Type.BOOLEAN },
                        date: { type: Type.STRING }
                    },
                    required: ['habitName']
                }
            };

            // NEW TOOL: Connect Voice to Focus Mode
            const suggestFocusTaskTool = {
                name: 'suggestFocusTask',
                description: "Suggest ONE best task based on user's state. Use when user asks 'What should I do?', 'I'm tired', 'I have 15 mins'. This opens the Focus Mode UI.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        energyLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: "Infer from voice tone and words (e.g., 'tired' -> low, 'ready' -> high)." },
                        availableMinutes: { type: Type.NUMBER, description: "Infer from user input or default to 30." }
                    },
                    required: ['energyLevel']
                }
            };

            // NEW TOOL: Track Book Progress
            const trackBookProgressTool = {
                name: 'trackBookProgress',
                description: "Update reading progress and/or add notes for a book. Handles phrases like 'I read 20 pages', 'I am on page 50', or 'Add note: this is a great book'.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        bookTitle: { type: Type.STRING, description: "Approximate title of the book or habit name." },
                        amount: { type: Type.NUMBER, description: "Number of pages read or new page number." },
                        isRelative: { type: Type.BOOLEAN, description: "True if user said 'read X pages' (add). False if 'on page X' (set)." },
                        notes: { type: Type.STRING, description: "Any key insights, quotes, or thoughts the user wants to save for this book." }
                    },
                    required: ['bookTitle']
                }
            };

            // NEW TOOL: Add Book
            const addBookTool = {
                name: 'addBook',
                description: "Add a NEW book to a reading habit. Use when user says 'add book Atomic Habits', 'I started reading War and Peace', etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING, description: "Name of the habit to add book to (optional - will find reading habit)" },
                        title: { type: Type.STRING },
                        author: { type: Type.STRING },
                        totalPages: { type: Type.NUMBER }
                    },
                    required: ['title']
                }
            };

            // NEW TOOL: Add Supplement
            const addSupplementTool = {
                name: 'addSupplement',
                description: "Add a new supplement/vitamin to a health habit. Use when user says 'add vitamin D', 'add omega 3 to my supplements', etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING, description: "Name of the habit to add supplement to (optional - will find health-related habit)" },
                        supplementName: { type: Type.STRING, description: "Name of the supplement (e.g., 'Vitamin D3', 'Omega-3')" },
                        dosage: { type: Type.STRING, description: "Dosage (e.g., '5000 IU', '500mg')" },
                        timing: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening', 'with_food', 'anytime'], description: "When to take it" },
                        frequency: { type: Type.STRING, enum: ['daily', 'twice_daily', 'every_other_day', 'weekly', 'monthly'], description: "How often to take it" }
                    },
                    required: ['supplementName']
                }
            };

            // NEW TOOL: Update Supplement
            const updateSupplementTool = {
                name: 'updateSupplement',
                description: "Update details for an existing supplement.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        supplementName: { type: Type.STRING, description: "Name of the supplement to update" },
                        dosage: { type: Type.STRING },
                        timing: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening', 'with_food', 'anytime'] },
                        frequency: { type: Type.STRING, enum: ['daily', 'twice_daily', 'every_other_day', 'weekly', 'monthly'] }
                    },
                    required: ['supplementName']
                }
            };

            // NEW TOOL: Mark Supplement as Taken
            const markSupplementTakenTool = {
                name: 'markSupplementTaken',
                description: "Mark a supplement as taken/not taken for today. Use when user says 'I took vitamin D', 'mark omega as taken', 'принял магний'.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        supplementName: { type: Type.STRING, description: "Name of the supplement" },
                        isTaken: { type: Type.BOOLEAN, description: "True to mark as taken, false to unmark" }
                    },
                    required: ['supplementName']
                }
            };

            const endSessionTool = {
                name: 'endSession',
                description: "Ends the voice session and closes the assistant dialog. Use this when the user says 'Stop', 'Goodbye', 'End', 'Exit', 'Close', 'Пока', 'Стоп', 'Заверши', 'Выход'.",
                parameters: { type: Type.OBJECT, properties: {} }
            };

            const startPomodoroTool = {
                name: 'startPomodoro',
                description: "Start a Pomodoro focus timer for a specific habit. Use when user says 'start timer for reading', 'помодоро для медитации', 'focus on running for 25 min', 'запусти таймер'. This will navigate to the habit and start the Pomodoro timer.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING, description: "Name of the habit to start Pomodoro for" },
                        minutes: { type: Type.NUMBER, description: "Timer duration in minutes. Default 25." }
                    },
                    required: ['habitName']
                }
            };

            const markAllHabitsTool = { name: 'markAllHabits', parameters: { type: Type.OBJECT, properties: {} } };
            const getPendingHabitsTool = { name: 'getPendingHabits', parameters: { type: Type.OBJECT, properties: {} } };
            const getHabitSummaryTool = { name: 'getHabitSummary', parameters: { type: Type.OBJECT, properties: {} } };

            // NEW TOOL: Add Skincare Product
            const addSkincareProductTool = {
                name: 'addSkincareProduct',
                description: "Add a new skincare product to a beauty/care habit. Use when user says 'add moisturizer', 'add SPF 50', etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        habitName: { type: Type.STRING, description: "Name of the habit to add product to (optional)" },
                        productName: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'mask', 'exfoliant', 'eye_cream', 'other'] },
                        routine: { type: Type.STRING, enum: ['morning', 'evening', 'both'], description: "AM/PM routine" },
                        frequency: { type: Type.STRING, enum: ['daily', 'every_other_day', 'weekly', 'twice_weekly'] }
                    },
                    required: ['productName']
                }
            };

            // NEW TOOL: Mark Skincare Used
            const markSkincareUsedTool = {
                name: 'markSkincareUsed',
                description: "Mark a skincare product as used. Use when user says 'applied cream', 'used serum', 'сделала маску'.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        routine: { type: Type.STRING, enum: ['morning', 'evening'], description: "Which routine session was it used in" },
                        isUsed: { type: Type.BOOLEAN, description: "True to mark as used, false to unmark" }
                    },
                    required: ['productName', 'routine']
                }
            };

            // === NEW TOOLS: Settings, Navigation, Stats, Advice ===

            const updateSettingsTool = {
                name: 'updateSettings',
                description: "Change app settings. Use for: theme ('dark'/'light'/'midnight'/'ocean'), language ('ru'/'en'), timeFocusMode (on/off), wakeWord (on/off).",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING, enum: ['Light', 'Dark', 'Midnight', 'Ocean', 'Sunset', 'Forest'], description: "Theme name" },
                        language: { type: Type.STRING, enum: ['ru', 'en'], description: "App language" },
                        timeFocusMode: { type: Type.BOOLEAN, description: "Enable/disable time-based focus highlighting" },
                        isWakeWordEnabled: { type: Type.BOOLEAN, description: "Enable/disable wake word activation" }
                    }
                }
            };

            const navigateToTool = {
                name: 'navigateTo',
                description: "Navigate to a specific screen in the app. Use when user says 'open calendar', 'go to settings', 'show expenses', etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        screen: {
                            type: Type.STRING,
                            enum: ['home', 'calendar', 'settings', 'activity', 'expenses', 'graph'],
                            description: "'home' = main habit list, 'calendar' = advanced calendar view, 'settings' = settings modal, 'activity' = stats/activity view, 'expenses' = expense tracking, 'graph' = habit connections graph"
                        }
                    },
                    required: ['screen']
                }
            };

            const getStatisticsTool = {
                name: 'getStatistics',
                description: "Get detailed statistics about habits and tasks. Returns completion rates, streaks, expense totals. Use when user asks 'how am I doing?', 'what's my streak?', 'how much did I spend?', etc.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        period: { type: Type.STRING, enum: ['today', 'week', 'month', 'all'], description: "Time period for stats" }
                    }
                }
            };

            const getAdviceTool = {
                name: 'getAdvice',
                description: "Provide personalized productivity advice based on user's habits. Use when user asks for tips, advice, or how to improve.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, enum: ['productivity', 'habits', 'schedule', 'motivation', 'general'], description: "Advice topic" }
                    }
                }
            };

            const translateCategoriesTool = {
                name: 'translateCategories',
                description: "Translate ALL habit categories to specified language. Also can rename habits to translate them.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        targetLanguage: { type: Type.STRING, enum: ['ru', 'en'], description: "Target language for translation" }
                    },
                    required: ['targetLanguage']
                }
            };

            const { text: initialHabitsContext, stats: habitStats } = generateHabitsContext(habitsRef.current, language as 'ru' | 'en');
            const langInstruction = language === 'ru' ? "Speak Russian." : "Speak English.";
            const todayDate = new Date();
            const currentDateStr = todayDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const currentTimeStr = todayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const todayISO = getLocalDateString();

            // Generate reflections context for AI coaching
            const generateReflectionsContext = () => {
                if (!reflections || reflections.length === 0) {
                    return language === 'ru' ? "(Пока нет записей рефлексий)" : "(No reflection entries yet)";
                }

                // Get last 5 reflections for context
                const recentReflections = reflections.slice(0, 5);
                const lines = recentReflections.map(r => {
                    const date = new Date(r.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
                    return `- [${date}] Q: "${r.question}" → A: "${r.answer.substring(0, 100)}${r.answer.length > 100 ? '...' : ''}"`;
                });
                return lines.join('\n');
            };

            const reflectionsContext = generateReflectionsContext();

            const systemInstruction = `
        You are 'HabitAi Voice', an intelligent Daily Planner, Habit Coach, and PERSONAL DEVELOPMENT COMPANION.
        ${langInstruction}
        
        YOUR ROLE:
        You are the user's companion on their journey of self-improvement and potential discovery.
        Think of yourself as a wise friend who helps unlock the user's full potential.
        
        CONTEXT:
        - Current Date: ${currentDateStr} (YYYY-MM-DD: ${todayISO})
        - Current Time: ${currentTimeStr}
        - User's Currency: ${defaultCurrency} (ALWAYS use this for any money/cost mentions)
        
        CHEAT SHEET SUMMARY:
        - TOTAL ACTIVE PLANS TODAY: ${habitStats.tasksToday + habitStats.habitsToday}
        - Tasks (One-off): ${habitStats.tasksToday}
        - Habits (Recurring): ${habitStats.habitsToday}
        
        EXISTING SCHEDULE:
        ${initialHabitsContext}
        
        USER'S RECENT REFLECTIONS (for deeper understanding):
        ${reflectionsContext}
        
        INSTRUCTIONS:
        1. **RESPONSE STYLE**:
           - ALWAYS respond IMMEDIATELY to user input. Never wait or hesitate.
           - Be proactive and helpful. Don't ask unnecessary clarifying questions.
           - Be concise but friendly.
        2. **READING THE SCHEDULE**: 
           - "=== ⬜ НЕВЫПОЛНЕННЫЕ СЕГОДНЯ ===" = PENDING tasks/habits for today
           - "=== ✅ ВЫПОЛНЕННЫЕ СЕГОДНЯ ===" = COMPLETED tasks/habits for today
           - Each item has [id:XXXXXXXX] — use this ID for precise updates
           - [ЗАДАЧА] = Task (One-off). [ПРИВЫЧКА] = Habit (Recurring)
           - 💰$XX shows cost/price of an item
        3. **CRITICAL: CREATE vs UPDATE**:
           - When user wants to ADD something NEW (new task, new price, new item) → ALWAYS use createHabit
           - When user wants to CHANGE an EXISTING item → use updateHabit with the correct ID
           - NEVER add cost to a COMPLETED task — create a new one instead!
           - If uncertain, prefer creating a new task over modifying existing ones
        4. **USER QUERIES**:
           - If user asks "What do I have today?", read items from PENDING section first
           - If user asks "Do I have any tasks?", refer to the CHEAT SHEET count
           - If user asks "What should I do?" → USE 'suggestFocusTask' tool
        5. **LIBRARY & READING**:
           - Add BOOKS (addBook) and track PROGRESS (trackBookProgress)
           - Save notes: trackBookProgress(bookTitle, notes: "...")
        6. **SUPPLEMENTS & HEALTH**:
           - addSupplement, updateSupplement, markSupplementTaken
        7. **SKINCARE & BEAUTY**:
           - addSkincareProduct, markSkincareUsed
        8. **CREATION with COSTS**:
           - When user mentions a price → EXTRACT the number and use 'cost' parameter
           - Examples: "40 dollars" → cost: 40, "100 рублей" → cost: 100
        9. **MOVING/SCHEDULING**:
           - "Move [Task] to tomorrow" → updateHabit with date="${todayISO}" + 1 day
         10. **EISENHOWER MATRIX**: When creating TASKS, ALWAYS assign a quadrant:
            - 'do' = Urgent + Important (has deadline today/tomorrow, emergency, critical)
            - 'schedule' = Important but Not Urgent (learning, goals, planning, health)
            - 'delegate' = Urgent but Not Important (can be done by someone else, routine errands)
            - 'delete' = Not Urgent, Not Important (low-value, time-wasters)
            - When user says "срочно/urgent/ASAP" → 'do'
            - When user says "когда-нибудь/someday/позже" → 'schedule' or 'delete'
            - If unsure, default to 'schedule'
         11. **PERSONAL COACHING**:
            - Use REFLECTIONS to understand user's patterns and goals
         12. **TAGS & CHAINS**:
            - When creating habits, ALWAYS auto-suggest logical tags (e.g., morning exercise -> ☀️ Утро + 💪 Спорт)
            - When 2+ habits share a tag, they form a CHAIN (routine pipeline)
            - If user asks to build a routine, create habits with the SAME tag to form a chain
         12. **POMODORO TIMER**:
            - Use startPomodoro tool when user wants focused work on a habit
            - Default 25 min, customizable
         13. **SMART INSIGHTS**:
            - You have access to habit chains in the schedule context above
            - Use this data to give advice about routine building
            - Suggest creating chains for habits that logically go together
         14. **HABIT DNA & LIFE MAP**:
            - These are visual features in the app you can reference
            - Habit DNA shows consistency fingerprint, Life Map shows balance across 8 life areas
         
         IMPORTANT: Always respond quickly. Use tools proactively. You are their trusted companion.
        `;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId || 'Puck' } }
                    },
                    tools: [{
                        functionDeclarations: [
                            createHabitTool, updateHabitTool, deleteHabitTool, batchUpdateHabitsTool,
                            markHabitTool, markAllHabitsTool, suggestFocusTaskTool,
                            addBookTool, trackBookProgressTool,
                            addSupplementTool, updateSupplementTool, markSupplementTakenTool,
                            addSkincareProductTool, markSkincareUsedTool,
                            getPendingHabitsTool, getHabitSummaryTool, endSessionTool,
                            startPomodoroTool,
                            // Settings & Navigation Tools
                            updateSettingsTool, navigateToTool, getStatisticsTool, getAdviceTool, translateCategoriesTool
                        ]
                    }],
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        if (isSessionActive.current) {
                            // Play Siri-like activation chime
                            playSound('wake');

                            setStatus('listening');
                            isConnected.current = true;

                            // Send initial greeting prompt so AI says "Слушаю" or "Listening"
                            setTimeout(() => {
                                sessionPromise.then(session => {
                                    const greeting = language === 'ru'
                                        ? 'Скажи очень коротко: "Слушаю"'
                                        : 'Say very briefly: "Listening"';
                                    session.sendClientContent({
                                        turns: [{ role: 'user', parts: [{ text: greeting }] }]
                                    });
                                }).catch(() => { });
                            }, 300);
                        }
                    },
                    onmessage: async (msg) => {
                        if (!isSessionActive.current) return;

                        // Audio Playback
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            setStatus('speaking');
                            if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);

                            try {
                                const bytes = decodeAudio(audioData);
                                const dataInt16 = new Int16Array(bytes.buffer);
                                const float32 = new Float32Array(dataInt16.length);
                                for (let i = 0; i < dataInt16.length; i++) {
                                    float32[i] = dataInt16[i] / 32768.0;
                                }

                                // Create buffer - Gemini outputs 24kHz audio
                                const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
                                buffer.copyToChannel(float32, 0);

                                // Create audio pipeline with gain for smooth volume
                                const source = audioContextRef.current.createBufferSource();
                                source.buffer = buffer;

                                // Add gain node for volume control and smooth transitions
                                const gainNode = audioContextRef.current.createGain();
                                gainNode.gain.value = 1.0;

                                source.connect(gainNode);
                                gainNode.connect(audioContextRef.current.destination);

                                const now = audioContextRef.current.currentTime;
                                // Ensure continuous playback by scheduling ahead
                                if (nextStartTimeRef.current < now) {
                                    nextStartTimeRef.current = now + 0.01; // Small delay to prevent overlap issues
                                }

                                const playTime = nextStartTimeRef.current;
                                source.start(playTime);
                                nextStartTimeRef.current = playTime + buffer.duration;

                                const timeUntilEnd = (nextStartTimeRef.current - now) * 1000;

                                speakingTimerRef.current = setTimeout(() => {
                                    if (isSessionActive.current) setStatus('listening');
                                }, timeUntilEnd + 300);
                            } catch (audioError) {
                                console.error('Audio playback error:', audioError);
                            }
                        }

                        // --- TOOL HANDLING ---
                        if (msg.toolCall) {
                            if (status !== 'speaking') setStatus('processing');

                            for (const call of msg.toolCall.functionCalls) {
                                try {
                                    if (call.name === 'endSession') {
                                        // Send tool response first
                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: {
                                                name: call.name,
                                                id: call.id,
                                                response: { result: "Session ended." }
                                            }
                                        }));

                                        // Stop session and close modal after speech ends
                                        const closeAndStop = async () => {
                                            await stopSession();
                                            onCloseRef.current();
                                        };

                                        executeAfterSpeech(closeAndStop);
                                        // Also set a fallback timeout in case executeAfterSpeech doesn't trigger
                                        setTimeout(closeAndStop, 3000);
                                        return;
                                    }

                                    if (call.name === 'trackBookProgress') {
                                        const args = call.args as any;
                                        const query = (args.bookTitle || '').toLowerCase();
                                        const amount = Number(args.amount);
                                        const isRelative = args.isRelative;
                                        const notes = args.notes;

                                        // Find relevant habit/book
                                        const readingHabit = habitsRef.current.find(h => {
                                            if (h.extension?.type !== 'reading' || !h.extension.data.books) return false;

                                            // Check Habit Name
                                            if (h.name.toLowerCase().includes(query)) return true;

                                            // Check Book Titles inside
                                            return h.extension.data.books.some(b => b.title.toLowerCase().includes(query));
                                        });

                                        if (readingHabit && readingHabit.extension?.data?.books) {
                                            const books = readingHabit.extension.data.books;
                                            // Find specific book or default to first active
                                            let bookIndex = books.findIndex(b => b.title.toLowerCase().includes(query));
                                            if (bookIndex === -1) bookIndex = books.findIndex(b => b.status === 'reading');

                                            if (bookIndex !== -1) {
                                                const book = books[bookIndex];
                                                let finalPage = book.currentPage;

                                                if (!isNaN(amount)) {
                                                    const newPage = isRelative ? (book.currentPage + amount) : amount;
                                                    finalPage = Math.min(book.totalPages, Math.max(0, newPage));
                                                }

                                                // Update
                                                const newBooks = [...books];
                                                newBooks[bookIndex] = {
                                                    ...book,
                                                    currentPage: finalPage,
                                                    notes: notes ? (book.notes ? `${book.notes}\n${notes}` : notes) : book.notes,
                                                    updatedAt: new Date().toISOString()
                                                };

                                                onUpdateHabitRef.current(readingHabit.id, {
                                                    extension: { type: 'reading', data: { books: newBooks } }
                                                });

                                                const feedback = notes ? `Saved note for: ${book.title}` : `Updated: ${book.title} (p.${finalPage})`;
                                                showActionFeedback(feedback);

                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: `Updated ${book.title}. Current page ${finalPage}.${notes ? ' Added note.' : ''}` } }]
                                                }));
                                            } else {
                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: "Found reading habit, but no active book found." } }]
                                                }));
                                            }
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No reading habit or book found matching that name." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    if (call.name === 'addBook') {
                                        const args = call.args as any;
                                        const title = args.title || '';
                                        const author = args.author || '';
                                        const totalPages = Number(args.totalPages) || 300;
                                        const habitQuery = (args.habitName || '').toLowerCase();

                                        let readingHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'reading'
                                        );

                                        if (!readingHabit && habitQuery) {
                                            readingHabit = habitsRef.current.find(h => h.name.toLowerCase().includes(habitQuery));
                                        }

                                        if (readingHabit) {
                                            const books = readingHabit.extension?.data?.books || [];
                                            const newBook = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                title,
                                                author,
                                                totalPages,
                                                currentPage: 0,
                                                status: 'reading' as const,
                                                updatedAt: new Date().toISOString()
                                            };

                                            onUpdateHabitRef.current(readingHabit.id, {
                                                extension: { type: 'reading', data: { books: [...books, newBook] } }
                                            });

                                            showActionFeedback(`+ ${title}`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: `Added book "${title}" by ${author} to library.` } }]
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No reading habit found. Please create a reading habit first (e.g. 'Read books')." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE ADD SUPPLEMENT
                                    if (call.name === 'addSupplement') {
                                        const args = call.args as any;
                                        const suppName = args.supplementName || '';
                                        const dosage = args.dosage || '';
                                        const timing = args.timing || 'anytime';
                                        const frequency = args.frequency || 'daily';
                                        const habitQuery = (args.habitName || '').toLowerCase();

                                        // Find supplements habit
                                        let supplementHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'supplements'
                                        );

                                        // Try to find by name or create extension
                                        if (!supplementHabit && habitQuery) {
                                            supplementHabit = habitsRef.current.find(h =>
                                                h.name.toLowerCase().includes(habitQuery) ||
                                                h.name.toLowerCase().includes('витамин') ||
                                                h.name.toLowerCase().includes('бад') ||
                                                h.name.toLowerCase().includes('supplement')
                                            );
                                        }

                                        if (!supplementHabit) {
                                            // Find any health habit
                                            supplementHabit = habitsRef.current.find(h =>
                                                h.category?.toLowerCase().includes('здоров') ||
                                                h.category?.toLowerCase().includes('health')
                                            );
                                        }

                                        if (supplementHabit) {
                                            const existingSupps = supplementHabit.extension?.data?.supplements || [];
                                            const newSupp = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: suppName,
                                                dosage: dosage,
                                                timing: timing,
                                                frequency: frequency,
                                                takenDates: []
                                            };

                                            onUpdateHabitRef.current(supplementHabit.id, {
                                                extension: { type: 'supplements', data: { supplements: [...existingSupps, newSupp] } }
                                            });

                                            showActionFeedback(`+ ${suppName}`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: `Added supplement ${suppName} ${dosage}` } }]
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No health/supplements habit found. Please create one first." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE UPDATE SUPPLEMENT
                                    if (call.name === 'updateSupplement') {
                                        const args = call.args as any;
                                        const suppName = args.supplementName || '';
                                        const dosage = args.dosage;
                                        const timing = args.timing;
                                        const frequency = args.frequency;

                                        const supplementHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'supplements' &&
                                            h.extension.data.supplements?.some(s => s.name.toLowerCase().includes(suppName.toLowerCase()))
                                        );

                                        if (supplementHabit && supplementHabit.extension?.data?.supplements) {
                                            const newSupplements = supplementHabit.extension.data.supplements.map(s => {
                                                if (s.name.toLowerCase().includes(suppName.toLowerCase())) {
                                                    return {
                                                        ...s,
                                                        ...(dosage ? { dosage } : {}),
                                                        ...(timing ? { timing } : {}),
                                                        ...(frequency ? { frequency } : {})
                                                    };
                                                }
                                                return s;
                                            });

                                            onUpdateHabitRef.current(supplementHabit.id, {
                                                extension: { type: 'supplements', data: { supplements: newSupplements } }
                                            });

                                            showActionFeedback(`Updated ${suppName}`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: `Updated supplement ${suppName} details.` } }]
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: `Supplement "${suppName}" not found.` } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE MARK SUPPLEMENT TAKEN
                                    if (call.name === 'markSupplementTaken') {
                                        const args = call.args as any;
                                        const query = (args.supplementName || '').toLowerCase();
                                        const isTaken = args.isTaken !== false;
                                        const today = getLocalDateString();

                                        // Find habit with supplements
                                        const supplementHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'supplements' &&
                                            h.extension.data.supplements?.some(s => s.name.toLowerCase().includes(query))
                                        );

                                        if (supplementHabit && supplementHabit.extension?.data?.supplements) {
                                            const supplements = supplementHabit.extension.data.supplements;
                                            const suppIndex = supplements.findIndex(s => s.name.toLowerCase().includes(query));

                                            if (suppIndex !== -1) {
                                                const supp = supplements[suppIndex];
                                                const dates = supp.takenDates || [];
                                                const newDates = isTaken
                                                    ? (dates.includes(today) ? dates : [...dates, today])
                                                    : dates.filter(d => d !== today);

                                                const newSupplements = [...supplements];
                                                newSupplements[suppIndex] = { ...supp, takenDates: newDates };

                                                onUpdateHabitRef.current(supplementHabit.id, {
                                                    extension: { type: 'supplements', data: { supplements: newSupplements } }
                                                });

                                                showActionFeedback(isTaken ? `✓ ${supp.name}` : `✗ ${supp.name}`);

                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: `Marked ${supp.name} as ${isTaken ? 'taken' : 'not taken'}` } }]
                                                }));
                                            } else {
                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: "Supplement not found with that name." } }]
                                                }));
                                            }
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No supplements found." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE ADD SKINCARE PRODUCT
                                    if (call.name === 'addSkincareProduct') {
                                        const args = call.args as any;
                                        const productName = args.productName || '';
                                        const type = args.type || 'other';
                                        const routine = args.routine || 'both';
                                        const frequency = args.frequency || 'daily';
                                        const habitQuery = (args.habitName || '').toLowerCase();

                                        let skincareHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'skincare'
                                        );

                                        if (!skincareHabit && habitQuery) {
                                            skincareHabit = habitsRef.current.find(h => h.name.toLowerCase().includes(habitQuery));
                                        }

                                        if (!skincareHabit) {
                                            skincareHabit = habitsRef.current.find(h =>
                                                h.category?.toLowerCase().includes('beauty') ||
                                                h.category?.toLowerCase().includes('уход') ||
                                                h.name.toLowerCase().includes('уход')
                                            );
                                        }

                                        if (skincareHabit) {
                                            const products = skincareHabit.extension?.data?.skincare || [];
                                            const newProduct = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: productName,
                                                type: type,
                                                routine: routine,
                                                frequency: frequency,
                                                order: products.length + 1,
                                                status: 'active' as const,
                                                usedDates: []
                                            };

                                            onUpdateHabitRef.current(skincareHabit.id, {
                                                extension: { type: 'skincare', data: { skincare: [...products, newProduct] } }
                                            });

                                            showActionFeedback(`+ ${productName}`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: `Added product "${productName}" to skincare routine.` } }]
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No skincare habit found. Please create one first." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE MARK SKINCARE USED
                                    if (call.name === 'markSkincareUsed') {
                                        const args = call.args as any;
                                        const query = (args.productName || '').toLowerCase();
                                        const routine = args.routine; // 'morning' or 'evening'
                                        const isUsed = args.isUsed !== false;
                                        const today = getLocalDateString();
                                        const dateKey = `${today}_${routine}`; // Store as YYYY-MM-DD_morning or YYYY-MM-DD_evening

                                        const skincareHabit = habitsRef.current.find(h =>
                                            h.extension?.type === 'skincare' &&
                                            h.extension.data.skincare?.some(p => p.name.toLowerCase().includes(query))
                                        );

                                        if (skincareHabit && skincareHabit.extension?.data?.skincare) {
                                            const products = skincareHabit.extension.data.skincare;
                                            const prodIndex = products.findIndex(p => p.name.toLowerCase().includes(query));

                                            if (prodIndex !== -1) {
                                                const product = products[prodIndex];
                                                const dates = product.usedDates || [];
                                                const newDates = isUsed
                                                    ? (dates.includes(dateKey) ? dates : [...dates, dateKey])
                                                    : dates.filter(d => d !== dateKey);

                                                const newProducts = [...products];
                                                newProducts[prodIndex] = { ...product, usedDates: newDates };

                                                onUpdateHabitRef.current(skincareHabit.id, {
                                                    extension: { type: 'skincare', data: { skincare: newProducts } }
                                                });

                                                showActionFeedback(isUsed ? `✓ ${product.name}` : `✗ ${product.name}`);

                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: `Marked ${product.name} as used in ${routine} routine.` } }]
                                                }));
                                            } else {
                                                sessionPromise.then(s => s.sendToolResponse({
                                                    functionResponses: [{ name: call.name, id: call.id, response: { result: "Product not found." } }]
                                                }));
                                            }
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: [{ name: call.name, id: call.id, response: { result: "No skincare products found." } }]
                                            }));
                                        }
                                        return;
                                    }

                                    // HANDLE FOCUS REQUEST
                                    if (call.name === 'startPomodoro') {
                                        const args = call.args as any;
                                        const targetName = (args.habitName || '').toLowerCase();
                                        const habit = habitsRef.current.find(h => h.name.toLowerCase().includes(targetName) && !h.archived);

                                        if (habit && onStartPomodoroRef.current) {
                                            const minutes = args.minutes || 25;
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: `Starting ${minutes}min Pomodoro for "${habit.name}"` }
                                                }
                                            }));

                                            executeAfterSpeech(async () => {
                                                await stopSession();
                                                onCloseRef.current();
                                                onStartPomodoroRef.current?.(habit.id, minutes);
                                            });
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: habit ? "Pomodoro not available" : "Habit not found" }
                                                }
                                            }));
                                        }
                                        return;
                                    }

                                    if (call.name === 'suggestFocusTask') {
                                        const args = call.args as any;
                                        // Map string level to numbers
                                        let energyVal = 50;
                                        if (args.energyLevel === 'low') energyVal = 20;
                                        else if (args.energyLevel === 'high') energyVal = 90;

                                        const mins = args.availableMinutes || 30;

                                        if (onRequestFocusRef.current) {
                                            // Inform model we are opening the UI
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: "Focus Mode UI Opened." }
                                                }
                                            }));

                                            // Trigger UI change with delay to let AI finish speaking
                                            executeAfterSpeech(() => {
                                                onRequestFocusRef.current?.(energyVal, mins);
                                            });
                                        }
                                        return;
                                    }

                                    // HANDLE CREATE
                                    if (call.name === 'createHabit') {
                                        const args = call.args as any;
                                        const cleanName = capitalize(args.name);

                                        // Debounce check - prevent duplicate creates
                                        const createKey = `create:${cleanName.toLowerCase()}:${args.type || 'habit'}`;
                                        if (recentToolCallsRef.current.has(createKey)) {
                                            console.log('Debounced duplicate createHabit:', cleanName);
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: `Already created: ${cleanName}` }
                                                }
                                            }));
                                            continue;
                                        }
                                        recentToolCallsRef.current.add(createKey);
                                        setTimeout(() => recentToolCallsRef.current.delete(createKey), toolCallDebounceMs);

                                        const finalColor = args.color || getRandom(AVAILABLE_COLORS);
                                        const finalIcon = args.icon || 'Star';

                                        let taskDate = args.date;
                                        if (args.type === 'task' && !taskDate) {
                                            taskDate = getLocalDateString();
                                        }
                                        if (taskDate && taskDate.includes('T')) taskDate = taskDate.split('T')[0];

                                        const newHabitMock = {
                                            id: 'temp-id',
                                            type: args.type || 'habit',
                                            name: cleanName,
                                            description: args.description || '',
                                            category: args.category || (language === 'ru' ? 'Другое' : 'Other'),
                                            frequency: args.frequency || 'daily',
                                            targetCount: args.targetCount || 1,
                                            time: args.time || '',
                                            place: args.place || '',
                                            duration: args.duration || 30,
                                            date: taskDate,
                                            frequencyDays: args.frequencyDays || [],
                                            color: finalColor,
                                            icon: finalIcon,
                                            completedDates: [],
                                            createdAt: new Date().toISOString(),
                                            cost: args.cost || undefined,
                                            currency: args.cost ? defaultCurrency : undefined,
                                            tags: args.tags || [],
                                            quadrant: args.quadrant || undefined
                                        } as Habit;

                                        habitsRef.current = [...habitsRef.current, newHabitMock];
                                        onCreateHabitRef.current(newHabitMock);
                                        const label = args.type === 'task' ? (language === 'ru' ? 'Задача' : 'Task') : (language === 'ru' ? 'Привычка' : 'Habit');
                                        showActionFeedback(`+ ${label}: ${cleanName}`);

                                        const { text: contextStr } = generateHabitsContext(habitsRef.current, language as 'ru' | 'en');

                                        // Use sessionPromise for reliable tool response
                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: {
                                                name: call.name,
                                                id: call.id,
                                                response: { result: `Created successfully. UPDATED SCHEDULE:\n${contextStr}` }
                                            }
                                        }));
                                    }

                                    if (call.name === 'updateHabit') {
                                        const args = call.args as any;
                                        const targetName = (args.currentName || '').toLowerCase();
                                        // Prefer non-archived, incomplete tasks first
                                        const activeList = habitsRef.current.filter(h => !h.archived);
                                        let habit = activeList.find(h => h.name.toLowerCase() === targetName);
                                        if (!habit) habit = activeList.find(h => h.name.toLowerCase().includes(targetName));
                                        if (!habit) habit = activeList.find(h => targetName.includes(h.name.toLowerCase()));

                                        if (habit) {
                                            const updates: Partial<Habit> = {};
                                            if (args.time) updates.time = args.time;
                                            if (args.date) {
                                                let d = args.date;
                                                if (d.includes('T')) d = d.split('T')[0];
                                                updates.date = d;
                                            }
                                            if (args.newName) updates.name = capitalize(args.newName);
                                            if (args.category) updates.category = args.category;
                                            if (args.targetCount) updates.targetCount = args.targetCount;
                                            if (args.icon) updates.icon = args.icon;
                                            if (args.color) updates.color = args.color;
                                            if (args.place) updates.place = args.place;
                                            if (args.duration) updates.duration = args.duration;
                                            if (args.cost !== undefined) {
                                                updates.cost = args.cost > 0 ? args.cost : undefined;
                                                if (args.cost > 0) updates.currency = defaultCurrency;
                                            }
                                            if (args.tags) updates.tags = args.tags;

                                            onUpdateHabitRef.current(habit.id, updates);

                                            const actionText = updates.date ? `Moved to ${updates.date}` : `Updated ${habit.name}`;
                                            showActionFeedback(actionText);

                                            const updatedList = habitsRef.current.map(h => h.id === habit.id ? { ...h, ...updates } : h);
                                            const { text: contextStr } = generateHabitsContext(updatedList, language as 'ru' | 'en');

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: `Updated ${habit.name} with ${JSON.stringify(updates)}. UPDATED SCHEDULE:\n${contextStr}` }
                                                }
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: "Item not found" } }
                                            }));
                                        }
                                    }

                                    if (call.name === 'deleteHabit') {
                                        const args = call.args as any;
                                        const targetName = (args.habitName || '').toLowerCase();
                                        const activeList = habitsRef.current.filter(h => !h.archived);
                                        const habit = activeList.find(h => h.name.toLowerCase().includes(targetName));

                                        if (habit) {
                                            onArchiveHabitRef.current(habit.id);
                                            showActionFeedback(`Archived ${habit.name}`);

                                            const updatedList = habitsRef.current.filter(h => h.id !== habit.id);
                                            const { text: contextStr } = generateHabitsContext(updatedList, language as 'ru' | 'en');

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: `Deleted ${habit.name} (Archived). UPDATED SCHEDULE:\n${contextStr}` }
                                                }
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: "Item not found" } }
                                            }));
                                        }
                                    }

                                    if (call.name === 'batchUpdateHabits') {
                                        const args = call.args as any;
                                        const updatesPayload: { id: string, data: Partial<Habit> }[] = [];
                                        let tempHabits = [...habitsRef.current];

                                        if (args.updates && Array.isArray(args.updates)) {
                                            args.updates.forEach((u: any) => {
                                                const habit = tempHabits.find(h => h.name.toLowerCase().includes(u.currentName.toLowerCase()));
                                                if (habit) {
                                                    const data: Partial<Habit> = {};
                                                    if (u.newName) data.name = capitalize(u.newName);
                                                    if (u.color) data.color = u.color;
                                                    if (u.icon) data.icon = u.icon;
                                                    if (u.category) data.category = u.category;
                                                    if (u.time) data.time = u.time;
                                                    if (u.place) data.place = u.place;
                                                    if (u.duration) data.duration = u.duration;

                                                    updatesPayload.push({ id: habit.id, data });
                                                    tempHabits = tempHabits.map(h => h.id === habit.id ? { ...h, ...data } : h);
                                                }
                                            });
                                        }
                                        if (updatesPayload.length > 0) onBatchUpdateHabitsRef.current(updatesPayload);
                                        showActionFeedback(`Batch updated (${updatesPayload.length})`);

                                        const { text: contextStr } = generateHabitsContext(tempHabits, language as 'ru' | 'en');

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: {
                                                name: call.name,
                                                id: call.id,
                                                response: { result: `Batch update complete. UPDATED SCHEDULE:\n${contextStr}` }
                                            }
                                        }));
                                    }

                                    if (call.name === 'markHabit') {
                                        const args = call.args as any;
                                        const targetName = (args.habitName || '').toLowerCase().trim();

                                        // Prefer non-archived habits, try exact then partial match
                                        const activeList = habitsRef.current.filter(h => !h.archived);
                                        let habit = activeList.find(h => h.name.toLowerCase() === targetName);
                                        if (!habit) habit = activeList.find(h => h.name.toLowerCase().includes(targetName));
                                        if (!habit) habit = activeList.find(h => targetName.includes(h.name.toLowerCase()));

                                        if (habit) {
                                            let dateStr = args.date;
                                            if (dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0];

                                            if (!dateStr) {
                                                if (habit.type === 'task' && habit.date) {
                                                    dateStr = habit.date;
                                                } else {
                                                    dateStr = getLocalDateString();
                                                }
                                            }

                                            const targetState = args.isCompleted !== false;

                                            onToggleHabitRef.current(habit.id, dateStr);
                                            showActionFeedback(`Marked ${habit.name}`);

                                            const updatedList = habitsRef.current.map(h => {
                                                if (h.id !== habit.id) return h;
                                                const newDates = targetState
                                                    ? [...h.completedDates, dateStr]
                                                    : h.completedDates.filter(d => d !== dateStr);
                                                return { ...h, completedDates: newDates };
                                            });
                                            const { text: contextStr } = generateHabitsContext(updatedList, language as 'ru' | 'en');

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: {
                                                    name: call.name,
                                                    id: call.id,
                                                    response: { result: `Success. Status updated.\n${contextStr}` }
                                                }
                                            }));
                                        } else {
                                            const notFoundMsg = `Item "${targetName}" not found in list. Please ask user for exact name.`;
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: notFoundMsg } }
                                            }));
                                        }
                                    }

                                    if (call.name === 'markAllHabits') {
                                        onMarkAllRef.current();
                                        showActionFeedback(`All Done!`);
                                        const todayStr = getLocalDateString();
                                        const updatedList = habitsRef.current.map(h => ({ ...h, completedDates: [...h.completedDates, todayStr] }));
                                        const { text: contextStr } = generateHabitsContext(updatedList, language as 'ru' | 'en');

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { name: call.name, id: call.id, response: { result: `Marked all as done.\n${contextStr}` } }
                                        }));
                                    }

                                    if (call.name === 'getPendingHabits') {
                                        const todayStr = getLocalDateString();
                                        const dayOfWeek = new Date().getDay();
                                        const pending = habitsRef.current.filter(h => {
                                            if (h.archived) return false;

                                            let isForToday = false;
                                            if (h.type === 'task') {
                                                isForToday = h.date === todayStr;
                                            } else {
                                                if (h.frequency === 'daily') isForToday = true;
                                                else if (h.frequency === 'weekly') isForToday = dayOfWeek === 1;
                                                else if (h.frequency === 'specific_days') isForToday = (h.frequencyDays || []).includes(dayOfWeek);
                                                else if (h.frequency === 'monthly') isForToday = new Date().getDate() === 1;
                                            }

                                            if (!isForToday) return false;

                                            const targetDate = h.type === 'task' ? h.date : todayStr;
                                            return !h.completedDates.includes(targetDate || todayStr);
                                        }).map(h => h.name);

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { name: call.name, id: call.id, response: { result: pending.length > 0 ? `Pending Today: ${pending.join(', ')}` : "All done for today!" } }
                                        }));
                                    }

                                    if (call.name === 'getHabitSummary') {
                                        const total = habitsRef.current.length;
                                        const todayStr = getLocalDateString();
                                        const completed = habitsRef.current.reduce((acc, h) => {
                                            const targetDate = h.type === 'task' ? h.date : todayStr;
                                            if (h.completedDates.includes(targetDate || todayStr)) return acc + 1;
                                            return acc;
                                        }, 0);

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { name: call.name, id: call.id, response: { result: `Total items: ${total}, Completed today/on-date: ${completed}` } }
                                        }));
                                    }

                                    // === NEW TOOL HANDLERS ===

                                    // SETTINGS UPDATE
                                    if (call.name === 'updateSettings') {
                                        const args = call.args as any;
                                        const settingsToApply: any = {};
                                        const changes: string[] = [];

                                        if (args.theme) {
                                            settingsToApply.theme = args.theme;
                                            changes.push(`Theme: ${args.theme}`);
                                        }
                                        if (args.language) {
                                            settingsToApply.language = args.language;
                                            changes.push(`Language: ${args.language}`);
                                        }
                                        if (args.timeFocusMode !== undefined) {
                                            settingsToApply.timeFocusMode = args.timeFocusMode;
                                            changes.push(`Time Focus: ${args.timeFocusMode ? 'ON' : 'OFF'}`);
                                        }
                                        if (args.isWakeWordEnabled !== undefined) {
                                            settingsToApply.isWakeWordEnabled = args.isWakeWordEnabled;
                                            changes.push(`Wake Word: ${args.isWakeWordEnabled ? 'ON' : 'OFF'}`);
                                        }

                                        if (onUpdateSettings && Object.keys(settingsToApply).length > 0) {
                                            onUpdateSettings(settingsToApply);
                                            showActionFeedback(changes.join(', '));

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: `Settings updated: ${changes.join(', ')}` } }
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: "No settings changes specified." } }
                                            }));
                                        }
                                    }

                                    // NAVIGATION
                                    if (call.name === 'navigateTo') {
                                        const args = call.args as any;
                                        const screen = args.screen as 'home' | 'calendar' | 'settings' | 'activity' | 'expenses' | 'graph';

                                        if (onNavigateTo) {
                                            const screenNames: Record<string, string> = {
                                                home: language === 'ru' ? 'Главная' : 'Home',
                                                calendar: language === 'ru' ? 'Календарь' : 'Calendar',
                                                settings: language === 'ru' ? 'Настройки' : 'Settings',
                                                activity: language === 'ru' ? 'Активность' : 'Activity',
                                                expenses: language === 'ru' ? 'Расходы' : 'Expenses',
                                                graph: language === 'ru' ? 'Граф связей' : 'Connection Graph'
                                            };
                                            showActionFeedback(`→ ${screenNames[screen] || screen}`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: `Navigated to ${screen}` } }
                                            }));

                                            // Added delay to let AI finish speaking before navigating (which closes the modal)
                                            executeAfterSpeech(() => {
                                                onNavigateTo(screen);
                                            });
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: "Navigation not available." } }
                                            }));
                                        }
                                    }

                                    // STATISTICS
                                    if (call.name === 'getStatistics') {
                                        const args = call.args as any;
                                        const period = args.period || 'today';
                                        const todayStr = getLocalDateString();
                                        const now = new Date();

                                        // Calculate date range
                                        let startDate = new Date();
                                        if (period === 'week') startDate.setDate(now.getDate() - 7);
                                        else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
                                        else if (period === 'all') startDate = new Date(0);

                                        const habits = habitsRef.current.filter(h => !h.archived);
                                        const totalHabits = habits.filter(h => h.type === 'habit').length;
                                        const totalTasks = habits.filter(h => h.type === 'task').length;

                                        // Today's completion
                                        const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;

                                        // Total expenses
                                        const totalExpenses = habits
                                            .filter(h => h.cost && h.cost > 0)
                                            .reduce((sum, h) => sum + (h.cost || 0), 0);

                                        // Find best streak (longest current streak)
                                        let bestStreak = 0;
                                        habits.forEach(h => {
                                            if (h.type === 'habit' && h.completedDates.length > 0) {
                                                const sorted = [...h.completedDates].sort().reverse();
                                                let streak = 0;
                                                let checkDate = new Date(todayStr);
                                                for (const dateStr of sorted) {
                                                    if (getLocalDateString(checkDate) === dateStr) {
                                                        streak++;
                                                        checkDate.setDate(checkDate.getDate() - 1);
                                                    } else break;
                                                }
                                                if (streak > bestStreak) bestStreak = streak;
                                            }
                                        });

                                        const statsText = language === 'ru'
                                            ? `📊 Статистика:\n• Привычек: ${totalHabits}\n• Задач: ${totalTasks}\n• Выполнено сегодня: ${completedToday}\n• Лучший streak: ${bestStreak} дней\n• Общие расходы: ${totalExpenses} ${defaultCurrency}`
                                            : `📊 Statistics:\n• Habits: ${totalHabits}\n• Tasks: ${totalTasks}\n• Completed today: ${completedToday}\n• Best streak: ${bestStreak} days\n• Total expenses: ${totalExpenses} ${defaultCurrency}`;

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { name: call.name, id: call.id, response: { result: statsText } }
                                        }));
                                    }

                                    // ADVICE
                                    if (call.name === 'getAdvice') {
                                        const args = call.args as any;
                                        const topic = args.topic || 'general';
                                        const habits = habitsRef.current.filter(h => !h.archived);

                                        // Analyze habits for personalized advice
                                        const hasTimeSlots = habits.some(h => h.time);
                                        const hasCategories = habits.length > 5;
                                        const completionRate = habits.length > 0
                                            ? habits.filter(h => h.completedDates.includes(getLocalDateString())).length / habits.length
                                            : 0;

                                        let advice = '';
                                        if (language === 'ru') {
                                            if (!hasTimeSlots) advice = "💡 Совет: Добавьте конкретное время для привычек. Исследования показывают, что привязка к времени повышает выполнение на 40%.";
                                            else if (completionRate < 0.5) advice = "💡 Совет: Начните с малого! Попробуйте выполнять всего 2-3 привычки идеально, затем добавляйте новые.";
                                            else if (completionRate >= 0.8) advice = "🎉 Отлично! Ваша consistency впечатляет. Попробуйте связать привычки в цепочки (habit stacking).";
                                            else advice = "💡 Совет: Используйте Implementation Intentions — укажите КОГДА и ГДЕ выполнять каждую привычку.";
                                        } else {
                                            if (!hasTimeSlots) advice = "💡 Tip: Add specific times to your habits. Research shows time-binding increases completion by 40%.";
                                            else if (completionRate < 0.5) advice = "💡 Tip: Start small! Master 2-3 habits perfectly before adding more.";
                                            else if (completionRate >= 0.8) advice = "🎉 Excellent! Your consistency is impressive. Try habit stacking to build powerful routines.";
                                            else advice = "💡 Tip: Use Implementation Intentions — specify WHEN and WHERE for each habit.";
                                        }

                                        sessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { name: call.name, id: call.id, response: { result: advice } }
                                        }));
                                    }

                                    // TRANSLATE CATEGORIES
                                    if (call.name === 'translateCategories') {
                                        const args = call.args as any;
                                        const targetLang = args.targetLanguage as 'ru' | 'en';

                                        const categoryTranslations: Record<string, { ru: string; en: string }> = {
                                            'health': { ru: 'Здоровье', en: 'Health' },
                                            'здоровье': { ru: 'Здоровье', en: 'Health' },
                                            'sport': { ru: 'Спорт', en: 'Sport' },
                                            'спорт': { ru: 'Спорт', en: 'Sport' },
                                            'productivity': { ru: 'Продуктивность', en: 'Productivity' },
                                            'продуктивность': { ru: 'Продуктивность', en: 'Productivity' },
                                            'learning': { ru: 'Обучение', en: 'Learning' },
                                            'обучение': { ru: 'Обучение', en: 'Learning' },
                                            'finance': { ru: 'Финансы', en: 'Finance' },
                                            'финансы': { ru: 'Финансы', en: 'Finance' },
                                            'mindfulness': { ru: 'Осознанность', en: 'Mindfulness' },
                                            'осознанность': { ru: 'Осознанность', en: 'Mindfulness' },
                                            'social': { ru: 'Социальное', en: 'Social' },
                                            'социальное': { ru: 'Социальное', en: 'Social' },
                                            'creativity': { ru: 'Творчество', en: 'Creativity' },
                                            'творчество': { ru: 'Творчество', en: 'Creativity' },
                                            'career': { ru: 'Карьера', en: 'Career' },
                                            'карьера': { ru: 'Карьера', en: 'Career' },
                                            'other': { ru: 'Другое', en: 'Other' },
                                            'другое': { ru: 'Другое', en: 'Other' }
                                        };

                                        const updates: { id: string, data: Partial<Habit> }[] = [];
                                        habitsRef.current.forEach(h => {
                                            const catLower = (h.category || '').toLowerCase();
                                            const translation = categoryTranslations[catLower];
                                            if (translation) {
                                                const newCat = translation[targetLang];
                                                if (newCat !== h.category) {
                                                    updates.push({ id: h.id, data: { category: newCat } });
                                                }
                                            }
                                        });

                                        if (updates.length > 0 && onBatchUpdateHabits) {
                                            onBatchUpdateHabits(updates);
                                            showActionFeedback(`Translated ${updates.length} categories`);

                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: `Translated ${updates.length} categories to ${targetLang === 'ru' ? 'Russian' : 'English'}.` } }
                                            }));
                                        } else {
                                            sessionPromise.then(s => s.sendToolResponse({
                                                functionResponses: { name: call.name, id: call.id, response: { result: "No categories to translate or already in target language." } }
                                            }));
                                        }
                                    }

                                } catch (toolError: any) {
                                    console.error("Tool Execution Error:", toolError);
                                    sessionPromise.then(s => s.sendToolResponse({
                                        functionResponses: {
                                            name: call.name,
                                            id: call.id,
                                            response: { error: `Internal Tool Error: ${toolError.message}. Ask user to try again.` }
                                        }
                                    }));
                                }
                            }
                        }
                    },
                    onclose: () => {
                        setStatus('idle');
                        isSessionActive.current = false;
                        isConnected.current = false;
                    },
                    onerror: (err: any) => {
                        console.error("Gemini Error:", err);
                        if (isSessionActive.current) {
                            // More detailed error message
                            let errorMsg = "Connection error";
                            if (err && typeof err === 'object') {
                                if (err.message) errorMsg = err.message;
                                if (String(err.message || err).includes('403')) {
                                    errorMsg = language === 'ru'
                                        ? "Ошибка доступа (403). Добавьте домен в разрешенные для API ключа."
                                        : "Access Denied (403). Add this domain to API Key restrictions in Google Cloud Console.";
                                }
                            }
                            setError(errorMsg);
                            setStatus('idle');
                            isSessionActive.current = false;
                            isConnected.current = false;
                        }
                    }
                }
            });

            sessionRef.current = sessionPromise;

            // Wait for session to be established and store it for synchronous access (audio loop)
            try {
                await sessionPromise;
            } catch (e) {
                console.error("Failed to establish session", e);
                if (isSessionActive.current) {
                    setError("Connection failed");
                    setStatus('idle');
                    isSessionActive.current = false;
                    isConnected.current = false;
                }
            }

            processor.onaudioprocess = (e) => {
                // CRITICAL: Check both active state AND connection flag before sending
                // We use sessionPromise here to get the resolved session which is thread-safe
                if (!isSessionActive.current || !isConnected.current) return;

                const inputData = e.inputBuffer.getChannelData(0);

                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);

                setVolume(Math.min(1, rms * 5));

                if (rms > VAD_THRESHOLD) {
                    lastSpeechTimeRef.current = Date.now();
                }

                if (Date.now() - lastSpeechTimeRef.current < VAD_HANGOVER_MS) {
                    // DOWNSAMPLE if necessary
                    const inputRate = inputContextRef.current?.sampleRate || 16000;
                    let dataToSend = inputData;
                    if (inputRate !== 16000) {
                        dataToSend = downsampleBuffer(inputData, inputRate, 16000);
                    }

                    const b64 = base64EncodeAudio(dataToSend);

                    // Use sessionPromise to safely send input
                    sessionPromise.then(session => {
                        // Extra check before sending to avoid WebSocket errors
                        if (!isSessionActive.current || !isConnected.current) return;

                        try {
                            session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: b64 } });
                        } catch (e) {
                            // Suppress websocket errors if session is closing/closed
                            console.log('Audio send skipped - session closing');
                        }
                    }).catch(() => {
                        // Session promise rejected - ignore
                    });
                }
            };

        } catch (err: any) {
            console.error("Init failed", err);
            let msg = err.message || "Failed to start";

            if (msg.includes("Permission denied") || msg.includes("Mic Error")) {
                msg = language === 'ru'
                    ? "Нет доступа к микрофону. Разрешите доступ в настройках Android (Приложения > HabitAi > Разрешения)."
                    : "Microphone denied. Enable in Android Settings > Apps > HabitAi > Permissions.";
            } else if (msg.includes("403")) {
                msg = "API Key Error (403). Check if Gemini API is enabled for your project.";
            } else if (msg.includes("API Key missing")) {
                msg = "API Key missing. Restart App.";
            }

            setError(msg);
            setStatus('idle');
            isSessionActive.current = false;
            isConnected.current = false;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-none pb-6 sm:pb-8">
            <div onClick={onClose} className="absolute inset-0 bg-transparent pointer-events-auto" />

            <div className="relative w-full max-w-sm mx-4 bg-surface/85 backdrop-blur-[12px] rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 p-5 pointer-events-auto transform transition-transform animate-slideUp">

                <div className="flex justify-center mb-4 cursor-pointer" onClick={onClose}>
                    <div className="w-10 h-1 bg-textSecondary/20 rounded-full" />
                </div>

                <div className="flex items-center gap-4 mb-5 relative">

                    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                        {/* Gemini-style radial waves when listening */}
                        {status === 'listening' && (
                            <>
                                <div
                                    className="absolute w-20 h-20 rounded-full animate-[ping_2s_infinite]"
                                    style={{ background: 'radial-gradient(circle, rgba(155, 114, 203, 0.3) 0%, transparent 70%)' }}
                                />
                                <div
                                    className="absolute w-24 h-24 rounded-full animate-[ping_2.5s_infinite_0.3s]"
                                    style={{ background: 'radial-gradient(circle, rgba(66, 133, 244, 0.2) 0%, transparent 70%)' }}
                                />
                                <div
                                    className="absolute w-28 h-28 rounded-full animate-[ping_3s_infinite_0.6s]"
                                    style={{ background: 'radial-gradient(circle, rgba(217, 101, 112, 0.15) 0%, transparent 70%)' }}
                                />
                            </>
                        )}

                        {/* Main orb with dynamic gradient */}
                        <div
                            className="absolute w-12 h-12 rounded-full transition-all duration-200 ease-out z-10"
                            style={{
                                background: status === 'idle'
                                    ? (accent.isGradient ? accent.gradient : accent.primary)
                                    : status === 'speaking'
                                        ? 'linear-gradient(135deg, #34a853 0%, #4285f4 100%)'
                                        : (accent.isGradient ? accent.gradient : accent.primary),
                                transform: `scale(${1 + volume * 0.8})`,
                                boxShadow: status === 'listening'
                                    ? `0 0 30px ${accent.primary}99, 0 0 60px ${accent.primary}50`
                                    : `0 0 20px ${accent.primary}66`,
                                opacity: status === 'speaking' ? 0.9 : 1
                            }}
                        />

                        <button
                            onClick={status === 'idle' ? startSession : stopSession}
                            className="absolute z-20 w-full h-full flex items-center justify-center rounded-full focus:outline-none"
                        >
                            {status === 'idle' ? <Mic size={20} className="text-white drop-shadow-md" /> : <MicOff size={20} className="text-white/80 drop-shadow-md" />}
                        </button>
                    </div>

                    <div className="flex-1 min-w-0 transition-all duration-300">
                        {lastAction ? (
                            <div className="animate-slideUp">
                                <h2 className="text-base font-bold text-green-500 flex items-center gap-2">
                                    <Check size={18} strokeWidth={3} />
                                    <span>{language === 'ru' ? 'Готово' : 'Success'}</span>
                                </h2>
                                <p className="text-xs text-textPrimary font-medium truncate">
                                    {lastAction}
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fadeIn">
                                <h2 className="text-base font-bold text-textPrimary flex items-center gap-2">
                                    {t.title}
                                    {status === 'processing' && <Sparkles className="text-brand animate-spin w-4 h-4" />}
                                </h2>
                                <div className="text-xs text-textSecondary font-medium overflow-hidden">
                                    {error ? (
                                        <div className="text-red-500 font-bold leading-tight bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                            {error}
                                        </div>
                                    ) : (
                                        <>
                                            {status === 'connecting' && t.connecting}
                                            {status === 'listening' && t.listening}
                                            {status === 'speaking' && t.speaking}
                                            {status === 'processing' && t.processing}
                                            {status === 'idle' && (language === 'ru' ? "Нажмите, чтобы говорить" : "Tap to speak")}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surfaceHighlight text-textSecondary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Hint for Emulator / Permission */}
                {error && (
                    <div className="mb-4 text-[10px] text-textSecondary text-center bg-surfaceHighlight/30 p-2 rounded-lg">
                        {language === 'ru'
                            ? "Если вы на эмуляторе, проверьте настройки микрофона хоста."
                            : "If on emulator, check host mic settings."}
                    </div>
                )}

                <div>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 -mx-2 px-2 snap-x">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 bg-surfaceHighlight/40 border border-borderSubtle rounded-xl text-[10px] font-medium text-textPrimary hover:bg-surfaceHighlight transition-colors shrink-0 snap-start text-left max-w-[200px]"
                            >
                                <s.icon size={12} className="text-brand shrink-0" />
                                <span className="truncate">{s.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistantModal;
