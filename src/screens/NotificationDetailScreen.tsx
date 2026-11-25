import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

interface NotificationDetailScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({
  onNavigate,
}) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const {
    selectedNotificationId,
    getNotificationById,
    setSelectedCargoId,
    setSelectedTripId,
  } = useLogistics();

  const [copiedId, setCopiedId] = useState(false);

  const notif =
    (selectedNotificationId && getNotificationById(selectedNotificationId)) || {
      id: 'NOTIF-05',
      title: trText('تاخیر در تحویل محموله', 'Cargo Delivery Delay', 'Yük Teslimatında Gecikme'),
      message: trText(
        'محموله به دلیل شرایط نامساعد جوی در مسیر کوهستانی با تاخیر مواجه شده است. زمان تخمینی رسیدن به مقصد ۲ ساعت افزایش یافته است. لطفا وضعیت را از طریق نقشه پیگیری نمایید.',
        'The shipment is delayed due to bad weather on the mountain route. The estimated arrival time has increased by 2 hours. Please track the status on the map.',
        'Yük, dağlık güzergâhtaki olumsuz hava koşulları nedeniyle gecikti. Tahmini varış süresi 2 saat arttı. Lütfen durumu harita üzerinden takip edin.'
      ),
      timestamp: '10:45',
      category: 'CARGO',
      severity: 'WARNING',
      isRead: true,
      entityId: 'CRG-8924-XYZ',
      entityType: 'CARGO',
      eta: '14:30 | 2023-10-25',
      statusText: 'IN-TRANSIT (DELAYED)',
      detailedDescription: trText(
        'محموله به دلیل شرایط نامساعد جوی در مسیر کوهستانی با تاخیر مواجه شده است. زمان تخمینی رسیدن به مقصد ۲ ساعت افزایش یافته است. لطفا وضعیت را از طریق نقشه پیگیری نمایید.',
        'The shipment is delayed due to bad weather on the mountain route. The estimated arrival time has increased by 2 hours. Please track the status on the map.',
        'Yük, dağlık güzergâhtaki olumsuz hava koşulları nedeniyle gecikti. Tahmini varış süresi 2 saat arttı. Lütfen durumu harita üzerinden takip edin.'
      ),
    };

  const handleCopyEntityId = () => {
    if (notif.entityId) {
      navigator.clipboard?.writeText(notif.entityId);
      setCopiedId(true);
      showToast('info', trText(`شناسه ${notif.entityId} کپی شد`, `ID ${notif.entityId} copied`, `${notif.entityId} kimliği kopyalandı`));
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleViewCargo = () => {
    if (notif.entityId) {
      setSelectedCargoId(notif.entityId);
    }
    onNavigate('CARGOS');
  };

  const handleViewTrip = () => {
    setSelectedTripId('TRP-9021A');
    onNavigate('TRIPS');
  };

  const isCritical = notif.severity === 'CRITICAL';
  const isWarning = notif.severity === 'WARNING';

  const indicatorColor = isCritical
    ? 'bg-[#ba1a1a]'
    : isWarning
    ? 'bg-[#f97316]'
    : 'bg-[#00258e]';

  const borderColor = isCritical
    ? 'border-[#ba1a1a]'
    : isWarning
    ? 'border-[#f97316]'
    : 'border-[#c4c5da]';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      {/* Top App Bar */}
      <AppHeader
        currentScreen="NOTIFICATION_DETAIL"
        title={trText('جزییات اعلان', 'Notification Details', 'Bildirim Ayrıntıları')}
        showBack={true}
        onBack={() => onNavigate('NOTIFICATIONS')}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="NOTIFICATIONS" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Notification Alert Card */}
        <div
          className={`bg-white rounded-2xl border ${borderColor} p-5 md:p-6 flex gap-4 items-start shadow-sm relative overflow-hidden`}
        >
          {/* Status Indicator Strip */}
          <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${indicatorColor}`} />

          <div
            className={`rounded-full p-2.5 shrink-0 mt-1 ${
              isCritical
                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                : isWarning
                ? 'bg-[#f97316]/10 text-[#f97316]'
                : 'bg-[#dde1ff] text-[#00258e]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isCritical ? 'error' : isWarning ? 'warning' : 'info'}
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex justify-between items-start w-full">
              <h2 className="font-vazirmatn text-lg md:text-xl font-bold text-[#1a1b23]">
                {notif.title}
              </h2>
              <span
                className="font-jetbrains text-xs text-[#545f72] flex items-center gap-1 shrink-0"
                dir="ltr"
              >
                {notif.timestamp}
                <span className="material-symbols-outlined text-[14px]">schedule</span>
              </span>
            </div>

            <p className="font-vazirmatn text-sm text-[#444655] leading-relaxed mt-1">
              {notif.detailedDescription || notif.message}
            </p>

            {/* Entity ID (JetBrains Mono) */}
            {notif.entityId && (
              <div className="mt-3 flex items-center gap-2 bg-[#f4f2fe] p-2.5 rounded-xl w-fit border border-[#c4c5da]">
                <span className="font-jetbrains text-xs text-[#545f72]">{trText('شناسه محموله / سفر:', 'Cargo / Trip ID:', 'Yük / Sefer Kimliği:')}</span>
                <span className="font-jetbrains text-sm font-bold text-[#00258e]" dir="ltr">
                  {notif.entityId}
                </span>
                <button
                  onClick={handleCopyEntityId}
                  aria-label={trText('کپی شناسه', 'Copy ID', 'Kimliği kopyala')}
                  className="text-[#545f72] hover:text-[#00258e] transition-colors ms-2 p-1 cursor-pointer"
                  title={trText('کپی شناسه', 'Copy ID', 'Kimliği kopyala')}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedId ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related Info Card */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm flex flex-col gap-4">
          <h3 className="font-vazirmatn text-sm font-bold text-[#1a1b23] border-b border-[#e2e1ed] pb-2">
            {trText('اطلاعات مرتبط', 'Related Information', 'İlgili Bilgiler')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Data Component */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed]">
              <span className="font-jetbrains text-xs text-[#545f72]">{trText('وضعیت فعلی', 'Current Status', 'Mevcut Durum')}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCritical ? 'bg-[#ba1a1a]' : isWarning ? 'bg-[#f97316]' : 'bg-[#00a368]'
                  }`}
                />
                <span
                  className={`font-jetbrains text-xs font-bold ${
                    isCritical ? 'text-[#ba1a1a]' : isWarning ? 'text-[#f97316]' : 'text-[#00a368]'
                  }`}
                  dir="ltr"
                >
                  {notif.statusText || 'IN-TRANSIT'}
                </span>
              </div>
            </div>

            {/* ETA Component */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed]">
              <span className="font-jetbrains text-xs text-[#545f72]">
                {trText('زمان تخمینی رسیدن (ETA)', 'Estimated Time of Arrival (ETA)', 'Tahmini Varış Zamanı (ETA)')}
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#545f72] text-[18px]">update</span>
                <span className="font-jetbrains text-xs font-bold text-[#1a1b23]" dir="ltr">
                  {notif.eta || '14:30 | 2023-10-25'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleViewCargo}
            className="flex-1 bg-[#00258e] text-white font-jetbrains text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0036c5] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">package_2</span>
            <span className="font-vazirmatn">{trText('مشاهده محموله', 'View Cargo', 'Yükü Görüntüle')}</span>
          </button>
          <button
            onClick={handleViewTrip}
            className="flex-1 bg-[#e2e1ed] text-[#1a1b23] font-jetbrains text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c4c5da] transition-colors border border-[#c4c5da] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            <span className="font-vazirmatn">{trText('مشاهده سفر', 'View Trip', 'Seferi Görüntüle')}</span>
          </button>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="NOTIFICATIONS" onNavigate={onNavigate} />
    </div>
  );
};
