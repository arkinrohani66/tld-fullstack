import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, NotificationItem } from '../types';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface NotificationsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

type FilterTab = 'ALL' | 'UNREAD' | 'CARGO' | 'FINANCIAL' | 'SECURITY' | 'SYSTEM';

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const { role, isOffline, showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSelectedCargoId,
    setSelectedTripId,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead && !deletedIds.includes(n.id)).length;

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    showToast('success', trText('تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند.', 'All notifications marked as read.', 'Tüm bildirimler okundu olarak işaretlendi.'));
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletedIds((prev) => [...prev, id]);
    showToast('info', trText('اعلان حذف گردید.', 'Notification deleted.', 'Bildirim silindi.'));
    if (selectedNotif?.id === id) {
      setSelectedNotif(null);
    }
  };

  const handleOpenDetail = (notif: NotificationItem) => {
    markNotificationAsRead(notif.id);
    setSelectedNotif(notif);
  };

  const handleActionNavigate = (notif: NotificationItem) => {
    setSelectedNotif(null);
    if (notif.category === 'FINANCIAL' || notif.entityType === 'WALLET') {
      onNavigate('WALLET');
    } else if (notif.category === 'CARGO' || notif.entityType === 'CARGO' || notif.entityId?.includes('CRG')) {
      if (notif.entityId) setSelectedCargoId(notif.entityId);
      onNavigate('CARGOS');
    } else if (notif.category === 'TRIP' || notif.entityType === 'TRIP') {
      if (notif.entityId) setSelectedTripId(notif.entityId);
      onNavigate('TRIPS');
    } else {
      onNavigate('CARGOS');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (deletedIds.includes(item.id)) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return !item.isRead;
    if (activeTab === 'CARGO') return item.category === 'CARGO';
    if (activeTab === 'FINANCIAL') return item.category === 'FINANCIAL';
    if (activeTab === 'SECURITY') return item.category === 'SECURITY';
    if (activeTab === 'SYSTEM') return item.category === 'SYSTEM';
    return true;
  });

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn antialiased relative overflow-x-hidden"
      dir={dir}
    >
      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="NOTIFICATIONS" onNavigate={onNavigate} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-[#ba1a1a] text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-jetbrains">
            <span className="material-symbols-outlined text-sm">wifi_off</span>
            <span>SYSTEM OFFLINE. RETRYING SUPABASE SYNC...</span>
          </div>
        )}

        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-4 md:px-8 py-2 h-16 bg-[#fbf8ff] border-b border-[#c4c5da] sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(homeScreen)}
              className="text-[#00258e] hover:opacity-80 p-2 rounded-full bg-[#e8e7f3] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-[#1a1b23]">{trText('اعلان‌ها', 'Notifications', 'Bildirimler')}</h1>
              <span className="font-jetbrains text-[11px] text-[#00258e] font-mono tracking-tighter" dir="ltr">
                NOTIFICATIONS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="font-jetbrains text-[11px] text-[#f97316] uppercase font-bold" dir="ltr">
                UNREAD
              </span>
              <span className="font-jetbrains text-sm font-bold text-[#1a1b23]" dir="ltr">
                {unreadCount < 10 ? `0${unreadCount}` : unreadCount}
              </span>
            </div>
            <button
              onClick={handleMarkAll}
              title={trText('علامت‌گذاری همه به عنوان خوانده شده', 'Mark all as read', 'Tümünü okundu olarak işaretle')}
              className="text-[#00258e] hover:opacity-80 p-2 rounded-lg hover:bg-[#e8e7f3] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">done_all</span>
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="w-full overflow-x-auto no-scrollbar border-b border-[#c4c5da] bg-white sticky top-16 z-30 shadow-xs">
          <div className="flex gap-2 px-4 md:px-8 py-2.5 w-max">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('همه', 'All', 'Tümü')}
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer relative ${
                activeTab === 'UNREAD'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('خوانده‌نشده', 'Unread', 'Okunmamış')}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#f97316] rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('CARGO')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'CARGO'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('حمل', 'Cargo', 'Yük')}
            </button>
            <button
              onClick={() => setActiveTab('FINANCIAL')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'FINANCIAL'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('مالی', 'Financial', 'Finans')}
            </button>
            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'SECURITY'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('امنیت', 'Security', 'Güvenlik')}
            </button>
            <button
              onClick={() => setActiveTab('SYSTEM')}
              className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'SYSTEM'
                  ? 'bg-[#0036c5] text-white shadow-sm'
                  : 'bg-[#e8e7f3] text-[#444655] hover:bg-[#e2e1ed]'
              }`}
            >
              {trText('سیستم', 'System', 'Sistem')}
            </button>
          </div>
        </div>

        {/* Notification List */}
        <main className="flex-1 px-4 md:px-8 py-4 flex flex-col gap-6 max-w-4xl mx-auto w-full pb-32">
          {/* Section: امروز */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-jetbrains text-xs font-bold text-[#747686] uppercase" dir="ltr">
                {trText('TODAY / امروز', 'TODAY', 'BUGÜN')}
              </h2>
              <span className="font-jetbrains text-[10px] text-[#747686]">
                {isSupabaseConfigured() ? 'SUPABASE REAL-TIME' : 'CACHED DB'}
              </span>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-[#747686] mb-2">
                  notifications_paused
                </span>
                <p className="text-sm font-bold text-[#1a1b23]">{trText('اعلانی در این دسته‌بندی وجود ندارد', 'No notifications in this category', 'Bu kategoride bildirim yok')}</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isCritical = notif.severity === 'CRITICAL';
                const isSensor = notif.entityType === 'SENSOR' || isCritical;
                const isSwiped = swipedId === notif.id;

                return (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border transition-all relative overflow-hidden ${
                      isCritical
                        ? 'bg-white border-[#ffdad6] shadow-xs'
                        : notif.isRead
                        ? 'bg-white border-[#c4c5da]'
                        : 'bg-white border-[#00258e]/30 shadow-xs'
                    }`}
                  >
                    {/* Swipe Actions Background */}
                    <div className="absolute inset-0 flex justify-between z-0 pointer-events-none">
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className={`bg-[#ba1a1a] flex items-center justify-start px-4 w-1/2 text-white pointer-events-auto transition-opacity ${
                          isSwiped ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`bg-[#00258e] flex items-center justify-end px-4 w-1/2 text-white pointer-events-auto transition-opacity ${
                          isSwiped ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="material-symbols-outlined">drafts</span>
                      </button>
                    </div>

                    {/* Swipe Content */}
                    <div
                      onClick={() => handleOpenDetail(notif)}
                      className={`p-4 flex flex-col gap-3 relative z-10 cursor-pointer transition-all ${
                        isCritical
                          ? 'bg-[#ffdad6]/20 border-r-4 border-[#ba1a1a] hover:bg-[#ffdad6]/30'
                          : notif.isRead
                          ? 'bg-white hover:bg-[#f4f2fe]'
                          : 'bg-[#dde1ff]/20 border-r-4 border-[#00258e] hover:bg-[#dde1ff]/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isCritical
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : notif.category === 'CARGO'
                                ? 'bg-[#0036c5] text-white'
                                : notif.category === 'FINANCIAL'
                                ? 'bg-[#00a368]/15 text-[#00a368]'
                                : 'bg-[#e8e7f3] text-[#00258e]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              {isCritical
                                ? 'device_thermostat'
                                : notif.category === 'CARGO'
                                ? 'package_2'
                                : notif.category === 'FINANCIAL'
                                ? 'account_balance_wallet'
                                : notif.category === 'SECURITY'
                                ? 'lock'
                                : 'notifications'}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <h3 className="text-base font-bold text-[#1a1b23]">{notif.title}</h3>
                            <p className="text-xs text-[#444655] mt-0.5 line-clamp-1">{notif.message}</p>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notif.isRead && (
                          <div
                            className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                              isCritical ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#00258e]'
                            }`}
                          />
                        )}
                      </div>

                      {/* Sensor Data Component (If critical / sensor) */}
                      {isSensor && (
                        <div className="bg-white p-3 rounded-xl border border-[#ba1a1a]/30 flex justify-between items-center mt-1">
                          <div className="flex flex-col">
                            <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                              TLD BOX ID
                            </span>
                            <span className="font-jetbrains text-xs font-bold text-[#1a1b23]" dir="ltr">
                              {notif.tldBoxId || 'BX-9942A'}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                              TEMPERATURE
                            </span>
                            <span className="font-jetbrains text-base font-bold text-[#ba1a1a]" dir="ltr">
                              {notif.temperature || '+08.4 °C'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                              THRESHOLD
                            </span>
                            <span className="font-jetbrains text-xs text-[#444655]" dir="ltr">
                              {notif.threshold || '+05.0 °C'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Meta info footer */}
                      <div className="flex justify-between items-center pt-2 border-t border-[#c4c5da]/40 text-xs font-jetbrains">
                        <span className="text-[#747686]" dir="ltr">
                          {notif.id}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#747686] uppercase font-semibold">
                            {notif.category}
                          </span>
                          <span className="text-[#1a1b23]">{notif.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </main>

        {/* Detail Bottom Sheet Modal */}
        {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-[#1a1b23]/50 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedNotif(null)}
            />

            <div className="bg-white w-full max-w-lg rounded-t-3xl border-t border-[#c4c5da] shadow-2xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
              <div
                className="w-12 h-1.5 bg-[#c4c5da] rounded-full mx-auto mb-4 cursor-pointer"
                onClick={() => setSelectedNotif(null)}
              />

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedNotif.severity === 'CRITICAL'
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : selectedNotif.category === 'CARGO'
                      ? 'bg-[#0036c5] text-white'
                      : 'bg-[#e8e7f3] text-[#00258e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {selectedNotif.severity === 'CRITICAL'
                      ? 'device_thermostat'
                      : selectedNotif.category === 'CARGO'
                      ? 'package_2'
                      : 'notifications'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1a1b23]">{selectedNotif.title}</h2>
                  <span className="font-jetbrains text-xs text-[#747686]" dir="ltr">
                    {selectedNotif.id} • {selectedNotif.timestamp}
                  </span>
                </div>
              </div>

              <div className="bg-[#f4f2fe] p-4 rounded-2xl border border-[#c4c5da] text-sm text-[#444655] leading-relaxed mb-4">
                {selectedNotif.detailedDescription || selectedNotif.message}
              </div>

              {selectedNotif.temperature && (
                <div className="bg-white p-3 rounded-xl border border-[#ba1a1a]/40 mb-4 flex justify-between items-center font-jetbrains text-xs">
                  <div>
                    <span className="text-[#747686] block text-[10px]">SENSOR ID</span>
                    <span className="font-bold text-[#1a1b23]">{selectedNotif.tldBoxId || 'BX-9942A'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[#747686] block text-[10px]">READING</span>
                    <span className="font-bold text-[#ba1a1a] text-sm">{selectedNotif.temperature}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#747686] block text-[10px]">MAX LIMIT</span>
                    <span className="text-[#444655]">{selectedNotif.threshold || '+05.0 °C'}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleActionNavigate(selectedNotif)}
                  className="flex-1 bg-[#00258e] hover:bg-[#0036c5] text-white py-3.5 rounded-xl font-jetbrains text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span className="font-vazirmatn">{trText('مشاهده جزئیات عملیات', 'View Operation Details', 'İşlem Ayrıntılarını Gör')}</span>
                </button>

                <button
                  onClick={() => handleDelete(selectedNotif.id)}
                  className="px-4 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4a2] rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                  title={trText('حذف اعلان', 'Delete notification', 'Bildirimi sil')}
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="NOTIFICATIONS" onNavigate={onNavigate} />
    </div>
  );
};
