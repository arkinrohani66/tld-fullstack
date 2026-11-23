import { Router } from 'express';
import { z } from 'zod';
import type { Cargo } from '@tld/shared';
import { pool } from '../../db.js';
import { HttpError, wrap } from '../../http.js';
import { requireAuth } from '../../auth.js';

export const cargosModule = { prefix: '/api/cargos', router: Router() };
const r = cargosModule.router;

const createSchema = z.object({
  title: z.string().min(3),
  originCity: z.string().min(2),
  destinationCity: z.string().min(2),
  weightTon: z.number().positive(),
  priceIrr: z.number().int().positive(),
});

r.get('/', wrap(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const { rows } = status
    ? await pool.query<Cargo>('SELECT id, owner_id AS "ownerId", title, origin_city AS "originCity", destination_city AS "destinationCity", weight_ton AS "weightTon", price_irr AS "priceIrr", status, driver_id AS "driverId", created_at AS "createdAt" FROM cargos WHERE status = $1 ORDER BY id DESC LIMIT 100', [status])
    : await pool.query<Cargo>('SELECT id, owner_id AS "ownerId", title, origin_city AS "originCity", destination_city AS "destinationCity", weight_ton AS "weightTon", price_irr AS "priceIrr", status, driver_id AS "driverId", created_at AS "createdAt" FROM cargos ORDER BY id DESC LIMIT 100');
  res.json({ cargos: rows });
}));

r.post('/', requireAuth, wrap(async (req, res) => {
  if (req.user!.role !== 'shipper') throw new HttpError(403, 'فقط صاحب بار می‌تواند بار ثبت کند');
  const body = createSchema.parse(req.body);
  const { rows } = await pool.query<Cargo>(
    `INSERT INTO cargos (owner_id, title, origin_city, destination_city, weight_ton, price_irr)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, owner_id AS "ownerId", title, origin_city AS "originCity", destination_city AS "destinationCity", weight_ton AS "weightTon", price_irr AS "priceIrr", status, driver_id AS "driverId", created_at AS "createdAt"`,
    [req.user!.id, body.title, body.originCity, body.destinationCity, body.weightTon, body.priceIrr],
  );
  res.status(201).json({ cargo: rows[0] });
}));

r.get('/:id', wrap(async (req, res) => {
  const { rows } = await pool.query<Cargo>(
    `SELECT id, owner_id AS "ownerId", title, origin_city AS "originCity", destination_city AS "destinationCity", weight_ton AS "weightTon", price_irr AS "priceIrr", status, driver_id AS "driverId", created_at AS "createdAt"
     FROM cargos WHERE id = $1`,
    [Number(req.params.id)],
  );
  if (!rows[0]) throw new HttpError(404, 'بار یافت نشد');
  res.json({ cargo: rows[0] });
}));
