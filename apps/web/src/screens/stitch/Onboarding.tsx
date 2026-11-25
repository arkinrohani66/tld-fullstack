import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS: { title: string; body: string; img: string; badge1: string; badge2: string; icon?: ReactNode }[] = [
  {
    title: 'اتصال هوشمند راننده و صاحب بار',
    body: 'با استفاده از الگوریتم‌های پیشرفته، بار مناسب با مسیر و ناوگان شما در سریع‌ترین زمان ممکن پیشنهاد داده می‌شود.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUvwec7c57tmos4oZU5mKMZ03V7GvSoUYBhm1in0KVzGA0qCBfsiOlWIvlvtwVwZfpw7ny5idrte96H0OOs8bZAB5_lPUeJFDB6NTI8_1f6QtqF3aEzujVovM4SqZc1qVYyRgfFNnV6i1BrN-QbIQ0-PSKPmkJk35IJEwva41R-swXMn_srHDZ4onDjEAgF55RCpnf9g6y3Y_vutQJhIJeaBMzsM44EcqU1npSZAPZHH5NySlXI1SH',
    badge1: 'MATCH: 98.4%',
    badge2: 'SYS: ONLINE',
  },
  {
    title: 'مدیریت کامل و یکپارچه',
    body: 'از بارگیری تا تحویل، همه چیز تحت کنترل شماست',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeFWL0quPUdOOJ1wFLlznY0mCcnvAlDvI44eqpTfFzVMwnWJaho-nJyZVhCW47iJ6UK2i0LQAGXxfW-CcV-Kj9PwSdtnALlrL9fGj98viBmYhIkxe3_NnkWqW4y0IoiBrLKFCBs06acIt1hdVrXXeovkD-cFpALryGbh1DzsKTpGr2bfL8rwXLVGj0jFSiHDB64rTOnNkwgHFDHk6UOGEPtxMTqXUZQ96VPU0pQIIaKRdn_ynffTXk',
    badge1: '',
    badge2: '',
    icon: (
      <div className="flex flex-col items-center gap-sm p-lg bg-surface/90 backdrop-blur-sm rounded-lg border border-outline-variant shadow-lg">
        <div className="flex items-center gap-md text-status-active">
          <span className="material-symbols-outlined text-4xl filled-icon">account_balance_wallet</span>
          <span className="material-symbols-outlined text-outline">arrow_forward</span>
          <span className="material-symbols-outlined text-4xl text-primary filled-icon">local_shipping</span>
        </div>
        <div className="font-tech-data-md text-tech-data-md text-on-surface-variant mt-sm tracking-wider">SYNCING TELEMETRY</div>
      </div>
    ),
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div className="bg-surface text-on-surface h-screen w-full flex flex-col font-body-md overflow-hidden" dir="rtl">
      <header className="w-full flex justify-end items-center px-margin-mobile py-lg shrink-0">
        <button
          aria-label="رد شدن از مراحل معرفی"
          className="font-button-label text-button-label text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs"
          onClick={() => navigate('/language')}
        >
          <span>رد شدن</span>
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile w-full max-w-md mx-auto z-10">
        <div className="w-full aspect-square mb-lg relative flex items-center justify-center rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant shadow-sm">
          <img className="w-full h-full object-cover" alt="" src={s.img} />
          <div className="absolute inset-0 pointer-events-none border border-outline-variant rounded-xl opacity-50 mix-blend-overlay" />
          {s.icon && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{s.icon}</div>}
          {s.badge1 && (
            <div className="absolute top-sm left-sm font-tech-label text-tech-label text-outline bg-surface px-sm py-xs rounded opacity-80">
              {s.badge1}
            </div>
          )}
          {s.badge2 && (
            <div className="absolute bottom-sm right-sm font-tech-label text-tech-label text-outline bg-surface px-sm py-xs rounded opacity-80">
              {s.badge2}
            </div>
          )}
        </div>
        <div className="text-center w-full flex flex-col gap-sm">
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{s.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[300px] mx-auto mt-sm">{s.body}</p>
        </div>
      </main>
      <footer className="w-full shrink-0 px-margin-mobile py-lg pb-xl flex items-center justify-between z-10 max-w-md mx-auto">
        <button
          aria-label="بازگشت به مرحله قبل"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant shadow-sm"
          onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <div className="flex items-center gap-sm" role="progressbar" aria-valuemax={3} aria-valuenow={step + 2}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i === step + 1 ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-surface-variant'}`}
            />
          ))}
        </div>
        <button
          aria-label={step === 0 ? 'ادامه به مرحله بعد' : 'شروع به کار و انتخاب زبان'}
          className="h-12 px-xl flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors font-button-label text-button-label gap-sm shadow-md"
          onClick={() => (step === 0 ? setStep(1) : navigate('/language'))}
        >
          <span>{step === 0 ? 'ادامه' : 'شروع به کار'}</span>
          <span className="material-symbols-outlined text-[20px]">{step === 0 ? 'arrow_back' : 'check_circle'}</span>
        </button>
      </footer>
    </div>
  );
}
