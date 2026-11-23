import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db.js';
import { HttpError, wrap } from '../../http.js';
import { requireAuth } from '../../auth.js';

export const bidsModule = { prefix: '/api', router: Router() };
const r = bidsModule.router;

/** راننده روی بار پیشنهاد قیمت ثبت می‌کند */
r.post('/cargos/:id/bids', requireAuth, wrap(async (req, res) => {
  if (req.user!.role !== 'driver') throw new HttpError(403, 'فقط راننده می‌تواند پیشنهاد بدهد');
  const body = z.object({ amountIrr: z.number().int().positive() }).parse(req.body);
  const cargoId = Number(req.params.id);

  const cargo = await pool.query('SELECT status FROM cargos WHERE id = $1 FOR UPDATE', [cargoId]);
  if (!cargo.rows[0]) throw new HttpError(404, 'بار یافت نشد');
  if (cargo.rows[0].status !== 'listed') throw new HttpError(409, 'این بار دیگر پذیرش پیشنهاد ندارد');

  const { rows } = await pool.query(
    `INSERT INTO bids (cargo_id, driver_id, amount_irr) VALUES ($1, $2, $3)
     ON CONFLICT (cargo_id, driver_id) DO UPDATE SET amount_irr = EXCLUDED.amount_irr, status = 'pending', created_at = now()
     RETURNING id, cargo_id AS "cargoId", driver_id AS "driverId", amount_irr AS "amountIrr", status, created_at AS "createdAt"`,
    [cargoId, req.user!.id, body.amountIrr],
  );
  res.status(201).json({ bid: rows[0] });
}));

/** پیشنهادهای یک بار */
r.get('/cargos/:id/bids', wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.id, b.cargo_id AS "cargoId", b.driver_id AS "driverId", b.amount_irr AS "amountIrr", b.status, b.created_at AS "createdAt", u.full_name AS "driverName"
     FROM bids b JOIN users u ON u.id = b.driver_id
     WHERE b.cargo_id = $1 ORDER BY b.amount_irr ASC`,
    [Number(req.params.id)],
  );
  res.json({ bids: rows });
}));

/** صاحب بار یک پیشنهاد را می‌پذیرد و راننده تعیین می‌شود */
r.post('/bids/:id/accept', requireAuth, wrap(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE cargos SET driver_id = b.driver_id, status = 'assigned'
     FROM (SELECT cargo_id, driver_id FROM bids WHERE id = $1 AND status = 'pending') b
     WHERE cargos.id = b.cargo_id AND cargos.owner_id = $2 AND cargos.status IN ('listed', 'assigned')
     RETURNING cargos.id`,
    [Number(req.params.id), req.user!.id],
  );
  if (!rows[0]) throw new HttpError(409, 'پذیرش پیشنهاد ممکن نیست (ممکن است مالک بار نباشید یا وضعیت بار مناسب نباشد)');
  await pool.query("UPDATE bids SET status = 'accepted' WHERE id = $1", [Number(req.params.id)]);
  res.json({ ok: true });
}));
