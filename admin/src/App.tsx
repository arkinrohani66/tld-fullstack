import React, { useEffect, useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuth';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/Login';
import { OverviewPage } from './pages/Overview';
import { VerificationsPage } from './pages/Verifications';
import { CargosPage } from './pages/Cargos';
import { FinancePage } from './pages/Finance';
import { DisputesPage } from './pages/Disputes';
import { ModulesPage } from './pages/Modules';
import { SettingsPage } from './pages/Settings';
import { AuditPage } from './pages/Audit';

type Route = 'overview' | 'verifications' | 'cargos' | 'finance' | 'disputes' | 'modules' | 'settings' | 'audit';

const NAV: { key: Route; label: string; icon: string }[] = [
  { key: 'overview', label: 'نمای کلی', icon: 'dashboard' },
  { key: 'verifications', label: 'احراز هویت', icon: 'verified_user' },
  { key: 'cargos', label: 'محموله‌ها', icon: 'inventory_2' },
  { key: 'finance', label: 'مالی و اسکرو', icon: 'account_balance_wallet' },
  { key: 'disputes', label: 'داوری', icon: 'gavel' },
  { key: 'modules', label: 'ماژول‌ها', icon: 'widgets' },
  { key: 'settings', label: 'تنظیمات', icon: 'settings' },
  { key: 'audit', label: 'گزارش فعالیت', icon: 'history' },
];

const parseRoute = (): Route => {
  const raw = window.location.hash.replace(/^#\/?/, '').trim() as Route;
  return NAV.some((n) => n.key === raw) ? raw : 'overview';
};

const PAGE_TITLES: Record<Route, string> = {
  overview: 'نمای کلی پلتفرم',
  verifications: 'صف احراز هویت',
  cargos: 'مدیریت محموله‌ها',
  finance: 'مالی، اسکرو و تسویه',
  disputes: 'داوری و اختلافات',
  modules: 'ماژول‌های پلتفرم',
  settings: 'تنظیمات سامانه',
  audit: 'گزارش فعالیت‌ها',
};

const Shell: React.FC = () => {
  const { loading, isAdmin, profile, signOut } = useAdminAuth();
  const [route, setRoute] = useState<Route>(parseRoute);
  const [schemaReady, setSchemaReady] = useState<boolean | null>(null);

  useEffect(() => {
    // اگر migration پلتفرمی اجرا نشده باشد، جداول feature_modules/app_settings/audit_log
    // وجود ندارند؛ به‌جای خطای خام، یک هشدار روشن نشان می‌دهیم.
    (async () => {
      const { error } = await supabase.from('feature_modules').select('code').limit(1);
      setSchemaReady(!error);
    })();
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (key: Route) => {
    window.location.hash = `#/${key}`;
    setRoute(key);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#00175a] text-sm">
        در حال بررسی دسترسی…
      </div>
    );
  }

  if (!isAdmin) return <LoginPage />;

  return (
    <div dir="rtl" className="min-h-screen flex bg-[#f4f6fb]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#00175a] text-white flex flex-col">
        <div className="px-4 py-5 flex items-center gap-2 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <div className="text-[13px] font-extrabold leading-4">TLD Logistics</div>
            <div className="text-[10px] text-white/60">اتاق فرمان پلتفرم</div>
          </div>
        </div>

        <nav className="flex-1 py-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-bold transition-colors cursor-pointer ${
                route === item.key
                  ? 'bg-white/15 text-white border-r-2 border-[#ffb77d]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/60">
          <div className="mb-1 font-bold text-white/80">{profile?.full_name || 'مدیر سامانه'}</div>
          <div className="font-mono-num truncate" dir="ltr">{profile?.email || profile?.phone || ''}</div>
          <button
            onClick={signOut}
            className="mt-2 w-full text-[11px] font-bold bg-white/10 hover:bg-white/20 rounded-lg py-1.5 cursor-pointer"
          >
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-[#e4e7ec] flex items-center justify-between px-6">
          <h1 className="text-sm font-extrabold text-[#101828]">{PAGE_TITLES[route]}</h1>
          <div className="flex items-center gap-2 text-[10px] text-[#667085]">
            <span className="w-2 h-2 rounded-full bg-[#12b76a] animate-pulse" />
            <span>متصل به Supabase</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          {schemaReady === false && (
            <div className="mb-4 rounded-2xl border border-[#f5d9ac] bg-[#fdf3e7] p-4 text-[11px] leading-6 text-[#b54708]">
              <div className="font-extrabold mb-1">پایگاه داده هنوز کامل نشده است</div>
              جداول <span className="font-mono-num">feature_modules</span>،{' '}
              <span className="font-mono-num">app_settings</span>،{' '}
              <span className="font-mono-num">audit_log</span> و سیاست‌های دسترسی مدیر ساخته نشده‌اند.
              برای فعال‌شدن کامل این پنل، فایل{' '}
              <span className="font-mono-num">supabase/apply_now.sql</span> را در SQL Editor اجرا کنید.
            </div>
          )}

          {route === 'overview' && <OverviewPage />}
          {route === 'verifications' && <VerificationsPage />}
          {route === 'cargos' && <CargosPage />}
          {route === 'finance' && <FinancePage />}
          {route === 'disputes' && <DisputesPage />}
          {route === 'modules' && <ModulesPage />}
          {route === 'settings' && <SettingsPage />}
          {route === 'audit' && <AuditPage />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <AdminAuthProvider>
    <Shell />
  </AdminAuthProvider>
);
