import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface RegistrationHeaderProps {
  currentStep: number;
  title: string;
  subtitle: string;
  onBack: () => void;
}

const TOTAL_STEPS = 5;

export const RegistrationHeader: React.FC<RegistrationHeaderProps> = ({ currentStep, title, subtitle, onBack }) => {
  const { trText } = useLanguage();
  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <header className="w-full bg-white border-b border-[#e2e8f0] sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={trText('بازگشت', 'Back', 'Geri')}
            className="w-10 h-10 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#00258e]">
              {trText(`مرحله ${currentStep} از ${TOTAL_STEPS}`, `Step ${currentStep} of ${TOTAL_STEPS}`, `Adım ${currentStep} / ${TOTAL_STEPS}`)}
            </p>
            <h1 className="text-base sm:text-lg font-black text-[#0f172a] truncate">{title}</h1>
            <p className="text-xs text-[#64748b] truncate">{subtitle}</p>
          </div>
          <span className="text-xs font-bold text-[#00258e] shrink-0">{progressPercent}%</span>
        </div>
        <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-[#00258e] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
