import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.js';

export function RoleSelection() {
  const navigate = useNavigate();
  const { user, setRole } = useAuth();
  const [selected, setSelected] = useState<'shipper' | 'driver' | null>(null);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      if (setRole) await setRole(selected);
      navigate(selected === 'driver' ? '/driver' : '/shipper', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  const roles = [
    { key: 'driver' as const, label: 'راننده', en: 'Driver', icon: 'local_shipping' },
    { key: 'shipper' as const, label: 'صاحب بار', en: 'Shipper', icon: 'inventory_2' },
  ];

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center p-margin-mobile font-body-md" dir="rtl">
      <div className="w-full max-w-md bg-surface rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,37,142,0.04)] overflow-hidden flex flex-col">
        <header className="p-lg border-b border-outline-variant bg-surface-container-lowest text-center">
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">انتخاب نقش کاربری</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {user ? `${user.fullName} عزیز، ` : ''}لطفا نقش خود را در سیستم TLD Logistics انتخاب کنید.
          </p>
        </header>
        <main className="p-lg flex flex-col gap-md flex-grow">
          {roles.map((r) => {
            const active = selected === r.key;
            return (
              <button
                aria-checked={active}
                aria-label={`انتخاب به عنوان ${r.label}`}
                className={`role-card w-full text-right p-md rounded-lg border-2 flex items-center gap-md group transition-all ${
                  active
                    ? 'border-primary bg-surface-container-low shadow-[0px_4px_12px_rgba(0,37,142,0.08)]'
                    : 'border-outline-variant bg-surface hover:bg-surface-container-low'
                }`}
                key={r.key}
                onClick={() => setSelected(r.key)}
                role="radio"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    active ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{r.icon}</span>
                </div>
                <div className="flex-grow">
                  <h2 className="font-headline-md text-headline-md text-on-surface text-lg">{r.label}</h2>
                  <span className="font-tech-label text-tech-label text-on-surface-variant uppercase tracking-wider" dir="ltr">{r.en}</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary' : 'border-outline-variant'}`}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-transparent'}`} />
                </div>
              </button>
            );
          })}
        </main>
        <footer className="p-lg bg-surface-container-lowest border-t border-outline-variant mt-auto">
          <button
            aria-label="ادامه به مرحله بعد"
            className={`w-full font-button-label text-button-label py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-sm ${
              selected
                ? 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container cursor-pointer'
                : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'
            }`}
            disabled={!selected || busy}
            id="continue-btn"
            onClick={onContinue}
          >
            <span>{busy ? 'در حال ثبت...' : 'ادامه'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </footer>
      </div>
      <div className="fixed top-4 left-4 font-tech-label text-tech-label text-outline opacity-50 ltr" dir="ltr">
        SYS_AUTH_INIT // v1.0.42
      </div>
    </div>
  );
}
