import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import {
  AppScreen,
  ShipperDriverCandidate,
  ShipperFullCargo,
  CargoBidItem,
} from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService, adaptDbCargoToShipperCargo } from '../services/shipperService';
import { biddingService } from '../services/biddingService';

interface ShipperBidsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

type SortOption = 'AI_BEST' | 'LOWEST_PRICE' | 'HIGHEST_RATING' | 'MOST_TRIPS';
type ViewMode = 'CARDS' | 'MATRIX' | 'RADAR';

const bidToCandidate = (b: CargoBidItem, fallbackDriverName: string): ShipperDriverCandidate => {
  const rating = b.driverRatingScore ?? 0;
  return {
    driverId: b.id, // bid row id — used by the accept endpoint
    fullName: b.driverFullName || fallbackDriverName,
    avatarUrl: b.driverAvatarUrl,
    mobile: '—',
    nationalIdMasked: '—',
    smartCardNumber: '—',
    ratingScore: rating,
    tierBadge: rating >= 4.8 ? 'DIAMOND' : rating >= 4.3 ? 'GOLD' : 'SILVER',
    totalCompletedTrips: b.driverTotalTrips ?? 0,
    onTimeDeliveryRate: b.driverOnTimeRate ?? 0,
    cargoIntegrityRate: 100,
    truckBrand: b.driverFleetType || '',
    truckModel: b.driverTruckModel || '—',
    truckType: b.truckTypeRequired || '—',
    truckBuildYear: '—',
    plateNumber: b.driverPlateNumber || '—',
    etaToOriginMinutes: 0,
    currentDistanceKm: 0,
    proposedFareTomans: b.proposedFareAmount,
    fareFormatted: b.proposedFareFormatted,
    driverNote: b.driverNotes,
    bidSubmittedAt: b.submittedAt,
    healthCardValid: false,
    insuranceValid: false,
    status: b.status === 'ACCEPTED' ? 'ACCEPTED' : b.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
  };
};

export const ShipperBidsScreen: React.FC<ShipperBidsScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, t, trText } = useLanguage();
  const { cargos: dbCargos, selectedCargoId, setSelectedCargoId, refreshAllData, openChatForEntity } = useLogistics();

  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  // All shipper cargos: real DB rows merged with locally enriched wizard cargos
  const allCargos = useMemo(() => {
    const byId = new Map<string, ShipperFullCargo>();
    dbCargos.forEach((c) => byId.set(c.id, adaptDbCargoToShipperCargo(c)));
    shipperService.getCargos().forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    return Array.from(byId.values());
  }, [dbCargos]);

  const cargo = useMemo(() => {
    return (
      (selectedCargoId && allCargos.find((c) => c.id === selectedCargoId)) ||
      allCargos.find((c) => c.status === 'PENDING_DRIVER') ||
      allCargos[0]
    );
  }, [selectedCargoId, allCargos]);

  // Real bids on the selected cargo
  const [candidatesList, setCandidatesList] = useState<ShipperDriverCandidate[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);

  const loadBids = useCallback(async (cargoId: string) => {
    if (!cargoId) return;
    setIsLoadingBids(true);
    try {
      const bids = await biddingService.fetchBidsForCargo(cargoId);
      setCandidatesList(bids.map((b) => bidToCandidate(b, trText('راننده TLD', 'TLD Driver', 'TLD Sürücüsü'))));
    } finally {
      setIsLoadingBids(false);
    }
  }, []);

  useEffect(() => {
    if (cargo?.id) loadBids(cargo.id);
  }, [cargo?.id, loadBids]);

  // View and Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [sortBy, setSortBy] = useState<SortOption>('AI_BEST');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'DIAMOND' | 'GOLD' | 'NEARBY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReviewsDriverId, setExpandedReviewsDriverId] = useState<string | null>(null);

  // Selection for Comparison (up to 3 drivers)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Driver Dossier Modal State
  const [dossierDriver, setDossierDriver] = useState<ShipperDriverCandidate | null>(null);

  const toggleSelectForCompare = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter((d) => d !== id));
    } else {
      if (selectedForComparison.length >= 3) {
        showToast('warning', trText('حداکثر ۳ راننده را می‌توانید همزمان مقایسه کنید.', 'You can compare up to 3 drivers at the same time.', 'Aynı anda en fazla 3 sürücüyü karşılaştırabilirsiniz.'));
        return;
      }
      setSelectedForComparison([...selectedForComparison, id]);
    }
  };

  // Accept bid handler — real server call through the edge function
  const handleAcceptBid = async (candidate: ShipperDriverCandidate) => {
    if (!cargo) return;
    if (acceptingBidId) return;
    setAcceptingBidId(candidate.driverId);
    try {
      const result = await biddingService.acceptDriverBid(cargo.id, candidate.driverId);

      // Update the local enriched cargo and the real cargo cache
      shipperService.acceptDriverBid(cargo.id, candidate.driverId, {
        ...candidate,
        driverId: result.driverId, // real auth UUID returned by the server
        proposedFareTomans: result.agreedFareTomans,
      });
      setSelectedCargoId(cargo.id);
      await refreshAllData();
      await loadBids(cargo.id);

      showToast(
        'success',
        trText(
          `پیشنهاد ${candidate.fullName} با کرایه ${result.agreedFareTomans.toLocaleString('fa-IR')} تومان پذیرفته شد. اکنون وجه امانی را واریز کنید.`,
          `Bid from ${candidate.fullName} accepted at ${result.agreedFareTomans} Tomans. Now deposit the escrow.`, `${candidate.fullName} adlı sürücünün teklifi ${result.agreedFareTomans} Tümen ile kabul edildi. Şimdi emanet tutarını yatırın.`
        )
      );
      onNavigate('SHIPPER_ESCROW');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const message =
        code === 'CARGO_NOT_OPEN'
          ? trText('این محموله در حال حاضر باز نیست (راننده قبلاً تخصیص یافته).', 'This cargo is not currently open (a driver has already been assigned).', 'Bu yük şu anda açık değil (bir sürücü zaten atanmış).')
          : code === 'INVALID_BID'
          ? trText('این پیشنهاد دیگر معتبر نیست.', 'This bid is no longer valid.', 'Bu teklif artık geçerli değil.')
          : code === 'INVALID_CARGO'
          ? trText('دسترسی به این محموله امکان‌پذیر نیست.', 'This cargo cannot be accessed.', 'Bu yüke erişilemiyor.')
          : trText('پذیرش پیشنهاد ناموفق بود. لطفاً دوباره تلاش کنید.', 'Failed to accept the bid. Please try again.', 'Teklif kabul edilemedi. Lütfen tekrar deneyin.');
      showToast('error', message);
      await loadBids(cargo.id);
    } finally {
      setAcceptingBidId(null);
    }
  };

  // Chat with driver
  const handleChat = (candidate: ShipperDriverCandidate) => {
    openChatForEntity(
      candidate.fullName,
      trText(`راننده ناوگان (${candidate.truckModel})`, `Fleet Driver (${candidate.truckModel})`, `Filo Sürücüsü (${candidate.truckModel})`),
      cargo?.id
    );
    onNavigate('CHAT');
  };

  // Filtered and Sorted Candidates
  const processedCandidates = useMemo(() => {
    let list = [...candidatesList];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.truckModel.toLowerCase().includes(q) ||
          c.plateNumber.includes(q)
      );
    }

    // Tier Filter
    if (tierFilter === 'DIAMOND') {
      list = list.filter((c) => c.tierBadge === 'DIAMOND');
    } else if (tierFilter === 'GOLD') {
      list = list.filter((c) => c.tierBadge === 'DIAMOND' || c.tierBadge === 'GOLD');
    } else if (tierFilter === 'NEARBY') {
      list = list.filter((c) => c.ratingScore >= 4.5);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'LOWEST_PRICE') {
        return a.proposedFareTomans - b.proposedFareTomans;
      }
      if (sortBy === 'HIGHEST_RATING') {
        return b.ratingScore - a.ratingScore;
      }
      if (sortBy === 'MOST_TRIPS') {
        return b.totalCompletedTrips - a.totalCompletedTrips;
      }
      // AI Best Match: weighted score
      const benchmark = cargo?.pricing?.aiRecommendedFareTomans || 20000000;
      const scoreOf = (c: ShipperDriverCandidate) =>
        c.ratingScore * 20 +
        (c.tierBadge === 'DIAMOND' ? 15 : c.tierBadge === 'GOLD' ? 10 : 5) +
        c.totalCompletedTrips / 100 -
        (benchmark > 0 ? (c.proposedFareTomans / benchmark) * 20 : 0);
      return scoreOf(b) - scoreOf(a);
    });

    return list;
  }, [candidatesList, searchQuery, tierFilter, sortBy, cargo?.pricing?.aiRecommendedFareTomans]);

  const comparedDrivers = useMemo(() => {
    return candidatesList.filter((c) => selectedForComparison.includes(c.driverId));
  }, [candidatesList, selectedForComparison]);

  // Pricing statistics
  const minFare = useMemo(() => {
    if (!candidatesList.length) return 0;
    return Math.min(...candidatesList.map((c) => c.proposedFareTomans));
  }, [candidatesList]);

  const maxFare = useMemo(() => {
    if (!candidatesList.length) return 0;
    return Math.max(...candidatesList.map((c) => c.proposedFareTomans));
  }, [candidatesList]);

  const aiPrice = cargo?.pricing?.aiRecommendedFareTomans || 0;

  // ---------- Empty states ----------
  if (allCargos.length === 0) {
    return (
      <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
        <AppHeader currentScreen="SHIPPER_BIDS" onNavigate={onNavigate} />
        <DesktopSidebar currentScreen="SHIPPER_BIDS" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#747686]">gavel</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('محموله‌ای برای مناقصه وجود ندارد', 'No cargo available for tender', 'İhaleye uygun yük yok')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('برای دریافت پیشنهاد رانندگان، ابتدا یک محموله ثبت و منتشر کنید.', 'To receive driver bids, first create and publish a cargo.', 'Sürücü teklifleri almak için önce bir yük oluşturup yayınlayın.')}
            </p>
            <button
              onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
            >
              {trText('ثبت محموله جدید', 'Post New Cargo', 'Yeni Yük İlan Et')}
            </button>
          </div>
        </main>
        <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
      </div>
    );
  }

  const cargoTitle = cargo?.cargoInfo.title || '—';
  const cargoNumber = cargo?.cargoNumber || '—';
  const originCity = cargo?.origin.city || '—';
  const destinationCity = cargo?.destination.city || '—';
  const weightTons = cargo?.cargoInfo.weightTons ?? 0;
  const truckTypeName = cargo?.fleetReq.truckTypeName || '—';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader
        currentScreen="SHIPPER_BIDS"
        title={trText('میز مناقصه و مقایسه رانندگان', 'Driver Bids & Comparison Desk', 'Sürücü Teklifleri ve Karşılaştırma Masası')}
        subtitle={trText('بررسی پیشنهادها، ارزیابی سوابق و عقد قرارداد هوشمند', 'Review bids, evaluate ratings and initiate digital contracts', 'Teklifleri inceleyin, puanlamaları değerlendirin ve dijital sözleşmeleri başlatın')}
        showBack={true}
        onBack={() => onNavigate('SHIPPER_ACTIVE_CARGOS')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="SHIPPER_BIDS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Top Header Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00258e]">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>{trText('مناقصه و ارزیابی کیفی ناوگان TLD', 'TLD Fleet Tender & Quality Evaluation', 'TLD Filo İhalesi ve Kalite Değerlendirmesi')}</span>
              {candidatesList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] font-bold text-[10px]">
                  {trText(`${candidatesList.length} پیشنهاد فعال`, `${candidatesList.length} Active Bids`)}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1a1b23] mt-1">
              {trText('بررسی و مقایسه رانندگان', 'Driver Review & Comparison', 'Sürücü İncelemesi ve Karşılaştırması')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('انتخاب بهترین راننده بر اساس قیمت، رتبه و سوابق حمل', 'Select the best driver based on fare, scorecard and shipper ratings', 'Navlun, puan kartı ve yük sahibi değerlendirmelerine göre en iyi sürücüyü seçin')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Cargo Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#f4f2fe] border border-[#c4c5da] px-3 py-2 rounded-xl text-xs">
              <span className="material-symbols-outlined text-[#00258e] text-[18px]">inventory_2</span>
              <select
                value={cargo?.id}
                onChange={(e) => {
                  setSelectedCargoId(e.target.value);
                  setSelectedForComparison([]);
                }}
                className="bg-transparent font-bold text-[#1a1b23] outline-none cursor-pointer text-xs"
              >
                {allCargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cargoInfo.title} ({c.cargoNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Side-by-Side Comparison Button */}
            <button
              onClick={() => setShowComparisonModal(true)}
              disabled={selectedForComparison.length < 2}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                selectedForComparison.length >= 2
                  ? 'bg-[#00258e] text-white hover:bg-[#0036c5] cursor-pointer'
                  : 'bg-[#eeedf9] text-[#747686] cursor-not-allowed border border-[#c4c5da]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
              <span>
                {trText(
                  `مقایسه رو در رو (${selectedForComparison.length} راننده)`,
                  `Side-by-Side (${selectedForComparison.length} Selected)`, `Yan Yana Karşılaştırma (${selectedForComparison.length} sürücü seçili)`
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Cargo Intelligence Overview Banner */}
        <div className="bg-gradient-to-br from-[#ffffff] via-[#f7f6ff] to-[#eef2ff] p-5 rounded-2xl border border-[#c4c5da] shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Route & Cargo */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-jetbrains text-xs font-bold text-[#00258e] px-2 py-0.5 rounded-md bg-[#dde1ff]">
                  {cargoNumber}
                </span>
                <h2 className="font-bold text-sm md:text-base text-[#1a1b23]">{cargoTitle}</h2>
              </div>

              {/* Route flow */}
              <div className="flex items-center gap-3 text-xs bg-white/80 p-3 rounded-xl border border-[#e2e1ed]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00a368]"></span>
                  <span className="font-bold text-[#1a1b23]">{originCity}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-1 text-[#747686]">
                  <span className="h-[1px] flex-1 bg-[#c4c5da]"></span>
                  <span className="material-symbols-outlined text-[16px] text-[#00258e] rtl:rotate-180">
                    arrow_forward
                  </span>
                  <span className="h-[1px] flex-1 bg-[#c4c5da]"></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
                  <span className="font-bold text-[#1a1b23]">{destinationCity}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#545f72]">
                <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                  {trText('وزن:', 'Weight:', 'Ağırlık:')} <strong>{weightTons.toLocaleString('fa-IR')} {t.tons}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                  {trText('نوع ناوگان:', 'Fleet:', 'Filo:')} <strong>{truckTypeName}</strong>
                </span>
                {aiPrice > 0 && (
                  <span className="px-2 py-0.5 rounded bg-white border border-[#e2e1ed]">
                    {trText('کرایه توافقی فعلی:', 'Current Agreed Fare:', 'Mevcut Anlaşılan Navlun:')}{' '}
                    <strong className="text-[#00a368]">{aiPrice.toLocaleString('fa-IR')} {t.currencyTomans}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Smart Pricing & Stats */}
            <div className="bg-white p-3.5 rounded-xl border border-[#e2e1ed] space-y-2 flex flex-col justify-between text-xs">
              <div className="flex justify-between items-center text-[#545f72]">
                <span>{trText('کمترین پیشنهاد:', 'Lowest Bid:', 'En Düşük Teklif:')}</span>
                <span className="font-jetbrains font-bold text-[#00a368] text-sm">
                  {minFare.toLocaleString('fa-IR')} {t.currencyTomans}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#545f72]">
                <span>{trText('بیشترین پیشنهاد:', 'Highest Bid:', 'En Yüksek Teklif:')}</span>
                <span className="font-jetbrains font-bold text-[#b27b00] text-sm">
                  {maxFare.toLocaleString('fa-IR')} {t.currencyTomans}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#545f72]">
                <span>{trText('میانگین امتیاز:', 'Avg Score:', 'Ort. Puan:')}</span>
                <span className="font-bold text-[#ff9800] flex items-center gap-0.5">
                  ★ {(candidatesList.reduce((acc, c) => acc + c.ratingScore, 0) / (candidatesList.length || 1)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tender Vitality */}
            <div className="bg-white p-3.5 rounded-xl border border-[#e2e1ed] space-y-2 flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#545f72]">{trText('پیشنهادهای دریافتی:', 'Bids Received:', 'Alınan Teklifler:')}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00258e] text-white font-bold text-[11px]">
                  {candidatesList.length} {trText('راننده', 'Drivers', 'Sürücüler')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#545f72]">{trText('پذیرش پیشنهاد:', 'Bid Acceptance:', 'Teklif Kabulü:')}</span>
                <span className="font-bold text-[#00a368]">{trText('سرتاسری در سامانه', 'End-to-end', 'Uçtan uca')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#545f72]">{trText('پرداخت:', 'Payment:', 'Ödeme:')}</span>
                <span className="font-bold text-[#00258e]">{trText('حساب امانی TLD', 'TLD Escrow', 'TLD Emanet')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter & View Control Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-2.5 text-[#747686] text-[20px]`}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={trText('جستجوی نام، پلاک یا مدل کشنده...', 'Search name, plate or truck...', 'Ad, plaka veya kamyon ara...')}
              className={`w-full h-10 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl ${
                dir === 'rtl' ? 'pr-10 pl-3' : 'pl-10 pr-3'
              } text-xs outline-none focus:border-[#00258e]`}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs font-bold">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                tierFilter === 'ALL'
                  ? 'bg-[#00258e] text-white shadow-xs'
                  : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#c4c5da]'
              }`}
            >
              {trText('همه رانندگان', 'All Drivers', 'Tüm Sürücüler')} ({candidatesList.length})
            </button>
            <button
              onClick={() => setTierFilter('DIAMOND')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                tierFilter === 'DIAMOND'
                  ? 'bg-[#00258e] text-white shadow-xs'
                  : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#c4c5da]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#ffc107]">diamond</span>
              <span>{trText('رانندگان الماس', 'Diamond Tier', 'Elmas Seviye')}</span>
            </button>
            <button
              onClick={() => setTierFilter('NEARBY')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                tierFilter === 'NEARBY'
                  ? 'bg-[#00258e] text-white shadow-xs'
                  : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#c4c5da]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#00a368]">star</span>
              <span>{trText('امتیاز ۴.۵+', '4.5+ Rating', '4.5+ Puan')}</span>
            </button>
          </div>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#747686] hidden sm:inline">{trText('مرتب‌سازی:', 'Sort:', 'Sırala:')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-2.5 text-xs font-bold text-[#1a1b23] outline-none"
              >
                <option value="AI_BEST">{trText('🌟 بهترین تطابق', '🌟 Best Match', '🌟 En İyi Eşleşme')}</option>
                <option value="LOWEST_PRICE">{trText('💰 کمترین کرایه', '💰 Lowest Fare', '💰 En Düşük Navlun')}</option>
                <option value="HIGHEST_RATING">{trText('⭐ بالاترین امتیاز', '⭐ Highest Rating', '⭐ En Yüksek Puan')}</option>
                <option value="MOST_TRIPS">{trText('🏆 بیشترین سفر موفق', '🏆 Most Trips', '🏆 En Çok Sefer')}</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#f4f2fe] p-1 rounded-xl border border-[#c4c5da]">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-[#00258e] shadow-xs' : 'text-[#747686] hover:text-[#1a1b23]'
                }`}
                title={trText('نمای کارت‌ها', 'Cards View', 'Kart Görünümü')}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('MATRIX')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'MATRIX' ? 'bg-white text-[#00258e] shadow-xs' : 'text-[#747686] hover:text-[#1a1b23]'
                }`}
                title={trText('نمای ماتریس مقایسه', 'Comparison Matrix', 'Karşılaştırma Matrisi')}
              >
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
              </button>
              <button
                onClick={() => setViewMode('RADAR')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'RADAR' ? 'bg-white text-[#00258e] shadow-xs' : 'text-[#747686] hover:text-[#1a1b23]'
                }`}
                title={trText('نمای رادار ناوگان', 'Fleet Radar', 'Filo Radarı')}
              >
                <span className="material-symbols-outlined text-[18px]">radar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Empty state for bids */}
        {isLoadingBids && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-10 text-center">
            <span className="material-symbols-outlined text-3xl text-[#00258e] animate-spin">progress_activity</span>
            <p className="text-xs text-[#545f72] mt-2">{trText('در حال دریافت پیشنهادهای رانندگان...', 'Receiving driver bids...', 'Sürücü teklifleri alınıyor...')}</p>
          </div>
        )}

        {!isLoadingBids && candidatesList.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#747686]">mark_email_unread</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('هنوز پیشنهادی دریافت نشده', 'No bids received yet', 'Henüz teklif alınmadı')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('محموله شما منتشر شده است؛ به محض ثبت پیشنهاد توسط رانندگان، در همین صفحه نمایش داده می‌شود.', 'Your cargo is published; as soon as drivers submit bids, they will appear on this page.', 'Yükünüz yayınlandı; sürücüler teklif verdikçe bu sayfada görünecek.')}
            </p>
          </div>
        )}

        {/* MAIN CONTENT AREA ACCORDING TO VIEW MODE */}

        {/* 1. CARDS GRID VIEW */}
        {viewMode === 'CARDS' && candidatesList.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {processedCandidates.map((candidate, idx) => {
              const isSelectedForCompare = selectedForComparison.includes(candidate.driverId);
              const isAiTopPick = idx === 0 && sortBy === 'AI_BEST';
              const isLowestPrice = candidate.proposedFareTomans === minFare;
              const isAccepted = candidate.status === 'ACCEPTED';

              return (
                <div
                  key={candidate.driverId}
                  className={`bg-white rounded-2xl border-2 transition-all flex flex-col justify-between shadow-xs hover:shadow-md relative overflow-hidden ${
                    isSelectedForCompare
                      ? 'border-[#00258e] ring-2 ring-[#00258e]/20'
                      : isAiTopPick
                      ? 'border-[#00258e]/70 bg-gradient-to-b from-[#f9f8ff] to-white'
                      : 'border-[#c4c5da] hover:border-[#00258e]/40'
                  }`}
                >
                  {/* Top Recommendation Badge */}
                  {isAiTopPick && !isAccepted && (
                    <div className="bg-[#00258e] text-white text-[10px] font-bold py-1 px-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#fbbc04]">smart_toy</span>
                        <span>{trText('پیشنهاد منتخب', 'Recommended Top Choice', 'Önerilen İlk Tercih')}</span>
                      </span>
                      <span className="text-[9px] opacity-80">{trText('بالاترین تطابق با شرایط بار', 'Best Match', 'En İyi Eşleşme')}</span>
                    </div>
                  )}
                  {isAccepted && (
                    <div className="bg-[#00a368] text-white text-[10px] font-bold py-1 px-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>{trText('این پیشنهاد پذیرفته شده است', 'Bid Accepted', 'Teklif Kabul Edildi')}</span>
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-4 flex-1">
                    {/* Header: Driver Info & Compare Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#00258e] to-[#2e59d9] text-white font-black text-lg flex items-center justify-center shadow-xs overflow-hidden">
                            {candidate.avatarUrl ? (
                              <img src={candidate.avatarUrl} alt={candidate.fullName} className="w-full h-full object-cover" />
                            ) : (
                              candidate.fullName.slice(0, 1)
                            )}
                          </div>
                          {candidate.ratingScore > 0 && (
                            <span
                              className="absolute -bottom-1 -right-1 px-1 rounded-full bg-[#00a368] text-white flex items-center justify-center text-[9px] font-bold border-2 border-white"
                              title={trText('امتیاز راننده در سامانه', 'Driver Platform Rating', 'Sürücü Platform Puanı')}
                            >
                              ★
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-base text-[#1a1b23]">{candidate.fullName}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${
                                candidate.tierBadge === 'DIAMOND'
                                  ? 'bg-[#dde1ff] text-[#001356]'
                                  : candidate.tierBadge === 'GOLD'
                                  ? 'bg-[#fff0c2] text-[#7a5900]'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {candidate.tierBadge === 'DIAMOND' && '★ '}
                              {candidate.tierBadge === 'DIAMOND'
                                ? trText('راننده الماس', 'Diamond', 'Elmas')
                                : candidate.tierBadge === 'GOLD'
                                ? trText('راننده طلایی', 'Gold', 'Altın')
                                : trText('نقره‌ای', 'Silver', 'Gümüş')}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#545f72] flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-[#ff9800]">
                              ★ {candidate.ratingScore > 0 ? candidate.ratingScore : '—'}
                            </span>
                            <span className="text-[#c4c5da]">|</span>
                            <span>{candidate.totalCompletedTrips} {trText('سفر ثبت‌شده', 'Trips', 'Seferler')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compare Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleSelectForCompare(candidate.driverId)}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelectedForCompare
                            ? 'bg-[#00258e] text-white border-[#00258e]'
                            : 'bg-[#fbf8ff] text-[#545f72] border-[#c4c5da] hover:border-[#00258e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isSelectedForCompare ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span>{trText('مقایسه', 'Compare', 'Karşılaştır')}</span>
                      </button>
                    </div>

                    {/* Performance Gauges (On-Time) */}
                    {candidate.onTimeDeliveryRate > 0 && (
                      <div className="bg-[#fbf8ff] p-2.5 rounded-xl border border-[#e2e1ed] space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-[#545f72]">
                          <span>{trText('تحویل به‌موقع:', 'On-Time:', 'Zamanında:')}</span>
                          <span className="font-bold text-[#00a368]">%{candidate.onTimeDeliveryRate.toLocaleString('fa-IR')}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e2e1ed] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00a368] rounded-full"
                            style={{ width: `${Math.min(100, candidate.onTimeDeliveryRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Truck & Equipment Specifications */}
                    <div className="bg-[#f4f2fe] p-3 rounded-xl border border-[#c4c5da] text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#545f72]">{trText('ناوگان:', 'Vehicle:', 'Araç:')}</span>
                        <span className="font-bold text-[#1a1b23]">
                          {candidate.truckBrand} {candidate.truckModel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#545f72]">{trText('پلاک:', 'Plate:', 'Plaka:')}</span>
                        <span className="font-jetbrains font-bold text-[#00258e] text-xs px-2 py-0.5 rounded bg-white border border-[#c4c5da]">
                          {candidate.plateNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#545f72]">{trText('زمان آمادگی بارگیری:', 'Ready to Load:', 'Yüklemeye Hazır:')}</span>
                        <span className="font-bold text-[#1a1b23]">{candidate.bidSubmittedAt !== '—' ? candidate.bidSubmittedAt : candidate.truckType}</span>
                      </div>
                    </div>

                    {/* Driver's Quotation Note */}
                    {candidate.driverNote && (
                      <div className="bg-[#fff9e6] p-2.5 rounded-xl border border-[#ffe082] text-[11px] text-[#7a5900] flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">format_quote</span>
                        <span className="italic leading-relaxed">{candidate.driverNote}</span>
                      </div>
                    )}

                    {/* Proposed Fare Box */}
                    <div className="bg-gradient-to-r from-[#00258e]/10 via-[#f4f2fe] to-[#00a368]/10 p-3.5 rounded-xl border border-[#c4c5da] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#545f72] block font-bold">
                          {trText('کرایه پیشنهادی راننده:', 'Driver Proposed Fare:', 'Sürücü Teklif Navlunu:')}
                        </span>
                        {isLowestPrice && (
                          <span className="px-1.5 py-0.5 rounded bg-[#00a368] text-white text-[9px] font-bold">
                            {trText('کمترین نرخ پیشنهادی', 'Lowest Rate', 'En Düşük Fiyat')}
                          </span>
                        )}
                      </div>
                      <div className="text-end">
                        <span className="font-jetbrains font-black text-lg text-[#00258e] block" dir="ltr">
                          {candidate.fareFormatted}
                        </span>
                        {aiPrice > 0 && (
                          <span className="text-[10px] text-[#747686]">
                            {candidate.proposedFareTomans < aiPrice
                              ? trText(
                                  `${((aiPrice - candidate.proposedFareTomans) / 1000).toLocaleString('fa-IR')} هزار تومان زیر نرخ مبنا`,
                                  `${((aiPrice - candidate.proposedFareTomans) / 1000).toLocaleString()}k below base`, `${((aiPrice - candidate.proposedFareTomans) / 1000).toLocaleString()} bin Tümen taban fiyatın altında`
                                )
                              : trText('مطابق یا بالاتر از نرخ مبنا', 'At or above base rate', 'Taban fiyatta veya üzerinde')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 space-y-2">
                    {/* Primary Accept Button */}
                    <button
                      type="button"
                      onClick={() => handleAcceptBid(candidate)}
                      disabled={acceptingBidId !== null || isAccepted}
                      className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        isAccepted
                          ? 'bg-[#00a368]/15 text-[#00a368] cursor-default'
                          : acceptingBidId === candidate.driverId
                          ? 'bg-[#00258e]/60 text-white'
                          : 'bg-[#00258e] hover:bg-[#0036c5] text-white'
                      }`}
                    >
                      {acceptingBidId === candidate.driverId ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>{trText('در حال ثبت پذیرش...', 'Accepting...', 'Kabul ediliyor...')}</span>
                        </>
                      ) : isAccepted ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>{trText('پذیرفته شد — ادامه با واریز امانی', 'Accepted — Continue with Escrow', 'Kabul edildi — Emanet ile devam edin')}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>{trText('انتخاب راننده و ادامه با حساب امانی', 'Accept & Continue to Escrow', 'Kabul Et ve Emanete Geç')}</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleChat(candidate)}
                        className="py-2 rounded-xl bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold border border-[#c4c5da] flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px]"
                        title={trText('گفتگوی مستقیم با راننده', 'Chat with Driver', 'Sürücüyle Sohbet')}
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span className="hidden sm:inline">{trText('گفتگو', 'Chat', 'Sohbet')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDossierDriver(candidate)}
                        className="py-2 rounded-xl bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold border border-[#c4c5da] flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px]"
                        title={trText('مشاهده مشخصات راننده', 'View Driver Details', 'Sürücü Detaylarını Gör')}
                      >
                        <span className="material-symbols-outlined text-[16px]">badge</span>
                        <span className="hidden sm:inline">{trText('مشخصات', 'Details', 'Detaylar')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. ADVANCED COMPARISON MATRIX VIEW */}
        {viewMode === 'MATRIX' && candidatesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e1ed] pb-4">
              <div>
                <h3 className="font-black text-lg text-[#1a1b23]">
                  {trText('ماتریس مقایسه جامع رانندگان', 'Multi-Dimensional Driver Comparison Matrix', 'Çok Boyutlu Sürücü Karşılaştırma Matrisi')}
                </h3>
                <p className="text-xs text-[#545f72] mt-0.5">
                  {trText('مقایسه مشخصات فنی، مالی و سوابق ناوگان در یک نگاه', 'Direct comparison of technical, financial and fleet metrics', 'Teknik, finansal ve filo metriklerinin doğrudan karşılaştırması')}
                </p>
              </div>

              <div className="text-xs font-bold text-[#00258e] bg-[#f4f2fe] px-3 py-1.5 rounded-xl border border-[#c4c5da]">
                {candidatesList.length} {trText('راننده در حال رقابت', 'Drivers competing', 'Yarışan sürücüler')}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#c4c5da] bg-[#fbf8ff]">
                    <th className="p-3.5 font-bold text-[#545f72] w-48">{trText('معیار سنجش و ارزیابی', 'Evaluation Metric', 'Değerlendirme Metriği')}</th>
                    {candidatesList.map((d) => (
                      <th key={d.driverId} className="p-3.5 text-center font-bold text-[#1a1b23] min-w-[200px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-full bg-[#00258e] text-white font-bold flex items-center justify-center text-sm overflow-hidden">
                            {d.avatarUrl ? (
                              <img src={d.avatarUrl} alt={d.fullName} className="w-full h-full object-cover" />
                            ) : (
                              d.fullName.slice(0, 1)
                            )}
                          </div>
                          <span className="font-extrabold text-sm">{d.fullName}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] bg-[#dde1ff] text-[#001356] font-bold">
                            {d.tierBadge === 'DIAMOND' ? trText('★ الماس', '★ Diamond', '★ Elmas') : d.tierBadge === 'GOLD' ? trText('طلایی', 'Gold', 'Altın') : trText('نقره‌ای', 'Silver', 'Gümüş')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e1ed]">
                  {/* Row: Fare */}
                  <tr className="hover:bg-[#fbf8ff]">
                    <td className="p-3.5 font-bold text-[#1a1b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#00258e]">payments</span>
                      <span>{trText('کرایه پیشنهادی (تومان)', 'Offered Rate (Tomans)', 'Teklif Fiyatı (Tümen)')}</span>
                    </td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center">
                        <span className="font-jetbrains font-extrabold text-sm text-[#00258e]" dir="ltr">
                          {d.fareFormatted}
                        </span>
                        {d.proposedFareTomans === minFare && (
                          <span className="block text-[10px] text-[#00a368] font-bold mt-0.5">
                            {trText('✓ کمترین کرایه', '✓ Lowest Fare', '✓ En Düşük Navlun')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Rating */}
                  <tr className="hover:bg-[#fbf8ff]">
                    <td className="p-3.5 font-bold text-[#1a1b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#ff9800]">star</span>
                      <span>{trText('امتیاز رضایت و ستاره', 'Rating & Star Score', 'Puan ve Yıldız Skoru')}</span>
                    </td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center font-bold text-[#b27b00]">
                        ★ {d.ratingScore > 0 ? d.ratingScore : '—'} ({d.totalCompletedTrips} {trText('سفر', 'Trips', 'Seferler')})
                      </td>
                    ))}
                  </tr>

                  {/* Row: On-time delivery */}
                  <tr className="hover:bg-[#fbf8ff]">
                    <td className="p-3.5 font-bold text-[#1a1b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#00a368]">schedule</span>
                      <span>{trText('تحویل به‌موقع (On-Time)', 'On-Time Rate', 'Zamanında Teslim Oranı')}</span>
                    </td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center font-bold text-[#00a368]">
                        {d.onTimeDeliveryRate > 0 ? `%${d.onTimeDeliveryRate.toLocaleString('fa-IR')}` : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Truck specs */}
                  <tr className="hover:bg-[#fbf8ff]">
                    <td className="p-3.5 font-bold text-[#1a1b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#00258e]">local_shipping</span>
                      <span>{trText('کشنده و بارگیر', 'Truck & Trailer', 'Kamyon ve Dorse')}</span>
                    </td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center text-[#545f72]">
                        <div className="font-bold text-[#1a1b23]">{d.truckBrand} {d.truckModel}</div>
                        <div className="text-[11px] font-jetbrains">{d.plateNumber}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Driver note */}
                  <tr className="hover:bg-[#fbf8ff]">
                    <td className="p-3.5 font-bold text-[#1a1b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#b27b00]">format_quote</span>
                      <span>{trText('یادداشت راننده', 'Driver Note', 'Sürücü Notu')}</span>
                    </td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center text-[#545f72] max-w-[220px]">
                        {d.driverNote || '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Action Button */}
                  <tr>
                    <td className="p-3.5 font-bold text-[#1a1b23]">{trText('انتخاب نهایی', 'Final Selection', 'Nihai Seçim')}</td>
                    {candidatesList.map((d) => (
                      <td key={d.driverId} className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleAcceptBid(d)}
                          disabled={acceptingBidId !== null || d.status === 'ACCEPTED'}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                            d.status === 'ACCEPTED'
                              ? 'bg-[#00a368]/15 text-[#00a368] cursor-default'
                              : 'bg-[#00258e] hover:bg-[#0036c5] text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {d.status === 'ACCEPTED' ? 'check_circle' : 'check_circle'}
                          </span>
                          <span>{d.status === 'ACCEPTED' ? trText('پذیرفته شد', 'Accepted', 'Kabul Edildi') : trText('انتخاب این راننده', 'Select Driver', 'Sürücü Seç')}</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. RADAR VIEW */}
        {viewMode === 'RADAR' && candidatesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e1ed] pb-4">
              <div>
                <h3 className="font-black text-lg text-[#1a1b23]">
                  {trText('رادار پیشنهادهای ناوگان', 'Fleet Bid Radar', 'Filo Teklif Radarı')}
                </h3>
                <p className="text-xs text-[#545f72] mt-0.5">
                  {trText('مبدأ: ', 'Origin: ', 'Kaynak: ')} <strong>{originCity}</strong> — {trText('مقصد:', 'Destination:', 'Varış:')} <strong>{destinationCity}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-3 h-3 rounded-full bg-[#00a368] animate-pulse"></span>
                <span>{trText('به‌روزرسانی زنده پیشنهادها', 'Live bid updates', 'Canlı teklif güncellemeleri')}</span>
              </div>
            </div>

            {/* Radar Visual */}
            <div className="relative bg-[#0f172a] rounded-2xl h-80 overflow-hidden flex items-center justify-center border border-[#334155]">
              {/* Radar Grid Circles */}
              <div className="absolute w-72 h-72 rounded-full border border-[#00258e]/30"></div>
              <div className="absolute w-52 h-52 rounded-full border border-[#00258e]/40"></div>
              <div className="absolute w-32 h-32 rounded-full border border-[#00258e]/50"></div>
              <div className="absolute w-12 h-12 rounded-full border border-[#00258e]/60"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-[#00258e]/20"></div>
                <div className="h-full w-[1px] bg-[#00258e]/20 absolute"></div>
              </div>

              {/* Origin Center Point */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  <span className="material-symbols-outlined text-[16px]">warehouse</span>
                </div>
                <span className="bg-black/70 text-white font-bold text-[10px] px-2 py-0.5 rounded mt-1 backdrop-blur-xs">
                  {originCity}
                </span>
              </div>

              {/* Bid pins positioned by rank */}
              {processedCandidates.slice(0, 3).map((d, idx) => {
                const positions = [
                  'top-16 right-32',
                  'bottom-16 left-28',
                  'top-12 left-36',
                ];
                const colors = ['bg-[#00a368]', 'bg-[#ff9800]', 'bg-[#00258e]'];
                return (
                  <div
                    key={d.driverId}
                    onClick={() => handleAcceptBid(d)}
                    className={`absolute ${positions[idx]} z-20 flex flex-col items-center cursor-pointer group`}
                  >
                    <div className={`w-7 h-7 rounded-full ${colors[idx]} text-white flex items-center justify-center text-[12px] font-bold border-2 border-white shadow-md group-hover:scale-125 transition-transform`}>
                      {idx + 1}
                    </div>
                    <span className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded mt-1 font-bold group-hover:bg-[#00258e]">
                      {d.fullName} • {d.fareFormatted}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Radar Quick Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {processedCandidates.map((d) => (
                <div
                  key={d.driverId}
                  className="p-4 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#1a1b23]">{d.fullName}</div>
                    <div className="text-[#545f72] text-[11px] font-jetbrains">{d.fareFormatted}</div>
                  </div>
                  <button
                    onClick={() => handleAcceptBid(d)}
                    disabled={acceptingBidId !== null || d.status === 'ACCEPTED'}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                      d.status === 'ACCEPTED'
                        ? 'bg-[#00a368]/15 text-[#00a368]'
                        : 'bg-[#00258e] text-white hover:bg-[#0036c5]'
                    }`}
                  >
                    {d.status === 'ACCEPTED' ? trText('پذیرفته شد', 'Accepted', 'Kabul Edildi') : trText('انتخاب', 'Select', 'Seç')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL 1: SIDE-BY-SIDE COMPARISON MODAL */}
        {showComparisonModal && comparedDrivers.length >= 2 && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-vazirmatn">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border border-[#c4c5da] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#00258e]">compare_arrows</span>
                  <h2 className="text-xl font-black text-[#1a1b23]">
                    {trText('جدول مقایسه رانندگان منتخب', 'Selected Drivers Deep Comparison', 'Seçilen Sürücülerin Ayrıntılı Karşılaştırması')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="w-8 h-8 rounded-full bg-[#fbf8ff] flex items-center justify-center text-[#747686] hover:bg-[#eeedf9] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e1ed] bg-[#fbf8ff]">
                      <th className="p-3 font-bold text-[#545f72]">{trText('معیار ارزیابی', 'Metric', 'Metrik')}</th>
                      {comparedDrivers.map((d) => (
                        <th key={d.driverId} className="p-3 font-extrabold text-sm text-[#00258e] text-center">
                          {d.fullName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e1ed]">
                    <tr>
                      <td className="p-3 font-bold text-[#1a1b23]">{trText('کرایه پیشنهادی', 'Offered Rate', 'Teklif Fiyatı')}</td>
                      {comparedDrivers.map((d) => (
                        <td key={d.driverId} className="p-3 text-center font-jetbrains font-bold text-sm text-[#00258e]">
                          {d.fareFormatted}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#1a1b23]">{trText('امتیاز رضایت و ستاره', 'Scorecard', 'Puan Kartı')}</td>
                      {comparedDrivers.map((d) => (
                        <td key={d.driverId} className="p-3 text-center font-bold text-[#b26a00]">
                          ★ {d.ratingScore > 0 ? d.ratingScore : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#1a1b23]">{trText('تحویل به‌موقع (On-Time)', 'On-Time %', 'Zamanında %')}</td>
                      {comparedDrivers.map((d) => (
                        <td key={d.driverId} className="p-3 text-center font-bold text-[#00a368]">
                          {d.onTimeDeliveryRate > 0 ? `%${d.onTimeDeliveryRate.toLocaleString('fa-IR')}` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#1a1b23]">{trText('مدل و پلاک ناوگان', 'Fleet Model & Plate', 'Filo Modeli ve Plaka')}</td>
                      {comparedDrivers.map((d) => (
                        <td key={d.driverId} className="p-3 text-center text-[#545f72]">
                          {d.truckBrand} {d.truckModel} ({d.plateNumber})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#1a1b23]">{trText('یادداشت راننده', 'Driver Note', 'Sürücü Notu')}</td>
                      {comparedDrivers.map((d) => (
                        <td key={d.driverId} className="p-3 text-center font-bold text-[#1a1b23] max-w-[200px]">
                          {d.driverNote || '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#e2e1ed]">
                {comparedDrivers.map((d) => (
                  <button
                    key={d.driverId}
                    onClick={() => {
                      setShowComparisonModal(false);
                      handleAcceptBid(d);
                    }}
                    disabled={acceptingBidId !== null || d.status === 'ACCEPTED'}
                    className={`py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 shadow-sm ${
                      d.status === 'ACCEPTED'
                        ? 'bg-[#00a368]/15 text-[#00a368] cursor-default'
                        : 'bg-[#00258e] text-white hover:bg-[#0036c5]'
                    }`}
                  >
                    <span>{d.status === 'ACCEPTED' ? trText(`پذیرفته شد`, 'Accepted') : trText(`انتخاب و ادامه با ${d.fullName}`, `Select ${d.fullName}`)}</span>
                    <span className="material-symbols-outlined text-[16px] rtl:rotate-180">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: DRIVER DETAILS */}
        {dossierDriver && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-vazirmatn">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-[#c4c5da] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#00258e]">badge</span>
                  <h3 className="font-black text-base text-[#1a1b23]">
                    {trText('مشخصات راننده', 'Driver Details', 'Sürücü Detayları')}
                  </h3>
                </div>
                <button
                  onClick={() => setDossierDriver(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#747686] hover:bg-gray-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Bio Banner */}
              <div className="bg-[#f4f2fe] p-4 rounded-2xl border border-[#c4c5da] flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00258e] text-white text-2xl font-black flex items-center justify-center shadow-md overflow-hidden">
                  {dossierDriver.avatarUrl ? (
                    <img src={dossierDriver.avatarUrl} alt={dossierDriver.fullName} className="w-full h-full object-cover" />
                  ) : (
                    dossierDriver.fullName.slice(0, 1)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-[#1a1b23]">{dossierDriver.fullName}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-[#00258e] text-white text-[10px] font-bold">
                      {dossierDriver.tierBadge}
                    </span>
                  </div>
                  <div className="text-xs text-[#545f72] mt-1 space-y-0.5">
                    <div>{trText('امتیاز سامانه:', 'Platform Rating:', 'Platform Puanı:')} ★ {dossierDriver.ratingScore > 0 ? dossierDriver.ratingScore : '—'}</div>
                    <div>{trText('سفرهای ثبت‌شده:', 'Recorded Trips:', 'Kayıtlı Seferler:')} {dossierDriver.totalCompletedTrips.toLocaleString('fa-IR')}</div>
                  </div>
                </div>
              </div>

              {/* Registered Data Grid */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-[#1a1b23]">{trText('اطلاعات ثبت‌شده در سامانه:', 'Registered Information:', 'Kayıtlı Bilgiler:')}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[10px] text-[#747686]">{trText('ناوگان:', 'Vehicle:', 'Araç:')}</div>
                    <div className="font-jetbrains font-bold text-[#00258e]">{dossierDriver.truckBrand} {dossierDriver.truckModel}</div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[10px] text-[#747686]">{trText('پلاک:', 'Plate:', 'Plaka:')}</div>
                    <div className="font-jetbrains font-bold text-[#00258e]">{dossierDriver.plateNumber}</div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[10px] text-[#747686]">{trText('تحویل به‌موقع:', 'On-Time Rate:', 'Zamanında Oranı:')}</div>
                    <div className="font-bold text-[#00a368]">
                      {dossierDriver.onTimeDeliveryRate > 0 ? `%${dossierDriver.onTimeDeliveryRate.toLocaleString('fa-IR')}` : '—'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[10px] text-[#747686]">{trText('نوع بارگیر مورد نیاز:', 'Required Trailer:', 'Gerekli Dorse:')}</div>
                    <div className="font-bold text-[#00258e]">{dossierDriver.truckType}</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#747686] leading-relaxed">
                  {trText('استعلام رسمی مدارک (کارت هوشمند، کارت سلامت و بیمه) پس از تخصیص نهایی و پیش از صدور قرارداد توسط واحد ارزیابی TLD انجام می‌شود.', 'Official credential checks (smart card, health card and insurance) are performed by the TLD evaluation unit after final assignment, before contract issuance.', 'Resmî belge kontrolleri (akıllı kart, sağlık kartı ve sigorta) nihai atamadan sonra, sözleşme düzenlenmeden önce TLD değerlendirme birimi tarafından yapılır.')}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = dossierDriver;
                    setDossierDriver(null);
                    handleAcceptBid(d);
                  }}
                  disabled={acceptingBidId !== null || dossierDriver.status === 'ACCEPTED'}
                  className="w-full py-3 rounded-xl bg-[#00258e] text-white font-bold text-xs hover:bg-[#0036c5] cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>
                    {dossierDriver.status === 'ACCEPTED'
                      ? trText('این پیشنهاد پذیرفته شده است', 'This bid is already accepted', 'Bu teklif zaten kabul edildi')
                      : trText('تایید و ادامه با حساب امانی', 'Verify & Continue to Escrow', 'Doğrula ve Emanete Geç')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav currentScreen="SHIPPER_BIDS" onNavigate={onNavigate} />
    </div>
  );
};
