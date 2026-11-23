import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Cargo } from '@tld/shared';
import { CARGO_STATUS_LABELS } from '@tld/shared';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

/** صفحه صاحب بار: پروفایل، بارهای من و ثبت بار جدید */
export default function ShipperHome() {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const reload = () => api<{ cargos: Cargo[] }>('/cargos').then((d) => setCargos(d.cargos));
  useEffect(() => { reload(); }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('/cargos', {
        method: 'POST',
        body: JSON.stringify({
          title: f.title, originCity: f.originCity, destinationCity: f.destinationCity,
          weightTon: Number(f.weightTon), priceIrr: Number(f.priceIrr),
        }),
      });
      setShowForm(false);
      reload();
    } catch (err) { setError((err as Error).message); }
  }

  const p = user?.profile ?? {};
  return (
    <div>
      <div className="card profile-card">
        <h2>{user?.fullName}</h2>
        {p.companyName && <p>🏢 {p.companyName}</p>}
        {p.province && <p className="muted">📍 {p.province}، {p.city}</p>}
        <span className="badge">پنل صاحب بار</span>
      </div>

      <div className="toolbar">
        <h3>بارهای من</h3>
        <button className="btn" onClick={() => setShowForm(!showForm)}>ثبت بار جدید</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={onSubmit}>
          <input name="title" placeholder="عنوان بار *" required />
          <input name="originCity" placeholder="مبدا *" required />
          <input name="destinationCity" placeholder="مقصد *" required />
          <input name="weightTon" type="number" step="0.1" placeholder="وزن (تن) *" required />
          <input name="priceIrr" type="number" placeholder="قیمت (ریال) *" required />
          {error && <p className="error">{error}</p>}
          <button type="submit">ثبت بار</button>
        </form>
      )}

      {cargos.map((c) => (
        <Link key={c.id} to={`/cargos/${c.id}`} className="cargo-card">
          <strong>{c.title}</strong>
          <span>{c.originCity} ← {c.destinationCity}</span>
          <span>{c.weightTon} تن · {Number(c.priceIrr).toLocaleString('fa-IR')} ریال</span>
          <span className="badge">{CARGO_STATUS_LABELS[c.status]}</span>
        </Link>
      ))}
      {cargos.length === 0 && <p className="muted">هنوز باری ثبت نکرده‌اید.</p>}
    </div>
  );
}
