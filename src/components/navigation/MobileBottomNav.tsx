import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLogistics } from '../../context/LogisticsContext';
import { AppScreen } from '../../types';

interface MobileBottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const { role } = useAuth();
  const { conversations } = useLogistics();
  const { t, dir } = useLanguage();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  const navTabs: {
    screen: AppScreen;
    icon: string;
    label: string;
    activeCondition: boolean;
    badge?: number;
  }[] = [
    {
      screen: homeScreen,
      icon: 'home',
      label: t.home,
      activeCondition:
        currentScreen === 'DRIVER_DASHBOARD' || currentScreen === 'SHIPPER_DASHBOARD',
    },
    {
      screen: 'CARGOS',
      icon: 'package_2',
      label: t.cargos,
      activeCondition: currentScreen === 'CARGOS',
    },
    {
      screen: 'TRIPS',
      icon: 'local_shipping',
      label: t.trips,
      activeCondition: currentScreen === 'TRIPS',
    },
    {
      screen: 'MESSAGES',
      icon: 'chat',
      label: t.messages,
      activeCondition: currentScreen === 'MESSAGES' || currentScreen === 'CHAT',
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
    },
    {
      screen: 'PROFILE',
      icon: 'person',
      label: t.profile,
      activeCondition: currentScreen === 'PROFILE',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#fbf8ff] border-t border-[#c4c5da] rounded-t-2xl shadow-[0_-4px_16px_rgba(0,37,142,0.06)] font-vazirmatn"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      dir={dir}
    >
      {navTabs.map((tab) => {
        const isActive = tab.activeCondition;
        return (
          <button
            key={tab.screen}
            onClick={() => onNavigate(tab.screen)}
            className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative ${
              isActive
                ? 'bg-[#d8e3fa] text-[#00258e] rounded-2xl px-4 py-1.5 shadow-sm scale-105'
                : 'text-[#545f72] hover:bg-[#eeedf9] px-3 py-1.5 rounded-xl'
            }`}
          >
            <div className="relative">
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isActive ? 'text-[#00258e]' : 'text-[#545f72]'
                }`}
              >
                {tab.icon}
              </span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#00258e] text-white text-[9px] font-jetbrains font-bold px-1 rounded-full min-w-[14px] text-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 leading-none font-medium ${
                isActive ? 'text-[#00258e] font-bold' : 'text-[#545f72]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
