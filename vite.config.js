import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Gifted — Vite config with PWA (manifest, service worker, offline fallback).
// Light theme to match the Gifted brand background.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest gives us a hand-written src/sw.js and avoids
      // workbox-build's internal terser minification (known hang).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/apple-touch-icon.png',
        'offline.html',
        'giff/face.png',
        'giff/standing.png',
        'giff/gift.png',
      ],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Raise the per-file precache cap so our main JS bundle fits.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Gifted',
        short_name: 'Gifted',
        description: 'Gifted — GIVE • RECEIVE • GROW',
        theme_color: '#1B7F4F',
        background_color: '#F6EFE4',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        // Enables PWA in dev so you can iterate on manifest/SW behavior.
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
