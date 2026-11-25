import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, CargoBidItem, BidStatus } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { biddingService } from '../services/biddingService';

interface DriverBidsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverBidsScreen: React.FC<DriverBidsScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [bids, setBids] = useState<CargoBidItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | BidStatus>('ALL');
  const [selectedBid, setSelectedBid] = useState<CargoBidItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    setIsLoading(true);
    const data = await biddingService.fetchDriverBids();
    setBids(data);
    setIsLoading(false);
  };

  const filteredBids = bids.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const handleCancelBid = async (bidId: string) => {
    try {
      await biddingService.cancelBid(bidId);
      showToast('info', trText('پیشنهاد قیمت شما با موفقیت لغو گردید.', 'Your bid was cancelled successfully.', 'Teklifiniz başarıyla iptal edildi.'));
    } catch (err) {
      console.error('Cancel bid failed:', err);
      showToast('error', trText('لغو پیشنهاد ناموفق بود. لطفاً دوباره تلاش کنید.', 'Cancelling the bid failed. Please try again.', 'Teklif iptal edilemedi. Lütfen tekrar deneyin.'));
    }
    setSelectedBid(null);
    await loadBids();
  };

  /**
   * پذیرش پیشنهاد متقابل صاحب بار. تخصیص محموله و قفل کرایه سمت سرور انجام می‌شود.
   */
  const handleAcceptCounterOffer = async (bidId: string) => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      const result = await biddingService.acceptCounterOffer(bidId);
      setSelectedBid(null);
      showToast(
        'success',
        trText(`پیشنهاد متقابل پذیرفته شد. کرایه توافقی: ${result.agreedFareTomans.toLocaleString('fa-IR')} تومان.`, `Counter-offer accepted. Agreed fare: ${result.agreedFareTomans.toLocaleString('fa-IR')} Toman.`, `Karşı teklif kabul edildi. Anlaşılan navlun: ${result.agreedFareTomans.toLocaleString('fa-IR')} Tümen.`)
      );
      await loadBids();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const message =
        code === 'NO_COUNTER_OFFER'
          ? trText('این پیشنهاد متقابل دیگر معتبر نیست.', 'This counter-offer is no longer valid.', 'Bu karşı teklif artık geçerli değil.')
          : code === 'CARGO_NOT_OPEN'
          ? trText('این محموله دیگر باز نیست.', 'This cargo is no longer open.', 'Bu yük artık açık değil.')
          : code === 'INVALID_BID'
          ? trText('دسترسی به این پیشنهاد امکان‌پذیر نیست.', 'This bid cannot be accessed.', 'Bu teklife erişilemiyor.')
          : trText('پذیرش پیشنهاد متقابل ناموفق بود. لطفاً دوباره تلاش کنید.', 'Accepting the counter-offer failed. Please try again.', 'Karşı teklif kabul edilemedi. Lütfen tekrar deneyin.');
      showToast('error', message);
    } finally {
      setIsAccepting(false);
    }
  };

  const getStatusBadge = (status: BidStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-[#fff8e1] text-[#b27b00] border border-[#ffe082] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-14px">hourglass_top</span>
            <span>{trText('در انتظار بررسی صاحب کالا', 'Awaiting shipper review', 'Yük sahibinin incelemesi bekleniyor')}</span>
          </span>
        );
      case 'COUNTER_OFFER':
        return (
          <span className="bg-[#e8f0fe] text-[#1967d2] border border-[#aecbfa] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-14px">sync_alt</span>
            <span>{trText('پیشنهاد متقابل فرستنده', 'Counter-offer from shipper', 'Göndericiden karşı teklif')}</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-[#e6f4ea] text-[#137333] border border-[#a8dab5] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-14px">check_circle</span>
            <span>{trText('تأیید و واگذار شده', 'Approved & assigned', 'Onaylandı ve atandı')}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-14px">cancel</span>
            <span>{trText('رد شده', 'Rejected', 'Reddedildi')}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-14px">block</span>
            <span>{trText('لغو شده توسط راننده', 'Cancelled by driver', 'Sürücü tarafından iptal edildi')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      <AppHeader
        currentScreen="DRIVER_BIDS"
        title={trText('پیشنهادهای قیمت من', 'My Bids', 'Tekliflerim')}
        subtitle="My Bids & Freight Negotiations"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_BIDS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-28px">price_check</span>
              <h1 className="font-vazirmatn text-xl md:text-2xl font-black text-[#1a1b23]">
                {trText('مدیریت پیشنهادهای کرایه بار (Bids)', 'Manage Freight Bids', 'Navlun Tekliflerini Yönet')}
              </h1>
            </div>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText('مشاهده وضعیت استعلام قیمت، مذاکره دوطرفه با صاحبان کالا و پذیرش پیشنهادهای متقابل', 'Track quote status, negotiate directly with shippers and accept counter-offers', 'Fiyat teklifi durumunu izleyin, yük sahipleriyle karşılıklı pazarlık yapın ve karşı teklifleri kabul edin')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('CARGOS')}
            className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-18px">search</span>
            <span>{trText('جستجو و پیشنهاد روی بارهای جدید', 'Find & Bid on New Cargos', 'Yeni Yükleri Bul ve Teklif Ver')}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            {trText('همه پیشنهادها (', 'All bids (', 'Tüm teklifler (')}{bids.length})
          </button>
          <button
            onClick={() => setActiveTab('COUNTER_OFFER')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'COUNTER_OFFER'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#1967d2] border border-[#aecbfa] hover:bg-[#e8f0fe]'
            }`}
          >
            <span>{trText('پیشنهاد متقابل', 'Counter-offers', 'Karşı teklifler')}</span>
            <span className="bg-[#ba1a1a] text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {bids.filter((b) => b.status === 'COUNTER_OFFER').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            {trText('در انتظار (', 'Pending (', 'Beklemede (')}{bids.filter((b) => b.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('ACCEPTED')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ACCEPTED'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            {trText('پذیرفته‌شده (', 'Accepted (', 'Kabul edilen (')}{bids.filter((b) => b.status === 'ACCEPTED').length})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            {trText('ردشده (', 'Rejected (', 'Reddedilen (')}{bids.filter((b) => b.status === 'REJECTED').length})
          </button>
        </div>

        {/* Bids List */}
        {filteredBids.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBids.map((bid) => (
              <div
                key={bid.id}
                className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                        {bid.cargoId} • {bid.id}
                      </span>
                      <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23] mt-0.5">
                        {bid.cargoTitle}
                      </h3>
                    </div>
                    {getStatusBadge(bid.status)}
                  </div>

                  {/* Route & Cargo Specs */}
                  <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-18px text-[#00258e]">trip_origin</span>
                      <span className="text-[#444655]">{trText('مبدأ:', 'Origin:', 'Kalkış:')} <strong>{bid.originCity}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-18px text-[#ba1a1a]">location_on</span>
                      <span className="text-[#444655]">{trText('مقصد:', 'Destination:', 'Varış:')} <strong>{bid.destinationCity}</strong></span>
                    </div>
                    <div className="flex justify-between text-[#747686] pt-1 border-t border-[#e2e1ed] text-[11px]">
                      <span>{trText('وزن:', 'Weight:', 'Ağırlık:')} {bid.cargoWeight}</span>
                      <span>{trText('نوع ناوگان:', 'Fleet type:', 'Filo tipi:')} {bid.truckTypeRequired}</span>
                    </div>
                  </div>

                  {/* Fares Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                      <span className="text-[#747686] text-[11px]">{trText('نرخ پایه فرستنده', 'Shipper base rate', 'Gönderici baz ücret')}</span>
                      <div className="font-bold text-[#444655] mt-0.5">{bid.originalPrice}</div>
                    </div>
                    <div className="p-2.5 bg-[#f0f4ff] rounded-xl border border-[#c4c5da]">
                      <span className="text-[#00258e] text-[11px] font-bold">{trText('پیشنهاد شما', 'Your bid', 'Teklifiniz')}</span>
                      <div className="font-bold text-[#00258e] mt-0.5">{bid.proposedFareFormatted}</div>
                    </div>
                  </div>

                  {/* Counter offer highlight if present */}
                  {bid.status === 'COUNTER_OFFER' && bid.counterOfferAmount && (
                    <div className="p-3 bg-[#fff8e1] rounded-xl border border-[#ffe082] text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[#b27b00] font-bold">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-16px">chat</span>
                          <span>{trText('پیشنهاد متقابل صاحب کالا:', 'Shipper counter-offer:', 'Yük sahibinin karşı teklifi:')}</span>
                        </span>
                        <span className="text-sm font-black">{bid.counterOfferFormatted}</span>
                      </div>
                      {bid.counterOfferNote && (
                        <p className="text-[11px] text-[#5d4037]">{bid.counterOfferNote}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#e2e1ed]">
                  <button
                    onClick={() => setSelectedBid(bid)}
                    className="flex-1 bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    {trText('مشاهده جزئیات', 'View details', 'Detayları gör')}
                  </button>

                  {bid.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelBid(bid.id)}
                      className="text-[#ba1a1a] hover:bg-[#ffdad6] text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      {trText('لغو پیشنهاد', 'Cancel bid', 'Teklifi iptal et')}
                    </button>
                  )}

                  {bid.status === 'ACCEPTED' && (
                    <button
                      onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
                      className="flex-1 bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-16px">play_arrow</span>
                      <span>{trText('شروع سفر', 'Start Trip', 'Seferi Başlat')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-[#c4c5da] text-center space-y-3">
            <span className="material-symbols-outlined text-48px text-[#747686]">price_change</span>
            <h3 className="font-bold text-base text-[#1a1b23]">{trText('هیچ پیشنهادی در این دسته یافت نشد', 'No bids found in this category', 'Bu kategoride teklif bulunamadı')}</h3>
            <p className="text-xs text-[#545f72]">{trText('می‌توانید از بخش جستجوی بارها، بار مناسب را انتخاب و نرخ خود را پیشنهاد دهید.', 'You can pick a suitable cargo in the cargo search section and propose your own rate.', 'Yük arama bölümünden uygun yükü seçip kendi fiyatınızı teklif edebilirsiniz.')}</p>
            <button
              onClick={() => onNavigate('CARGOS')}
              className="bg-[#00258e] text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              {trText('مشاهده بارهای باز', 'Browse Open Cargos', 'Açık Yükleri Gör')}
            </button>
          </div>
        )}
      </main>

      {/* Modal: Bid Details */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#c4c5da] p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">description</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('جزئیات کامل استعلام و پیشنهاد', 'Full Quote & Bid Details', 'Teklif ve Talep Detayları')}</h3>
              </div>
              <button
                onClick={() => setSelectedBid(null)}
                className="text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] space-y-2">
                <div className="text-sm font-bold text-[#1a1b23]">{selectedBid.cargoTitle}</div>
                <div className="flex justify-between text-[#545f72]">
                  <span>{trText('فرستنده:', 'Shipper:', 'Gönderici:')} <strong>{selectedBid.shipperName}</strong> {trText('(امتیاز:', '(rating:', '(puan:')} {selectedBid.shipperRating}★)</span>
                  <span>{trText('کد استعلام:', 'Quote code:', 'Talep kodu:')} {selectedBid.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#fbf8ff] rounded-lg border border-[#e2e1ed]">
                  <span className="text-[#747686]">{trText('زمان آماده به بارگیری:', 'Ready to load:', 'Yüklemeye hazır:')}</span>
                  <div className="font-bold text-[#1a1b23] mt-0.5">{selectedBid.readyToLoadTime}</div>
                </div>
                <div className="p-2.5 bg-[#fbf8ff] rounded-lg border border-[#e2e1ed]">
                  <span className="text-[#747686]">{trText('وضعیت پیشنهاد:', 'Bid status:', 'Teklif durumu:')}</span>
                  <div className="font-bold text-[#00258e] mt-0.5">{selectedBid.status}</div>
                </div>
              </div>

              {selectedBid.driverNotes && (
                <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                  <span className="text-[#747686] font-bold block mb-1">{trText('توضیحات و شرایط ارسالی شما:', 'Your notes and submitted terms:', 'Notlarınız ve ilettiğiniz şartlar:')}</span>
                  <p className="text-[#444655] leading-relaxed">{selectedBid.driverNotes}</p>
                </div>
              )}

              <div className="p-3 bg-[#e8e7f3] rounded-xl text-[11px] text-[#444655] space-y-1">
                <div className="flex justify-between">
                  <span>{trText('کرایه توافقی (پرداختی صاحب بار):', 'Agreed fare (paid by shipper):', 'Anlaşılan navlun (yük sahibi öder):')}</span>
                  <span>{(selectedBid.proposedFareAmount).toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}</span>
                </div>
                <div className="flex justify-between text-[#545f72]">
                  <span>{trText('کارمزد پلتفرم TLD (۵٪ + ۹٪ مالیات) — بر عهده صاحب بار:', 'TLD platform fee (5% + 9% VAT) — paid by the shipper:', 'TLD platform ücreti (%5 + %9 KDV) — yük sahibi tarafından ödenir:')}</span>
                  <span>{(Math.round((selectedBid.proposedFareAmount * 5) / 100) + Math.round((Math.round((selectedBid.proposedFareAmount * 5) / 100) * 9) / 100)).toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}</span>
                </div>
                <div className="flex justify-between font-bold text-[#00258e] pt-1 border-t border-[#c4c5da]">
                  <span>{trText('خالص دریافتی راننده پس از تخلیه:', 'Driver net payout after unloading:', 'Boşaltma sonrası sürücüye net ödeme:')}</span>
                  <span>{(selectedBid.proposedFareAmount).toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBid(null)}
                className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
              >
                {trText('بستن', 'Close', 'Kapat')}
              </button>
              {selectedBid.status === 'COUNTER_OFFER' && (
                <button
                  onClick={() => handleAcceptCounterOffer(selectedBid.id)}
                  disabled={isAccepting}
                  className="flex-1 bg-[#00a368] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#008f5b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAccepting ? trText('در حال ثبت…', 'Submitting…', 'Kaydediliyor…') : trText('پذیرش پیشنهاد متقابل', 'Accept Counter-offer', 'Karşı Teklifi Kabul Et')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
