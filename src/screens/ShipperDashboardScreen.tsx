import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService } from '../services/shipperService';
import { BiometricAuthModal } from '../components/auth/BiometricAuthModal';
import { getStoredCredentials, authenticateWithBiometrics } from '../utils/webAuthn';

interface ShipperDashboardScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperDashboardScreen: React.FC<ShipperDashboardScreenProps> = ({
  onNavigate,
}) => {
  const { currentUser, showToast } = useAuth();
  const { dir, t, trText } = useLanguage();
  const { openChatForEntity } = useLogistics();

  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [hasBiometricEnrolled, setHasBiometricEnrolled] = useState(false);
  const [quickBiometricScanning, setQuickBiometricScanning] = useState(false);

  const shipperMobile = currentUser?.mobile || '';
  const companyName =
    currentUser?.profile?.companyName ||
    currentUser?.profile?.fullName ||
    currentUser?.firstName ||
    currentUser?.mobile ||
    trText('صاحب‌بار گرامی', 'Respected Shipper', 'Sayın Yük Sahibi');

  useEffect(() => {
    const creds = getStoredCredentials(shipperMobile);
    setHasBiometricEnrolled(creds.length > 0);
  }, [shipperMobile, isBiometricModalOpen]);

  const handleQuickBiometricAuth = async () => {
    if (!hasBiometricEnrolled) {
      setIsBiometricModalOpen(true);
      return;
    }
    setQuickBiometricScanning(true);
    try {
      const res = await authenticateWithBiometrics(shipperMobile);
      if (res.success) {
        setIsBiometricVerified(true);
        showToast('success', trText('هویت بیومتریک صاحب بار تایید شد (مجوز پرداخت فعال)', 'Shipper Biometrics Verified (Escrow Enabled)', 'Yük Sahibi Biyometrisi Doğrulandı (Emanet Etkin)'));
      } else {
        showToast('error', res.error || trText('خطا در احراز هویت بیومتریک', 'Biometric check failed', 'Biyometrik doğrulama başarısız oldu'));
        setIsBiometricModalOpen(true);
      }
    } catch {
      setIsBiometricModalOpen(true);
    } finally {
      setQuickBiometricScanning(false);
    }
  };

  const activeCargos = shipperService.getActiveCargos();
  const firstCargoId = activeCargos.length > 0 ? activeCargos[0].id : '';
  const candidates = firstCargoId ? shipperService.getBidsForCargo(firstCargoId) : [];
  const totalEscrowHeld = activeCargos.reduce((sum, c) => sum + ((c as any).escrow?.amountHeldTomans || c.pricing?.finalOfferedFareTomans || 0), 0);

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_DASHBOARD" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_DASHBOARD" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>{t.shipperPortalTitle}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {t.shipperDashboardTitle}
            </h1>
            <p className="text-[#545f72] text-xs mt-0.5">
              {t.shipperDashboardDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Shipper Biometric WebAuthn Quick Auth Button */}
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
              title={trText('احراز هویت بیومتریک صاحب بار جهت تایید قرارداد و پرداخت امن اسکرو با استاندارد FIDO2', 'Shipper biometric FIDO2 authentication for contracts and escrow', 'Sözleşmeler ve emanet için yük sahibi FIDO2 biyometrik kimlik doğrulaması')}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  isBiometricVerified ? 'text-[#137333]' : 'text-[#00258e]'
                }`}
              >
                {isBiometricVerified ? 'verified_user' : 'fingerprint'}
              </span>
              <span>
                {quickBiometricScanning
                  ? trText('در حال اسکن...', 'Scanning...', 'Taranıyor...')
                  : isBiometricVerified
                  ? trText('بیومتریک صاحب بار تایید شد', 'Shipper Verified', 'Yük Sahibi Doğrulandı')
                  : hasBiometricEnrolled
                  ? trText('تایید با اثر انگشت', 'Touch to Authorize', 'Yetkilendirmek için dokunun')
                  : trText('فعال‌سازی اثر انگشت', 'Setup Biometrics', 'Biyometriyi Ayarla')}
              </span>
            </button>

            <button
              onClick={() => onNavigate('SHIPPER_REGISTRATION')}
              className="flex items-center gap-2 bg-[#f4f2fe] hover:bg-[#eeedf9] text-[#00258e] border border-[#c4c5da] px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>{t.shipperDocumentsBtn}</span>
            </button>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#c4c5da] shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-[#00258e] flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[#1a1b23] text-sm truncate">{companyName}</div>
                <div className="flex items-center gap-1 text-[#00a368] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>{t.legalVerified}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Essential Shipper Flow Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
            className="bg-[#00258e] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#0036c5] transition-all shadow-md shadow-[#00258e]/20 cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
              add_box
            </span>
            <span className="font-bold text-xs">{t.createCargo}</span>
          </button>

          <button
            onClick={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
            className="bg-white text-[#00258e] border border-[#c4c5da] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#eeedf9] transition-all shadow-sm cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl text-[#00258e] group-hover:scale-110 transition-transform">
              package_2
            </span>
            <span className="font-bold text-xs text-[#1a1b23]">{t.activeCargos} ({activeCargos.length})</span>
          </button>

          <button
            onClick={() => onNavigate('SHIPPER_BIDS')}
            className="bg-white text-[#ff9800] border border-[#c4c5da] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#ff9800]/10 transition-all shadow-sm cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl text-[#b26a00] group-hover:scale-110 transition-transform">
              compare_arrows
            </span>
            <span className="font-bold text-xs text-[#1a1b23]">{t.compareBids}</span>
          </button>

          <button
            onClick={() => onNavigate('SHIPPER_ESCROW')}
            className="bg-white text-[#00a368] border border-[#c4c5da] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#00a368]/10 transition-all shadow-sm cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl text-[#00a368] group-hover:scale-110 transition-transform">
              account_balance_wallet
            </span>
            <span className="font-bold text-xs text-[#1a1b23]">{t.escrow}</span>
          </button>

          <button
            onClick={() => onNavigate('SHIPPER_TRACKING')}
            className="bg-white text-[#0288d1] border border-[#c4c5da] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#0288d1]/10 transition-all shadow-sm cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl text-[#0288d1] group-hover:scale-110 transition-transform">
              my_location
            </span>
            <span className="font-bold text-xs text-[#1a1b23]">{t.tracking}</span>
          </button>

          <button
            onClick={() => onNavigate('SHIPPER_PAST_CARGOS')}
            className="bg-white text-[#545f72] border border-[#c4c5da] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#eeedf9] transition-all shadow-sm cursor-pointer text-center group"
          >
            <span className="material-symbols-outlined text-2xl text-[#545f72] group-hover:scale-110 transition-transform">
              history
            </span>
            <span className="font-bold text-xs text-[#1a1b23]">{t.tripHistory}</span>
          </button>
        </div>


        {/* Bento Grid: Active Ops + Escrow & Legal + Drivers */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Active Cargos (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-3xl border border-[#c4c5da] p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <h2 className="text-sm font-black text-[#1a1b23] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">local_shipping</span>
                <span>{t.currentCargoOps}</span>
              </h2>
              <button
                onClick={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
                className="text-xs font-bold text-[#00258e] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t.viewAllActiveCargos}</span>
                <span className="material-symbols-outlined text-[16px] rtl:rotate-180">arrow_back</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeCargos.length === 0 ? (
                <div className="text-center py-8 px-4 bg-[#fbf8ff] rounded-2xl border border-dashed border-[#c4c5da]">
                  <span className="material-symbols-outlined text-4xl text-[#747686] mb-2">package_2</span>
                  <p className="text-sm font-bold text-[#1a1b23]">{trText('هنوز باری ثبت نشده است', 'No active cargos registered yet', 'Henüz aktif yük kaydı yok')}</p>
                  <p className="text-xs text-[#545f72] mt-1">{trText('برای اعلام بار جدید از دکمه ثبت بار اقدام کنید.', 'Click Create Cargo to post your first shipment.', 'İlk sevkiyatınızı ilan etmek için Yük Oluştur\'a dokunun.')}</p>
                  <button
                    onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
                    className="mt-3 px-4 py-2 bg-[#00258e] text-white text-xs font-bold rounded-xl hover:bg-[#0036c5] transition-all cursor-pointer"
                  >
                    {t.createCargo}
                  </button>
                </div>
              ) : (
                activeCargos.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl hover:bg-[#fbf8ff] border border-[#e2e1ed] hover:border-[#00258e] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center font-bold shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {c.status === 'IN_TRANSIT' ? 'route' : 'hourglass_top'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1a1b23] flex items-center gap-2">
                          <span>{c.cargoInfo.title}</span>
                          <span className="font-jetbrains text-[10px] text-[#00258e] bg-[#dde1ff] px-1.5 py-0.2 rounded" dir="ltr">
                            {c.cargoNumber}
                          </span>
                        </div>
                        <div className="text-xs text-[#545f72] mt-0.5">
                          {c.origin.city} {trText('به', 'to', '→')} {c.destination.city} | {c.fleetReq.truckTypeName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {c.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => onNavigate('SHIPPER_TRACKING')}
                          className="px-3 py-1.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">my_location</span>
                          <span>{t.satelliteTracking}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('SHIPPER_BIDS')}
                          className="px-3 py-1.5 rounded-xl bg-[#ff9800] text-white text-xs font-bold hover:bg-[#e68900] flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">gavel</span>
                          <span>{c.bidsCount} {t.driverBidsCount}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('SHIPPER_CONTRACT')}
                        className="px-2.5 py-1.5 rounded-xl border border-[#c4c5da] text-[#545f72] hover:bg-[#eeedf9] text-xs font-bold cursor-pointer"
                      >
                        {t.documents}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Escrow & Financials Widget (4 cols) */}
          <div className="md:col-span-4 bg-white rounded-3xl border border-[#c4c5da] p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
                <h2 className="text-sm font-black text-[#1a1b23] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00a368]">account_balance_wallet</span>
                  <span>{t.escrowAndDocs}</span>
                </h2>
                <button
                  onClick={() => onNavigate('SHIPPER_ESCROW')}
                  className="text-xs font-bold text-[#00258e] hover:underline cursor-pointer"
                >
                  {t.manage}
                </button>
              </div>

              {/* Escrow balance box */}
              <div
                onClick={() => onNavigate('SHIPPER_ESCROW')}
                className="bg-[#00a368]/10 border border-[#00a368]/30 p-4 rounded-2xl cursor-pointer hover:bg-[#00a368]/15 transition-all"
              >
                <div className="text-[11px] text-[#545f72]">{t.escrowBlockedAmount}</div>
                <div className="font-jetbrains font-black text-xl text-[#00a368] mt-1" dir="ltr">
                  {totalEscrowHeld > 0 ? `${totalEscrowHeld.toLocaleString('fa-IR')} ${trText('تومان', 'Tomans', 'Tümen')}` : trText('۰ تومان', '0 Tomans', '0 Tümen')}
                </div>
                <div className="text-[10px] text-[#00a368] font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>{t.releaseAfterPod}</span>
                </div>
              </div>

              {/* Quick Legal Links */}
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => onNavigate('SHIPPER_CONTRACT')}
                  className="w-full p-2.5 rounded-xl border border-[#c4c5da] hover:border-[#00258e] flex items-center justify-between font-bold text-[#1a1b23] hover:bg-[#fbf8ff] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00258e] text-[18px]">verified</span>
                    <span>{t.digitalContractStamped}</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#747686] rtl:rotate-180">arrow_back</span>
                </button>

                <button
                  onClick={() => onNavigate('SHIPPER_INVOICE')}
                  className="w-full p-2.5 rounded-xl border border-[#c4c5da] hover:border-[#00258e] flex items-center justify-between font-bold text-[#1a1b23] hover:bg-[#fbf8ff] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00258e] text-[18px]">receipt</span>
                    <span>{t.officialTaxInvoice}</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#747686] rtl:rotate-180">arrow_back</span>
                </button>

                <button
                  onClick={() => onNavigate('SHIPPER_DISPUTES')}
                  className="w-full p-2.5 rounded-xl border border-[#ba1a1a]/30 hover:border-[#ba1a1a] flex items-center justify-between font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/5 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">gavel</span>
                    <span>{t.fileDisputeArbitration}</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#ba1a1a] rtl:rotate-180">arrow_back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Driver Proposals & Candidates comparison row (12 cols) */}
          <div className="md:col-span-12 bg-white rounded-3xl border border-[#c4c5da] p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <h2 className="text-sm font-black text-[#1a1b23] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff9800]">gavel</span>
                <span>{t.activeDriverProposals}</span>
              </h2>
              <button
                onClick={() => onNavigate('SHIPPER_BIDS')}
                className="text-xs font-bold text-[#00258e] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t.enterBiddingTable}</span>
                <span className="material-symbols-outlined text-[16px] rtl:rotate-180">arrow_back</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {candidates.length === 0 ? (
                <div className="col-span-full text-center py-8 px-4 bg-[#fbf8ff] rounded-2xl border border-dashed border-[#c4c5da]">
                  <span className="material-symbols-outlined text-4xl text-[#747686] mb-2">gavel</span>
                  <p className="text-sm font-bold text-[#1a1b23]">{trText('در حال حاضر پیشنهادی از سوی رانندگان ثبت نشده است', 'No driver bids received yet', 'Henüz sürücü teklifi alınmadı')}</p>
                  <p className="text-xs text-[#545f72] mt-1">{trText('به محض ثبت پیشنهاد رانندگان برای بارهای شما، در این بخش نمایش داده خواهد شد.', 'New bids submitted by drivers will appear here.', 'Sürücülerin yeni teklifleri burada görünecek.')}</p>
                </div>
              ) : (
                candidates.map((driver) => (
                  <div
                    key={driver.driverId}
                    className="border border-[#c4c5da] rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-[#00258e] hover:bg-[#fbf8ff] transition-all bg-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#00258e] text-white font-bold flex items-center justify-center text-xs">
                            {driver.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#1a1b23]">{driver.fullName}</div>
                            <div className="text-[11px] text-[#545f72] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#ff9800]">star</span>
                              <span className="font-bold">{driver.ratingScore}</span>
                              <span>({driver.totalCompletedTrips} {t.tripsCount})</span>
                            </div>
                          </div>
                        </div>
                        <span className="bg-[#dde1ff] text-[#001356] text-[10px] font-bold px-2 py-0.5 rounded" dir="ltr">
                          {driver.tierBadge}
                        </span>
                      </div>

                      <div className="text-xs text-[#545f72] bg-[#fbf8ff] p-2.5 rounded-xl border border-[#e2e1ed]">
                        {t.vehicle}: <strong className="text-[#1a1b23]">{driver.truckBrand} {driver.truckModel}</strong>
                        <br />
                        {t.distanceToOrigin} <strong className="text-[#00a368]">{driver.etaToOriginMinutes} {trText('دقیقه', 'min', 'dk')}</strong>
                      </div>

                      <div className="text-center bg-[#eeedf9] p-2 rounded-xl">
                        <span className="text-[10px] text-[#545f72] block">{t.proposedFare}</span>
                        <span className="font-jetbrains font-bold text-sm text-[#00258e]" dir="ltr">
                          {driver.fareFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e2e1ed]">
                      <button
                        onClick={() => onNavigate('SHIPPER_BIDS')}
                        className="py-1.5 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] cursor-pointer"
                      >
                        {t.selectDriver}
                      </button>
                      <button
                        onClick={() => {
                          openChatForEntity(driver.fullName, `Driver (${driver.truckModel})`);
                          onNavigate('CHAT');
                        }}
                        className="py-1.5 rounded-xl border border-[#00258e] text-[#00258e] text-xs font-bold hover:bg-[#00258e]/5 cursor-pointer"
                      >
                        {t.chat}
                      </button>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav currentScreen="SHIPPER_DASHBOARD" onNavigate={onNavigate} />

      {/* WebAuthn Biometric Modal for Shipper */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={() => {
          setIsBiometricVerified(true);
        }}
        userMobile={shipperMobile}
        userName={companyName}
        userRole="SHIPPER"
        purpose="ESCROW"
      />
    </div>
  );
};
