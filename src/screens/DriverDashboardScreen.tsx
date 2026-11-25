import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { BiometricAuthModal } from '../components/auth/BiometricAuthModal';
import { QRScannerModal } from '../components/common/QRScannerModal';
import { waybillService, WaybillLookupResult } from '../services/waybillService';

import { getStoredCredentials, authenticateWithBiometrics } from '../utils/webAuthn';

interface DriverDashboardScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverDashboardScreen: React.FC<DriverDashboardScreenProps> = ({
  onNavigate,
}) => {
  const { currentUser, showToast } = useAuth();
  const { dir, t, trText } = useLanguage();
  const { trips, cargos, setSelectedTripId } = useLogistics();

  // Real active trip and its cargo
  const activeTrip =
    trips.find((tr) => tr.status === 'ACTIVE') ||
    trips.find((tr) => tr.status === 'SCHEDULED') ||
    trips[0];
  const activeCargo = activeTrip ? cargos.find((c) => c.id === activeTrip.cargoId) : undefined;

  const [copiedVehicleId, setCopiedVehicleId] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [hasBiometricEnrolled, setHasBiometricEnrolled] = useState(false);
  const [quickBiometricScanning, setQuickBiometricScanning] = useState(false);
  
  // Waybill QR Scanner States
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedWaybillData, setScannedWaybillData] = useState<WaybillLookupResult | null>(null);

  const waybillStatusLabels = useMemo<Record<WaybillLookupResult['status'], string>>(
    () => ({
      ISSUED: trText('صادر شده', 'Issued', 'Düzenlendi'),
      IN_TRANSIT: trText('در حال حمل', 'In Transit', 'Yük Taşınıyor'),
      DELIVERED: trText('تحویل شده', 'Delivered', 'Teslim edildi'),
      CANCELLED: trText('لغو شده', 'Cancelled', 'İptal edildi'),
    }),
    [trText]
  );

  const vehicleId = currentUser?.profile?.plateNumber || 
    (currentUser?.profile?.driverTruck?.platePart1 
      ? `${currentUser.profile.driverTruck.platePart1} ${currentUser.profile.driverTruck.plateLetter || ''} ${currentUser.profile.driverTruck.platePart2 || ''} ایران ${currentUser.profile.driverTruck.plateIranCode || ''}`.trim()
      : trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil'));
  const driverName = currentUser?.profile?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : (currentUser?.mobile || trText('راننده گرامی', 'Respected Driver', 'Değerli Sürücü')));
  const driverMobile = currentUser?.mobile || '';

  useEffect(() => {
    const creds = getStoredCredentials(driverMobile);
    setHasBiometricEnrolled(creds.length > 0);
  }, [driverMobile, isBiometricModalOpen]);

  const handleQuickBiometricAuth = async () => {
    if (!hasBiometricEnrolled) {
      setIsBiometricModalOpen(true);
      return;
    }
    setQuickBiometricScanning(true);
    try {
      const res = await authenticateWithBiometrics(driverMobile);
      if (res.success) {
        setIsBiometricVerified(true);
        showToast('success', trText('ورود بیومتریک تایید شد (اثر انگشت معتبر)', 'Biometric verified (Valid Fingerprint)', 'Biyometrik giriş onaylandı (geçerli parmak izi)'));
      } else {
        showToast('error', res.error || trText('خطا در احراز هویت بیومتریک', 'Biometric check failed', 'Biyometrik kimlik doğrulama hatası'));
        setIsBiometricModalOpen(true);
      }
    } catch (e) {
      setIsBiometricModalOpen(true);
    } finally {
      setQuickBiometricScanning(false);
    }
  };

  const handleCopyVehicleId = () => {
    navigator.clipboard?.writeText(vehicleId);
    setCopiedVehicleId(true);
    showToast('info', trText(`شماره پلاک ${vehicleId} کپی شد`, `Vehicle plate ${vehicleId} copied`, 'Plaka ${vehicleId} kopyalandı'));
    setTimeout(() => setCopiedVehicleId(false), 2000);
  };

  const handleWaybillQRScan = async (scannedCode: string) => {
    setIsQRScannerOpen(false);
    try {
      const result = await waybillService.lookupWaybill(scannedCode);
      if (!result) {
        showToast('error', trText(`بارنامه‌ای با کد «${scannedCode}» در سامانه ثبت نشده است`, `No waybill found for code ${scannedCode}`, '«${scannedCode}» kodlu irsaliye sistemde kayıtlı değil'));
        return;
      }
      setScannedWaybillData(result);
    } catch (err) {
      console.error('Waybill lookup failed:', err);
      showToast('error', trText('استعلام بارنامه انجام نشد. لطفاً دوباره تلاش کنید.', 'Waybill lookup failed. Please try again.', 'İrsaliye sorgusu tamamlanamadı. Lütfen tekrar deneyin.'));
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      {/* Mobile Top App Bar */}
      <AppHeader currentScreen="DRIVER_DASHBOARD" onNavigate={onNavigate} />

      {/* Desktop Side Navigation */}
      <DesktopSidebar currentScreen="DRIVER_DASHBOARD" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Welcome & Verification Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 md:p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <img
              className="w-16 h-16 rounded-full object-cover border-2 border-[#00258e] shadow-sm"
              alt="Driver Avatar"
              src={
                currentUser?.profile?.profileImage ||
                `https://i.pravatar.cc/96?u=${encodeURIComponent(driverMobile || driverName)}`
              }
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-vazirmatn text-xl font-bold text-[#1a1b23]">
                  {t.hello}, {driverName}
                </h2>
                <span className="bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#a8dab5] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>{t.verifiedDriver}</span>
                </span>
              </div>
              <p className="text-xs text-[#545f72] mt-1">
                {t.diamondDriverBadge}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* QR Code Waybill Verification Scanner */}
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="bg-gradient-to-r from-[#00258e] to-[#1a44c2] hover:from-[#001c70] hover:to-[#00258e] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98"
              title={trText('اسکن سریع بارکد QR بارنامه فیزیکی با دوربین گوشی', 'Scan waybill QR code with camera', 'Fiziksel irsaliyenin QR barkodunu telefon kamerasıyla hızlıca tara')}
            >
              <span className="material-symbols-outlined text-[18px] text-[#ffb77d]">qr_code_scanner</span>
              <span>{trText('اسکن QR بارنامه', 'Scan Waybill QR', 'İrsaliye QR Tara')}</span>
            </button>

            {/* Direct Dispatch Phone Call Link */}
            <a
              href="tel:02188992200"
              className="bg-[#f4f2fe] hover:bg-[#eeedf9] text-[#00258e] text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all border border-[#00258e]/30 shadow-xs cursor-pointer"
              title={trText('تماس مستقیم با دیسپچینگ و پشتیبانی شبانه‌روزی', 'Call 24/7 Dispatch', 'Sevkiyat ve 7/24 destek ile doğrudan iletişim')}
            >
              <span className="material-symbols-outlined text-[16px] text-[#00893f]">call</span>
              <span>{trText('تماس با دیسپچ', 'Call Dispatch', 'Sevkiyatı Ara')}</span>
            </a>

            {/* Biometric WebAuthn Quick Auth Button */}
            <button
              onClick={handleQuickBiometricAuth}
              disabled={quickBiometricScanning}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                isBiometricVerified
                  ? 'bg-[#e6f4ea] text-[#137333] border-[#a8dab5]'
                  : hasBiometricEnrolled
                  ? 'bg-[#f4f2fe] hover:bg-[#eeedf9] text-[#00258e] border-[#00258e]/30'
                  : 'bg-white hover:bg-[#f4f2fe] text-[#545f72] border-[#c4c5da]'
              }`}
              title={trText('احراز هویت بیومتریک اثر انگشت و چهره با استاندارد FIDO2/WebAuthn', 'Biometric FIDO2/WebAuthn authentication', 'FIDO2/WebAuthn standardıyla parmak izi ve yüz doğrulaması')}
            >
              <span className={`material-symbols-outlined text-18px ${isBiometricVerified ? 'text-[#137333]' : 'text-[#00258e]'}`}>
                {isBiometricVerified ? 'verified_user' : 'fingerprint'}
              </span>
              <span>
                {quickBiometricScanning
                  ? trText('در حال اسکن...', 'Scanning...', 'Taranıyor...')
                  : isBiometricVerified
                  ? trText('بیومتریک تایید شد', 'Biometric Verified', 'Biyometrik onaylandı')
                  : hasBiometricEnrolled
                  ? trText('ورود با اثر انگشت', 'Touch to Unlock', 'Parmak iziyle giriş')
                  : trText('فعال‌سازی اثر انگشت', 'Setup Biometrics', 'Parmak izini etkinleştir')}
              </span>
            </button>

            <button
              onClick={() => onNavigate('CARGOS')}
              className="bg-[#00258e] hover:bg-[#0036c5] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-18px">search</span>
              <span>{t.cargoMarketplace}</span>
            </button>

            <button
              onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
              className="bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all border border-[#c4c5da] cursor-pointer"
            >
              <span className="material-symbols-outlined text-18px">navigation</span>
              <span>{t.activeTripBtn}</span>
            </button>
          </div>
        </section>

        {/* Quick Hub - Section B Drivers Flow Navigation Grid */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
              {t.driverFlowHub}
            </h3>
            <span className="text-xs text-[#545f72] hidden sm:inline">{t.driverFlowHubSub}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => onNavigate('DRIVER_VEHICLE')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">local_shipping</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.registerVehicleTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.registerVehicleSub}</div>
            </div>

            <div
              onClick={() => onNavigate('DRIVER_BIDS')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">price_check</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.myBidsTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.myBidsSub}</div>
            </div>

            <div
              onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">route</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.activeTripTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.activeTripSub}</div>
            </div>

            <div
              onClick={() => onNavigate('DRIVER_TRIP_HISTORY')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">history</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.tripHistoryTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.tripHistorySub}</div>
            </div>

            <div
              onClick={() => onNavigate('DRIVER_EARNINGS')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">payments</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.earningsTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.earningsSub}</div>
            </div>

            <div
              onClick={() => onNavigate('DRIVER_DISPUTES')}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-22px">gavel</span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">{t.disputesTitle}</div>
              <div className="text-[10px] text-[#747686]">{t.disputesSub}</div>
            </div>

            {/* WebAuthn Biometric Security Tile */}
            <div
              onClick={() => setIsBiometricModalOpen(true)}
              className="bg-white p-4 rounded-2xl border border-[#c4c5da] hover:border-[#00258e] hover:shadow-md transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-colors ${
                isBiometricVerified
                  ? 'bg-[#e6f4ea] text-[#137333]'
                  : 'bg-[#eeedf9] group-hover:bg-[#00258e] group-hover:text-white text-[#00258e]'
              }`}>
                <span className="material-symbols-outlined text-22px">
                  {isBiometricVerified ? 'verified_user' : 'fingerprint'}
                </span>
              </div>
              <div className="font-bold text-xs text-[#1a1b23]">
                {trText('امنیت بیومتریک', 'Biometric Security', 'Biyometrik Güvenlik')}
              </div>
              <div className="text-[10px] text-[#747686]">
                {isBiometricVerified
                  ? trText('تایید شده (فعال)', 'Verified & Active', 'Onaylandı (etkin)')
                  : hasBiometricEnrolled
                  ? trText('آماده ورود', 'Ready to Scan', 'Girişe hazır')
                  : trText('ثبت اثر انگشت', 'Setup Passkey', 'Parmak izi kaydet')}
              </div>
            </div>

          </div>
        </section>

        {/* Live Trip and Telemetry Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Active Voyage Visualizer (8 cols) */}
          <section
            onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
            className="md:col-span-8 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm hover:border-[#00258e] transition-all cursor-pointer group space-y-4"
          >
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00a368] animate-pulse" />
                <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23] group-hover:text-[#00258e] transition-colors">
                  {activeTrip ? t.activeVoyageLive : trText('سفر فعالی وجود ندارد', 'No Active Voyage', 'Aktif sefer yok')}
                </h3>
              </div>
              {activeTrip && (
                <span className="text-xs font-jetbrains font-bold text-[#00258e] bg-[#eeedf9] px-2.5 py-1 rounded-lg" dir="ltr">
                  {activeTrip.cargoId}
                </span>
              )}
            </div>

            {activeTrip ? (
              <>
                {/* Route Visualizer */}
                <div className="flex items-center justify-between my-4 relative px-4">
                  <div className="absolute top-1/2 right-8 left-8 h-1 bg-[#e2e1ed] -translate-y-1/2 z-0" />
                  <div
                    className={`absolute top-1/2 ${dir === 'rtl' ? 'right-8' : 'left-8'} h-1 bg-[#00258e] -translate-y-1/2 z-0`}
                    style={{ width: `${Math.min(100, activeTrip.progressPercentage)}%` }}
                  />

                  {/* Origin */}
                  <div className="flex flex-col items-center z-10 bg-white px-2">
                    <div className="w-6 h-6 rounded-full bg-[#00258e] flex items-center justify-center mb-1 text-white text-[12px]">
                      ✓
                    </div>
                    <span className="text-xs font-bold">{activeTrip.origin}</span>
                    <span className="text-[10px] text-[#545f72]">{t.loadedAtOrigin}</span>
                  </div>

                  {/* Truck current position */}
                  <div
                    className={`z-10 absolute top-1/2 -translate-y-1/2 bg-white px-1 shadow rounded-full`}
                    style={{ [dir === 'rtl' ? 'right' : 'left']: `calc(${Math.min(100, activeTrip.progressPercentage)}% + 8px)` } as React.CSSProperties}
                  >
                    <span className="material-symbols-outlined text-[#00258e] text-24px">
                      local_shipping
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col items-center z-10 bg-white px-2">
                    <div className="w-6 h-6 rounded-full border-2 border-[#c4c5da] bg-white flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[#747686] text-14px">
                        location_on
                      </span>
                    </div>
                    <span className="text-xs font-bold">{activeTrip.destination}</span>
                    <span className="text-[10px] text-[#545f72]">{t.unloadWithOtp}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 border-t border-[#e2e1ed] pt-3 text-center text-xs">
                  <div>
                    <span className="text-[#747686] text-[10px] block">{t.distanceTraveled}</span>
                    <span className="font-jetbrains font-bold">{activeTrip.distanceCoveredKm.toLocaleString('fa-IR')} {trText('کیلومتر', 'km', 'km')}</span>
                  </div>
                  <div className={dir === 'rtl' ? 'border-r border-[#e2e1ed]' : 'border-l border-[#e2e1ed]'}>
                    <span className="text-[#747686] text-[10px] block">{t.remainingToDestination}</span>
                    <span className="font-jetbrains font-bold text-[#00258e]">{activeTrip.distanceRemainingKm.toLocaleString('fa-IR')} {trText('کیلومتر', 'km', 'km')}</span>
                  </div>
                  <div className={dir === 'rtl' ? 'border-r border-[#e2e1ed]' : 'border-l border-[#e2e1ed]'}>
                    <span className="text-[#747686] text-[10px] block">{t.grossFreightFare}</span>
                    <span className="font-jetbrains font-bold text-[#00a368]">
                      {activeCargo?.agreedFareTomans
                        ? trText(`${activeCargo.agreedFareTomans.toLocaleString('fa-IR')} تومان`, `${activeCargo.agreedFareTomans.toLocaleString('fa-IR')} Toman`, `${activeCargo.agreedFareTomans.toLocaleString('fa-IR')} Tümen`)
                        : trText('توافقی', 'Negotiated', 'Anlaşmalı')}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#747686]">local_shipping</span>
                <p className="text-xs text-[#545f72] mt-2">
                  {trText('پس از پذیرفته‌شدن پیشنهاد شما برای یک محموله، سفر فعال همین‌جا نمایش داده می‌شود.', 'Once your bid for a cargo is accepted, the active trip is shown right here.', 'Bir yük için teklifiniz kabul edildikten sonra aktif sefer burada görüntülenir.')}
                </p>
                <span className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold">
                  {trText('مشاهده بارهای منتشر شده', 'Browse Published Cargos', 'Yayınlanan Yükleri Gör')}
                </span>
              </div>
            )}
          </section>

          {/* Vehicle & Telemetry Box (4 cols) */}
          <section className="md:col-span-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-2">
              <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">{t.connectedFleet}</h3>
              <button
                onClick={() => onNavigate('DRIVER_VEHICLE')}
                className="text-[#00258e] text-xs font-bold hover:underline"
              >
                {t.vehicleSettings}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#545f72]">{t.truckPlate}</span>
                <div className="flex items-center gap-1 bg-[#eeedf9] px-2 py-0.5 rounded font-jetbrains font-bold" dir="ltr">
                  <span>{vehicleId}</span>
                  <button onClick={handleCopyVehicleId} className="text-[#747686] hover:text-[#00258e]">
                    <span className="material-symbols-outlined text-14px">
                      {copiedVehicleId ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#545f72]">{t.trailerType}</span>
                <span className="font-bold">{currentUser?.profile?.fleetType || trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil')}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#545f72]">{t.iotStatus}</span>
                <span className="text-[#00a368] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-16px">wifi</span>
                  <span>{t.onlineConnected}</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#545f72]">{trText('ناوگان ثبت‌شده', 'Registered Truck', 'Kayıtlı Filo')}</span>
                <span className="font-jetbrains font-bold text-[#00258e]" dir="ltr">{currentUser?.profile?.truckModel || '—'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e2e1ed]">
              <button
                onClick={() => onNavigate('DRIVER_RATINGS')}
                className="w-full bg-[#f8f9fe] hover:bg-[#eeedf9] text-[#00258e] font-bold text-xs py-2 rounded-xl border border-[#c4c5da] flex items-center justify-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-16px text-[#fbbc04]">star</span>
                <span>{t.viewScorecard}</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav currentScreen="DRIVER_DASHBOARD" onNavigate={onNavigate} />

      {/* WebAuthn Biometric Authentication Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={() => {
          setIsBiometricVerified(true);
        }}
        driverMobile={driverMobile}
        driverName={driverName}
        userRole="DRIVER"
        purpose="WAYBILL"
      />

      {/* QR Code Camera Scanner Modal for Physical Waybills */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleWaybillQRScan}
        title={trText('اسکنر هوشمند بارکد بارنامه فیزیکی با دوربین', 'Physical Waybill QR Scanner with Camera', 'Fiziksel İrsaliye Barkodu için Akıllı Kamera Tarayıcı')}
        subtitle={trText('دوربین را مقابل بارکد دو‌بعدی بارنامه کاغذی بگیرید', 'Point camera at physical waybill QR', 'Kamerayı kağıt irsaliyenin iki boyutlu barkoduna tutun')}
      />

      {/* Scanned Waybill Verification Result Modal */}
      {scannedWaybillData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir={dir}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 shadow-2xl border border-[#c4c5da] space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4c5da] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#1a1b23]">
                    {trText('استعلام اصالت بارنامه و مانیفست فیزیکی', 'Waybill Physical Verification', 'İrsaliye Aslı ve Fiziksel Manifest Sorgusu')}
                  </h3>
                  <div className="text-[11px] text-[#00893f] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00893f] inline-block animate-ping" />
                    <span>{trText('بارنامه در سامانه ثبت و استعلام شد', 'Waybill found in registry', 'İrsaliye sistemde kayıtlı ve doğrulandı')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setScannedWaybillData(null)}
                className="w-8 h-8 rounded-full bg-[#eeedf9] text-[#545f72] hover:text-[#1a1b23] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f8f9ff] border border-[#00258e]/20 rounded-xl space-y-1.5">
                <div className="font-bold text-sm text-[#00258e]">{trText('بارنامه فیزیکی', 'Physical Waybill', 'Fiziksel İrsaliye')}</div>
                <div className="flex items-center justify-between text-[11px] text-[#545f72] font-mono">
                  <span>{trText('کد بارنامه:', 'Waybill code:', 'İrsaliye kodu:')} {scannedWaybillData.waybillCode}</span>
                  <span className="text-[#00258e] font-bold">{trText('وضعیت:', 'Status:', 'Durum:')} {waybillStatusLabels[scannedWaybillData.status]}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[#545f72] block text-[11px]">{trText('مبدأ بارگیری:', 'Loading origin:', 'Yükleme noktası:')}</span>
                  <strong className="text-[#1a1b23] text-xs">{scannedWaybillData.originCity}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[#545f72] block text-[11px]">{trText('مقصد تخلیه:', 'Discharge destination:', 'Boşaltma noktası:')}</span>
                  <strong className="text-[#1a1b23] text-xs">{scannedWaybillData.destinationCity}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[#545f72] block text-[11px]">{trText('وزن بار:', 'Cargo weight:', 'Yük ağırlığı:')}</span>
                  <strong className="text-[#1a1b23] text-xs">
                    {scannedWaybillData.weightTons !== null ? trText(`${scannedWaybillData.weightTons} تن`, `${scannedWaybillData.weightTons} tons`, `${scannedWaybillData.weightTons} ton`) : trText('ثبت نشده', 'Not recorded', 'Kaydedilmedi')}
                  </strong>
                </div>
              </div>

              {/* Shipper Contact with Direct Phone Dialing Link */}
              <div className="p-3 bg-[#eef2ff] border border-[#00258e]/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#545f72]">{trText('صاحب بار:', 'Shipper:', 'Yük sahibi:')}</div>
                  <div className="font-bold text-xs text-[#00258e]">
                    {scannedWaybillData.shipperName || trText('نامشخص', 'Unknown', 'Bilinmiyor')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#c4c5da]">
              <button
                onClick={() => {
                  setScannedWaybillData(null);
                  onNavigate('RMTO_WAYBILL_VERIFY');
                }}
                className="py-2.5 px-4 bg-[#eeedf9] text-[#00258e] rounded-xl text-xs font-bold hover:bg-[#dde1ff] transition flex items-center justify-center gap-1.5 cursor-pointer border border-[#c4c5da]"
              >
                <span className="material-symbols-outlined text-[18px]">policy</span>
                <span>{trText('استعلام در راهداری', 'RMTO Verify', 'Karayolları Sorgusu')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
