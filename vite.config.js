
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HabitAi',
        short_name: 'HabitAi',
        description: 'AI-powered habit tracker',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/4315/4315445.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/4315/4315445.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/desktop-auth\.html/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn-icons-png\.flaticon\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'icon-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/src-tauri/**', '**/dist/**']
    }
  },
  optimizeDeps: {
    exclude: [],
    include: ['react', 'react-dom', 'framer-motion']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase SDK (~500KB)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // Charting (~300KB)
          if (id.includes('node_modules/apexcharts') || id.includes('node_modules/react-apexcharts')) {
            return 'vendor-charts';
          }
          // AI SDK (~200KB)
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-ai';
          }
          // Motion animation library
          if (id.includes('node_modules/motion')) {
            return 'vendor-motion';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // DnD Kit
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd';
          }
          // React core (~150KB)
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
  // API key is read via import.meta.env.VITE_GEMINI_API_KEY (from .env / .env.local)
  // No need for process.env injection — Vite exposes VITE_* vars automatically
})