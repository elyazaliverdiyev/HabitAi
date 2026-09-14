
import React from 'react';
import { Mail, FileText, RefreshCw, Shield, Wand2 } from 'lucide-react';
import { SectionTitle, MenuItem } from './shared';

interface HelpSectionProps {
    onOpenFeedback: () => void;
    onOpenVault?: () => void;
    handleReload: () => void;
    onShowOnboarding?: () => void;
    language: 'ru' | 'en';
    t: any;
}

const HelpSection: React.FC<HelpSectionProps> = ({
    onOpenFeedback, onOpenVault, handleReload, onShowOnboarding, language, t
}) => (
    <>
        <SectionTitle>{t.help}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden">
            <MenuItem icon={Mail} label={t.feedback} onClick={onOpenFeedback} />
            <MenuItem icon={FileText} label={t.privacy} onClick={() => window.open('https://docs.google.com/document/d/1IPNFtNxWhexBOG_r28zvr-EsXorQ_-P7RjHxkEX8oTU/edit?usp=sharing', '_blank')} />
            {onShowOnboarding && (
                <MenuItem
                    icon={Wand2}
                    label={language === 'ru' ? 'Пройти онбординг заново' : 'Restart Onboarding'}
                    onClick={() => {
                        localStorage.removeItem('onboarding_done');
                        localStorage.removeItem('onboarding_skipped');
                        onShowOnboarding();
                    }}
                />
            )}
        </div>

        <div className="text-center mt-8 text-xs text-textSecondary font-medium opacity-50 flex items-center justify-center gap-2">
            <span>HabitAi v{(globalThis as any).__APP_VERSION__ || '2.1.0'}</span>
            <button
                onClick={handleReload}
                className="p-1 bg-surfaceHighlight rounded-full hover:bg-brand hover:text-white transition-colors"
                title={language === 'ru' ? "Обновить приложение (сбросить кэш)" : "Reload App (Clear Cache)"}
            >
                <RefreshCw size={10} />
            </button>
            {onOpenVault && (
                <button
                    onClick={onOpenVault}
                    className="p-1 bg-surfaceHighlight rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
                    title="Vault"
                >
                    <Shield size={10} />
                </button>
            )}
        </div>
    </>
);

export default HelpSection;
