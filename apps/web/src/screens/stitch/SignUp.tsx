import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.js';

type Role = 'shipper' | 'driver';

export function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('shipper');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password'));
    if (password !== f.get('confirmPassword')) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    setBusy(true);
    try {
      await register({
        role,
        fullName: `${f.get('firstName')} ${f.get('lastName')}`,
        phone: String(f.get('phone')),
        password,
        profile: role === 'shipper' ? { companyName: '' } : { vehicleType: '', plate: '' },
      });
      navigate(role === 'driver' ? '/driver' : '/shipper', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col justify-center items-center p-margin-mobile relative overflow-hidden font-body-md" dir="rtl">
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#00258e 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <main className="w-full max-w-md bg-surface border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,72,255,0.08)] z-10 p-lg md:p-xl flex flex-col gap-lg my-lg">
        <header className="flex flex-col items-center gap-sm text-center">
          <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center border border-outline-variant mb-sm">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary">ایجاد حساب کاربری</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">برای دسترسی به سیستم اطلاعات خود را وارد کنید.</p>
        </header>
        <form className="flex flex-col gap-md" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="firstName">نام</label>
              <input
                aria-label="نام"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                id="firstName"
                name="firstName"
                placeholder="علی"
                required
                type="text"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="lastName">نام خانوادگی</label>
              <input
                aria-label="نام خانوادگی"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-sm px-md font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                id="lastName"
                name="lastName"
                placeholder="رضایی"
                required
                type="text"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="phone">شماره موبایل</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-sm pointer-events-none">
                <span className="material-symbols-outlined text-outline text-lg">smartphone</span>
              </span>
              <input
                aria-label="شماره موبایل"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-sm pl-md pr-10 font-tech-data-md text-tech-data-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                dir="ltr"
                id="phone"
                name="phone"
                placeholder="0912 345 6789"
                required
                type="tel"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="role">نقش کاربری</label>
            <div className="grid grid-cols-2 gap-md">
              {(['shipper', 'driver'] as Role[]).map((r) => (
                <button
                  aria-checked={role === r}
                  aria-label={r === 'shipper' ? 'صاحب بار' : 'راننده'}
                  className={`p-sm rounded-lg border-2 flex items-center justify-center gap-sm transition-colors ${
                    role === r ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface hover:bg-surface-container-low'
                  }`}
                  key={r}
                  onClick={() => setRole(r)}
                  role="radio"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-xl ${role === r ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {r === 'shipper' ? 'inventory_2' : 'local_shipping'}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">{r === 'shipper' ? 'صاحب بار' : 'راننده'}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="password">رمز عبور</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-sm pointer-events-none">
                  <span className="material-symbols-outlined text-status-active text-lg">lock</span>
                </span>
                <input
                  aria-label="رمز عبور"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-sm pl-10 pr-10 font-tech-data-md text-tech-data-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  dir="ltr"
                  id="password"
                  name="password"
                  required
                  type="password"
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="confirmPassword">تکرار رمز عبور</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-sm pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg">lock_reset</span>
                </span>
                <input
                  aria-label="تکرار رمز عبور"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-sm pl-10 pr-10 font-tech-data-md text-tech-data-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  dir="ltr"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  type="password"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-sm mt-sm">
            <input className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-surface-container-lowest cursor-pointer" id="terms" name="terms" required type="checkbox" />
            <label className="font-body-md text-body-md text-on-surface-variant text-sm cursor-pointer select-none" htmlFor="terms">
              <a className="text-primary hover:underline font-medium" href="#">قوانین و مقررات</a> سیستم را می‌پذیرم.
            </label>
          </div>
          {error && (
            <p aria-live="assertive" className="font-tech-label text-tech-label text-error mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {error}
            </p>
          )}
          <div className="flex flex-col gap-sm mt-md">
            <button
              aria-label="ثبت نام در سیستم"
              className="w-full bg-primary text-on-primary font-button-label text-button-label py-sm px-md rounded-DEFAULT flex items-center justify-center gap-sm hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-[0.98] disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              <span>{busy ? 'در حال ثبت...' : 'ثبت‌نام'}</span>
              <span className="material-symbols-outlined text-lg">arrow_left_alt</span>
            </button>
            <Link
              aria-label="بازگشت به صفحه ورود"
              className="w-full border border-outline-variant text-on-surface font-button-label text-button-label py-sm px-md rounded-DEFAULT flex items-center justify-center hover:bg-surface-container-high transition-colors text-center"
              to="/login"
            >
              بازگشت به ورود
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
