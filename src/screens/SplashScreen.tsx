import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { OFFICIAL_TLD_LOGO_URL } from '../components/brand/TLDLogo';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const { language, trText } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      onStart();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onStart]);

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] h-screen w-screen flex flex-col items-center justify-center overflow-hidden m-0 relative font-vazirmatn select-none">
      {/* Subtle Background Accent (Industrial Data Grid) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 z-0"
        style={{
          backgroundImage:
            'linear-gradient(#00258e 1px, transparent 1px), linear-gradient(90deg, #00258e 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Canvas */}
      <main className="flex-1 w-full flex flex-col items-center justify-center relative px-4 z-10">
        {/* Center Logo and Slogan */}
        <div className="flex flex-col items-center justify-center z-10 space-y-8 flex-1 animate-[fadeIn_1s_ease-out]">
          <div className="relative animate-pulse">
            <img
              alt={trText(
                'TLD Transport Logistics Digital - هوشمندسازی لجستیک حمل و نقل',
                'TLD Transport Logistics Digital - Smart Transport Logistics',
                'TLD Transport Logistics Digital - Akıllı Taşımacılık Lojistiği'
              )}
              className="w-48 h-48 md:w-64 md:h-64 object-contain filter drop-shadow-md"
              src={OFFICIAL_TLD_LOGO_URL}
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#00258e] text-center tracking-tight font-vazirmatn">
            {trText('هوشمندسازی لجستیک حمل و نقل', 'Smart Transport Logistics', 'Akıllı Taşımacılık Lojistiği')}
          </h1>
        </div>

        {/* Bottom Section: Loading & Button */}
        <div className="w-full pb-12 flex flex-col items-center space-y-6 z-10 animate-[fadeIn_1.5s_ease-out_0.5s_both]">
          <div className="flex flex-col items-center space-y-2">
            <span className="font-jetbrains text-[11px] font-semibold text-[#747686] tracking-widest uppercase">
              {trText('در حال بارگذاری سیستم...', 'Loading system...', 'Sistem yükleniyor...')}
            </span>
            <div className="relative overflow-hidden bg-[#e2e1ed] rounded-full h-1 w-[150px]">
              <div className="absolute top-0 bottom-0 bg-[#00258e] rounded-full w-1/2 loading-bar-inner animate-[indeterminate_1.5s_infinite_ease-in-out]" />
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full max-w-sm bg-[#00258e] text-white hover:bg-[#0036c5] hover:text-[#a6b4ff] transition-colors duration-200 py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-md text-base font-vazirmatn cursor-pointer active:scale-[0.98]"
          >
            <span>{trText('شروع کار', 'Get Started', 'Başla')}</span>
            <span className="material-symbols-outlined text-lg">
              {language === 'fa' ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};

