import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService } from '../services/shipperService';

interface ShipperPastCargosScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperPastCargosScreen: React.FC<ShipperPastCargosScreenProps> = ({ onNavigate }) => {
  const { dir, trText } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const pastCargos = shipperService.getPastCargos();

  const filteredCargos = pastCargos.filter(
    (c) =>
      c.cargoInfo.title.includes(searchTerm) ||
      c.origin.city.includes(searchTerm) ||
      c.destination.city.includes(searchTerm) ||
      c.cargoNumber.includes(searchTerm)
  );

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_PAST_CARGOS" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_PAST_CARGOS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>{trText('سوابق و آرشیو عملیات', 'Operations History & Archive', 'Operasyon Geçmişi ve Arşivi')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('بارهای گذشته و تحویل‌شده', 'Past and Delivered Cargos', 'Geçmiş ve Teslim Edilmiş Yükler')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('مشاهده بارنامه‌ها، فاکتورهای رسمی مالیاتی، رسید تحویل کالا و تکرار سریع بار', 'View waybills, official tax invoices and delivery receipts, and quickly re-post a cargo', 'İrsaliyeleri, resmî vergi faturalarını ve teslim makbuzlarını görüntüleyin; yükü hızla yeniden oluşturun')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#c4c5da] shadow-sm flex items-center gap-2 relative">
          <span className="material-symbols-outlined text-[#747686] absolute right-4 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={trText('جستجو در آرشیو بارهای گذشته (شماره بارنامه، شهر، راننده...)', 'Search the past cargos archive (waybill no., city, driver...)', 'Geçmiş yük arşivinde ara (irsaliye no., şehir, sürücü...)')}
            className="w-full pr-10 pl-4 py-2 bg-[#fbf8ff] rounded-xl border border-[#c4c5da] text-xs"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredCargos.map((cargo) => (
            <div
              key={cargo.id}
              className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-jetbrains font-bold text-xs text-[#00a368] bg-[#00a368]/10 px-2.5 py-1 rounded-lg">
                    {cargo.cargoNumber}
                  </span>
                  <h2 className="font-bold text-sm text-[#1a1b23]">{cargo.cargoInfo.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#00a368]/15 text-[#00a368] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    <span>{trText('تحویل و تسویه شد', 'Delivered & Settled', 'Teslim Edildi ve Ödendi')}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#fbf8ff] p-3 rounded-xl border border-[#e2e1ed] text-xs">
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('مسیر حمل', 'Route', 'Güzergâh')}:</span>
                  <span className="font-bold text-[#1a1b23]">{cargo.origin.city} {trText('به', 'to', '→')} {cargo.destination.city}</span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('راننده ناوگان', 'Fleet Driver', 'Filo Sürücüsü')}:</span>
                  <span className="font-bold text-[#1a1b23]">{cargo.assignedDriver?.fullName || trText('راننده معتبر', 'Verified Driver', 'Onaylı Sürücü')}</span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('کرایه تسویه‌شده', 'Settled Fare', 'Ödenen Navlun')}:</span>
                  <span className="font-jetbrains font-bold text-[#00258e]">
                    {cargo.pricing.finalOfferedFareTomans.toLocaleString('fa-IR')} {trText('تومان', 'Tomans', 'Tümen')}
                  </span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('وضعیت حساب امانی', 'Escrow Account Status', 'Emanet Hesabı Durumu')}:</span>
                  <span className="font-bold text-[#00a368] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock_open</span>
                    <span>{trText('آزادسازی کامل به راننده', 'Fully released to the driver', 'Sürücüye tamamen serbest bırakıldı')}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('SHIPPER_CONTRACT')}
                    className="px-3 py-1.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#545f72] hover:bg-[#eeedf9] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    <span>{trText('بارنامه راهداری', 'Road Transport Waybill', 'Karayolu İrsaliyesi')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('SHIPPER_INVOICE')}
                    className="px-3 py-1.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#00258e] hover:bg-[#eeedf9] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>{trText('فاکتور رسمی مودیان', 'Official Moadian Invoice', 'Resmî Moadian Faturası')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('SHIPPER_RATING')}
                    className="px-3 py-1.5 rounded-xl border border-[#ff9800] text-[#b26a00] hover:bg-[#ff9800]/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">hotel_class</span>
                    <span>{trText('مشاهده ارزیابی راننده', 'View Driver Rating', 'Sürücü Değerlendirmesini Gör')}</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('SHIPPER_CREATE_CARGO')}
                  className="px-4 py-1.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>{trText('تکرار و ثبت مجدد این بار', 'Repeat & Repost This Cargo', 'Bu Yükü Tekrarla ve Yeniden Yayınla')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
    </div>
  );
};
