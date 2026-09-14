import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { AppTheme, THEMES, UserSettings } from '../types';
import { DisplayOptions } from '../components/SettingsModal';
import { PRO_THEMES } from '../constants';
import { removeUndefined } from '../utils/helpers';
import { useRealtimeSync } from './useRealtimeSync';

export const useSettings = (user: User | null, isPro: boolean) => {
    const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
        const savedId = localStorage.getItem('themeId');
        return THEMES.find(t => t.id === savedId) || THEMES.find(t => t.id === 'daylight') || THEMES[0];
    });

    const [language, setLanguageState] = useState<'ru' | 'en'>(() => {
        const saved = localStorage.getItem('language') as 'ru' | 'en' | null;
        if (saved) return saved;
        return 'en';
    });

    const [accentColor, setAccentColorState] = useState<string | null>(() => {
        return localStorage.getItem('accentColor') || null;
    });

    const [viewMode, setViewModeState] = useState<'grid' | 'compact' | 'kanban' | 'matrix' | 'list' | 'calendar' | 'graph' | 'circles' | 'identity'>(() => {
        return (localStorage.getItem('viewMode') as any) || 'circles';
    });

    const [aiSuggestionCount, setAiSuggestionCountState] = useState<number>(() => {
        const saved = localStorage.getItem('aiSuggestionCount');
        return saved ? parseInt(saved) : 3;
    });

    const [voiceId, setVoiceIdState] = useState<string>(() => {
        return localStorage.getItem('voiceId') || 'Puck';
    });

    const [isWakeWordEnabled, setIsWakeWordEnabledState] = useState<boolean>(() => {
        const saved = localStorage.getItem('isWakeWordEnabled');
        return saved === null ? true : saved === 'true';
    });

    const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
        const saved = localStorage.getItem('notificationsEnabled');
        return saved === 'true';
    });

    const [morningBriefingTime, setMorningBriefingTimeState] = useState<string>(() => {
        return localStorage.getItem('morningBriefingTime') || '07:00';
    });

    const [soundPack, setSoundPackState] = useState<string>(() => {
        return localStorage.getItem('soundPack') || 'synth';
    });

    const [defaultCurrency, setDefaultCurrencyState] = useState<string>(() => {
        return localStorage.getItem('defaultCurrency') || 'USD';
    });

    const [calendarStyle, setCalendarStyleState] = useState<'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress'>(() => {
        return (localStorage.getItem('calendarStyle') as any) || 'rings';
    });

    const [gender, setGenderState] = useState<'male' | 'female'>(() => {
        return (localStorage.getItem('gender') as 'male' | 'female') || 'male';
    });

    const [avatarType, setAvatarTypeState] = useState<'emoji' | 'photo' | 'preset' | 'google' | undefined>(() => {
        return (localStorage.getItem('avatarType') as any) || undefined;
    });

    const [avatarValue, setAvatarValueState] = useState<string | undefined>(() => {
        return localStorage.getItem('avatarValue') || undefined;
    });

    const [displayOptions, setDisplayOptionsState] = useState<DisplayOptions>(() => {
        try {
            const saved = localStorage.getItem('displayOptions');
            return saved ? JSON.parse(saved) : { showStreak: true, showPercentage: true, showTotal: true };
        } catch {
            return { showStreak: true, showPercentage: true, showTotal: true };
        }
    });

    const settingsRef = useRef<Record<string, any>>({});

    const applySettings = useCallback((s: any) => {
        if (!s) return;
        if (s.themeId) {
            const t = THEMES.find(th => th.id === s.themeId);
            if (t) {
                setCurrentTheme(t);
                localStorage.setItem('themeId', t.id);
            }
        }
        if (s.language) {
            setLanguageState(s.language);
            localStorage.setItem('language', s.language);
        }
        if (s.accentColor !== undefined) {
            setAccentColorState(s.accentColor);
            if (s.accentColor) localStorage.setItem('accentColor', s.accentColor);
            else localStorage.removeItem('accentColor');
        }
        if (s.viewMode) {
            setViewModeState(s.viewMode);
            localStorage.setItem('viewMode', s.viewMode);
        }
        if (s.aiSuggestionCount !== undefined) {
            setAiSuggestionCountState(s.aiSuggestionCount);
            localStorage.setItem('aiSuggestionCount', String(s.aiSuggestionCount));
        }
        if (s.voiceId) {
            setVoiceIdState(s.voiceId);
            localStorage.setItem('voiceId', s.voiceId);
        }
        if (s.isWakeWordEnabled !== undefined) {
            setIsWakeWordEnabledState(s.isWakeWordEnabled);
            localStorage.setItem('isWakeWordEnabled', String(s.isWakeWordEnabled));
        }
        if (s.displayOptions) {
            setDisplayOptionsState(s.displayOptions);
            localStorage.setItem('displayOptions', JSON.stringify(s.displayOptions));
        }
        if (s.notificationsEnabled !== undefined) {
            setNotificationsEnabledState(s.notificationsEnabled);
            localStorage.setItem('notificationsEnabled', String(s.notificationsEnabled));
        }
        if (s.soundPack) {
            setSoundPackState(s.soundPack);
            localStorage.setItem('soundPack', s.soundPack);
        }
        if (s.defaultCurrency) {
            setDefaultCurrencyState(s.defaultCurrency);
            localStorage.setItem('defaultCurrency', s.defaultCurrency);
        }
        if (s.calendarStyle) {
            setCalendarStyleState(s.calendarStyle);
            localStorage.setItem('calendarStyle', s.calendarStyle);
        }
        if (s.avatarType) {
            setAvatarTypeState(s.avatarType);
            localStorage.setItem('avatarType', s.avatarType);
        }
        if (s.avatarValue) {
            setAvatarValueState(s.avatarValue);
            localStorage.setItem('avatarValue', s.avatarValue);
        }
        if (s.gender) {
            setGenderState(s.gender);
            localStorage.setItem('gender', s.gender);
        }
        if (s.morningBriefingTime) {
            setMorningBriefingTimeState(s.morningBriefingTime);
            localStorage.setItem('morningBriefingTime', s.morningBriefingTime);
        }
    }, []);

    // Realtime Sync Hook
    const { broadcast } = useRealtimeSync(user, useCallback((type, data) => {
        if (type === 'SETTINGS_UPDATE' && data && typeof data === 'object') {
            settingsRef.current = { ...settingsRef.current, ...data };
            applySettings(data);
        }
    }, [applySettings]));

    // --- Cloud Sync Helper ---
    const saveSettingsToCloud = async (updates: Partial<UserSettings>) => {
        if (!user) return;
        try {
            const cleanUpdates = removeUndefined(updates);
            settingsRef.current = { ...settingsRef.current, ...cleanUpdates };
            
            // 1. Broadcast immediately to peers (15-40ms)
            broadcast('SETTINGS_UPDATE', cleanUpdates);

            // 2. Async DB Update without redundant SELECT round-trip
            await supabase.from('users').update({ settings: settingsRef.current }).eq('id', user.id);
        } catch (e) {
            console.error("Failed to sync settings", e);
        }
    };

    // --- Setters with Sync ---
    const setTheme = (theme: AppTheme) => {
        setCurrentTheme(theme);
        localStorage.setItem('themeId', theme.id);
        saveSettingsToCloud({ themeId: theme.id });
    };

    const setLanguage = (lang: 'ru' | 'en') => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        saveSettingsToCloud({ language: lang });
    };

    const setViewMode = (mode: 'grid' | 'compact' | 'kanban' | 'matrix' | 'list' | 'calendar' | 'graph' | 'circles' | 'identity') => {
        setViewModeState(mode);
        localStorage.setItem('viewMode', mode);
        saveSettingsToCloud({ viewMode: mode } as any);
    };

    const setAccentColor = (color: string | null) => {
        setAccentColorState(color);
        if (color) localStorage.setItem('accentColor', color);
        else localStorage.removeItem('accentColor');
        saveSettingsToCloud({ accentColor: color });
    };

    const setAiSuggestionCount = (count: number) => {
        setAiSuggestionCountState(count);
        localStorage.setItem('aiSuggestionCount', count.toString());
        saveSettingsToCloud({ aiSuggestionCount: count });
    };

    const setVoiceId = (id: string) => {
        setVoiceIdState(id);
        localStorage.setItem('voiceId', id);
        saveSettingsToCloud({ voiceId: id });
    };

    const setIsWakeWordEnabled = (enabled: boolean) => {
        setIsWakeWordEnabledState(enabled);
        localStorage.setItem('isWakeWordEnabled', enabled.toString());
        saveSettingsToCloud({ isWakeWordEnabled: enabled });
    };

    const setSoundPack = (pack: string) => {
        setSoundPackState(pack);
        localStorage.setItem('soundPack', pack);
        saveSettingsToCloud({ soundPack: pack } as any);
    };

    const setDefaultCurrency = (curr: string) => {
        setDefaultCurrencyState(curr);
        localStorage.setItem('defaultCurrency', curr);
        saveSettingsToCloud({ defaultCurrency: curr } as any);
    };

    const setCalendarStyle = (style: 'heatmap' | 'rings' | 'dots' | 'emoji' | 'progress') => {
        setCalendarStyleState(style);
        localStorage.setItem('calendarStyle', style);
        saveSettingsToCloud({ calendarStyle: style } as any);
    };

    const setGender = (g: 'male' | 'female') => {
        setGenderState(g);
        localStorage.setItem('gender', g);
        saveSettingsToCloud({ gender: g } as any);
    };

    const setDisplayOptions = (opts: DisplayOptions) => {
        setDisplayOptionsState(opts);
        localStorage.setItem('displayOptions', JSON.stringify(opts));
        saveSettingsToCloud({ displayOptions: opts });
    };

    const setNotificationsEnabled = (enabled: boolean) => {
        setNotificationsEnabledState(enabled);
        localStorage.setItem('notificationsEnabled', String(enabled));
        saveSettingsToCloud({ notificationsEnabled: enabled });
    };

    const setMorningBriefingTime = (time: string) => {
        setMorningBriefingTimeState(time);
        localStorage.setItem('morningBriefingTime', time);
        saveSettingsToCloud({ morningBriefingTime: time } as any);
    };

    const setAvatar = (type: 'emoji' | 'photo' | 'preset' | 'google', value: string) => {
        setAvatarTypeState(type);
        setAvatarValueState(value);
        localStorage.setItem('avatarType', type);
        localStorage.setItem('avatarValue', value);
        saveSettingsToCloud({ avatarType: type, avatarValue: value });
    };

    // --- Initial Cloud Sync ---
    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            const { data, error } = await supabase.from('users').select('settings').eq('id', user.id).single();
            if (data?.settings && !error) {
                // ВАЖНО: заполняем ref перед applySettings
                // иначе первый saveSettingsToCloud перезапишет все настройки одним полем
                settingsRef.current = { ...data.settings };
                applySettings(data.settings);
            }
        };

        loadSettings();

        const channel = supabase
            .channel('public:users:settings')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
                const data = payload.new as any;
                if (data?.settings) {
                    applySettings(data.settings);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // --- CSS Variables & Dark Mode Class Update ---
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--background', currentTheme.colors.background);
        root.style.setProperty('--surface', currentTheme.colors.surface);
        root.style.setProperty('--surface-highlight', currentTheme.colors.surfaceHighlight);
        root.style.setProperty('--text-primary', currentTheme.colors.textPrimary);
        root.style.setProperty('--text-secondary', currentTheme.colors.textSecondary);
        root.style.setProperty('--brand', accentColor || currentTheme.colors.brand);
        root.style.setProperty('--border-subtle', currentTheme.colors.borderSubtle);

        if (currentTheme.isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        if (currentTheme.isGlass) {
            root.style.setProperty('--glass-blur', currentTheme.glassBlur || '0px');
            root.style.setProperty('--glass-opacity', String(currentTheme.glassOpacity || 1));
            root.style.setProperty('--bg-gradient', currentTheme.backgroundGradient || 'none');
            root.setAttribute('data-glass', 'true');
        } else {
            root.style.setProperty('--glass-blur', '0px');
            root.style.setProperty('--glass-opacity', '1');
            root.style.setProperty('--bg-gradient', 'none');
            root.removeAttribute('data-glass');
        }
    }, [currentTheme, accentColor]);

    return {
        currentTheme, setTheme,
        language, setLanguage,
        accentColor, setAccentColor,
        viewMode, setViewMode,
        aiSuggestionCount, setAiSuggestionCount,
        voiceId, setVoiceId,
        isWakeWordEnabled, setIsWakeWordEnabled,
        displayOptions, setDisplayOptions,
        notificationsEnabled, setNotificationsEnabled,
        morningBriefingTime, setMorningBriefingTime,
        soundPack, setSoundPack,
        defaultCurrency, setDefaultCurrency,
        calendarStyle, setCalendarStyle,
        avatarType, avatarValue, setAvatar,
        gender, setGender
    };
};
