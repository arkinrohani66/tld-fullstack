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
import { PlatformRevenueModal } from '../components/revenue/PlatformRevenueModal';

interface ShipperEscrowScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const otpStorageKey = (cargoId: string) => `tld_escrow_otp_${cargoId}`;

export const ShipperEscrowScreen: React.FC<ShipperEscrowScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { cargos: dbCargos, selectedCargoId, refreshAllData } = useLogistics();

  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingEscrow, setIsLoadingEscrow] = useState(true);
  const [escrowSnapshot, setEscrowSnapshot] = useState<EscrowStatusSnapshot | null>(null);
  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);

  // Selected cargo: context selection, else the first assigned/open cargo
  const cargo = useMemo(() => {
    const byId = new Map<string, ReturnType<typeof adaptDbCargoToShipperCargo>>();
    dbCargos.forEach((c) => byId.set(c.id, adaptDbCargoToShipperCargo(c)));
    shipperService.getCargos().forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    const all = Array.from(byId.values());
    return (
      (selectedCargoId && all.find((c) => c.id === selectedCargoId)) ||
      all.find((c) => c.status === 'DRIVER_ASSIGNED') ||
      all.find((c) => c.status === 'PENDING_DRIVER') ||
      all[0]
    );
  }, [dbCargos, selectedCargoId]);

  const cargoId = cargo?.id ?? '';

  // Load the real escrow state from the database
  const loadEscrow = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoadingEscrow(true);
    try {
      const snapshot = await escrowService.getEscrowByCargo(id);
      setEscrowSnapshot(snapshot);
      // کد تحویل دیگر در localStorage ذخیره نمی‌شود؛ فقط صاحب‌بار از سرور می‌خواند.
      setDeliveryOtp(await escrowService.getDeliveryOtp(id));
    } finally {
      setIsLoadingEscrow(false);
    }
  }, []);

  useEffect(() => {
    loadEscrow(cargoId);
  }, [cargoId, loadEscrow]);

  const isDeposited = escrowSnapshot?.status === 'HELD_SECURE' || escrowSnapshot?.status === 'RELEASED_TO_DRIVER';
  const isReleased = escrowSnapshot?.status === 'RELEASED_TO_DRIVER';

  // Hold computation matching the server rules exactly (5% commission + 9% VAT on it)
  const planned = useMemo(() => {
    const freight = cargo?.pricing.finalOfferedFareTomans || cargo?.pricing.aiRecommendedFareTomans || 0;
    const commission = Math.round((freight * 5) / 100);
    const vat = Math.round((commission * 9) / 100);
    return { freight, commission, vat, total: freight + commission + vat };
  }, [cargo?.pricing.finalOfferedFareTomans, cargo?.pricing.aiRecommendedFareTomans]);

  const driverName = cargo?.assignedDriver?.fullName || trText('راننده تخصیص‌یافته', 'Assigned driver', 'Atanan sürücü');
  const driverUuid = cargo?.assignedDriverId || cargo?.assignedDriver?.driverId || '';

  const handleOpenDeposit = () => {
    if (!cargo) return;
    if (!driverUuid) {
      showToast('warning', trText('ابتدا از میز مناقصه یک راننده انتخاب کنید.', 'First select a driver from the bidding desk.', 'Önce teklif masasından bir sürücü seçin.'));
      onNavigate('SHIPPER_BIDS');
      return;
    }
    if (!planned.freight || planned.freight <= 0) {
      showToast('warning', trText('کرایه توافق‌شده برای این محموله ثبت نشده است.', 'No agreed fare has been recorded for this cargo.', 'Bu yük için anlaşılmış ücret kaydedilmemiş.'));
      return;
    }
    setShowPaymentGatewayModal(true);
  };

  // Registers the escrow hold on the server (ledger model; bank gateway not connected yet)
  const handleConfirmDeposit = async () => {
    if (!cargo || !driverUuid) return;
    setIsProcessing(true);
    try {
      const hold = await escrowService.createEscrowHold(cargo.id, driverUuid, planned.freight);
      shipperService.depositEscrow(cargo.id, hold.escrowId);
      await refreshAllData();
      await loadEscrow(cargo.id);
      setDeliveryOtp(hold.deliveryOtp);
      setShowPaymentGatewayModal(false);
      showToast(
        'success',
        trText(
          `مسدودسازی ${hold.totalHoldAmountTomans.toLocaleString('fa-IR')} تومانی ثبت شد. کد تحویل ۶ رقمی را به گیرنده/راننده اعلام کنید: ${hold.deliveryOtp}`,
          `A hold of ${hold.totalHoldAmountTomans.toLocaleString('fa-IR')} Toman was registered. Share the 6-digit delivery code with the receiver/driver: ${hold.deliveryOtp}`,
          `${hold.totalHoldAmountTomans.toLocaleString('fa-IR')} Tomanlık bloke kaydı oluşturuldu. 6 haneli teslim kodunu alıcıya/sürücüye bildirin: ${hold.deliveryOtp}`
        )
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const message =
        code === 'ESCROW_ALREADY_OPEN'
          ? trText('برای این محموله قبلاً حساب امانی باز شده است.', 'An escrow account has already been opened for this cargo.', 'Bu yük için emanet hesabı zaten açılmış.')
          : code === 'INVALID_CARGO'
          ? trText('تخصیص راننده یا مالکیت محموله تأیید نشد. ابتدا پیشنهاد راننده را از میز مناقصه بپذیرید.', 'The driver assignment or cargo ownership could not be verified. First accept a driver bid on the bidding desk.', 'Sürücü ataması veya yük sahipliği doğrulanamadı. Önce teklif masasında bir sürücü teklifini kabul edin.')
          : code === 'INVALID_AMOUNT'
          ? trText('مبلغ با کرایه توافق‌شده در سامانه مطابقت ندارد.', 'The amount does not match the agreed fare in the system.', 'Tutar, sistemdeki anlaşılmış ücretle eşleşmiyor.')
          : code === 'INVALID_DRIVER'
          ? trText('راننده تخصیص‌یافته معتبر نیست.', 'The assigned driver is not valid.', 'Atanan sürücü geçerli değil.')
          : trText('ثبت حساب امانی انجام نشد. لطفاً دوباره تلاش کنید.', 'The escrow account could not be registered. Please try again.', 'Emanet hesabı kaydedilemedi. Lütfen tekrar deneyin.');
      showToast('error', message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------- Empty / guard states ----------
  if (!cargo) {
    return (
      <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
        <AppHeader currentScreen="SHIPPER_ESCROW" onNavigate={onNavigate} />
        <DesktopSidebar currentScreen="SHIPPER_ESCROW" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#747686]">account_balance_wallet</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('محموله‌ای برای حساب امانی انتخاب نشده است', 'No cargo has been selected for the escrow account', 'Emanet hesabı için yük seçilmedi')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('از فهرست بارهای فعال یک محموله را انتخاب کنید یا محموله جدیدی ثبت نمایید.', 'Select a cargo from the active list or register a new one.', 'Aktif yük listesinden bir yük seçin veya yeni bir yük kaydedin.')}
            </p>
            <button
              onClick={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
            >
              {trText('مشاهده بارهای فعال', 'View active cargos', 'Aktif yükleri görüntüle')}
            </button>
          </div>
        </main>
        <MobileBottomNav currentScreen="WALLET" onNavigate={onNavigate} />
      </div>
    );
  }

  const displayedTotal = isDeposited ? escrowSnapshot?.totalHoldAmountTomans ?? 0 : planned.total;
  const displayedFreight = isDeposited ? escrowSnapshot?.freightAmountTomans ?? planned.freight : planned.freight;
  const displayedCommission = isDeposited ? escrowSnapshot?.commissionAmountTomans ?? planned.commission : planned.commission;
  const displayedVat = isDeposited ? escrowSnapshot?.vatAmountTomans ?? planned.vat : planned.vat;

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_ESCROW" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_ESCROW" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00a368] font-bold">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>{trText('سیستم پرداخت امن امانی (Escrow Service)', 'Secure escrow payment system (Escrow Service)', 'Güvenli emanet ödeme sistemi (Escrow Service)')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('حساب امانی و پرداخت امن بار', 'Escrow account and secure cargo payment', 'Emanet hesabı ve güvenli yük ödemesi')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('محافظت از وجه صاحب کالا و کسر خودکار ۵٪ کارمزد سامانه هنگام آزادسازی وجه امانی', 'Protecting the cargo owner’s funds and automatically deducting a 5% platform fee when the escrow is released', 'Yük sahibinin parasını korur ve emanet serbest bırakılırken %5 platform komisyonunu otomatik keser')}
            </p>
          </div>

          <button
            onClick={() => setShowRevenueModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#f4f2fe] border border-[#c4c5da] text-[#00258e] text-xs font-bold hover:bg-[#00258e] hover:text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>{trText('دفتر کل درآمد ۵٪ سامانه', 'Platform 5% revenue ledger', 'Platform %5 gelir defteri')}</span>
          </button>
        </div>

        {/* Cargo context */}
        <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-jetbrains text-xs font-bold text-[#00258e] bg-[#dde1ff] px-2 py-1 rounded-lg">
              {cargo.cargoNumber}
            </span>
            <span className="font-bold text-[#1a1b23]">{cargo.cargoInfo.title}</span>
          </div>
          <div className="flex items-center gap-3 text-[#545f72]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#00258e]">person</span>
              {driverName}
            </span>
          </div>
        </div>

        {isLoadingEscrow && (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-10 text-center">
            <span className="material-symbols-outlined text-3xl text-[#00258e] animate-spin">progress_activity</span>
            <p className="text-xs text-[#545f72] mt-2">{trText('در حال خواندن وضعیت حساب امانی...', 'Loading escrow account status...', 'Emanet hesabı durumu okunuyor...')}</p>
          </div>
        )}

        {!isLoadingEscrow && !cargo.assignedDriver && !cargo.assignedDriverId && (
          <div className="bg-[#fff9e6] rounded-2xl border border-[#ffe082] p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-[#b27b00]">how_to_reg</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-2">{trText('هنوز راننده‌ای تخصیص نیافته است', 'No driver has been assigned yet', 'Henüz sürücü atanmadı')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('برای باز کردن حساب امانی، ابتدا یکی از پیشنهادهای رانندگان را در میز مناقصه بپذیرید.', 'To open the escrow account, first accept one of the driver bids on the bidding desk.', 'Emanet hesabını açmak için önce teklif masasında sürücü tekliflerinden birini kabul edin.')}
            </p>
            <button
              onClick={() => onNavigate('SHIPPER_BIDS')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#b27b00] text-white text-xs font-bold hover:bg-[#9a6800] cursor-pointer"
            >
              {trText('رفتن به میز مناقصه', 'Go to the bidding desk', 'Teklif masasına git')}
            </button>
          </div>
        )}

        {!isLoadingEscrow && (cargo.assignedDriver || cargo.assignedDriverId) && (
          <>
            {/* Status Hero Card */}
            <div className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e1ed] pb-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                      isReleased ? 'bg-[#6750a4]' : isDeposited ? 'bg-[#00a368]' : 'bg-[#ff9800]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[32px]">
                      {isReleased ? 'task_alt' : isDeposited ? 'lock' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#545f72]">{trText('وضعیت حساب امانی محموله:', 'Cargo escrow account status:', 'Yük emanet hesabı durumu:')}</div>
                    <div className="text-lg font-black text-[#1a1b23] mt-0.5">
                      {isReleased
                        ? trText('تسویه انجام شد و وجه به کیف پول راننده واریز گردید', 'Settlement completed and the amount was transferred to the driver’s wallet', 'Mutabakat tamamlandı ve tutar sürücünün cüzdanına aktarıldı')
                        : isDeposited
                        ? trText('وجه در حساب امانی سامانه مسدود شده است', 'The funds are held in the platform escrow account', 'Tutar platform emanet hesabında bloke edildi')
                        : trText('در انتظار واریز به حساب امانی', 'Awaiting deposit into the escrow account', 'Emanet hesabına yatırılmayı bekliyor')}
                    </div>
                    {escrowSnapshot && (
                      <div className="text-[11px] text-[#747686] font-jetbrains mt-0.5">
                        {trText(`شناسه امانی: ${escrowSnapshot.escrowId}`, `Escrow ID: ${escrowSnapshot.escrowId}`, `Emanet no: ${escrowSnapshot.escrowId}`)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-end self-start sm:self-auto">
                  <span className="text-[11px] text-[#747686] block">{trText('مبلغ کل مسدودی:', 'Total held amount:', 'Toplam bloke tutarı:')}</span>
                  <span className="font-jetbrains font-black text-xl md:text-2xl text-[#00258e]">
                    {displayedTotal.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                  </span>
                </div>
              </div>

              {/* Breakdown List — matches server calculation exactly */}
              <div className="space-y-3 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs">
                <h3 className="font-bold text-[#1a1b23]">{trText('ریز محاسبات و تفکیک هزینه:', 'Calculation breakdown and cost detail:', 'Hesaplama dökümü ve maliyet ayrıntısı:')}</h3>
                <div className="divide-y divide-[#e2e1ed] space-y-2">
                  <div className="flex justify-between pt-2">
                    <span className="text-[#545f72]">{trText('خالص کرایه حمل راننده (توافق‌شده):', 'Net driver freight (agreed):', 'Net sürücü navlunu (anlaşılan):')}</span>
                    <span className="font-jetbrains font-bold text-[#1a1b23]">
                      {displayedFreight.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#545f72]">{trText('کارمزد خدمات نرم‌افزاری سامانه (۵٪):', 'Platform software service fee (5%):', 'Platform yazılım hizmet bedeli (%5):')}</span>
                    <span className="font-jetbrains text-[#1a1b23]">
                      {displayedCommission.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#545f72]">{trText('مالیات بر ارزش افزوده قانونی (۹٪ کارمزد):', 'Statutory VAT (9% of the fee):', 'Yasal KDV (komisyonun %9’u):')}</span>
                    <span className="font-jetbrains text-[#1a1b23]">
                      {displayedVat.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-black text-sm text-[#00258e]">
                    <span>{trText('جمع کل واریزی به حساب واسط:', 'Total deposited to the intermediary account:', 'Aracı hesaba yatırılan toplam:')}</span>
                    <span className="font-jetbrains">
                      {displayedTotal.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[#747686] leading-relaxed">
                  {trText('حق بیمه محموله خارج از حساب امانی و طبق بیمه‌نامه انتخابی شما جداگانه تسویه می‌شود.', 'The cargo insurance premium is outside the escrow account and is settled separately according to the policy you selected.', 'Yük sigorta primi emanet hesabı dışındadır ve seçtiğiniz poliçeye göre ayrıca ödenir.')}
                </p>
              </div>

              {/* Delivery OTP panel (only while held) */}
              {isDeposited && !isReleased && (
                <div className="bg-[#e8f7f0] p-4 rounded-2xl border border-[#00a368]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00694a]">
                      <span className="material-symbols-outlined text-[18px]">pin</span>
                      <span>{trText('کد تحویل ۶ رقمی (محرم شماست):', '6-digit delivery code (confidential):', '6 haneli teslim kodu (gizlidir):')}</span>
                    </div>
                    {deliveryOtp ? (
                      <span className="font-jetbrains font-black text-xl text-[#00694a] tracking-widest" dir="ltr">
                        {deliveryOtp}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#747686]">{trText('کد در لحظه واریز نمایش داده شد و در دستگاه شما ذخیره است.', 'The code was shown when the deposit was made and is stored on your device.', 'Kod, ödeme anında gösterildi ve cihazınızda saklı.')}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#545f72] leading-relaxed">
                    {trText('این کد را فقط در زمان تحویل به راننده اعلام کنید. پس از ثبت کد توسط هر یک از طرفین، وجه امانی به کیف پول راننده آزاد و کارمزد سامانه در دفتر درآمد ثبت می‌شود. پس از ۵ تلاش ناموفق، حساب امانی قفل می‌شود.', 'Share this code with the driver only at the time of delivery. Once either party enters the code, the escrow funds are released to the driver’s wallet and the platform fee is recorded in the revenue ledger. After 5 failed attempts the escrow account is locked.', 'Bu kodu sürücüye yalnızca teslim anında bildirin. Taraflardan biri kodu girdiğinde emanet tutarı sürücünün cüzdanına serbest bırakılır ve platform komisyonu gelir defterine kaydedilir. 5 başarısız denemeden sonra emanet hesabı kilitlenir.')}
                  </p>
                </div>
              )}

              {/* Escrow Mechanism Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#eeedf9] rounded-xl border border-[#c4c5da] text-center space-y-1">
                  <span className="material-symbols-outlined text-[#00258e] text-[22px]">payment</span>
                  <div className="font-bold text-[#1a1b23]">{trText('۱. واریز و مسدودی', '1. Deposit and hold', '1. Yatırma ve bloke')}</div>
                  <div className="text-[10px] text-[#545f72]">{trText('کرایه و کارمزد در حساب امانی سامانه مسدود می‌شود.', 'The fare and fee are held in the platform escrow account.', 'Navlun ve komisyon platform emanet hesabında bloke edilir.')}</div>
                </div>
                <div className="p-3 bg-[#eeedf9] rounded-xl border border-[#c4c5da] text-center space-y-1">
                  <span className="material-symbols-outlined text-[#00a368] text-[22px]">local_shipping</span>
                  <div className="font-bold text-[#1a1b23]">{trText('۲. بارگیری و حمل', '2. Loading and transport', '2. Yükleme ve taşıma')}</div>
                  <div className="text-[10px] text-[#545f72]">{trText('راننده با خیال آسوده بار را بارگیری و حمل می‌کند.', 'The driver loads and transports the cargo with peace of mind.', 'Sürücü yükü gönül rahatlığıyla yükler ve taşır.')}</div>
                </div>
                <div className="p-3 bg-[#eeedf9] rounded-xl border border-[#c4c5da] text-center space-y-1">
                  <span className="material-symbols-outlined text-[#6750a4] text-[22px]">verified</span>
                  <div className="font-bold text-[#1a1b23]">{trText('۳. تخلیه و تسویه', '3. Unloading and settlement', '3. Boşaltma ve mutabakat')}</div>
                  <div className="text-[10px] text-[#545f72]">{trText('پس از ثبت کد تحویل، وجه به راننده آزاد می‌شود.', 'After the delivery code is registered, the funds are released to the driver.', 'Teslim kodu kaydedildikten sonra tutar sürücüye serbest bırakılır.')}</div>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2">
                {!isDeposited ? (
                  <button
                    onClick={handleOpenDeposit}
                    className="w-full py-3.5 rounded-2xl bg-[#00258e] text-white font-black text-sm hover:bg-[#0036c5] flex items-center justify-center gap-2 shadow-lg shadow-[#00258e]/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span>{trText(`ثبت مسدودسازی حساب امانی (${planned.total.toLocaleString('fa-IR')} تومان)`, `Hold funds in the escrow account (${planned.total.toLocaleString('fa-IR')} Toman)`, `Emanet hesabında bloke kaydı (${planned.total.toLocaleString('fa-IR')} Toman)`)}</span>
                  </button>
                ) : isReleased ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#6750a4]/10 p-4 rounded-2xl border border-[#6750a4]/30">
                    <div className="flex items-center gap-2 text-xs text-[#6750a4] font-bold">
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                      <span>
                        {trText(`تسویه کامل شد — کرایه ${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} تومان به راننده واریز شد.`, `Settlement completed — the fare of ${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} Toman was transferred to the driver.`, `Mutabakat tamamlandı — ${escrowSnapshot?.freightAmountTomans.toLocaleString('fa-IR')} Toman navlun sürücüye aktarıldı.`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('SHIPPER_INVOICE')}
                        className="px-4 py-2 rounded-xl bg-[#6750a4] text-white text-xs font-bold hover:bg-[#5a4494] cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                        <span>{trText('مشاهده صورتحساب', 'View invoice', 'Faturayı görüntüle')}</span>
                      </button>
                      <button
                        onClick={() => onNavigate('SHIPPER_RATING')}
                        className="px-3 py-2 rounded-xl border border-[#6750a4] text-[#6750a4] text-xs font-bold hover:bg-[#6750a4]/5 cursor-pointer"
                      >
                        {trText('ثبت امتیاز راننده', 'Rate the driver', 'Sürücüyü puanla')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#00a368]/10 p-4 rounded-2xl border border-[#00a368]/30">
                    <div className="flex items-center gap-2 text-xs text-[#00a368] font-bold">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>{trText('حساب امانی مسدود است. پس از تخلیه، کد تحویل را ثبت کنید.', 'The escrow account is holding the funds. After unloading, register the delivery code.', 'Emanet hesabı bloke durumda. Boşaltmadan sonra teslim kodunu kaydedin.')}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('SHIPPER_DELIVERY_CONFIRM')}
                      className="px-4 py-2 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      <span>{trText('تأیید تحویل و آزادسازی', 'Confirm delivery and release', 'Teslimi onayla ve serbest bırak')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* DEPOSIT CONFIRMATION MODAL (bank gateway not connected; ledger registration) */}
            {showPaymentGatewayModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#c4c5da] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00258e] text-[24px]">account_balance</span>
                      <h3 className="font-black text-sm text-[#1a1b23]">{trText('ثبت مسدودسازی حساب امانی', 'Register an escrow hold', 'Emanet blokesi kaydı')}</h3>
                    </div>
                    <button
                      onClick={() => setShowPaymentGatewayModal(false)}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#747686]"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="bg-[#fbf8ff] p-3 rounded-xl border border-[#e2e1ed] text-center">
                    <span className="text-[11px] text-[#545f72] block">{trText('مبلغ مسدودشونده:', 'Amount to be held:', 'Bloke edilecek tutar:')}</span>
                    <span className="font-jetbrains font-extrabold text-lg text-[#00258e]">
                      {planned.total.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#545f72]">
                    <div className="flex justify-between">
                      <span>{trText('محموله:', 'Cargo:', 'Yük:')}</span>
                      <strong className="text-[#1a1b23]">{cargo.cargoNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{trText('راننده تخصیص‌یافته:', 'Assigned driver:', 'Atanan sürücü:')}</span>
                      <strong className="text-[#1a1b23]">{driverName}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#fff9e6] rounded-xl border border-[#ffe082] text-[11px] text-[#7a5900] leading-relaxed">
                    {trText('درگاه پرداخت بانکی هنوز به سامانه متصل نیست؛ با تأیید این صفحه، دستور مسدودسازی به‌صورت رسمی در دفتر حساب امانی سامانه ثبت می‌شود و کد تحویل ۶ رقمی صادر می‌گردد. پس از فعال‌سازی درگاه، واریز بانکی به همین ثبت متصل خواهد شد.', 'The bank payment gateway is not yet connected to the system; by confirming this page, the hold instruction is officially recorded in the platform escrow ledger and a 6-digit delivery code is issued. Once the gateway is activated, the bank deposit will be linked to this same record.', 'Banka ödeme geçidi henüz sisteme bağlı değildir; bu sayfayı onayladığınızda bloke talimatı platform emanet defterine resmen kaydedilir ve 6 haneli teslim kodu düzenlenir. Geçit etkinleştirildiğinde banka ödemesi bu kayda bağlanacaktır.')}
                  </div>

                  <button
                    onClick={handleConfirmDeposit}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-[#00a368] text-white font-black text-xs hover:bg-[#008f5a] shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        <span>{trText('در حال ثبت مسدودسازی...', 'Registering the hold...', 'Bloke kaydı yapılıyor...')}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>{trText('تایید و ثبت مسدودسازی امانی', 'Confirm and register the escrow hold', 'Emanet blokesini onayla ve kaydet')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Platform Revenue & Commission Ledger Modal */}
        <PlatformRevenueModal
          isOpen={showRevenueModal}
          onClose={() => setShowRevenueModal(false)}
        />
      </main>

      <MobileBottomNav currentScreen="WALLET" onNavigate={onNavigate} />
    </div>
  );
};
