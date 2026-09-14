import React, { useState, useEffect } from 'react';
import { X, Moon, Star, TrendingUp, TrendingDown, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { EveningReviewData, generateEveningReview } from '../services/ai';
import { Habit } from '../types';

interface EveningReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    language: 'ru' | 'en';
}

const t = {
    ru: {
        title: 'Вечерний обзор',
        loading: 'AI анализирует ваш день...',
        wins: 'Победы дня',
        improve: 'На завтра',
        tomorrow: 'Совет на завтра',
        close: 'Спокойной ночи',
        error: 'Не удалось загрузить обзор',
        retry: 'Попробовать снова',
    },
    en: {
        title: 'Evening Review',
        loading: 'AI is analyzing your day...',
        wins: 'Today\'s Wins',
        improve: 'For Tomorrow',
        tomorrow: 'Tomorrow\'s Tip',
        close: 'Good Night',
        error: 'Failed to load review',
        retry: 'Try Again',
    }
};

const EveningReviewModal: React.FC<EveningReviewModalProps> = ({
    isOpen,
    onClose,
    habits,
    language,
}) => {
    const [review, setReview] = useState<EveningReviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const lang = t[language];

    useEffect(() => {
        if (isOpen && !review) {
            loadReview();
        }
        if (isOpen) {
            setTimeout(() => setAnimateIn(true), 50);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);

    const loadReview = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await generateEveningReview(habits, language);
            setReview(data);
        } catch {
            setError(true);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#eab308';
        if (score >= 40) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md mx-4 mb-4 transition-all duration-500 ease-out ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                <div className="rounded-3xl bg-surface border border-divider overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-indigo-500/10 to-transparent">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-surface/50 hover:bg-surface text-secondary"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                <Moon size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-primary">{lang.title}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-secondary">{lang.loading}</p>
                            </div>
                        )}

                        {error && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <p className="text-sm text-secondary">{lang.error}</p>
                                <button onClick={loadReview} className="text-sm font-bold text-brand">{lang.retry}</button>
                            </div>
                        )}

                        {review && (
                            <div className="space-y-4">
                                {/* Score + Headline */}
                                <div className="text-center py-4">
                                    <div className="text-4xl mb-2">{review.emoji}</div>
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <div
                                            className="text-3xl font-black"
                                            style={{ color: getScoreColor(review.score) }}
                                        >
                                            {review.score}
                                        </div>
                                        <span className="text-xs text-secondary font-bold uppercase">/100</span>
                                    </div>
                                    <p className="font-semibold text-primary">{review.headline}</p>
                                </div>

                                {/* Wins */}
                                {review.wins.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase">
                                            <TrendingUp size={12} /> {lang.wins}
                                        </div>
                                        {review.wins.map((win, i) => (
                                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-green-500/5 border border-green-500/10">
                                                <Star size={14} className="text-green-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-primary">{win}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Improvements */}
                                {review.improvements.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase">
                                            <TrendingDown size={12} /> {lang.improve}
                                        </div>
                                        {review.improvements.map((imp, i) => (
                                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                <ChevronRight size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-primary">{imp}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Streak Highlight */}
                                {review.streakHighlight && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-brand/5 border border-brand/10">
                                        <Zap size={14} className="text-brand shrink-0" />
                                        <p className="text-sm font-semibold text-brand">{review.streakHighlight}</p>
                                    </div>
                                )}

                                {/* Tomorrow tip */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/15">
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase mb-2">
                                        <Sparkles size={12} /> {lang.tomorrow}
                                    </div>
                                    <p className="text-sm font-medium text-primary">{review.tomorrowTip}</p>
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-2xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <Moon size={16} /> {lang.close}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EveningReviewModal;
