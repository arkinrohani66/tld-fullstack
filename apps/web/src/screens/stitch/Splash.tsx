import { useNavigate } from 'react-router-dom';

export function Splash() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background h-screen w-screen flex flex-col items-center justify-center overflow-hidden m-0">
      <main className="flex-1 w-full flex flex-col items-center justify-center relative px-margin-mobile">
        {/* لوگو و شعار */}
        <div className="flex flex-col items-center justify-center z-10 space-y-xl animate-fade-in flex-1">
          <div className="relative animate-pulse-op">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-8xl md:text-9xl filled-icon">local_shipping</span>
            </div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary text-center tracking-tight">
            هوشمندسازی لجستیک حمل و نقل
          </h1>
        </div>
        {/* بارگذاری و دکمه */}
        <div className="w-full pb-12 flex flex-col items-center space-y-lg z-10 animate-fade-in-slow">
          <div className="flex flex-col items-center space-y-sm">
            <span className="font-tech-label text-tech-label text-outline tracking-widest uppercase">در حال بارگذاری سیستم...</span>
            <div className="loading-bar" />
          </div>
          <button
            onClick={() => navigate('/language')}
            className="w-full max-w-sm bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors duration-200 py-md px-lg rounded-full flex items-center justify-center space-x-reverse space-x-sm shadow-md font-body-md"
          >
            <span>شروع کار</span>
            <span className="material-symbols-outlined text-md">arrow_back</span>
          </button>
        </div>
        {/* پس‌زمینهٔ شبکهٔ صنعتی */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 z-0"
          style={{
            backgroundImage:
              'linear-gradient(#00258e 1px, transparent 1px), linear-gradient(90deg, #00258e 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: 'center',
          }}
        />
      </main>
    </div>
  );
}
