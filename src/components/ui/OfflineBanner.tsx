import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, toggleOfflineMode } = useAuth();
  const { t, trText } = useLanguage();

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="w-full bg-[#ba1a1a] text-white py-2 px-4 text-center font-vazirmatn text-xs font-semibold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-pulse"
    >
      <span className="material-symbols-outlined text-[18px]">wifi_off</span>
      <span>{t.offlineNotice}</span>
      <button
        onClick={toggleOfflineMode}
        className="bg-white text-[#ba1a1a] px-2 py-0.5 rounded text-[11px] font-jetbrains font-bold hover:bg-white/90 ms-2 cursor-pointer"
      >
        {trText('اتصال مجدد', 'RECONNECT', 'YENİDEN BAĞLAN')}
      </button>
    </div>
  );
};
