// Native Google Auth service for Capacitor (Android/iOS)
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from './supabaseClient';

// Initialize GoogleAuth plugin
export const initGoogleAuth = async () => {
    try {
        await GoogleAuth.initialize({
            clientId: '176216214870-8tmdotpr9ga1u1f4hq4oc65ucos6vhio.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
        console.log('GoogleAuth initialized successfully');
    } catch (error) {
        console.log('GoogleAuth already initialized or web platform:', error);
    }
};

// Sign in with native Google Auth and then Supabase
export const signInWithNativeGoogle = async () => {
    try {
        console.log('Starting native Google Sign-In...');

        // Get Google user from native SDK
        const googleUser = await GoogleAuth.signIn();
        console.log('Got Google user:', googleUser.email);

        // Sign in to Supabase with the Google ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleUser.authentication.idToken
        });
        
        if (error) throw error;
        
        console.log('Supabase sign-in successful:', data.user?.email);
        return data;
    } catch (error: any) {
        console.error('Native Google Sign-In error:', error);
        throw error;
    }
};

// Sign out from Google
export const signOutNativeGoogle = async () => {
    try {
        await GoogleAuth.signOut();
    } catch (error) {
        console.log('GoogleAuth signOut error (might be web):', error);
    }
};

// Check if running in Capacitor native
export const isCapacitorNative = (): boolean => {
    return (window as any).Capacitor?.isNativePlatform?.() === true;
};

// Check if running on Android specifically
export const isAndroid = (): boolean => {
    return (window as any).Capacitor?.getPlatform?.() === 'android';
};


