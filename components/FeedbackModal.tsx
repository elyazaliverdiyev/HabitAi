
import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { translations } from '../translations';
import { Bug, Lightbulb, Heart, MessageSquare, Star, Send, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    language?: 'ru' | 'en';
}

type FeedbackType = 'bug' | 'idea' | 'thanks' | 'other';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user, language = 'ru' }) => {
    const t = translations[language].feedback;

    const [type, setType] = useState<FeedbackType>('idea');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [isSending, setIsSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!message.trim() && type !== 'thanks') return;

        setIsSending(true);
        setErrorMsg(null);

        // Create a timeout promise to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
        );

        try {
            // Race between the actual request and the 10s timer
            await Promise.race([
                supabase.from('feedback').insert({
                    type,
                    message,
                    rating,
                    user_id: user?.id || null,
                    user_email: user?.email || 'anonymous',
                    created_at: new Date().toISOString(),
                    app_version: '13.0.0',
                    user_agent: navigator.userAgent,
                    language: language
                }),
                timeoutPromise
            ]);

            setSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset after closing
                setTimeout(() => {
                    setSuccess(false);
                    setMessage('');
                    setType('idea');
                    setRating(5);
                    setIsSending(false);
                    setErrorMsg(null);
                }, 300);
            }, 1500);
        } catch (e: any) {
            console.error("Feedback error:", e);
            setIsSending(false);

            if (e.message === "Timeout") {
                setErrorMsg(language === 'ru' ? "Превышено время ожидания. Проверьте интернет." : "Request timed out. Check connection.");
            } else if (e.code === 'permission-denied') {
                setErrorMsg(language === 'ru' ? "Ошибка доступа. Попробуйте позже." : "Access denied. Try again later.");
            } else {
                setErrorMsg(t.error);
            }
        }
    };

    const types = [
        { id: 'bug', icon: Bug, label: t.types.bug, color: 'text-red-500', bg: 'bg-red-500/10' },
        { id: 'idea', icon: Lightbulb, label: t.types.idea, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'thanks', icon: Heart, label: t.types.thanks, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { id: 'other', icon: MessageSquare, label: t.types.other, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
            {success ? (
                <div className="py-12 flex flex-col items-center text-center animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 mb-4">
                        <Heart size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-bold text-textPrimary">{t.success}</h3>
                </div>
            ) : (
                <div className="space-y-6 pt-2">
                    {/* Type Selector */}
                    <div>
                        <label className="text-xs font-bold text-textSecondary uppercase mb-2 block pl-1">{t.type}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {types.map((item) => {
                                const isSelected = type === item.id;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setType(item.id as FeedbackType)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isSelected ? `border-brand bg-brand/5 ring-1 ring-brand/20` : 'border-borderSubtle bg-surfaceHighlight/20 hover:bg-surfaceHighlight/50'}`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-textPrimary' : 'text-textSecondary'}`}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="text-xs font-bold text-textSecondary uppercase mb-2 block pl-1">{t.rateUs}</label>
                        <div className="flex justify-center gap-2 bg-surfaceHighlight/30 p-3 rounded-2xl border border-borderSubtle">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`transition-all hover:scale-110 active:scale-95 ${star <= rating ? 'text-yellow-400' : 'text-textSecondary/20'}`}
                                >
                                    <Star size={28} fill={star <= rating ? "currentColor" : "none"} strokeWidth={star <= rating ? 0 : 2} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t.messagePlaceholder}
                            className="w-full h-32 bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-4 text-sm text-textPrimary placeholder:text-textSecondary/50 resize-none outline-none focus:border-brand/50 focus:bg-surfaceHighlight/50 transition-all"
                        />
                    </div>

                    {/* Error Message Display */}
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-fadeIn">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <span className="text-xs text-red-600 font-medium">{errorMsg}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSending || (!message.trim() && type !== 'thanks')}
                        className="w-full bg-brand text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/20"
                    >
                        {isSending ? (
                            <span>{t.sending}</span>
                        ) : (
                            <>
                                <Send size={18} />
                                {t.send}
                            </>
                        )}
                    </button>
                </div>
            )}
        </Modal>
    );
};

export default FeedbackModal;
