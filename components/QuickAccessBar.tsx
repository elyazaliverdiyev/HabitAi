import React from 'react';
import { Gift, Sparkles, Mic } from 'lucide-react';

interface QuickAccessBarProps {
    language: 'ru' | 'en';
    highestStreak: number;
    activeIdentity: boolean;
    onRewardsOpen: () => void;
    onMindMovieOpen: () => void;
    onVoiceAssistantOpen: () => void;
}

const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
    language,
    highestStreak,
    activeIdentity,
    onRewardsOpen,
    onMindMovieOpen,
    onVoiceAssistantOpen,
}) => {
    return (
        <div className="flex items-center gap-1.5 pb-2">
            <button
                onClick={onRewardsOpen}
                className="relative p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all active:scale-95"
                title={language === 'ru' ? 'Награды' : 'Rewards'}
            >
                <Gift size={20} />
                {highestStreak > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full font-black flex items-center justify-center">
                        {highestStreak}
                    </span>
                )}
            </button>

            <button
                onClick={onMindMovieOpen}
                className={`gemini-glow-sm p-3 border rounded-xl transition-all active:scale-95 ${activeIdentity ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20' : 'bg-surfaceHighlight text-textSecondary border-borderSubtle/50 hover:bg-brand/10'}`}
                title={language === 'ru' ? 'Видение' : 'Mind Movie'}
            >
                <Sparkles size={20} />
            </button>

            <button
                onClick={onVoiceAssistantOpen}
                className="gemini-glow-sm p-3 bg-surfaceHighlight text-textSecondary border border-borderSubtle/50 rounded-xl hover:bg-brand/10 hover:text-brand hover:border-brand/20 transition-all active:scale-95"
                title={language === 'ru' ? 'AI Ассистент' : 'AI Assistant'}
            >
                <Mic size={20} />
            </button>

            <div className="flex-1" />

            {/* Compact Date Display */}
            <div className="text-xs text-textSecondary font-medium bg-surfaceHighlight/50 px-3 py-2 rounded-xl border border-borderSubtle">
                {new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
        </div>
    );
};

export default QuickAccessBar;
