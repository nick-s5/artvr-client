import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'ArtVR Gallery',
        short_name: 'ArtVR',
        description: 'Virtual Art Gallery Experience',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
      '@shared/firebase/config': resolve(__dirname, '../shared/firebase/config.ts'),
      '@shared/firebase/collections': resolve(__dirname, '../shared/firebase/collections.ts'),
      '@shared/types/firestore': resolve(__dirname, '../shared/types/firestore.ts'),
      '@shared/types/auth': resolve(__dirname, '../shared/types/auth.ts'),
      '@shared/types/analytics': resolve(__dirname, '../shared/types/analytics.ts'),
      '@shared/utils/deviceInfo': resolve(__dirname, '../shared/utils/deviceInfo.ts'),
      '@shared/utils/analytics': resolve(__dirname, '../shared/utils/analytics.ts'),
      '@shared/constants/firebase-paths': resolve(__dirname, '../shared/constants/firebase-paths.ts'),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage', 'firebase/functions'],
  },
});