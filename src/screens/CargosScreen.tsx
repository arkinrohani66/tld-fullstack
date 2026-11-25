import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, CargoItem } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { biddingService } from '../services/biddingService';
import { pdfExportService } from '../services/pdfExportService';
import { shipperService } from '../services/shipperService';

interface CargosScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const CargosScreen: React.FC<CargosScreenProps> = ({ onNavigate }) => {
  const { role, showToast } = useAuth();
  const { dir, t, trText } = useLanguage();
  const {
    cargos,
    selectedCargoId,
    setSelectedCargoId,
    openChatForEntity,
    addCargo,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<'RECOMMENDED' | 'ALL' | 'IN_TRANSIT' | 'PENDING'>('RECOMMENDED');
  const [searchTerm, setSearchTerm] = useState('');
  const [truckFilter, setTruckFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidCargo, setBidCargo] = useState<CargoItem | null>(null);
  const [proposedFare, setProposedFare] = useState('38000000');
  const [readyTime, setReadyTime] = useState('15:00 Today');
  const [driverNote, setDriverNote] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Shipper new cargo state
  const [newTitle, setNewTitle] = useState('');
  const [newOrigin, setNewOrigin] = useState('Tehran');
  const [newDestination, setNewDestination] = useState('Mashhad');
  const [newWeight, setNewWeight] = useState('22 Tons');
  const [newPrice, setNewPrice] = useState('35,000,000 Tomans');

  const handleDownloadSelectedCargoPDF = async (cargo: CargoItem) => {
    try {
      setIsExportingPDF(true);
      showToast('info', trText(`در حال صدور مانیفست و بارنامه PDF برای ${cargo.title}...`, `Exporting PDF manifest for ${cargo.title}...`, `${cargo.title} için PDF manifest ve irsaliye düzenleniyor...`));
      const fullCargo = shipperService.getCargoById(cargo.id) || {
        id: cargo.id,
        cargoNumber: `TLD-CRG-${cargo.id}`,
        origin: { city: cargo.origin, address: `Origin Warehouse ${cargo.origin}` },
        destination: { city: cargo.destination, address: `Destination Unloading ${cargo.destination}` },
        cargoInfo: {
          title: cargo.title,
          weightTons: parseFloat(cargo.weight) || 22,
          packaging: 'Standard Palletized',
          declaredValueTomans: 600000000,
          specialInstructions: (cargo as any).specialNotes || 'Secured load and certified waybill',
        },
        fleetReq: { truckTypeName: cargo.truckType },
        pricing: { finalOfferedFareTomans: parseInt(cargo.price.replace(/\D/g, '')) || 30000000, distanceKm: 800 },
        insurance: { underwriter: 'Iran Insurance', calculatedPremiumTomans: 450000 },
        assignedDriver: {
          fullName: 'Mohammad Reza Soltani',
          plateNumber: '12 E 345 IR 22',
        },
      } as any;

      const waybill = shipperService.getElectronicWaybill(cargo.id);
      await pdfExportService.exportCargoManifestPDF(fullCargo, waybill);
      showToast('success', trText('فایل PDF مانیفست با موفقیت دریافت شد.', 'PDF Cargo manifest exported successfully.', 'Manifest PDF dosyası başarıyla indirildi.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در صدور PDF مانیفست.', 'Failed to export PDF manifest.', 'Manifest PDF oluşturulurken hata oluştu.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  const filteredCargos = cargos.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (truckFilter !== 'ALL' && !c.truckType.includes(truckFilter)) return false;

    if (activeTab === 'IN_TRANSIT') return c.status === 'IN_TRANSIT';
    if (activeTab === 'PENDING') return c.status === 'PENDING_DRIVER';
    if (activeTab === 'RECOMMENDED') {
      return c.truckType.includes('یخچالی') || c.truckType.includes('چادری') || c.status === 'PENDING_DRIVER';
    }
    return true;
  });

  const selectedCargo = cargos.find((c) => c.id === selectedCargoId) || filteredCargos[0] || cargos[0];

  const handleCreateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('error', trText('عنوان محموله الزامی است', 'Cargo title is required', 'Yük başlığı zorunludur'));
      return;
    }
    try {
      const newId = await addCargo({
        title: newTitle.trim(),
        origin: newOrigin,
        destination: newDestination,
        status: 'PENDING_DRIVER',
        eta: trText('در انتظار', 'Pending', 'Beklemede'),
        weight: newWeight,
        truckType: 'تریلی کفی',
        price: newPrice,
      });
      setShowAddModal(false);
      setNewTitle('');
      showToast('success', trText(`محموله ${newId} با موفقیت در سامانه بارگذاری شد.`, `Cargo ${newId} published successfully.`, `${newId} numaralı yük sisteme başarıyla yüklendi.`));
    } catch (err) {
      console.error('Create cargo failed:', err);
      showToast('error', trText('ثبت محموله ناموفق بود. لطفاً دوباره تلاش کنید.', 'Failed to publish the cargo. Please try again.', 'Yük kaydedilemedi. Lütfen tekrar deneyin.'));
    }
  };

  const handleOpenBidModal = (cargo: CargoItem) => {
    setBidCargo(cargo);
    const numericPrice = parseInt(cargo.price.replace(/[^\d]/g, ''), 10) || 35000000;
    setProposedFare((numericPrice * 1.05).toString());
    setShowBidModal(true);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidCargo) return;

    try {
      await biddingService.submitBid({
        cargoId: bidCargo.id,
        cargoTitle: bidCargo.title,
        originCity: bidCargo.origin,
        destinationCity: bidCargo.destination,
        originalPrice: bidCargo.price,
        proposedFareAmount: Number(proposedFare) || 35000000,
        readyToLoadTime: readyTime,
        driverNotes: driverNote,
        cargoWeight: bidCargo.weight,
        truckTypeRequired: bidCargo.truckType,
      });
    } catch (err) {
      console.error('Submitting bid failed:', err);
      showToast('error', trText('ثبت پیشنهاد انجام نشد. لطفاً دوباره تلاش کنید.', 'Could not submit your bid. Please try again.', 'Teklif gönderilemedi. Lütfen tekrar deneyin.'));
      return;
    }

    showToast('success', trText('پیشنهاد قیمت شما با موفقیت برای صاحب کالا ارسال شد.', 'Your bid was submitted to the shipper successfully.', 'Fiyat teklifiniz yük sahibine başarıyla gönderildi.'));
    setShowBidModal(false);
    onNavigate('DRIVER_BIDS');
  };

  const handleContact = (cargo: CargoItem) => {
    const contactName = cargo.driverName || trText('مرکز دیسپچ محموله', 'Cargo Dispatch Desk', 'Yük Sevk Merkezi');
    openChatForEntity(contactName, 'Dispatch', cargo.id);
    onNavigate('CHAT');
  };

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader
        currentScreen="CARGOS"
        title={t.cargoHallTitle}
        subtitle={t.cargoHallSubtitle}
        showBack={true}
        onBack={() => onNavigate(homeScreen)}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="CARGOS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-28px">local_shipping</span>
              <h1 className="font-vazirmatn text-xl md:text-2xl font-black text-[#1a1b23]">
                {t.cargoHallTitle}
              </h1>
            </div>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {t.cargoHallDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {role === 'SHIPPER' ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#00258e] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#0036c5] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-18px">add_box</span>
                <span>{t.postCargoBtn}</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('DRIVER_BIDS')}
                className="bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] border border-[#c4c5da] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-18px">price_check</span>
                <span>{t.myActiveBidsBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-3 text-[#747686] text-20px`}>search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl ${dir === 'rtl' ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-xs outline-none focus:border-[#00258e]`}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto text-xs font-bold">
            <select
              value={truckFilter}
              onChange={(e) => setTruckFilter(e.target.value)}
              className="h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none text-xs"
            >
              <option value="ALL">{t.allFleetTypes}</option>
              <option value="یخچالی">{t.reeferTrailer}</option>
              <option value="چادری">{t.curtainsiderTrailer}</option>
              <option value="کفی">{t.flatbedTrailer}</option>
              <option value="کمپرسی">{t.tipperTrailer}</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('RECOMMENDED')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'RECOMMENDED'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] hover:bg-[#eeedf9] border border-[#c4c5da]'
            }`}
          >
            <span className="material-symbols-outlined text-16px text-[#fbbc04]">smart_toy</span>
            <span>{t.recommendedCargos}</span>
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] hover:bg-[#eeedf9] border border-[#c4c5da]'
            }`}
          >
            {t.allCargos} ({cargos.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] hover:bg-[#eeedf9] border border-[#c4c5da]'
            }`}
          >
            {t.readyForBids}
          </button>
          <button
            onClick={() => setActiveTab('IN_TRANSIT')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'IN_TRANSIT'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] hover:bg-[#eeedf9] border border-[#c4c5da]'
            }`}
          >
            {t.inTransit}
          </button>
        </div>

        {/* Cargos List & Detailed Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cargos Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {filteredCargos.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-[#c4c5da] space-y-3">
                <div className="w-14 h-14 bg-[#eeedf9] text-[#00258e] rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('محموله‌ای ثبت نشده است', 'No Cargos Found', 'Kayıtlı yük bulunmuyor')}</h3>
                <p className="text-xs text-[#545f72] max-w-sm mx-auto">
                  {trText('در حال حاضر بار فعالی با فیلترهای انتخابی ثبت نشده است.', 'No active shipments match the selected filters.', 'Seçili filtrelerle eşleşen aktif yük bulunmuyor.')}
                </p>
                {role === 'SHIPPER' && (
                  <button
                    onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
                    className="mt-2 px-4 py-2 bg-[#00258e] text-white text-xs font-bold rounded-xl hover:bg-[#0036c5] transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add_box</span>
                    <span>{t.createCargo}</span>
                  </button>
                )}
              </div>
            ) : (
              filteredCargos.map((cargo) => {
              const isSelected = cargo.id === selectedCargo?.id;
              const isInTransit = cargo.status === 'IN_TRANSIT';

              return (
                <div
                  key={cargo.id}
                  onClick={() => setSelectedCargoId(cargo.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-3 ${
                    isSelected
                      ? 'bg-[#f4f2fe] border-[#00258e] ring-2 ring-[#00258e]/20'
                      : 'bg-white border-[#c4c5da] hover:border-[#00258e]/60 hover:bg-[#fbf8ff]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                        {cargo.id}
                      </span>
                      <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23] mt-0.5">
                        {cargo.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isInTransit
                          ? 'bg-[#e6f4ea] text-[#137333] border border-[#a8dab5]'
                          : 'bg-[#fff8e1] text-[#b27b00] border border-[#ffe082]'
                      }`}
                    >
                      {isInTransit ? t.inTransit : t.readyForBids}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#545f72]">
                    <span className="font-bold text-[#1a1b23]">{cargo.origin}</span>
                    <span className="material-symbols-outlined text-16px text-[#00258e] rtl:rotate-180">
                      arrow_forward
                    </span>
                    <span className="font-bold text-[#1a1b23]">{cargo.destination}</span>
                    <span className="text-[#c4c5da]">|</span>
                    <span>{t.weight}: {cargo.weight}</span>
                    <span className="text-[#c4c5da]">|</span>
                    <span>{cargo.truckType}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#e2e1ed] text-xs">
                    <span className="font-jetbrains font-extrabold text-[#00258e] text-sm" dir="ltr">
                      {cargo.price}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBidModal(cargo);
                        }}
                        className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-14px">gavel</span>
                        <span>{t.sendFareBid}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Selected Cargo Inspector (5 cols) */}
          {selectedCargo ? (
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm space-y-4 sticky top-20">
              <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
                <div>
                  <span className="font-jetbrains text-xs font-bold text-[#00258e]" dir="ltr">
                    {selectedCargo.id}
                  </span>
                  <h2 className="font-vazirmatn text-lg font-bold text-[#1a1b23]">
                    {selectedCargo.title}
                  </h2>
                </div>
                <button
                  onClick={() => handleContact(selectedCargo)}
                  className="p-2 bg-[#eeedf9] text-[#00258e] hover:bg-[#dde1ff] rounded-xl transition-colors cursor-pointer"
                  title="Chat Dispatch"
                >
                  <span className="material-symbols-outlined text-20px">chat</span>
                </button>
              </div>

              {/* Route Card */}
              <div className="bg-[#f4f2fe] p-3.5 rounded-xl border border-[#c4c5da] flex items-center justify-between text-xs font-vazirmatn">
                <div>
                  <div className="text-[#545f72] text-[10px]">{t.originLoading}</div>
                  <div className="font-bold text-[#1a1b23] text-sm">{selectedCargo.origin}</div>
                </div>
                <span className="material-symbols-outlined text-[#00258e] text-24px rtl:rotate-180">
                  trending_flat
                </span>
                <div className="text-end">
                  <div className="text-[#545f72] text-[10px]">{t.destinationUnloading}</div>
                  <div className="font-bold text-[#1a1b23] text-sm">{selectedCargo.destination}</div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#f4f2fe]">
                  <span className="text-[#545f72]">{trText('وزن و نوع تریلر:', 'Weight & Trailer:', 'Ağırlık ve Dorse Tipi:')}</span>
                  <span className="font-bold text-[#1a1b23]">{selectedCargo.weight} ({selectedCargo.truckType})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f4f2fe]">
                  <span className="text-[#545f72]">{trText('کرایه پیشنهادی فرستنده:', 'Offered Rate:', 'Gönderenin Teklif Ettiği Navlun:')}</span>
                  <span className="font-jetbrains font-bold text-[#00258e] text-sm" dir="ltr">{selectedCargo.price}</span>
                </div>
                {selectedCargo.temperature && (
                  <div className="flex justify-between py-1.5 border-b border-[#f4f2fe]">
                    <span className="text-[#545f72]">{trText('دمای سنسور محفظه:', 'Chamber Temp:', 'Bölme Sensör Sıcaklığı:')}</span>
                    <span className="font-jetbrains font-bold text-[#00a368]" dir="ltr">{selectedCargo.temperature}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-[#545f72]">{t.insuranceCoverage}</span>
                  <span className="font-bold text-[#00a368]">{trText('پوشش کامل ۵ میلیارد تومان TLD', 'Full 5B TLD Premium Coverage', 'Tam 5 milyar tümen TLD teminatı')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#e2e1ed] flex flex-col gap-2">
                <button
                  onClick={() => handleOpenBidModal(selectedCargo)}
                  className="w-full bg-[#00258e] hover:bg-[#0036c5] text-white py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-18px">gavel</span>
                  <span>{t.sendFareBid}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadSelectedCargoPDF(selectedCargo)}
                    disabled={isExportingPDF}
                    className="flex-1 bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] py-2.5 rounded-xl font-bold text-xs border border-[#c4c5da] flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-16px">
                      {isExportingPDF ? 'sync' : 'picture_as_pdf'}
                    </span>
                    <span>{isExportingPDF ? trText('در حال صدور...', 'Exporting...', 'Düzenleniyor...') : t.downloadPdf}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
                    className="flex-1 bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] py-2.5 rounded-xl font-bold text-xs border border-[#c4c5da] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-16px">map</span>
                    <span>{t.routeMap}</span>
                  </button>
                  <button
                    onClick={() => handleContact(selectedCargo)}
                    className="flex-1 bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] py-2.5 rounded-xl font-bold text-xs border border-[#c4c5da] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-16px">chat</span>
                    <span>{t.chat}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm text-center flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined text-4xl text-[#747686] mb-2">touch_app</span>
              <p className="text-sm font-bold text-[#1a1b23]">{trText('محموله‌ای انتخاب نشده است', 'No cargo selected', 'Yük seçilmedi')}</p>
              <p className="text-xs text-[#545f72] mt-1">{trText('از لیست بارهای فعال، بار مورد نظر خود را انتخاب فرمایید.', 'Select a cargo from the list to view full specifications.', 'Tam teknik özellikleri görmek için listeden bir yük seçin.')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Submit Bid */}
      {showBidModal && bidCargo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#c4c5da] p-6 space-y-4 shadow-xl font-vazirmatn">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">price_check</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{t.bidModalTitle}</h3>
              </div>
              <button onClick={() => setShowBidModal(false)} className="text-[#747686] hover:text-[#1a1b23]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-4 text-xs">
              <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed]">
                <div className="font-bold text-sm text-[#1a1b23]">{bidCargo.title}</div>
                <div className="text-[#545f72] mt-0.5">{bidCargo.origin} {trText('به', 'to', '→')} {bidCargo.destination}</div>
                <div className="text-[11px] text-[#747686] mt-1">{trText('نرخ پایه فرستنده:', 'Shipper Base Rate:', 'Gönderenin Temel Ücreti:')} <strong>{bidCargo.price}</strong></div>
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{t.fareAmountTomans}</label>
                <input
                  type="number"
                  value={proposedFare}
                  onChange={(e) => setProposedFare(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-jetbrains font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{t.loadingReadyTime}</label>
                <input
                  type="text"
                  value={readyTime}
                  onChange={(e) => setReadyTime(e.target.value)}
                  placeholder={trText('امروز ساعت ۱۵:۰۰', '15:00 Today', 'Bugün 15:00')}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{t.driverNote}</label>
                <textarea
                  rows={2}
                  value={driverNote}
                  onChange={(e) => setDriverNote(e.target.value)}
                  placeholder={trText('مشخصات بارگیر، دو راننده بودن، بیمه مضاعف و...', 'Trailer specs, dual drivers, additional insurance...', 'Dorse özellikleri, çift sürücü, ek sigorta...')}
                  className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 outline-none text-xs"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00258e] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#0036c5]"
                >
                  {t.submitOfficialBid}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Cargo (Shipper) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-vazirmatn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#c4c5da] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <h3 className="text-lg font-bold text-[#1a1b23]">{t.createCargo}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#747686] hover:text-[#ba1a1a]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCargo} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#545f72] font-semibold mb-1">{trText('نوع و شرح محموله', 'Cargo Type & Description', 'Yük Tipi ve Açıklaması')}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={trText('مثال: قطعات فولادی، سیمان، محصولات لبنی...', 'e.g. Steel parts, Cement, Dairy products...', 'örn. Çelik parçalar, Çimento, Süt ürünleri...')}
                  className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545f72] font-semibold mb-1">{t.origin}</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#545f72] font-semibold mb-1">{t.destination}</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#545f72] font-semibold mb-1">{t.weight}</label>
                  <input
                    type="text"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#545f72] font-semibold mb-1">{t.proposedFare}</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#00258e] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
                >
                  {trText('ثبت و انتشار در شبکه ناوگان TLD', 'Publish in TLD Fleet Network', 'TLD Filo Ağında Yayınla')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-[#c4c5da] rounded-xl text-xs hover:bg-[#f4f2fe] cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
    </div>
  );
};
