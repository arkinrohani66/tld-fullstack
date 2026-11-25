import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { CARGO_STATUS_LABELS, type Cargo, type CargoStatus, type Bid } from '@tld/shared';
import { useAuth } from './auth.js';
import { api } from './api.js';
import { useEffect, useState, type FormEvent } from 'react';
import { Splash } from './screens/stitch/Splash.js';
import { Onboarding } from './screens/stitch/Onboarding.js';
import { LanguageSelection } from './screens/stitch/LanguageSelection.js';
import { Login } from './screens/stitch/Login.js';
import { SignUp } from './screens/stitch/SignUp.js';
import { RoleSelection } from './screens/stitch/RoleSelection.js';
import ShipperHome from './screens/ShipperHome.js';
import DriverHome from './screens/DriverHome.js';

function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <header className="header">
      <Link to="/" className="brand">TLD Logistics</Link>
      <nav>
        <span className="muted">{user.fullName}</span>
        <button onClick={() => { logout(); nav('/login'); }}>خروج</button>
      </nav>
    </header>
  );
}

/** جزئیات بار: مشترک بین دو نقش، اکشن‌ها بر اساس نقش و وضعیت */
function CargoDetail() {
  const { user } = useAuth();
  const id = location.pathname.split('/')[2];
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [bids, setBids] = useState<(Bid & { driverName?: string })[]>([]);
  const [msg, setMsg] = useState('');

  const reload = () => {
    api<{ cargo: Cargo }>(`/cargos/${id}`).then((d) => setCargo(d.cargo));
    api<{ bids: (Bid & { driverName?: string })[]}>(`/cargos/${id}/bids`).then((d) => setBids(d.bids));
  };
  useEffect(reload, [id]);

  if (!cargo) return <p className="muted">در حال بارگذاری…</p>;
  const isOwner = user?.id === cargo.ownerId;

  const act = async (path: string, body?: unknown) => {
    try {
      await api(path, body ? { method: 'POST', body: JSON.stringify(body) } : { method: 'POST' });
      setMsg('');
      reload();
    } catch (e) { setMsg((e as Error).message); }
  };

  return (
    <div>
      <div className="card">
        <h2>{cargo.title}</h2>
        <p>{cargo.originCity} ← {cargo.destinationCity} · {cargo.weightTon} تن</p>
        <p>قیمت: {Number(cargo.priceIrr).toLocaleString('fa-IR')} ریال</p>
        <p>وضعیت: {CARGO_STATUS_LABELS[cargo.status as CargoStatus]}</p>
        {msg && <p className="error">{msg}</p>}
        {user?.role === 'driver' && cargo.status === 'listed' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            act(`/cargos/${id}/bids`, { amountIrr: Number(f.get('amountIrr')) });
          }}>
            <input name="amountIrr" type="number" placeholder="پیشنهاد شما (ریال)" required />
            <button type="submit">ثبت پیشنهاد</button>
          </form>
        )}
        {isOwner && cargo.status === 'assigned' && <button onClick={() => act(`/cargos/${id}/fund`)}>واریز امانی مبلغ</button>}
        {isOwner && cargo.status === 'funded' && <button onClick={() => act(`/cargos/${id}/start`)}>شروع حمل و صدور بارنامه</button>}
        {isOwner && cargo.status === 'delivered' && <button onClick={() => act(`/cargos/${id}/release`)}>تسویه امانی و آزادسازی مبلغ</button>}
        {user?.role === 'driver' && cargo.status === 'in_transit' && <button onClick={() => act(`/cargos/${id}/deliver`)}>اعلام تحویل</button>}
      </div>

      <h3>پیشنهادها</h3>
      {bids.map((b) => (
        <div key={b.id} className="cargo-card">
          <span>{b.driverName ?? `راننده #${b.driverId}`}</span>
          <span>{Number(b.amountIrr).toLocaleString('fa-IR')} ریال</span>
          {isOwner && cargo.status === 'listed' && b.status === 'pending' && (
            <button onClick={() => act(`/bids/${b.id}/accept`)}>پذیرش</button>
          )}
        </div>
      ))}
      {bids.length === 0 && <p className="muted">هنوز پیشنهادی ثبت نشده است.</p>}
    </div>
  );
}

export default function App() {
  const { loading, user } = useAuth();
  if (loading) return <div className="splash"><div className="splash-logo">TLD</div></div>;
  return (
    <>
      <Header />
      <main className="!max-w-none !p-0">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/language" element={<LanguageSelection />} />
          <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
          <Route path="/role-select" element={user ? <Navigate to={`/${user.role}`} replace /> : <SignUp />} />
          <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <SignUp />} />
          <Route path="/roles" element={user ? (user.role === 'driver' ? <RoleSelection /> : <Navigate to="/shipper" replace />) : <Navigate to="/login" replace />} />
          <Route path="/shipper" element={user?.role === 'shipper' ? <ShipperHome /> : <Navigate to="/login" replace />} />
          <Route path="/driver" element={user?.role === 'driver' ? <DriverHome /> : <Navigate to="/login" replace />} />
          <Route path="/cargos/new" element={<Navigate to="/shipper" replace />} />
          <Route path="/cargos/:id" element={user ? <CargoDetail /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
