import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { pdfExportService } from '../services/pdfExportService';

interface DriverTripHistoryScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverTripHistoryScreen: React.FC<DriverTripHistoryScreenProps> = ({ onNavigate }) => {
  const { showToast, currentUser } = useAuth();
  const { dir, trText } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [exportingTripId, setExportingTripId] = useState<string | null>(null);

  const historyTrips = [
    {
      id: 'TRP-884',
      waybillNumber: 'TLD-WB-140305-88419',
      title: 'فرآورده‌های لبنی پاستوریزه',
      titleEn: 'Pasteurized dairy products',
      titleTr: 'Pastörize süt ürünleri',
      origin: 'آمل (مازندران)',
      originEn: 'Amol (Mazandaran)',
      originTr: 'Amol (Mazenderan)',
      destination: 'شیراز (فارس)',
      destinationEn: 'Shiraz (Fars)',
      destinationTr: 'Şiraz (Fars)',
      date: '۱۴۰۳/۰۵/۱۸',
      dateEn: '1403/05/18',
      dateTr: '1403/05/18',
      fare: '۳۰,۰۰۰,۰۰۰ تومان',
      fareEn: '30,000,000 Toman',
      fareTr: '30.000.000 Tümen',
      netEarnings: '۲۸,۳۸۰,۰۰۰ تومان',
      netEarningsEn: '28,380,000 Toman',
      netEarningsTr: '28.380.000 Tümen',
      truck: 'ولوو FH 500 (۱۲ ع ۳۴۵)',
      truckEn: 'Volvo FH 500 (12 Ain 345)',
      truckTr: 'Volvo FH 500 (12 Ayn 345)',
      status: 'COMPLETED',
      ratingGiven: 5.0,
      deliveryTime: '۱۸ ساعت (به‌موقع)',
      deliveryTimeEn: '18 hours (on time)',
      deliveryTimeTr: '18 saat (zamanında)',
    },
    {
      id: 'TRP-871',
      waybillNumber: 'TLD-WB-140305-87102',
      title: 'مواد پتروشیمی پلی‌اتیلن سنگین',
      titleEn: 'Heavy polyethylene petrochemical products',
      titleTr: 'Ağır polietilen petrokimya ürünleri',
      origin: 'عسلویه (بوشهر)',
      originEn: 'Assaluyeh (Bushehr)',
      originTr: 'Asaluyeh (Buşehr)',
      destination: 'تهران (شورآباد)',
      destinationEn: 'Tehran (Shourabad)',
      destinationTr: 'Tahran (Şurabad)',
      date: '۱۴۰۳/۰۵/۱۲',
      dateEn: '1403/05/12',
      dateTr: '1403/05/12',
      fare: '۴۸,۰۰۰,۰۰۰ تومان',
      fareEn: '48,000,000 Toman',
      fareTr: '48.000.000 Tümen',
      netEarnings: '۴۵,۳۵۰,۰۰۰ تومان',
      netEarningsEn: '45,350,000 Toman',
      netEarningsTr: '45.350.000 Tümen',
      truck: 'اسکانیا R450 (۳۴ ع ۵۶۷)',
      truckEn: 'Scania R450 (34 Ain 567)',
      truckTr: 'Scania R450 (34 Ayn 567)',
      status: 'COMPLETED',
      ratingGiven: 5.0,
      deliveryTime: '۲۲ ساعت (سروقت)',
      deliveryTimeEn: '22 hours (on time)',
      deliveryTimeTr: '22 saat (zamanında)',
    },
    {
      id: 'TRP-855',
      waybillNumber: 'TLD-WB-140305-85514',
      title: 'کنسانتره مرکبات صادراتی',
      titleEn: 'Export citrus concentrate',
      titleTr: 'İhracat narenciye konsantresi',
      origin: 'ساری (مازندران)',
      originEn: 'Sari (Mazandaran)',
      originTr: 'Sari (Mazenderan)',
      destination: 'بندرعباس (هرمزگان)',
      destinationEn: 'Bandar Abbas (Hormozgan)',
      destinationTr: 'Bender Abbas (Hürmüzgan)',
      date: '۱۴۰۳/۰۵/۰۵',
      dateEn: '1403/05/05',
      dateTr: '1403/05/05',
      fare: '۳۸,۰۰۰,۰۰۰ تومان',
      fareEn: '38,000,000 Toman',
      fareTr: '38.000.000 Tümen',
      netEarnings: '۳۵,۹۲۰,۰۰۰ تومان',
      netEarningsEn: '35,920,000 Toman',
      netEarningsTr: '35.920.000 Tümen',
      truck: 'ولوو FH 500 (۱۲ ع ۳۴۵)',
      truckEn: 'Volvo FH 500 (12 Ain 345)',
      truckTr: 'Volvo FH 500 (12 Ayn 345)',
      status: 'COMPLETED',
      ratingGiven: 4.9,
      deliveryTime: '۲۶ ساعت (سروقت)',
      deliveryTimeEn: '26 hours (on time)',
      deliveryTimeTr: '26 saat (zamanında)',
    },
    {
      id: 'TRP-840',
      waybillNumber: 'TLD-WB-140304-84019',
      title: 'محموله میلگرد آجدار ساختمانی',
      titleEn: 'Construction rebar cargo',
      titleTr: 'İnşaat nervürlü demir kargosu',
      origin: 'اصفهان',
      originEn: 'Isfahan',
      originTr: 'İsfahan',
      destination: 'رشت',
      destinationEn: 'Rasht',
      destinationTr: 'Reşt',
      date: '۱۴۰۳/۰۴/۲۸',
      dateEn: '1403/04/28',
      dateTr: '1403/04/28',
      fare: '۲۴,۰۰۰,۰۰۰ تومان',
      fareEn: '24,000,000 Toman',
      fareTr: '24.000.000 Tümen',
      netEarnings: '۲۲,۸۰۰,۰۰۰ تومان',
      netEarningsEn: '22,800,000 Toman',
      netEarningsTr: '22.800.000 Tümen',
      truck: 'ولوو FH 500 (۱۲ ع ۳۴۵)',
      truckEn: 'Volvo FH 500 (12 Ain 345)',
      truckTr: 'Volvo FH 500 (12 Ayn 345)',
      status: 'COMPLETED',
      ratingGiven: 5.0,
      deliveryTime: '۱۴ ساعت (سروقت)',
      deliveryTimeEn: '14 hours (on time)',
      deliveryTimeTr: '14 saat (zamanında)',
    },
  ];

  const filteredTrips = historyTrips.filter((t) => {
    const matchesSearch =
      t.title.includes(searchTerm) ||
      t.origin.includes(searchTerm) ||
      t.destination.includes(searchTerm) ||
      t.waybillNumber.includes(searchTerm);
    if (selectedStatus === 'ALL') return matchesSearch;
    return matchesSearch && t.status === selectedStatus;
  });

  const handleExportHistoryPDF = async () => {
    try {
      setIsExportingHistory(true);
      showToast(
        'info',
        trText(
          'در حال ایجاد فایل PDF کارنامه سوابق سفرها...',
          'Generating the trip history PDF file...',
          'Yolculuk geçmişi PDF dosyası oluşturuluyor...'
        )
      );
      const driverName =
        currentUser?.profile?.fullName ||
        trText('محمدرضا سلطانی', 'Mohammad Reza Soltani', 'Muhammed Rıza Soltani');
      const smartCard =
        (currentUser?.profile as any)?.smartCardNumber ||
        currentUser?.profile?.nationalId ||
        trText('۲۹۸۴۷۱۲', '2984712', '2984712');
      await pdfExportService.exportTripHistoryPDF(
        filteredTrips,
        trText(
          'کارنامه و سوابق جامع سفرهای راننده',
          'Comprehensive Driver Trip History Report',
          'Kapsamlı Sürücü Yolculuk Geçmişi Raporu'
        ),
        { name: driverName, smartCard }
      );
      showToast(
        'success',
        trText(
          'فایل PDF سوابق سفرهای راننده با موفقیت دانلود شد.',
          'The driver trip history PDF was downloaded successfully.',
          'Sürücü yolculuk geçmişi PDF dosyası başarıyla indirildi.'
        )
      );
    } catch (err) {
      console.error(err);
      showToast(
        'error',
        trText(
          'خطا در خروجی PDF سوابق.',
          'Failed to export the history PDF.',
          'Geçmiş PDF çıktısı alınamadı.'
        )
      );
    } finally {
      setIsExportingHistory(false);
    }
  };

  const handleDownloadTripWaybillPDF = async (trip: typeof historyTrips[0]) => {
    try {
      setExportingTripId(trip.id);
      showToast(
        'info',
        trText(
          `در حال صدور PDF بارنامه رسمی ${trip.waybillNumber}...`,
          `Issuing the official waybill PDF for ${trip.waybillNumber}...`,
          `${trip.waybillNumber} için resmî irsaliye PDF düzenleniyor...`
        )
      );
      const mockCargo: any = {
        id: trip.id,
        cargoNumber: trip.waybillNumber,
        origin: { city: trip.origin, address: trip.origin },
        destination: { city: trip.destination, address: trip.destination },
        cargoInfo: {
          title: trip.title,
          weightTons: 0,
          packaging: '—',
          declaredValueTomans: 0,
          specialInstructions: '',
        },
        fleetReq: { truckTypeName: trip.truck },
        pricing: { finalOfferedFareTomans: parseInt(trip.fare.replace(/\D/g, '')) || 0, distanceKm: 0 },
        insurance: { underwriter: '—', calculatedPremiumTomans: 0 },
        assignedDriver: {
          fullName:
            currentUser?.profile?.fullName ||
            trText('راننده متصدی حمل', 'Assigned driver', 'Görevli sürücü'),
          plateNumber: trip.truck,
        },
      };

      const mockWaybill: any = {
        waybillNumber: trip.waybillNumber,
        rmtoTrackingCode: '—',
        driverFullName:
          currentUser?.profile?.fullName ||
          trText('راننده متصدی حمل', 'Assigned driver', 'Görevli sürücü'),
        truckPlateNumber: trip.truck,
      };

      await pdfExportService.exportCargoManifestPDF(mockCargo, mockWaybill);
      showToast(
        'success',
        trText(
          `فایل PDF بارنامه ${trip.waybillNumber} با موفقیت دانلود شد.`,
          `The waybill PDF for ${trip.waybillNumber} was downloaded successfully.`,
          `${trip.waybillNumber} irsaliye PDF dosyası başarıyla indirildi.`
        )
      );
    } catch (err) {
      console.error(err);
      showToast(
        'error',
        trText('خطا در صدور PDF بارنامه.', 'Failed to issue the waybill PDF.', 'İrsaliye PDF düzenlenemedi.')
      );
    } finally {
      setExportingTripId(null);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader
        currentScreen="DRIVER_TRIP_HISTORY"
        title={trText('تاریخچه سفرهای من', 'My Trip History', 'Yolculuk Geçmişim')}
        subtitle="Completed Trips & Electronic Waybills"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_TRIP_HISTORY" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-28px">history</span>
              <h1 className="font-vazirmatn text-xl md:text-2xl font-black text-[#1a1b23]">
                {trText('سوابق و تاریخچه حمل بار راننده', 'Driver Cargo Transport History', 'Sürücü Yük Taşıma Geçmişi')}
              </h1>
            </div>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText(
                'مجموع ۱۴۸ سفر موفق ثبت شده در شبکه یکپارچه هوشمند حمل و نقل TLD',
                'A total of 148 successful trips recorded in the TLD integrated smart transport network',
                'TLD entegre akıllı taşımacılık ağında kayıtlı toplam 148 başarılı yolculuk'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportHistoryPDF}
              disabled={isExportingHistory}
              className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#00258e]/20 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-18px">
                {isExportingHistory ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>
                {isExportingHistory
                  ? trText('در حال صدور...', 'Exporting...', 'Dışa aktarılıyor...')
                  : trText('خروجی PDF سوابق سفرها', 'Export Trip History PDF', 'Yolculuk Geçmişi PDF Çıktısı')}
              </span>
            </button>
            <button
              onClick={() => onNavigate('DRIVER_ACTIVE_TRIP')}
              className="bg-[#f0f4ff] hover:bg-[#dde1ff] text-[#00258e] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all border border-[#c4c5da] cursor-pointer"
            >
              <span className="material-symbols-outlined text-18px">navigation</span>
              <span>{trText('مشاهده سفر جاری', 'View Current Trip', 'Mevcut Yolculuğu Görüntüle')}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute right-3 top-3 text-[#747686] text-20px">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={trText(
                'جستجو بر اساس عنوان بار، شماره بارنامه یا شهر مقصد...',
                'Search by cargo title, waybill number or destination city...',
                'Yük başlığı, irsaliye numarası veya varış şehrine göre ara...'
              )}
              className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl pr-10 pl-3 text-xs outline-none focus:border-[#00258e]"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'ALL'
                  ? 'bg-[#00258e] text-white'
                  : 'bg-[#eeedf9] text-[#444655] hover:bg-[#dde1ff]'
              }`}
            >
              {trText(`همه سفرها (${historyTrips.length})`, `All trips (${historyTrips.length})`, `Tüm yolculuklar (${historyTrips.length})`)}
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-[#00258e] text-white'
                  : 'bg-[#eeedf9] text-[#444655] hover:bg-[#dde1ff]'
              }`}
            >
              {trText('موفق و تسویه شده', 'Completed & Settled', 'Başarılı ve Ödenmiş')}
            </button>
          </div>
        </div>

        {/* Trip History Cards */}
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#137333] flex items-center justify-center">
                    <span className="material-symbols-outlined text-18px">check</span>
                  </span>
                  <div>
                    <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">{trText(trip.title, trip.titleEn, trip.titleTr)}</h3>
                    <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                      {trip.id} • {trip.waybillNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#545f72]">{trText('تاریخ تحویل:', 'Delivery date:', 'Teslim tarihi:')} <strong>{trText(trip.date, trip.dateEn, trip.dateTr)}</strong></span>
                  <span className="bg-[#e6f4ea] text-[#137333] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#a8dab5]">
                    {trText('تحویل قطعی و تسویه', 'Delivered & Settled', 'Kesin Teslim ve Ödendi')}
                  </span>
                </div>
              </div>

              {/* Route and Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#444655]">
                    <span className="material-symbols-outlined text-16px text-[#00258e]">trip_origin</span>
                    <span>{trText('مبدأ:', 'Origin:', 'Çıkış:')} <strong>{trText(trip.origin, trip.originEn, trip.originTr)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#444655]">
                    <span className="material-symbols-outlined text-16px text-[#ba1a1a]">location_on</span>
                    <span>{trText('مقصد:', 'Destination:', 'Varış:')} <strong>{trText(trip.destination, trip.destinationEn, trip.destinationTr)}</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-[#f8f9fe] rounded-xl border border-[#e2e1ed] space-y-1.5">
                  <div className="flex justify-between text-[#545f72]">
                    <span>{trText('ناوگان:', 'Fleet:', 'Filo:')}</span>
                    <span className="font-bold text-[#1a1b23]">{trText(trip.truck, trip.truckEn, trip.truckTr)}</span>
                  </div>
                  <div className="flex justify-between text-[#545f72]">
                    <span>{trText('مدت زمان سیر:', 'Transit time:', 'Geçiş süresi:')}</span>
                    <span className="font-bold text-[#00a368]">{trText(trip.deliveryTime, trip.deliveryTimeEn, trip.deliveryTimeTr)}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#f0f4ff] rounded-xl border border-[#c4c5da] space-y-1.5">
                  <div className="flex justify-between text-[#545f72]">
                    <span>{trText('کرایه ناخالص:', 'Gross fare:', 'Brüt navlun:')}</span>
                    <span className="font-bold">{trText(trip.fare, trip.fareEn, trip.fareTr)}</span>
                  </div>
                  <div className="flex justify-between text-[#00258e] font-bold">
                    <span>{trText('خالص دریافتی راننده:', 'Driver net earnings:', 'Sürücü net kazancı:')}</span>
                    <span className="text-sm">{trText(trip.netEarnings, trip.netEarningsEn, trip.netEarningsTr)}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#e2e1ed]">
                <button
                  onClick={() => handleDownloadTripWaybillPDF(trip)}
                  disabled={exportingTripId === trip.id}
                  className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-16px">
                    {exportingTripId === trip.id ? 'sync' : 'picture_as_pdf'}
                  </span>
                  <span>
                    {exportingTripId === trip.id
                      ? trText('در حال دریافت...', 'Downloading...', 'İndiriliyor...')
                      : trText('دانلود PDF بارنامه و مانیفست', 'Download Waybill & Manifest PDF', 'İrsaliye ve Manifesto PDF İndir')}
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('DRIVER_RATINGS')}
                  className="bg-[#fbf8ff] hover:bg-[#eeedf9] text-[#444655] font-bold text-xs px-3.5 py-2 rounded-xl border border-[#c4c5da] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-16px text-[#fbbc04]">star</span>
                  <span>{trText(`مشاهده نظر و امتیاز فرستنده (${trip.ratingGiven}★)`, `View sender review & rating (${trip.ratingGiven}★)`, `Gönderici değerlendirmesi ve puanını gör (${trip.ratingGiven}★)`)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
