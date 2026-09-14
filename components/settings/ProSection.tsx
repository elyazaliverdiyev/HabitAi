
import React from 'react';
import { Crown, Check, ShieldCheck, Key, Users, MessageSquare, Copy, Lock } from 'lucide-react';
import ShinyText from '../ShinyText';

interface ProSectionProps {
    isPro: boolean;
    justUnlocked: boolean;
    promoCode: string;
    setPromoCode: (code: string) => void;
    isRedeeming: boolean;
    onRedeem: () => void;
    language: 'ru' | 'en';
    t: any;
    // Admin
    isAdmin?: boolean;
    isGenerating: boolean;
    maxUses: number;
    setMaxUses: (n: number) => void;
    onGenerate: (type: 'year' | 'lifetime' | '6months') => void;
    lastGeneratedCode: string;
    onCopyCode: () => void;
    onOpenFeedbackList?: () => void;
}

const ProSection: React.FC<ProSectionProps> = ({
    isPro, justUnlocked, promoCode, setPromoCode, isRedeeming, onRedeem,
    language, t, isAdmin, isGenerating, maxUses, setMaxUses, onGenerate,
    lastGeneratedCode, onCopyCode, onOpenFeedbackList
}) => (
    <>
        {/* Pro Banner / Redeem */}
        {(!isPro && !justUnlocked) ? (
            <div className="relative overflow-hidden bg-gradient-to-r from-brand via-purple-500 to-pink-500 rounded-2xl p-5 mb-6 text-center shadow-xl">
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <Crown className="mx-auto text-white mb-2" size={32} />
                <h3 className="font-black text-white text-xl tracking-tight">{t.unlockPro}</h3>
                <ul className="text-left text-white/90 text-xs my-4 space-y-1.5 px-4">
                    {t.proFeatures.map((f: string, i: number) => (
                        <li key={i} className="flex gap-2"><Check size={14} strokeWidth={3} /> {f}</li>
                    ))}
                </ul>

                <div className="flex gap-2 mt-4 relative z-10">
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder={t.enterCode}
                        className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder:text-white/60 text-xs font-bold outline-none uppercase focus:bg-white/30 transition-colors"
                    />
                    <button
                        onClick={onRedeem}
                        disabled={isRedeeming}
                        className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold uppercase hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
                    >
                        {isRedeeming ? '...' : 'OK'}
                    </button>
                </div>
            </div>
        ) : (
            <div className={`rounded-2xl p-6 mb-6 flex flex-col items-center justify-center gap-3 text-center shadow-lg relative overflow-hidden transition-all duration-500 ${justUnlocked ? 'bg-gradient-to-tr from-yellow-400 to-yellow-200 border-yellow-300 scale-105' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20'}`}>
                {justUnlocked && <div className="absolute inset-0 bg-white/40 animate-pulse pointer-events-none" />}
                <ShieldCheck className={justUnlocked ? "text-yellow-800 animate-bounce-sm" : "text-green-600"} size={32} />
                <div>
                    <div className={`font-black text-lg ${justUnlocked ? 'text-yellow-900' : 'text-green-700'}`}>
                        {justUnlocked ? (language === 'ru' ? "PRO АКТИВИРОВАН!" : "PRO ACTIVATED!") : t.allFeaturesActive}
                    </div>
                    <div className={`text-xs ${justUnlocked ? 'text-yellow-800/80 font-bold' : 'text-green-600/80'}`}>{t.thanks}</div>
                </div>
            </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
            <div className="mb-6 border-2 border-dashed border-red-500/30 bg-red-500/5 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                        <Key size={14} /> {t.adminGenerator}
                    </div>
                    {isGenerating && <span className="text-xs text-red-500 animate-pulse">...</span>}
                </div>

                <div className="flex items-center gap-2 mb-3 bg-surface p-2 rounded-xl border border-red-200">
                    <Users size={16} className="text-red-500 ml-1" />
                    <span className="text-xs font-bold text-textSecondary uppercase">{t.limit}</span>
                    <input
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                        className="flex-1 w-full bg-transparent font-bold text-textPrimary outline-none text-sm"
                    />
                    <span className="text-xs text-textSecondary font-medium">{t.times}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button onClick={() => onGenerate('6months')} disabled={isGenerating} className="bg-surface border border-borderSubtle py-2.5 rounded-xl text-[10px] font-black uppercase text-textPrimary hover:bg-surfaceHighlight hover:scale-[1.02] active:scale-95 transition-all shadow-sm">6 Mon</button>
                    <button onClick={() => onGenerate('year')} disabled={isGenerating} className="bg-surface border border-borderSubtle py-2.5 rounded-xl text-[10px] font-black uppercase text-textPrimary hover:bg-surfaceHighlight hover:scale-[1.02] active:scale-95 transition-all shadow-sm">1 Year</button>
                    <button onClick={() => onGenerate('lifetime')} disabled={isGenerating} className="bg-brand border border-transparent py-2.5 rounded-xl text-[10px] font-black uppercase text-white hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm shadow-brand/30">Life</button>
                </div>

                <button
                    onClick={onOpenFeedbackList}
                    className="w-full bg-surface border border-borderSubtle py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-textPrimary hover:bg-surfaceHighlight transition-all mb-4"
                >
                    <MessageSquare size={16} className="text-blue-500" />
                    {t.adminFeedback}
                </button>

                <div className="bg-surface p-3 rounded-xl border border-borderSubtle flex items-center justify-between shadow-sm">
                    <div className="flex flex-col flex-1 min-w-0 mr-2">
                        <span className="text-[10px] text-textSecondary uppercase font-bold mb-0.5">{t.lastCode}</span>
                        <code className="font-mono font-black text-lg text-brand select-all truncate">
                            {lastGeneratedCode || "..."}
                        </code>
                    </div>
                    <button onClick={onCopyCode} disabled={!lastGeneratedCode} className={`p-2 rounded-lg transition-all ${lastGeneratedCode ? 'bg-surfaceHighlight hover:bg-brand hover:text-white text-textPrimary shadow-sm' : 'opacity-30 cursor-not-allowed'}`}><Copy size={18} /></button>
                </div>
            </div>
        )}
    </>
);

export default ProSection;
