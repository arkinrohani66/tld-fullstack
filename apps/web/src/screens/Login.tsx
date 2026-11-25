import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Role } from '@tld/shared';
import { useAuth } from '../auth.js';

/** ورود با نقش مشخص — پس از ورود به صفحه همان نقش می‌رود */
export default function Login({ role }: { role: Exclude<Role, 'admin'> }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      await login(String(f.get('phone')), String(f.get('password')));
      nav(`/${role}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>ورود {role === 'shipper' ? 'صاحب بار' : 'راننده'}</h2>
      <input name="phone" placeholder="شماره موبایل (09xxxxxxxxx)" required />
      <input name="password" type="password" placeholder="رمز عبور" required />
      {error && <p className="error">{error}</p>}
      <button type="submit">ورود</button>
      <p className="muted">
        حساب ندارید؟ <Link to={`/register/${role}`}>ثبت‌نام {role === 'shipper' ? 'صاحب بار' : 'راننده'}</Link>
      </p>
    </form>
  );
}
