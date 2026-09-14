import React, { useState } from 'react';
import { Supplement, SUPPLEMENT_TIMING, SUPPLEMENT_FREQUENCY } from '../types';
import { Plus, Trash2, X, Check, Pill, Edit3, Archive, RotateCcw, Calendar, Sparkles } from 'lucide-react';
import { searchSupplements } from '../services/ai';

interface SupplementsManagerProps {
    supplements: Supplement[];
    onSupplementsChange: (supplements: Supplement[]) => void;
    language: 'ru' | 'en';
    todayStr: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const SUPPLEMENT_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

const SupplementsManager: React.FC<SupplementsManagerProps> = ({
    supplements,
    onSupplementsChange,
    language,
    todayStr
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        timing: 'morning' as Supplement['timing'],
        frequency: 'daily' as Supplement['frequency'],
        notes: '',
        color: SUPPLEMENT_COLORS[0]
    });

    // AI Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ name: string, dosage: string, timing: Supplement['timing'], frequency: Supplement['frequency'], description: string }>>([]);

    // Filter supplements by status
    const activeSupplements = supplements.filter(s => s.status !== 'finished');
    const finishedSupplements = supplements.filter(s => s.status === 'finished');

    const displayedSupplements = activeTab === 'active' ? activeSupplements : finishedSupplements;

    const takenToday = activeSupplements.filter(s => s.takenDates?.includes(todayStr)).length;
    const total = activeSupplements.length;
    const progress = total > 0 ? Math.round((takenToday / total) * 100) : 0;

    const toggleTaken = (id: string) => {
        onSupplementsChange(supplements.map(s => {
            if (s.id !== id) return s;
            const dates = s.takenDates || [];
            const newDates = dates.includes(todayStr)
                ? dates.filter(d => d !== todayStr)
                : [...dates, todayStr];
            return { ...s, takenDates: newDates };
        }));
    };

    const addSupplement = () => {
        if (!formData.name.trim()) return;
        const newSupplement: Supplement = {
            id: generateId(),
            name: formData.name.trim(),
            dosage: formData.dosage.trim(),
            timing: formData.timing,
            frequency: formData.frequency,
            status: 'active',
            startDate: todayStr,
            notes: formData.notes.trim() || undefined,
            color: formData.color,
            takenDates: []
        };
        onSupplementsChange([...supplements, newSupplement]);
        resetForm();
    };

    const updateSupplement = () => {
        if (!editingId || !formData.name.trim()) return;
        onSupplementsChange(supplements.map(s =>
            s.id === editingId ? {
                ...s,
                name: formData.name.trim(),
                dosage: formData.dosage.trim(),
                timing: formData.timing,
                frequency: formData.frequency,
                notes: formData.notes.trim() || undefined,
                color: formData.color
            } : s
        ));
        resetForm();
    };

    const finishCourse = (id: string) => {
        onSupplementsChange(supplements.map(s =>
            s.id === id ? { ...s, status: 'finished' as const, endDate: todayStr } : s
        ));
    };

    const restoreCourse = (id: string) => {
        onSupplementsChange(supplements.map(s =>
            s.id === id ? { ...s, status: 'active' as const, endDate: undefined } : s
        ));
    };

    const deleteSupplement = (id: string) => {
        onSupplementsChange(supplements.filter(s => s.id !== id));
    };

    const startEdit = (s: Supplement) => {
        setEditingId(s.id);
        setFormData({
            name: s.name,
            dosage: s.dosage,
            timing: s.timing,
            frequency: s.frequency || 'daily',
            notes: s.notes || '',
            color: s.color || SUPPLEMENT_COLORS[0]
        });
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', dosage: '', timing: 'morning', frequency: 'daily', notes: '', color: SUPPLEMENT_COLORS[0] });
        setSearchResults([]);
    };

    // AI Search functions
    const handleAiSearch = async () => {
        if (!formData.name.trim()) return;
        setIsSearching(true);
        const results = await searchSupplements(formData.name, language);
        setSearchResults(results);
        setIsSearching(false);
    };

    const applySearchResult = (res: { name: string, dosage: string, timing: Supplement['timing'], frequency: Supplement['frequency'], description: string }) => {
        setFormData({
            ...formData,
            name: res.name,
            dosage: res.dosage,
            timing: res.timing,
            frequency: res.frequency,
            notes: res.description
        });
        setSearchResults([]);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-3">
            {/* Header with tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Pill className="text-brand" size={20} />
                    <span className="font-bold text-textPrimary">
                        {language === 'ru' ? 'Добавки' : 'Supplements'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === 'active' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                    >
                        {language === 'ru' ? 'Активные' : 'Active'} ({activeSupplements.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                    >
                        {language === 'ru' ? 'История' : 'History'} ({finishedSupplements.length})
                    </button>
                </div>
            </div>

            {/* Progress bar - only for active */}
            {activeTab === 'active' && total > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-textSecondary">
                        <span>{language === 'ru' ? 'Сегодня' : 'Today'}</span>
                        <span>{takenToday}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Supplements list */}
            <div className="space-y-2">
                {displayedSupplements.map(s => {
                    const isTaken = s.takenDates?.includes(todayStr);
                    const timingInfo = SUPPLEMENT_TIMING[s.timing];
                    const freqInfo = SUPPLEMENT_FREQUENCY[s.frequency || 'daily'];
                    const isFinished = s.status === 'finished';

                    return (
                        <div
                            key={s.id}
                            className={`p-3 rounded-xl transition-all ${isFinished
                                ? 'bg-surfaceHighlight border border-borderSubtle opacity-70'
                                : isTaken
                                    ? 'bg-green-500/20 border border-green-500/30'
                                    : 'bg-surface border border-borderSubtle'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {!isFinished && (
                                    <button
                                        onClick={() => toggleTaken(s.id)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTaken ? 'bg-green-500 border-green-500' : 'border-textSecondary/40 hover:border-textSecondary/60'}`}
                                    >
                                        {isTaken && <Check size={14} className="text-white" />}
                                    </button>
                                )}
                                {isFinished && (
                                    <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check size={14} className="text-green-400" />
                                    </div>
                                )}
                                <span className="text-lg">{timingInfo.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${isTaken && !isFinished ? 'text-green-500 line-through' : 'text-textPrimary'}`}>
                                        {s.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-textSecondary">
                                        <span>{s.dosage}</span>
                                        <span>•</span>
                                        <span>{freqInfo.emoji} {freqInfo.label[language]}</span>
                                    </div>
                                    {isFinished && s.startDate && (
                                        <div className="flex items-center gap-1 text-xs text-textSecondary mt-1">
                                            <Calendar size={10} />
                                            <span>{formatDate(s.startDate)} → {formatDate(s.endDate)}</span>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: s.color || '#8b5cf6' }}
                                />
                                {!isFinished ? (
                                    <>
                                        <button
                                            onClick={() => startEdit(s)}
                                            className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight transition-all"
                                            title={language === 'ru' ? 'Редактировать' : 'Edit'}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => finishCourse(s.id)}
                                            className="p-1.5 rounded-lg text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/20 transition-all"
                                            title={language === 'ru' ? 'Завершить курс' : 'Finish course'}
                                        >
                                            <Archive size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => restoreCourse(s.id)}
                                            className="p-1.5 rounded-lg text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/20 transition-all"
                                            title={language === 'ru' ? 'Восстановить' : 'Restore'}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteSupplement(s.id)}
                                            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all"
                                            title={language === 'ru' ? 'Удалить' : 'Delete'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {displayedSupplements.length === 0 && !isAdding && (
                    <div className="text-center py-6 text-textSecondary text-sm">
                        {activeTab === 'active'
                            ? (language === 'ru' ? '💊 Добавьте первую добавку' : '💊 Add your first supplement')
                            : (language === 'ru' ? '📋 Нет завершённых курсов' : '📋 No finished courses')
                        }
                    </div>
                )}
            </div>

            {/* Add button - only for active tab */}
            {activeTab === 'active' && !isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-brand/40 bg-brand/5 text-brand font-medium text-sm hover:bg-brand/10 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    {language === 'ru' ? 'Добавить' : 'Add supplement'}
                </button>
            )}

            {/* Add/Edit form */}
            {isAdding && (
                <div className="p-4 rounded-xl bg-surface border border-borderSubtle space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-textPrimary">
                            {editingId ? (language === 'ru' ? 'Редактировать' : 'Edit') : (language === 'ru' ? 'Новая добавка' : 'New supplement')}
                        </span>
                        <button onClick={resetForm} className="p-1 text-textSecondary hover:text-textPrimary">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Name input with AI search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={language === 'ru' ? 'Название (напр. Vitamin D3)' : 'Name (e.g. Vitamin D3)'}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                            className="w-full px-3 py-2.5 pr-10 rounded-xl bg-surfaceHighlight text-textPrimary placeholder-textSecondary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                        <button
                            onClick={handleAiSearch}
                            disabled={isSearching || !formData.name.trim()}
                            className="gemini-glow-sm bg-surface absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand hover:bg-brand/20 rounded-lg transition-colors disabled:opacity-30"
                            title="AI Поиск"
                        >
                            {isSearching ? <RotateCcw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-1">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => applySearchResult(res)}
                                    className="w-full text-left p-2.5 bg-surfaceHighlight border border-borderSubtle rounded-xl hover:bg-brand/10 hover:border-brand/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-textPrimary">{res.name}</div>
                                            <div className="text-xs text-textSecondary">{res.dosage} • {SUPPLEMENT_TIMING[res.timing]?.label[language]} • {SUPPLEMENT_FREQUENCY[res.frequency]?.label[language]}</div>
                                            <div className="text-xs text-textSecondary mt-0.5">{res.description}</div>
                                        </div>
                                        <Plus size={14} className="text-brand opacity-0 group-hover:opacity-100" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder={language === 'ru' ? 'Дозировка (напр. 5000 IU)' : 'Dosage (e.g. 5000 IU)'}
                        value={formData.dosage}
                        onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-surfaceHighlight text-textPrimary placeholder-textSecondary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />

                    {/* Timing selector */}
                    <div>
                        <label className="text-xs text-textSecondary mb-1.5 block">{language === 'ru' ? 'Время приёма' : 'When to take'}</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(SUPPLEMENT_TIMING) as Supplement['timing'][]).map(timing => {
                                const info = SUPPLEMENT_TIMING[timing];
                                return (
                                    <button
                                        key={timing}
                                        onClick={() => setFormData({ ...formData, timing })}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${formData.timing === timing ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                                    >
                                        <span>{info.emoji}</span>
                                        <span>{info.label[language]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frequency selector */}
                    <div>
                        <label className="text-xs text-textSecondary mb-1.5 block">{language === 'ru' ? 'Частота' : 'Frequency'}</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(SUPPLEMENT_FREQUENCY) as Supplement['frequency'][]).map(freq => {
                                const info = SUPPLEMENT_FREQUENCY[freq];
                                return (
                                    <button
                                        key={freq}
                                        onClick={() => setFormData({ ...formData, frequency: freq })}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${formData.frequency === freq ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary hover:bg-surfaceHighlight/80'}`}
                                    >
                                        <span>{info.emoji}</span>
                                        <span>{info.label[language]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="flex gap-1.5">
                        {SUPPLEMENT_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setFormData({ ...formData, color })}
                                className={`w-6 h-6 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <textarea
                        placeholder={language === 'ru' ? 'Заметки (опционально)' : 'Notes (optional)'}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-surfaceHighlight text-textPrimary placeholder-textSecondary text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none h-16"
                    />

                    <button
                        onClick={editingId ? updateSupplement : addSupplement}
                        disabled={!formData.name.trim()}
                        className="w-full py-2.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-brand/30 transition-all"
                    >
                        {editingId ? (language === 'ru' ? 'Сохранить' : 'Save') : (language === 'ru' ? 'Добавить' : 'Add')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SupplementsManager;
