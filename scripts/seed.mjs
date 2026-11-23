import bcrypt from 'bcryptjs';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://ubuntu:ubuntu@localhost:5432/app';
const pool = new pg.Pool({ connectionString: DATABASE_URL });

const hash = await bcrypt.hash('123456', 10);

async function upsertUser(phone, fullName, role) {
  const { rows } = await pool.query(
    `INSERT INTO users (phone, password_hash, full_name, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
     RETURNING id`,
    [phone, hash, fullName, role],
  );
  return rows[0].id;
}

const shipper = await upsertUser('09120000001', 'علی محمدی (صاحب بار)', 'shipper');
const driver = await upsertUser('09120000002', 'رضا کریمی (راننده)', 'driver');

const { rows: existing } = await pool.query('SELECT COUNT(*)::int AS n FROM cargos');
if (existing[0].n === 0) {
  await pool.query(
    `INSERT INTO cargos (owner_id, title, origin_city, destination_city, weight_ton, price_irr) VALUES
     ($1, 'حمل روغن خوراکی پالت‌شده', 'تهران', 'مشهد', 24, 850000000),
     ($1, 'حمل مواد پلاستیک', 'اصفهان', 'تبریز', 18, 620000000)`,
    [shipper],
  );
  console.log('بارهای نمونه ایجاد شدند');
}

console.log(`کاربران نمونه: shipper=09120000001 driver=09120000002 رمز: 123456 (صاحب بار id=${shipper}, راننده id=${driver})`);
await pool.end();
