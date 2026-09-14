
import React from 'react';
import { Sparkles, Key, Globe, Users, Banknote, Volume2, Calendar, Clock, Bell } from 'lucide-react';
import { CURRENCIES } from '../../types';
import { SectionTitle } from './shared';
import LiquidSwitch from '../LiquidSwitch';
import LiquidSlider from '../LiquidSlider';

interface AISettingsSectionProps {
    aiSuggestionCount: number;
    setAiSuggestionCount: (count: number) => void;
    customApiKey: string;
    onCustomKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    language: 'ru' | 'en';
    setLanguage?: (lang: 'ru' | 'en') => void;
    gender: 'male' | 'female';
    setGender?: (gender: 'male' | 'female') => void;
    defaultCurrency: string;
    setDefaultCurrency?: (currency: string) => void;
    soundPack: 'off' | 'synth' | 'premium';
    setSoundPack?: (pack: 'off' | 'synth' | 'premium') => void;
    calendarStyle: 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress';
    setCalendarStyle?: (style: 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress') => void;
    timeFocusMode: boolean;
    setTimeFocusMode?: (enabled: boolean) => void;
    notificationsEnabled: boolean;
    setNotificationsEnabled?: (enabled: boolean) => void;
    morningBriefingTime: string;
    setMorningBriefingTime?: (time: string) => void;
    accentColor?: string | null;
    t: any;
}

/** Ряд «иконка + название + контрол» — базовый элемент iOS-настроек */
const SettingsRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    control: React.ReactNode;
}> = ({ icon, label, sublabel, control }) => (
    <div className="w-full flex items-center justify-between p-3.5 bg-surfaceHighlight/30 border-x border-b border-borderSubtle first:border-t first:rounded-t-2xl last:border-b-0 last:rounded-b-2xl gap-3">
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surfaceHighlight shrink-0">
                {icon}
            </div>
            <div className="min-w-0 text-left">
                <div className="text-sm font-medium text-textPrimary truncate">{label}</div>
                {sublabel && <div className="text-[10px] text-textSecondary">{sublabel}</div>}
            </div>
        </div>
        <div className="shrink-0">{control}</div>
    </div>
);

const AISettingsSection: React.FC<AISettingsSectionProps> = ({
    aiSuggestionCount, setAiSuggestionCount, customApiKey, onCustomKeyChange,
    language, setLanguage, gender, setGender,
    defaultCurrency, setDefaultCurrency,
    soundPack, setSoundPack,
    calendarStyle, setCalendarStyle,
    timeFocusMode, setTimeFocusMode,
    notificationsEnabled, setNotificationsEnabled,
    morningBriefingTime, setMorningBriefingTime,
    accentColor, t
}) => (
    <>
        {/* ═══ ЯЗЫК И ОБЩЕЕ ═══ */}
        <SectionTitle>{language === 'ru' ? 'Основное' : 'General'}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden mb-5">
            {setLanguage && (
                <SettingsRow
                    icon={<Globe size={16} className="text-brand" />}
                    label="Language / Язык"
                    control={
                        <div className="flex bg-surfaceHighlight rounded-lg p-0.5">
                            <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'en' ? 'bg-brand/20 text-brand ring-1 ring-brand/30' : 'text-textSecondary'}`}>EN</button>
                            <button onClick={() => setLanguage('ru')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'ru' ? 'bg-brand/20 text-brand ring-1 ring-brand/30' : 'text-textSecondary'}`}>RU</button>
                        </div>
                    }
                />
            )}
            {setGender && (
                <SettingsRow
                    icon={<Users size={16} className="text-purple-500" />}
                    label={language === 'ru' ? 'Обращение' : 'Pronouns'}
                    control={
                        <div className="flex bg-surfaceHighlight rounded-lg p-0.5">
                            <button onClick={() => setGender('male')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${gender === 'male' ? 'bg-brand/20 text-brand ring-1 ring-brand/30' : 'text-textSecondary'}`}>{language === 'ru' ? '♂ Он' : '♂ He'}</button>
                            <button onClick={() => setGender('female')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${gender === 'female' ? 'bg-brand/20 text-brand ring-1 ring-brand/30' : 'text-textSecondary'}`}>{language === 'ru' ? '♀ Она' : '♀ She'}</button>
                        </div>
                    }
                />
            )}
            {setDefaultCurrency && (
                <SettingsRow
                    icon={<Banknote size={16} className="text-green-500" />}
                    label={language === 'ru' ? 'Валюта' : 'Currency'}
                    control={
                        <select
                            value={defaultCurrency}
                            onChange={(e) => setDefaultCurrency(e.target.value)}
                            className="bg-surfaceHighlight text-textPrimary text-xs font-bold px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                            ))}
                        </select>
                    }
                />
            )}
        </div>

        {/* ═══ ИИ-КОУЧ ═══ */}
        <SectionTitle>{t.aiTrainer}</SectionTitle>
        <div className="bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle p-4 space-y-4 mb-5">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-brand" />
                        <span className="text-sm font-medium text-textPrimary">{t.adviceCount}: <b>{aiSuggestionCount}</b></span>
                    </div>
                </div>
                <LiquidSlider
                    value={aiSuggestionCount}
                    onChange={setAiSuggestionCount}
                    min={1}
                    max={5}
                    step={1}
                    accentColor={accentColor || '#7c3aed'}
                />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Key size={14} className="text-textSecondary" />
                    <span className="text-xs font-bold text-textSecondary uppercase">Gemini API Key</span>
                </div>
                <input
                    type="text"
                    value={customApiKey}
                    onChange={onCustomKeyChange}
                    placeholder="AIzaSy..."
                    className="w-full bg-surface border border-borderSubtle rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:border-brand outline-none transition-colors"
                />
                <p className="text-[9px] text-textSecondary mt-1 opacity-70 leading-relaxed">
                    {language === 'ru' ? 'Ключ хранится только на устройстве' : 'Key is stored locally only'}
                </p>
            </div>
        </div>

        {/* ═══ ЗВУК И ВИД ═══ */}
        <SectionTitle>{language === 'ru' ? 'Звук и вид' : 'Sound & View'}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden mb-5">
            {setSoundPack && (
                <SettingsRow
                    icon={<Volume2 size={16} className="text-purple-500" />}
                    label={language === 'ru' ? 'Звуки редкости' : 'Rarity Sounds'}
                    control={
                        <div className="flex gap-1">
                            {(['off', 'synth', 'premium'] as const).map(pack => (
                                <button
                                    key={pack}
                                    onClick={() => setSoundPack(pack)}
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${soundPack === pack ? 'bg-brand text-white' : 'bg-surfaceHighlight text-textSecondary'}`}
                                >
                                    {pack === 'off' ? (language === 'ru' ? 'Выкл' : 'Off') : pack === 'synth' ? (language === 'ru' ? 'Стандарт' : 'Synth') : (language === 'ru' ? 'Премиум' : 'Premium')}
                                </button>
                            ))}
                        </div>
                    }
                />
            )}
            {setCalendarStyle && (
                <div className="w-full p-3.5 bg-surfaceHighlight/30 border-x border-b border-borderSubtle">
                    <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surfaceHighlight shrink-0">
                            <Calendar size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-textPrimary">
                            {language === 'ru' ? 'Стиль календаря' : 'Calendar Style'}
                        </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                        {([
                            { id: 'rings', icon: '⭕', label: { ru: 'Кольца', en: 'Rings' } },
                            { id: 'heatmap', icon: '🟩', label: { ru: 'Тепловая', en: 'Heatmap' } },
                            { id: 'dots', icon: '🔵', label: { ru: 'Точки', en: 'Dots' } },
                            { id: 'emoji', icon: '😊', label: { ru: 'Эмодзи', en: 'Emoji' } },
                            { id: 'progress', icon: '📊', label: { ru: 'Прогресс', en: 'Progress' } }
                        ] as const).map(style => (
                            <button
                                key={style.id}
                                onClick={() => setCalendarStyle(style.id)}
                                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${calendarStyle === style.id
                                    ? 'bg-brand text-white shadow-md'
                                    : 'bg-surfaceHighlight/50 text-textSecondary hover:bg-surfaceHighlight'
                                }`}
                            >
                                <span className="text-base leading-none">{style.icon}</span>
                                <span className="text-[8px] font-bold">{style.label[language]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {setTimeFocusMode && (
                <SettingsRow
                    icon={<Clock size={16} className="text-blue-500" />}
                    label={language === 'ru' ? 'Фокус на время' : 'Time Focus'}
                    sublabel={language === 'ru' ? 'Выделяет текущую привычку' : 'Highlights current habit'}
                    control={<LiquidSwitch checked={timeFocusMode} onChange={(checked) => setTimeFocusMode(checked)} />}
                />
            )}
        </div>

        {/* ═══ УВЕДОМЛЕНИЯ ═══ */}
        <SectionTitle>{language === 'ru' ? 'Уведомления' : 'Notifications'}</SectionTitle>
        <div className="flex flex-col rounded-2xl overflow-hidden">
            {setNotificationsEnabled && (
                <SettingsRow
                    icon={<Bell size={16} className="text-orange-500" />}
                    label={language === 'ru' ? 'Напоминания' : 'Reminders'}
                    sublabel={language === 'ru' ? 'Push о привычках' : 'Push for habits'}
                    control={<LiquidSwitch checked={notificationsEnabled} onChange={(checked) => setNotificationsEnabled(checked)} />}
                />
            )}
            {notificationsEnabled && setMorningBriefingTime && (
                <div className="w-full flex items-center justify-between p-3.5 bg-surfaceHighlight/30 border-x border-b border-borderSubtle animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surfaceHighlight shrink-0">
                            <Sparkles size={16} className="text-yellow-500" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-textPrimary">{language === 'ru' ? 'Утренний брифинг' : 'Morning Briefing'}</div>
                            <div className="text-[10px] text-textSecondary">{language === 'ru' ? 'План дня в одно уведомление' : 'Daily plan in one notification'}</div>
                        </div>
                    </div>
                    <input
                        type="time"
                        value={morningBriefingTime}
                        onChange={(e) => setMorningBriefingTime(e.target.value)}
                        className="bg-surfaceHighlight text-textPrimary text-xs font-bold px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer"
                    />
                </div>
            )}
        </div>
    </>
);

export default AISettingsSection;
