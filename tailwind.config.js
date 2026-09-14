/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                surface: 'var(--surface)',
                surfaceHighlight: 'var(--surface-highlight)',
                textPrimary: 'var(--text-primary)',
                textSecondary: 'var(--text-secondary)',
                brand: 'var(--brand)',
                borderSubtle: 'var(--border-subtle)',
                "primary": "#61a6fa",
                "background-light": "#f5f7f8",
                "background-dark": "#0f1823",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fadeIn': 'fadeIn 0.2s ease-out forwards',
                'slideUp': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'bounce-sm': 'bounce-sm 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'shimmer': 'shimmer 2s linear infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'grow-bar': 'grow-bar 1s ease-out forwards',
                'gradient-rotate': 'gradient-rotate 3s ease infinite',
                'mesh-move': 'meshMove 25s ease-in-out infinite',
                'frosted-in': 'frosted-in 0.4s ease-out forwards',
                'subtle-float': 'subtle-float 3s ease-in-out infinite',
                'scale-in': 'scale-in 0.2s ease-out forwards',
                'check-pop': 'check-pop 0.3s ease-out forwards',
                'click-press': 'click-press 0.15s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'bounce-sm': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.9)' },
                },
                pop: {
                    '0%': { transform: 'scale(0.9)' },
                    '50%': { transform: 'scale(1.5)' },
                    '100%': { transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'glow-pulse': {
                    '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.05)' },
                },
                'grow-bar': {
                    '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
                    '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
                },
                'gradient-rotate': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                'frosted-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)', filter: 'blur(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
                },
                'subtle-float': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-6px) rotate(1deg)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'check-pop': {
                    '0%': { transform: 'scale(0)' },
                    '50%': { transform: 'scale(1.3)' },
                    '100%': { transform: 'scale(1)' },
                },
                'click-press': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.95)' },
                },
            },
        },
    },
    plugins: [],
}
