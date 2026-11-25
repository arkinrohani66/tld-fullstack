import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LanguageSelection() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('fa');

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col items-center justify-center p-margin-mobile font-body-md antialiased relative" dir="rtl">
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden opacity-30"
      >
        <div
          className="absolute w-[800px] h-[800px] top-[-400px] left-1/2 -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #0036c5 0%, transparent 50%)' }}
        />
      </div>
      <main className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-xl shadow-[0px_4px_12px_rgba(0,72,255,0.08)] relative z-10">
        <header className="flex flex-col items-center gap-sm text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container mb-sm border border-primary-fixed-dim">
            <span className="material-symbols-outlined">language</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary w-full tracking-tight">زبان سامانه را انتخاب کنید</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">لطفا زبان مورد نظر خود را برای ادامه کار انتخاب نمایید.</p>
        </header>
        <form className="flex flex-col gap-sm w-full" onSubmit={(e) => e.preventDefault()}>
          {[
            { value: 'fa', label: 'فارسی', dir: 'rtl', cls: 'font-headline-md text-headline-md text-on-surface', badge: true },
            { value: 'en', label: 'English', dir: 'ltr', cls: 'font-tech-data-md text-tech-data-md', badge: false },
            { value: 'tr', label: 'Türkçe', dir: 'ltr', cls: 'font-body-md text-body-md', badge: false },
          ].map((o) => {
            const selected = lang === o.value;
            return (
              <label
                key={o.value}
                aria-label={`انتخاب زبان ${o.label}`}
                className={`relative flex items-center p-md cursor-pointer border transition-colors group ${o.dir === 'ltr' ? '' : ''} ${
                  selected ? 'border-primary bg-primary-container/10 rounded-lg' : 'border-outline-variant hover:bg-surface-container-low hover:border-outline rounded-lg'
                }`}
                dir={o.dir}
                onClick={() => setLang(o.value)}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${o.dir === 'rtl' ? 'ml-sm' : 'mr-sm'} shrink-0 ${
                    selected ? 'border-primary' : 'border-outline-variant group-hover:border-outline'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 bg-primary rounded-full transition-transform ${selected ? 'scale-100' : 'scale-0'}`} />
                </div>
                <div className="flex-1 flex justify-between items-center w-full">
                  <span className={`${o.cls} ${selected ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface transition-colors'}`}>
                    {o.label}
                  </span>
                  {o.badge && (
                    <span
                      className="font-tech-label text-tech-label text-status-active bg-status-active/10 px-2 py-1 rounded-DEFAULT border border-status-active/20"
                      dir="ltr"
                    >
                      DEFAULT
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </form>
        <div className="w-full mt-sm">
          <button
            className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-md rounded-lg hover:bg-primary/90 transition-colors border border-primary-container active:scale-[0.98]"
            onClick={() => navigate('/login')}
            type="button"
          >
            <span className="font-button-label text-button-label tracking-wide" dir="ltr">Continue / ادامه</span>
            <span className="material-symbols-outlined text-[18px]" dir="ltr">arrow_forward</span>
          </button>
        </div>
      </main>
      <div className="fixed bottom-margin-mobile text-center w-full z-0 opacity-50">
        <span className="font-tech-label text-tech-label text-on-surface-variant tracking-widest uppercase">TLD Logistics OS v1.0</span>
      </div>
    </div>
  );
}
