import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { OFFICIAL_TLD_LOGO_URL } from '../components/brand/TLDLogo';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language, dir, t, trText } = useLanguage();

  const slides = [
    {
      title: t.onboarding1Title,
      description: t.onboarding1Desc,
      imageSrc: OFFICIAL_TLD_LOGO_URL,
      imageAlt: trText(
        'TLD Transport Logistics Digital - اپلیکیشن رسمی لجستیک',
        'TLD Transport Logistics Digital - Official Logistics App',
        'TLD Transport Logistics Digital - Resmî Lojistik Uygulaması'
      ),
      badgeTopStart: 'TLD LOGISTICS v2.4',
      badgeBottomStart: 'FLEET: ACTIVE',
      isCustomOverlay: false,
    },
    {
      title: t.onboarding2Title,
      description: t.onboarding2Desc,
      imageSrc: OFFICIAL_TLD_LOGO_URL,
      imageAlt: trText(
        'Smart Driver and Cargo Matching - سامانه هوشمند تطبیق بار',
        'Smart Driver and Cargo Matching System',
        'Akıllı Sürücü ve Yük Eşleştirme Sistemi'
      ),
      badgeTopStart: 'MATCH: 98.4%',
      badgeBottomStart: 'SYS: ONLINE',
      isCustomOverlay: false,
    },
    {
      title: t.onboarding3Title,
      description: t.onboarding3Desc,
      imageSrc: OFFICIAL_TLD_LOGO_URL,
      imageAlt: trText(
        'Integrated Telemetry and Financial Management - سامانه تله‌ماتیک و بارنامه',
        'Integrated Telemetry and Financial Management System',
        'Entegre Telemetri ve Finansal Yönetim Sistemi'
      ),
      badgeTopStart: 'FIDO2 & RMTO',
      badgeBottomStart: 'GPS TELEMETRY',
      isCustomOverlay: false,
    },
  ];

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b23] h-screen w-full flex flex-col font-vazirmatn overflow-hidden select-none"
      dir={dir}
    >
      {/* Top Action Bar */}
      <header className="w-full flex justify-end items-center px-4 py-6 shrink-0 z-20">
        <button
          aria-label={t.skip}
          onClick={onSkip}
          className="text-sm font-semibold text-[#444655] hover:text-[#00258e] transition-colors flex items-center gap-1 cursor-pointer bg-[#eeedf9] hover:bg-[#e2e1ed] px-3.5 py-1.5 rounded-full"
        >
          <span>{t.skip}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-md mx-auto z-10">
        {/* Hero Visual Area - Official Application Graphic */}
        <div className="w-full aspect-square mb-6 relative flex items-center justify-center rounded-3xl overflow-hidden bg-white border border-[#c4c5da] shadow-md p-6">
          <img
            className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
            src={slide.imageSrc}
            alt={slide.imageAlt}
            referrerPolicy="no-referrer"
          />

          {/* Overlay decorative elements */}
          <div className="absolute inset-0 pointer-events-none border border-[#c4c5da] rounded-2xl opacity-50 mix-blend-overlay" />

          {slide.badgeTopStart && (
            <div className="absolute top-3 right-3 font-jetbrains text-[11px] font-semibold text-[#747686] bg-[#fbf8ff]/90 backdrop-blur-xs px-2.5 py-1 rounded shadow-xs" dir="ltr">
              {slide.badgeTopStart}
            </div>
          )}

          {slide.badgeBottomStart && (
            <div className="absolute bottom-3 left-3 font-jetbrains text-[11px] font-semibold text-[#747686] bg-[#fbf8ff]/90 backdrop-blur-xs px-2.5 py-1 rounded shadow-xs" dir="ltr">
              {slide.badgeBottomStart}
            </div>
          )}

          {/* Central Icon Composition on Slide 3 */}
          {slide.isCustomOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
              <div className="flex flex-col items-center gap-2 p-5 bg-[#fbf8ff]/90 backdrop-blur-md rounded-2xl border border-[#c4c5da] shadow-xl">
                <div className="flex items-center gap-4 text-[#00a368]">
                  <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                  <span className="material-symbols-outlined text-[#747686] text-xl rtl:rotate-180">arrow_forward</span>
                  <span className="material-symbols-outlined text-3xl text-[#00258e]">local_shipping</span>
                </div>
                <div className="font-jetbrains text-xs font-semibold text-[#444655] mt-1 tracking-wider" dir="ltr">
                  {t.syncingTelemetry}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Typography Section */}
        <div className="text-center w-full flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00258e] tracking-tight font-vazirmatn leading-snug">
            {slide.title}
          </h1>
          <p className="text-sm md:text-base text-[#444655] max-w-[320px] mx-auto mt-1 leading-relaxed">
            {slide.description}
          </p>
        </div>
      </main>

      {/* Bottom Controls & Progress */}
      <footer className="w-full shrink-0 px-4 py-6 pb-8 flex items-center justify-between z-10 max-w-md mx-auto">
        {/* Back Button */}
        {currentSlide > 0 ? (
          <button
            aria-label={t.back}
            onClick={handleBack}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#eeedf9] text-[#1a1b23] hover:bg-[#e8e7f3] transition-colors border border-[#c4c5da] shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">
              {language === 'fa' ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}

        {/* Progress Dots */}
        <div aria-valuemax={3} aria-valuenow={currentSlide + 1} className="flex items-center gap-2" role="progressbar">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-[#00258e]' : 'w-2 bg-[#e2e1ed]'
              }`}
            />
          ))}
        </div>

        {/* Next / Start Button */}
        <button
          aria-label={currentSlide === slides.length - 1 ? t.start : t.continue}
          onClick={handleNext}
          className="h-12 px-6 flex items-center justify-center rounded-full bg-[#00258e] text-white hover:bg-[#0036c5] hover:text-[#a6b4ff] transition-colors font-vazirmatn font-semibold text-sm gap-2 shadow-md cursor-pointer active:scale-95"
        >
          <span>{currentSlide === slides.length - 1 ? t.start : t.continue}</span>
          <span className="material-symbols-outlined text-[20px]">
            {currentSlide === slides.length - 1
              ? 'check_circle'
              : language === 'fa'
              ? 'arrow_back'
              : 'arrow_forward'}
          </span>
        </button>
      </footer>
    </div>
  );
};
