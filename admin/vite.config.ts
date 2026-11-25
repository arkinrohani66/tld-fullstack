import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * اپ مدیریتی مستقل TLD.
 * - ریشه‌ی پروژه = پوشه admin/
 * - متغیرهای محیطی از .env ریشه پروژه خوانده می‌شوند (envDir)
 * - خروجی بیلد در dist-admin/ و مستقل از اپ اصلی است
 */
export default defineConfig({
  root: __dirname,
  base: '/',
  envDir: path.resolve(__dirname, '..'),
  // فونتهای self-host و آیکونها در public/ ریشه قرار دارند؛ بدون این تنظیم
  // بیلد ادمین فقط HTML/JS/CSS میسازد و /fonts/* و /pwa-192x192.png خطای ۴۰۴ میدهند.
  publicDir: path.resolve(__dirname, '..', 'public'),
  plugins: [react(), tailwindcss()],
  server: {
    port: 3100,
    host: '0.0.0.0',
  },
  build: {
    outDir: path.resolve(__dirname, '..', 'dist-admin'),
    emptyOutDir: true,
  },
});
