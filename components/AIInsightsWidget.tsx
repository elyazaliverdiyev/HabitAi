import React, { useState, useMemo } from 'react';
import { Habit, DeepAnalysis } from '../types';
import {
    AlertTriangle, Crown, BrainCircuit, ChevronLeft, ChevronRight, History, Calendar,
    Sparkles, TrendingUp, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';

interface AIInsightsWidgetProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    analysisHistory?: DeepAnalysis[];
    onSaveAnalysis?: (analysis: DeepAnalysis) => void;
    onOpenHistory?: () => void;
}

interface Section {
    key: string;
    title: string;
    content: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    color: string;
    bgGradient: string;
}

// Filter out failed/empty analyses
const isValidAnalysis = (insight: string | undefined): boolean => {
    if (!insight || insight.length < 30) return false;
    const failPatterns = [/не удалось/i, /failed/i, /error/i];
    return !failPatterns.some(p => p.test(insight));
};

// Render markdown-like text (bold **text** and «quotes»)
const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*|«[^»]+»)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-textPrimary">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('«') && part.endsWith('»')) {
            return <strong key={i} className="font-bold text-textPrimary">{part}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

// Section configs
const SECTION_CONFIG: Record<string, Omit<Section, 'content'>> = {
    synergy: {
        key: 'synergy',
        title: 'СИНЕРГИЯ',
        icon: Sparkles,
        color: 'text-emerald-500',
        bgGradient: 'from-emerald-500/10 to-teal-500/5'
    },
    bottleneck: {
        key: 'bottleneck',
        title: 'УЗКОЕ МЕСТО',
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgGradient: 'from-orange-500/10 to-amber-500/5'
    },
    economic: {
        key: 'economic',
        title: 'ЭКОНОМИЧЕСКИЙ ИНСАЙТ',
        icon: TrendingUp,
        color: 'text-blue-500',
        bgGradient: 'from-blue-500/10 to-cyan-500/5'
    },
    tip: {
        key: 'tip',
        title: 'СОВЕТ МАСТЕРА',
        icon: Crown,
        color: 'text-purple-500',
        bgGradient: 'from-purple-500/10 to-pink-500/5'
    }
};

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
    habits,
    language = 'ru',
    analysisHistory = [],
    onOpenHistory
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [expandedSection, setExpandedSection] = useState<string | null>('tip'); // Default expand tip

    // Get valid analyses sorted by date (newest first)
    const validAnalyses = useMemo(() => {
        return analysisHistory
            .filter(a => isValidAnalysis(a.insight))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [analysisHistory]);

    // Parse all 4 sections from text
    const parseInsight = (text: string): Section[] => {
        const sections: Section[] = [];

        // Patterns for each section (with or without numbers)
        const patterns: { key: keyof typeof SECTION_CONFIG; regex: RegExp }[] = [
            { key: 'synergy', regex: /\*?\*?(?:\d+\.\s*)?СИНЕРГИЯ[^*]*\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:\d+\.\s*)?(?:УЗКО|ЭКОНОМИЧЕСК|СОВЕТ|$))/i },
            { key: 'bottleneck', regex: /\*?\*?(?:\d+\.\s*)?УЗКО[ЕМ]?\s*(?:МЕСТО|ГОРЛЫШКО)[^*]*\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:\d+\.\s*)?(?:ЭКОНОМИЧЕСК|СОВЕТ|$))/i },
            { key: 'economic', regex: /\*?\*?(?:\d+\.\s*)?ЭКОНОМИЧЕСК[^*]*\*?\*?:?\s*([\s\S]*?)(?=\*?\*?(?:\d+\.\s*)?(?:СОВЕТ|$))/i },
            { key: 'tip', regex: /\*?\*?(?:\d+\.\s*)?СОВЕТ\s*(?:МАСТЕРА)?[^*]*\*?\*?:?\s*([\s\S]*?)$/i },
        ];

        for (const { key, regex } of patterns) {
            const match = text.match(regex);
            if (match && match[1] && match[1].trim().length > 20) {
                const config = SECTION_CONFIG[key];
                sections.push({
                    ...config,
                    content: match[1].trim()
                });
            }
        }

        // If no sections found, create one generic section
        if (sections.length === 0 && text.length > 50) {
            sections.push({
                ...SECTION_CONFIG.tip,
                content: text
            });
        }

        return sections;
    };

    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch { return dateStr; }
    };

    // Current analysis
    const currentAnalysis = useMemo(() => {
        if (validAnalyses.length === 0) return null;
        const analysis = validAnalyses[currentIndex];
        if (!analysis) return null;

        const sections = parseInsight(analysis.insight || '');
        return {
            id: analysis.id,
            date: formatDate(analysis.date),
            sections
        };
    }, [validAnalyses, currentIndex, language]);

    // Navigation
    const goToPrev = () => {
        if (currentIndex < validAnalyses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setExpandedSection('tip');
        }
    };

    const goToNext = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setExpandedSection('tip');
        }
    };

    // No data state
    if (!currentAnalysis || currentAnalysis.sections.length === 0) {
        return (
            <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <BrainCircuit size={24} className="text-purple-500" />
                    </div>
                    <span className="text-sm font-medium text-textSecondary">
                        {language === 'ru' ? 'Запусти AI анализ' : 'Run AI analysis'}
                    </span>
                </div>
            </div>
        );
    }

    const hasMultiple = validAnalyses.length > 1;

    return (
        <div className="space-y-3">
            {/* Date Navigation Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-purple-500" />
                    <span className="text-xs font-medium text-textSecondary">
                        {currentAnalysis.date}
                    </span>
                    {hasMultiple && (
                        <span className="text-[10px] text-textSecondary/50">
                            ({currentIndex + 1}/{validAnalyses.length})
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {onOpenHistory && (
                        <button
                            onClick={onOpenHistory}
                            className="w-7 h-7 rounded-lg bg-surfaceHighlight hover:bg-purple-500/20 flex items-center justify-center text-textSecondary hover:text-purple-500 transition-colors"
                        >
                            <History size={14} />
                        </button>
                    )}
                    {hasMultiple && (
                        <>
                            <button
                                onClick={goToPrev}
                                disabled={currentIndex >= validAnalyses.length - 1}
                                className="w-7 h-7 rounded-lg bg-surfaceHighlight hover:bg-purple-500/20 flex items-center justify-center text-textSecondary hover:text-purple-500 transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={goToNext}
                                disabled={currentIndex <= 0}
                                className="w-7 h-7 rounded-lg bg-surfaceHighlight hover:bg-purple-500/20 flex items-center justify-center text-textSecondary hover:text-purple-500 transition-colors disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Sections as accordion cards */}
            <div className="space-y-2">
                {currentAnalysis.sections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.key;

                    return (
                        <div
                            key={section.key}
                            className={`bg-gradient-to-br ${section.bgGradient} border rounded-2xl overflow-hidden transition-all`}
                            style={{ borderColor: `currentColor`, borderOpacity: 0.2 }}
                        >
                            {/* Header - clickable */}
                            <button
                                onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.bgGradient} flex items-center justify-center`}>
                                        <Icon size={16} className={section.color} />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${section.color}`}>
                                        {section.title}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp size={18} className="text-textSecondary" />
                                ) : (
                                    <ChevronDown size={18} className="text-textSecondary" />
                                )}
                            </button>

                            {/* Content - expandable */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0">
                                    <div className="text-sm text-textSecondary leading-relaxed">
                                        {renderFormattedText(section.content)}
                                    </div>
                                </div>
                            )}

                            {/* Preview when collapsed */}
                            {!isExpanded && (
                                <div className="px-4 pb-3 pt-0">
                                    <p className="text-xs text-textSecondary/70 line-clamp-2">
                                        {section.content.slice(0, 120)}...
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIInsightsWidget;
