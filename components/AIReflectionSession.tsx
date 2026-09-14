import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Brain, ArrowRight, Sparkles, MessageCircle, Loader2, CheckCircle2, RotateCcw, BookOpen, Save } from 'lucide-react';
import { Habit } from '../types';
import { generateReflectionFollowUp, generateReflectionInsight } from '../services/ai';

interface AIReflectionSessionProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveReflection: (question: string, answer: string, aiInsight?: string) => void;
    onSaveFullSession?: (session: ReflectionSession) => void;
    onOpenHistory?: () => void;
    habits: Habit[];
    language: 'ru' | 'en';
    gender?: 'male' | 'female';
}

export interface ReflectionSession {
    id: string;
    date: string;
    messages: { role: 'ai' | 'user'; content: string }[];
    insight: string;
}

interface Message {
    role: 'ai' | 'user';
    content: string;
    isQuestion?: boolean;
}

const t = {
    ru: {
        title: 'Глубокая рефлексия',
        subtitle: 'AI-коуч поможет разобраться',
        thinking: 'Формулирую вопрос...',
        placeholder: 'Напиши честно, что чувствуешь...',
        send: 'Отправить',
        finish: 'Сохранить',
        analyzing: 'Анализирую ответы...',
        sessionComplete: 'Сессия завершена',
        insight: 'Мой анализ',
        newSession: 'Ещё сессия',
        questionNum: 'Вопрос',
        of: 'из',
        history: 'История',
        saved: 'Сессия сохранена',
        moodPrompt: 'Как ты сейчас себя чувствуешь?'
    },
    en: {
        title: 'Deep Reflection',
        subtitle: 'AI coach will help you understand',
        thinking: 'Forming a question...',
        placeholder: 'Write honestly what you feel...',
        send: 'Send',
        finish: 'Save',
        analyzing: 'Analyzing your answers...',
        sessionComplete: 'Session Complete',
        insight: 'My Analysis',
        newSession: 'New Session',
        questionNum: 'Question',
        of: 'of',
        history: 'History',
        saved: 'Session saved',
        moodPrompt: 'How are you feeling right now?'
    }
};

// Deep reflection questions - organized by category
const getDeepQuestions = (gender: 'male' | 'female' = 'male') => ({
    ru: [
        // Оригинальные
        'Что сейчас занимает твои мысли больше всего?',
        gender === 'male' ? 'Если бы ты мог изменить одну вещь в своём дне — что бы это было?' : 'Если бы ты могла изменить одну вещь в своём дне — что бы это было?',
        gender === 'male' ? 'Когда сегодня ты чувствовал себя по-настоящему живым?' : 'Когда сегодня ты чувствовала себя по-настоящему живой?',
        // CBT (когнитивно-поведенческая терапия)
        'Какую мысль ты повторяешь себе чаще всего? Она помогает или мешает?',
        gender === 'male' ? 'Что ты избегал сегодня и какое чувство стоит за этим избеганием?' : 'Что ты избегала сегодня и какое чувство стоит за этим избеганием?',
        'Есть ли у тебя мысль с которой ты споришь? Какие факты за и против?',
        // Стоицизм
        'Что в твоем дне было в твоей власти, а что нет?',
        gender === 'male' ? 'Если бы сегодня был твой последний день — доволен ли ты как его прожил?' : 'Если бы сегодня был твой последний день — довольна ли ты как его прожила?',
        // Благодарность / рост
        gender === 'male' ? 'За что ты благодарен сегодня? Почему именно это?' : 'За что ты благодарна сегодня? Почему именно это?',
        'Какой маленький шаг ты можешь сделать завтра для большой цели?',
        'Какая привычка помогла тебе больше всего и почему?'
    ],
    en: [
        'What\'s occupying your mind the most right now?',
        'If you could change one thing about your day — what would it be?',
        'When did you feel truly alive today?',
        // CBT
        'What thought do you repeat to yourself most often? Does it help or hinder you?',
        'What were you avoiding today and what feeling is behind that avoidance?',
        'Is there a belief you\'re arguing with? What are the facts for and against it?',
        // Stoicism
        'What in your day was within your control and what was not?',
        'If today were your last day — would you be satisfied with how you lived it?',
        // Gratitude / Growth
        'What are you grateful for today? Why that specifically?',
        'What small step can you take tomorrow toward a big goal?',
        'Which habit helped you the most and why?'
    ]
});

const MOOD_OPTIONS = [
    { emoji: '😩', label: { ru: 'Тяжело', en: 'Struggling' }, value: 1 },
    { emoji: '😔', label: { ru: 'Не очень', en: 'Not great' }, value: 2 },
    { emoji: '😐', label: { ru: 'Нормально', en: 'Okay' }, value: 3 },
    { emoji: '😊', label: { ru: 'Хорошо', en: 'Good' }, value: 4 },
    { emoji: '🤩', label: { ru: 'Отлично!', en: 'Great!' }, value: 5 },
];

export const AIReflectionSession: React.FC<AIReflectionSessionProps> = ({
    isOpen,
    onClose,
    onSaveReflection,
    onSaveFullSession,
    onOpenHistory,
    habits,
    language,
    gender = 'male'
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [finalInsight, setFinalInsight] = useState<string | null>(null);
    const [mood, setMood] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const labels = t[language];
    const MAX_QUESTIONS = 4;

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Initialize session after mood is selected
    useEffect(() => {
        if (isOpen && messages.length === 0 && mood !== null) {
            const questions = getDeepQuestions(gender as 'male' | 'female')[language];
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            const moodContext = mood <= 2
                ? (language === 'ru' ? 'Я вижу, сейчас непросто. Давай разберёмся. ' : 'I see things are tough right now. Let\'s work through this. ')
                : mood >= 4
                    ? (language === 'ru' ? 'Отличное настроение! Давай углубимся. ' : 'Great mood! Let\'s go deeper. ')
                    : '';
            setMessages([{ role: 'ai', content: moodContext + randomQ, isQuestion: true }]);
            setQuestionCount(1);
        }
    }, [isOpen, language, messages.length, mood]);

    // Generate follow-up question using AI service
    const handleGenerateFollowUp = useCallback(async (allMessages: Message[]) => {
        setIsLoading(true);

        const isLastQuestion = questionCount >= MAX_QUESTIONS - 1;

        // Convert to simple format for API
        const conversation = allMessages.map(m => ({ role: m.role, content: m.content }));

        try {
            const question = await generateReflectionFollowUp(conversation, isLastQuestion, language);
            console.log('Final AI Question received:', question);
            setMessages(prev => [...prev, { role: 'ai', content: question, isQuestion: true }]);
            setQuestionCount(prev => prev + 1);
        } catch (error) {
            console.error('Follow-up error:', error);

            // Smart fallback based on question count
            const fallbacks = language === 'ru'
                ? [
                    'Что ты при этом чувствуешь глубоко внутри?',
                    'Почему именно это так важно для тебя?',
                    'Что бы изменилось в твоей жизни, если бы это было иначе?',
                    'Что самое важное ты хочешь из этого вынести?'
                ]
                : [
                    'What do you feel deep inside about this?',
                    'Why is this so important to you specifically?',
                    'What would change in your life if this were different?',
                    'What\'s the most important thing you want to take from this?'
                ];

            const fallback = fallbacks[Math.min(questionCount, fallbacks.length - 1)];
            setMessages(prev => [...prev, { role: 'ai', content: fallback, isQuestion: true }]);
            setQuestionCount(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    }, [questionCount, language]);

    // Generate final analysis using AI service
    const handleGenerateFinalAnalysis = useCallback(async (allMessages: Message[]) => {
        setIsLoading(true);

        const conversation = allMessages.map(m => ({ role: m.role, content: m.content }));

        try {
            const insight = await generateReflectionInsight(conversation, language);
            console.log('Final AI Insight received:', insight);
            setFinalInsight(insight);
            setIsComplete(true);

            // Save full session
            const session: ReflectionSession = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                messages: conversation,
                insight
            };

            if (onSaveFullSession) {
                onSaveFullSession(session);
            }

            // Save individual Q&A pairs with insight on last one
            for (let i = 0; i < allMessages.length; i += 2) {
                if (allMessages[i] && allMessages[i + 1]) {
                    const isLast = i >= allMessages.length - 2;
                    onSaveReflection(
                        allMessages[i].content,
                        allMessages[i + 1].content,
                        isLast ? insight : undefined
                    );
                }
            }
        } catch (error) {
            console.error('Analysis error:', error);

            // Generate a meaningful fallback based on conversation
            const userAnswers = allMessages.filter(m => m.role === 'user').map(m => m.content);
            const fallbackInsight = language === 'ru'
                ? `В этой сессии ${gender === 'male' ? 'ты глубоко погрузился в свои мысли. Твои ответы показывают, что ты готов к переменам и честен с собой' : 'ты глубоко погрузилась в свои мысли. Твои ответы показывают, что ты готова к переменам и честна с собой'} — это важный первый шаг. То, о чём ты говоришь — "${userAnswers[0]?.slice(0, 50)}..." — это ключевая тема для размышлений. Продолжай исследовать эти мысли, записывай свои инсайты. Помни: осознанность — это уже половина пути к изменениям.`
                : `In this session, you dove deep into your thoughts. Your answers show you're ready for change and honest with yourself — that's an important first step. What you're talking about — "${userAnswers[0]?.slice(0, 50)}..." — is a key theme to explore. Keep investigating these thoughts, write down your insights. Remember: awareness is already half the journey to change.`;

            setFinalInsight(fallbackInsight);
            setIsComplete(true);

            // Still save
            const session: ReflectionSession = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                messages: conversation,
                insight: fallbackInsight
            };

            if (onSaveFullSession) {
                onSaveFullSession(session);
            }
        } finally {
            setIsLoading(false);
        }
    }, [language, onSaveReflection, onSaveFullSession]);

    // Handle user response
    const handleSend = async () => {
        if (!currentInput.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: currentInput.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setCurrentInput('');

        if (questionCount >= MAX_QUESTIONS) {
            await handleGenerateFinalAnalysis(newMessages);
        } else {
            await handleGenerateFollowUp(newMessages);
        }
    };

    // Reset session
    const resetSession = () => {
        setMessages([]);
        setQuestionCount(0);
        setIsComplete(false);
        setFinalInsight(null);
        setCurrentInput('');
        setMood(null);
    };

    // Handle close
    const handleClose = () => {
        resetSession();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
            {/* Classic white modal for daylight theme */}
            <div
                className="w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] min-h-0 rounded-3xl bg-surface"
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
            >
                {/* Header */}
                <div
                    className="relative p-4 shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="p-2.5 rounded-2xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                <Brain className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-textPrimary">{labels.title}</h2>
                                <p className="text-xs text-textSecondary">{labels.subtitle}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {onOpenHistory && (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onOpenHistory();
                                    }}
                                    className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                                    title={labels.history}
                                >
                                    <BookOpen className="w-5 h-5 text-textSecondary" />
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-textSecondary" />
                            </button>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    {!isComplete && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(questionCount / MAX_QUESTIONS) * 100}%`,
                                        background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)'
                                    }}
                                />
                            </div>
                            <span className="text-xs font-medium text-textSecondary">
                                {questionCount}/{MAX_QUESTIONS}
                            </span>
                        </div>
                    )}
                </div>

                {/* Mood Check-in Screen */}
                {mood === null ? (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
                        <Brain size={28} className="text-textSecondary" />
                        <h3 className="text-base font-bold text-textPrimary mb-1 text-center">{labels.moodPrompt}</h3>
                        <div className="flex flex-wrap justify-center gap-2 mt-4 w-full max-w-xs">
                            {MOOD_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setMood(opt.value)}
                                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-surfaceHighlight transition-all hover:scale-110 active:scale-95 min-w-[56px]"
                                >
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <span className="text-[9px] font-medium text-textSecondary leading-tight text-center">{opt.label[language]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                >
                                    <div
                                        className={`max-w-[95%] p-3.5 pb-5 rounded-2xl ${msg.role === 'user' ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
                                        style={msg.role === 'user'
                                            ? {
                                                background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                                                color: 'white',
                                                maxWidth: '85%'
                                            }
                                            : {
                                                background: 'var(--color-surfaceHighlight)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid var(--color-borderSubtle)'
                                            }
                                        }
                                    >
                                        {msg.role === 'ai' && (
                                            <MessageCircle size={12} className="inline mr-1.5 opacity-50 text-textSecondary" />
                                        )}
                                        <span className={`text-sm whitespace-normal break-words ${msg.isQuestion ? 'font-medium' : ''} ${msg.role === 'user' ? 'text-white' : 'text-textPrimary'}`}>
                                            {msg.content}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex justify-start animate-fadeIn">
                                    <div
                                        className="px-4 py-3 rounded-2xl rounded-bl-lg flex items-center gap-2"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)'
                                        }}
                                    >
                                        <Loader2 size={14} className="animate-spin text-purple-500" />
                                        <span className="text-sm text-textSecondary">
                                            {questionCount >= MAX_QUESTIONS ? labels.analyzing : labels.thinking}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Final Insight */}
                            {isComplete && finalInsight && (
                                <div
                                    className="mt-4 p-4 rounded-2xl animate-fadeIn"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.08) 50%, rgba(139, 92, 246, 0.1) 100%)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                        boxShadow: '0 4px 16px rgba(168, 85, 247, 0.1)'
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-purple-500" />
                                        <span className="font-bold text-sm text-textPrimary">{labels.insight}</span>
                                    </div>
                                    <p className="text-sm text-textPrimary leading-relaxed whitespace-pre-line">{finalInsight}</p>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div
                            className="p-4 shrink-0"
                            style={{
                                background: 'var(--color-surfaceHighlight)',
                                borderTop: '1px solid var(--color-borderSubtle)'
                            }}
                        >
                            {isComplete ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetSession}
                                        className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid rgba(0, 0, 0, 0.1)',
                                            color: '#374151'
                                        }}
                                    >
                                        <RotateCcw size={16} />
                                        {labels.newSession}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-white transition-all hover:scale-[1.02]"
                                        style={{
                                            background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                                            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
                                        }}
                                    >
                                        <Save size={16} />
                                        {labels.finish}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <textarea
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder={labels.placeholder}
                                        className="flex-1 p-3 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all text-textPrimary placeholder-textSecondary"
                                        style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-borderSubtle)'
                                        }}
                                        rows={2}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!currentInput.trim() || isLoading}
                                        className="gemini-glow-sm bg-surface px-4 rounded-xl font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 text-textPrimary shadow-lg"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AIReflectionSession;
