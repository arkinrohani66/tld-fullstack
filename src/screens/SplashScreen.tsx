import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TLDLogo } from '../components/brand/TLDLogo';
import splashFreightTerminalImg from '/tld_official_logo_1787588179060.jpg';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const { language, dir, trText } = useLanguage();
  const [imageFailed, setImageFailed] = useState(false);

  // اسپلش لجستیکی سردار: نسخه Split-editorial از طراحی Google AI Studio
  useEffect(() => {
    const timer = setTimeout(() => {
      onStart();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onStart]);

  const pillars = [
    {
      num: language === 'fa' ? '۰۱' : '01',
      title: trText('اعلام بار مستقیم', 'Direct Freight Dispatch', 'Doğrudan Yük İlanı'),
      desc: trText(
        'اتصال بی‌واسطه صاحب بار و راننده',
        'Direct driver & shipper matching',
        'Aracısız sürücü ve yük sahibi bağlantısı'
      ),
    },
    {
      num: language === 'fa' ? '۰۲' : '02',
      title: trText('تسویه امانی مطمئن', 'Protected Escrow Payout', 'Güvenli Emanet Ödeme'),
      desc: trText(
        'حفظ کرایه تا تحویل سالم محموله',
        'Funds secured until verified delivery',
        'Teslimat onayına kadar güvenceli navlun'
      ),
    },
    {
      num: language === 'fa' ? '۰۳' : '03',
      title: trText('پوشش سراسری جاده‌ها', 'Nationwide Corridor Reach', 'Ülke Çapında Koridor Ağı'),
      desc: trText(
        'رهگیری و اسناد یکپارچه در کل مسیر',
        'Unified records from loading to drop-off',
        'Yüklemeden teslimata bütünleşik takip'
      ),
    },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#fbf8ff] text-[#1a1b23] flex flex-col font-vazirmatn"
      dir={dir}
    >
      {/* Clean Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 sm:py-6 flex items-center justify-between shrink-0">
        <TLDLogo variant="horizontal" />

        <span className="text-xs sm:text-sm font-medium text-[#545f72] whitespace-nowrap">
          {trText(
            'شبکه هوشمند لجستیک ایران',
            'National Heavy Freight Network',
            'Ulusal Ağır Yük Lojistik Ağı'
          )}
        </span>
      </header>

      {/* Main Split Entrance Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Editorial Copy & Primary Action Column */}
          <section className="lg:col-span-6 order-2 lg:order-1 flex flex-col gap-5 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-[#00258e] tracking-wide">
                TLD Transport Logistics Digital
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-[#1a1b23] leading-[1.25] tracking-tight text-balance">
                {trText(
                  'هوشمندسازی لجستیک حمل‌ونقل سنگین',
                  'Intelligent Heavy Freight & Fleet Operations',
                  'Akıllı Ağır Taşımacılık ve Filo Yönetimi'
                )}
              </h1>

              <p className="text-sm sm:text-base text-[#444655] leading-relaxed max-w-xl">
                {trText(
                  'سامانه جامع اتصال صاحبان بار و ناوگان حمل‌ونقل جاده‌ای برای اعلام بار سریع، قرارداد دیجیتال و تسویه امن امانی.',
                  'Connecting cargo owners and heavy transport fleets with direct load matching, structured contracts, and protected escrow settlements.',
                  'Yük sahipleri ile ağır nakliye filolarını hızlı yük eşleştirme, dijital sözleşme ve güvenli emanet ödeme ile buluşturun.'
                )}
              </p>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStart}
                className="w-full sm:w-auto min-h-[52px] px-8 rounded-xl bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer active:scale-[0.99] whitespace-nowrap"
              >
                <span>{trText('شروع کار', 'Get Started', 'Başla')}</span>
                <span className="material-symbols-outlined text-[20px]">
                  {dir === 'rtl' ? 'arrow_back' : 'arrow_forward'}
                </span>
              </button>
            </div>

            {/* Clean 3-Column Operational Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-5 border-t border-[#e3e5f0]">
              {pillars.map((pillar) => (
                <div key={pillar.num} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00258e]">
                    <span className="font-jetbrains tabular-nums">{pillar.num}.</span>
                    <span>{pillar.title}</span>
                  </div>
                  <p className="text-xs text-[#545f72] leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Editorial Freight Terminal Visual Column */}
          <aside className="lg:col-span-6 order-1 lg:order-2 w-full">
            <div className="relative w-full aspect-[4/3] max-h-[34vh] sm:max-h-[44vh] lg:max-h-[540px] rounded-2xl lg:rounded-3xl overflow-hidden bg-[#eef0f8] border border-[#d6d8e7] shadow-sm">
              {!imageFailed ? (
                <img
                  src={splashFreightTerminalImg}
                  alt={trText(
                    'پایانه مدرن ناوگان حمل‌ونقل سنگین و کامیون‌های باربری TLD',
                    'Modern heavy freight fleet terminal with commercial semi-trailer trucks at morning light',
                    'Sabah ışığında modern ağır yük filosu ve tır terminali'
                  )}
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#eef1fb] to-[#e1e6f7]">
                  <TLDLogo variant="full" />
                </div>
              )}

              <div
                className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl lg:rounded-3xl"
                aria-hidden="true"
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
