import React, { useState, useEffect } from 'react';
import { X, Brain, ArrowRight, Sparkles, BookOpen, Heart, Target, Wind, HandHeart, Crosshair, Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** SVG-иконки вместо эмодзи (правило дизайн-системы) */
const FIELD_ICONS: Record<string, LucideIcon> = {
    grateful: HandHeart,
    intention: Crosshair,
    letgo: Leaf,
};
const fieldIcon = (key: string): LucideIcon => FIELD_ICONS[key] || Heart;

interface DailyInterruptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnswer: (question: string, answer: string) => void;
    onOpenHistory?: () => void;
    language: 'ru' | 'en';
    gender?: 'male' | 'female';
}

// Structured micro-journal fields (Implementation Intentions from Atomic Habits)
const getJournalFields = (gender: 'male' | 'female' = 'male') => ({
    ru: [
        { key: 'grateful', icon: '🙏', label: gender === 'male' ? 'Благодарен за...' : 'Благодарна за...', placeholder: gender === 'male' ? 'За что ты благодарен сегодня?' : 'За что ты благодарна сегодня?', color: 'text-amber-500' },
        { key: 'intention', icon: '🎯', label: 'Сегодня я...', placeholder: 'Если [ситуация], то я [действие]...', color: 'text-blue-500' },
        { key: 'letgo', icon: '🍃', label: 'Отпускаю...', placeholder: gender === 'male' ? 'Что ты готов отпустить?' : 'Что ты готова отпустить?', color: 'text-green-500' },
    ],
    en: [
        { key: 'grateful', icon: '🙏', label: 'Grateful for...', placeholder: 'What are you grateful for today?', color: 'text-amber-500' },
        { key: 'intention', icon: '🎯', label: 'Today I will...', placeholder: 'If [situation], then I will [action]...', color: 'text-blue-500' },
        { key: 'letgo', icon: '🍃', label: 'Letting go of...', placeholder: 'What are you ready to release?', color: 'text-green-500' },
    ]
});

const getQuestions = (gender: 'male' | 'female' = 'male') => ({
    ru: [
        { q: 'Что я сейчас избегаю, делая то, что делаю?', category: 'awareness' },
        { q: gender === 'male' ? 'Если бы кто-то снял последние 2 часа моей жизни, что бы он заключил о том, чего я хочу?' : 'Если бы кто-то снял последние 2 часа моей жизни, что бы она заключила о том, чего я хочу?', category: 'behavior' },
        { q: 'Двигаюсь ли я к жизни, которой боюсь, или к жизни, которую хочу?', category: 'direction' },
        { q: 'Какая самая важная вещь, которую я притворяюсь неважной?', category: 'priority' },
        { q: gender === 'male' ? 'Что я сегодня сделал из защиты своей идентичности, а не из настоящего желания?' : 'Что я сегодня сделала из защиты своей идентичности, а не из настоящего желания?', category: 'identity' },
        { q: gender === 'male' ? 'Когда сегодня я чувствовал себя живым? Когда — мёртвым?' : 'Когда сегодня я чувствовала себя живой? Когда — мёртвой?', category: 'energy' }
    ],
    en: [
        { q: "What am I avoiding right now by doing what I'm doing?", category: 'awareness' },
        { q: "If someone filmed the last 2 hours, what would they conclude I want from my life?", category: 'behavior' },
        { q: "Am I moving toward the life I fear or the life I want?", category: 'direction' },
        { q: "What's the most important thing I'm pretending isn't important?", category: 'priority' },
        { q: "What did I do today out of identity protection rather than genuine desire?", category: 'identity' },
        { q: "When did I feel most alive today? When did I feel most dead?", category: 'energy' }
    ]
});

const t = {
    ru: {
        title: 'Момент рефлексии',
        subtitle: 'Остановись и подумай',
        skip: 'Пропустить',
        submit: 'Сохранить',
        placeholder: 'Напиши свои мысли...',
        thanks: 'Спасибо за честность с собой ✨',
        history: 'История',
        modeQuestion: 'Вопрос',
        modeJournal: 'Журнал'
    },
    en: {
        title: 'Reflection Moment',
        subtitle: 'Pause and think',
        skip: 'Skip',
        submit: 'Save',
        placeholder: 'Write your thoughts...',
        thanks: 'Thank you for being honest with yourself ✨',
        history: 'History',
        modeQuestion: 'Question',
        modeJournal: 'Journal'
    }
};

export const DailyInterruptModal: React.FC<DailyInterruptModalProps> = ({
    isOpen,
    onClose,
    onAnswer,
    onOpenHistory,
    language,
    gender = 'male'
}) => {
    const [mode, setMode] = useState<'question' | 'journal'>('journal');
    const [currentQuestion, setCurrentQuestion] = useState<{ q: string; category: string } | null>(null);
    const [answer, setAnswer] = useState('');
    const [journalEntries, setJournalEntries] = useState<Record<string, string>>({});
    const [showThanks, setShowThanks] = useState(false);

    const labels = t[language];
    const questions = getQuestions(gender as 'male' | 'female')[language];
    const fields = getJournalFields(gender as 'male' | 'female')[language];

    useEffect(() => {
        if (isOpen) {
            const randomIndex = Math.floor(Math.random() * questions.length);
            setCurrentQuestion(questions[randomIndex]);
            setAnswer('');
            setJournalEntries({});
            setShowThanks(false);
        }
    }, [isOpen, questions]);

    const handleSubmitQuestion = () => {
        if (currentQuestion && answer.trim()) {
            onAnswer(currentQuestion.q, answer);
            setShowThanks(true);
            setTimeout(() => onClose(), 2000);
        }
    };

    const handleSubmitJournal = () => {
        const filled = Object.entries(journalEntries).filter(([, v]) => v.trim());
        if (filled.length > 0) {
            const combined = fields
                .filter(f => journalEntries[f.key]?.trim())
                .map(f => `${f.icon} ${f.label} ${journalEntries[f.key]}`)
                .join('\n');
            onAnswer('📝 Микро-журнал', combined);
            setShowThanks(true);
            setTimeout(() => onClose(), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
            <div
                className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in bg-surface"
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
            >
                {/* Header */}
                <div className="relative p-5 pb-3 bg-gradient-to-br from-brand/20 to-brand/5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surfaceHighlight transition-colors"
                    >
                        <X className="w-5 h-5 text-textSecondary" />
                    </button>

                    {onOpenHistory && (
                        <button
                            onClick={onOpenHistory}
                            className="absolute top-4 right-14 p-2 rounded-full hover:bg-surfaceHighlight transition-colors"
                            title={labels.history}
                        >
                            <BookOpen className="w-5 h-5 text-textSecondary" />
                        </button>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-brand/20">
                            <Brain className="w-6 h-6 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-textPrimary">{labels.title}</h2>
                            <p className="text-sm text-textSecondary">{labels.subtitle}</p>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-surface/50 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setMode('journal')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'journal' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                                }`}
                        >
                            <BookOpen size={12} /> {labels.modeJournal}
                        </button>
                        <button
                            onClick={() => setMode('question')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'question' ? 'bg-brand text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                                }`}
                        >
                            <Brain size={12} /> {labels.modeQuestion}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {showThanks ? (
                        <div className="text-center py-8 animate-fade-slide-up">
                            <Sparkles className="w-12 h-12 text-brand mx-auto mb-4" />
                            <p className="text-lg font-medium text-textPrimary">{labels.thanks}</p>
                        </div>
                    ) : mode === 'journal' ? (
                        <>
                            {/* Micro-Journal: 3 structured fields */}
                            <div className="space-y-3">
                                {fields.map(field => (
                                    <div key={field.key}>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-1.5">
                                            {(() => { const FIcon = fieldIcon(field.key); return <FIcon size={16} strokeWidth={2.5} className={field.color} />; })()} <span className={field.color}>{field.label}</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={journalEntries[field.key] || ''}
                                            onChange={(e) => setJournalEntries(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-3 rounded-xl bg-surfaceHighlight border border-borderSubtle text-textPrimary text-sm focus:ring-2 focus:ring-brand/50 focus:outline-none transition-all placeholder-textSecondary/60"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSubmitJournal();
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-surfaceHighlight text-textSecondary font-medium hover:bg-surface transition-colors"
                                >
                                    {labels.skip}
                                </button>
                                <button
                                    onClick={handleSubmitJournal}
                                    disabled={Object.values(journalEntries).every(v => !v.trim())}
                                    className="flex-1 py-3 rounded-xl bg-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
                                >
                                    {labels.submit}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Classic question mode */}
                            <div className="mb-5">
                                <p className="text-lg font-semibold text-textPrimary leading-relaxed">
                                    {currentQuestion?.q}
                                </p>
                            </div>

                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder={labels.placeholder}
                                className="w-full p-4 rounded-2xl bg-surfaceHighlight border border-borderSubtle text-textPrimary resize-none focus:ring-2 focus:ring-brand/50 focus:outline-none transition-all"
                                rows={4}
                                autoFocus
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-surfaceHighlight text-textSecondary font-medium hover:bg-surface transition-colors"
                                >
                                    {labels.skip}
                                </button>
                                <button
                                    onClick={handleSubmitQuestion}
                                    disabled={!answer.trim()}
                                    className="flex-1 py-3 rounded-xl bg-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
                                >
                                    {labels.submit}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyInterruptModal;
