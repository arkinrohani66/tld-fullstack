import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'TLD - سامانه هوشمند لجستیک حمل و نقل سنگین',
          short_name: 'TLD Logistics',
          description: 'سامانه هوشمند مدیریت یکپارچه لجستیک و حمل‌ونقل سنگین با رهگیری هوشمند IoT و اعلام بار سراسری',
          theme_color: '#00258e',
          background_color: '#fbf8ff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'fa',
          dir: 'rtl',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg}'],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Split the heavy vendors out of the entry chunk so a code change does
          // not invalidate the whole ~3 MB bundle for returning users.
          manualChunks: {
            react: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            pdf: ['jspdf', 'html2canvas'],
            icons: ['lucide-react'],
            motion: ['motion'],
            ai: ['@google/genai'],
          },
        },
      },
    },
    server: {
      host: true,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
