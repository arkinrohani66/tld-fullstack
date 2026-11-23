import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { CARGO_STATUS_LABELS, type CargoStatus } from '@tld/shared';
import { useAuth } from './auth.js';
import { api } from './api.js';
import { useEffect, useState, type FormEvent } from 'react';

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <Link to="/" className="brand">TLD Logistics</Link>
      <nav>
        {user ? (
          <>
            <span className="muted">{user.fullName}</span>
            <button onClick={logout}>خروج</button>
          </>
        ) : (
          <>
            <Link to="/login">ورود</Link>
            <Link to="/register">ثبت‌نام</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await login(String(f.get('phone')), String(f.get('password')));
    nav('/');
  }
  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ورود</h2>
      <input name="phone" placeholder="شماره موبایل (09xxxxxxxxx)" required />
      <input name="password" type="password" placeholder="رمز عبور" required />
      <button type="submit">ورود</button>
    </form>
  );
}

function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await register({
      phone: String(f.get('phone')),
      password: String(f.get('password')),
      fullName: String(f.get('fullName')),
      role: String(f.get('role')) as 'shipper' | 'driver',
    });
    nav('/');
  }
  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ثبت‌نام</h2>
      <input name="fullName" placeholder="نام و نام خانوادگی" required />
      <input name="phone" placeholder="شماره موبایل (09xxxxxxxxx)" required />
      <input name="password" type="password" placeholder="رمز عبور (حداقل ۶ کاراکتر)" required />
      <select name="role" defaultValue="shipper">
        <option value="shipper">صاحب بار</option>
        <option value="driver">راننده</option>
      </select>
      <button type="submit">ثبت‌نام</button>
    </form>
  );
}

function Cargos() {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<import('@tld/shared').Cargo[]>([]);
  useEffect(() => {
    api<{ cargos: import('@tld/shared').Cargo[] }>('/cargos').then((d) => setCargos(d.cargos));
  }, []);
  return (
    <div>
      <div className="toolbar">
        <h2>اعلام بار سراسری</h2>
        {user?.role === 'shipper' && <Link to="/cargos/new" className="btn">ثبت بار جدید</Link>}
      </div>
      {cargos.map((c) => (
        <Link key={c.id} to={`/cargos/${c.id}`} className="cargo-card">
          <strong>{c.title}</strong>
          <span>{c.originCity} ← {c.destinationCity}</span>
          <span>{c.weightTon} تن · {Number(c.priceIrr).toLocaleString('fa-IR')} ریال</span>
          <span className="badge">{CARGO_STATUS_LABELS[c.status as CargoStatus]}</span>
        </Link>
      ))}
      {cargos.length === 0 && <p className="muted">هنوز باری ثبت نشده است.</p>}
    </div>
  );
}

function NewCargo() {
  const nav = useNavigate();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    await api('/cargos', {
      method: 'POST',
      body: JSON.stringify({
        title: f.title,
        originCity: f.originCity,
        destinationCity: f.destinationCity,
        weightTon: Number(f.weightTon),
        priceIrr: Number(f.priceIrr),
      }),
    });
    nav('/');
  }
  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ثبت بار جدید</h2>
      <input name="title" placeholder="عنوان بار" required />
      <input name="originCity" placeholder="مبدا" required />
      <input name="destinationCity" placeholder="مقصد" required />
      <input name="weightTon" type="number" step="0.1" placeholder="وزن (تن)" required />
      <input name="priceIrr" type="number" placeholder="قیمت (ریال)" required />
      <button type="submit">ثبت</button>
    </form>
  );
}

function CargoDetail() {
  const { user } = useAuth();
  const id = location.pathname.split('/')[2];
  const [cargo, setCargo] = useState<import('@tld/shared').Cargo | null>(null);
  const [bids, setBids] = useState<import('@tld/shared').Bid[]>([]);
  const [msg, setMsg] = useState('');

  const reload = () => {
    api<{ cargo: import('@tld/shared').Cargo }>(`/cargos/${id}`).then((d) => setCargo(d.cargo));
    api<{ bids: import('@tld/shared').Bid[]}>(`/cargos/${id}/bids`).then((d) => setBids(d.bids));
  };
  useEffect(reload, [id]);

  if (!cargo) return <p className="muted">در حال بارگذاری…</p>;
  const isOwner = user?.id === cargo.ownerId;

  const act = async (path: string, body?: unknown) => {
    try {
      await api(path, body ? { method: 'POST', body: JSON.stringify(body) } : { method: 'POST' });
      setMsg('');
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act(`/cargos/${id}/bids`, { amountIrr: Number(f.get('amountIrr')) });
            }}
          >
            <input name="amountIrr" type="number" placeholder="پیشنهاد شما (ریال)" required />
            <button type="submit">ثبت پیشنهاد</button>
          </form>
        )}
        {isOwner && cargo.status === 'assigned' && (
          <button onClick={() => act(`/cargos/${id}/fund`)}>واریز امانی مبلغ</button>
        )}
        {isOwner && cargo.status === 'funded' && (
          <button onClick={() => act(`/cargos/${id}/start`)}>شروع حمل و صدور بارنامه</button>
        )}
        {isOwner && cargo.status === 'delivered' && (
          <button onClick={() => act(`/cargos/${id}/release`)}>تسویه امانی و آزادسازی مبلغ</button>
        )}
        {user?.role === 'driver' && cargo.status === 'in_transit' && (
          <button onClick={() => act(`/cargos/${id}/deliver`)}>اعلام تحویل</button>
        )}
      </div>

      <h3>پیشنهادها</h3>
      {bids.map((b) => (
        <div key={b.id} className="cargo-card">
          <span>{b.driverName}</span>
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
  if (loading) return <p className="muted">در حال بارگذاری…</p>;
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Cargos />} />
          <Route path="/login" element={user ? <Cargos /> : <Login />} />
          <Route path="/register" element={user ? <Cargos /> : <Register />} />
          <Route path="/cargos/new" element={user ? <NewCargo /> : <Login />} />
          <Route path="/cargos/:id" element={user ? <CargoDetail /> : <Login />} />
        </Routes>
      </main>
    </>
  );
}
