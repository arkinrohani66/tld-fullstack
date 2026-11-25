import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService, adaptDbCargoToShipperCargo } from '../services/shipperService';
import { escrowService, EscrowStatusSnapshot } from '../services/escrowService';
import { QRScannerModal } from '../components/common/QRScannerModal';

interface ShipperDeliveryConfirmScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const otpStorageKey = (cargoId: string) => `tld_escrow_otp_${cargoId}`;

export const ShipperDeliveryConfirmScreen: React.FC<ShipperDeliveryConfirmScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { cargos: dbCargos, selectedCargoId, setSelectedCargoId, refreshAllData } = useLogistics();

  const [otpInput, setOtpInput] = useState('');
  const [receiverNameInput, setReceiverNameInput] = useState('');
  const [cargoCondition, setCargoCondition] = useState<'PERFECT' | 'MINOR_DAMAGE' | 'SEVERE_DAMAGE'>('PERFECT');
  const [shipperNote, setShipperNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [escrowSnapshot, setEscrowSnapshot] = useState<EscrowStatusSnapshot | null>(null);
  const [storedOtp, setStoredOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cargo = useMemo(() => {
    const byId = new Map<string, ReturnType<typeof adaptDbCargoToShipperCargo>>();
    dbCargos.forEach((c) => byId.set(c.id, adaptDbCargoToShipperCargo(c)));
    shipperService.getCargos().forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    const all = Array.from(byId.values());
    return (
      (selectedCargoId && all.find((c) => c.id === selectedCargoId)) ||
      all.find((c) => c.status === 'DRIVER_ASSIGNED' || c.status === 'ESCROW_FUNDED' || c.status === 'IN_TRANSIT') ||
      all[0]
    );
  }, [dbCargos, selectedCargoId]);

  const cargoId = cargo?.id ?? '';

  const loadState = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const snapshot = await escrowService.getEscrowByCargo(id);
      setEscrowSnapshot(snapshot);
      setStoredOtp(await escrowService.getDeliveryOtp(id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState(cargoId);
  }, [cargoId, loadState]);

  const isReleased = escrowSnapshot?.status === 'RELEASED_TO_DRIVER';
  const hasOpenEscrow = escrowSnapshot?.status === 'HELD_SECURE';

  const handleQRScanned = (scannedText: string) => {
    // Check if code contains 6 digit OTP or full string
    const match = scannedText.match(/\d{6}/);
    if (match) {
      setOtpInput(match[0]);
      showToast('success', trText(`کد تأیید تحویل (${match[0]}) با اسکن دوربین شناسایی شد.`, `Delivery verification code (${match[0]}) was recognized by the camera scan.`, `Teslim doğrulama kodu (${match[0]}) kamera taramasıyla algılandı.`));
    } else {
      showToast('error', trText('کد اسکن‌شده حاوی کد تحویل ۶ رقمی نیست.', 'The scanned code does not contain a 6-digit delivery code.', 'Taranan kod 6 haneli teslim kodu içermiyor.'));
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo) return;
    if (!otpInput || otpInput.length !== 6) {
      showToast('error', trText('لطفاً کد تأیید تحویل ۶ رقمی را وارد کنید', 'Please enter the 6-digit delivery verification code', 'Lütfen 6 haneli teslim doğrulama kodunu girin'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await escrowService.confirmDeliveryAndSettle(cargo.id, otpInput);
      if (result.status === 'RELEASED') {
        shipperService.releaseEscrow(cargo.id);
        shipperService.submitDeliveryPOD({
          cargoId: cargo.id,
          cargoNumber: cargo.cargoNumber,
          receiverName: receiverNameInput || cargo.destination.receiverName,
          receiverMobile: cargo.destination.receiverPhone,
          deliveredAt: new Date().toLocaleString('fa-IR'),
          unloadingAddress: cargo.destination.address,
          receiverOtpCodeEntered: otpInput,
          receiverSignatureDataUrl: '',
          goodsConditionNotes: shipperNote,
          deliveredPhotos: [],
          isAcceptedWithoutReservation: cargoCondition === 'PERFECT',
        });
        await refreshAllData();
        showToast('success', trText(`رسید تحویل ثبت شد. ${result.driverCreditTomans.toLocaleString('fa-IR')} تومان به کیف پول راننده واریز و ${result.platformCommissionTomans.toLocaleString('fa-IR')} تومان کارمزد سامانه (+ مالیات) ثبت شد.`, `The delivery receipt was registered. ${result.driverCreditTomans.toLocaleString('fa-IR')} Toman was transferred to the driver’s wallet and ${result.platformCommissionTomans.toLocaleString('fa-IR')} Toman of platform fee (+ VAT) was recorded.`, `Teslim makbuzu kaydedildi. Sürücünün cüzdanına ${result.driverCreditTomans.toLocaleString('fa-IR')} Toman aktarıldı ve ${result.platformCommissionTomans.toLocaleString('fa-IR')} Toman platform komisyonu (+ KDV) kaydedildi.`));
        onNavigate('SHIPPER_RATING');
      } else if (result.status === 'INVALID_OTP') {
        showToast('error', trText(`کد تحویل اشتباه است. ${result.attemptsLeft.toLocaleString('fa-IR')} تلاش دیگر باقی مانده است.`, `The delivery code is incorrect. ${result.attemptsLeft.toLocaleString('fa-IR')} attempts remain.`, `Teslim kodu yanlış. ${result.attemptsLeft.toLocaleString('fa-IR')} deneme hakkınız kaldı.`));
      } else if (result.status === 'OTP_LOCKED') {
        showToast('error', trText('به دلیل تلاش‌های ناموفق متعدد، این حساب امانی قفل شده است. با پشتیبانی تماس بگیرید.', 'This escrow account has been locked due to multiple failed attempts. Please contact support.', 'Çok sayıda başarısız deneme nedeniyle bu emanet hesabı kilitlendi. Lütfen destek ile iletişime geçin.'));
      } else {
        showToast('error', trText('حساب امانی فعالی برای این محموله یافت نشد. ابتدا وجه کرایه باید مسدود شده باشد.', 'No active escrow account was found for this cargo. The freight amount must be held first.', 'Bu yük için aktif emanet hesabı bulunamadı. Önce navlun tutarı bloke edilmiş olmalı.'));
      }
    } catch (err) {
      console.error('Delivery settlement failed:', err);
      showToast('error', trText('ثبت تحویل انجام نشد. لطفاً دوباره تلاش کنید.', 'Delivery confirmation failed. Please try again.', 'Teslim kaydı yapılamadı. Lütfen tekrar deneyin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Guard states ----------
  if (!cargo) {
    return (
      <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
        <AppHeader currentScreen="SHIPPER_DELIVERY_CONFIRM" onNavigate={onNavigate} />
        <DesktopSidebar currentScreen="SHIPPER_DELIVERY_CONFIRM" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#747686]">task_alt</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('محموله‌ای برای تأیید تحویل انتخاب نشده است', 'No cargo has been selected for delivery confirmation', 'Teslimi onaylamak için yük seçilmedi')}</h3>
            <button
              onClick={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
            >
              {trText('مشاهده بارهای فعال', 'View active cargos', 'Aktif yükleri görüntüle')}
            </button>
          </div>
        </main>
        <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_DELIVERY_CONFIRM" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_DELIVERY_CONFIRM" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00a368] font-bold">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{trText('تأیید نهایی تخلیه و تحویل کالا (POD)', 'Final unloading and delivery confirmation (POD)', 'Nihai boşaltma ve teslim onayı (POD)')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('رسید الکترونیک تحویل بار (Proof of Delivery)', 'Electronic proof of delivery (Proof of Delivery)', 'Elektronik teslim belgesi (Proof of Delivery)')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('ثبت کد تحویل و آزادسازی خودکار وجه امانی به کیف پول راننده', 'Register the delivery code and automatically release the escrow funds to the driver’s wallet', 'Teslim kodunu kaydedin ve emanet tutarını otomatik olarak sürücünün cüzdanına serbest bırakın')}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-10 text-center">
            <span className="material-symbols-outlined text-3xl text-[#00258e] animate-spin">progress_activity</span>
            <p className="text-xs text-[#545f72] mt-2">{trText('در حال خواندن وضعیت حساب امانی...', 'Loading escrow account status...', 'Emanet hesabı durumu okunuyor...')}</p>
          </div>
        )}

        {!isLoading && isReleased && (
          <div className="bg-[#e8f7f0] rounded-3xl border border-[#00a368]/30 p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#00a368]">task_alt</span>
            <h3 className="text-base font-black text-[#00694a]">{trText('تسویه این محموله قبلاً انجام شده است', 'This cargo has already been settled', 'Bu yükün mutabakatı zaten yapıldı')}</h3>
            <p className="text-xs text-[#545f72]">
              {trText(`کرایه ${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} تومان به کیف پول راننده واریز و کارمزد سامانه در دفتر درآمد ثبت شد.`, `The fare of ${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} Toman was transferred to the driver’s wallet and the platform fee was recorded in the revenue ledger.`, `${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} Toman navlun sürücünün cüzdanına aktarıldı ve platform komisyonu gelir defterine kaydedildi.`)}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onNavigate('SHIPPER_INVOICE')}
                className="px-4 py-2 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] cursor-pointer"
              >
                {trText('مشاهده صورتحساب', 'View invoice', 'Faturayı görüntüle')}
              </button>
              <button
                onClick={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
                className="px-4 py-2 rounded-xl border border-[#c4c5da] text-[#545f72] text-xs font-bold hover:bg-[#eeedf9] cursor-pointer"
              >
                {trText('بازگشت به بارها', 'Back to cargos', 'Yüklere dön')}
              </button>
            </div>
          </div>
        )}

        {!isLoading && !escrowSnapshot && (
          <div className="bg-[#fff9e6] rounded-3xl border border-[#ffe082] p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#b27b00]">lock_open</span>
            <h3 className="text-base font-black text-[#1a1b23]">{trText('حساب امانی فعالی برای این محموله وجود ندارد', 'There is no active escrow account for this cargo', 'Bu yük için aktif emanet hesabı yok')}</h3>
            <p className="text-xs text-[#545f72]">
              {trText('ابتدا از صفحه حساب امانی، وجه کرایه را مسدود کنید تا کد تحویل صادر شود.', 'First hold the freight amount on the escrow page so that the delivery code can be issued.', 'Teslim kodunun düzenlenebilmesi için önce emanet sayfasında navlun tutarını bloke edin.')}
            </p>
            <button
              onClick={() => onNavigate('SHIPPER_ESCROW')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#b27b00] text-white text-xs font-bold hover:bg-[#9a6800] cursor-pointer"
            >
              {trText('رفتن به حساب امانی', 'Go to the escrow account', 'Emanet hesabına git')}
            </button>
          </div>
        )}

        {!isLoading && hasOpenEscrow && (
          <form onSubmit={handleConfirmDelivery} className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6">
            {/* Cargo & Driver Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs">
              <div>
                <div className="text-[#747686] text-[10px]">{trText('محموله و مسیر:', 'Cargo and route:', 'Yük ve güzergâh:')}</div>
                <div className="font-bold text-[#1a1b23] text-sm mt-0.5">{cargo.cargoInfo.title} ({cargo.cargoNumber})</div>
                <div className="text-[#545f72] mt-0.5">{trText(`${cargo.origin.city} به ${cargo.destination.city}`, `${cargo.origin.city} to ${cargo.destination.city}`, `${cargo.origin.city} - ${cargo.destination.city}`)}</div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-r border-[#e2e1ed] pt-2 sm:pt-0 sm:pr-4">
                <div className="text-[#747686] text-[10px]">{trText('راننده متصدی حمل:', 'Carrier driver:', 'Taşıyıcı sürücü:')}</div>
                <div className="font-bold text-[#1a1b23] mt-0.5">{cargo.assignedDriver?.fullName || trText('راننده تخصیص‌یافته', 'Assigned driver', 'Atanan sürücü')}</div>
                <div className="text-[#545f72] font-jetbrains">{cargo.assignedDriver?.plateNumber}</div>
              </div>
            </div>

            {/* OTP Secret Code Section with Camera QR Scanner */}
            <div className="bg-[#eeedf9] p-5 rounded-2xl border border-[#c4c5da] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00258e]">
                  <span className="material-symbols-outlined text-[20px]">pin</span>
                  <span>{trText('کد محرمانه تأیید تحویل (Delivery OTP Code)', 'Confidential delivery verification code (Delivery OTP Code)', 'Gizli teslim doğrulama kodu (Delivery OTP Code)')}</span>
                </div>

                {/* Instant Camera QR Scanner Trigger */}
                <button
                  type="button"
                  onClick={() => setIsQRScannerOpen(true)}
                  className="bg-[#00258e] hover:bg-[#0036c5] text-white px-3.5 py-1.5 rounded-xl font-jetbrains text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                  <span>{trText('اسکن سریع QR تحویل با دوربین', 'Quick delivery QR scan with the camera', 'Kamerayla hızlı teslim QR taraması')}</span>
                </button>
              </div>

              <p className="text-xs text-[#545f72]">
                {trText('این کد ۶ رقمی در لحظه ثبت مسدودسازی حساب امانی به شما نمایش داده شد. آن را از گیرنده/راننده دریافت و اینجا ثبت کنید یا QR آن را اسکن نمایید.', 'This 6-digit code was shown to you when the escrow hold was registered. Get it from the receiver/driver and enter it here, or scan its QR code.', 'Bu 6 haneli kod, emanet blokesi kaydedildiği anda size gösterildi. Kodu alıcıdan/sürücüden alıp buraya girin veya QR kodunu tarayın.')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="max-w-xs">
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder={trText('کد ۶ رقمی تحویل', '6-digit delivery code', '6 haneli teslim kodu')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#00258e] font-jetbrains text-center font-black text-xl tracking-widest text-[#00258e] bg-white focus:outline-none shadow-xs"
                  />
                </div>

                {storedOtp && (
                  <button
                    type="button"
                    onClick={() => setOtpInput(storedOtp)}
                    className="flex items-center gap-1.5 text-xs text-[#00258e] font-bold bg-white px-3 py-2.5 rounded-xl border border-[#c4c5da] w-fit cursor-pointer hover:bg-[#eeedf9] transition-colors"
                    title={trText('درج کد تحویل ذخیره‌شده در این دستگاه', 'Insert the delivery code saved on this device', 'Bu cihazda kayıtlı teslim kodunu ekle')}
                  >
                    <span className="material-symbols-outlined text-base">history</span>
                    <span>{trText('درج کد ذخیره‌شده', 'Insert saved code', 'Kayıtlı kodu ekle')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Receiver Info & Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">
                  {trText('نام و سمت تحویل‌گیرنده در مقصد:', 'Name and title of the consignee at destination:', 'Varış noktasındaki teslim alanın adı ve unvanı:')}
                </label>
                <input
                  type="text"
                  value={receiverNameInput}
                  onChange={(e) => setReceiverNameInput(e.target.value)}
                  placeholder={cargo.destination.receiverName || trText('نام تحویل‌گیرنده', 'Receiver name', 'Teslim alan adı')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#1a1b23]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">
                  {trText('وضعیت سلامت فیزیکی محموله:', 'Physical condition of the cargo:', 'Yükün fiziksel durumu:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PERFECT', label: 'سالم و کامل ✓', labelEn: 'Intact and complete ✓', labelTr: 'Sağlam ve eksiksiz ✓', color: 'text-[#00a368]' },
                    { id: 'MINOR_DAMAGE', label: 'کسری جزئی', labelEn: 'Minor shortage', labelTr: 'Küçük eksiklik', color: 'text-[#ff9800]' },
                    { id: 'SEVERE_DAMAGE', label: 'خسارت‌دیده', labelEn: 'Damaged', labelTr: 'Hasarlı', color: 'text-[#ba1a1a]' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCargoCondition(item.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        cargoCondition === item.id
                          ? 'bg-[#00258e] text-white border-[#00258e]'
                          : 'bg-[#fbf8ff] text-[#545f72] border-[#c4c5da]'
                      }`}
                    >
                      {trText(item.label, item.labelEn, item.labelTr)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Receiver Note */}
            <div>
              <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">
                {trText('توضیحات و یادداشت تحویل:', 'Delivery notes and remarks:', 'Teslim açıklamaları ve notlar:')}
              </label>
              <textarea
                rows={3}
                value={shipperNote}
                onChange={(e) => setShipperNote(e.target.value)}
                placeholder={trText('وضعیت بار در هنگام تخلیه، ساعت تخلیه و سایر جزئیات...', 'Cargo condition at unloading, unloading time and other details...', 'Boşaltma sırasında yük durumu, boşaltma saati ve diğer ayrıntılar...')}
                className="w-full p-3 rounded-xl border border-[#c4c5da] text-xs leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#00a368] text-white font-black text-sm hover:bg-[#008f5a] shadow-lg shadow-[#00a368]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>{trText('در حال ثبت امضای الکترونیک و آزادسازی وجه...', 'Recording the electronic signature and releasing the funds...', 'Elektronik imza kaydediliyor ve tutar serbest bırakılıyor...')}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                    <span>{trText('تأیید قطعی تحویل و صدور دستور پرداخت به راننده', 'Confirm delivery and issue the payment order to the driver', 'Teslimi kesinleştir ve sürücüye ödeme talimatı ver')}</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-[#747686] text-center mt-2">
                {trText('پس از ۵ تلاش ناموفق برای کد تحویل، حساب امانی قفل و آزادسازی به واحد داوری ارجاع می‌شود.', 'After 5 failed delivery code attempts, the escrow account is locked and the release is referred to the arbitration unit.', '5 başarısız teslim kodu denemesinden sonra emanet hesabı kilitlenir ve serbest bırakma tahkim birimine iletilir.')}
              </p>
            </div>
          </form>
        )}
      </main>

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScanned}
        title={trText('اسکن کد تحویل کالا (POD QR)', 'Scan the cargo delivery code (POD QR)', 'Yük teslim kodunu tarayın (POD QR)')}
        subtitle={trText('دوربین را روی QR کد یا بارکد کد تحویل ۶ رقمی تنظیم کنید', 'Point the camera at the QR code or barcode of the 6-digit delivery code', 'Kamerayı 6 haneli teslim kodunun QR koduna veya barkoduna doğrultun')}
      />
    </div>
  );
};
