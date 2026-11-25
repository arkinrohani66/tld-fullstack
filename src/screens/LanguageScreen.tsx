import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';

interface LanguageScreenProps {
  onContinue: () => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ onContinue }) => {
  const { language, setLanguage, t, trText } = useLanguage();
  const [selected, setSelected] = useState<Language>(language);

  const handleSelect = (lang: Language) => {
    setSelected(lang);
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen w-full bg-[#fbf8ff] text-[#1a1b23] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Ambient Aura */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute w-[600px] h-[600px] top-[-300px] left-1/2 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #0036c5 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-md bg-white border border-[#c4c5da] rounded-2xl p-6 md:p-8 shadow-[0px_4px_20px_rgba(0,72,255,0.08)] z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[#eeedf9] border border-[#b9c3ff] flex items-center justify-center text-[#00258e] mb-1">
            <span className="material-symbols-outlined text-3xl">language</span>
          </div>
          <h1 className="font-vazirmatn text-xl font-bold text-[#00258e]">
            {t.selectLanguage}
          </h1>
          <p className="font-vazirmatn text-sm text-[#545f72]">
            {t.selectLanguageSub}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 w-full">
          {/* Option 1: Farsi */}
          <button
            type="button"
            onClick={() => handleSelect('fa')}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              selected === 'fa'
                ? 'border-[#00258e] bg-[#f4f2fe] shadow-sm'
                : 'border-[#c4c5da] bg-white hover:bg-[#fbf8ff]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === 'fa' ? 'border-[#00258e]' : 'border-[#c4c5da]'
                }`}
              >
                {selected === 'fa' && <div className="w-2.5 h-2.5 rounded-full bg-[#00258e]" />}
              </div>
              <span className="font-vazirmatn text-base font-bold text-[#1a1b23]">{trText('فارسی', 'Persian', 'Farsça')}</span>
            </div>
            <span className="font-jetbrains text-[10px] font-bold text-[#00a368] bg-[#00a368]/10 border border-[#00a368]/30 px-2 py-0.5 rounded" dir="ltr">
              DEFAULT
            </span>
          </button>

          {/* Option 2: English */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              selected === 'en'
                ? 'border-[#00258e] bg-[#f4f2fe] shadow-sm'
                : 'border-[#c4c5da] bg-white hover:bg-[#fbf8ff]'
            }`}
            dir="ltr"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === 'en' ? 'border-[#00258e]' : 'border-[#c4c5da]'
                }`}
              >
                {selected === 'en' && <div className="w-2.5 h-2.5 rounded-full bg-[#00258e]" />}
              </div>
              <span className="font-jetbrains text-base font-bold text-[#1a1b23]">English</span>
            </div>
            <span className="font-jetbrains text-[10px] text-[#545f72] font-semibold">LTR</span>
          </button>

          {/* Option 3: Turkish */}
          <button
            type="button"
            onClick={() => handleSelect('tr')}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              selected === 'tr'
                ? 'border-[#00258e] bg-[#f4f2fe] shadow-sm'
                : 'border-[#c4c5da] bg-white hover:bg-[#fbf8ff]'
            }`}
            dir="ltr"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === 'tr' ? 'border-[#00258e]' : 'border-[#c4c5da]'
                }`}
              >
                {selected === 'tr' && <div className="w-2.5 h-2.5 rounded-full bg-[#00258e]" />}
              </div>
              <span className="font-vazirmatn text-base font-bold text-[#1a1b23]">Türkçe</span>
            </div>
            <span className="font-jetbrains text-[10px] text-[#545f72] font-semibold">LTR</span>
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-[#00258e] text-white hover:bg-[#0036c5] py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all duration-200 font-jetbrains font-bold text-sm cursor-pointer mt-2 active:scale-[0.98]"
        >
          <span>{trText('ادامه', 'Continue', 'Devam Et')}</span>
          <span className="material-symbols-outlined text-lg">
            {language === 'fa' ? 'arrow_back' : 'arrow_forward'}
          </span>
        </button>
      </div>

      {/* System Watermark */}
      <div className="fixed bottom-4 text-center w-full z-0 text-[#747686]">
        <span className="font-jetbrains text-[11px] tracking-widest uppercase font-semibold">
          TLD Logistics OS v1.0
        </span>
      </div>
    </div>
  );
};
