import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { COMMISSION_RATE, VAT_RATE } from '@tld/shared';
import { pool, withTransaction } from '../../db.js';
import { HttpError, wrap } from '../../http.js';
import { requireAuth } from '../../auth.js';

export const escrowModule = { prefix: '/api/cargos', router: Router() };
const r = escrowModule.router;

/** نگهداری مبلغ به صورت امانی توسط صاحب بار */
r.post('/:id/fund', requireAuth, wrap(async (req, res) => {
  await withTransaction(async (client) => {
    const cargo = (await client.query('SELECT * FROM cargos WHERE id = $1 FOR UPDATE', [Number(req.params.id)])).rows[0];
    if (!cargo) throw new HttpError(404, 'بار یافت نشد');
    if (cargo.owner_id !== req.user!.id) throw new HttpError(403, 'فقط مالک بار می‌تواند واریز کند');
    if (cargo.status !== 'assigned') throw new HttpError(409, 'ابتدا باید راننده تعیین شود');
    await client.query("UPDATE cargos SET status = 'funded' WHERE id = $1", [cargo.id]);
    await client.query(
      'INSERT INTO escrow_entries (cargo_id, kind, amount_irr) VALUES ($1, $2, $3)',
      [cargo.id, 'hold', String(cargo.price_irr)],
    );
  });
  res.json({ ok: true });
}));

/** شروع حمل: صدور بارنامه الکترونیک */
r.post('/:id/start', requireAuth, wrap(async (req, res) => {
  await withTransaction(async (client) => {
    const cargo = (await client.query('SELECT * FROM cargos WHERE id = $1 FOR UPDATE', [Number(req.params.id)])).rows[0];
    if (!cargo) throw new HttpError(404, 'بار یافت نشد');
    if (cargo.status !== 'funded') throw new HttpError(409, 'بار باید واریز امانی شده باشد');
    await client.query("UPDATE cargos SET status = 'in_transit' WHERE id = $1", [cargo.id]);
    const serial = `TLD-${cargo.id}-${randomBytes(4).toString('hex').toUpperCase()}`;
    await client.query('INSERT INTO waybills (cargo_id, serial) VALUES ($1, $2) ON CONFLICT (cargo_id) DO NOTHING', [cargo.id, serial]);
  });
  res.json({ ok: true });
}));

/** اعلام تحویل توسط راننده */
r.post('/:id/deliver', requireAuth, wrap(async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE cargos SET status = 'delivered' WHERE id = $1 AND driver_id = $2 AND status = 'in_transit' RETURNING id",
    [Number(req.params.id), req.user!.id],
  );
  if (!rows[0]) throw new HttpError(409, 'اعلام تحویل ممکن نیست');
  res.json({ ok: true });
}));

/**
 * تسویه امانی: آزادسازی مبلغ برای راننده پس از کسر کارمزد ۵٪ سامانه
 * و ۹٪ مالیات بر ارزش افزوده روی کارمزد.
 */
r.post('/:id/release', requireAuth, wrap(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const cargo = (await client.query('SELECT * FROM cargos WHERE id = $1 FOR UPDATE', [Number(req.params.id)])).rows[0];
    if (!cargo) throw new HttpError(404, 'بار یافت نشد');
    if (cargo.owner_id !== req.user!.id) throw new HttpError(403, 'فقط مالک بار می‌تواند تسویه کند');
    if (cargo.status !== 'delivered') throw new HttpError(409, 'بار باید تحویل شده باشد');

    const price = BigInt(cargo.price_irr);
    const commission = (price * BigInt(Math.round(COMMISSION_RATE * 100))) / 100n;
    const vat = (commission * BigInt(Math.round(VAT_RATE * 100))) / 100n;

    await client.query("UPDATE cargos SET status = 'released' WHERE id = $1", [cargo.id]);
    await client.query(
      'INSERT INTO escrow_entries (cargo_id, kind, amount_irr) VALUES ($1, $2, $3), ($1, $4, $5), ($1, $6, $7)',
      [cargo.id, 'release_to_driver', (price - commission - vat).toString(), 'commission', commission.toString(), 'vat', vat.toString()],
    );
    return { driverAmount: (price - commission - vat).toString(), commission: commission.toString(), vat: vat.toString() };
  });
  res.json(result);
}));

/** دفتر امانی بار */
r.get('/:id/ledger', wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, cargo_id AS "cargoId", kind, amount_irr AS "amountIrr", created_at AS "createdAt" FROM escrow_entries WHERE cargo_id = $1 ORDER BY id',
    [Number(req.params.id)],
  );
  res.json({ ledger: rows });
}));
