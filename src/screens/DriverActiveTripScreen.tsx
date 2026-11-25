import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, TripCheckpointItem, TripMilestoneStage, TripItem, CargoItem } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { driverTripService } from '../services/driverTripService';
import { escrowService } from '../services/escrowService';
import { pdfExportService } from '../services/pdfExportService';
import { QRScannerModal } from '../components/common/QRScannerModal';

interface DriverActiveTripScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverActiveTripScreen: React.FC<DriverActiveTripScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { trips, cargos, refreshAllData } = useLogistics();

  const [checkpoints, setCheckpoints] = useState<TripCheckpointItem[]>([]);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAP' | 'LOADING' | 'DISCHARGE' | 'WAYBILL'>('MAP');
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const tripStatusLabels = useMemo<Record<string, string>>(
    () => ({
      ACTIVE: trText('در حال حمل', 'In Transit', 'Yük Taşınıyor'),
      SCHEDULED: trText('زمان‌بندی‌شده (در انتظار بارگیری)', 'Scheduled (awaiting loading)', 'Planlandı (yükleme bekliyor)'),
      DELAYED: trText('با تأخیر', 'Delayed', 'Gecikmede'),
      COMPLETED: trText('تکمیل شده', 'Completed', 'Tamamlandı'),
    }),
    [trText]
  );

  // Real active trip of the signed-in driver
  const trip: TripItem | undefined = useMemo(() => {
    return (
      trips.find((t) => t.status === 'ACTIVE') ||
      trips.find((t) => t.status === 'SCHEDULED') ||
      trips.find((t) => t.status === 'DELAYED') ||
      trips[0]
    );
  }, [trips]);

  const relatedCargo: CargoItem | undefined = useMemo(() => {
    if (!trip) return undefined;
    return cargos.find((c) => c.id === trip.cargoId) || cargos.find((c) => c.assignedDriverId);
  }, [trip, cargos]);

  const netPayoutTomans = relatedCargo?.agreedFareTomans ?? 0;

  const handleQRScannedForDriver = (scannedCode: string) => {
    // Extract OTP if 5 or 6 digits
    const digits = scannedCode.match(/\d{5,6}/);
    const codeToUse = digits ? digits[0] : scannedCode;
    setOtpInput(codeToUse);
    setShowOtpModal(true);
    showToast('success', trText(`کد تایید تحویل (${codeToUse}) با اسکن دوربین خوانده شد.`, `Delivery code (${codeToUse}) was read by the camera scan.`, `Teslimat kodu (${codeToUse}) kamera taramasıyla okundu.`));
  };

  const loadCheckpoints = useCallback(async (tripId: string) => {
    if (!tripId) return;
    setIsLoadingCheckpoints(true);
    try {
      const data = await driverTripService.fetchCheckpoints(tripId);
      setCheckpoints(data);
    } finally {
      setIsLoadingCheckpoints(false);
    }
  }, []);

  useEffect(() => {
    if (trip?.id) loadCheckpoints(trip.id);
  }, [trip?.id, loadCheckpoints]);

  const handleCompleteStage = async (stage: TripMilestoneStage) => {
    if (!trip) return;
    try {
      await driverTripService.completeCheckpoint(trip.id, stage);
      showToast('success', trText('مرحله با موفقیت ثبت و تأیید شد.', 'Stage recorded and confirmed successfully.', 'Aşama başarıyla kaydedildi ve onaylandı.'));
      await loadCheckpoints(trip.id);
    } catch (err) {
      showToast('error', trText('ثبت مرحله ناموفق بود. اتصال خود را بررسی کنید.', 'Failed to record the stage. Check your connection.', 'Aşama kaydedilemedi. Bağlantınızı kontrol edin.'));
    }
  };

  /**
   * Discharge verification is settled against the real escrow: the delivery code
   * is validated by the server and, on success, freight is released to the driver wallet.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    if (!otpInput.trim()) {
      showToast('error', trText('لطفاً کد تحویل گیرنده را وارد نمایید.', 'Please enter the recipient delivery code.', 'Lütfen alıcının teslimat kodunu girin.'));
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await escrowService.confirmDeliveryAndSettle(trip.cargoId, otpInput.trim());
      if (result.status === 'RELEASED') {
        await driverTripService.completeCheckpoint(trip.id, 'SMART_LOCK_RELEASED', { otpCode: otpInput.trim() });
        await refreshAllData();
        await loadCheckpoints(trip.id);
        setShowOtpModal(false);
        showToast(
          'success',
          trText(`کد تحویل تأیید شد و ${result.driverCreditTomans.toLocaleString('fa-IR')} تومان کرایه به کیف پول شما واریز گردید.`, `Delivery code confirmed and ${result.driverCreditTomans.toLocaleString('fa-IR')} Toman of freight was credited to your wallet.`, `Teslimat kodu onaylandı ve ${result.driverCreditTomans.toLocaleString('fa-IR')} Tümen navlun cüzdanınıza aktarıldı.`)
        );
      } else if (result.status === 'INVALID_OTP') {
        showToast('error', trText(`کد وارد شده نامعتبر است. ${result.attemptsLeft.toLocaleString('fa-IR')} تلاش دیگر باقی مانده است.`, `The entered code is invalid. ${result.attemptsLeft.toLocaleString('fa-IR')} attempts remaining.`, `Girilen kod geçersiz. ${result.attemptsLeft.toLocaleString('fa-IR')} deneme hakkınız kaldı.`));
      } else if (result.status === 'OTP_LOCKED') {
        showToast('error', trText('به دلیل تلاش‌های ناموفق متعدد، این حساب امانی قفل شده است. با پشتیبانی تماس بگیرید.', 'This escrow account is locked due to multiple failed attempts. Please contact support.', 'Çok sayıda başarısız deneme nedeniyle bu emanet hesabı kilitlendi. Lütfen destek ile iletişime geçin.'));
      } else {
        showToast('error', trText('حساب امانی فعالی برای این محموله یافت نشد. صاحب بار باید وجه امانی را مسدود کرده باشد.', 'No active escrow account was found for this cargo. The shipper must have locked the escrow funds.', 'Bu yük için aktif emanet hesabı bulunamadı. Yük sahibinin emanet tutarını bloke etmiş olması gerekir.'));
      }
    } catch (err) {
      console.error('Discharge settlement failed:', err);
      showToast('error', trText('تأیید تحویل ناموفق بود. لطفاً دوباره تلاش کنید.', 'Delivery confirmation failed. Please try again.', 'Teslimat onayı başarısız oldu. Lütfen tekrar deneyin.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDownloadActiveWaybillPDF = async () => {
    if (!trip) return;
    try {
      setIsExportingPDF(true);
      showToast('info', trText('در حال صدور فایل PDF مانیفست و بارنامه سفر جاری...', 'Generating the manifest and waybill PDF for the current trip...', 'Mevcut seferin manifestosu ve irsaliyesi için PDF oluşturuluyor...'));
      const cargoForPdf: any = {
        id: trip.id,
        cargoNumber: trip.cargoId,
        origin: { city: trip.origin, address: trip.origin },
        destination: { city: trip.destination, address: trip.destination },
        cargoInfo: {
          title: relatedCargo?.title || trText(`محموله ${trip.cargoId}`, `Cargo ${trip.cargoId}`, `Yük ${trip.cargoId}`),
          weightTons: relatedCargo?.weightTons ?? 0,
          packaging: '—',
          declaredValueTomans: 0,
          specialInstructions: '',
        },
        fleetReq: { truckTypeName: relatedCargo?.truckType || '—' },
        pricing: { finalOfferedFareTomans: netPayoutTomans, distanceKm: trip.totalDistanceKm },
        insurance: { underwriter: '—', calculatedPremiumTomans: 0 },
        assignedDriver: {
          fullName: trText('راننده متصدی حمل', 'Assigned Driver', 'Görevli Sürücü'),
          plateNumber: '—',
        },
      };

      const waybillForPdf: any = {
        waybillNumber: trip.id,
        rmtoTrackingCode: '—',
        driverFullName: trText('راننده متصدی حمل', 'Assigned Driver', 'Görevli Sürücü'),
        truckPlateNumber: '—',
      };

      await pdfExportService.exportCargoManifestPDF(cargoForPdf, waybillForPdf);
      showToast('success', trText('فایل PDF مانیفست و بارنامه با موفقیت دانلود شد.', 'The manifest and waybill PDF was downloaded successfully.', 'Manifesto ve irsaliye PDF dosyası başarıyla indirildi.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در صدور PDF بارنامه.', 'Error generating the waybill PDF.', 'İrsaliye PDF oluşturulurken hata oluştu.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ---------- Empty state ----------
  if (!trip) {
    return (
      <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
        <AppHeader
          currentScreen="DRIVER_ACTIVE_TRIP"
          title={trText('سفر و رهگیری زنده محموله', 'Live Trip & Cargo Tracking', 'Canlı Sefer ve Yük Takibi')}
          subtitle="Active Route & Smart Checkpoints"
          showBack={true}
          onBack={() => onNavigate('DRIVER_DASHBOARD')}
          onNavigate={onNavigate}
        />
        <DesktopSidebar currentScreen="DRIVER_ACTIVE_TRIP" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#747686]">route</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('سفر فعالی وجود ندارد', 'No Active Trip', 'Aktif sefer yok')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('پس از پذیرفته‌شدن پیشنهاد شما برای یک محموله، سفر به‌صورت خودکار همین‌جا نمایش داده می‌شود.', 'Once your bid for a cargo is accepted, the trip will appear here automatically.', 'Bir yük için teklifiniz kabul edildiğinde sefer otomatik olarak burada görünecek.')}
            </p>
            <button
              onClick={() => onNavigate('CARGOS')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
            >
              {trText('مشاهده بارهای منتشر شده', 'Browse Published Cargos', 'Yayınlanan Yükleri Gör')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const loadingCheckpoints = checkpoints.filter((c) =>
    ['ARRIVED_ORIGIN', 'LOADING_STARTED', 'CARGO_SECURED', 'WAYBILL_SEALED'].includes(c.stage)
  );

  const dischargeCheckpoints = checkpoints.filter((c) =>
    ['ARRIVED_DEST', 'SMART_LOCK_RELEASED', 'UNLOADED', 'DIGITAL_POD_SIGNED'].includes(c.stage)
  );

  const totalDistance = trip.totalDistanceKm || 1;
  const progressPercent = trip.progressPercentage || Math.round((trip.distanceCoveredKm / totalDistance) * 100);

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      <AppHeader
        currentScreen="DRIVER_ACTIVE_TRIP"
        title={trText('سفر و رهگیری زنده محموله', 'Live Trip & Cargo Tracking', 'Canlı Sefer ve Yük Takibi')}
        subtitle="Active Route & Smart Checkpoints"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_ACTIVE_TRIP" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Active Route HUD Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#c4c5da] shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#e2e1ed] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#00a368] animate-ping"></span>
                <span className="font-jetbrains text-xs font-bold text-[#00258e]" dir="ltr">
                  {trip.cargoId}
                </span>
                <span className="bg-[#e6f4ea] text-[#137333] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {tripStatusLabels[trip.status] || trip.status}
                </span>
              </div>
              <h1 className="font-vazirmatn text-lg md:text-xl font-black text-[#1a1b23] mt-1">
                {relatedCargo?.title || trText(`محموله ${trip.cargoId}`, `Cargo ${trip.cargoId}`, `Yük ${trip.cargoId}`)}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('DRIVER_DISPUTES')}
                className="bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-18px">emergency</span>
                <span>{trText('ثبت SOS / حادثه', 'Report SOS / Incident', 'SOS / Olay Bildir')}</span>
              </button>

              <button
                onClick={() => onNavigate('CHAT')}
                className="bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-18px">chat</span>
                <span>{trText('پیام به پشتیبان TLD', 'Message TLD Support', 'TLD Desteğe Mesaj')}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar & Telemetry Stats */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#444655]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-16px text-[#00258e]">trip_origin</span>
                <span>{trText('مبدأ:', 'Origin:', 'Kalkış:')} {trip.origin}</span>
              </span>
              <span>{progressPercent.toLocaleString('fa-IR')}{trText('% از کل مسیر', '% of total route', '% toplam güzergâh')}</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-16px text-[#ba1a1a]">location_on</span>
                <span>{trText('مقصد:', 'Destination:', 'Varış:')} {trip.destination}</span>
              </span>
            </div>

            <div className="w-full bg-[#eeedf9] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#c4c5da]/50">
              <div
                className="bg-linear-to-l from-[#00258e] to-[#00a368] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-[#747686] pt-1">
              <span>{trText('طی شده:', 'Covered:', 'Kat edilen:')} <strong>{trip.distanceCoveredKm.toLocaleString('fa-IR')} {trText('کیلومتر', 'km', 'km')}</strong></span>
              <span>{trText('باقیمانده:', 'Remaining:', 'Kalan:')} <strong>{trip.distanceRemainingKm.toLocaleString('fa-IR')} {trText('کیلومتر', 'km', 'km')}</strong></span>
              <span>ETA: <strong className="text-[#00258e]">{trip.eta || '—'}</strong></span>
            </div>
          </div>

          {/* Live Telemetry Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] flex items-center gap-3">
              <span className="material-symbols-outlined text-24px text-[#00258e]">speed</span>
              <div>
                <div className="text-[#747686] text-[10px]">{trText('آخرین سرعت ثبت‌شده', 'Last recorded speed', 'Son kaydedilen hız')}</div>
                <div className="font-bold text-sm text-[#1a1b23] font-jetbrains" dir="ltr">
                  {trip.currentSpeedKmH} km/h
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] flex items-center gap-3">
              <span className="material-symbols-outlined text-24px text-[#00a368]">route</span>
              <div>
                <div className="text-[#747686] text-[10px]">{trText('کل مسیر', 'Total route', 'Toplam güzergâh')}</div>
                <div className="font-bold text-sm text-[#1a1b23] font-jetbrains" dir="ltr">
                  {trip.totalDistanceKm.toLocaleString('fa-IR')} km
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] flex items-center gap-3">
              <span className="material-symbols-outlined text-24px text-[#00258e]">inventory_2</span>
              <div>
                <div className="text-[#747686] text-[10px]">{trText('وزن و ناوگان', 'Weight & Fleet', 'Ağırlık ve Filo')}</div>
                <div className="font-bold text-xs text-[#1a1b23]">
                  {relatedCargo?.weight ? relatedCargo.weight : '—'} • {relatedCargo?.truckType || '—'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] flex items-center gap-3">
              <span className="material-symbols-outlined text-24px text-[#0036c5]">payments</span>
              <div>
                <div className="text-[#747686] text-[10px]">{trText('کرایه توافق‌شده', 'Agreed Fare', 'Anlaşılan Navlun')}</div>
                <div className="font-bold text-xs text-[#00258e]">
                  {netPayoutTomans > 0 ? trText(`${netPayoutTomans.toLocaleString('fa-IR')} تومان`, `${netPayoutTomans.toLocaleString('fa-IR')} Toman`, `${netPayoutTomans.toLocaleString('fa-IR')} Tümen`) : trText('در انتظار تسویه', 'Awaiting settlement', 'Ödeme bekliyor')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#c4c5da] pb-2 text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MAP'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">map</span>
            <span>{trText('نمای مسیر', 'Route View', 'Güzergâh Görünümü')}</span>
          </button>

          <button
            onClick={() => setActiveTab('LOADING')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LOADING'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">archive</span>
            <span>{trText('وضعیت بارگیری (', 'Loading Status (', 'Yükleme Durumu (')}{loadingCheckpoints.filter((c) => c.isCompleted).length}/{loadingCheckpoints.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('DISCHARGE')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DISCHARGE'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">unarchive</span>
            <span>{trText('وضعیت تخلیه و تحویل (', 'Discharge & Delivery Status (', 'Boşaltma ve Teslim Durumu (')}{dischargeCheckpoints.filter((c) => c.isCompleted).length}/{dischargeCheckpoints.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('WAYBILL')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WAYBILL'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">receipt_long</span>
            <span>{trText('مشخصات سفر و مخاطبان', 'Trip Details & Contacts', 'Sefer Bilgileri ve Kişiler')}</span>
          </button>
        </div>

        {/* Tab 1: Route Overview */}
        {activeTab === 'MAP' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] overflow-hidden shadow-sm space-y-4 p-4 md:p-6">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">navigation</span>
                <span className="font-bold text-[#1a1b23]">{trText('نمای شماتیک مسیر سفر', 'Schematic Trip Route', 'Şematik Sefer Güzergâhı')}</span>
              </div>
              <span className="text-[#747686] font-bold">
                {trip.origin} → {trip.destination}
              </span>
            </div>

            {/* Schematic Route Canvas */}
            <div className="relative w-full h-80 md:h-96 bg-[#1a2332] rounded-xl overflow-hidden border border-[#2b3548] flex items-center justify-center">
              {/* Grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a3b53_1px,transparent_1px),linear-gradient(to_bottom,#2a3b53_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

              {/* Road polyline */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400">
                <path
                  d="M 80,320 Q 250,150 420,220 T 720,80"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <path
                  d="M 80,320 Q 250,150 420,220"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>

              {/* Origin Marker */}
              <div className="absolute bottom-12 left-14 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#00258e] text-white flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="material-symbols-outlined text-18px">trip_origin</span>
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded mt-1">
                  {trip.origin} {trText('(مبدأ)', '(origin)', '(kalkış)')}
                </span>
              </div>

              {/* Truck Marker positioned by real progress */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce"
                style={{ left: `${20 + Math.min(60, progressPercent * 0.6)}%`, top: '50%' }}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00a368] text-white flex items-center justify-center border-2 border-white shadow-2xl">
                  <span className="material-symbols-outlined text-28px">local_shipping</span>
                </div>
                <div className="text-[10px] font-bold text-white bg-[#00258e] px-2.5 py-1 rounded-md shadow mt-1 whitespace-nowrap" dir="ltr">
                  {trip.currentSpeedKmH} km/h
                </div>
              </div>

              {/* Destination Marker */}
              <div className="absolute top-12 right-14 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="material-symbols-outlined text-18px">location_on</span>
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded mt-1">
                  {trip.destination} {trText('(مقصد)', '(destination)', '(varış)')}
                </span>
              </div>

              {/* Route summary floating panel */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white text-[11px] space-y-1">
                <div>{trText('پیموده‌شده:', 'Covered:', 'Kat edilen:')} {trip.distanceCoveredKm.toLocaleString('fa-IR')} {trText('از', 'of', '/')} {trip.totalDistanceKm.toLocaleString('fa-IR')} {trText('کیلومتر', 'km', 'km')}</div>
                <div>{trText('وضعیت:', 'Status:', 'Durum:')} {tripStatusLabels[trip.status] || trip.status}</div>
              </div>
            </div>
            <p className="text-[10px] text-[#747686] text-center">
              {trText('نقشه برداری زنده GPS پس از اتصال سخت‌افزار TLD-Box به این نمای متصل می‌شود؛ اکنون نمای شماتیک بر اساس داده ثبت‌شده سفر نمایش داده می‌شود.', 'Live GPS mapping will be connected once the TLD-Box hardware is linked; for now a schematic view is shown based on the recorded trip data.', 'TLD-Box donanımı bağlandığında canlı GPS haritalama bu görünüme eklenecek; şu anda kayıtlı sefer verilerine göre şematik görünüm gösteriliyor.')}
            </p>
          </div>
        )}

        {/* Tab 2: Loading Status & Checkpoints */}
        {activeTab === 'LOADING' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-5">
            <div className="border-b border-[#e2e1ed] pb-3">
              <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                {trText('مراحل بارگیری، مهار محموله و پلمپ هوشمند در مبدأ', 'Loading, Cargo Securing & Smart Seal Stages at Origin', 'Kalkışta Yükleme, Yük Sabitleme ve Akıllı Mühür Aşamaları')}
              </h3>
              <p className="text-xs text-[#545f72] mt-0.5">
                {trText('تأییدیه بارگیری توسط انباردار و راننده جهت صدور بارنامه الکترونیکی TLD', 'Loading confirmation by the warehouse keeper and driver for issuing the TLD electronic waybill', 'TLD elektronik irsaliyesinin düzenlenmesi için depo görevlisi ve sürücü tarafından yükleme onayı')}
              </p>
            </div>

            {isLoadingCheckpoints && (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-[#00258e] animate-spin">progress_activity</span>
                <p className="text-xs text-[#545f72] mt-2">{trText('در حال دریافت مراحل سفر...', 'Loading trip stages...', 'Sefer aşamaları alınıyor...')}</p>
              </div>
            )}

            <div className="space-y-4">
              {loadingCheckpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className={`p-4 rounded-xl border transition-all ${
                    cp.isCompleted
                      ? 'bg-[#f0f9f4] border-[#a8dab5]'
                      : 'bg-[#fbf8ff] border-[#c4c5da]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          cp.isCompleted
                            ? 'bg-[#00a368] text-white'
                            : 'bg-[#eeedf9] text-[#00258e]'
                        }`}
                      >
                        {cp.isCompleted ? (
                          <span className="material-symbols-outlined text-18px">check</span>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1a1b23]">{cp.title}</div>
                        <p className="text-xs text-[#545f72] mt-0.5">{cp.description}</p>
                        {cp.smartSealCode && (
                          <div className="font-jetbrains text-[11px] text-[#00258e] mt-1 font-bold">
                            {trText('کد پلمب هوشمند:', 'Smart seal code:', 'Akıllı mühür kodu:')} {cp.smartSealCode}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {cp.isCompleted ? (
                        <span className="text-[11px] font-bold text-[#00a368] bg-white px-2.5 py-1 rounded-md border border-[#a8dab5]">
                          {trText('تکمیل در', 'Completed at', 'Tamamlandı:')} {cp.completedAt}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteStage(cp.stage)}
                          className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          {trText('ثبت تکمیل مرحله', 'Mark Stage Complete', 'Aşamayı Tamamla')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Discharge Status & Digital POD */}
        {activeTab === 'DISCHARGE' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-5">
            <div className="border-b border-[#e2e1ed] pb-3">
              <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                {trText('مراحل تخلیه در مقصد، تأیید کد تحویل و تسویه', 'Destination Discharge, Delivery Code Verification & Settlement', 'Varışta Boşaltma, Teslimat Kodu Onayı ve Mutabakat')}
              </h3>
              <p className="text-xs text-[#545f72] mt-0.5">
                {trText('پس از رسیدن به مقصد، با ثبت کد تحویل گیرنده، وجه امانی به کیف پول شما آزاد و رسید POD ثبت می‌شود.', 'After arriving at the destination, entering the recipient delivery code releases the escrow funds to your wallet and records the POD receipt.', 'Varış noktasına ulaştıktan sonra alıcının teslimat kodunu girdiğinizde emanet tutarı cüzdanınıza aktarılır ve POD makbuzu kaydedilir.')}
              </p>
            </div>

            {isLoadingCheckpoints && (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-[#00258e] animate-spin">progress_activity</span>
                <p className="text-xs text-[#545f72] mt-2">{trText('در حال دریافت مراحل سفر...', 'Loading trip stages...', 'Sefer aşamaları alınıyor...')}</p>
              </div>
            )}

            <div className="space-y-4">
              {dischargeCheckpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className={`p-4 rounded-xl border transition-all ${
                    cp.isCompleted
                      ? 'bg-[#f0f9f4] border-[#a8dab5]'
                      : 'bg-[#fbf8ff] border-[#c4c5da]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          cp.isCompleted
                            ? 'bg-[#00a368] text-white'
                            : 'bg-[#eeedf9] text-[#00258e]'
                        }`}
                      >
                        {cp.isCompleted ? (
                          <span className="material-symbols-outlined text-18px">check</span>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1a1b23]">{cp.title}</div>
                        <p className="text-xs text-[#545f72] mt-0.5">{cp.description}</p>
                      </div>
                    </div>

                    <div>
                      {cp.isCompleted ? (
                        <span className="text-[11px] font-bold text-[#00a368] bg-white px-2.5 py-1 rounded-md border border-[#a8dab5]">
                          {trText('تکمیل در', 'Completed at', 'Tamamlandı:')} {cp.completedAt}
                        </span>
                      ) : cp.stage === 'SMART_LOCK_RELEASED' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsQRScannerOpen(true)}
                            className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            title={trText('اسکن QR کد تحویل با دوربین', 'Scan delivery code QR with camera', 'Teslimat kodu QR kodunu kamera ile tara')}
                          >
                            <span className="material-symbols-outlined text-16px">qr_code_scanner</span>
                            <span>{trText('اسکن QR تحویل', 'Scan Delivery QR', 'Teslimat QR Tara')}</span>
                          </button>
                          <button
                            onClick={() => setShowOtpModal(true)}
                            className="bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-[#c4c5da]"
                          >
                            <span className="material-symbols-outlined text-16px">pin</span>
                            <span>{trText('ورود کد تحویل', 'Enter Delivery Code', 'Teslimat Kodu Gir')}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompleteStage(cp.stage)}
                          className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          {trText('ثبت مرحله', 'Mark Stage', 'Aşamayı Kaydet')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Trip Details & Contacts */}
        {activeTab === 'WAYBILL' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div>
                <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                  {trText('مشخصات سفر و طرفین قرارداد', 'Trip Details & Contracting Parties', 'Sefer Bilgileri ve Sözleşme Tarafları')}
                </h3>
                <span className="font-jetbrains text-xs text-[#00258e] font-bold" dir="ltr">
                  {trip.cargoId}
                </span>
              </div>
              <button
                onClick={handleDownloadActiveWaybillPDF}
                disabled={isExportingPDF}
                className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#00258e]/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-18px">
                  {isExportingPDF ? 'sync' : 'picture_as_pdf'}
                </span>
                <span>{isExportingPDF ? trText('در حال صدور...', 'Generating...', 'Oluşturuluyor...') : trText('دریافت PDF مانیفست سفر', 'Download Trip Manifest PDF', 'Sefer Manifestosu PDF İndir')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Cargo Card */}
              <div className="p-4 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00258e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-18px">business</span>
                    <span>{trText('مشخصات محموله', 'Cargo Details', 'Yük Bilgileri')}</span>
                  </span>
                  <span className="text-[10px] text-[#747686]">{trText('مبدأ بارگیری', 'Loading Origin', 'Yükleme Noktası')}</span>
                </div>
                <div className="font-bold text-sm text-[#1a1b23]">{relatedCargo?.title || trText(`محموله ${trip.cargoId}`, `Cargo ${trip.cargoId}`, `Yük ${trip.cargoId}`)}</div>
                <div className="text-[#545f72]">{trip.origin} {trText('به', 'to', '→')} {trip.destination}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                    {trText('وزن:', 'Weight:', 'Ağırlık:')} <strong>{relatedCargo?.weight || '—'}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                    {trText('ناوگان:', 'Fleet:', 'Filo:')} <strong>{relatedCargo?.truckType || '—'}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                    {trText('کرایه:', 'Fare:', 'Navlun:')} <strong>{netPayoutTomans > 0 ? trText(`${netPayoutTomans.toLocaleString('fa-IR')} تومان`, `${netPayoutTomans.toLocaleString('fa-IR')} Toman`, `${netPayoutTomans.toLocaleString('fa-IR')} Tümen`) : trText('توافقی', 'Negotiated', 'Anlaşmalı')}</strong>
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('CHAT')}
                  className="inline-flex items-center gap-2 bg-white border border-[#c4c5da] text-[#00258e] font-bold px-3 py-1.5 rounded-lg hover:bg-[#eeedf9] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-16px">chat</span>
                  <span>{trText('گفتگو با صاحب بار', 'Chat with Shipper', 'Yük Sahibiyle Sohbet')}</span>
                </button>
              </div>

              {/* Escrow & Settlement Card */}
              <div className="p-4 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#ba1a1a] flex items-center gap-1">
                    <span className="material-symbols-outlined text-18px">account_balance_wallet</span>
                    <span>{trText('وضعیت تسویه امانی', 'Escrow Settlement Status', 'Emanet Mutabakat Durumu')}</span>
                  </span>
                  <span className="text-[10px] text-[#747686]">{trText('حساب امانی TLD', 'TLD Escrow Account', 'TLD Emanet Hesabı')}</span>
                </div>
                <div className="text-[#545f72] leading-relaxed">
                  {trText('کرایه این سفر توسط صاحب بار در حساب امانی مسدود شده است. در تب «تخلیه و تحویل»، کد ۶ رقمی گیرنده را ثبت کنید تا وجه به کیف پول شما آزاد شود.', 'The fare for this trip has been locked in escrow by the shipper. In the "Discharge & Delivery" tab, enter the 6-digit recipient code to release the funds to your wallet.', 'Bu seferin navlunu yük sahibi tarafından emanet hesabında bloke edilmiştir. Tutarın cüzdanınıza aktarılması için "Boşaltma ve Teslim" sekmesinde alıcının 6 haneli kodunu girin.')}
                </div>
                <button
                  onClick={() => setActiveTab('DISCHARGE')}
                  className="inline-flex items-center gap-2 bg-[#00a368] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#008f5a] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-16px">task_alt</span>
                  <span>{trText('رفتن به مراحل تحویل', 'Go to Delivery Stages', 'Teslim Aşamalarına Git')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Discharge OTP Verification (settles the real escrow) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#c4c5da] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">lock_open</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('تأیید کد تحویل گیرنده', 'Verify Recipient Delivery Code', 'Alıcı Teslimat Kodunu Onayla')}</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-[#747686] hover:text-[#1a1b23]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <p className="text-[#545f72] leading-relaxed">
                {trText('کد ۶ رقمی تحویل را از گیرنده دریافت و وارد کنید. با تأیید کد، وجه امانی به کیف پول شما آزاد و مرحله بازگشایی پلمپ ثبت می‌شود.', 'Get the 6-digit delivery code from the recipient and enter it. Once verified, the escrow funds are released to your wallet and the seal-opening stage is recorded.', 'Alıcıdan 6 haneli teslimat kodunu alıp girin. Kod onaylandığında emanet tutarı cüzdanınıza aktarılır ve mühür açma aşaması kaydedilir.')}
              </p>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#444655]">{trText('کد تحویل ۶ رقمی', '6-digit delivery code', '6 haneli teslimat kodu')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpModal(false);
                      setIsQRScannerOpen(true);
                    }}
                    className="text-[#00258e] hover:underline font-jetbrains text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <span>{trText('اسکن با دوربین', 'Scan with Camera', 'Kamera ile Tara')}</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="------"
                  className="w-full h-12 bg-[#fbf8ff] border-2 border-[#00258e] rounded-xl text-center text-xl font-jetbrains font-bold tracking-widest outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'Vazgeç')}
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 bg-[#00a368] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#008f5b] disabled:opacity-50"
                >
                  {isVerifyingOtp ? trText('در حال تسویه...', 'Settling...', 'Mutabakat yapılıyor...') : trText('تأیید و آزادسازی کرایه', 'Confirm & Release Fare', 'Onayla ve Navlunu Serbest Bırak')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScannedForDriver}
        title={trText('اسکن کد تحویل مقصد و رسید POD', 'Scan destination delivery code & POD receipt', 'Varış teslimat kodu ve POD makbuzunu tara')}
        subtitle={trText('دوربین را مقابل QR کد گیرنده مقصد تنظیم کنید', 'Aim the camera at the destination recipient QR code', 'Kamerayı varış alıcısının QR koduna doğrultun')}
      />
    </div>
  );
};
