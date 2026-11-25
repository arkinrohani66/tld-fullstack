/**
 * ادپتور Serverless برای Vercel — درخواست‌های /api/* را به اپ Express می‌فرستد.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app.js';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
