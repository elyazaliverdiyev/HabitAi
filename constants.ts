
// Read API Key from environment variable (set in .env or .env.local)
// Never hardcode API keys in source code!
export const GEMINI_API_KEY: string = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

// --- ADMIN CONFIG ---
// Single source of truth for admin emails
export const ADMIN_EMAILS = [
    'elyaz.aliverdiyev@gmail.com',
    'akkermanm708@gmail.com'
].map(e => e.toLowerCase().trim());

// --- PRO THEMES ---
// Theme IDs that require PRO subscription (must match real IDs in types.ts THEMES array)
// Free themes: daylight, ios-dark
export const PRO_THEMES = [
    'ios-light', 'frosted-glass', 'liquid-glass-dark',
    'obsidian-gold', 'midnight', 'forest', 'lavender', 'rosewood'
];

// --- LIMITS ---
export const MAX_FREE_HABITS = 5;
export const MAX_FREE_HABITS_BONUS = 10;
