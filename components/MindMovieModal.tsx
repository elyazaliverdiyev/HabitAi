import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Plus, Sparkles, Wand2, CheckCircle2, Trash2, ArrowLeft, Star, Eye, Crown, Loader2, RefreshCw } from 'lucide-react';
import { Habit, UserIdentity, IDENTITY_PRESETS } from '../types';
import HabitIdentityMap from './HabitIdentityMap';
import { generateId } from '../utils/helpers';
import { generateAffirmations } from '../services/ai';

interface MindMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
    userIdentities: UserIdentity[];
    activeIdentityId: string | null;
    onSave: (identity: UserIdentity) => void;
    onDelete: (id: string) => void;
    onSetActive: (id: string) => void;
    language: 'ru' | 'en';
    habits?: Habit[];
}

type Step = 'gallery' | 'view' | 'identity' | 'qualities' | 'affirmation' | 'complete';

const MindMovieModal: React.FC<MindMovieModalProps> = ({
    isOpen,
    onClose,
    userIdentities,
    activeIdentityId,
    onSave,
    onDelete,
    onSetActive,
    language,
    habits = []
}) => {
    const activeIdentity = userIdentities.find(i => i.id === activeIdentityId) || userIdentities[0];
    const modalRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState<Step>('gallery');
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [qualities, setQualities] = useState<string[]>([]);
    const [affirmation, setAffirmation] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [animateIn, setAnimateIn] = useState(false);

    // AI Affirmations
    const [suggestedAffirmations, setSuggestedAffirmations] = useState<string[]>([]);
    const [isLoadingAffirmations, setIsLoadingAffirmations] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimateIn(true);
            if (userIdentities.length === 0) {
                setStep('identity');
            } else {
                setStep('view');
            }
        } else {
            setAnimateIn(false);
        }
    }, [isOpen, userIdentities.length]);

    // Load AI affirmations when entering affirmation step
    useEffect(() => {
        if (step === 'affirmation' && selectedPreset && qualities.length > 0 && suggestedAffirmations.length === 0) {
            loadAffirmations();
        }
    }, [step, selectedPreset, qualities]);

    const loadAffirmations = async () => {
        if (!selectedPreset || qualities.length === 0) return;

        const preset = getPreset(selectedPreset);
        if (!preset) return;

        setIsLoadingAffirmations(true);
        try {
            const affirmations = await generateAffirmations(
                selectedPreset,
                preset.label[language],
                qualities,
                language
            );
            setSuggestedAffirmations(affirmations);
        } catch (error) {
            console.error('Failed to load affirmations:', error);
        } finally {
            setIsLoadingAffirmations(false);
        }
    };

    const handleStartNew = () => {
        setSelectedPreset(null);
        setQualities([]);
        setAffirmation('');
        setSuggestedAffirmations([]);
        setIsEditing(false);
        setEditingId(null);
        setStep('identity');
    };

    const handleEdit = (identity: UserIdentity) => {
        setSelectedPreset(identity.targetIdentity);
        setQualities(identity.qualities);
        setAffirmation(identity.affirmation || '');
        setSuggestedAffirmations([]);
        setIsEditing(true);
        setEditingId(identity.id);
        setStep('identity');
    };

    const handleSave = () => {
        if (!selectedPreset) return;

        const identity: UserIdentity = {
            id: editingId || generateId(),
            targetIdentity: selectedPreset,
            qualities,
            affirmation,
            createdAt: editingId ? (userIdentities.find(i => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            lastViewedAt: new Date().toISOString()
        };

        onSave(identity);
        setStep('complete');
    };

    const getPreset = (id: string) => IDENTITY_PRESETS.find(p => p.id === id);

    if (!isOpen) return null;

    // ===============================
    // GALLERY VIEW
    // ===============================
    if (step === 'gallery') {
        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
                {/* Backdrop */}
                <div className="absolute inset-0 modal-overlay" onClick={onClose} />

                <div ref={modalRef} className={`relative w-full max-w-md overflow-hidden transition-all duration-500 ${animateIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                    {/* Card - Classic white for daylight theme */}
                    <div
                        className="rounded-3xl overflow-hidden shadow-2xl bg-surface"
                        style={{
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {/* Header */}
                        <div className="relative p-5 border-b border-borderSubtle bg-surfaceHighlight/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-textPrimary">
                                            {language === 'ru' ? 'Видения' : 'Visions'}
                                        </h2>
                                        <p className="text-xs text-textSecondary">
                                            {language === 'ru' ? 'Твои будущие личности' : 'Your future identities'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textSecondary hover:text-textPrimary transition-all border border-borderSubtle"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Visions list */}
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {userIdentities.map((identity, index) => {
                                const preset = getPreset(identity.targetIdentity);
                                const isActive = identity.id === activeIdentityId;
                                return (
                                    <div
                                        key={identity.id}
                                        className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 animate-fadeIn ${isActive
                                            ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10'
                                            : 'bg-surfaceHighlight/50 border border-borderSubtle hover:border-brand/30 hover:shadow-md'
                                            }`}
                                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                        onClick={() => {
                                            onSetActive(identity.id);
                                            setStep('view');
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-105 ${isActive
                                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                : 'bg-surfaceHighlight border border-borderSubtle'
                                                }`}>
                                                <span>{preset?.emoji || '✨'}</span>
                                                {isActive && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-surface flex items-center justify-center">
                                                        <Crown size={8} className="text-amber-900" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-textPrimary truncate">
                                                    {preset?.label[language] || identity.targetIdentity}
                                                </h3>
                                                <p className="text-sm text-textSecondary truncate mt-0.5">
                                                    {identity.qualities.slice(0, 2).join(' • ')}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(identity); }}
                                                    className="p-2 rounded-lg bg-surface hover:bg-surfaceHighlight text-textSecondary hover:text-brand transition-all border border-borderSubtle"
                                                >
                                                    <Wand2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(identity.id); }}
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Create new button */}
                            <button
                                onClick={handleStartNew}
                                className="w-full p-4 rounded-2xl border-2 border-dashed border-borderSubtle hover:border-brand/40 bg-surfaceHighlight/30 hover:bg-surfaceHighlight/60 transition-all flex items-center justify-center gap-3 text-textSecondary hover:text-textPrimary mt-4 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={22} className="text-amber-500" />
                                </div>
                                <span className="font-bold">{language === 'ru' ? 'Создать видение' : 'Create Vision'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===============================
    // VIEW MODE
    // ===============================
    if (step === 'view' && activeIdentity) {
        const preset = getPreset(activeIdentity.targetIdentity);

        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
                {/* Backdrop */}
                <div className="absolute inset-0 modal-overlay" onClick={onClose} />

                <div className={`relative w-full max-w-md max-h-[90vh] transition-all duration-500 ${animateIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                    {/* Main card */}
                    <div className="bg-surface border border-borderSubtle rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

                        {/* Header with Avatar */}
                        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-surfaceHighlight/50 to-transparent">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textSecondary hover:text-textPrimary transition-all border border-borderSubtle z-20"
                            >
                                <X size={18} />
                            </button>

                            {/* Back button */}
                            <button
                                onClick={() => setStep('gallery')}
                                className="absolute top-4 left-4 p-2.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textSecondary hover:text-textPrimary transition-all border border-borderSubtle flex items-center gap-2 z-20"
                            >
                                <ArrowLeft size={16} />
                                <span className="text-xs font-medium">{language === 'ru' ? 'Назад' : 'Back'}</span>
                            </button>

                            {/* Centered Avatar */}
                            <div className="flex flex-col items-center pt-6">
                                {/* Avatar with glow */}
                                <div className="relative mb-5 animate-fadeIn">
                                    {/* Glow */}
                                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-amber-400/20 blur-2xl opacity-60" />

                                    {/* Main avatar */}
                                    <div
                                        className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/30"
                                        style={{ animation: 'subtle-float 4s ease-in-out infinite' }}
                                    >
                                        {preset?.emoji || '✨'}
                                        <Sparkles
                                            size={20}
                                            className="absolute -top-2 -right-2 text-amber-300"
                                            style={{ animation: 'subtle-float 2s ease-in-out infinite' }}
                                        />
                                    </div>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl font-black text-textPrimary text-center tracking-tight mb-1 animate-fadeIn" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                                    {preset?.label[language] || activeIdentity.targetIdentity}
                                </h1>

                                {/* Subtitle */}
                                <p className="text-sm text-textSecondary font-medium animate-fadeIn" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                                    {language === 'ru' ? 'Твоё будущее Я' : 'Your Future Self'}
                                </p>
                            </div>
                        </div>

                        {/* Qualities chips */}
                        <div className="px-6 pb-4 animate-fadeIn" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {activeIdentity.qualities.map((q, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-2 rounded-xl bg-surfaceHighlight border border-borderSubtle text-sm font-medium text-textSecondary hover:text-textPrimary hover:border-brand/30 hover:scale-105 transition-all duration-300 cursor-default animate-fadeIn"
                                        style={{ animationDelay: `${250 + i * 50}ms`, animationFillMode: 'both' }}
                                    >
                                        {q}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
                            {/* Affirmation card */}
                            {activeIdentity.affirmation && (
                                <div
                                    className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent rounded-2xl p-5 border border-purple-500/20 animate-fadeIn"
                                    style={{ animationDelay: '300ms', animationFillMode: 'both' }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                                            <Star size={18} className="text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-purple-500/70 uppercase tracking-wider font-bold mb-1">
                                                {language === 'ru' ? 'Моя аффирмация' : 'My Affirmation'}
                                            </p>
                                            <p className="text-base text-textPrimary italic leading-relaxed font-medium">
                                                "{activeIdentity.affirmation}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Habits & Stats */}
                            <div
                                className="bg-surface border border-borderSubtle rounded-2xl overflow-hidden animate-fadeIn"
                                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                            >
                                <HabitIdentityMap
                                    habits={habits}
                                    userIdentity={activeIdentity}
                                    language={language}
                                />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="px-4 pb-5 pt-2 flex gap-3 border-t border-borderSubtle bg-surfaceHighlight/20 animate-fadeIn" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                            <button
                                onClick={() => handleEdit(activeIdentity)}
                                className="flex-1 py-4 px-4 rounded-2xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-borderSubtle text-textSecondary hover:text-textPrimary font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Wand2 size={18} />
                                {language === 'ru' ? 'Изменить' : 'Edit'}
                            </button>
                            <button
                                onClick={() => setStep('gallery')}
                                className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Eye size={18} />
                                {language === 'ru' ? 'Все видения' : 'All Visions'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===============================
    // CREATION/EDIT FLOW
    // ===============================
    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className={`relative w-full max-w-md transition-all duration-500 ${animateIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                <div className="bg-surface border border-borderSubtle rounded-3xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="relative p-5 border-b border-borderSubtle bg-surfaceHighlight/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {step !== 'identity' && (
                                    <button
                                        onClick={() => {
                                            if (step === 'qualities') setStep('identity');
                                            else if (step === 'affirmation') {
                                                setStep('qualities');
                                                setSuggestedAffirmations([]);
                                            }
                                        }}
                                        className="p-2.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textSecondary hover:text-textPrimary transition-all border border-borderSubtle"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-lg font-bold text-textPrimary">
                                        {isEditing
                                            ? (language === 'ru' ? 'Редактирование' : 'Edit Vision')
                                            : (language === 'ru' ? 'Новое Видение' : 'New Vision')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {['identity', 'qualities', 'affirmation'].map((s, i) => (
                                            <div
                                                key={s}
                                                className={`h-1.5 rounded-full transition-all duration-500 ${step === s || ['identity', 'qualities', 'affirmation'].indexOf(step) > i
                                                    ? 'w-8 bg-gradient-to-r from-brand to-purple-500'
                                                    : 'w-3 bg-surfaceHighlight'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textSecondary hover:text-textPrimary transition-all border border-borderSubtle"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Step 1: Identity Selection */}
                        {step === 'identity' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-xl font-black text-textPrimary leading-tight">
                                    {language === 'ru' ? 'Кем ты хочешь стать?' : 'Who do you want to become?'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {IDENTITY_PRESETS.map((p, i) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPreset(p.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 text-center hover:scale-[1.03] active:scale-[0.97] animate-fadeIn ${selectedPreset === p.id
                                                ? 'bg-gradient-to-br from-brand/20 to-purple-500/20 border-brand shadow-lg shadow-brand/20'
                                                : 'bg-surfaceHighlight/50 border-borderSubtle hover:border-brand/50 hover:bg-surfaceHighlight'
                                                }`}
                                            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                                        >
                                            <span className="text-5xl">{p.emoji}</span>
                                            <span className="font-bold text-sm text-textPrimary">{p.label[language]}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={!selectedPreset}
                                    onClick={() => setStep('qualities')}
                                    className="w-full py-4 bg-gradient-to-r from-brand to-purple-500 hover:from-brand/90 hover:to-purple-500/90 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:shadow-none mt-4"
                                >
                                    {language === 'ru' ? 'Далее' : 'Continue'}
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Qualities */}
                        {step === 'qualities' && selectedPreset && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl font-black text-textPrimary leading-tight">
                                        {language === 'ru' ? 'Твои суперсилы?' : 'Your superpowers?'}
                                    </h3>
                                    <p className="text-textSecondary text-sm mt-1">{language === 'ru' ? 'Выбери качества, которые тебя характеризуют' : 'Select qualities that define you'}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {getPreset(selectedPreset)?.qualities[language].map((q, i) => (
                                        <button
                                            key={q}
                                            onClick={() => setQualities(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q])}
                                            className={`px-4 py-2.5 rounded-xl border-2 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 animate-fadeIn ${qualities.includes(q)
                                                ? 'bg-gradient-to-r from-brand to-purple-500 text-white border-transparent shadow-lg shadow-brand/30'
                                                : 'bg-surfaceHighlight/50 border-borderSubtle text-textSecondary hover:border-brand/50 hover:text-textPrimary hover:bg-surfaceHighlight'
                                                }`}
                                            style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={qualities.length === 0}
                                    onClick={() => setStep('affirmation')}
                                    className="w-full py-4 bg-gradient-to-r from-brand to-purple-500 hover:from-brand/90 hover:to-purple-500/90 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:shadow-none mt-4"
                                >
                                    {language === 'ru' ? 'Далее' : 'Continue'}
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Step 3: Affirmation with AI Suggestions */}
                        {step === 'affirmation' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl font-black text-textPrimary leading-tight">
                                        {language === 'ru' ? 'Твоё кредо' : 'Your Mantra'}
                                    </h3>
                                    <p className="text-textSecondary text-sm mt-1">
                                        {language === 'ru' ? 'Выбери или напиши аффирмацию' : 'Choose or write an affirmation'}
                                    </p>
                                </div>

                                {/* AI Suggested Affirmations */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-purple-500" />
                                            <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                                                {language === 'ru' ? 'AI предложения' : 'AI Suggestions'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSuggestedAffirmations([]);
                                                loadAffirmations();
                                            }}
                                            disabled={isLoadingAffirmations}
                                            className="p-1.5 rounded-lg text-textSecondary hover:text-brand hover:bg-surfaceHighlight transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw size={14} className={isLoadingAffirmations ? 'animate-spin' : ''} />
                                        </button>
                                    </div>

                                    {isLoadingAffirmations ? (
                                        <div className="flex items-center justify-center py-8 bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle">
                                            <Loader2 size={24} className="animate-spin text-brand" />
                                            <span className="ml-3 text-sm text-textSecondary">
                                                {language === 'ru' ? 'AI генерирует аффирмации...' : 'AI is generating affirmations...'}
                                            </span>
                                        </div>
                                    ) : suggestedAffirmations.length > 0 ? (
                                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                            {suggestedAffirmations.map((aff, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAffirmation(aff)}
                                                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] animate-fadeIn ${affirmation === aff
                                                        ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                                        : 'bg-surfaceHighlight/30 border-borderSubtle hover:border-purple-500/30 hover:bg-surfaceHighlight/60'
                                                        }`}
                                                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                                                >
                                                    <p className={`text-sm font-medium italic leading-relaxed ${affirmation === aff ? 'text-textPrimary' : 'text-textSecondary'}`}>
                                                        "{aff}"
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle">
                                            <p className="text-sm text-textSecondary">
                                                {language === 'ru' ? 'Нажмите обновить для генерации' : 'Click refresh to generate'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-borderSubtle" />
                                    <span className="text-xs text-textSecondary font-medium">
                                        {language === 'ru' ? 'или напиши свою' : 'or write your own'}
                                    </span>
                                    <div className="flex-1 h-px bg-borderSubtle" />
                                </div>

                                {/* Custom textarea */}
                                <div className="relative">
                                    <textarea
                                        value={affirmation}
                                        onChange={(e) => setAffirmation(e.target.value)}
                                        placeholder={language === 'ru' ? 'Я — тот, кто...' : 'I am someone who...'}
                                        className="w-full h-28 p-4 bg-surfaceHighlight/50 border-2 border-borderSubtle focus:border-brand/50 rounded-2xl outline-none font-medium text-base resize-none placeholder:text-textSecondary/50 text-textPrimary transition-all"
                                    />
                                    <Sparkles className="absolute bottom-3 right-3 w-4 h-4 text-brand/30" />
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={!affirmation.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-brand to-purple-500 hover:from-brand/90 hover:to-purple-500/90 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:shadow-none"
                                >
                                    <CheckCircle2 size={20} />
                                    {language === 'ru' ? 'Создать Видение' : 'Create Vision'}
                                </button>
                            </div>
                        )}

                        {/* Complete */}
                        {step === 'complete' && (
                            <div className="space-y-8 py-8 text-center animate-fadeIn">
                                <div className="relative w-32 h-32 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-purple-500 blur-2xl opacity-30" />
                                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-6xl shadow-2xl ring-4 ring-brand/30">
                                        ✨
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-textPrimary uppercase tracking-tight">
                                        {language === 'ru' ? 'Видение Создано!' : 'Vision Complete!'}
                                    </h3>
                                    <p className="text-textSecondary mt-2 leading-relaxed px-4 font-medium">
                                        {language === 'ru'
                                            ? 'Твоё будущее начинается прямо сейчас. Смотри своё видение каждый день!'
                                            : 'Your future starts now. Watch your vision daily!'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep('view')}
                                    className="w-full py-4 bg-gradient-to-r from-brand to-purple-500 hover:from-brand/90 hover:to-purple-500/90 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-brand/40 flex items-center justify-center gap-2"
                                >
                                    <Eye size={20} />
                                    {language === 'ru' ? 'Посмотреть Видение' : 'View My Vision'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MindMovieModal;
