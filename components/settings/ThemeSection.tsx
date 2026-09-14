
import React from 'react';
import { Check, Lock } from 'lucide-react';
import { AppTheme, THEMES, AVAILABLE_COLORS, ACCENT_GRADIENTS } from '../../types';
import { SectionTitle } from './shared';
import { PRO_THEMES } from '../../constants';
import { triggerHaptic } from '../../utils/helpers';

interface ThemeSectionProps {
    currentThemeId: string;
    onSetTheme: (theme: AppTheme) => void;
    isPro: boolean;
    justUnlocked: boolean;
    accentColor?: string | null;
    setAccentColor?: (color: string | null) => void;
    language: 'ru' | 'en';
    t: any;
}

const ThemeSection: React.FC<ThemeSectionProps> = ({
    currentThemeId, onSetTheme, isPro, justUnlocked,
    accentColor, setAccentColor, language, t
}) => (
    <>
        <SectionTitle>{t.themes}</SectionTitle>
        <div className="grid grid-cols-1 gap-2 bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle p-2">
            {THEMES.map(theme => {
                const isLocked = (!isPro && !justUnlocked) && PRO_THEMES.includes(theme.id);
                const displayName = language === 'en' ? (theme.labels?.en || 'Unknown') : (theme.labels?.ru || 'Неизвестно');

                return (
                    <button
                        key={theme.id}
                        onClick={() => {
                            // PRO-тема без подписки не применяется — иначе guard в App.tsx
                            // отберёт её при перезагрузке, и тема «не сохранится».
                            if (isLocked) {
                                triggerHaptic();
                                return;
                            }
                            onSetTheme(theme);
                        }}
                        aria-disabled={isLocked}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentThemeId === theme.id ? 'bg-surface border-brand' : 'border-transparent hover:bg-surfaceHighlight/50'} ${isLocked ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border shadow-sm relative" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceHighlight }}>
                                {isLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full"><Lock size={12} className="text-white" /></div>}
                            </div>
                            <span className={`text-sm font-medium ${currentThemeId === theme.id ? 'text-textPrimary' : 'text-textSecondary'}`}>{displayName}</span>
                            {isLocked && (
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500/70">
                                    PRO
                                </span>
                            )}
                        </div>
                        {currentThemeId === theme.id && <Check size={16} className="text-brand" />}
                    </button>
                );
            })}
        </div>

        <SectionTitle>{t.accent}</SectionTitle>
        <div className="bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle p-3 mb-2">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-textSecondary">{t.accentDesc}</span>
                {accentColor && (
                    <button onClick={() => setAccentColor?.(null)} className="text-[10px] text-textSecondary hover:text-textPrimary underline">{t.reset}</button>
                )}
            </div>

            {/* Gradient Options */}
            <div className="mb-3">
                <span className="text-[10px] font-bold text-textSecondary uppercase mb-2 block">{language === 'ru' ? 'Градиенты' : 'Gradients'}</span>
                <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                    {ACCENT_GRADIENTS.map(g => {
                        const isActive = accentColor === `gradient-${g.id}`;
                        return (
                            <button
                                key={g.id}
                                onClick={() => setAccentColor?.(`gradient-${g.id}`)}
                                className={`w-9 h-9 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${isActive ? 'scale-110 ring-2 ring-offset-2 ring-textPrimary ring-offset-surface' : 'hover:scale-105'}`}
                                style={{ background: g.gradient }}
                                title={g.name}
                            >
                                {isActive && <Check size={16} className="text-white/80" strokeWidth={4} />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Solid Colors */}
            <div>
                <span className="text-[10px] font-bold text-textSecondary uppercase mb-2 block">{language === 'ru' ? 'Сплошные цвета' : 'Solid Colors'}</span>
                <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                    {AVAILABLE_COLORS.map(c => {
                        const isActive = accentColor === c;
                        return (
                            <button
                                key={c}
                                onClick={() => setAccentColor?.(c)}
                                className={`w-9 h-9 rounded-full flex-shrink-0 transition-all flex items-center justify-center ${isActive ? 'scale-110 ring-2 ring-offset-2 ring-textPrimary ring-offset-surface' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            >
                                {isActive && <Check size={16} className="text-white/80" strokeWidth={4} />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    </>
);

export default ThemeSection;
