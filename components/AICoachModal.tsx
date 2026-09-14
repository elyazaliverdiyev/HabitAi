
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';
import { COACH_PERSONALITIES, CoachPersonality, ChatMessage, streamCoachMessage, getCoachById } from '../services/ai/ai-coach';
import { Habit } from '../types';
import { translations } from '../translations';

interface AICoachModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    language?: 'ru' | 'en';
    isPro: boolean;
}

const AICoachModal: React.FC<AICoachModalProps> = ({
    isOpen, onClose, habits, language = 'ru', isPro,
}) => {
    const [selectedCoach, setSelectedCoach] = useState<string>(() =>
        localStorage.getItem('ai_coach_personality') || 'sensei'
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [showPicker, setShowPicker] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const coach = getCoachById(selectedCoach);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingText]);

    // Persist coach selection
    useEffect(() => {
        localStorage.setItem('ai_coach_personality', selectedCoach);
    }, [selectedCoach]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setStreamingText('');
            setIsStreaming(false);
            abortRef.current?.abort();
        }
    }, [isOpen]);

    const selectCoach = useCallback((id: string) => {
        setSelectedCoach(id);
        setShowPicker(false);
        setMessages([]);

        // Send greeting
        const c = getCoachById(id);
        const greeting: ChatMessage = {
            role: 'assistant',
            content: language === 'ru'
                ? `${c.emoji} Привет! Я — ${c.nameRu}. Расскажи, как у тебя дела с привычками?`
                : `${c.emoji} Hey! I'm ${c.name}. Tell me, how are your habits going?`,
            timestamp: Date.now(),
        };
        setMessages([greeting]);
    }, [language]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isStreaming || !isPro) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsStreaming(true);
        setStreamingText('');

        abortRef.current = new AbortController();

        try {
            const fullText = await streamCoachMessage(
                selectedCoach,
                newMessages,
                habits,
                language,
                (chunk) => {
                    setStreamingText(prev => prev + chunk);
                },
                undefined,
                abortRef.current.signal,
            );

            // Add assistant response to messages
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: fullText,
                timestamp: Date.now(),
            }]);
            setStreamingText('');
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: language === 'ru'
                        ? '😔 Произошла ошибка. Попробуй ещё раз.'
                        : '😔 An error occurred. Please try again.',
                    timestamp: Date.now(),
                }]);
            }
        } finally {
            setIsStreaming(false);
            setStreamingText('');
        }
    }, [input, isStreaming, isPro, messages, selectedCoach, habits, language]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const resetChat = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setShowPicker(true);
        setIsStreaming(false);
        setStreamingText('');
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={language === 'ru' ? '🤖 AI Коуч' : '🤖 AI Coach'} size="lg">
            <div className="flex flex-col h-[65vh] -mx-5 -mb-5">

                {/* Coach Picker */}
                {showPicker ? (
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <p className="text-sm text-textSecondary mb-4 text-center">
                            {language === 'ru' ? 'Выбери стиль коуча:' : 'Choose your coach style:'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {COACH_PERSONALITIES.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => selectCoach(c.id)}
                                    className="p-4 rounded-2xl border border-borderSubtle bg-surface hover:bg-surfaceHighlight transition-all active:scale-95 text-left group"
                                    style={{
                                        borderColor: selectedCoach === c.id ? c.color : undefined,
                                        boxShadow: selectedCoach === c.id ? `0 0 20px ${c.color}20` : undefined,
                                    }}
                                >
                                    <div className="text-2xl mb-2">{c.emoji}</div>
                                    <h3 className="font-bold text-sm text-textPrimary">
                                        {language === 'ru' ? c.nameRu : c.name}
                                    </h3>
                                    <p className="text-[11px] text-textSecondary mt-1 line-clamp-2">
                                        {language === 'ru' ? c.descriptionRu : c.description}
                                    </p>
                                    <div
                                        className="w-full h-1 rounded-full mt-3 opacity-50"
                                        style={{ background: c.color }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-5 py-2 border-b border-borderSubtle">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{coach.emoji}</span>
                                <span className="text-sm font-bold text-textPrimary">
                                    {language === 'ru' ? coach.nameRu : coach.name}
                                </span>
                                <span
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ background: coach.color }}
                                />
                            </div>
                            <button
                                onClick={resetChat}
                                className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight transition-colors"
                                title={language === 'ru' ? 'Новый чат' : 'New chat'}
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-brand text-white rounded-br-md'
                                                : 'bg-surfaceHighlight text-textPrimary rounded-bl-md'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming response */}
                            {isStreaming && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-surfaceHighlight text-textPrimary text-sm leading-relaxed">
                                        {streamingText || (
                                            <span className="flex items-center gap-2 text-textSecondary">
                                                <Sparkles size={14} className="animate-spin" style={{ color: coach.color }} />
                                                {language === 'ru' ? 'Думаю...' : 'Thinking...'}
                                            </span>
                                        )}
                                        {streamingText && (
                                            <span className="inline-block w-[2px] h-4 ml-0.5 animate-pulse align-middle" style={{ background: coach.color }} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="px-4 py-3 border-t border-borderSubtle">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={language === 'ru' ? 'Напиши что-нибудь...' : 'Type something...'}
                                    rows={1}
                                    className="flex-1 resize-none bg-surfaceHighlight rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder-textSecondary outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                                    style={{ maxHeight: '100px' }}
                                    disabled={isStreaming}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isStreaming || !input.trim()}
                                    className="p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30"
                                    style={{
                                        background: coach.color,
                                        color: 'white',
                                        boxShadow: `0 4px 12px ${coach.color}40`,
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AICoachModal;
