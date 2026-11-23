import { Router } from 'express';
import { z } from 'zod';
import type { TelemetrySample } from '@tld/shared';
import { pool } from '../../db.js';
import { wrap } from '../../http.js';
import { requireAuth } from '../../auth.js';

export const trackingModule = { prefix: '/api/cargos', router: Router() };
const r = trackingModule.router;

const telemetrySchema = z.object({
  fuelLevelPct: z.number().min(0).max(100).nullable().optional(),
  tempZone1C: z.number().nullable().optional(),
  tempZone2C: z.number().nullable().optional(),
  tempZone3C: z.number().nullable().optional(),
  shockG: z.number().nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
});

/** دریافت تله‌متری TLD-Box (نقطه اتصال آینده دستگاه IoT) */
r.post('/:id/telemetry', requireAuth, wrap(async (req, res) => {
  const body = telemetrySchema.parse(req.body);
  const { rows } = await pool.query<TelemetrySample>(
    `INSERT INTO telemetry (cargo_id, fuel_level_pct, temp_zone1_c, temp_zone2_c, temp_zone3_c, shock_g, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, cargo_id AS "cargoId", fuel_level_pct AS "fuelLevelPct", temp_zone1_c AS "tempZone1C", temp_zone2_c AS "tempZone2C", temp_zone3_c AS "tempZone3C", shock_g AS "shockG", lat, lng, recorded_at AS "recordedAt"`,
    [Number(req.params.id), body.fuelLevelPct ?? null, body.tempZone1C ?? null, body.tempZone2C ?? null, body.tempZone3C ?? null, body.shockG ?? null, body.lat ?? null, body.lng ?? null],
  );
  res.status(201).json({ telemetry: rows[0] });
}));

/** آخرین نمونه‌های تله‌متری بار */
r.get('/:id/telemetry', wrap(async (req, res) => {
  const { rows } = await pool.query<TelemetrySample>(
    `SELECT id, cargo_id AS "cargoId", fuel_level_pct AS "fuelLevelPct", temp_zone1_c AS "tempZone1C", temp_zone2_c AS "tempZone2C", temp_zone3_c AS "tempZone3C", shock_g AS "shockG", lat, lng, recorded_at AS "recordedAt"
     FROM telemetry WHERE cargo_id = $1 ORDER BY id DESC LIMIT 50`,
    [Number(req.params.id)],
  );
  res.json({ telemetry: rows });
}));
