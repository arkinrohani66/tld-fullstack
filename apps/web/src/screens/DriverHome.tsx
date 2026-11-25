import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Cargo } from '@tld/shared';
import { CARGO_STATUS_LABELS } from '@tld/shared';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

/** صفحه راننده: پروفایل و اعلام بارهای سراسری برای پیشنهاد */
export default function DriverHome() {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);

  useEffect(() => {
    api<{ cargos: Cargo[] }>('/cargos').then((d) => setCargos(d.cargos));
  }, []);

  const listed = cargos.filter((c) => c.status === 'listed');
  const other = cargos.filter((c) => c.status !== 'listed');
  const p = user?.profile ?? {};

  return (
    <div>
      <div className="card profile-card">
        <h2>{user?.fullName}</h2>
        {p.vehicleType && <p>🚛 {p.vehicleType} · پلاک {p.plateNumber}</p>}
        {p.province && <p className="muted">📍 {p.province}، {p.city}</p>}
        <span className="badge">پنل راننده</span>
      </div>

      <h3>اعلام بار سراسری</h3>
      {listed.map((c) => (
        <Link key={c.id} to={`/cargos/${c.id}`} className="cargo-card">
          <strong>{c.title}</strong>
          <span>{c.originCity} ← {c.destinationCity}</span>
          <span>{c.weightTon} تن · {Number(c.priceIrr).toLocaleString('fa-IR')} ریال</span>
          <span className="btn">ثبت پیشنهاد</span>
        </Link>
      ))}
      {listed.length === 0 && <p className="muted">فعلاً باری برای پیشنهاد نیست.</p>}

      {other.length > 0 && <h3>سایر بارها</h3>}
      {other.map((c) => (
        <Link key={c.id} to={`/cargos/${c.id}`} className="cargo-card">
          <strong>{c.title}</strong>
          <span>{c.originCity} ← {c.destinationCity}</span>
          <span className="badge">{CARGO_STATUS_LABELS[c.status]}</span>
        </Link>
      ))}
    </div>
  );
}
