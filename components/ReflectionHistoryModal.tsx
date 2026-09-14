import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronDown, ChevronUp, Sparkles, BookOpen, Brain, MessageCircle } from 'lucide-react';
import ReflectionInsights from './ReflectionInsights';
import { ReflectionSession } from './AIReflectionSession';

export interface ReflectionEntry {
    id: string;
    date: string;
    question: string;
    answer: string;
    category?: string;
    aiInsight?: string;  // AI analysis from deep reflection session
}

interface ReflectionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: ReflectionEntry[];
    sessions?: ReflectionSession[];  // Full AI reflection sessions with insights
    language: 'ru' | 'en';
}

const t = {
    ru: {
        title: 'История рефлексий',
        noEntries: 'Пока нет записей',
        noEntriesHint: 'Начните отвечать на вопросы в разделе "Рефлексия"',
        insights: 'Ваш путь',
        aiInsights: 'AI Анализ',
        sessions: 'Сессии',
        history: 'Записи',
        noSessions: 'Нет AI-сессий',
        noSessionsHint: 'Пройдите глубокую рефлексию с AI-коучем'
    },
    en: {
        title: 'Reflection History',
        noEntries: 'No entries yet',
        noEntriesHint: 'Start answering questions in the "Reflect" section',
        insights: 'Your Journey',
        aiInsights: 'AI Analysis',
        sessions: 'Sessions',
        history: 'Entries',
        noSessions: 'No AI sessions',
        noSessionsHint: 'Complete a deep reflection session with AI coach'
    }
};

export const ReflectionHistoryModal: React.FC<ReflectionHistoryModalProps> = ({
    isOpen,
    onClose,
    entries,
    sessions = [],
    language
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'insights' | 'sessions' | 'history'>('insights');
    const labels = t[language];

    // Group entries by date
    const groupedEntries = useMemo(() => {
        const groups: Record<string, ReflectionEntry[]> = {};
        entries.forEach(entry => {
            const dateKey = entry.date.split('T')[0];
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(entry);
        });
        return Object.entries(groups)
            .sort(([a], [b]) => b.localeCompare(a)) // Newest first
            .slice(0, 30); // Last 30 days max
    }, [entries]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return language === 'ru' ? 'Сегодня' : 'Today';
        }
        if (dateStr === yesterday.toISOString().split('T')[0]) {
            return language === 'ru' ? 'Вчера' : 'Yesterday';
        }
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
            <div
                className="w-full max-w-lg max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col bg-surface"
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
            >
                {/* Header */}
                <div className="p-5 pb-4 bg-gradient-to-br from-brand/15 to-brand/5 border-b border-borderSubtle shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-brand/20">
                                <BookOpen className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-textPrimary">{labels.title}</h2>
                                <p className="text-xs text-textSecondary">{labels.insights}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors"
                        >
                            <X className="w-5 h-5 text-textSecondary" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1.5 mt-4">
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'insights'
                                ? 'bg-brand text-white'
                                : 'bg-surfaceHighlight text-textSecondary hover:bg-surface'
                                }`}
                        >
                            <Brain className="w-3.5 h-3.5" />
                            {labels.aiInsights}
                        </button>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'sessions'
                                ? 'bg-brand text-white'
                                : 'bg-surfaceHighlight text-textSecondary hover:bg-surface'
                                }`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {labels.sessions}
                            {sessions.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                                    {sessions.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history'
                                ? 'bg-brand text-white'
                                : 'bg-surfaceHighlight text-textSecondary hover:bg-surface'
                                }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            {labels.history}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'insights' ? (
                        <ReflectionInsights entries={entries} language={language} />
                    ) : activeTab === 'sessions' ? (
                        /* Sessions Tab - Full AI Reflection Sessions */
                        sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surfaceHighlight flex items-center justify-center">
                                    <Brain className="w-8 h-8 text-textSecondary" />
                                </div>
                                <p className="font-medium text-textPrimary">{labels.noSessions}</p>
                                <p className="text-sm text-textSecondary mt-1">{labels.noSessionsHint}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session, idx) => {
                                    const sessionDate = new Date(session.date);
                                    const isExpanded = expandedId === session.id;

                                    return (
                                        <div
                                            key={session.id || idx}
                                            className="rounded-2xl overflow-hidden border border-borderSubtle bg-surfaceHighlight"
                                        >
                                            {/* Session Header */}
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-surface/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2 rounded-xl"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)'
                                                        }}
                                                    >
                                                        <Brain className="w-4 h-4 text-purple-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-textPrimary">
                                                            {language === 'ru' ? 'AI Сессия' : 'AI Session'}
                                                        </p>
                                                        <p className="text-xs text-textSecondary">
                                                            {sessionDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                            {' • '}{session.messages?.length || 0} {language === 'ru' ? 'сообщ.' : 'msgs'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-textSecondary" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-textSecondary" />
                                                )}
                                            </button>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="border-t border-borderSubtle animate-fadeIn">
                                                    {/* Conversation */}
                                                    <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                                                        {session.messages?.map((msg, msgIdx) => (
                                                            <div
                                                                key={msgIdx}
                                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                            >
                                                                <div
                                                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                                        ? 'bg-brand text-white rounded-br-md'
                                                                        : 'bg-surface border border-borderSubtle text-textPrimary rounded-bl-md'
                                                                        }`}
                                                                >
                                                                    {msg.role === 'ai' && (
                                                                        <MessageCircle size={10} className="inline mr-1 opacity-50" />
                                                                    )}
                                                                    {msg.content}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* AI Insight */}
                                                    {session.insight && (
                                                        <div
                                                            className="m-4 mt-0 p-4 rounded-xl"
                                                            style={{
                                                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)',
                                                                border: '1px solid rgba(168, 85, 247, 0.2)'
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles size={14} className="text-purple-500" />
                                                                <span className="text-xs font-bold text-purple-600">
                                                                    {language === 'ru' ? '✨ AI Инсайт' : '✨ AI Insight'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-textPrimary leading-relaxed whitespace-pre-line">
                                                                {session.insight}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <>
                            {groupedEntries.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surfaceHighlight flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-textSecondary" />
                                    </div>
                                    <p className="font-medium text-textPrimary">{labels.noEntries}</p>
                                    <p className="text-sm text-textSecondary mt-1">{labels.noEntriesHint}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedEntries.map(([dateKey, dayEntries]) => (
                                        <div key={dateKey}>
                                            {/* Date Header */}
                                            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-surface py-1">
                                                <Calendar className="w-4 h-4 text-brand" />
                                                <span className="text-sm font-bold text-brand">{formatDate(dateKey)}</span>
                                                <div className="flex-1 h-px bg-borderSubtle" />
                                            </div>

                                            {/* Entries for this date */}
                                            <div className="space-y-2">
                                                {dayEntries.map(entry => (
                                                    <div
                                                        key={entry.id}
                                                        className="p-4 rounded-xl bg-surfaceHighlight border border-borderSubtle cursor-pointer hover:border-brand/30 transition-all"
                                                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-medium text-textPrimary line-clamp-2">
                                                                {entry.question}
                                                            </p>
                                                            {expandedId === entry.id ? (
                                                                <ChevronUp className="w-4 h-4 text-textSecondary shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-textSecondary shrink-0" />
                                                            )}
                                                        </div>

                                                        {expandedId === entry.id && (
                                                            <div className="mt-3 pt-3 border-t border-borderSubtle animate-fadeIn space-y-3">
                                                                <p className="text-sm text-textSecondary leading-relaxed whitespace-pre-wrap">
                                                                    {entry.answer}
                                                                </p>

                                                                {/* AI Insight if available */}
                                                                {entry.aiInsight && (
                                                                    <div
                                                                        className="p-3 rounded-xl"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)',
                                                                            border: '1px solid rgba(168, 85, 247, 0.15)'
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                                            <Sparkles size={12} className="text-purple-500" />
                                                                            <span className="text-xs font-bold text-purple-600">
                                                                                {language === 'ru' ? 'AI Анализ' : 'AI Analysis'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-textPrimary leading-relaxed whitespace-pre-wrap">
                                                                            {entry.aiInsight}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReflectionHistoryModal;

