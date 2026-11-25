import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, ShipperFullCargo } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService, adaptDbCargoToShipperCargo } from '../services/shipperService';
import { pdfExportService } from '../services/pdfExportService';

interface ShipperActiveCargosScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onSelectCargo?: (cargoId: string) => void;
}

export const ShipperActiveCargosScreen: React.FC<ShipperActiveCargosScreenProps> = ({
  onNavigate,
  onSelectCargo,
}) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { cargos: dbCargos, setSelectedCargoId } = useLogistics();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingCargoId, setExportingCargoId] = useState<string | null>(null);

  // Real DB cargos merged with locally enriched wizard cargos
  const ACTIVE_STATUSES = [
    'PENDING_DRIVER',
    'IN_NEGOTIATION',
    'DRIVER_ASSIGNED',
    'CONTRACT_SIGNED',
    'ESCROW_FUNDED',
    'LOADING',
    'WAYBILL_ISSUED',
    'IN_TRANSIT',
    'ARRIVED_DESTINATION',
  ];
  const activeCargos = useMemo(() => {
    const byId = new Map<string, ShipperFullCargo>();
    dbCargos.forEach((c) => byId.set(c.id, adaptDbCargoToShipperCargo(c)));
    shipperService.getCargos().forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    return Array.from(byId.values()).filter((c) => ACTIVE_STATUSES.includes(c.status));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbCargos]);

  const selectCargo = (cargoId: string) => {
    setSelectedCargoId(cargoId);
    onSelectCargo?.(cargoId);
  };

  const handleDownloadCargoManifestPDF = async (e: React.MouseEvent, cargo: ShipperFullCargo) => {
    e.stopPropagation();
    try {
      setExportingCargoId(cargo.id);
      showToast('info', trText(`در حال صدور مانیفست رسمی PDF برای بار ${cargo.cargoNumber}...`, `Issuing the official PDF manifest for cargo ${cargo.cargoNumber}...`, `Yük ${cargo.cargoNumber} için resmî PDF manifestosu oluşturuluyor...`));
      const waybill = shipperService.getElectronicWaybill(cargo.id);
      await pdfExportService.exportCargoManifestPDF(cargo, waybill);
      showToast('success', trText(`فایل مانیفست رسمی بار ${cargo.cargoNumber} با موفقیت دانلود شد.`, `The official manifest for cargo ${cargo.cargoNumber} was downloaded successfully.`, `Yük ${cargo.cargoNumber} için resmî manifesto başarıyla indirildi.`));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در ایجاد PDF مانیفست.', 'Failed to generate the manifest PDF.', 'Manifesto PDF\'i oluşturulamadı.'));
    } finally {
      setExportingCargoId(null);
    }
  };

  const filteredCargos = activeCargos.filter((c) => {
    const matchesSearch =
      c.cargoInfo.title.includes(searchTerm) ||
      c.origin.city.includes(searchTerm) ||
      c.destination.city.includes(searchTerm) ||
      c.cargoNumber.includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'IN_TRANSIT') return c.status === 'IN_TRANSIT';
    if (filterStatus === 'PENDING') return c.status === 'PENDING_DRIVER' || c.status === 'IN_NEGOTIATION';
    if (filterStatus === 'ASSIGNED') return c.status === 'DRIVER_ASSIGNED' || c.status === 'LOADING';
    return true;
  });

  const getStatusBadge = (status: ShipperFullCargo['status']) => {
    switch (status) {
      case 'IN_TRANSIT':
        return { label: trText('در مسیر حمل', 'In Transit', 'Yolda'), color: 'bg-[#00a368]/15 text-[#00a368] border-[#00a368]/30', icon: 'sync' };
      case 'IN_NEGOTIATION':
        return { label: trText('بررسی پیشنهاد رانندگان', 'Reviewing Driver Bids', 'Sürücü Teklifleri İnceleniyor'), color: 'bg-[#ff9800]/15 text-[#b26a00] border-[#ff9800]/30', icon: 'gavel' };
      case 'PENDING_DRIVER':
        return { label: trText('منتشر شده / در انتظار', 'Published / Awaiting Driver', 'Yayınlandı / Sürücü Bekleniyor'), color: 'bg-[#00258e]/10 text-[#00258e] border-[#00258e]/30', icon: 'hourglass_top' };
      case 'DRIVER_ASSIGNED':
        return { label: trText('راننده تایید شد', 'Driver Confirmed', 'Sürücü Onaylandı'), color: 'bg-[#6750a4]/15 text-[#6750a4] border-[#6750a4]/30', icon: 'how_to_reg' };
      case 'LOADING':
        return { label: trText('در حال بارگیری در مبدأ', 'Loading at Origin', 'Kaynakta Yükleniyor'), color: 'bg-[#0288d1]/15 text-[#0288d1] border-[#0288d1]/30', icon: 'forklift' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300', icon: 'info' };
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_ACTIVE_CARGOS" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_ACTIVE_CARGOS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">package_2</span>
              <span>{trText('عملیات لجستیک ناوگان', 'Fleet Logistics Operations', 'Filo Lojistik Operasyonları')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('مدیریت بارهای فعال', 'Manage Active Cargos', 'Aktif Yükleri Yönet')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('پیگیری بلادرنگ محموله‌های در حال حمل، مذاکره و بارگیری', 'Real-time tracking of cargos in transit, negotiation and loading', 'Taşınan, müzakere edilen ve yüklenen yüklerin gerçek zamanlı takibi')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
            className="px-5 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-2 shadow-md shadow-[#00258e]/20 cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            <span>{trText('ثبت محموله جدید', 'Post New Cargo', 'Yeni Yük İlan Et')}</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div className="flex items-center gap-2 flex-1 relative">
            <span className="material-symbols-outlined text-[#747686] absolute right-3 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={trText('جستجو در شناسه بار، عنوان کالا، مبدأ یا مقصد...', 'Search by cargo ID, item title, origin or destination...', 'Yük no., ürün adı, kaynak veya varış noktasına göre ara...')}
              className="w-full pr-10 pl-4 py-2 bg-[#fbf8ff] rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: trText('همه بارهای فعال', 'All Active Cargos', 'Tüm Aktif Yükler'), count: activeCargos.length },
              { id: 'IN_TRANSIT', label: trText('در مسیر جاده', 'On the Road', 'Yolda'), count: activeCargos.filter((c) => c.status === 'IN_TRANSIT').length },
              { id: 'PENDING', label: trText('در انتظار / پیشنهادها', 'Awaiting / Bids', 'Beklemede / Teklifler'), count: activeCargos.filter((c) => c.status === 'PENDING_DRIVER' || c.status === 'IN_NEGOTIATION').length },
              { id: 'ASSIGNED', label: trText('تایید شده / بارگیری', 'Confirmed / Loading', 'Onaylandı / Yükleme'), count: activeCargos.filter((c) => c.status === 'DRIVER_ASSIGNED' || c.status === 'LOADING').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === f.id
                    ? 'bg-[#00258e] text-white border-[#00258e]'
                    : 'bg-white text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-jetbrains ${
                    filterStatus === f.id ? 'bg-white/20 text-white' : 'bg-[#eeedf9] text-[#001356]'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cargo List Grid */}
        <div className="space-y-4">
          {filteredCargos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da]">
              <span className="material-symbols-outlined text-4xl text-[#747686]">inventory_2</span>
              <h3 className="text-sm font-bold text-[#1a1b23] mt-2">{trText('محموله فعالی یافت نشد', 'No active cargo found', 'Aktif yük bulunamadı')}</h3>
              <p className="text-xs text-[#545f72] mt-1">
                {trText('می‌توانید همین حالا بار جدیدی را ثبت و در شبکه رانندگان کشور اعلام نمایید.', 'You can post a new cargo right now and announce it to the national driver network.', 'Hemen yeni bir yük ilan edip ülke genelindeki sürücü ağına duyurabilirsiniz.')}
              </p>
              <button
                onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold"
              >
                {trText('ثبت اولین بار', 'Post Your First Cargo', 'İlk Yükünüzü İlan Edin')}
              </button>
            </div>
          ) : (
            filteredCargos.map((cargo) => {
              const statusBadge = getStatusBadge(cargo.status);
              return (
                <div
                  key={cargo.id}
                  className="bg-white rounded-2xl border border-[#c4c5da] hover:border-[#00258e] transition-all p-5 shadow-sm space-y-4 group"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e1ed] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-jetbrains font-bold text-xs text-[#00258e] bg-[#dde1ff] px-2.5 py-1 rounded-lg">
                        {cargo.cargoNumber}
                      </span>
                      <h2 className="font-bold text-sm text-[#1a1b23]">{cargo.cargoInfo.title}</h2>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${statusBadge.color}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{statusBadge.icon}</span>
                        <span>{statusBadge.label}</span>
                      </span>
                      <span className="text-[11px] text-[#747686]">{cargo.createdAt}</span>
                    </div>
                  </div>

                  {/* Route & Specs Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#fbf8ff] p-3.5 rounded-xl border border-[#e2e1ed] text-xs">
                    <div>
                      <span className="text-[#747686] text-[11px] block">{trText('مبدأ بارگیری', 'Loading Origin', 'Yükleme Noktası')}:</span>
                      <span className="font-bold text-[#1a1b23] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[16px] text-[#00258e]">location_on</span>
                        <span>{cargo.origin.city}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[#747686] text-[11px] block">{trText('مقصد تخلیه', 'Unloading Destination', 'Boşaltma Noktası')}:</span>
                      <span className="font-bold text-[#1a1b23] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[16px] text-[#00a368]">flag</span>
                        <span>{cargo.destination.city}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[#747686] text-[11px] block">{trText('وزن و ناوگان', 'Weight & Fleet', 'Ağırlık ve Filo')}:</span>
                      <span className="font-bold text-[#1a1b23] mt-0.5 block">
                        {cargo.cargoInfo.weightTons} {trText('تن -', 'tons', 'ton')} {cargo.fleetReq.truckTypeName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#747686] text-[11px] block">{trText('کرایه توافق‌شده', 'Agreed Fare', 'Anlaşılan Navlun')}:</span>
                      <span className="font-jetbrains font-bold text-[#00258e] text-sm mt-0.5 block">
                        {cargo.pricing.finalOfferedFareTomans.toLocaleString('fa-IR')} {trText('تومان', 'Tomans', 'Tümen')}
                      </span>
                    </div>
                  </div>

                  {/* Driver & Escrow Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {cargo.assignedDriver ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#00258e]/10 text-[#00258e] font-bold flex items-center justify-center text-xs">
                          {cargo.assignedDriver.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1a1b23] flex items-center gap-1.5">
                            <span>{cargo.assignedDriver.fullName}</span>
                            <span className="bg-[#ff9800]/15 text-[#b26a00] px-1.5 py-0.2 rounded text-[10px] font-bold">
                              ★ {cargo.assignedDriver.ratingScore}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#545f72]">
                            {cargo.assignedDriver.truckBrand} {cargo.assignedDriver.truckModel} ({cargo.assignedDriver.plateNumber})
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#b26a00] font-bold">
                        <span className="material-symbols-outlined text-[18px]">contact_support</span>
                        <span>{cargo.bidsCount} {trText('پیشنهاد دریافت شده از رانندگان', 'bids received from drivers', 'sürücüden teklif alındı')}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {cargo.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => {
                            selectCargo(cargo.id);
                            onNavigate('SHIPPER_TRACKING');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">my_location</span>
                          <span>{trText('رهگیری زنده', 'Live Tracking', 'Canlı Takip')}</span>
                        </button>
                      )}

                      {(cargo.status === 'PENDING_DRIVER' || cargo.status === 'IN_NEGOTIATION') && (
                        <button
                          onClick={() => {
                            selectCargo(cargo.id);
                            onNavigate('SHIPPER_BIDS');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#ff9800] text-white text-xs font-bold hover:bg-[#e68900] flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                          <span>{trText('مشاهده و مقایسه رانندگان', 'View & Compare Drivers', 'Sürücüleri Görüntüle ve Karşılaştır')}</span>
                        </button>
                      )}

                      {cargo.status === 'DRIVER_ASSIGNED' && (
                        <button
                          onClick={() => {
                            selectCargo(cargo.id);
                            onNavigate('SHIPPER_ESCROW');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                          <span>{trText('واریز حساب امانی', 'Fund Escrow Account', 'Emanet Hesabına Para Yatır')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          selectCargo(cargo.id);
                          onNavigate('SHIPPER_CONTRACT');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#c4c5da] text-[#545f72] hover:bg-[#eeedf9] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        <span>{trText('قرارداد و بارنامه', 'Contract & Waybill', 'Sözleşme ve İrsaliye')}</span>
                      </button>

                      <button
                        onClick={() => {
                          selectCargo(cargo.id);
                          onNavigate('SHIPPER_ESCROW');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#00a368] text-[#00a368] hover:bg-[#00a368]/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                        <span>{trText('حساب امانی Escrow', 'Escrow Account', 'Emanet Hesabı')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
    </div>
  );
};
