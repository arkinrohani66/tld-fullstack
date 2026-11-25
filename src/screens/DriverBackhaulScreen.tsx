import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';

interface DriverBackhaulScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

interface BackhaulCargoItem {
  id: string;
  title: string;
  category: string;
  originCity: string;
  originHub: string;
  destinationCity: string;
  destinationDistrict: string;
  weightTons: number;
  trailerTypeRequired: string;
  suggestedFareTomans: number;
  emptyKmToLoading: number; // مسافت تردد خالی از محل تخلیه تا بارگیری جدید
  fuelSavingTomans: number;
  loadingReadyTime: string;
  urgency: 'IMMEDIATE' | 'TODAY_EVENING' | 'TOMORROW_MORNING';
  shipperName: string;
  shipperRating: number;
  matchScore: number;
}

export const DriverBackhaulScreen: React.FC<DriverBackhaulScreenProps> = ({ onNavigate }) => {
  const { showToast, currentUser } = useAuth();
  const { dir, trText, t } = useLanguage();

  const [currentDischargeCity, setCurrentDischargeCity] = useState('مشهد (پایانه شهید خبیری)');
  const [preferredHomeCity, setPreferredHomeCity] = useState('تهران و حومه');
  const [selectedTrailerType, setSelectedTrailerType] = useState('تریلر چادری / ترانزیت');
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'SAVINGS_CALCULATOR'>('MATCHES');
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});

  const backhaulLoads: BackhaulCargoItem[] = [
    {
      id: 'BKL-7701',
      title: 'محصولات غذایی بسته‌بندی و کنسروجات کارتن',
      category: 'مواد غذایی و تندمصرف',
      originCity: 'مشهد',
      originHub: 'شهرک صنعتی چناران (۳۵ کیلومتری)',
      destinationCity: 'تهران',
      destinationDistrict: 'شورآباد، انبار مرکزی رفاه',
      weightTons: 21.5,
      trailerTypeRequired: 'تریلر ترانزیت چادری / کفی لبه‌دار',
      suggestedFareTomans: 38500000,
      emptyKmToLoading: 28,
      fuelSavingTomans: 3400000,
      loadingReadyTime: 'امروز از ساعت ۱۶:۰۰',
      urgency: 'IMMEDIATE',
      shipperName: 'شرکت صنایع غذایی رضوی',
      shipperRating: 4.9,
      matchScore: 98,
    },
    {
      id: 'BKL-7702',
      title: 'قطعات ریخته‌گری و تجهیزات نیروگاهی روی پالت',
      category: 'صنعتی و متالورژی',
      originCity: 'مشهد',
      originHub: 'شهرک صنعتی طوس',
      destinationCity: 'کرج / قزوین',
      destinationDistrict: 'شهرک صنعتی کاسپین',
      weightTons: 22.8,
      trailerTypeRequired: 'تریلر کفی / لبه‌دار',
      suggestedFareTomans: 41000000,
      emptyKmToLoading: 18,
      fuelSavingTomans: 4100000,
      loadingReadyTime: 'فردا صبح ساعت ۰۸:۰۰',
      urgency: 'TOMORROW_MORNING',
      shipperName: 'پارس متالورژ شرق',
      shipperRating: 4.8,
      matchScore: 94,
    },
    {
      id: 'BKL-7703',
      title: 'مواد اولیه پلاستیک و ظروف یکبارمصرف',
      category: 'پلیمر و پلاستیک',
      originCity: 'نیشابور (در مسیر مشهد-تهران)',
      originHub: 'شهرک صنعتی خیام نیشابور',
      destinationCity: 'سمنان / گرمسار',
      destinationDistrict: 'شهرک صنعتی ایوانکی',
      weightTons: 16.0,
      trailerTypeRequired: trText('تریلر چادری / ترانزیت', 'Curtainside / Transit Trailer', 'Tenteli / Transit Dorse'),
      suggestedFareTomans: 29000000,
      emptyKmToLoading: 75,
      fuelSavingTomans: 2100000,
      loadingReadyTime: 'امروز ساعت ۱۹:۰۰',
      urgency: 'TODAY_EVENING',
      shipperName: 'پلیمر گستر شرق',
      shipperRating: 4.7,
      matchScore: 89,
    },
  ];

  const handlePlaceBackhaulBid = (cargoId: string, suggestedFare: number) => {
    const userOffer = bidInputs[cargoId] || suggestedFare.toString();
    showToast(
      'success',
      trText(
        `پیشنهاد بار برگشتی به مبلغ ${Number(userOffer).toLocaleString('fa-IR')} تومان به صاحب بار ارسال شد.`, `Backhaul offer submitted for cargo ${cargoId}.`, `Geri dönüş yükü için ${Number(userOffer).toLocaleString('fa-IR')} Tümenlik teklif yük sahibine gönderildi.`)
    );
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader
        currentScreen="DRIVER_BACKHAUL"
        title={trText('سیستم هوشمند بار برگشتی (Zero Empty Miles)', 'Smart Backhaul Cargo Matcher', 'Akıllı Geri Dönüş Yükü Eşleştirici')}
        subtitle={trText('پیشگیری از تردد یک‌سر خالی و افزایش بهره‌وری درآمد رانندگان', 'Eliminate empty deadhead miles and maximize return route profit', 'Boş kilometreleri ortadan kaldırın ve dönüş kazancını artırın')}
        showBack={true}
        onBack={() => onNavigate('DRIVER_ACTIVE_TRIP')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_BACKHAUL" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-[#00258e] to-[#1e40af] text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            <span>{trText('الگوریتم هوشمند تطبیق بار بازگشت TLD', 'TLD AI Return Routing Engine', 'TLD Akıllı Dönüş Güzergâhı Motoru')}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
              {trText('صرفه‌جویی تضمینی در سوخت و استهلاک', 'Fuel & Wear Optimized', 'Yakıt ve Aşınmada Garantili Tasarruf')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black">
            {trText('دیگر یک‌سر خالی به مبدأ برنگردید!', 'Never Drive Back Empty Again', 'Bir Daha Boş Dönmeyin!')}
          </h1>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
            {trText(
              'سیستم هوشمند TLD قبل از رسیدن به مقصد و تخلیه بار، بارهای آماده در شعاع چند کیلومتری شما با مقصد دلخواه‌تان را شناسایی کرده و نوبت بارگیری شما را رزرو می‌کند.', 'TLD predicts your discharge time and pre-matches loads in your vicinity returning to your home city with zero wait time.', 'TLD akıllı sistemi, varış noktasına ulaşıp yükü boşaltmadan önce çevrenizdeki birkaç kilometre yarıçapında istediğiniz varış noktasına giden hazır yükleri belirler ve yükleme sıranızı rezerve eder.')}
          </p>

          {/* Quick Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/20 text-xs">
            <div>
              <label className="text-[11px] text-blue-200 block mb-1 font-bold">{trText('محل فعلی / مقصد تخلیه شما:', 'Discharge City:', 'Mevcut konum / boşaltma şehriniz:')}</label>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">location_on</span>
                <input
                  type="text"
                  value={currentDischargeCity}
                  onChange={(e) => setCurrentDischargeCity(e.target.value)}
                  className="bg-transparent border-none text-white text-xs w-full focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-blue-200 block mb-1 font-bold">{trText('شهر مقصد بازگشت (محل سکونت):', 'Desired Return Destination:', 'Dönüş varış şehri (ikametgâh):')}</label>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[16px]">home</span>
                <input
                  type="text"
                  value={preferredHomeCity}
                  onChange={(e) => setPreferredHomeCity(e.target.value)}
                  className="bg-transparent border-none text-white text-xs w-full focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-blue-200 block mb-1 font-bold">{trText('نوع ناوگان و بارگیر:', 'Trailer Type:', 'Filo ve dorse tipi:')}</label>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[16px]">local_shipping</span>
                <select
                  value={selectedTrailerType}
                  onChange={(e) => setSelectedTrailerType(e.target.value)}
                  className="bg-transparent border-none text-white text-xs w-full focus:outline-hidden font-bold cursor-pointer"
                >
                  <option value="تریلر چادری / ترانزیت" className="text-black">{trText('تریلر چادری / ترانزیت', 'Curtainside / Transit Trailer', 'Tenteli / Transit Dorse')}</option>
                  <option value="تریلر کفی" className="text-black">{trText('تریلر کفی', 'Flatbed Trailer', 'Düz Platform Dorse')}</option>
                  <option value="تریلر لبه‌دار" className="text-black">{trText('تریلر لبه‌دار', 'Drop-side Trailer', 'Yan Korkuluklu Dorse')}</option>
                  <option value="تریلر یخچالی" className="text-black">{trText('تریلر یخچالی', 'Refrigerated Trailer', 'Soğutuculu Dorse')}</option>
                  <option value="بونکر و فله‌بر" className="text-black">{trText('بونکر و فله‌بر', 'Bunker & Bulk Carrier', 'Bunker ve Dökme Yük')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] text-center shadow-xs">
            <span className="text-[11px] text-[#545f72] block">{trText('کاهش کیلومتر خالی', 'Empty Km Saved', 'Boş km tasarrufu')}</span>
            <span className="font-jetbrains font-bold text-lg text-[#00a368]">{trText('۸۹۰ کیلومتر', '890 km', '890 km')}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] text-center shadow-xs">
            <span className="text-[11px] text-[#545f72] block">{trText('صرفه‌جویی تخمینی در گازوئیل', 'Fuel Expense Saved', 'Tahmini motorin tasarrufu')}</span>
            <span className="font-jetbrains font-bold text-lg text-[#00258e]">{trText('۴,۲۰۰,۰۰۰ تومان', '4,200,000 Toman', '4.200.000 Tümen')}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] text-center shadow-xs">
            <span className="text-[11px] text-[#545f72] block">{trText('میانگین کرایه خالص برگشت', 'Avg Backhaul Net Fare', 'Ortalama net dönüş navlunu')}</span>
            <span className="font-jetbrains font-bold text-lg text-[#00258e]">{trText('۳۶,۵۰۰,۰۰۰ تومان', '36,500,000 Toman', '36.500.000 Tümen')}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#c4c5da] text-center shadow-xs">
            <span className="text-[11px] text-[#545f72] block">{trText('تطابق با بارگیر شما', 'Compatibility Match', 'Dorse uyum oranı')}</span>
            <span className="font-jetbrains font-bold text-lg text-[#137333]">{trText('۹۸٪ هوشمند', '98% smart', '%98 akıllı')}</span>
          </div>
        </div>

        {/* Cargo Cards List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-[20px]">near_me</span>
              <span>{trText('بارهای برگشتی متناسب با موقعیت فعلی در مشهد', 'Recommended Backhaul Loads for Mashhad', 'Meşhed konumunuza uygun dönüş yükleri')}</span>
            </h3>
            <span className="text-xs text-[#545f72]">{backhaulLoads.length} {trText('بار فعال و تایید شده', 'Verified Loads', 'Onaylı aktif yük')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backhaulLoads.map((load) => (
              <div key={load.id} className="bg-white rounded-2xl border border-[#c4c5da] p-5 space-y-4 shadow-xs flex flex-col justify-between hover:border-[#00258e] transition-colors">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">stars</span>
                      <span>{trText('تطابق هوشمند', 'Smart match', 'Akıllı eşleşme')} {load.matchScore}{trText('٪', '%', '%')}</span>
                    </span>

                    <span className="font-jetbrains text-xs text-[#545f72]">{load.id}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#1a1b23] leading-snug">{load.title}</h4>
                    <span className="text-[11px] text-[#545f72]">{load.category}</span>
                  </div>

                  {/* Route & Distance */}
                  <div className="bg-[#f4f2fe] p-3 rounded-xl border border-[#e2e1ed] text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00a368]" />
                      <span className="font-bold text-[#1a1b23]">{load.originCity} ({load.originHub})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                      <span className="font-bold text-[#1a1b23]">{load.destinationCity} ({load.destinationDistrict})</span>
                    </div>
                    <div className="pt-2 border-t border-[#c4c5da]/50 flex justify-between text-[11px]">
                      <span className="text-[#545f72]">{trText('فاصله تا محل بارگیری:', 'Empty km to loading:', 'Yükleme noktasına boş mesafe:')}</span>
                      <strong className="text-[#00258e] font-jetbrains">{load.emptyKmToLoading} {trText('کیلومتر', 'km', 'km')}</strong>
                    </div>
                  </div>

                  {/* Financial & Trailer */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#545f72]">{trText('وزن و تناژ:', 'Weight:', 'Ağırlık ve tonaj:')}</span>
                      <strong>{load.weightTons} {t.tons}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545f72]">{trText('بارگیر الزامی:', 'Trailer:', 'Gerekli dorse:')}</span>
                      <strong className="truncate max-w-[150px]">{load.trailerTypeRequired}</strong>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-[#e2e1ed]">
                      <span className="text-[#545f72]">{trText('کرایه پیشنهادی:', 'Offered Fare:', 'Teklif edilen navlun:')}</span>
                      <strong className="font-jetbrains text-sm text-[#00258e]">
                        {load.suggestedFareTomans.toLocaleString('fa-IR')} {t.currencyTomans}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-[#e2e1ed] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={load.suggestedFareTomans.toString()}
                      value={bidInputs[load.id] || ''}
                      onChange={(e) => setBidInputs({ ...bidInputs, [load.id]: e.target.value })}
                      className="w-1/2 p-2 bg-[#f4f2fe] border border-[#c4c5da] rounded-xl text-xs font-jetbrains text-center focus:outline-hidden"
                    />
                    <button
                      onClick={() => handlePlaceBackhaulBid(load.id, load.suggestedFareTomans)}
                      className="w-1/2 py-2 rounded-xl bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>{trText('رزرو بار برگشت', 'Book Return', 'Dönüş Yükünü Rezerve Et')}</span>
                    </button>
                  </div>
                  <span className="block text-center text-[10px] text-[#545f72]">
                    {trText('زمان بارگیری:', 'Loading Ready:', 'Yükleme zamanı:')} {load.loadingReadyTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
