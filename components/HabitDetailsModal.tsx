
import React, { useState, useMemo, useEffect } from 'react';
import Modal, { useModalNav } from './Modal';
import { Habit, getIdentityBadge, Supplement, SkincareProduct, PhotoEntry } from '../types';
import { ChevronLeft, ChevronRight, Trophy, Flame, CheckCircle2, Trash2, Edit2, Archive, BookOpen, Layers, Award, ArrowRight, Pill, Droplets, Camera, ImagePlus, X, Timer, Compass, Sparkles } from 'lucide-react';
import { GradientLineChart } from './SimpleCharts';
import ReadingExtension from './ReadingExtension';
import SubItemsList from './SubItemsList';
import SupplementsManager from './SupplementsManager';
import SkincareManager from './SkincareManager';
import PomodoroTimer from './PomodoroTimer';

interface HabitDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    habit: Habit;
    onToggleDate: (date: string, e?: React.MouseEvent | React.TouchEvent) => void;
    onEdit: () => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Habit>) => void; // New prop for persistence
    onOpenTransformation?: () => void;
    language?: 'ru' | 'en';
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// =============================================
// QuickNavButtons — iOS-style navigation rows
// Uses useModalNav() to push sub-pages
// =============================================

interface QuickNavButtonsProps {
    habit: Habit;
    onUpdate: (id: string, updates: Partial<Habit>) => void;
    language: 'ru' | 'en';
    todayStr: string;
    isReadingHabit: boolean;
    isSupplementsHabit: boolean;
    isSkincareHabit: boolean;
    enableReadingMode: () => void;
    enableSupplementsMode: () => void;
    enableSkincareMode: () => void;
    onOpenTransformation?: () => void;
}

const NavRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    badge?: number;
    color?: string;
    onClick: () => void;
}> = ({ icon, label, badge, color = 'text-brand', onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-borderSubtle hover:bg-surfaceHighlight/80 transition-all active:scale-[0.98] group"
    >
        <div className={`${color}`}>{icon}</div>
        <span className="flex-1 text-left text-sm font-semibold text-textPrimary">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="text-[10px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-bold">{badge}</span>
        )}
        <ChevronRight size={16} className="text-textSecondary/50 group-hover:text-textSecondary transition-colors" />
    </button>
);

const QuickNavButtons: React.FC<QuickNavButtonsProps> = ({
    habit, onUpdate, language, todayStr,
    isReadingHabit, isSupplementsHabit, isSkincareHabit,
    enableReadingMode, enableSupplementsMode, enableSkincareMode,
    onOpenTransformation,
}) => {
    const { push } = useModalNav();

    return (
        <div className="space-y-2">
            {/* 5-Stage Intention & Subconscious Transformation */}
            {onOpenTransformation && (
                <NavRow
                    icon={<Compass size={18} />}
                    label={language === 'ru' ? 'Трансформация убеждения (5 Стадий)' : 'Subconscious Transformation'}
                    color="text-amber-500"
                    onClick={onOpenTransformation}
                />
            )}

            {/* Sub-Items */}
            {habit.extension?.type !== 'reading' && (
                <NavRow
                    icon={<Layers size={18} />}
                    label={language === 'ru' ? 'Элементы' : 'Items'}
                    badge={habit.items?.length}
                    color="text-purple-500"
                    onClick={() => push({
                        key: 'sub-items',
                        title: language === 'ru' ? 'Элементы' : 'Items',
                        content: (
                            <SubItemsList
                                items={habit.items || []}
                                onUpdate={(items) => onUpdate(habit.id, { items })}
                                language={language}
                            />
                        )
                    })}
                />
            )}

            {/* Photo Journal */}
            <NavRow
                icon={<Camera size={18} />}
                label={language === 'ru' ? 'Фото-дневник' : 'Photo Journal'}
                badge={habit.photoJournal?.length}
                color="text-cyan-500"
                onClick={() => push({
                    key: 'photo-journal',
                    title: language === 'ru' ? 'Фото-дневник' : 'Photo Journal',
                    content: (
                        <PhotoJournalPage habit={habit} onUpdate={onUpdate} language={language} todayStr={todayStr} />
                    )
                })}
            />

            {/* Reading Extension */}
            {(habit.extension?.type === 'reading' || (isReadingHabit && !habit.extension?.type)) && (
                <NavRow
                    icon={<BookOpen size={18} />}
                    label={language === 'ru' ? 'Библиотека' : 'Library'}
                    color="text-brand"
                    onClick={() => {
                        if (!habit.extension?.type) enableReadingMode();
                        push({
                            key: 'reading',
                            title: language === 'ru' ? 'Библиотека' : 'Library',
                            content: (
                                <ReadingExtension
                                    habit={habit}
                                    onUpdate={onUpdate}
                                    language={language}
                                />
                            )
                        });
                    }}
                />
            )}

            {/* Supplements */}
            {(habit.extension?.type === 'supplements' || (isSupplementsHabit && !habit.extension?.type)) && (
                <NavRow
                    icon={<Pill size={18} />}
                    label={language === 'ru' ? 'Добавки' : 'Supplements'}
                    color="text-purple-400"
                    onClick={() => {
                        if (!habit.extension?.type) enableSupplementsMode();
                        push({
                            key: 'supplements',
                            title: language === 'ru' ? 'Добавки' : 'Supplements',
                            content: (
                                <SupplementsManager
                                    supplements={habit.extension?.data?.supplements || []}
                                    onSupplementsChange={(supplements: Supplement[]) => onUpdate(habit.id, {
                                        extension: { ...habit.extension!, data: { ...habit.extension!.data, supplements } }
                                    })}
                                    language={language}
                                    todayStr={todayStr}
                                />
                            )
                        });
                    }}
                />
            )}

            {/* Skincare */}
            {(habit.extension?.type === 'skincare' || (isSkincareHabit && !habit.extension?.type)) && (
                <NavRow
                    icon={<Droplets size={18} />}
                    label={language === 'ru' ? 'Уход' : 'Skincare'}
                    color="text-pink-400"
                    onClick={() => {
                        if (!habit.extension?.type) enableSkincareMode();
                        push({
                            key: 'skincare',
                            title: language === 'ru' ? 'Уход' : 'Skincare',
                            content: (
                                <SkincareManager
                                    products={habit.extension?.data?.skincare || []}
                                    onProductsChange={(skincare: SkincareProduct[]) => onUpdate(habit.id, {
                                        extension: { ...habit.extension!, data: { ...habit.extension!.data, skincare } }
                                    })}
                                    language={language}
                                    todayStr={todayStr}
                                />
                            )
                        });
                    }}
                />
            )}
        </div>
    );
};

// =============================================
// PhotoJournalPage — pushed as nested page
// =============================================
const PhotoJournalPage: React.FC<{
    habit: Habit;
    onUpdate: (id: string, updates: Partial<Habit>) => void;
    language: 'ru' | 'en';
    todayStr: string;
}> = ({ habit, onUpdate, language, todayStr }) => {
    const [showUpload, setShowUpload] = React.useState(false);
    const [photoNote, setPhotoNote] = React.useState('');
    const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
    const [expandedPhoto, setExpandedPhoto] = React.useState<string | null>(null);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 400;
                let w = img.width, h = img.height;
                if (w > h) { h = (h / w) * MAX; w = MAX; } else { w = (w / h) * MAX; h = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                setPhotoPreview(canvas.toDataURL('image/webp', 0.7));
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const savePhoto = () => {
        if (!photoPreview) return;
        const entry: PhotoEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            date: todayStr,
            note: photoNote.trim() || undefined,
            imageData: photoPreview,
            createdAt: new Date().toISOString(),
        };
        onUpdate(habit.id, {
            photoJournal: [...(habit.photoJournal || []), entry]
        });
        setPhotoPreview(null);
        setPhotoNote('');
        setShowUpload(false);
    };

    const deletePhoto = (photoId: string) => {
        onUpdate(habit.id, {
            photoJournal: (habit.photoJournal || []).filter(p => p.id !== photoId)
        });
    };

    return (
        <div className="space-y-4">
            <button
                onClick={() => setShowUpload(!showUpload)}
                className="w-full py-3 rounded-xl bg-cyan-500/10 text-cyan-500 font-bold text-xs hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
            >
                <ImagePlus size={16} />
                {language === 'ru' ? 'Добавить фото' : 'Add Photo'}
            </button>

            {showUpload && (
                <div className="p-3 bg-surfaceHighlight/50 rounded-xl border border-cyan-500/20 space-y-3">
                    {!photoPreview ? (
                        <label className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:bg-cyan-500/5 transition-colors">
                            <Camera size={32} className="text-cyan-500/50 mb-2" />
                            <span className="text-xs font-bold text-textSecondary">
                                {language === 'ru' ? 'Нажмите для загрузки фото' : 'Tap to upload photo'}
                            </span>
                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
                        </label>
                    ) : (
                        <div className="relative">
                            <img src={photoPreview} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
                            <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <input
                        type="text" value={photoNote} onChange={(e) => setPhotoNote(e.target.value)}
                        placeholder={language === 'ru' ? 'Заметка к фото...' : 'Photo caption...'}
                        className="w-full bg-surfaceHighlight rounded-lg px-3 py-2 text-xs text-textPrimary font-bold border-none placeholder:text-textSecondary/50"
                    />
                    <button onClick={savePhoto} disabled={!photoPreview}
                        className="w-full py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-xs hover:bg-cyan-600 transition-colors disabled:opacity-40"
                    >
                        {language === 'ru' ? 'Сохранить' : 'Save'}
                    </button>
                </div>
            )}

            {(habit.photoJournal?.length || 0) > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                    {[...(habit.photoJournal || [])].reverse().map(entry => (
                        <div key={entry.id} className="relative group">
                            <img
                                src={entry.imageData} alt={entry.note || ''}
                                className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:scale-[1.03] transition-transform"
                                onClick={() => setExpandedPhoto(expandedPhoto === entry.id ? null : entry.id)}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-1.5">
                                <p className="text-[9px] text-white/90 font-bold truncate">{entry.date}</p>
                                {entry.note && <p className="text-[8px] text-white/60 truncate">{entry.note}</p>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deletePhoto(entry.id); }}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                            >
                                <X size={10} />
                            </button>
                            {expandedPhoto === entry.id && (
                                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setExpandedPhoto(null)}>
                                    <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
                                        <img src={entry.imageData} alt={entry.note || ''} className="w-full rounded-2xl" />
                                        <div className="mt-3 text-center">
                                            <p className="text-white/80 text-sm font-bold">{entry.date}</p>
                                            {entry.note && <p className="text-white/60 text-xs mt-1">{entry.note}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !showUpload && (
                <p className="text-xs text-textSecondary/60 italic text-center py-4">
                    {language === 'ru' ? 'Фотографий пока нет — начните фиксировать прогресс!' : 'No photos yet — start capturing your progress!'}
                </p>
            )}
        </div>
    );
};


const HabitDetailsModal: React.FC<HabitDetailsModalProps> = ({
    isOpen, onClose, habit, onToggleDate, onDelete, onEdit, onArchive, onUpdate, onOpenTransformation, language = 'ru'
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    // Local habit state to reflect extension updates immediately
    const [localHabit, setLocalHabit] = useState(habit);

    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    const [showPomodoro, setShowPomodoro] = useState(false);

    // Listen for voice assistant startPomodoro event
    useEffect(() => {
        const handler = (e: Event) => {
            setShowPomodoro(true);
        };
        window.addEventListener('startPomodoro', handler);
        return () => window.removeEventListener('startPomodoro', handler);
    }, []);

    // --- Handlers ---
    const handleUpdateHabit = (habitId: string, updates: Partial<Habit>) => {
        // 1. Optimistic update for immediate UI feedback
        setLocalHabit(prev => ({ ...prev, ...updates }));

        // 2. Propagate to parent (App.tsx) for persistence (LocalStorage + Cloud)
        onUpdate(habitId, updates);
    };

    const stats = useMemo(() => {
        const total = localHabit.completedDates.length;
        const sortedDates = [...localHabit.completedDates].sort();
        let maxStreak = 0;
        let tempStreak = 0;
        const timeStamps = sortedDates.map(d => new Date(d).setHours(12, 0, 0, 0));

        if (timeStamps.length > 0) {
            tempStreak = 1;
            maxStreak = 1;
            for (let i = 1; i < timeStamps.length; i++) {
                const diff = (timeStamps[i] - timeStamps[i - 1]) / (1000 * 60 * 60 * 24);
                if (Math.round(diff) === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
                if (tempStreak > maxStreak) maxStreak = tempStreak;
            }
        }

        const todayStr = getLocalDateString(new Date());
        const yestStr = getLocalDateString(new Date(Date.now() - 86400000));
        const isAlive = localHabit.completedDates.includes(todayStr) || localHabit.completedDates.includes(yestStr);

        let currentStreak = 0;
        if (isAlive) {
            let check = new Date();
            if (!localHabit.completedDates.includes(todayStr)) check.setDate(check.getDate() - 1);
            while (true) {
                if (localHabit.completedDates.includes(getLocalDateString(check))) {
                    currentStreak++;
                    check.setDate(check.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return { total, maxStreak, currentStreak };
    }, [localHabit.completedDates]);

    const chartData = useMemo(() => {
        const months = [];
        const counts = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = d.toLocaleString(locale, { month: 'short' });
            months.push(monthKey);

            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const count = localHabit.completedDates.filter(dateStr => {
                const date = new Date(dateStr);
                return date >= startOfMonth && date <= endOfMonth;
            }).length;

            counts.push(count);
        }
        return { labels: months, data: counts };
    }, [localHabit.completedDates, locale]);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            days.push(getLocalDateString(d));
        }
        return days;
    }, [currentDate]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const weekDays = language === 'ru' ? ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Detect if this is a reading habit
    const isReadingHabit = localHabit.extension?.type === 'reading' ||
        (localHabit.category && ['Обучение', 'Education'].includes(localHabit.category)) ||
        localHabit.name.toLowerCase().includes('read') ||
        localHabit.name.toLowerCase().includes('книг') ||
        localHabit.name.toLowerCase().includes('чит');

    const enableReadingMode = () => {
        handleUpdateHabit(localHabit.id, {
            extension: { type: 'reading', data: { books: [] } }
        });
    };

    // Detect if this is a supplements/health habit
    const isSupplementsHabit = localHabit.extension?.type === 'supplements' ||
        (localHabit.category && ['Здоровье', 'Health', 'Уход', 'Self-care'].includes(localHabit.category)) ||
        localHabit.name.toLowerCase().includes('витамин') ||
        localHabit.name.toLowerCase().includes('бад') ||
        localHabit.name.toLowerCase().includes('supplement') ||
        localHabit.name.toLowerCase().includes('pill');

    const enableSupplementsMode = () => {
        handleUpdateHabit(localHabit.id, {
            extension: { type: 'supplements', data: { supplements: [] } }
        });
    };

    // Detect if this is a skincare/beauty habit
    const isSkincareHabit = localHabit.extension?.type === 'skincare' ||
        (localHabit.category && ['Красота', 'Beauty', 'Уход', 'Self-care', 'Skincare'].includes(localHabit.category)) ||
        localHabit.name.toLowerCase().includes('крем') ||
        localHabit.name.toLowerCase().includes('уход') ||
        localHabit.name.toLowerCase().includes('кожа') ||
        localHabit.name.toLowerCase().includes('лицо') ||
        localHabit.name.toLowerCase().includes('маска') ||
        localHabit.name.toLowerCase().includes('макияж') ||
        localHabit.name.toLowerCase().includes('косметик') ||
        localHabit.name.toLowerCase().includes('skincare') ||
        localHabit.name.toLowerCase().includes('beauty') ||
        localHabit.name.toLowerCase().includes('face') ||
        localHabit.name.toLowerCase().includes('mask') ||
        localHabit.name.toLowerCase().includes('cosmetic') ||
        localHabit.name.toLowerCase().includes('routine');

    const enableSkincareMode = () => {
        handleUpdateHabit(localHabit.id, {
            extension: { type: 'skincare', data: { skincare: [] } }
        });
    };

    const todayStr = getLocalDateString(new Date());

    // --- Photo Journal ---
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [photoNote, setPhotoNote] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Compress to max 400px thumbnail
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 400;
                let w = img.width, h = img.height;
                if (w > h) { h = (h / w) * MAX; w = MAX; } else { w = (w / h) * MAX; h = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                setPhotoPreview(canvas.toDataURL('image/webp', 0.7));
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const savePhoto = () => {
        if (!photoPreview) return;
        const entry: PhotoEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            date: todayStr,
            note: photoNote.trim() || undefined,
            imageData: photoPreview,
            createdAt: new Date().toISOString(),
        };
        handleUpdateHabit(localHabit.id, {
            photoJournal: [...(localHabit.photoJournal || []), entry]
        });
        setPhotoPreview(null);
        setPhotoNote('');
        setShowPhotoUpload(false);
    };

    const deletePhoto = (photoId: string) => {
        handleUpdateHabit(localHabit.id, {
            photoJournal: (localHabit.photoJournal || []).filter(p => p.id !== photoId)
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={localHabit.name} enableNavigation>
            <div className="space-y-6">

                {/* Header Info */}
                <div className="flex items-center justify-between">
                    <div>
                        {localHabit.description && (
                            <p className="text-textSecondary text-sm">{localHabit.description}</p>
                        )}
                        {localHabit.category && (
                            <span className="inline-block mt-2 text-[10px] bg-surfaceHighlight text-textSecondary px-2 py-0.5 rounded border border-borderSubtle">{localHabit.category}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Pomodoro Button */}
                        <button
                            onClick={() => setShowPomodoro(true)}
                            className="p-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-orange-500 transition-colors"
                            title={language === 'ru' ? 'Помодоро' : 'Pomodoro'}
                        >
                            <Timer size={18} />
                        </button>
                        {/* Archive */}
                        <button
                            onClick={() => { onArchive(localHabit.id); onClose(); }}
                            className="p-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
                            title={language === 'ru' ? 'В архив' : 'Archive'}
                        >
                            <Archive size={18} />
                        </button>
                    </div>
                </div>

                {/* Pomodoro Timer Overlay */}
                {showPomodoro && (
                    <PomodoroTimer
                        habitName={localHabit.name}
                        habitColor={localHabit.color}
                        defaultMinutes={localHabit.duration || 25}
                        onComplete={() => {
                            const today = getLocalDateString(new Date());
                            if (!localHabit.completedDates.includes(today)) {
                                onToggleDate(today);
                            }
                        }}
                        onClose={() => setShowPomodoro(false)}
                        language={language}
                    />
                )}

                {/* === Quick Navigation Buttons === */}
                <QuickNavButtons
                    habit={localHabit}
                    onUpdate={handleUpdateHabit}
                    language={language}
                    todayStr={todayStr}
                    isReadingHabit={isReadingHabit}
                    isSupplementsHabit={isSupplementsHabit}
                    isSkincareHabit={isSkincareHabit}
                    enableReadingMode={enableReadingMode}
                    enableSupplementsMode={enableSupplementsMode}
                    enableSkincareMode={enableSkincareMode}
                    onOpenTransformation={onOpenTransformation}
                />

                {/* Extensions and sub-items are now in QuickNavButtons above */}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-surfaceHighlight/30 p-3 rounded-xl border border-borderSubtle flex flex-col items-center justify-center text-center">
                        <Flame size={20} className="text-orange-500 mb-1" />
                        <span className="text-xl font-bold text-textPrimary">{stats.currentStreak}</span>
                        <span className="text-[10px] text-textSecondary uppercase">{language === 'ru' ? "Стрик" : "Streak"}</span>
                    </div>
                    <div className="bg-surfaceHighlight/30 p-3 rounded-xl border border-borderSubtle flex flex-col items-center justify-center text-center">
                        <Trophy size={20} className="text-yellow-500 mb-1" />
                        <span className="text-xl font-bold text-textPrimary">{stats.maxStreak}</span>
                        <span className="text-[10px] text-textSecondary uppercase">{language === 'ru' ? "Рекорд" : "Record"}</span>
                    </div>
                    <div className="bg-surfaceHighlight/30 p-3 rounded-xl border border-borderSubtle flex flex-col items-center justify-center text-center">
                        <CheckCircle2 size={20} className="text-green-500 mb-1" />
                        <span className="text-xl font-bold text-textPrimary">{stats.total}</span>
                        <span className="text-[10px] text-textSecondary uppercase">{language === 'ru' ? "Всего" : "Total"}</span>
                    </div>
                </div>

                {/* Identity Badge - Atomic Habits */}
                {(() => {
                    const badge = getIdentityBadge(localHabit);
                    if (!badge) return null;

                    return (
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                                    {badge.emoji}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-textSecondary">
                                        {language === 'ru' ? 'Ты теперь' : "You're now a"}
                                    </p>
                                    <p className="font-bold text-textPrimary text-base">
                                        {language === 'ru' ? badge.identity.ru : badge.identity.en} {badge.emoji}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                                            {language === 'ru' ? badge.levelLabel.ru : badge.levelLabel.en}
                                        </span>
                                        {badge.nextMilestone && (
                                            <span className="text-[10px] text-textSecondary flex items-center gap-1">
                                                <ArrowRight size={10} />
                                                {badge.daysToNext} {language === 'ru' ? 'дней до' : 'days to'} {badge.nextMilestone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Award size={24} className="text-purple-400" />
                            </div>
                        </div>
                    );
                })()}
                {/* Chart */}
                <div>
                    <h3 className="text-xs font-bold text-textSecondary mb-3 uppercase tracking-wider pl-1">{language === 'ru' ? "История по месяцам" : "Monthly History"}</h3>
                    <GradientLineChart
                        data={chartData.data.map((val, i) => ({ name: chartData.labels[i], value: val }))}
                        color={localHabit.color}
                        height={120}
                        showDots={true}
                    />
                </div>

                {/* Calendar */}
                <div className="bg-surfaceHighlight/20 rounded-2xl p-4 border border-borderSubtle">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-surfaceHighlight rounded-lg transition-colors text-textSecondary hover:text-textPrimary"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-textPrimary capitalize text-sm">{currentDate.toLocaleString(locale, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-surfaceHighlight rounded-lg transition-colors text-textSecondary hover:text-textPrimary"><ChevronRight size={20} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {weekDays.map((d, i) => (
                            <span key={i} className="text-xs text-textSecondary font-medium">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((dateStr, idx) => {
                            if (!dateStr) return <div key={idx} />;

                            const isCompleted = localHabit.completedDates.includes(dateStr);
                            const isToday = dateStr === getLocalDateString(new Date());
                            const dateObj = new Date(dateStr);

                            // Simple future check (ignoring time for simplicity in this context, or relying on dateStr comparison)
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const isFuture = dateObj > now;

                            return (
                                <button
                                    key={dateStr}
                                    disabled={isFuture}
                                    onClick={(e) => onToggleDate(dateStr, e)}
                                    className={`
                                aspect-square rounded-md text-[10px] font-bold flex items-center justify-center transition-all
                                ${isCompleted
                                            ? 'text-white shadow-sm scale-100'
                                            : `text-textSecondary ${isFuture ? 'opacity-30' : 'bg-surfaceHighlight/50 border border-transparent'}`
                                        }
                                ${isToday && !isCompleted ? 'ring-2 ring-brand text-brand' : ''}
                                ${isFuture ? 'cursor-default' : ''}
                            `}
                                    style={{
                                        backgroundColor: isCompleted ? localHabit.color : undefined,
                                        color: isCompleted ? (['#f8fafc', '#ffffff'].includes(localHabit.color) ? 'black' : 'white') : undefined
                                    }}
                                >
                                    {dateObj.getDate()}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Actions - Edit and Delete Buttons */}
                <div className="pt-4 border-t border-borderSubtle grid grid-cols-2 gap-3">
                    <button
                        onClick={onEdit}
                        className="py-3 rounded-xl border border-borderSubtle bg-surfaceHighlight/50 hover:bg-surfaceHighlight transition-colors flex items-center justify-center gap-2 text-sm font-medium text-textPrimary"
                    >
                        <Edit2 size={16} /> {language === 'ru' ? "Редактировать" : "Edit"}
                    </button>
                    <button
                        onClick={() => { onDelete(localHabit.id); onClose(); }}
                        className="py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Trash2 size={16} /> {language === 'ru' ? "Удалить" : "Delete"}
                    </button>
                </div>

            </div>
        </Modal>
    );
};

export default HabitDetailsModal;
