import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, ArrowRight, Lightbulb, RotateCcw, X, Save, Check, ChevronDown, ChevronUp, History, Clock } from 'lucide-react';
import { translations } from '../translations';
import { HabitAnalysis, getAccentGradient } from '../types';

interface SavedInsight {
    id: string;
    score: number;
    motivationalMessage: string;
    savedAt: Date;
}

interface AIWidgetProps {
    analysis: HabitAnalysis | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onReset?: () => void;
    onSaveInsight?: (analysis: HabitAnalysis) => void;
    insightSaved?: boolean;
    savedInsights?: SavedInsight[];  // History of saved insights
    onViewHistory?: () => void;
    isPro: boolean;
    language?: 'ru' | 'en';
    accentColor?: string | null;
}

// Dynamic Gemini-style pulsing orb component
const GeminiOrb: React.FC<{ size?: number; gradient: string }> = ({ size = 64, gradient }) => (
    <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow rings */}
        <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{
                background: gradient,
                animationDuration: '2s'
            }}
        />
        <div
            className="absolute inset-2 rounded-full animate-ping opacity-30"
            style={{
                background: gradient,
                animationDuration: '1.5s',
                animationDelay: '0.2s'
            }}
        />
        {/* Main orb with gradient - no pulse */}
        <div
            className="absolute inset-3 rounded-full shadow-lg"
            style={{
                background: gradient,
                boxShadow: '0 0 30px rgba(155, 114, 203, 0.5), 0 0 60px rgba(66, 133, 244, 0.3)',
                animation: 'subtle-float 3s ease-in-out infinite'
            }}
        />
        {/* Inner sparkle */}
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={size * 0.35} className="text-white drop-shadow-lg animate-spin" style={{ animationDuration: '3s' }} />
        </div>
    </div>
);

const AIWidget: React.FC<AIWidgetProps> = ({
    analysis,
    isAnalyzing,
    onAnalyze,
    onReset,
    onSaveInsight,
    insightSaved,
    savedInsights = [],
    onViewHistory,
    isPro,
    language = 'ru',
    accentColor
}) => {
    const t = translations[language].ai;
    const accent = getAccentGradient(accentColor);

    // Collapse state - collapsed by default when analysis exists
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Auto-expand when new analysis is generated
    useEffect(() => {
        if (analysis && isAnalyzing === false) {
            // Only auto-expand when analysis just finished (not on mount)
            const wasAnalyzing = sessionStorage.getItem('wasAnalyzing');
            if (wasAnalyzing === 'true') {
                setIsCollapsed(false);
                sessionStorage.removeItem('wasAnalyzing');
            }
        }
    }, [analysis, isAnalyzing]);

    // Track when analysis starts
    useEffect(() => {
        if (isAnalyzing) {
            sessionStorage.setItem('wasAnalyzing', 'true');
        }
    }, [isAnalyzing]);

    // Gemini-style analyzing state
    if (isAnalyzing) {
        return (
            <div className="w-full bg-surface border border-borderSubtle rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg min-h-[180px] relative overflow-hidden">
                {/* Animated gradient background - subtle */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(155, 114, 203, 0.3) 0%, transparent 70%)'
                    }}
                />

                <GeminiOrb size={72} gradient={accent.gradient} />

                <p className="text-sm font-medium text-textPrimary mt-4">{t.analyzing}</p>
                <p className="text-xs text-textSecondary mt-1 opacity-70">
                    {language === 'ru' ? 'Gemini анализирует ваши привычки...' : 'Gemini is analyzing your habits...'}
                </p>
            </div>
        );
    }

    // Start analysis state - Gemini-inspired design with glowing button
    if (!analysis) {
        return (
            <div
                className={`relative w-full overflow-hidden rounded-2xl p-5 flex items-center justify-between transition-all group bg-surface border border-borderSubtle ${isPro ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                onClick={isPro ? onAnalyze : undefined}
            >
                <div className="flex items-center gap-4 relative z-10">
                    {/* Gemini-style icon container */}
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                        style={{
                            background: accent.isGradient ? accent.gradient : accent.primary,
                        }}
                    >
                        <Sparkles size={22} className="text-white" />
                        {!isPro && (
                            <div className="absolute -top-1 -right-1 bg-surface rounded-full p-1 shadow-sm">
                                <Lock size={10} className="text-textSecondary" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-textPrimary">{t.coachTitle}</h3>
                        <p className="text-xs text-textSecondary mt-0.5">{isPro ? t.getAnalysis : t.availablePro}</p>
                    </div>
                </div>

                {/* Gemini Rotating Border Button */}
                <div className="relative">
                    {isPro ? (
                        <button className="gemini-glow px-5 py-2.5 rounded-xl text-sm font-bold bg-surface text-textPrimary flex items-center gap-2 shadow-lg">
                            {t.start} <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 bg-surfaceHighlight text-textSecondary">
                            <Lock size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Collapsed preview state
    if (isCollapsed) {
        return (
            <div
                className="w-full bg-surface border border-borderSubtle rounded-2xl p-4 shadow-sm relative overflow-hidden cursor-pointer hover:border-brand/30 transition-all"
                onClick={() => setIsCollapsed(false)}
            >
                {/* Subtle gradient accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{
                        background: accent.isGradient ? accent.gradient : accent.primary
                    }}
                />

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                        >
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent.primary }}>
                                    {t.yourReport}
                                </span>
                                <span className="text-lg font-black text-textPrimary">{analysis.overallScore}<span className="text-sm text-textSecondary font-normal">/100</span></span>
                            </div>
                            <p className="text-xs text-textSecondary truncate max-w-[200px] sm:max-w-[300px]">
                                {analysis.motivationalMessage.slice(0, 60)}...
                            </p>
                        </div>
                    </div>
                    <ChevronDown size={20} className="text-textSecondary" />
                </div>
            </div>
        );
    }

    // Expanded results state with Gemini accents
    return (
        <div className="w-full bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm relative overflow-hidden">
            {/* Subtle gradient accent */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{
                    background: accent.isGradient ? accent.gradient : accent.primary
                }}
            />

            <div className="flex justify-between items-start mb-3 mt-1">
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                    >
                        <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent.primary }}>{t.yourReport}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-black text-textPrimary">{analysis.overallScore}<span className="text-sm text-textSecondary font-normal">/100</span></div>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 rounded-lg hover:bg-surfaceHighlight transition-colors"
                    >
                        <ChevronUp size={18} className="text-textSecondary" />
                    </button>
                </div>
            </div>

            <p className="text-sm text-textPrimary font-medium italic mb-4 leading-relaxed">
                "{analysis.motivationalMessage}"
            </p>

            <div className="space-y-2">
                {analysis.suggestions.slice(0, 5).map((s, i) => (
                    <div
                        key={i}
                        className="p-2.5 rounded-xl flex items-start gap-2.5"
                        style={{ background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05), rgba(155, 114, 203, 0.08))' }}
                    >
                        <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: '#f4b400' }} />
                        <span className="text-xs text-textSecondary leading-snug">{s}</span>
                    </div>
                ))}
            </div>

            {/* Action buttons with Gemini gradient */}
            <div className="mt-4 flex gap-2 flex-wrap">
                <button
                    onClick={onAnalyze}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 p-3 rounded-xl text-white transition-all active:scale-95 hover:opacity-90"
                    style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                >
                    <RotateCcw size={16} />
                    <span className="text-xs font-bold">{language === 'ru' ? 'Обновить' : 'Refresh'}</span>
                </button>
                {onSaveInsight && analysis && (
                    <button
                        onClick={() => onSaveInsight(analysis)}
                        disabled={insightSaved}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${insightSaved
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-surfaceHighlight hover:bg-purple-500/10 text-textSecondary hover:text-purple-500'
                            }`}
                        title={insightSaved
                            ? (language === 'ru' ? 'Сохранено в историю AI инсайтов' : 'Saved to AI insights history')
                            : (language === 'ru' ? 'Сохранить в историю' : 'Save to history')
                        }
                    >
                        {insightSaved ? <Check size={16} /> : <Save size={16} />}
                        <span className="text-xs font-bold">
                            {insightSaved
                                ? (language === 'ru' ? 'Сохранено ✓' : 'Saved ✓')
                                : (language === 'ru' ? 'Сохранить' : 'Save')
                            }
                        </span>
                    </button>
                )}
                {onReset && (
                    <button
                        onClick={onReset}
                        className="flex items-center justify-center gap-2 p-3 bg-surfaceHighlight hover:bg-red-500/10 rounded-xl text-textSecondary hover:text-red-500 transition-colors active:scale-95"
                    >
                        <X size={16} />
                        <span className="text-xs font-bold">{language === 'ru' ? 'Сбросить' : 'Clear'}</span>
                    </button>
                )}
            </div>

            {/* Saved insights hint */}
            {insightSaved && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                    <History size={14} className="text-green-600" />
                    <span className="text-xs text-green-600">
                        {language === 'ru'
                            ? 'Инсайт сохранён! Нажмите вкладку "История" чтобы просмотреть'
                            : 'Insight saved! Click the "History" tab to view'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AIWidget;
