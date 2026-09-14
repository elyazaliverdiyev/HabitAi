
import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { AppTheme, DEFAULT_CURRENCY } from '../types';
import { translations } from '../translations';
import { useToast } from './Toast';

import AvatarPicker from './AvatarPicker';
import { removeUndefined } from '../utils/helpers';

// Section Components
import AccountBanner from './settings/AccountBanner';
import ProSection from './settings/ProSection';
import ThemeSection from './settings/ThemeSection';
import AISettingsSection from './settings/AISettingsSection';
import DataSection from './settings/DataSection';
import HelpSection from './settings/HelpSection';

// Re-export DisplayOptions for backward compatibility
export { type DisplayOptions } from './settings/types';

/**
 * SettingsModal — Настройки в стиле iOS.
 *
 * Редизайн: вместо одного бесконечного скролла — сегментированные вкладки:
 *   Профиль | Оформление | Приложение
 * Каждая вкладка — компактный список. Порядок навигации как в iOS Settings.
 */
type SettingsTab = 'profile' | 'appearance' | 'app';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    options: import('./settings/types').DisplayOptions;
    setOptions: (options: import('./settings/types').DisplayOptions) => void;
    onExport: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenArchive: () => void;
    currentThemeId: string;
    onSetTheme: (theme: AppTheme) => void;
    user: any;
    onLogout: () => void;
    isPro: boolean;
    proExpiry?: string | null;
    onRedeemCode: (code: string) => Promise<boolean>;
    onGenerateCode?: (type: 'year' | 'lifetime' | '6months', maxUses: number) => Promise<string>;
    isAdmin?: boolean;
    accentColor?: string | null;
    setAccentColor?: (color: string | null) => void;
    aiSuggestionCount: number;
    setAiSuggestionCount: (count: number) => void;
    language?: 'ru' | 'en';
    setLanguage?: (lang: 'ru' | 'en') => void;
    closeOnBackdropClick?: boolean;
    voiceId?: string;
    setVoiceId?: (voice: string) => void;
    isWakeWordEnabled?: boolean;
    setIsWakeWordEnabled?: (enabled: boolean) => void;
    onOpenFeedback: () => void;
    onOpenFeedbackList?: () => void;
    defaultCurrency?: string;
    gender?: 'male' | 'female';
    setGender?: (gender: 'male' | 'female') => void;
    setDefaultCurrency?: (currency: string) => void;
    soundPack?: 'off' | 'synth' | 'premium';
    setSoundPack?: (pack: 'off' | 'synth' | 'premium') => void;
    timeFocusMode?: boolean;
    setTimeFocusMode?: (enabled: boolean) => void;
    notificationsEnabled?: boolean;
    setNotificationsEnabled?: (enabled: boolean) => void;
    morningBriefingTime?: string;
    setMorningBriefingTime?: (time: string) => void;
    calendarStyle?: 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress';
    setCalendarStyle?: (style: 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress') => void;
    avatarType?: 'emoji' | 'photo' | 'preset' | 'google';
    avatarValue?: string;
    setAvatar?: (type: 'emoji' | 'photo' | 'preset' | 'google', value: string) => void;
    onOpenVault?: () => void;
    onShowOnboarding?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, options, setOptions, onExport, onImport, onOpenArchive,
    currentThemeId, onSetTheme, user, onLogout,
    isPro, proExpiry, onRedeemCode, onGenerateCode, isAdmin,
    accentColor, setAccentColor,
    aiSuggestionCount, setAiSuggestionCount,
    language = 'ru', setLanguage,
    closeOnBackdropClick = true,
    onOpenFeedback,
    onOpenFeedbackList,
    defaultCurrency = DEFAULT_CURRENCY,
    setDefaultCurrency,
    soundPack = 'premium',
    setSoundPack,
    timeFocusMode = false,
    setTimeFocusMode,
    notificationsEnabled = false,
    setNotificationsEnabled,
    morningBriefingTime = '07:00',
    setMorningBriefingTime,
    calendarStyle = 'rings',
    setCalendarStyle,
    avatarType,
    avatarValue,
    setAvatar,
    gender = 'male',
    setGender,
    onOpenVault,
    onShowOnboarding,
}) => {
    const t = translations[language].settings;
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [promoCode, setPromoCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGeneratedCode, setLastGeneratedCode] = useState('');
    const [maxUses, setMaxUses] = useState(10);
    const [justUnlocked, setJustUnlocked] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');

    const handleRedeem = async () => {
        if (!promoCode.trim()) return;
        setIsRedeeming(true);
        const success = await onRedeemCode(promoCode.trim());
        setIsRedeeming(false);
        if (success) {
            setPromoCode('');
            setJustUnlocked(true);
        }
    };

    const handleGenerate = async (type: 'year' | 'lifetime' | '6months') => {
        if (onGenerateCode) {
            setIsGenerating(true);
            try {
                const code = await onGenerateCode(type, maxUses);
                if (code) setLastGeneratedCode(code);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleCustomKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        setCustomApiKey(val);
        if (val) localStorage.setItem('custom_gemini_api_key', val);
        else localStorage.removeItem('custom_gemini_api_key');
    };

    const copyCode = () => {
        if (lastGeneratedCode) {
            navigator.clipboard.writeText(lastGeneratedCode);
            toast.success((language === 'ru' ? "Код скопирован: " : "Code copied: ") + lastGeneratedCode);
        }
    };

    const handleReload = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    };

    const handleNotificationToggle = async (checked: boolean) => {
        if (checked && setNotificationsEnabled) {
            const { requestNotificationPermission } = await import('../notifications');
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotificationsEnabled(true);
            } else {
                toast.warning(language === 'ru'
                    ? 'Разрешение на уведомления отклонено. Включите в настройках браузера/устройства.'
                    : 'Notification permission denied. Enable in browser/device settings.');
            }
        } else if (setNotificationsEnabled) {
            setNotificationsEnabled(false);
        }
    };
    void handleNotificationToggle;

    const TABS: { id: SettingsTab; label: string }[] = [
        { id: 'profile', label: language === 'ru' ? 'Профиль' : 'Profile' },
        { id: 'appearance', label: language === 'ru' ? 'Оформление' : 'Appearance' },
        { id: 'app', label: language === 'ru' ? 'Приложение' : 'App' },
    ];

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t.title} closeOnBackdropClick={closeOnBackdropClick} enableNavigation size="lg">
                <div className="pb-4">
                    {/* Сегментированные вкладки — iOS-стиль */}
                    <div className="flex bg-surfaceHighlight rounded-xl p-1 gap-1 mb-4 sticky top-0 z-10" style={{ backdropFilter: 'blur(20px)' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === tab.id ? 'bg-brand text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── ВКЛАДКА: ПРОФИЛЬ ── */}
                    {activeTab === 'profile' && (
                        <>
                            <AccountBanner
                                user={user}
                                onLogout={onLogout}
                                isPro={isPro}
                                justUnlocked={justUnlocked}
                                proExpiry={proExpiry}
                                language={language}
                                avatarType={avatarType}
                                avatarValue={avatarValue}
                                onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
                                t={t}
                            />

                            <ProSection
                                isPro={isPro}
                                justUnlocked={justUnlocked}
                                promoCode={promoCode}
                                setPromoCode={setPromoCode}
                                isRedeeming={isRedeeming}
                                onRedeem={handleRedeem}
                                language={language}
                                t={t}
                                isAdmin={isAdmin}
                                isGenerating={isGenerating}
                                maxUses={maxUses}
                                setMaxUses={setMaxUses}
                                onGenerate={handleGenerate}
                                lastGeneratedCode={lastGeneratedCode}
                                onCopyCode={copyCode}
                                onOpenFeedbackList={onOpenFeedbackList}
                            />

                            <HelpSection
                                onOpenFeedback={onOpenFeedback}
                                onOpenVault={onOpenVault}
                                handleReload={handleReload}
                                onShowOnboarding={onShowOnboarding}
                                language={language}
                                t={t}
                            />
                        </>
                    )}

                    {/* ── ВКЛАДКА: ОФОРМЛЕНИЕ ── */}
                    {activeTab === 'appearance' && (
                        <>
                            <ThemeSection
                                currentThemeId={currentThemeId}
                                onSetTheme={onSetTheme}
                                isPro={isPro}
                                justUnlocked={justUnlocked}
                                accentColor={accentColor}
                                setAccentColor={setAccentColor}
                                language={language}
                                t={t}
                            />
                        </>
                    )}

                    {/* ── ВКЛАДКА: ПРИЛОЖЕНИЕ ── */}
                    {activeTab === 'app' && (
                        <>
                            <AISettingsSection
                                aiSuggestionCount={aiSuggestionCount}
                                setAiSuggestionCount={setAiSuggestionCount}
                                customApiKey={customApiKey}
                                onCustomKeyChange={handleCustomKeyChange}
                                language={language}
                                setLanguage={setLanguage}
                                gender={gender}
                                setGender={setGender}
                                defaultCurrency={defaultCurrency}
                                setDefaultCurrency={setDefaultCurrency}
                                soundPack={soundPack}
                                setSoundPack={setSoundPack}
                                calendarStyle={calendarStyle}
                                setCalendarStyle={setCalendarStyle}
                                timeFocusMode={timeFocusMode}
                                setTimeFocusMode={setTimeFocusMode}
                                notificationsEnabled={notificationsEnabled}
                                setNotificationsEnabled={setNotificationsEnabled}
                                morningBriefingTime={morningBriefingTime}
                                setMorningBriefingTime={setMorningBriefingTime}
                                accentColor={accentColor}
                                t={t}
                            />

                            <DataSection
                                onExport={onExport}
                                onImport={() => fileInputRef.current?.click()}
                                onOpenArchive={onOpenArchive}
                                isPro={isPro}
                                justUnlocked={justUnlocked}
                                user={user}
                                language={language}
                                t={t}
                            />
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onImport} />
                        </>
                    )}
                </div>
            </Modal>

            <AvatarPicker
                isOpen={isAvatarPickerOpen}
                onClose={() => setIsAvatarPickerOpen(false)}
                onSelect={(type, value) => {
                    if (setAvatar) setAvatar(type, value);
                }}
                currentType={avatarType}
                currentValue={avatarValue}
                userId={user?.id || user?.uid}
                userName={user?.user_metadata?.full_name || user?.displayName || user?.email || 'U'}
                language={language}
            />
        </>
    );
};

export default SettingsModal;
