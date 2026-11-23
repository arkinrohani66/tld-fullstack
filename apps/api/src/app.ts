import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { modules } from './modules/index.js';
import { errorHandler } from './http.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'tld-api' });
  });

  // ماژول‌ها خودکار ثبت می‌شوند — برای افزودن قابلیت جدید فقط ماژول را به modules/index.js اضافه کنید.
  for (const mod of modules) {
    app.use(mod.prefix, mod.router);
  }

  app.use((_req, res) => res.status(404).json({ error: 'مسیر یافت نشد' }));
  app.use(errorHandler);
  return app;
}
