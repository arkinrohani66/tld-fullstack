import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, ShipperFullCargo, CargoCategory, PackagingType } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService } from '../services/shipperService';
import { cargoService } from '../services/cargoService';

interface ShipperCreateCargoScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperCreateCargoScreen: React.FC<ShipperCreateCargoScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [step, setStep] = useState<number>(1);

  // Step 1: Origin
  const [originProvince, setOriginProvince] = useState(trText('تهران', 'Tehran', 'Tahran'));
  const [originCity, setOriginCity] = useState(trText('تهران (شهرک صنعتی شمس‌آباد)', 'Tehran (Shams Abad Industrial Park)', 'Tahran (Şemsabad Sanayi Sitesi)'));
  const [originIndustrialPark, setOriginIndustrialPark] = useState(trText('بلوار بهارستان، فاز ۳', 'Baharistan Blvd., Phase 3', 'Baharistan Bulvarı, 3. Etap'));
  const [originAddress, setOriginAddress] = useState(trText('تهران، اتوبان تهران-قم، شهرک صنعتی شمس‌آباد، خ نخلستان، پلاک ۱۸', 'Tehran, Tehran-Qom Highway, Shams Abad Industrial Park, Nakhlestan St., No. 18', 'Tahran, Tahran-Kum Otoyolu, Şemsabad Sanayi Sitesi, Nakhlestan Cad., No. 18'));
  const [originContact, setOriginContact] = useState(trText('مهندس عباسی', 'Eng. Abbasi', 'Müh. Abbasi'));
  const [originPhone, setOriginPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [loadingDate, setLoadingDate] = useState('۱۴۰۳/۰۶/۱۵');
  const [loadingTimeWindow, setLoadingTimeWindow] = useState(trText('۰۸:۰۰ الی ۱۲:۰۰', '08:00 to 12:00', '08:00 - 12:00'));
  const [loadingFacilities, setLoadingFacilities] = useState<string[]>(['لیفتراک', 'رمپ اختصاصی']);

  // Step 2: Destination
  const [destProvince, setDestProvince] = useState(trText('خراسان رضوی', 'Razavi Khorasan', 'Razavi Horasan'));
  const [destCity, setDestCity] = useState(trText('مشهد (شهرک صنعتی توس)', 'Mashhad (Toos Industrial Park)', 'Meşhed (Tus Sanayi Sitesi)'));
  const [destWarehouse, setDestWarehouse] = useState(trText('انبار مرکزی شرق رضوان', 'Rezvan East Central Warehouse', 'Rezvan Doğu Merkez Deposu'));
  const [destAddress, setDestAddress] = useState(trText('مشهد، بزرگراه آزادی، شهرک صنعتی توس، فاز ۱، تلاش ۵، سوله ۱۲', 'Mashhad, Azadi Highway, Toos Industrial Park, Phase 1, Talash 5, Hangar 12', 'Meşhed, Azadi Otoyolu, Tus Sanayi Sitesi, 1. Etap, Telaş 5, Hangar 12'));
  const [destReceiver, setDestReceiver] = useState(trText('حاج رضا مقدم', 'Haj Reza Moghaddam', 'Hac Rıza Mukaddem'));
  const [destPhone, setDestPhone] = useState('۰۹۱۵۱۱۱۴۴۲۲');
  const [unloadingDate, setUnloadingDate] = useState('۱۴۰۳/۰۶/۱۶');
  const [unloadingTimeWindow, setUnloadingTimeWindow] = useState(trText('۰۹:۰۰ الی ۱۵:۰۰', '09:00 to 15:00', '09:00 - 15:00'));
  const [unloadingFacilities, setUnloadingFacilities] = useState<string[]>(['جرثقیل سقفی', 'لیفتراک']);

  // Step 3: Cargo Basic Info
  const [cargoTitle, setCargoTitle] = useState(trText('محموله ورق‌های گالوانیزه و اتصالات فلزی', 'Galvanized sheet and metal fittings shipment', 'Galvaniz sac ve metal bağlantı parçaları yükü'));
  const [cargoCategory, setCargoCategory] = useState<CargoCategory>('METALS_INDUSTRIAL');
  const [declaredValueTomans, setDeclaredValueTomans] = useState<number>(750000000);
  const [packaging, setPackaging] = useState<PackagingType>('PALLET');
  const [specialInstructions, setSpecialInstructions] = useState(trText('مهاربندی کامل با تسمه و ضد آب بودن چادر تریلی الزامی است.', 'Full lashing with straps and a waterproof trailer tarp are mandatory.', 'Kayışlarla tam bağlama ve su geçirmez treyler brandası zorunludur.'));

  // Step 4: Cargo Details & Specs
  const [weightTons, setWeightTons] = useState<number>(22.0);
  const [volumeM3, setVolumeM3] = useState<number>(38);
  const [lengthM, setLengthM] = useState<number>(13.6);
  const [widthM, setWidthM] = useState<number>(2.4);
  const [heightM, setHeightM] = useState<number>(2.5);
  const [isTemperatureControlled, setIsTemperatureControlled] = useState(false);
  const [targetTempCelsius, setTargetTempCelsius] = useState(-18);
  const [requiresSmartLock, setRequiresSmartLock] = useState(true);
  const [requiresLashingStraps, setRequiresLashingStraps] = useState(true);

  // Step 5: Vehicle Selection
  const [truckTypeName, setTruckTypeName] = useState('ترانزیت چادری کشویی');
  const [truckBodyType, setTruckBodyType] = useState<'FLATBED' | 'CURTAIN_SIDER' | 'REFRIGERATED' | 'TIPPER' | 'CLOSED_BOX'>('CURTAIN_SIDER');
  const [loadingDirection, setLoadingDirection] = useState<'TOP' | 'REAR' | 'SIDE' | 'ANY'>('SIDE');

  // Step 6: Smart Pricing & Insurance
  const [pricingMode, setPricingMode] = useState<'AI_SUGGESTED' | 'FIXED_PRICE' | 'BIDDING_AUCTION'>('AI_SUGGESTED');
  const [customPriceTomans, setCustomPriceTomans] = useState<number>(37000000);
  const [insuranceUnderwriter, setInsuranceUnderwriter] = useState<'بیمه ایران' | 'بیمه دانا' | 'بیمه البرز' | 'بیمه آسیا'>('بیمه ایران');
  const [coverageType, setCoverageType] = useState<'ALL_RISKS_CLAUSE_A' | 'ACCIDENT_FIRE_CLAUSE_B' | 'TOTAL_LOSS_CLAUSE_C'>('ALL_RISKS_CLAUSE_A');

  // Calculations
  const distanceKm = 890;
  const baseTonKmRate = 1850;
  const aiRecommendedFare = Math.round(weightTons * distanceKm * baseTonKmRate * 1.05); // ~38,000,000
  const calculatedPremium = Math.round(declaredValueTomans * 0.0006); // 0.06%

  const toggleLoadingFacility = (facility: string) => {
    if (loadingFacilities.includes(facility)) {
      setLoadingFacilities(loadingFacilities.filter((f) => f !== facility));
    } else {
      setLoadingFacilities([...loadingFacilities, facility]);
    }
  };

  const toggleUnloadingFacility = (facility: string) => {
    if (unloadingFacilities.includes(facility)) {
      setUnloadingFacilities(unloadingFacilities.filter((f) => f !== facility));
    } else {
      setUnloadingFacilities([...unloadingFacilities, facility]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!originProvince || !originCity || !originAddress) {
        showToast('error', trText('لطفاً مشخصات کامل مبدأ را وارد نمایید', 'Please enter the complete origin details', 'Lütfen kalkış noktası bilgilerini eksiksiz girin'));
        return;
      }
    } else if (step === 2) {
      if (!destProvince || !destCity || !destAddress || !destReceiver || !destPhone) {
        showToast('error', trText('لطفاً اطلاعات گیرنده و مقصد را تکمیل نمایید', 'Please complete the receiver and destination information', 'Lütfen alıcı ve varış noktası bilgilerini tamamlayın'));
        return;
      }
    } else if (step === 3) {
      if (!cargoTitle || declaredValueTomans <= 0) {
        showToast('error', trText('عنوان محموله و ارزش اظهاری کالا الزامی است', 'The cargo title and declared value are required', 'Yük başlığı ve beyan edilen değer zorunludur'));
        return;
      }
    } else if (step === 4) {
      if (weightTons <= 0) {
        showToast('error', trText('وزن محموله را به درستی وارد کنید', 'Please enter the cargo weight correctly', 'Lütfen yük ağırlığını doğru girin'));
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitCargo = async () => {
    const finalFare = pricingMode === 'FIXED_PRICE' ? customPriceTomans : aiRecommendedFare;

    const newCargoData: Omit<ShipperFullCargo, 'id' | 'cargoNumber' | 'createdAt' | 'bidsCount'> = {
      status: 'PENDING_DRIVER',
      origin: {
        province: originProvince,
        city: originCity,
        industrialPark: originIndustrialPark,
        address: originAddress,
        contactPerson: originContact,
        contactPhone: originPhone,
        loadingDate,
        loadingTimeWindow,
        loadingFacilities,
        coordinates: { lat: 35.345, lng: 51.234 },
      },
      destination: {
        province: destProvince,
        city: destCity,
        warehouseName: destWarehouse,
        address: destAddress,
        receiverName: destReceiver,
        receiverPhone: destPhone,
        unloadingDate,
        unloadingTimeWindow,
        unloadingFacilities,
        coordinates: { lat: 36.321, lng: 59.543 },
      },
      cargoInfo: {
        title: cargoTitle,
        category: cargoCategory,
        declaredValueTomans,
        packaging,
        weightTons,
        volumeM3,
        dimensions: { lengthM, widthM, heightM },
        temperatureRequired: isTemperatureControlled
          ? {
              isTemperatureControlled: true,
              targetTempCelsius,
              tempRange: trText(`${targetTempCelsius} درجه سانتیگراد`, `${targetTempCelsius} °C`, `${targetTempCelsius} °C`),
            }
          : undefined,
        requiresSmartLock,
        requiresLashingStraps,
        specialInstructions,
      },
      fleetReq: {
        truckCategory: 'TRAILER',
        truckTypeName,
        bodyType: truckBodyType,
        minCapacityTons: weightTons,
        loadingFrom: loadingDirection,
      },
      pricing: {
        baseTonKmRate,
        distanceKm,
        aiRecommendedFareTomans: aiRecommendedFare,
        marketMinFareTomans: Math.round(aiRecommendedFare * 0.92),
        marketMaxFareTomans: Math.round(aiRecommendedFare * 1.08),
        fuelTollFactor: 1.06,
        weatherTrafficFactor: 1.02,
        pricingMode,
        finalOfferedFareTomans: finalFare,
      },
      insurance: {
        underwriter: insuranceUnderwriter,
        coverageType,
        declaredValueTomans,
        premiumRatePercent: 0.06,
        calculatedPremiumTomans: calculatedPremium,
        deductiblePercent: 10,
        policyNumber: `IR-INS-${Math.floor(100000 + Math.random() * 900000)}`,
        isIssued: false,
      },
      escrowStatus: 'UNPAID',
    };

    const created = shipperService.createCargo(newCargoData);
    try {
      await cargoService.saveShipperCargo({
        id: created.id,
        title: cargoTitle,
        originCity,
        destinationCity: destCity,
        weightTons,
        truckType: truckTypeName,
      });
    } catch (err) {
      console.error('Saving cargo failed:', err);
      showToast('error', trText('ثبت محموله در سامانه انجام نشد. لطفاً دوباره تلاش کنید.', 'The cargo could not be registered. Please try again.', 'Yük kaydı yapılamadı. Lütfen tekrar deneyin.'));
      return;
    }
    showToast('success', trText(`محموله با شناسه ${created.cargoNumber} با موفقیت ثبت و در سامانه منتشر شد.`, `Cargo ${created.cargoNumber} was registered and published successfully.`, `${created.cargoNumber} numaralı yük başarıyla kaydedildi ve yayınlandı.`));
    onNavigate('SHIPPER_ACTIVE_CARGOS');
  };

  const stepTitles = [
    { num: 1, title: 'انتخاب مبدأ', titleEn: 'Select Origin', titleTr: 'Kalkış Noktası', icon: 'flight_takeoff' },
    { num: 2, title: 'انتخاب مقصد', titleEn: 'Select Destination', titleTr: 'Varış Noktası', icon: 'flight_land' },
    { num: 3, title: 'اطلاعات بار', titleEn: 'Cargo Info', titleTr: 'Yük Bilgisi', icon: 'inventory_2' },
    { num: 4, title: 'جزئیات و مشخصات', titleEn: 'Details & Specs', titleTr: 'Detay ve Özellikler', icon: 'tune' },
    { num: 5, title: 'نوع خودرو و ناوگان', titleEn: 'Vehicle & Fleet', titleTr: 'Araç ve Filo', icon: 'local_shipping' },
    { num: 6, title: 'قیمت‌گذاری و تأیید', titleEn: 'Pricing & Confirm', titleTr: 'Fiyat ve Onay', icon: 'price_check' },
  ];

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_CREATE_CARGO" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_CREATE_CARGO" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto space-y-6 w-full">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>{trText('جریان ثبت بار هوشمند', 'Smart cargo registration flow', 'Akıllı yük kayıt akışı')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('ثبت و اعلام محموله جدید', 'Register and publish a new cargo', 'Yeni yük kaydet ve yayınla')}
            </h1>
          </div>
          <button
            onClick={() => onNavigate('SHIPPER_DASHBOARD')}
            className="text-xs font-bold text-[#545f72] hover:text-[#ba1a1a] flex items-center gap-1 bg-white border border-[#c4c5da] px-3 py-2 rounded-xl cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>{trText('انصراف', 'Cancel', 'Vazgeç')}</span>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#c4c5da] shadow-sm">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {stepTitles.map((s, idx) => {
              const isCurrent = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2 cursor-pointer shrink-0 ${
                    s.num < step ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-[#00258e] text-white shadow-md scale-105'
                        : isCompleted
                        ? 'bg-[#00a368] text-white'
                        : 'bg-[#eeedf9] text-[#747686]'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      <span>{s.num}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-right">
                    <div className={`text-xs font-bold ${isCurrent ? 'text-[#00258e]' : 'text-[#1a1b23]'}`}>
                      {trText(s.title, s.titleEn, s.titleTr)}
                    </div>
                    <div className="text-[10px] text-[#747686]">
                      {isCompleted
                        ? trText('تکمیل شد', 'Completed', 'Tamamlandı')
                        : isCurrent
                        ? trText('در حال تکمیل', 'In progress', 'Devam ediyor')
                        : trText('مرحله بعد', 'Next step', 'Sonraki adım')}
                    </div>
                  </div>
                  {idx < stepTitles.length - 1 && (
                    <div className="w-4 md:w-8 h-[2px] bg-[#e2e1ed] mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-6">
          {/* STEP 1: ORIGIN */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۱: انتخاب و مشخصات مبدأ بارگیری', 'Step 1: Loading origin selection and details', 'Adım 1: Yükleme noktası seçimi ve bilgileri')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('تعیین موقعیت دقیق، کارخانه/انبار و زمان‌بندی بارگیری', 'Set the exact location, factory/warehouse and loading schedule', 'Kesin konum, fabrika/depo ve yükleme takvimini belirleyin')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('استان مبدأ *', 'Origin province *', 'Kalkış ili *')}</label>
                  <input
                    type="text"
                    value={originProvince}
                    onChange={(e) => setOriginProvince(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] text-sm"
                    placeholder={trText('مثال: تهران', 'e.g. Tehran', 'örn. Tahran')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('شهر / منطقه صنعتی مبدأ *', 'Origin city / industrial zone *', 'Kalkış şehri / sanayi bölgesi *')}</label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] text-sm"
                    placeholder={trText('مثال: شهرک صنعتی شمس‌آباد', 'e.g. Shams Abad Industrial Park', 'örn. Şemsabad Sanayi Sitesi')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('شهرک صنعتی / مجتمع تولیدی (اختیاری)', 'Industrial park / production complex (optional)', 'Sanayi sitesi / üretim tesisi (isteğe bağlı)')}</label>
                  <input
                    type="text"
                    value={originIndustrialPark}
                    onChange={(e) => setOriginIndustrialPark(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                    placeholder={trText('مثال: فاز ۴ صنعتی، خیابان نخلستان', 'e.g. Industrial Phase 4, Nakhlestan Street', 'örn. 4. Sanayi Etap, Nakhlestan Caddesi')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('آدرس دقیق محل بارگیری *', 'Exact loading address *', 'Tam yükleme adresi *')}</label>
                  <textarea
                    rows={2}
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                    placeholder={trText('آدرس کامل کوچه، پلاک، نام سوله یا انبار', 'Full address: street, number, hangar or warehouse name', 'Tam adres: sokak, kapı no, hangar veya depo adı')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('نام مسئول بارگیری در مبدأ', 'Name of the origin loading officer', 'Kalkış yükleme sorumlusu')}</label>
                  <input
                    type="text"
                    value={originContact}
                    onChange={(e) => setOriginContact(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                    placeholder={trText('مثال: مهندس رضایی', 'e.g. Eng. Rezaei', 'örn. Müh. Rezaei')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('شماره تماس هماهنگی مبدأ *', 'Origin coordination phone *', 'Kalkış iletişim numarası *')}</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={originPhone}
                    onChange={(e) => setOriginPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm font-jetbrains"
                    placeholder="0912..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('تاریخ بارگیری *', 'Loading date *', 'Yükleme tarihi *')}</label>
                  <input
                    type="text"
                    value={loadingDate}
                    onChange={(e) => setLoadingDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('بازه زمانی حضور راننده', 'Driver attendance time window', 'Sürücü hazır bulunma saat aralığı')}</label>
                  <input
                    type="text"
                    value={loadingTimeWindow}
                    onChange={(e) => setLoadingTimeWindow(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
              </div>

              {/* Loading Facilities Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-[#1a1b23] mb-2">{trText('امکانات و تجهیزات موجود در مبدأ:', 'Facilities and equipment available at origin:', 'Kalkış noktasındaki imkân ve ekipmanlar:')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'لیفتراک', en: 'Forklift', tr: 'Forklift' },
                    { id: 'جرثقیل سقفی', en: 'Overhead crane', tr: 'Tavan vinci' },
                    { id: 'کارگر بارچین', en: 'Loading crew', tr: 'Yükleme ekibi' },
                    { id: 'رمپ اختصاصی', en: 'Dedicated ramp', tr: 'Özel rampa' },
                    { id: 'باسکول ۶۰ تن', en: '60-ton weighbridge', tr: '60 tonluk kantar' },
                  ].map((facility) => {
                    const active = loadingFacilities.includes(facility.id);
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => toggleLoadingFacility(facility.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#00258e] text-white border-[#00258e]'
                            : 'bg-white text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {active ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span>{trText(facility.id, facility.en, facility.tr)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DESTINATION */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00a368]/10 text-[#00a368] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">flight_land</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۲: انتخاب و مشخصات مقصد و تحویل‌گیرنده', 'Step 2: Destination and consignee details', 'Adım 2: Varış noktası ve teslim alan bilgileri')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('اطلاعات انبار مقصد، کد پستی و مشخصات تحویل‌گیرنده رسمی', 'Destination warehouse details, postal code and official consignee information', 'Varış deposu bilgileri, posta kodu ve resmî teslim alan bilgileri')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('استان مقصد *', 'Destination province *', 'Varış ili *')}</label>
                  <input
                    type="text"
                    value={destProvince}
                    onChange={(e) => setDestProvince(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('شهر / منطقه مقصد *', 'Destination city / district *', 'Varış şehri / bölgesi *')}</label>
                  <input
                    type="text"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('نام انبار / مجتمع مقصد', 'Destination warehouse / complex name', 'Varış deposu / tesis adı')}</label>
                  <input
                    type="text"
                    value={destWarehouse}
                    onChange={(e) => setDestWarehouse(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('آدرس دقیق محل تخلیه *', 'Exact unloading address *', 'Tam boşaltma adresi *')}</label>
                  <textarea
                    rows={2}
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('نام شخص یا شرکت تحویل‌گیرنده *', 'Consignee person or company name *', 'Teslim alan kişi veya firma adı *')}</label>
                  <input
                    type="text"
                    value={destReceiver}
                    onChange={(e) => setDestReceiver(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('شماره همراه تحویل‌گیرنده (جهت دریافت OTP) *', 'Consignee mobile number (to receive the OTP) *', 'Teslim alan cep numarası (OTP almak için) *')}</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={destPhone}
                    onChange={(e) => setDestPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm font-jetbrains"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('تاریخ تخمینی تخلیه', 'Estimated unloading date', 'Tahmini boşaltma tarihi')}</label>
                  <input
                    type="text"
                    value={unloadingDate}
                    onChange={(e) => setUnloadingDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('ساعات مجاز تخلیه', 'Permitted unloading hours', 'İzin verilen boşaltma saatleri')}</label>
                  <input
                    type="text"
                    value={unloadingTimeWindow}
                    onChange={(e) => setUnloadingTimeWindow(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1b23] mb-2">{trText('تجهیزات تخلیه موجود در مقصد:', 'Unloading equipment available at destination:', 'Varış noktasındaki boşaltma ekipmanları:')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'لیفتراک', en: 'Forklift', tr: 'Forklift' },
                    { id: 'جرثقیل سقفی', en: 'Overhead crane', tr: 'Tavan vinci' },
                    { id: 'کارگر تخلیه', en: 'Unloading crew', tr: 'Boşaltma ekibi' },
                    { id: 'باسکول', en: 'Weighbridge', tr: 'Kantar' },
                    { id: 'رمپ تخلیه', en: 'Unloading ramp', tr: 'Boşaltma rampası' },
                  ].map((facility) => {
                    const active = unloadingFacilities.includes(facility.id);
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => toggleUnloadingFacility(facility.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#00a368] text-white border-[#00a368]'
                            : 'bg-white text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {active ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span>{trText(facility.id, facility.en, facility.tr)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CARGO BASIC INFO */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#6750a4]/10 text-[#6750a4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۳: اطلاعات و طبقه‌بندی بار', 'Step 3: Cargo information and classification', 'Adım 3: Yük bilgisi ve sınıflandırma')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('عنوان محموله، نوع بسته‌بندی و ارزش اظهاری کالا جهت صدور بیمه‌نامه', 'Cargo title, packaging type and declared value for issuing the insurance policy', 'Poliçe düzenlemek için yük başlığı, ambalaj tipi ve beyan edilen değer')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('عنوان کامل محموله *', 'Full cargo title *', 'Tam yük başlığı *')}</label>
                  <input
                    type="text"
                    value={cargoTitle}
                    onChange={(e) => setCargoTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm font-bold"
                    placeholder={trText('مثال: ورق فولادی نورد گرم، قطعات الکترونیکی، گندم فله...', 'e.g. hot-rolled steel sheet, electronic parts, bulk wheat...', 'örn. sıcak haddelenmiş çelik sac, elektronik parçalar, dökme buğday...')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('دسته‌بندی ماهیت کالا *', 'Cargo nature category *', 'Yük niteliği kategorisi *')}</label>
                    <select
                      value={cargoCategory}
                      onChange={(e) => setCargoCategory(e.target.value as CargoCategory)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm bg-white"
                    >
                      <option value="METALS_INDUSTRIAL">{trText('فولاد، آهن‌آلات و قطعات صنعتی', 'Steel, ironware and industrial parts', 'Çelik, demir ürünleri ve sanayi parçaları')}</option>
                      <option value="FOOD_PERISHABLE">{trText('مواد غذایی، دارویی و فاسدشدنی', 'Food, pharmaceuticals and perishables', 'Gıda, ilaç ve çabuk bozulan ürünler')}</option>
                      <option value="AGRICULTURE">{trText('محصولات کشاورزی، غلات و علوفه', 'Agricultural products, grains and fodder', 'Tarım ürünleri, tahıllar ve yem')}</option>
                      <option value="PETROCHEMICAL">{trText('پتروشیمی، شیمیایی و مواد پلیمری', 'Petrochemical, chemical and polymer materials', 'Petrokimya, kimyasal ve polimer malzemeler')}</option>
                      <option value="BUILDING_MATERIALS">{trText('مصالح ساختمانی، سیمان و کاشی', 'Building materials, cement and tiles', 'İnşaat malzemeleri, çimento ve seramik')}</option>
                      <option value="COMMERCIAL_GOODS">{trText('لوازم خانگی و کالاهای تجاری', 'Home appliances and commercial goods', 'Ev aletleri ve ticari mallar')}</option>
                      <option value="OVERSIZED_SPECIAL">{trText('کالای ترافیکی و فوق‌سنگین', 'Oversized and heavy-haul cargo', 'Gabari dışı ve ağır yük')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('نوع بسته‌بندی کالا *', 'Cargo packaging type *', 'Yük ambalaj tipi *')}</label>
                    <select
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value as PackagingType)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm bg-white"
                    >
                      <option value="PALLET">{trText('پالت چوبی / پلاستیکی استاندارد', 'Standard wooden / plastic pallet', 'Standart ahşap / plastik palet')}</option>
                      <option value="BULK">{trText('فله بدون بسته‌بندی', 'Bulk without packaging', 'Ambalajsız dökme')}</option>
                      <option value="JUMBO_BAG">{trText('کیسه جامبوبگ (۱ تا ۲ تن)', 'Jumbo bag (1 to 2 tons)', 'Jumbo çuval (1-2 ton)')}</option>
                      <option value="BOX_CARTON">{trText('کارتن و بسته شرینک‌شده', 'Carton and shrink-wrapped pack', 'Karton ve shrink ambalaj')}</option>
                      <option value="DRUM_BARREL">{trText('بشکه استاندارد ۲۲۰ لیتری', 'Standard 220-liter drum', 'Standart 220 litrelik varil')}</option>
                      <option value="COIL_ROLL">{trText('کویل و رول فلزی', 'Metal coil and roll', 'Metal bobin ve rulo')}</option>
                      <option value="WOODEN_CRATE">{trText('جعبه چوبی صنعتی', 'Industrial wooden crate', 'Endüstriyel ahşap sandık')}</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#eeedf9] p-4 rounded-xl border border-[#c4c5da]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#001356] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>{trText('ارزش اظهاری کل محموله (جهت پوشش بیمه باربری) *', 'Total declared cargo value (for freight insurance cover) *', 'Toplam beyan edilen yük değeri (nakliyat sigortası için) *')}</span>
                    </label>
                    <span className="font-jetbrains text-xs font-bold text-[#00258e]">
                      {declaredValueTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={declaredValueTomans}
                    onChange={(e) => setDeclaredValueTomans(Number(e.target.value))}
                    step={10000000}
                    className="w-full px-4 py-2 rounded-xl border border-[#c4c5da] bg-white text-sm font-jetbrains"
                  />
                  <p className="text-[11px] text-[#545f72] mt-1.5">
                    {trText('حق بیمه تمام خطر (کلوز A) بر اساس ۰.۰۶٪ ارزش کالا محاسبه خواهد شد.', 'The all-risks (Clause A) premium will be calculated at 0.06% of the cargo value.', 'Tam risk (A Klozu) primi, yük değerinin %0,06’sı üzerinden hesaplanacaktır.')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('توضیحات و نکات اختصاصی برای راننده', 'Special instructions and notes for the driver', 'Sürücü için özel açıklama ve notlar')}</label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm"
                    placeholder={trText('نکات مهاربندی، ساعت مجاز تردد، نحوه چیدمان...', 'Lashing notes, permitted travel hours, stacking layout...', 'Bağlama notları, izin verilen seyir saatleri, yerleşim düzeni...')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CARGO SPECS & SENSORS */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">tune</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۴: ابعاد، تناژ و سنسورهای هوشمند', 'Step 4: Dimensions, tonnage and smart sensors', 'Adım 4: Ölçüler, tonaj ve akıllı sensörler')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('وزن دقیق، حجم، شرایط دمایی و فعال‌سازی قفل دیجیتال IoT', 'Exact weight, volume, temperature conditions and IoT digital lock activation', 'Kesin ağırlık, hacim, sıcaklık koşulları ve IoT dijital kilit etkinleştirme')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('وزن خالص محموله (تن) *', 'Net cargo weight (tons) *', 'Net yük ağırlığı (ton) *')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={0.5}
                      value={weightTons}
                      onChange={(e) => setWeightTons(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm font-jetbrains font-bold pl-12"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-[#747686] font-bold">{trText('تن', 'tons', 'ton')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">{trText('حجم تقریبی (متر مکعب)', 'Approximate volume (cubic meters)', 'Yaklaşık hacim (metreküp)')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={volumeM3}
                      onChange={(e) => setVolumeM3(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c4c5da] focus:border-[#00258e] text-sm font-jetbrains pl-12"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-[#747686]">m³</span>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="md:col-span-2 grid grid-cols-3 gap-3 bg-[#f4f2fe] p-3 rounded-xl border border-[#e2e1ed]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#545f72] mb-1">{trText('طول (متر)', 'Length (m)', 'Uzunluk (m)')}</label>
                    <input
                      type="number"
                      step={0.1}
                      value={lengthM}
                      onChange={(e) => setLengthM(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-[#c4c5da] text-xs font-jetbrains"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#545f72] mb-1">{trText('عرض (متر)', 'Width (m)', 'Genişlik (m)')}</label>
                    <input
                      type="number"
                      step={0.1}
                      value={widthM}
                      onChange={(e) => setWidthM(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-[#c4c5da] text-xs font-jetbrains"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#545f72] mb-1">{trText('ارتفاع (متر)', 'Height (m)', 'Yükseklik (m)')}</label>
                    <input
                      type="number"
                      step={0.1}
                      value={heightM}
                      onChange={(e) => setHeightM(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-[#c4c5da] text-xs font-jetbrains"
                    />
                  </div>
                </div>
              </div>

              {/* Temperature Control Switch */}
              <div className="p-4 rounded-xl border border-[#c4c5da] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00258e]">thermostat</span>
                    <div>
                      <span className="text-xs font-bold text-[#1a1b23]">{trText('کنترل دما و یخچال (محموله فاسدشدنی / دارویی)', 'Temperature and refrigeration control (perishable / pharmaceutical cargo)', 'Sıcaklık ve soğutma kontrolü (bozulabilir / ilaç yükü)')}</span>
                      <p className="text-[11px] text-[#545f72]">{trText('ثبت لحظه‌ای دمای محفظه در بارنامه و نمودار رهگیری', 'Real-time compartment temperature logging in the waybill and tracking chart', 'İrsaliye ve takip grafiğinde anlık bölme sıcaklığı kaydı')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTemperatureControlled}
                    onChange={(e) => setIsTemperatureControlled(e.target.checked)}
                    className="w-5 h-5 accent-[#00258e] rounded cursor-pointer"
                  />
                </div>

                {isTemperatureControlled && (
                  <div className="pt-2 border-t border-[#e2e1ed] flex items-center gap-4">
                    <label className="text-xs font-bold text-[#1a1b23]">{trText('دمای مطلوب (°C):', 'Target temperature (°C):', 'Hedef sıcaklık (°C):')}</label>
                    <input
                      type="number"
                      value={targetTempCelsius}
                      onChange={(e) => setTargetTempCelsius(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 rounded-lg border border-[#c4c5da] font-jetbrains text-sm"
                    />
                    <span className="text-xs text-[#545f72]">{trText('سانتی‌گراد زیر صفر', 'degrees Celsius below zero', 'santigrat derece sıfırın altında')}</span>
                  </div>
                )}
              </div>

              {/* IoT Smart Lock & Lashing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00a368]">lock</span>
                    <span className="text-xs font-bold text-[#1a1b23]">{trText('قفل هوشمند پلمپ الکترونیک (Smart IoT Seal)', 'Smart electronic seal lock (Smart IoT Seal)', 'Akıllı elektronik mühür kilidi (Smart IoT Seal)')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresSmartLock}
                    onChange={(e) => setRequiresSmartLock(e.target.checked)}
                    className="w-5 h-5 accent-[#00a368] rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00258e]">link</span>
                    <span className="text-xs font-bold text-[#1a1b23]">{trText('تسمه‌کشی و مهاربندی دوبل (Lashing Straps)', 'Double lashing and strapping (Lashing Straps)', 'Çift kayış ve bağlama (Lashing Straps)')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresLashingStraps}
                    onChange={(e) => setRequiresLashingStraps(e.target.checked)}
                    className="w-5 h-5 accent-[#00258e] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FLEET & VEHICLE TYPE */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۵: انتخاب تیپ خودرو و ناوگان مناسب', 'Step 5: Select the right vehicle and fleet type', 'Adım 5: Uygun araç ve filo tipini seçin')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('انتخاب اتاق کامیون بر اساس وزن و مشخصات بارگیری', 'Choose the truck body based on weight and loading requirements', 'Ağırlık ve yükleme özelliklerine göre kamyon kasası seçimi')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    name: 'ترانزیت چادری کشویی',
                    nameEn: 'Sliding curtain transit',
                    nameTr: 'Kayar brandalı transit',
                    body: 'CURTAIN_SIDER',
                    cap: '۲۴ تن',
                    capEn: '24 tons',
                    capTr: '24 ton',
                    icon: 'directions_bus',
                    desc: 'بارگیری از بغل و سقف، ضد آب',
                    descEn: 'Side and top loading, waterproof',
                    descTr: 'Yan ve üstten yükleme, su geçirmez',
                  },
                  {
                    name: 'تریلی کفی ۳ محور',
                    nameEn: '3-axle flatbed trailer',
                    nameTr: '3 akslı kasa treyler',
                    body: 'FLATBED',
                    cap: '۲۵ تن',
                    capEn: '25 tons',
                    capTr: '25 ton',
                    icon: 'local_shipping',
                    desc: 'مناسب آهن‌آلات، پالت و کانتینر',
                    descEn: 'Suitable for ironware, pallets and containers',
                    descTr: 'Demir ürünleri, palet ve konteyner için uygun',
                  },
                  {
                    name: 'تریلی یخچالی دماسنج‌دار',
                    nameEn: 'Refrigerated trailer with thermometer',
                    nameTr: 'Termometreli soğutmalı treyler',
                    body: 'REFRIGERATED',
                    cap: '۲۲ تن',
                    capEn: '22 tons',
                    capTr: '22 ton',
                    icon: 'ac_unit',
                    desc: 'سیستم سرمایشی ترموکینگ استاندارد',
                    descEn: 'Standard Thermo King cooling system',
                    descTr: 'Standart Thermo King soğutma sistemi',
                  },
                  {
                    name: 'کامیون جفت (۱۰ چرخ)',
                    nameEn: 'Tandem truck (10 wheels)',
                    nameTr: 'Çift dingilli kamyon (10 tekerlek)',
                    body: 'CLOSED_BOX',
                    cap: '۱۵ تن',
                    capEn: '15 tons',
                    capTr: '15 ton',
                    icon: 'rv_hookup',
                    desc: 'مسقف یا لبه‌دار شهری/بین‌شهری',
                    descEn: 'Covered or sided, urban/intercity',
                    descTr: 'Kapalı veya tenteli, şehir içi/şehirler arası',
                  },
                  {
                    name: 'کامیون تک (۶ چرخ)',
                    nameEn: 'Single truck (6 wheels)',
                    nameTr: 'Tek dingilli kamyon (6 tekerlek)',
                    body: 'CLOSED_BOX',
                    cap: '۱۰ تن',
                    capEn: '10 tons',
                    capTr: '10 ton',
                    icon: 'local_shipping',
                    desc: 'ایده‌آل بارهای نیمه‌سنگین',
                    descEn: 'Ideal for medium-heavy loads',
                    descTr: 'Yarı ağır yükler için ideal',
                  },
                  {
                    name: 'خاور مسقف چادری',
                    nameEn: 'Covered tarpaulin light truck',
                    nameTr: 'Kapalı brandalı hafif kamyon',
                    body: 'CLOSED_BOX',
                    cap: '۴.۵ تن',
                    capEn: '4.5 tons',
                    capTr: '4,5 ton',
                    icon: 'airport_shuttle',
                    desc: 'لوازم خانگی و بارهای خرده‌بار',
                    descEn: 'Home appliances and part loads',
                    descTr: 'Ev aletleri ve parsiyel yükler',
                  },
                ].map((truck) => {
                  const isSelected = truckTypeName === truck.name;
                  return (
                    <div
                      key={truck.name}
                      onClick={() => {
                        setTruckTypeName(truck.name);
                        setTruckBodyType(truck.body as any);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00258e] bg-[#eeedf9] shadow-sm'
                          : 'border-[#c4c5da] bg-white hover:border-[#00258e]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-[28px] text-[#00258e]">
                          {truck.icon}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[#00258e] text-[20px]">
                            check_circle
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1a1b23]">{trText(truck.name, truck.nameEn, truck.nameTr)}</div>
                        <div className="text-[11px] text-[#545f72] mt-0.5">{trText(truck.desc, truck.descEn, truck.descTr)}</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#c4c5da]/50 flex justify-between text-[11px] font-jetbrains text-[#001356] font-bold">
                        <span>{trText('ظرفیت:', 'Capacity:', 'Kapasite:')}</span>
                        <span>{trText(truck.cap, truck.capEn, truck.capTr)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loading direction */}
              <div>
                <label className="block text-xs font-bold text-[#1a1b23] mb-2">{trText('نحوه مجاز بارگیری در مبدأ:', 'Permitted loading method at origin:', 'Kalkış noktasında izin verilen yükleme yöntemi:')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'SIDE', label: 'از بغل (بغل‌بازشو)', labelEn: 'From the side (open side)', labelTr: 'Yandan (açılır yan)' },
                    { id: 'TOP', label: 'از بالا (جرثقیل)', labelEn: 'From the top (crane)', labelTr: 'Üstten (vinç)' },
                    { id: 'REAR', label: 'از عقب (رمپ/لیفتراک)', labelEn: 'From the rear (ramp/forklift)', labelTr: 'Arkadan (rampa/forklift)' },
                    { id: 'ANY', label: 'هر روشی بلامانع است', labelEn: 'Any method is allowed', labelTr: 'Her yöntem serbesttir' },
                  ].map((dirItem) => (
                    <button
                      key={dirItem.id}
                      type="button"
                      onClick={() => setLoadingDirection(dirItem.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        loadingDirection === dirItem.id
                          ? 'bg-[#00258e] text-white border-[#00258e]'
                          : 'bg-white text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                      }`}
                    >
                      {trText(dirItem.label, dirItem.labelEn, dirItem.labelTr)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: AI SMART PRICING & CONFIRMATION */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-[#e2e1ed] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00a368]/10 text-[#00a368] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">price_check</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('مرحله ۶: قیمت‌گذاری هوشمند AI، بیمه و تایید نهایی', 'Step 6: AI smart pricing, insurance and final confirmation', 'Adım 6: AI akıllı fiyatlandırma, sigorta ve son onay')}</h2>
                  <p className="text-xs text-[#545f72]">{trText('بررسی برآورد قیمت الگوریتم، انتخاب شرکت بیمه و انتشار آگهی بار', 'Review the algorithm price estimate, choose the insurer and publish the cargo listing', 'Algoritma fiyat tahminini inceleyin, sigorta şirketini seçin ve yük ilanını yayınlayın')}</p>
                </div>
              </div>

              {/* AI Estimator Box */}
              <div className="bg-gradient-to-br from-[#00258e]/5 via-[#eeedf9] to-[#00a368]/5 p-5 rounded-2xl border border-[#c4c5da] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00258e]">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      <span>{trText('پیشنهاد هوشمند سیستم ترابری', 'Smart transport system suggestion', 'Akıllı taşıma sistemi önerisi')}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#1a1b23] mt-1 font-jetbrains">
                      {aiRecommendedFare.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </div>
                    <div className="text-xs text-[#545f72]">
                      {trText(`بر مبنای مسافت ${distanceKm} کیلومتر، وزن ${weightTons} تن و تعرفه تن-کیلومتر مصوب`, `Based on a ${distanceKm} km distance, ${weightTons} tons of weight and the approved ton-kilometer tariff`, `${distanceKm} km mesafe, ${weightTons} ton ağırlık ve onaylı ton-kilometre tarifesine göre`)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#c4c5da] text-xs">
                    <span className="text-[#545f72]">{trText('دامنه بازار:', 'Market range:', 'Piyasa aralığı:')}</span>
                    <span className="font-jetbrains font-bold text-[#1a1b23]">
                      {(aiRecommendedFare * 0.92 / 1000000).toFixed(1)} {trText('تا', 'to', '-')} {(aiRecommendedFare * 1.08 / 1000000).toFixed(1)} {trText('م.ت', 'M.T', 'M.T')}
                    </span>
                  </div>
                </div>

                {/* Pricing Mode Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {[
                    {
                      id: 'AI_SUGGESTED',
                      title: 'قیمت پیشنهادی هوش مصنوعی',
                      titleEn: 'AI-suggested price',
                      titleTr: 'Yapay zekâ öneri fiyatı',
                      desc: 'تضمین سریع‌ترین زمان پذیرش راننده',
                      descEn: 'Guarantees the fastest driver acceptance',
                      descTr: 'En hızlı sürücü kabulünü garanti eder',
                      val: trText(`${aiRecommendedFare.toLocaleString('fa-IR')} ت`, `${aiRecommendedFare.toLocaleString('fa-IR')} T`, `${aiRecommendedFare.toLocaleString('fa-IR')} T`),
                    },
                    {
                      id: 'FIXED_PRICE',
                      title: 'تعیین کرایه مقطوع دلخواه',
                      titleEn: 'Set a custom flat fare',
                      titleTr: 'Özel sabit ücret belirle',
                      desc: 'توسط صاحب بار تنظیم می‌شود',
                      descEn: 'Configured by the cargo owner',
                      descTr: 'Yük sahibi tarafından ayarlanır',
                      val: trText('دستی', 'Manual', 'Manuel'),
                    },
                    {
                      id: 'BIDDING_AUCTION',
                      title: 'استعلام مناقصه‌ای از رانندگان',
                      titleEn: 'Call for driver bids',
                      titleTr: 'Sürücülerden teklif iste',
                      desc: 'دریافت بهترین پیشنهادهای رقابتی',
                      descEn: 'Receive the best competitive offers',
                      descTr: 'En iyi rekabetçi teklifleri alın',
                      val: trText('مناقصه آزاد', 'Open auction', 'Açık ihale'),
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setPricingMode(mode.id as any)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        pricingMode === mode.id
                          ? 'border-[#00258e] bg-white shadow-sm'
                          : 'border-transparent bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#1a1b23]">{trText(mode.title, mode.titleEn, mode.titleTr)}</div>
                      <div className="text-[10px] text-[#545f72] mt-0.5">{trText(mode.desc, mode.descEn, mode.descTr)}</div>
                    </div>
                  ))}
                </div>

                {pricingMode === 'FIXED_PRICE' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-[#1a1b23] mb-1">{trText('کرایه مدنظر شما (تومان):', 'Your desired fare (Toman):', 'İstediğiniz ücret (Toman):')}</label>
                    <input
                      type="number"
                      step={500000}
                      value={customPriceTomans}
                      onChange={(e) => setCustomPriceTomans(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl border border-[#c4c5da] bg-white font-jetbrains text-sm font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Insurance Underwriter Card */}
              <div className="p-4 rounded-xl border border-[#c4c5da] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00a368]">verified_user</span>
                    <span className="text-xs font-bold text-[#1a1b23]">{trText('بیمه‌نامه رسمی تمام خطر باربری (کلوز A)', 'Official all-risks freight insurance policy (Clause A)', 'Resmî tam risk nakliyat sigorta poliçesi (A Klozu)')}</span>
                  </div>
                  <span className="text-xs font-jetbrains font-bold text-[#00a368]">
                    {trText('حق بیمه:', 'Premium:', 'Prim:')} {calculatedPremium.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'بیمه ایران', en: 'Iran Insurance', tr: 'İran Sigorta' },
                    { id: 'بیمه دانا', en: 'Dana Insurance', tr: 'Dana Sigorta' },
                    { id: 'بیمه البرز', en: 'Alborz Insurance', tr: 'Alborz Sigorta' },
                    { id: 'بیمه آسیا', en: 'Asia Insurance', tr: 'Asya Sigorta' },
                  ].map((underwriter) => (
                    <button
                      key={underwriter.id}
                      type="button"
                      onClick={() => setInsuranceUnderwriter(underwriter.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        insuranceUnderwriter === underwriter.id
                          ? 'bg-[#00258e] text-white border-[#00258e]'
                          : 'bg-white text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                      }`}
                    >
                      {trText(underwriter.id, underwriter.en, underwriter.tr)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complete Cargo Summary Preview */}
              <div className="bg-[#fbf8ff] p-4 rounded-2xl border border-[#c4c5da] space-y-3">
                <h3 className="text-xs font-black text-[#1a1b23] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#00258e]">fact_check</span>
                  <span>{trText('پیش‌نمایش نهایی مشخصات بار', 'Final cargo details preview', 'Nihai yük bilgileri önizlemesi')}</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#545f72] block text-[10px]">{trText('مبدأ:', 'Origin:', 'Kalkış:')}</span>
                    <span className="font-bold text-[#1a1b23]">{originCity}</span>
                  </div>
                  <div>
                    <span className="text-[#545f72] block text-[10px]">{trText('مقصد:', 'Destination:', 'Varış:')}</span>
                    <span className="font-bold text-[#1a1b23]">{destCity}</span>
                  </div>
                  <div>
                    <span className="text-[#545f72] block text-[10px]">{trText('وزن و ناوگان:', 'Weight and fleet:', 'Ağırlık ve filo:')}</span>
                    <span className="font-bold text-[#1a1b23]">{weightTons} {trText('تن', 'tons', 'ton')} - {truckTypeName}</span>
                  </div>
                  <div>
                    <span className="text-[#545f72] block text-[10px]">{trText('کرایه پیشنهادی:', 'Offered fare:', 'Teklif edilen ücret:')}</span>
                    <span className="font-jetbrains font-bold text-[#00258e]">
                      {(pricingMode === 'FIXED_PRICE' ? customPriceTomans : aiRecommendedFare).toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e1ed]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#545f72] hover:bg-[#eeedf9] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                <span>{trText('مرحله قبل', 'Previous step', 'Önceki adım')}</span>
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>{trText('مرحله بعد', 'Next step', 'Sonraki adım')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitCargo}
                className="px-8 py-3 rounded-xl bg-[#00a368] text-white text-sm font-black hover:bg-[#008f5a] flex items-center gap-2 shadow-lg shadow-[#00a368]/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">publish</span>
                <span>{trText('انتشار و ثبت قطعی بار', 'Publish and confirm cargo', 'Yükü yayınla ve kesin kaydet')}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
    </div>
  );
};
