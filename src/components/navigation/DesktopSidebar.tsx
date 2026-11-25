import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLogistics } from '../../context/LogisticsContext';
import { AppScreen } from '../../types';
import { TLDLogo } from '../brand/TLDLogo';
import { InstallAppModal } from '../pwa/InstallAppModal';

interface DesktopSidebarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onOpenInstallModal?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  onOpenInstallModal,
}) => {
  const { currentUser, role, logout } = useAuth();
  const { unreadNotificationCount, conversations } = useLogistics();
  const { t, dir, trText } = useLanguage();
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpenModal = onOpenInstallModal || (() => setInternalModalOpen(true));

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  const baseNavItems: {
    screen: AppScreen;
    icon: string;
    label: string;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      screen: homeScreen,
      icon: 'dashboard',
      label: t.dashboard,
    },
    ...(role === 'DRIVER'
      ? [
          {
            screen: 'CARGOS' as AppScreen,
            icon: 'package_2',
            label: t.cargos,
          },
          {
            screen: 'DRIVER_VEHICLE' as AppScreen,
            icon: 'local_shipping',
            label: t.vehicle,
          },
          {
            screen: 'DRIVER_BIDS' as AppScreen,
            icon: 'price_check',
            label: t.bids,
          },
          {
            screen: 'DRIVER_ACTIVE_TRIP' as AppScreen,
            icon: 'navigation',
            label: t.activeTrip,
          },
          {
            screen: 'DRIVER_TRIP_HISTORY' as AppScreen,
            icon: 'history',
            label: t.tripHistory,
          },
          {
            screen: 'DRIVER_EARNINGS' as AppScreen,
            icon: 'payments',
            label: t.earnings,
          },
          {
            screen: 'DRIVER_RATINGS' as AppScreen,
            icon: 'hotel_class',
            label: t.ratings,
          },
          {
            screen: 'DRIVER_DISPUTES' as AppScreen,
            icon: 'gavel',
            label: t.disputes,
          },
          {
            screen: 'DRIVER_BACKHAUL' as AppScreen,
            icon: 'sync_alt',
            label: trText('بار برگشتی هوشمند', 'Smart Backhaul', 'Akıllı Dönüş Yükü'),
          },
          {
            screen: 'RMTO_WAYBILL_VERIFY' as AppScreen,
            icon: 'verified',
            label: trText('استعلام راهداری و بارنامه', 'RMTO Waybill Query', 'İrsaliye Sorgulama'),
          },
        ]
      : [
          {
            screen: 'SHIPPER_CREATE_CARGO' as AppScreen,
            icon: 'add_box',
            label: t.createCargo,
          },
          {
            screen: 'SHIPPER_ACTIVE_CARGOS' as AppScreen,
            icon: 'package_2',
            label: t.activeCargos,
          },
          {
            screen: 'SHIPPER_BIDS' as AppScreen,
            icon: 'compare_arrows',
            label: t.compareBids,
          },
          {
            screen: 'SHIPPER_CONTRACT' as AppScreen,
            icon: 'verified',
            label: t.contracts,
          },
          {
            screen: 'SHIPPER_ESCROW' as AppScreen,
            icon: 'account_balance_wallet',
            label: t.escrow,
          },
          {
            screen: 'SHIPPER_TRACKING' as AppScreen,
            icon: 'my_location',
            label: t.tracking,
          },
          {
            screen: 'SHIPPER_DELIVERY_CONFIRM' as AppScreen,
            icon: 'task_alt',
            label: `${t.confirm} ${t.cargos} (POD)`,
          },
          {
            screen: 'SHIPPER_INVOICE' as AppScreen,
            icon: 'receipt',
            label: t.invoices,
          },
          {
            screen: 'SHIPPER_PAST_CARGOS' as AppScreen,
            icon: 'history',
            label: t.tripHistory,
          },
          {
            screen: 'SHIPPER_DISPUTES' as AppScreen,
            icon: 'gavel',
            label: t.disputes,
          },
        ]),
    {
      screen: 'MESSAGES',
      icon: 'chat',
      label: t.messages,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
      badgeColor: 'bg-[#00258e] text-white',
    },
    {
      screen: 'NOTIFICATIONS',
      icon: 'notifications',
      label: t.notifications,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
      badgeColor: 'bg-[#ba1a1a] text-white',
    },
    {
      screen: 'PROFILE',
      icon: 'person',
      label: t.profile,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen w-64 ${
        dir === 'rtl' ? 'border-l' : 'border-r'
      } border-[#c4c5da] bg-[#eeedf9] py-4 gap-2 sticky top-0 shrink-0 select-none z-30`}
      dir={dir}
    >
      {/* Brand Header with Official TLD Logo */}
      <div 
        onClick={() => onNavigate(homeScreen)}
        className="px-4 pb-3 border-b border-[#c4c5da] cursor-pointer hover:opacity-90 transition-opacity flex justify-center"
      >
        <div className="w-full bg-white/80 p-2 rounded-2xl border border-[#c4c5da]/70 shadow-xs flex justify-center">
          <TLDLogo variant="compact" showPersianSlogan={false} />
        </div>
      </div>

      {/* Header User Info */}
      <div className="px-4 pb-3 flex items-center gap-3 border-b border-[#c4c5da] mb-1">
        <div className="w-11 h-11 rounded-full bg-[#00258e] flex items-center justify-center text-white font-jetbrains font-bold text-base shrink-0 shadow-sm">
          {currentUser?.profile?.fullName ? currentUser.profile.fullName.charAt(0) : 'A'}
        </div>
        <div className="min-w-0">
          <div className="font-jetbrains text-xs font-bold text-[#00258e] truncate">
            TLD {role === 'SHIPPER' ? t.shipper : t.driver}
          </div>
          <div className="text-xs text-[#444655] font-vazirmatn truncate font-bold">
            {currentUser?.profile?.fullName || (role === 'SHIPPER' ? t.shipper : t.driver)}
          </div>
          <div className="font-jetbrains text-[10px] text-[#747686] mt-0.5">
            {t.appName} PRO
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {baseNavItems.map((item) => {
          const isActive =
            currentScreen === item.screen ||
            (item.screen === 'MESSAGES' && currentScreen === 'CHAT') ||
            (item.screen === 'NOTIFICATIONS' && currentScreen === 'NOTIFICATION_DETAIL');

          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-vazirmatn text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#00258e] text-white shadow-md'
                  : 'text-[#444655] hover:bg-[#e2e1ed] hover:text-[#1a1b23]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-white' : 'text-[#00258e]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-jetbrains font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-[#00258e] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions: Install App & Logout */}
      <div className="px-4 pt-2 border-t border-[#c4c5da] mt-auto space-y-1.5">

        <div className="grid grid-cols-2 gap-1.5">
          <a
            href="tel:02188992200"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#e6f4ea] hover:bg-[#c6eccd] text-[#137333] rounded-xl text-xs font-bold transition-colors shadow-2xs text-center"
            title={trText('تماس مستقیم با پشتیبانی دیسپچینگ', 'Call 24/7 Dispatch')}
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>{trText('تماس تلفنی', 'Call')}</span>
          </a>

          <a
            href="/tldlogistics-export.zip"
            download="tldlogistics-export.zip"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#f4f2fe] hover:bg-[#dde1ff] text-[#00258e] rounded-xl text-xs font-bold transition-colors border border-[#c4c5da] text-center"
            title={trText('دانلود زیپ کامل سورس کدها', 'Download Code Zip')}
          >
            <span className="material-symbols-outlined text-[16px]">folder_zip</span>
            <span>{trText('دانلود زیپ', 'Code Zip')}</span>
          </a>
        </div>

        <button
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#eef2ff] border border-[#00258e]/20 rounded-xl text-[#00258e] hover:bg-[#dde1ff] transition-colors font-vazirmatn text-xs font-bold cursor-pointer shadow-xs active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">install_mobile</span>
          <span>{trText('نصب نسخه موبایل (APK)', 'Install Mobile App (APK)', 'Mobil Uygulamayı Yükle')}</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 border border-[#c4c5da] rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors font-jetbrains text-xs font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>{t.logOut}</span>
        </button>
      </div>

      <InstallAppModal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
      />
    </aside>
  );
};
