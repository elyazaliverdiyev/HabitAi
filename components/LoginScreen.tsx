import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, Mail, Eye, EyeOff, ArrowRight, Sparkles, Twitter } from 'lucide-react';
import { translations } from '../translations';
import { motionControl } from '../utils/motionPresets';

interface LoginScreenProps {
    onLogin: (provider: string) => void;
    onEmailLogin?: (email: string, password: string) => Promise<boolean>;
    language?: 'ru' | 'en';
}

// ---------------------------------------------------------------
// Floating orb background
// ---------------------------------------------------------------
const FloatingOrbs: React.FC = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Large purple orb */}
        <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{
                position: 'absolute', top: '-10%', left: '-5%',
                width: 380, height: 380, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }}
        />
        {/* Blue orb */}
        <motion.div
            animate={{ x: [0, -25, 35, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            style={{
                position: 'absolute', bottom: '5%', right: '-10%',
                width: 320, height: 320, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }}
        />
        {/* Teal orb */}
        <motion.div
            animate={{ x: [0, 20, -10, 0], y: [0, -20, 40, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
            style={{
                position: 'absolute', top: '40%', right: '5%',
                width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
                filter: 'blur(30px)',
            }}
        />
    </div>
);

// ---------------------------------------------------------------
// Feature pill badges
// ---------------------------------------------------------------
const FeaturePill: React.FC<{ icon: string; label: string; delay: number }> = ({ icon, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, ...motionControl }}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
        }}
    >
        <span>{icon}</span>
        <span>{label}</span>
    </motion.div>
);

// ---------------------------------------------------------------
// Google SVG icon
// ---------------------------------------------------------------
const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

// ---------------------------------------------------------------
// Apple SVG icon
// ---------------------------------------------------------------
const AppleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.29-.88 3.56-.84 1.5.04 2.85.73 3.65 1.9-3.08 1.83-2.58 5.7.45 6.87-.71 1.74-1.63 3.23-2.74 4.24zM12.03 7.25c-.15-2.58 1.95-4.8 4.41-5.12.33 2.76-2.3 4.96-4.41 5.12z" />
    </svg>
);

// ---------------------------------------------------------------
// Main LoginScreen
// ---------------------------------------------------------------
const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onEmailLogin, language = 'ru' }) => {
    const t = translations[language].login;
    const [mode, setMode] = useState<'main' | 'email'>('main');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim() || !onEmailLogin) return;
        setIsLoading(true);
        setError('');
        try {
            const ok = await onEmailLogin(email.trim(), password);
            if (!ok) setError(language === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password');
        } catch {
            setError(language === 'ru' ? 'Ошибка входа. Попробуй ещё раз' : 'Login error. Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const features = language === 'ru'
        ? [
            { icon: '🤖', label: 'AI Коуч' },
            { icon: '🔥', label: 'Стрики' },
            { icon: '📊', label: 'Аналитика' },
            { icon: '🎯', label: 'Цели' },
            { icon: '✨', label: 'Идентичность' },
        ]
        : [
            { icon: '🤖', label: 'AI Coach' },
            { icon: '🔥', label: 'Streaks' },
            { icon: '📊', label: 'Analytics' },
            { icon: '🎯', label: 'Goals' },
            { icon: '✨', label: 'Identity' },
        ];

    return (
        <div style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: '#0c0a09',
            padding: '24px 20px',
            overflow: 'hidden',
        }}>
            <FloatingOrbs />

            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', maxWidth: 360,
                    borderRadius: 28,
                    padding: '36px 28px 28px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(60px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
            >
                {/* Top shimmer line */}
                <div style={{
                    position: 'absolute', top: 0, left: '25%', right: '25%',
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)',
                }} />

                <AnimatePresence mode="wait">
                    {mode === 'main' ? (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Logo */}
                            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                <motion.div
                                    animate={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        width: 64, height: 64,
                                        borderRadius: 20,
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        boxShadow: '0 12px 40px rgba(124,58,237,0.5)',
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>⚡</span>
                                </motion.div>

                                <h1 style={{
                                    fontSize: 28, fontWeight: 900,
                                    color: '#ffffff',
                                    margin: '0 0 6px',
                                    letterSpacing: '-0.5px',
                                }}>
                                    HabitAI
                                </h1>
                                <p style={{
                                    fontSize: 13, color: 'rgba(255,255,255,0.5)',
                                    margin: 0, lineHeight: 1.4,
                                }}>
                                    {language === 'ru'
                                        ? 'Твой AI ассистент по росту и привычкам'
                                        : 'Your AI growth & habit assistant'}
                                </p>
                            </div>

                            {/* Feature pills */}
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: 6,
                                justifyContent: 'center',
                                marginBottom: 28,
                            }}>
                                {features.map((f, i) => (
                                    <FeaturePill key={f.label} icon={f.icon} label={f.label} delay={0.1 + i * 0.07} />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* Google */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onLogin('Google')}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        padding: '14px 20px',
                                        borderRadius: 14,
                                        background: 'rgba(255,255,255,0.9)',
                                        color: '#1a1a1a',
                                        fontWeight: 700, fontSize: 14,
                                        border: 'none', cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <GoogleIcon />
                                    {language === 'ru' ? 'Войти через Google' : 'Continue with Google'}
                                </motion.button>

                                {/* Twitter/X */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onLogin('Twitter')}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        padding: '14px 20px',
                                        borderRadius: 14,
                                        background: 'rgba(255,255,255,0.07)',
                                        color: 'rgba(255,255,255,0.9)',
                                        fontWeight: 700, fontSize: 14,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Twitter size={17} color="#1DA1F2" fill="#1DA1F2" />
                                    {language === 'ru' ? 'Войти через X (Twitter)' : 'Continue with X (Twitter)'}
                                </motion.button>

                                {/* Apple */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onLogin('Apple')}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        padding: '14px 20px',
                                        borderRadius: 14,
                                        background: 'rgba(255,255,255,0.07)',
                                        color: 'rgba(255,255,255,0.9)',
                                        fontWeight: 700, fontSize: 14,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <AppleIcon />
                                    {language === 'ru' ? 'Войти через Apple' : 'Continue with Apple'}
                                </motion.button>

                                {/* Email */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setMode('email')}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        padding: '14px 20px',
                                        borderRadius: 14,
                                        background: 'rgba(255,255,255,0.07)',
                                        color: 'rgba(255,255,255,0.9)',
                                        fontWeight: 700, fontSize: 14,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Mail size={17} />
                                    {language === 'ru' ? 'Войти по Email' : 'Continue with Email'}
                                </motion.button>
                            </div>

                            {/* Disclaimer */}
                            <p style={{
                                marginTop: 20, fontSize: 10,
                                color: 'rgba(255,255,255,0.25)',
                                textAlign: 'center', lineHeight: 1.5,
                            }}>
                                {t.disclaimer}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Back + title */}
                            <div style={{ marginBottom: 24 }}>
                                <button
                                    onClick={() => { setMode('main'); setError(''); }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: 12, fontWeight: 600,
                                        padding: 0, marginBottom: 16,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    ← {language === 'ru' ? 'Назад' : 'Back'}
                                </button>
                                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>
                                    {language === 'ru' ? 'Вход по Email' : 'Sign in with Email'}
                                </h2>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                    {language === 'ru' ? 'Введи свои данные для входа' : 'Enter your credentials to sign in'}
                                </p>
                            </div>

                            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Email input */}
                                <div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Email"
                                        autoComplete="email"
                                        style={{
                                            width: '100%',
                                            padding: '13px 16px',
                                            borderRadius: 12,
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            fontSize: 14,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                {/* Password input */}
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={language === 'ru' ? 'Пароль' : 'Password'}
                                        autoComplete="current-password"
                                        style={{
                                            width: '100%',
                                            padding: '13px 44px 13px 16px',
                                            borderRadius: 12,
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            fontSize: 14,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'rgba(255,255,255,0.4)',
                                            display: 'flex', alignItems: 'center',
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                padding: '9px 12px',
                                                borderRadius: 8,
                                                background: 'rgba(248,113,113,0.12)',
                                                border: '1px solid rgba(248,113,113,0.25)',
                                                fontSize: 12, color: '#fca5a5',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={!email.trim() || !password.trim() || isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '14px',
                                        borderRadius: 14,
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#fff',
                                        fontWeight: 700, fontSize: 14,
                                        border: 'none', cursor: 'pointer',
                                        boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                                        opacity: (!email.trim() || !password.trim()) ? 0.6 : 1,
                                        marginTop: 4,
                                    }}
                                >
                                    {isLoading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <>
                                            {language === 'ru' ? 'Войти' : 'Sign In'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cache clear hidden button */}
                <button
                    onClick={async () => {
                        localStorage.clear();
                        sessionStorage.clear();
                        try {
                            const dbs = await window.indexedDB.databases?.();
                            for (const db of (dbs || [])) {
                                if (db.name) window.indexedDB.deleteDatabase(db.name);
                            }
                        } catch {}
                        if ('caches' in window) {
                            const names = await caches.keys();
                            await Promise.all(names.map(n => caches.delete(n)));
                        }
                        window.location.reload();
                    }}
                    style={{
                        position: 'absolute', bottom: 10, right: 12,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 9, color: 'rgba(255,255,255,0.15)',
                        fontFamily: 'monospace',
                    }}
                    title="Clear cache & reload"
                >
                    v13.0.0
                </button>
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{
                    position: 'relative', zIndex: 1,
                    marginTop: 20, fontSize: 11,
                    color: 'rgba(255,255,255,0.2)',
                    textAlign: 'center',
                }}
            >
                {language === 'ru'
                    ? 'Начни становиться лучшей версией себя сегодня'
                    : 'Start becoming your best self today'}
            </motion.p>
        </div>
    );
};

export default LoginScreen;
