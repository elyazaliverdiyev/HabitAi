import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Читаем версию из package.json
import pkg from './package.json';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',

          // Включаем devtools в dev-режиме для тестирования
          devOptions: {
            enabled: false,
          },

          workbox: {
            // Кэшируем все статические ресурсы
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

            // Service Worker сразу активируется и обновляет клиентов
            skipWaiting: true,
            clientsClaim: true,
            cleanupOutdatedCaches: true,

            // Runtime кэш для Supabase API (стратегия: сеть → кэш)
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/otvgzvzcwxffloeeyyiq\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 5 * 60, // 5 минут
                  },
                  networkTimeoutSeconds: 10,
                },
              },
              {
                // Google Fonts, CDN ресурсы
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 год
                  },
                },
              },
            ],
          },

          manifest: {
            name: 'HabitAI',
            short_name: 'HabitAI',
            description: 'Smart habit tracking powered by AI',
            theme_color: '#0f0f23',
            background_color: '#0f0f23',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Версия приложения доступна в коде через import.meta.env.VITE_APP_VERSION
        '__APP_VERSION__': JSON.stringify(pkg.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
