import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@tld/shared';
import { pool } from '../../db.js';
import { HttpError, wrap } from '../../http.js';
import { requireAuth, signToken } from '../../auth.js';

export const authModule = { prefix: '/api/auth', router: Router() };
const r = authModule.router;

const registerSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
  fullName: z.string().min(3),
  role: z.enum(['shipper', 'driver']),
});

r.post('/register', wrap(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(body.password, 10);
  const { rows } = await pool.query<User & { password_hash: string }>(
    'INSERT INTO users (phone, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, phone, full_name, role',
    [body.phone, hash, body.fullName, body.role],
  );
  const user = rows[0];
  res.status(201).json({ user, token: signToken({ id: user.id, role: user.role }) });
}));

r.post('/login', wrap(async (req, res) => {
  const body = z.object({ phone: z.string(), password: z.string() }).parse(req.body);
  const { rows } = await pool.query<User & { password_hash: string }>(
    'SELECT id, phone, full_name, role, password_hash FROM users WHERE phone = $1',
    [body.phone],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, 'شماره موبایل یا رمز عبور اشتباه است');
  }
  res.json({ user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role }, token: signToken({ id: user.id, role: user.role }) });
}));

r.get('/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await pool.query<User>(
    'SELECT id, phone, full_name AS "fullName", role FROM users WHERE id = $1',
    [req.user!.id],
  );
  if (!rows[0]) throw new HttpError(404, 'کاربر یافت نشد');
  res.json({ user: rows[0] });
}));
