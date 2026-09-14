import React, { useState, useEffect, useMemo } from 'react';
import Modal, { useModalNav } from './Modal';
import { Habit, AVAILABLE_COLORS, ICON_CATEGORIES, EMOJIS, CATEGORIES, HABIT_TEMPLATES, CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol, TAG_PRESETS } from '../types';
import Icon from './Icons';
import { Check, Search, Calendar, ChevronRight, Hash, RotateCcw, Sparkles, Palette, Smile, ArrowRight, LayoutTemplate, Clock, Repeat, CheckSquare, Banknote, Star, MapPin, Bell, Tag, X } from 'lucide-react';
import { useToast } from './Toast';
import { generateHabitSuggestions } from '../services/ai';
import { translations } from '../translations';
import { AnimatedList } from './AnimatedList';

interface HabitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (habitData: Partial<Habit>) => void;
    initialData?: Habit | null;
    language?: 'ru' | 'en';
    closeOnBackdropClick?: boolean;
    defaultCurrency?: string;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface Suggestion {
    name: string;
    description: string;
    icon: string;
    category?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    targetCount?: number;
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({ isOpen, onClose, onSave, initialData, language = 'ru', closeOnBackdropClick = true, defaultCurrency: propDefaultCurrency = DEFAULT_CURRENCY }) => {
    const t = translations[language].habitForm;
    // Tabs for Icon Picker
    const [activeTab, setActiveTab] = useState<'icon' | 'emoji'>('icon');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Form Fields
    const [type, setType] = useState<'habit' | 'task'>('habit');
    const toast = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(AVAILABLE_COLORS[5]);
    const [icon, setIcon] = useState('Activity');
    const [category, setCategory] = useState(language === 'ru' ? 'Здоровье' : 'Health');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'specific_days'>('daily');
    const [frequencyDays, setFrequencyDays] = useState<number[]>([]);
    const [targetCount, setTargetCount] = useState(1);
    const [time, setTime] = useState('');
    const [place, setPlace] = useState('');  // Implementation Intentions
    const [duration, setDuration] = useState(30);
    const [date, setDate] = useState(getLocalDateString()); // For one-off tasks
    const [cost, setCost] = useState<string>(''); // Expense tracking
    const [currency, setCurrency] = useState<string>(propDefaultCurrency);
    const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(1); // Rarity system
    const [isKeystone, setIsKeystone] = useState(false); // Keystone Habits
    const [reminderTime, setReminderTime] = useState(''); // Push notification time
    const [tags, setTags] = useState<string[]>([]); // Quick Tags
    const [tagInput, setTagInput] = useState('');

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [columnId, setColumnId] = useState<string | undefined>(undefined);

    // AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setType(initialData.type || 'habit');
                setName(initialData.name || '');
                setDescription(initialData.description || '');
                setColor(initialData.color);
                setIcon(initialData.icon);
                setCategory(initialData.category || (language === 'ru' ? 'Здоровье' : 'Health'));
                setFrequency(initialData.frequency || 'daily');
                setFrequencyDays(initialData.frequencyDays || []);
                setTargetCount(initialData.targetCount || 1);
                setTime(initialData.time || '');
                setPlace(initialData.place || '');
                setDuration(initialData.duration || 30);
                setDate(initialData.date || getLocalDateString());
                setCost(initialData.cost ? initialData.cost.toString() : '');
                setCurrency(initialData.currency || DEFAULT_CURRENCY);
                setDifficulty(initialData.difficulty || 1);
                setIsKeystone(initialData.isKeystone || false);
                setReminderTime(initialData.reminderTime || '');
                setTags(initialData.tags || []);
                setColumnId(initialData.columnId);
                const isEmoji = !!initialData.icon.match(/\p{Emoji}/u);
                setActiveTab(isEmoji ? 'emoji' : 'icon');
                setShowAdvanced(true);
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData, language]);

    const resetForm = () => {
        setType('habit');
        setName('');
        setDescription('');
        setColor(AVAILABLE_COLORS[5]);
        setIcon('Activity');
        setCategory(language === 'ru' ? 'Здоровье' : 'Health');
        setFrequency('daily');
        setFrequencyDays([]);
        setTargetCount(1);
        setTime('');
        setPlace('');
        setDuration(30);
        setDate(getLocalDateString());
        setCost('');
        setCurrency(propDefaultCurrency);
        setDifficulty(1);
        setIsKeystone(false);
        setReminderTime('');
        setTags([]);
        setTagInput('');
        setColumnId(undefined);
        setSearchQuery('');
        setAiPrompt('');
        setSuggestions([]);
        setShowAdvanced(false);
    };

    const handleApplyTemplate = (template: typeof HABIT_TEMPLATES[0]) => {
        setName(language === 'ru' ? template.name : template.nameEn);
        setIcon(template.icon);
        setColor(template.color);
        setCategory(template.category);
        setTargetCount(template.targetCount);
        setFrequency('daily'); // Default to daily for presets
        setType('habit');
        setDescription('');
    };

    const handleSave = () => {
        if (!name.trim()) return;

        if (type === 'habit' && frequency === 'specific_days' && frequencyDays.length === 0) {
            toast.warning(language === 'ru' ? 'Выберите хотя бы один день.' : 'Please select at least one day.');
            return;
        }

        onSave({
            type,
            name,
            description,
            color,
            icon,
            category,
            frequency: type === 'habit' ? frequency : undefined,
            frequencyDays: type === 'habit' && frequency === 'specific_days' ? frequencyDays : [],
            date: type === 'task' ? date : undefined,
            targetCount,
            // Adaptive Goals: save ultimate target when count > 1
            ultimateTarget: targetCount > 1 ? targetCount : undefined,
            // FORCE level 10 on save/edit to allow "repairing" degraded habits
            adaptiveLevel: targetCount > 1 ? 10 : undefined,
            time,
            place: place.trim() || undefined,
            duration,
            cost: cost ? parseFloat(cost) : undefined,
            currency: cost ? currency : undefined,
            difficulty,
            isKeystone: isKeystone || undefined,
            reminderTime: reminderTime || undefined,
            tags: tags.length > 0 ? tags : undefined,
            columnId
        });
        onClose();
    };

    const handleAiSuggest = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        const results = await generateHabitSuggestions(aiPrompt, language as 'ru' | 'en');
        setSuggestions(results);
        setIsGenerating(false);
    };

    const applySuggestion = (s: Suggestion) => {
        setName(s.name);
        setDescription(s.description);
        setIcon(s.icon);

        if (s.category) setCategory(s.category);
        if (s.frequency) setFrequency(s.frequency);
        if (s.targetCount) setTargetCount(s.targetCount);

        setSuggestions([]);
        setAiPrompt('');
        setShowAdvanced(true);
    };

    const filteredIcons = useMemo(() => {
        if (!searchQuery) return ICON_CATEGORIES;
        const lower = searchQuery.toLowerCase();
        const result: Record<string, string[]> = {};
        Object.entries(ICON_CATEGORIES).forEach(([cat, icons]) => {
            const matches = icons.filter(i => i.toLowerCase().includes(lower));
            if (matches.length > 0) result[cat] = matches;
        });
        return result;
    }, [searchQuery]);

    const filteredEmojis = useMemo(() => {
        return EMOJIS;
    }, [searchQuery]);

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0) {
            setTargetCount(val);
        } else if (e.target.value === '') {
            setTargetCount(0);
        }
    };

    const toggleDay = (dayIndex: number) => {
        setFrequencyDays(prev => {
            if (prev.includes(dayIndex)) return prev.filter(d => d !== dayIndex);
            return [...prev, dayIndex].sort();
        });
    };

    // 1 = Monday, ..., 6 = Saturday, 0 = Sunday
    const weekDays = language === 'ru'
        ? [{ label: 'Пн', id: 1 }, { label: 'Вт', id: 2 }, { label: 'Ср', id: 3 }, { label: 'Чт', id: 4 }, { label: 'Пт', id: 5 }, { label: 'Сб', id: 6 }, { label: 'Вс', id: 0 }]
        : [{ label: 'Mon', id: 1 }, { label: 'Tue', id: 2 }, { label: 'Wed', id: 3 }, { label: 'Thu', id: 4 }, { label: 'Fri', id: 5 }, { label: 'Sat', id: 6 }, { label: 'Sun', id: 0 }];

    const targetPresets: number[] = [1, 5, 10, 30, 45, 60, 100];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t.editTitle : t.newTitle} closeOnBackdropClick={closeOnBackdropClick} enableNavigation>
            <div className="space-y-5 pt-2">

                {/* Type Switcher */}
                {!initialData && (
                    <div className="flex p-1 bg-surfaceHighlight rounded-xl mb-4">
                        <button
                            onClick={() => setType('habit')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === 'habit' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                        >
                            <Repeat size={14} /> {t.typeHabit}
                        </button>
                        <button
                            onClick={() => setType('task')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === 'task' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                        >
                            <CheckSquare size={14} /> {t.typeTask}
                        </button>
                    </div>
                )}


                {!initialData && !name && type === 'habit' && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-2 pl-1">
                            <LayoutTemplate size={12} /> {t.templates}
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar -mx-1 px-1 snap-x">
                            {HABIT_TEMPLATES.map((tpl, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleApplyTemplate(tpl)}
                                    className="flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-xl bg-surfaceHighlight/30 border border-borderSubtle hover:bg-surfaceHighlight hover:border-brand/30 transition-all active:scale-95 snap-start shrink-0"
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: tpl.color }}>
                                        <Icon name={tpl.icon} size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold text-textPrimary text-center truncate w-full">{language === 'ru' ? tpl.name : tpl.nameEn}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Live Preview Card */}
                <div className="bg-surface rounded-2xl p-4 border border-borderSubtle shadow-sm flex items-center gap-4 relative overflow-hidden transition-all">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: color }}></div>
                    <div
                        className={`w-14 h-14 ${type === 'task' ? 'rounded-lg' : 'rounded-2xl'} flex items-center justify-center text-white shadow-lg transition-transform duration-300 transform`}
                        style={{ backgroundColor: color }}
                    >
                        <Icon name={icon} size={28} />
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent border-none text-xl font-black text-textPrimary placeholder:text-textSecondary/40 focus:ring-0 p-0"
                            placeholder={t.namePlaceholder}
                            autoFocus={!initialData}
                        />
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-medium text-textSecondary placeholder:text-textSecondary/40 focus:ring-0 p-0 mt-0.5"
                            placeholder={t.descPlaceholder}
                        />
                    </div>
                </div>

                {/* AI Suggestion Input (Habits only) */}
                {!initialData && type === 'habit' && (
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="gemini-input flex-1 flex items-center gap-2 px-4 py-2.5">
                                <Sparkles size={16} className="text-brand animate-pulse-slow" />
                                <input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder={t.aiInputPlaceholder}
                                    className="flex-1 bg-transparent text-sm outline-none text-textPrimary placeholder:text-textSecondary/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
                                />
                            </div>

                            <button
                                onClick={handleAiSuggest}
                                disabled={isGenerating || !aiPrompt}
                                className="gemini-glow-sm gemini-glow-bare bg-brand text-white w-10 rounded-xl flex items-center justify-center font-bold disabled:opacity-50 hover:bg-brand/90 transition-colors"
                            >
                                {isGenerating ? <RotateCcw className="animate-spin" size={18} /> : <ArrowRight size={20} />}
                            </button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-surface border border-borderSubtle rounded-xl shadow-xl p-2 animate-slideUp max-h-48 overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => applySuggestion(s)} className="w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:bg-surfaceHighlight transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-surfaceHighlight group-hover:bg-surface flex items-center justify-center text-brand"><Icon name={s.icon} size={16} /></div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-textPrimary truncate">{s.name}</div>
                                            <div className="text-[10px] text-textSecondary truncate">{s.description}</div>
                                            <div className="flex gap-1 mt-1">
                                                {s.category && <span className="text-[9px] bg-brand/10 text-brand px-1 rounded">{s.category}</span>}
                                                {s.targetCount && <span className="text-[9px] bg-brand/10 text-brand px-1 rounded">{s.targetCount}x {s.frequency}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === Atomic Habits Tips (only when creating new habit with name) === */}
                {!initialData && type === 'habit' && name && (
                    <div className="space-y-2 animate-fadeIn">
                        {/* 2-Minute Rule Tip */}
                        <div className="flex items-start gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                            <span className="text-base mt-0.5">⏱️</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
                                    {language === 'ru' ? 'Правило 2 Минут' : '2-Minute Rule'}
                                </div>
                                <p className="text-[10px] text-textSecondary leading-relaxed">
                                    {language === 'ru'
                                        ? '«Начни с версии, которая займёт 2 минуты.» Вместо «Читать 30 мин» → «Открыть книгу и прочитать 1 страницу».'
                                        : '"Scale it down to 2 minutes." Instead of "Read 30 min" → "Open the book and read 1 page".'
                                    }
                                </p>
                            </div>
                        </div>
                        {/* Habit Stacking Tip */}
                        <div className="flex items-start gap-2.5 p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl">
                            <span className="text-base mt-0.5">🔗</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-0.5">
                                    {language === 'ru' ? 'Стекинг привычек' : 'Habit Stacking'}
                                </div>
                                <p className="text-[10px] text-textSecondary leading-relaxed">
                                    {language === 'ru'
                                        ? '«После [текущая привычка], я буду [новая привычка].» Привяжи к тому, что уже делаешь!'
                                        : '"After [current habit], I will [new habit]." Attach it to something you already do!'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Color Picker (Horizontal Scroll) */}
                <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-2.5 pl-1">
                        <Palette size={12} /> {t.color}
                    </label>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                        {AVAILABLE_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-9 h-9 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-textPrimary ring-offset-surface' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            >
                                {color === c && <Check size={16} className="text-white/80" strokeWidth={4} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Icon Picker */}
                <div className="bg-surfaceHighlight/20 border border-borderSubtle rounded-2xl overflow-hidden h-60 flex flex-col">
                    {/* Picker Header */}
                    <div className="p-3 border-b border-borderSubtle bg-surface flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 bg-surfaceHighlight px-2.5 py-1.5 rounded-lg flex-1">
                            <Search size={14} className="text-textSecondary" />
                            <input
                                type="text"
                                placeholder={t.search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-xs w-full outline-none text-textPrimary placeholder:text-textSecondary/50"
                            />
                        </div>
                        <div className="flex bg-surfaceHighlight rounded-lg p-0.5 shrink-0">
                            <button onClick={() => setActiveTab('icon')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${activeTab === 'icon' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary'}`}><Smile size={14} /></button>
                            <button onClick={() => setActiveTab('emoji')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${activeTab === 'emoji' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary'}`}>Aa</button>
                        </div>
                    </div>

                    {/* Icons Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                        {activeTab === 'icon' ? (
                            <div className="space-y-4">
                                {(Object.entries(filteredIcons) as [string, string[]][]).map(([cat, icons]) => (
                                    <div key={cat}>
                                        <div className="text-[10px] text-textSecondary uppercase font-bold mb-2 opacity-60 sticky top-0 bg-surface/95 backdrop-blur py-1 z-10">{cat}</div>
                                        <AnimatedList className="grid grid-cols-6 gap-2">
                                            {icons.map(iconName => (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setIcon(iconName)}
                                                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${icon === iconName ? 'bg-textPrimary text-background shadow-lg scale-110' : 'text-textSecondary bg-surface hover:bg-surfaceHighlight hover:text-textPrimary'}`}
                                                >
                                                    <Icon name={iconName} size={18} />
                                                </button>
                                            ))}
                                        </AnimatedList>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <AnimatedList className="grid grid-cols-7 gap-1">
                                {filteredEmojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => setIcon(emoji)}
                                        className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all ${icon === emoji ? 'bg-surface ring-2 ring-borderSubtle' : 'hover:bg-surface/50'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </AnimatedList>
                        )}
                    </div>
                </div>

                {/* Advanced Settings Accordion */}
                <div className="space-y-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-xs font-bold text-textSecondary uppercase tracking-wider hover:text-textPrimary transition-colors"
                    >
                        <ChevronRight size={14} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                        {t.advanced}
                    </button>

                    {showAdvanced && (
                        <div className="grid grid-cols-1 gap-3 animate-slideUp overflow-hidden">
                            <div className="grid grid-cols-1 gap-3 overflow-hidden">
                                {/* Task specific: Date Picker */}
                                {type === 'task' && (
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Calendar size={14} /> <span className="text-[10px] font-bold uppercase">{t.date}</span>
                                        </div>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full max-w-full bg-surfaceHighlight rounded-lg px-3 py-2 text-sm text-textPrimary font-bold border-none appearance-none"
                                            style={{
                                                WebkitAppearance: 'none',
                                                minHeight: '40px'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Frequency & Days Selection (Only for Habits) */}
                                {type === 'habit' && (
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Repeat size={14} /> <span className="text-[10px] font-bold uppercase">{t.frequency}</span>
                                        </div>

                                        {/* Frequency Toggle */}
                                        <div className="flex bg-surfaceHighlight rounded-lg p-0.5 mb-3">
                                            {['daily', 'weekly', 'monthly', 'specific_days'].map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFrequency(f as any)}
                                                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${frequency === f ? 'bg-brand text-white shadow-sm' : 'text-textSecondary'}`}
                                                >
                                                    {f === 'daily' ? t.freqDaily :
                                                        f === 'weekly' ? t.freqWeekly :
                                                            f === 'monthly' ? t.freqMonthly :
                                                                t.freqDays}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Specific Days Selector */}
                                        {frequency === 'specific_days' && (
                                            <div className="animate-fadeIn mt-2">
                                                <div className="text-[10px] font-bold text-textSecondary uppercase mb-2">{t.selectDays}</div>
                                                <div className="flex justify-between gap-1">
                                                    {weekDays.map((day) => {
                                                        const isSelected = frequencyDays.includes(day.id);
                                                        return (
                                                            <button
                                                                key={day.id}
                                                                onClick={() => toggleDay(day.id)}
                                                                className={`
                                                            w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                                                            ${isSelected
                                                                        ? 'bg-brand text-white shadow-md scale-105'
                                                                        : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}
                                                        `}
                                                                style={{ backgroundColor: isSelected ? color : undefined }}
                                                            >
                                                                {day.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Goal (Target) - Improved with Quick Buttons */}
                                    {type === 'habit' && (
                                        <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                            <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                                <Hash size={14} /> <span className="text-[10px] font-bold uppercase">{t.target}</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-surfaceHighlight rounded-lg px-2 py-0.5 relative mb-2">
                                                <button onClick={() => setTargetCount(Math.max(1, targetCount - 1))} className="w-6 h-6 flex items-center justify-center text-textPrimary font-bold hover:bg-surface rounded text-xs">-</button>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={targetCount || ''}
                                                    onChange={handleTargetChange}
                                                    className="bg-transparent border-none text-center font-bold text-sm text-textPrimary w-16 p-0 focus:ring-0"
                                                />

                                                <button onClick={() => setTargetCount((targetCount || 0) + 1)} className="w-6 h-6 flex items-center justify-center text-textPrimary font-bold hover:bg-surface rounded text-xs">+</button>
                                            </div>
                                            {/* Quick Targets */}
                                            <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                                                {targetPresets.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setTargetCount(t)}
                                                        className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${targetCount === t ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Categories */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <div className="text-[10px] font-bold text-textSecondary uppercase mb-2">{t.category}</div>
                                        <input
                                            type="text"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            placeholder="..."
                                            className="w-full bg-surfaceHighlight border-none rounded-lg px-3 py-1.5 text-xs text-textPrimary font-bold focus:ring-1 focus:ring-brand placeholder:text-textSecondary/50"
                                        />
                                        {/* Category Presets */}
                                        <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1 custom-scrollbar -mx-1 px-1">
                                            {CATEGORIES.map((cat: string) => {
                                                // Translate category for button label
                                                const cats = (translations[language] as any)?.categories;
                                                const displayCat = cats ? (cats[cat] || cat) : cat;
                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setCategory(cat)} // Keep original key for saving
                                                        className={`whitespace-nowrap px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${category === cat ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'}`}
                                                    >
                                                        {displayCat}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Time and Duration */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Clock size={14} /> <span className="text-[10px] font-bold uppercase">{t.timeDuration}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="time"
                                                    value={time}
                                                    onChange={(e) => setTime(e.target.value)}
                                                    className="w-full bg-surfaceHighlight rounded-lg px-3 py-1.5 text-xs text-textPrimary font-bold border-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 bg-surfaceHighlight rounded-lg px-3 py-1.5">
                                                <input
                                                    type="number"
                                                    value={duration}
                                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-textPrimary font-bold"
                                                    placeholder="30"
                                                />
                                                <span className="text-[10px] text-textSecondary">{t.min}</span>
                                            </div>
                                        </div>
                                        {/* Reminder Time */}
                                        <div className="mt-3 pt-3 border-t border-borderSubtle/50">
                                            <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                                <Bell size={14} />
                                                <span className="text-[10px] font-bold uppercase">
                                                    {language === 'ru' ? 'Напоминание' : 'Reminder'}
                                                </span>
                                            </div>
                                            <input
                                                type="time"
                                                value={reminderTime}
                                                onChange={(e) => setReminderTime(e.target.value)}
                                                placeholder="--:--"
                                                className="w-full bg-surfaceHighlight rounded-lg px-3 py-1.5 text-xs text-textPrimary font-bold border-none"
                                            />
                                            <p className="text-[9px] text-textSecondary mt-1 opacity-70">
                                                {language === 'ru' ? 'Push-уведомление в это время' : 'Push notification at this time'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Place - Implementation Intentions */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <MapPin size={14} /> <span className="text-[10px] font-bold uppercase">{language === 'ru' ? 'Место' : 'Place'}</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={place}
                                            onChange={(e) => setPlace(e.target.value)}
                                            placeholder={language === 'ru' ? 'напр. в спальне, на кухне' : 'e.g. bedroom, kitchen'}
                                            className="w-full bg-surfaceHighlight rounded-lg px-3 py-1.5 text-xs text-textPrimary font-bold border-none placeholder:text-textSecondary/50"
                                        />
                                        <p className="text-[9px] text-textSecondary mt-1.5 opacity-70">
                                            {language === 'ru' ? 'Где будешь выполнять?' : 'Where will you do it?'}
                                        </p>
                                    </div>

                                    {/* Cost / Expense Tracking */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Banknote size={14} /> <span className="text-[10px] font-bold uppercase">{language === 'ru' ? 'Цена' : 'Cost'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-surfaceHighlight rounded-lg px-3 py-1.5">
                                            <span className="text-sm font-bold text-green-500">{getCurrencySymbol(currency)}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={cost}
                                                onChange={(e) => setCost(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-xs text-textPrimary font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-[9px] text-textSecondary mt-1.5 opacity-70">
                                            {language === 'ru' ? 'Стоимость за выполнение' : 'Cost per completion'}
                                        </p>
                                    </div>

                                    {/* Difficulty / Rarity */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Star size={14} /> <span className="text-[10px] font-bold uppercase">{language === 'ru' ? 'Сложность' : 'Difficulty'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setDifficulty(level as 1 | 2 | 3 | 4 | 5)}
                                                    className={`p-1.5 rounded-lg transition-all ${difficulty >= level ? 'scale-110' : 'opacity-30 hover:opacity-60'}`}
                                                >
                                                    <Star
                                                        size={18}
                                                        className={difficulty >= level ? 'fill-current' : ''}
                                                        style={{ color: level <= 1 ? '#a1a1aa' : level <= 2 ? '#22c55e' : level <= 3 ? '#3b82f6' : level <= 4 ? '#a855f7' : '#f97316' }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-textSecondary mt-1.5 opacity-70">
                                            {language === 'ru'
                                                ? ['Обычная', 'Необычная', 'Редкая', 'Эпическая', 'Легендарная'][difficulty - 1]
                                                : ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][difficulty - 1]
                                            }
                                        </p>
                                    </div>

                                    {/* Quick Tags */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2">
                                        <div className="flex items-center gap-2 mb-2 text-textSecondary">
                                            <Tag size={14} /> <span className="text-[10px] font-bold uppercase">{language === 'ru' ? 'Теги' : 'Tags'}</span>
                                        </div>
                                        {/* Selected Tags */}
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {tags.map(tag => {
                                                    const preset = TAG_PRESETS.find(p => `${p.emoji} ${p.label[language]}` === tag);
                                                    return (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-brand/15 text-brand border border-brand/20 hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/20 transition-all group"
                                                        >
                                                            {tag}
                                                            <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Preset Tags */}
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {TAG_PRESETS.map(preset => {
                                                const tagValue = `${preset.emoji} ${preset.label[language]}`;
                                                const isSelected = tags.includes(tagValue);
                                                return (
                                                    <button
                                                        key={tagValue}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setTags(prev => prev.filter(t => t !== tagValue));
                                                            } else {
                                                                setTags(prev => [...prev, tagValue]);
                                                            }
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${isSelected
                                                            ? 'bg-brand text-white shadow-sm scale-105'
                                                            : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight/80'
                                                            }`}
                                                    >
                                                        {tagValue}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {/* Custom Tag Input */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && tagInput.trim()) {
                                                        e.preventDefault();
                                                        const newTag = tagInput.trim();
                                                        if (!tags.includes(newTag)) {
                                                            setTags(prev => [...prev, newTag]);
                                                        }
                                                        setTagInput('');
                                                    }
                                                }}
                                                placeholder={language === 'ru' ? 'Свой тег...' : 'Custom tag...'}
                                                className="flex-1 bg-surfaceHighlight rounded-lg px-3 py-1.5 text-xs text-textPrimary font-bold border-none placeholder:text-textSecondary/50"
                                            />
                                            {tagInput.trim() && (
                                                <button
                                                    onClick={() => {
                                                        const newTag = tagInput.trim();
                                                        if (!tags.includes(newTag)) {
                                                            setTags(prev => [...prev, newTag]);
                                                        }
                                                        setTagInput('');
                                                    }}
                                                    className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors"
                                                >
                                                    +
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Keystone Habit Toggle */}
                                    <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-3 col-span-2 sm:col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsKeystone(!isKeystone)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${isKeystone
                                                ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-500/40'
                                                : 'hover:bg-surfaceHighlight'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isKeystone ? 'bg-amber-500/30' : 'bg-surfaceHighlight'
                                                }`}>
                                                <span className="text-lg">{isKeystone ? '🔑' : '⭐'}</span>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-xs font-bold text-textPrimary">
                                                    {language === 'ru' ? 'Ключевая привычка' : 'Keystone Habit'}
                                                </p>
                                                <p className="text-[9px] text-textSecondary">
                                                    {language === 'ru' ? 'Влияет на другие привычки' : 'Influences other habits'}
                                                </p>
                                            </div>
                                            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isKeystone ? 'bg-amber-500' : 'bg-surfaceHighlight border border-borderSubtle'
                                                }`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isKeystone ? 'translate-x-4' : 'translate-x-0'
                                                    }`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        disabled={!name}
                        className="w-full bg-brand text-white font-black py-4 rounded-2xl text-base hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2"
                    >
                        {initialData ? t.save : t.create}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default HabitFormModal;