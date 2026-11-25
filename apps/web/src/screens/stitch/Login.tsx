import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.js';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(phone, password);
      navigate(u.role === 'driver' ? '/driver' : '/shipper', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex items-center justify-center p-gutter md:p-margin-desktop antialiased" dir="rtl">
      <div className="w-full max-w-5xl bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,72,255,0.08)] flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-1/2 p-lg md:p-xl flex flex-col justify-center bg-surface-container-lowest z-10">
          <div className="mb-xl text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-sm mb-lg">
              <span className="material-symbols-outlined text-[32px] text-primary">conveyor_belt</span>
              <span className="font-tech-data-lg text-tech-data-lg text-primary tracking-tighter" dir="ltr">TLD.LOGISTICS</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">ورود به حساب کاربری</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">جهت دسترسی به داشبورد و کنترل ناوگان، وارد شوید.</p>
          </div>
          <form className="flex flex-col gap-lg" onSubmit={onSubmit}>
            <div className="flex flex-col gap-xs">
              <label className="font-body-md text-body-md text-on-surface font-semibold" htmlFor="mobile">شماره موبایل</label>
              <div className="flex items-stretch border border-outline-variant rounded-DEFAULT bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden h-12">
                <div className="flex items-center bg-surface-container border-l border-outline-variant px-sm" dir="ltr">
                  <span className="material-symbols-outlined text-on-surface-variant mr-xs text-[18px]">public</span>
                  <select aria-label="کد کشور" className="bg-transparent border-none focus:ring-0 font-tech-data-md text-tech-data-md text-on-surface py-0 pl-0 pr-sm cursor-pointer appearance-none">
                    <option>+98</option>
                    <option>+90</option>
                    <option>+1</option>
                  </select>
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px] pointer-events-none">arrow_drop_down</span>
                </div>
                <input
                  aria-label="شماره موبایل"
                  autoComplete="tel"
                  className="flex-1 bg-transparent border-none focus:ring-0 font-tech-data-md text-tech-data-md text-on-surface px-md text-left"
                  dir="ltr"
                  id="mobile"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 000 0000"
                  required
                  type="tel"
                  value={phone}
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center">
                <label className="font-body-md text-body-md text-on-surface font-semibold" htmlFor="password">رمز عبور</label>
                <a className="font-body-md text-body-md text-primary hover:text-primary-container transition-colors text-sm" href="#">فراموشی رمز عبور؟</a>
              </div>
              <div className="flex items-stretch border border-outline-variant rounded-DEFAULT bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden h-12 relative">
                <input
                  autoComplete="current-password"
                  className="flex-1 bg-transparent border-none focus:ring-0 font-tech-data-md text-tech-data-md text-on-surface px-md text-left"
                  dir="ltr"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showPass ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label="نمایش رمز عبور"
                  className="absolute left-0 top-0 bottom-0 px-md flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowPass(!showPass)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            {error && (
              <p className="font-tech-label text-tech-label text-error flex items-center gap-1" aria-live="assertive">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
            <div className="flex flex-col gap-sm mt-md">
              <button
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-button-label text-button-label rounded-DEFAULT flex items-center justify-center gap-sm transition-colors shadow-sm disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                <span>{busy ? 'در حال ورود...' : 'ورود'}</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
              <button
                className="w-full h-12 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface font-button-label text-button-label rounded-DEFAULT flex items-center justify-center gap-sm transition-colors"
                type="button"
              >
                <span>ورود با رمز یک‌بار مصرف (OTP)</span>
                <span className="material-symbols-outlined text-[18px]">passkey</span>
              </button>
            </div>
          </form>
          <div className="mt-xl text-center border-t border-surface-variant pt-md">
            <span className="font-body-md text-body-md text-on-surface-variant">حساب کاربری ندارید؟</span>
            <Link className="font-body-md text-body-md text-primary font-bold hover:underline" to="/role-select">ایجاد حساب کاربری</Link>
          </div>
        </div>
        <div className="hidden md:block w-1/2 bg-surface-container border-r border-outline-variant relative overflow-hidden">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#e2e1ed_1px,transparent_1px),linear-gradient(to_bottom,#e2e1ed_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 z-0"
          />
          <div
            className="absolute inset-0 z-10 mix-blend-multiply opacity-90"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCkOLC_yOKXTBkpelYLu_Wmhhwz2ktIE-L-G6Q8Ql02jBWHPCHLC7mFhdyqm0tTDhxYPCPGQ7fSjcioUzsx_CHydz0FUsfXdTf9s5LcAXejNragQGkWcSGfDXGed_Mr3xtJq-eHsYHymVMWjTBGrjz9ZMouKx8OzbYPW818dHcnnx_Ama2Ya2fBctxiGWgIPOqS0cTTAejwzRWG_pBzlh069ISto5Gev4ia64m7-FxRBTsV_hD9a5ha')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute bottom-0 right-0 left-0 p-xl z-20 bg-gradient-to-t from-surface-container-high to-transparent">
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant rounded-lg p-md inline-block shadow-sm">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-status-active/10 flex items-center justify-center border border-status-active/20">
                  <span className="material-symbols-outlined text-status-active filled-icon">sensors</span>
                </div>
                <div>
                  <div className="font-tech-label text-tech-label text-on-surface-variant uppercase tracking-wider" dir="ltr">SYSTEM STATUS</div>
                  <div className="font-tech-data-md text-tech-data-md text-on-surface font-bold flex items-center gap-xs" dir="ltr">
                    <span className="w-2 h-2 rounded-full bg-status-active" />
                    ALL SYSTEMS OPERATIONAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
