import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuth';
import { Button } from '../components/ui';

export const LoginPage: React.FC = () => {
  const { signIn, error } = useAdminAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);
    try {
      await signIn(identifier, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'ورود ناموفق بود.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#00175a]">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 space-y-4"
        dir="rtl"
      >
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#00175a] text-white flex items-center justify-center">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <h1 className="text-lg font-extrabold text-[#101828]">اتاق فرمان TLD</h1>
          <p className="text-[11px] text-[#667085]">ورود مخصوص مدیران پلتفرم</p>
        </div>

        {(localError || error) && (
          <div className="rounded-xl border border-[#f7c3bd] bg-[#fee9e7] px-3 py-2 text-[11px] font-bold text-[#b42318]">
            {localError || error}
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-[#344054]">ایمیل یا شماره موبایل</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="ltr"
            autoComplete="username"
            placeholder="admin@tldlogistics.ir یا 0912…"
            className="w-full rounded-xl border border-[#d0d5dd] px-3 py-2.5 text-sm outline-none focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-[#344054]">رمز عبور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            autoComplete="current-password"
            className="w-full rounded-xl border border-[#d0d5dd] px-3 py-2.5 text-sm outline-none focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20"
            required
          />
        </label>

        <Button type="submit" disabled={busy} className="w-full py-2.5">
          {busy ? 'در حال ورود…' : 'ورود به اتاق فرمان'}
        </Button>

        <p className="text-[10px] leading-5 text-[#98a2b3] text-center">
          دسترسی فقط برای حسابی فعال است که در جدول <span className="font-mono-num">profiles</span> نقش
          <span className="font-mono-num"> ADMIN </span>
          داشته باشد. دسترسی در سمت سرور (RLS) کنترل می‌شود.
        </p>
      </form>
    </div>
  );
};
