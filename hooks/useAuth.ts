import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { triggerProCelebration, removeUndefined } from '../utils/helpers';
import { signInWithNativeGoogle, isCapacitorNative, signOutNativeGoogle } from '../nativeAuth';
import { UserIdentity } from '../types';
import { ADMIN_EMAILS } from '../constants';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [proExpiry, setProExpiry] = useState<string | null>(null);
    const [isPublicProfile, setIsPublicProfile] = useState(false);
    const [isExpansionUnlocked, setIsExpansionUnlocked] = useState(false);
    const [userIdentities, setUserIdentities] = useState<UserIdentity[]>([]);
    const [activeIdentityId, setActiveIdentityId] = useState<string | null>(null);

    const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));

    // Admins always have Pro — set immediately when user changes
    useEffect(() => {
        if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) {
            setIsPro(true);
            setProExpiry('lifetime');
        }
    }, [user]);

    // --- Auth Initialization ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('getSession error:', error.message);
                    // Clock skew: try refreshing the session
                    if (error.message?.includes('future') || error.message?.includes('skew') || error.message?.includes('clock')) {
                        const { data: refreshed } = await supabase.auth.refreshSession();
                        setUser(refreshed.session?.user ?? null);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(session?.user ?? null);
                }
            } catch (e) {
                console.error('Auth init error:', e);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (_event === 'TOKEN_REFRESHED' || _event === 'SIGNED_IN') {
                    setUser(session?.user ?? null);
                } else if (_event === 'SIGNED_OUT') {
                    setUser(null);
                } else {
                    setUser(session?.user ?? null);
                }
                setAuthLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // --- Profile Sync Listener ---
    useEffect(() => {
        if (!user) {
            setIsPro(false); setProExpiry(null); setIsPublicProfile(false); setIsExpansionUnlocked(false);
            setUserIdentities([]); setActiveIdentityId(null);
            return;
        }

        const fetchProfile = async () => {
            const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (data && !error) {
                let active = data.isPro || false;
                if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) active = true;
                if (data.proExpiry && data.proExpiry !== 'lifetime') {
                    if (new Date(data.proExpiry) < new Date()) active = false;
                }

                setIsPro(active);
                setProExpiry(data.proExpiry || null);
                setIsPublicProfile(data.isPublic || false);
                setIsExpansionUnlocked(data.isExpansionUnlocked || false);

                if (data.userIdentities) {
                    setUserIdentities(data.userIdentities);
                } else if (data.userIdentity) {
                    const legacy = { ...data.userIdentity, id: 'legacy' };
                    setUserIdentities([legacy]);
                    if (!data.activeIdentityId) setActiveIdentityId('legacy');
                }

                if (data.activeIdentityId) {
                    setActiveIdentityId(data.activeIdentityId);
                }
            } else if (error && (error.code === 'PGRST116' || (error as any).status === 406 || !data)) {
                // User row doesn't exist — upsert it (safer than insert, handles race conditions)
                const isAdminUser = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
                const { error: upsertError } = await supabase.from('users').upsert({
                    id: user.id,
                    email: user.email,
                    displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || user.user_metadata?.name || '',
                    photoBase64: user.user_metadata?.photoURL || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                    habits: [],
                    totalCompletions: 0,
                }, { onConflict: 'id', ignoreDuplicates: true });

                if (upsertError) {
                    console.error('Failed to create user profile:', upsertError);
                } else {
                    console.log('User profile created for:', user.email);
                }
                // Immediately grant Pro to admin after creation
                if (isAdminUser) {
                    setIsPro(true);
                    setProExpiry('lifetime');
                }
            } else if (error) {
                console.error('fetchProfile error:', error);
            }
        };

        fetchProfile();

        // Subscribe to real-time changes for this user's profile
        const channel = supabase
            .channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
                const data = payload.new as any;
                if (!data) return;
                
                let active = data.isPro || false;
                if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) active = true;
                if (data.proExpiry && data.proExpiry !== 'lifetime') {
                    if (new Date(data.proExpiry) < new Date()) active = false;
                }

                setIsPro(active);
                setProExpiry(data.proExpiry || null);
                setIsPublicProfile(data.isPublic || false);
                setIsExpansionUnlocked(data.isExpansionUnlocked || false);
                
                if (data.userIdentities) setUserIdentities(data.userIdentities);
                if (data.activeIdentityId) setActiveIdentityId(data.activeIdentityId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const isTauri = () => !!(
        (window as any).__TAURI__ ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI_IPC__
    );

    const processedUrls = new Set<string>();

    const processAuthUrl = async (url: string) => {
        if (!url.startsWith('habitai://auth-callback')) return;

        const urlKey = url.substring(0, 60);
        if (processedUrls.has(urlKey)) {
            console.log('Deep-link auth: duplicate URL, skipping');
            return;
        }
        processedUrls.add(urlKey);

        const params = new URLSearchParams(url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
            try {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                console.log('Deep-link sign-in successful!');
            } catch (err: any) {
                console.error('setSession failed:', err.message);
            }
        }
    };

    useEffect(() => {
        if (!isTauri()) return;

        let unlistenDeepLink: (() => void) | null = null;
        let unlistenEvent: (() => void) | null = null;

        const setup = async () => {
            try {
                const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
                unlistenDeepLink = await onOpenUrl((urls: string[]) => {
                    urls.forEach(url => processAuthUrl(url));
                });
            } catch (err) {
                console.warn('Deep-link plugin setup failed:', err);
            }

            try {
                const { listen } = await import('@tauri-apps/api/event');
                unlistenEvent = await listen<string>('deep-link-auth', (event) => {
                    processAuthUrl(event.payload);
                });
            } catch (err) {
                console.warn('Event listener setup failed:', err);
            }
        };

        setup();
        return () => {
            unlistenDeepLink?.();
            unlistenEvent?.();
        };
    }, []);

    const handleLogin = async (provider: string) => {
        try {
            if (isTauri()) {
                try {
                    const { openUrl } = await import('@tauri-apps/plugin-opener');
                    const providerName = provider.toLowerCase();
                    const authUrl = `https://www.tryhabitai.com/desktop-auth.html?provider=${providerName}`;
                    await openUrl(authUrl);
                    return; 
                } catch (err) {
                    console.warn('System browser open failed, falling back to redirect:', err);
                }
            }

            if (provider === 'Apple') {
                await supabase.auth.signInWithOAuth({ provider: 'apple' });
            } else if (provider === 'Google') {
                if (isCapacitorNative()) {
                    try {
                        await signInWithNativeGoogle();
                    } catch (nativeError: any) {
                        console.warn('Native Google Sign-In failed, trying web OAuth:', nativeError);
                        await supabase.auth.signInWithOAuth({ provider: 'google' });
                    }
                } else {
                    await supabase.auth.signInWithOAuth({ provider: 'google' });
                }
            } else if (provider === 'Twitter') {
                await supabase.auth.signInWithOAuth({ provider: 'twitter' });
            }
        } catch (error: any) {
            console.error("Login failed", error);
            alert(language === 'ru' ? `Ошибка входа: ${error.message}` : `Login Error: ${error.message}`);
        }
    };

    const handleEmailLogin = async (email: string, password: string): Promise<boolean> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Email login failed", error);
            alert(language === 'ru' ? `Ошибка входа: ${error.message}` : `Login Error: ${error.message}`);
            return false;
        }
    };

    const handleLogout = async () => {
        try {
            if (isCapacitorNative()) {
                try {
                    await signOutNativeGoogle();
                } catch (e) {
                    console.log('GoogleAuth signOut skipped:', e);
                }
            }
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleRedeemCode = async (code: string): Promise<boolean> => {
        if (!user) return false;

        const activatePro = async (duration: string) => {
            let newExpiry = 'lifetime';
            if (duration === 'year') {
                const d = new Date(); d.setFullYear(d.getFullYear() + 1); newExpiry = d.toISOString();
            } else if (duration === '6months') {
                const d = new Date(); d.setMonth(d.getMonth() + 6); newExpiry = d.toISOString();
            }

            triggerProCelebration();
            await supabase.from('users').update({ isPro: true, proExpiry: newExpiry }).eq('id', user.id);
            return true;
        };

        try {
            const { data: promoData, error } = await supabase.from('promoCodes').select('*').eq('code', code).single();
            if (error) throw error;

            if (promoData) {
                if (promoData.used || (promoData.usageCount || 0) >= (promoData.maxUses || 1)) {
                    alert(language === 'ru' ? "Лимит использования кода исчерпан." : "Code limit reached.");
                    return false;
                }
                if ((promoData.redeemedBy || []).includes(user.id)) {
                    alert(language === 'ru' ? "Вы уже активировали этот код." : "Already used.");
                    return false;
                }

                await activatePro(promoData.duration || promoData.type);
                
                const newRedeemedBy = [...(promoData.redeemedBy || []), user.id];
                const newUsageCount = (promoData.usageCount || 0) + 1;
                
                await supabase.from('promoCodes').update({
                    usageCount: newUsageCount,
                    redeemedBy: newRedeemedBy,
                    used: newUsageCount >= (promoData.maxUses || 1)
                }).eq('code', code);
                
                return true;
            }
        } catch (e) {
            console.error("Redeem failed", e);
        }

        alert(language === 'ru' ? "Код не найден." : "Code not found.");
        return false;
    };

    const saveUserIdentity = async (identity: UserIdentity) => {
        if (!user) return;
        try {
            const existingIndex = userIdentities.findIndex(i => i.id === identity.id);
            let nextIdentities = [...userIdentities];
            if (existingIndex !== -1) {
                nextIdentities[existingIndex] = identity;
            } else {
                nextIdentities = [identity, ...userIdentities];
            }

            const cleanIdentities = removeUndefined(nextIdentities);
            await supabase.from('users').update({
                userIdentities: cleanIdentities,
                activeIdentityId: identity.id
            }).eq('id', user.id);

            setUserIdentities(nextIdentities);
            setActiveIdentityId(identity.id);
        } catch (error) {
            console.error("Failed to save user identity:", error);
        }
    };

    const deleteUserIdentity = async (id: string) => {
        if (!user) return;
        try {
            const nextIdentities = userIdentities.filter(i => i.id !== id);
            const nextActiveId = activeIdentityId === id ? (nextIdentities[0]?.id || null) : activeIdentityId;

            await supabase.from('users').update({
                userIdentities: removeUndefined(nextIdentities),
                activeIdentityId: nextActiveId
            }).eq('id', user.id);

            setUserIdentities(nextIdentities);
            setActiveIdentityId(nextActiveId);
        } catch (error) {
            console.error("Failed to delete user identity:", error);
        }
    };

    const togglePublicProfile = async (isPublic: boolean) => {
        setIsPublicProfile(isPublic);
        if (user) {
            try {
                await supabase.from('users').update({
                    isPublic,
                    ...(isPublic && {
                        displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || 'Anonymous',
                        photoBase64: user.user_metadata?.photoURL || user.user_metadata?.avatar_url || ''
                    })
                }).eq('id', user.id);
            } catch (error) {
                console.error("Failed to update public profile:", error);
            }
        }
    };

    const setActiveIdentity = async (id: string) => {
        if (!user) return;
        try {
            await supabase.from('users').update({ activeIdentityId: id }).eq('id', user.id);
            setActiveIdentityId(id);
        } catch (error) {
            console.error("Failed to set active identity:", error);
        }
    };

    return {
        user, authLoading, isPro, proExpiry, isAdmin,
        isPublicProfile, isExpansionUnlocked, userIdentities, activeIdentityId,
        setUserIdentity: saveUserIdentity,
        deleteUserIdentity,
        setActiveIdentity,
        handleLogin, handleEmailLogin, handleLogout,
        setIsPublicProfile: togglePublicProfile, handleRedeemCode
    };
};
