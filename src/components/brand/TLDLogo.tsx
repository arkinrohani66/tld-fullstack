import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const OFFICIAL_TLD_LOGO_URL = '/tld_official_logo_1787588179060.jpg';

interface TLDLogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'mark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  theme?: 'light' | 'dark' | 'onDark';
  showPersianSlogan?: boolean;
}

export const TLDLogo: React.FC<TLDLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const { trText } = useLanguage();

  // Full Stacked Logo (Exact visual from splash screen)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="w-full max-w-[280px] overflow-hidden rounded-2xl flex items-center justify-center p-1">
          <img
            src={OFFICIAL_TLD_LOGO_URL}
            alt={trText('TLD Transport Logistics Digital - هوشمندسازی لجستیک حمل و نقل', 'TLD Transport Logistics Digital - Smart Freight Logistics', 'TLD Transport Logistics Digital - Akıllı Yük Lojistiği')}
            className="w-full h-auto object-contain filter drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  // Horizontal Layout (for Headers & Navbars)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="h-10 max-w-[140px] flex items-center justify-center overflow-hidden">
          <img
            src={OFFICIAL_TLD_LOGO_URL}
            alt="TLD Transport Logistics Digital"
            className="h-full w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  // Compact Layout (for Sidebars & Cards)
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        <div className="w-24 h-16 flex items-center justify-center overflow-hidden">
          <img
            src={OFFICIAL_TLD_LOGO_URL}
            alt="TLD Transport Logistics Digital"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  // Mark Only (Icon)
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-16 h-14',
    lg: 'w-24 h-20',
    xl: 'w-32 h-28',
    '2xl': 'w-48 h-40',
    custom: 'w-full h-full',
  }[size] || 'w-16 h-14';

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <div className={`${sizeClasses} flex items-center justify-center overflow-hidden`}>
        <img
          src={OFFICIAL_TLD_LOGO_URL}
          alt={trText('لوگوی TLD', 'TLD Logo', 'TLD Logosu')}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
