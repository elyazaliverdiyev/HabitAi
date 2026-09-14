import React, { useState } from 'react';
import { History, Calendar, Sparkles, ChevronRight, Trash2, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { getAccentGradient } from '../types';

interface AIInsight {
    id: string;
    date: string;
    overallScore: number;
    motivationalMessage: string;
    streakAnalysis?: string;
    suggestions: string[];
    language: 'ru' | 'en';
}

interface AIInsightsHistoryProps {
    insights: AIInsight[];
    onDeleteInsight?: (id: string) => void;
    language?: 'ru' | 'en';
    accentColor?: string | null;
}

const AIInsightsHistory: React.FC<AIInsightsHistoryProps> = ({
    insights,
    onDeleteInsight,
    language = 'ru',
    accentColor
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const accent = getAccentGradient(accentColor);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreTrend = (currentIndex: number) => {
        if (currentIndex >= insights.length - 1) return null;
        const current = insights[currentIndex].overallScore;
        const previous = insights[currentIndex + 1].overallScore;
        const diff = current - previous;
        if (Math.abs(diff) < 3) return null;
        return diff > 0 ? 'up' : 'down';
    };

    if (insights.length === 0) {
        return (
            <div className="bg-surface border border-borderSubtle rounded-2xl p-8 text-center">
                <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                >
                    <History size={32} className="text-white/80" />
                </div>
                <h3 className="font-bold text-textPrimary mb-2">
                    {language === 'ru' ? 'Нет сохранённых инсайтов' : 'No Saved Insights'}
                </h3>
                <p className="text-sm text-textSecondary max-w-xs mx-auto">
                    {language === 'ru'
                        ? 'Запустите AI Аналитику и нажмите "Сохранить" чтобы добавить инсайт в историю'
                        : 'Run AI Analytics and click "Save" to add insights to history'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-textPrimary">{insights.length}</div>
                    <div className="text-[10px] text-textSecondary font-bold uppercase">
                        {language === 'ru' ? 'Всего инсайтов' : 'Total Insights'}
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-green-600">
                        {insights.length > 0 ? Math.round(insights.reduce((a, b) => a + b.overallScore, 0) / insights.length) : 0}
                    </div>
                    <div className="text-[10px] text-textSecondary font-bold uppercase">
                        {language === 'ru' ? 'Средний балл' : 'Average Score'}
                    </div>
                </div>
            </div>

            {/* Insights list */}
            {insights.map((insight, index) => {
                const isExpanded = expandedId === insight.id;
                const trend = getScoreTrend(index);

                return (
                    <div
                        key={insight.id}
                        className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-brand/40 shadow-lg' : 'border-borderSubtle hover:border-brand/20'
                            }`}
                    >
                        {/* Header - clickable */}
                        <div
                            className="p-4 flex items-center gap-3 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                        >
                            {/* Score badge */}
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                                style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                            >
                                <span className="text-lg font-black text-white">{insight.overallScore}</span>
                                {trend && (
                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                        {trend === 'up' ? (
                                            <TrendingUp size={10} className="text-white" />
                                        ) : (
                                            <TrendingDown size={10} className="text-white" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={12} className="text-textSecondary" />
                                    <span className="text-xs text-textSecondary">{formatDate(insight.date)}</span>
                                </div>
                                <p className="text-sm text-textPrimary font-medium truncate">
                                    {insight.motivationalMessage.slice(0, 60)}...
                                </p>
                            </div>

                            {/* Expand icon */}
                            <ChevronRight
                                size={20}
                                className={`text-textSecondary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                                {/* Full message */}
                                <p className="text-sm text-textPrimary italic bg-surfaceHighlight/30 p-3 rounded-xl">
                                    "{insight.motivationalMessage}"
                                </p>

                                {/* Suggestions */}
                                {insight.suggestions && insight.suggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles size={12} className="text-brand" />
                                            {language === 'ru' ? 'Рекомендации' : 'Suggestions'}
                                        </div>
                                        {insight.suggestions.slice(0, 3).map((s, i) => (
                                            <div
                                                key={i}
                                                className="text-xs text-textSecondary bg-surfaceHighlight/20 px-3 py-2 rounded-lg"
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Delete button */}
                                {onDeleteInsight && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteInsight(insight.id);
                                        }}
                                        className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        {language === 'ru' ? 'Удалить' : 'Delete'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AIInsightsHistory;
