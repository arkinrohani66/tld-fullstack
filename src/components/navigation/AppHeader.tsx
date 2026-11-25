import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useLogistics } from '../../context/LogisticsContext';
import { AppScreen } from '../../types';
import { TLDLogo } from '../brand/TLDLogo';
import { InstallAppModal } from '../pwa/InstallAppModal';

interface AppHeaderProps {
  currentScreen: AppScreen;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenInstallModal?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen,
  title,
  subtitle,
  showBack = false,
  onBack,
  onNavigate,
  onOpenInstallModal,
}) => {
  const { dir, trText } = useLanguage();
  const { unreadNotificationCount } = useLogistics();
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpenModal = onOpenInstallModal || (() => setInternalModalOpen(true));

  return (
    <header className="bg-surface border-b border-surface-container-low flex justify-between items-center w-full px-4 py-2 h-16 bg-[#fbf8ff] z-40 sticky top-0 md:hidden shadow-sm">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={onBack}
            className="text-[#1a1b23] hover:opacity-80 transition-opacity p-2 rounded-lg cursor-pointer"
            aria-label={trText('بازگشت', 'Back', 'Geri')}
          >
            <span className="material-symbols-outlined rtl:rotate-180">
              arrow_back
            </span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('PROFILE')}
            className="text-[#1a1b23] hover:opacity-80 transition-opacity p-2 cursor-pointer"
            aria-label={trText('منو', 'Menu', 'Menü')}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        <div className="flex flex-col">
          {title ? (
            <h1 className="font-vazirmatn text-base font-bold text-[#00258e] leading-tight">
              {trText(title)}
            </h1>
          ) : (
            <TLDLogo variant="horizontal" showPersianSlogan={false} />
          )}
          {subtitle && (
            <span className="text-[10px] text-[#545f72] font-vazirmatn">
              {trText(subtitle)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Direct Phone Dialer Link */}
        <a
          href="tel:02188992200"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e6f4ea] text-[#137333] hover:bg-[#c6eccd] transition-all shadow-xs cursor-pointer"
          title={trText('تماس مستقیم با دیسپچینگ (021-88992200)', 'Call Dispatch Direct (021-88992200)', 'Doğrudan Sevk Merkezini Ara (021-88992200)')}
          aria-label={trText('تماس تلفنی', 'Phone call', 'Telefon araması')}
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
        </a>

        {/* 1-Click Code Zip Download */}
        <a
          href="/tldlogistics-export.zip"
          download="tldlogistics-export.zip"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f4f2fe] text-[#00258e] hover:bg-[#dde1ff] transition-all shadow-xs cursor-pointer border border-[#c4c5da]"
          title={trText('دانلود فایل زیپ کامل سورس کدها (۱.۴ مگابایت)', 'Download Complete Code Zip (1.4MB)', 'Tam Kaynak Kodu Zip Dosyasını İndir (1,4 MB)')}
          aria-label={trText('دانلود زیپ کدها', 'Download code zip', 'Kod zipini indir')}
        >
          <span className="material-symbols-outlined text-[18px]">folder_zip</span>
        </a>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1 text-[#00258e] bg-[#dde1ff]/80 hover:bg-[#dde1ff] px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          title={trText('نصب اپلیکیشن روی گوشی (APK / PWA)', 'Install App (APK / PWA)', 'Uygulamayı Telefona Yükle (APK / PWA)')}
        >
          <span className="material-symbols-outlined text-[16px]">install_mobile</span>
          <span className="text-[11px] font-vazirmatn">{trText('نصب / APK', 'Install / APK', 'Yükle / APK')}</span>
        </button>

        {currentScreen !== 'NOTIFICATIONS' && (
          <button
            onClick={() => onNavigate('NOTIFICATIONS')}
            className="text-[#444655] hover:opacity-80 transition-opacity p-2 relative cursor-pointer"
            aria-label={trText('مرکز اعلانات', 'Notifications center', 'Bildirim merkezi')}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-[#fbf8ff] animate-pulse" />
            )}
          </button>
        )}
      </div>

      <InstallAppModal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
      />
    </header>
  );
};
