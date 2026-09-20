/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'billard_ball_8.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-512-maskable.png',
        'apple-touch-icon.png',
        'sound/alert-time.mp3',
        'sound/clic.mp3',
        'sound/minions-arghh.mp3',
        'sound/original/cretins-couac.wav',
        'sound/original/cretins-glousse.wav',
        'sound/original/cretins-tick.wav',
        'sound/original/cretins-alerte5s.wav',
        'sound/original/cretins-fin.wav',
        'sound/original/minionslike-gazouillis.wav',
        'sound/original/minionslike-wouah.wav',
        'sound/original/minionslike-tick.wav',
        'sound/original/minionslike-alerte5s.wav',
        'sound/original/minionslike-fin.wav',
        'tutorial/slide-accueil.svg',
        'tutorial/slide-tap.svg',
        'tutorial/slide-double.svg',
        'tutorial/slide-joueurs.svg',
        'tutorial/slide-temps.svg',
        'tutorial/slide-reglages.svg',
        'tutorial/slide-miroir-remote.svg',
        'tutorial/slide-miroir-visuel.svg',
      ],
      manifest: {
        name: 'H8timer',
        short_name: 'H8timer',
        description:
          'Chronomètre de tir Blackball / billard, configurable et installable.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3,wav,webmanifest}'],
        globIgnores: ['**/version.json'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/tutorial\//, /\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ico)$/i],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\/version\.json/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
