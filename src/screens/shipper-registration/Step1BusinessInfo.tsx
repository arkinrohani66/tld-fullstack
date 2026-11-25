import React, { useState } from 'react';
import { UserProfile, ShipperType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShipperRegistrationHeader } from './ShipperRegistrationHeader';
import { Button } from '../../components/ui/Button';

interface Step1BusinessInfoProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

const INDUSTRY_SECTORS = [
  { id: 'METALS_STEEL', label: 'فولاد، آهن‌آلات و صنایع فلزی', en: 'Steel, ironware and metal industries', tr: 'Çelik, demir ürünleri ve metal sanayi', icon: 'precision_manufacturing' },
  { id: 'PETROCHEMICAL', label: 'پتروشیمی، نفت، گاز و پلیمر', en: 'Petrochemicals, oil, gas and polymers', tr: 'Petrokimya, petrol, gaz ve polimer', icon: 'oil_barrel' },
  { id: 'FOOD_AGRICULTURE', label: 'صنایع غذایی، کشاورزی و غلات', en: 'Food industry, agriculture and grains', tr: 'Gıda sanayi, tarım ve tahıllar', icon: 'agriculture' },
  { id: 'CONSTRUCTION', label: 'سیمان، کاشی، سرامیک و مصالح', en: 'Cement, tiles, ceramics and building materials', tr: 'Çimento, karo, seramik ve yapı malzemeleri', icon: 'foundation' },
  { id: 'AUTOMOTIVE', label: 'خودروسازی و قطعات یدکی', en: 'Automotive and spare parts', tr: 'Otomotiv ve yedek parça', icon: 'directions_car' },
  { id: 'CHEMICAL_PHARMA', label: 'شیمیایی، دارویی و بهداشتی', en: 'Chemicals, pharmaceuticals and hygiene', tr: 'Kimyasallar, ilaç ve hijyen', icon: 'medication' },
  { id: 'APPLIANCES', label: 'لوازم خانگی و صوتی‌تصویری', en: 'Home appliances and audio-visual goods', tr: 'Beyaz eşya ve görsel-işitsel ürünler', icon: 'tv' },
  { id: 'PACKAGING_PAPER', label: 'چوب، کاغذ، مقوا و بسته‌بندی', en: 'Wood, paper, cardboard and packaging', tr: 'Ahşap, kâğıt, karton ve ambalaj', icon: 'inventory' },
  { id: 'MINING_RAW', label: 'مواد معدنی، سنگ و خاک نسوز', en: 'Minerals, stone and refractory soil', tr: 'Mineraller, taş ve ateş tuğlası toprağı', icon: 'terrain' },
  { id: 'COMMERCIAL_IMPORT', label: 'بازرگانی عمومی و کالاهای وارداتی', en: 'General trade and imported goods', tr: 'Genel ticaret ve ithal ürünler', icon: 'storefront' },
];

const TRUCK_TYPES_OPTIONS = [
  { fa: 'ترانزیت چادری (کشویی و سقف)', en: 'Tarpaulin transit trailer (sliding sides and roof)', tr: 'Brandalı transit treyler (kayar yan ve tavan)' },
  { fa: 'تریلی کفی (Flatbed)', en: 'Flatbed trailer', tr: 'Düz platform treyler' },
  { fa: 'تریلی لبه‌دار (Drop-side)', en: 'Drop-side trailer', tr: 'Yanı açılır treyler' },
  { fa: 'تریلی یخچال‌دار ترموکینگ', en: 'Thermo King refrigerated trailer', tr: 'Thermo King soğutmalı treyler' },
  { fa: 'بونکر حمل فله و سیمان', en: 'Bulk and cement tanker', tr: 'Dökme yük ve çimento silobası' },
  { fa: 'کامیون جفت (۱۰ چرخ)', en: 'Tandem truck (10 wheels)', tr: 'Çift dingil kamyon (10 teker)' },
  { fa: 'کامیون تک (۶ چرخ)', en: 'Single truck (6 wheels)', tr: 'Tek dingil kamyon (6 teker)' },
  { fa: 'خاور و کامیونت ۶ تن', en: 'Khawar and 6-ton light truck', tr: 'Havar ve 6 tonluk hafif kamyon' },
  { fa: 'تانکر مایعات شیمیایی / سوخت', en: 'Chemical / fuel liquid tanker', tr: 'Kimyasal / yakıt sıvı tankeri' },
];

export const Step1BusinessInfo: React.FC<Step1BusinessInfoProps> = ({
  data,
  onChange,
  onNext,
  onPrev,
  onGoToStep,
}) => {
  const { trText } = useLanguage();
  const existingCompany = data.shipperCompany || {
    shipperType: 'LEGAL_ENTITY' as ShipperType,
    companyName: data.companyName || '',
    companyType: 'سهامی خاص',
    nationalCompanyId: '',
    registrationNumber: '',
    economicCode: '',
    establishmentDate: '1390/01/01',
    industrySector: 'فولاد، آهن‌آلات و صنایع فلزی',
    monthlyFreightVolumeTons: '1500',
    preferredTruckTypes: ['ترانزیت چادری (کشویی و سقف)', 'تریلی کفی (Flatbed)'],
    ceoFullName: data.fullName || '',
    ceoNationalId: data.nationalId || '',
    ceoMobile: data.mobile || '',
    landlinePhone: '02188001122',
    website: 'https://example.com',
  };

  const [shipperType, setShipperType] = useState<ShipperType>(existingCompany.shipperType || 'LEGAL_ENTITY');
  const [companyName, setCompanyName] = useState<string>(existingCompany.companyName || data.companyName || '');
  const [companyType, setCompanyType] = useState<string>(existingCompany.companyType || 'سهامی خاص');
  const [industrySector, setIndustrySector] = useState<string>(existingCompany.industrySector || 'فولاد، آهن‌آلات و صنایع فلزی');
  const [monthlyVolume, setMonthlyVolume] = useState<string>(existingCompany.monthlyFreightVolumeTons || '1500');
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>(existingCompany.preferredTruckTypes || ['ترانزیت چادری (کشویی و سقف)']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTruckType = (type: string) => {
    if (selectedTrucks.includes(type)) {
      if (selectedTrucks.length > 1) {
        setSelectedTrucks(selectedTrucks.filter((t) => t !== type));
      }
    } else {
      setSelectedTrucks([...selectedTrucks, type]);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) {
      errs.companyName = shipperType === 'LEGAL_ENTITY' ? trText('نام رسمی شرکت یا کارخانه الزامی است', 'The official company or factory name is required', 'Resmî şirket veya fabrika adı zorunludur') : trText('نام کسب‌وکار یا واحد صنفی الزامی است', 'The business or guild unit name is required', 'İşletme veya esnaf birimi adı zorunludur');
    }
    if (!industrySector) {
      errs.industrySector = trText('انتخاب حوزه فعالیت صنعتی / تجاری الزامی است', 'Selecting an industrial / commercial activity area is required', 'Sanayi / ticari faaliyet alanı seçimi zorunludur');
    }
    if (!monthlyVolume || parseInt(monthlyVolume) <= 0) {
      errs.monthlyVolume = trText('تناژ تقریبی بار ماهیانه را وارد نمایید', 'Please enter the approximate monthly freight tonnage', 'Lütfen yaklaşık aylık yük tonajını girin');
    }
    if (selectedTrucks.length === 0) {
      errs.selectedTrucks = trText('حداقل یک نوع ناوگان حمل مورد نیاز را انتخاب نمایید', 'Please select at least one required transport fleet type', 'Lütfen en az bir gerekli taşıma filosu tipi seçin');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    const updatedCompany = {
      ...existingCompany,
      shipperType,
      companyName,
      companyType,
      industrySector,
      monthlyFreightVolumeTons: monthlyVolume,
      preferredTruckTypes: selectedTrucks,
    };

    onChange({
      companyName,
      shipperCompany: updatedCompany,
    });

    onNext();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex flex-col font-vazirmatn">
      <ShipperRegistrationHeader
        currentStep={1}
        stepTitle={trText('نوع شخصیت و حوزه فعالیت تجاری', 'Entity type and area of commercial activity', 'Tüzel kişilik türü ve ticari faaliyet alanı')}
        stepSubtitle={trText('مشخصات کلی، عنوان شرکت و ناوگان لجستیک مورد نیاز', 'General details, company title and required logistics fleet', 'Genel bilgiler, şirket unvanı ve gerekli lojistik filosu')}
        onPrev={onPrev}
        onGoToStep={onGoToStep}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Banner */}
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">domain</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1a1b23]">
                {trText('سامانه ثبت‌نام رسمی صاحبان بار و کارخانجات صنعتی', 'Official registration system for shippers and industrial factories', 'Yük sahipleri ve sanayi fabrikaları için resmî kayıt sistemi')}
              </h2>
              <p className="text-xs text-[#545f72] mt-0.5">
                {trText('با ثبت اطلاعات کامل، قراردادهای هوشمند، بیمه اتوماتیک بار و تسویه حساب امانی شاپرک فعال خواهد شد.', 'Once complete information is registered, smart contracts, automatic cargo insurance and Shaparak escrow settlement will be activated.', 'Eksiksiz bilgi kaydıyla akıllı sözleşmeler, otomatik yük sigortası ve Shaparak emanet ödemesi etkinleştirilir.')}
              </p>
            </div>
          </div>
          <span className="font-jetbrains text-xs font-bold text-[#00258e] px-3 py-1.5 bg-[#f4f2fe] rounded-lg border border-[#c4c5da] shrink-0" dir="ltr">
            STEP 01 // ENTITY_TYPE
          </span>
        </div>

        <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          {/* Entity Type Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-lg">badge</span>
              <span>{trText('نوع شخصیت صاحب بار (Entity Classification):', 'Shipper entity classification:', 'Yük sahibi kişilik türü (Entity Classification):')}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShipperType('LEGAL_ENTITY')}
                className={`p-4 rounded-xl border-2 text-start flex items-start gap-3 transition-all cursor-pointer ${
                  shipperType === 'LEGAL_ENTITY'
                    ? 'border-[#00258e] bg-[#f4f2fe] shadow-xs'
                    : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  shipperType === 'LEGAL_ENTITY' ? 'bg-[#00258e] text-white' : 'bg-[#eeedf9] text-[#00258e]'
                }`}>
                  <span className="material-symbols-outlined text-2xl">apartment</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1a1b23]">{trText('شخصیت حقوقی (شرکت یا کارخانه)', 'Legal entity (company or factory)', 'Tüzel kişi (şirket veya fabrika)')}</span>
                    {shipperType === 'LEGAL_ENTITY' && (
                      <span className="material-symbols-outlined text-[#00258e] text-lg">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-[#545f72] mt-1">
                    {trText('دارای شناسه ملی شرکت، روزنامه رسمی، کد اقتصادی و حساب حقوقی بانکی', 'Holding a national company ID, official gazette, economic code and corporate bank account', 'Ulusal şirket kimliği, resmî gazete, ekonomik kod ve kurumsal banka hesabı sahibi')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShipperType('INDIVIDUAL')}
                className={`p-4 rounded-xl border-2 text-start flex items-start gap-3 transition-all cursor-pointer ${
                  shipperType === 'INDIVIDUAL'
                    ? 'border-[#00258e] bg-[#f4f2fe] shadow-xs'
                    : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  shipperType === 'INDIVIDUAL' ? 'bg-[#00258e] text-white' : 'bg-[#eeedf9] text-[#00258e]'
                }`}>
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1a1b23]">{trText('شخصیت حقیقی (کسب‌وکار / بازرگان)', 'Natural person (business / trader)', 'Gerçek kişi (işletme / tüccar)')}</span>
                    {shipperType === 'INDIVIDUAL' && (
                      <span className="material-symbols-outlined text-[#00258e] text-lg">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-[#545f72] mt-1">
                    {trText('دارای جواز کسب صنفی، پروانه فعالیت یا کارت بازرگانی انفرادی', 'Holding a guild business licence, activity permit or individual trader card', 'Esnaf işyeri ruhsatı, faaliyet izni veya bireysel tüccar kartı sahibi')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Company Name & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">
                {shipperType === 'LEGAL_ENTITY' ? trText('نام ثبتی شرکت / مجتمع صنعتی / کارخانه:', 'Registered name of the company / industrial complex / factory:', 'Şirketin / sanayi tesisinin / fabrikanın tescilli adı:') : trText('نام فروشگاه / کسب‌وکار / نام خانوادگی:', 'Store / business name / family name:', 'Mağaza / işletme adı / soyad:')}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (errors.companyName) setErrors({ ...errors, companyName: '' });
                }}
                placeholder={shipperType === 'LEGAL_ENTITY' ? trText('مثال: فولاد کاوه جنوب کیش', 'e.g. Kaveh South Kish Steel', 'örn. Kaveh Güney Kiş Çelik') : trText('مثال: بازرگانی برادران رضایی', 'e.g. Rezaei Brothers Trading', 'örn. Rezaei Kardeşler Ticaret')}
                className={`h-12 px-3.5 rounded-xl border font-vazirmatn text-sm outline-none transition-colors ${
                  errors.companyName
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                }`}
              />
              {errors.companyName && (
                <span className="text-xs text-red-600 font-semibold">{errors.companyName}</span>
              )}
            </div>

            {shipperType === 'LEGAL_ENTITY' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('نوع ساختار حقوقی شرکت:', 'Type of company legal structure:', 'Şirketin hukuki yapı türü:')}</label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="h-12 px-3 rounded-xl border border-[#c4c5da] bg-white font-vazirmatn text-sm outline-none focus:border-[#00258e] cursor-pointer"
                >
                  <option value="سهامی خاص">{trText('سهامی خاص (Private Joint Stock)', 'Private joint stock company', 'Özel anonim şirket')}</option>
                  <option value="سهامی عام">{trText('سهامی عام (Public Joint Stock)', 'Public joint stock company', 'Halka açık anonim şirket')}</option>
                  <option value="با مسئولیت محدود">{trText('با مسئولیت محدود (Limited Liability)', 'Limited liability company', 'Limited şirket')}</option>
                  <option value="شرکت تعاونی تولیدی/توزیعی">{trText('شرکت تعاونی (Cooperative)', 'Cooperative company', 'Kooperatif şirketi')}</option>
                  <option value="تولیدی صنعتی و کارخانه">{trText('واحد تولیدی و صنعتی', 'Manufacturing and industrial unit', 'Üretim ve sanayi birimi')}</option>
                  <option value="سازمان دولتی / هلدینگ عمومی">{trText('هلدینگ یا سازمان دولتی', 'Holding or state organisation', 'Holding veya kamu kurumu')}</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('نوع مجوز فعالیت صنفی:', 'Type of guild activity permit:', 'Esnaf faaliyet izni türü:')}</label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="h-12 px-3 rounded-xl border border-[#c4c5da] bg-white font-vazirmatn text-sm outline-none focus:border-[#00258e] cursor-pointer"
                >
                  <option value="جواز کسب معتبر صنفی">{trText('جواز کسب معتبر صنفی', 'Valid guild business licence', 'Geçerli esnaf işyeri ruhsatı')}</option>
                  <option value="کارت بازرگانی انفرادی">{trText('کارت بازرگانی انفرادی', 'Individual trader card', 'Bireysel tüccar kartı')}</option>
                  <option value="پروانه بهره‌برداری کارگاهی">{trText('پروانه بهره‌برداری کارگاهی', 'Workshop operating permit', 'Atölye işletme izni')}</option>
                  <option value="مجوز صادرات و واردات">{trText('مجوز صادرات / واردات', 'Export / import permit', 'İhracat / ithalat izni')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Industry Sector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a1b23] flex items-center justify-between">
              <span>{trText('حوزه اصلی صنعتی و نوع محموله‌های تولیدی / تجاری:', 'Main industrial sector and type of manufactured / commercial cargo:', 'Ana sanayi sektörü ve üretilen / ticari yük türü:')}</span>
              <span className="text-[11px] text-[#545f72]">{trText('انتخاب بخش اصلی', 'Select the main sector', 'Ana sektörü seçin')}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INDUSTRY_SECTORS.map((sector) => {
                const isSelected = industrySector === sector.label;
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => {
                      setIndustrySector(sector.label);
                      if (errors.industrySector) setErrors({ ...errors, industrySector: '' });
                    }}
                    className={`p-3 rounded-xl border text-start flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#00258e] bg-[#f4f2fe] text-[#00258e] font-bold shadow-xs'
                        : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#334155]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-[#00258e]' : 'text-[#64748b]'}`}>
                      {sector.icon}
                    </span>
                    <span className="text-xs flex-1 truncate">{trText(sector.label, sector.en, sector.tr)}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] text-[#00258e]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Freight Volume Slider */}
          <div className="flex flex-col gap-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">scale</span>
                <label className="text-xs font-bold text-[#1a1b23]">
                  {trText('حجم تقریبی بار ارسالی ماهیانه (تناژ):', 'Approximate monthly freight volume (tonnage):', 'Yaklaşık aylık gönderilen yük hacmi (tonaj):')}
                </label>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#c4c5da]">
                <input
                  type="number"
                  dir="ltr"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(e.target.value)}
                  className="w-20 font-jetbrains font-bold text-sm text-[#00258e] outline-none text-center"
                />
                <span className="text-xs font-bold text-[#545f72]">{trText('تن / ماه', 'tons / month', 'ton / ay')}</span>
              </div>
            </div>
            <input
              type="range"
              min="50"
              max="20000"
              step="50"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(e.target.value)}
              className="w-full h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#00258e]"
            />
            <div className="flex justify-between text-[11px] font-jetbrains text-[#64748b]" dir="ltr">
              <span>{trText('50 Tons (خرد)', '50 Tons (small)', '50 Ton (küçük)')}</span>
              <span>{trText('2,500 Tons (متوسط)', '2,500 Tons (medium)', '2.500 Ton (orta)')}</span>
              <span>{trText('10,000+ Tons (صنایع مادر)', '10,000+ Tons (heavy industry)', '10.000+ Ton (ana sanayi)')}</span>
            </div>
          </div>

          {/* Preferred Truck Types Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#1a1b23] flex items-center justify-between">
              <span>{trText('انواع ناوگان حمل جاده‌ای مورد نیاز (امکان چند انتخابی):', 'Required road transport fleet types (multiple selection possible):', 'Gerekli karayolu taşıma filosu tipleri (çoklu seçim yapılabilir):')}</span>
              <span className="text-[11px] font-jetbrains text-[#00258e]">
                {trText(`${selectedTrucks.length} مورد انتخاب شده`, `${selectedTrucks.length} selected`, `${selectedTrucks.length} seçildi`)}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRUCK_TYPES_OPTIONS.map((truck) => {
                const isChecked = selectedTrucks.includes(truck.fa);
                return (
                  <button
                    key={truck.fa}
                    type="button"
                    onClick={() => toggleTruckType(truck.fa)}
                    className={`p-2.5 rounded-xl border text-start flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-[#00258e] bg-[#f4f2fe] text-[#00258e] font-bold'
                        : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#475569]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isChecked ? 'text-[#00258e]' : 'text-gray-400'}`}>
                      {isChecked ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span className="truncate">{trText(truck.fa, truck.en, truck.tr)}</span>
                  </button>
                );
              })}
            </div>
            {errors.selectedTrucks && (
              <span className="text-xs text-red-600 font-semibold">{errors.selectedTrucks}</span>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0] mt-2">
            <button
              type="button"
              onClick={onPrev}
              className="px-5 py-2.5 rounded-xl border border-[#c4c5da] text-[#475569] text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {trText('انصراف و بازگشت', 'Cancel and go back', 'Vazgeç ve geri dön')}
            </button>

            <Button
              type="button"
              onClick={handleNext}
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined text-[18px]">arrow_back</span>}
            >
              {trText('مرحله بعد: مشخصات ثبتی و قانونی', 'Next step: registration and legal details', 'Sonraki adım: tescil ve hukuki bilgiler')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
