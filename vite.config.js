import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Ungig — Vite config with PWA (manifest, service worker, offline fallback).
// Theme color matches our dark navy; background matches on first paint.
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
      ],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Raise the per-file precache cap so our main JS bundle fits.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Ungig',
        short_name: 'Ungig',
        description: 'Ungig — Exchange value. Build together. Create a way out.',
        theme_color: '#0D0D0F',
        background_color: '#0D0D0F',
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
