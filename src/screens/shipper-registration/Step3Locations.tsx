import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShipperRegistrationHeader } from './ShipperRegistrationHeader';
import { ProvinceCitySelect } from '../../components/common/ProvinceCitySelect';
import { Button } from '../../components/ui/Button';

interface Step3LocationsProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

const WAREHOUSE_FACILITIES_OPTIONS = [
  { id: 'WEIGHBRIDGE_60T', label: 'باسکول ۶۰ تن دیجیتال', en: '60-ton digital weighbridge', tr: '60 ton dijital kantar', icon: 'scale' },
  { id: 'FORKLIFT_5T', label: 'لیفتراک ۵ تن و ۳ تن', en: '5-ton and 3-ton forklift', tr: '5 ton ve 3 ton forklift', icon: 'forklift' },
  { id: 'OVERHEAD_CRANE', label: 'جرثقیل سقفی سنگین', en: 'Heavy overhead crane', tr: 'Ağır tavan vinci', icon: 'precision_manufacturing' },
  { id: 'LOADING_RAMP', label: 'رمپ استاندارد بارگیری ترانزیت', en: 'Standard transit loading ramp', tr: 'Standart transit yükleme rampası', icon: 'ramp_right' },
  { id: 'ROOFED_WAREHOUSE', label: 'سوله مسقف بارگیری ایمن', en: 'Covered shed for safe loading', tr: 'Güvenli yükleme için kapalı hangar', icon: 'roofing' },
  { id: 'NIGHT_LOADING', label: 'امکان بارگیری شبانه‌روزی (۲۴/۷)', en: 'Round-the-clock loading (24/7)', tr: 'Günün her saati yükleme (24/7)', icon: 'bedtime' },
  { id: 'CERTIFIED_LASHING', label: 'اکیپ مهاربندی و چادرکشی استاندارد', en: 'Certified lashing and sheeting crew', tr: 'Sertifikalı bağlama ve branda ekibi', icon: 'handyman' },
  { id: 'COLD_STORAGE', label: 'سردخانه و اتصال برق ترموکینگ', en: 'Cold storage and Thermo King power connection', tr: 'Soğuk hava deposu ve Thermo King elektrik bağlantısı', icon: 'ac_unit' },
];

export const Step3Locations: React.FC<Step3LocationsProps> = ({
  data,
  onChange,
  onNext,
  onPrev,
  onGoToStep,
}) => {
  const { trText } = useLanguage();
  const existingLocations = data.shipperLocations || {
    officeProvince: data.province || 'تهران',
    officeCity: data.city || 'تهران',
    officePostalCode: data.postalCode || '1998877665',
    officeAddress: data.address || 'تهران، خیابان ملاصدرا، خیابان شیراز شمالی، پلاک ۴۴، ساختمان پارس، طبقه ۶',
    warehouseProvince: 'تهران',
    warehouseCity: 'تهران (شهرک صنعتی شمس‌آباد)',
    warehouseAddress: 'تهران، اتوبان تهران-قم، شهرک صنعتی شمس‌آباد، بلوار سروستان، خیابان نارنجستان، کارخانه فولاد پارس',
    warehouseContactPerson: 'مهندس رضایی (مسئول انبار مرکزی)',
    warehouseContactPhone: '09123456789',
    warehouseFacilities: ['باسکول ۶۰ تن دیجیتال', 'لیفتراک ۵ تن و ۳ تن', 'رمپ استاندارد بارگیری ترانزیت', 'سوله مسقف بارگیری ایمن'],
  };

  const [officeProvince, setOfficeProvince] = useState<string>(existingLocations.officeProvince || 'تهران');
  const [officeCity, setOfficeCity] = useState<string>(existingLocations.officeCity || 'تهران');
  const [officePostalCode, setOfficePostalCode] = useState<string>(existingLocations.officePostalCode || '1998877665');
  const [officeAddress, setOfficeAddress] = useState<string>(existingLocations.officeAddress || '');

  const [sameAsOffice, setSameAsOffice] = useState<boolean>(false);
  const [warehouseProvince, setWarehouseProvince] = useState<string>(existingLocations.warehouseProvince || 'تهران');
  const [warehouseCity, setWarehouseCity] = useState<string>(existingLocations.warehouseCity || 'تهران');
  const [warehouseAddress, setWarehouseAddress] = useState<string>(existingLocations.warehouseAddress || '');
  const [warehouseContactPerson, setWarehouseContactPerson] = useState<string>(existingLocations.warehouseContactPerson || 'مهندس رضایی');
  const [warehouseContactPhone, setWarehouseContactPhone] = useState<string>(existingLocations.warehouseContactPhone || '09123456789');
  const [facilities, setFacilities] = useState<string[]>(existingLocations.warehouseFacilities || ['باسکول ۶۰ تن دیجیتال', 'لیفتراک ۵ تن و ۳ تن']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggleSame = (checked: boolean) => {
    setSameAsOffice(checked);
    if (checked) {
      setWarehouseProvince(officeProvince);
      setWarehouseCity(officeCity);
      setWarehouseAddress(officeAddress);
    }
  };

  const toggleFacility = (label: string) => {
    if (facilities.includes(label)) {
      setFacilities(facilities.filter((f) => f !== label));
    } else {
      setFacilities([...facilities, label]);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!officeAddress.trim()) {
      errs.officeAddress = trText('آدرس کامل پستی دفتر مرکزی الزامی است', 'The complete postal address of the head office is required', 'Merkez ofisin tam posta adresi zorunludur');
    }

    const cleanPostal = officePostalCode.replace(/\D/g, '');
    if (!cleanPostal || cleanPostal.length !== 10) {
      errs.officePostalCode = trText('کد پستی ۱۰ رقمی دفتر مرکزی الزامی است', 'The 10-digit postal code of the head office is required', 'Merkez ofisin 10 haneli posta kodu zorunludur');
    }

    if (!sameAsOffice && !warehouseAddress.trim()) {
      errs.warehouseAddress = trText('آدرس دقیق کارخانه / انبار مبدا بارگیری الزامی است', 'The exact address of the factory / origin loading warehouse is required', 'Fabrikanın / çıkış yükleme deposunun tam adresi zorunludur');
    }

    if (!warehouseContactPerson.trim()) {
      errs.warehouseContactPerson = trText('نام مسئول انبار / بارگیری الزامی است', 'The name of the warehouse / loading officer is required', 'Depo / yükleme sorumlusunun adı zorunludur');
    }

    const cleanWhPhone = warehouseContactPhone.replace(/\D/g, '');
    if (!cleanWhPhone || cleanWhPhone.length < 10) {
      errs.warehouseContactPhone = trText('شماره تماس مسئول انبار الزامی است', 'The warehouse officer contact number is required', 'Depo sorumlusunun iletişim numarası zorunludur');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    const updatedLocations = {
      officeProvince,
      officeCity,
      officePostalCode,
      officeAddress,
      warehouseProvince: sameAsOffice ? officeProvince : warehouseProvince,
      warehouseCity: sameAsOffice ? officeCity : warehouseCity,
      warehouseAddress: sameAsOffice ? officeAddress : warehouseAddress,
      warehouseContactPerson,
      warehouseContactPhone,
      warehouseFacilities: facilities,
    };

    onChange({
      province: officeProvince,
      city: officeCity,
      postalCode: officePostalCode,
      address: officeAddress,
      shipperLocations: updatedLocations,
    });

    onNext();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex flex-col font-vazirmatn">
      <ShipperRegistrationHeader
        currentStep={3}
        stepTitle={trText('نشانی دفتر مرکزی، کارخانه و انبارهای بارگیری', 'Head office, factory and loading warehouse addresses', 'Merkez ofis, fabrika ve yükleme deposu adresleri')}
        stepSubtitle={trText('تنظیم موقعیت‌های جغرافیایی مبدا، بارگیرگاه و امکانات باسکول و رمپ', 'Setting the geographic locations of the origin, loading site and weighbridge and ramp facilities', 'Çıkış noktası, yükleme alanı ile kantar ve rampa olanaklarının konumlarının belirlenmesi')}
        onPrev={onPrev}
        onGoToStep={onGoToStep}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          {/* Section 1: Head Office Address */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-bold text-[#00258e] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">location_city</span>
              <span>{trText('نشانی دفتر مرکزی / اقامتگاه قانونی (Head Office)', 'Head office / legal domicile address (Head Office)', 'Merkez ofis / yasal ikametgâh adresi (Head Office)')}</span>
            </h3>

            {/* Province & City */}
            <ProvinceCitySelect
              selectedProvince={officeProvince}
              selectedCity={officeCity}
              onProvinceChange={(p) => setOfficeProvince(p)}
              onCityChange={(c) => setOfficeCity(c)}
              selectClassName="w-full h-12 px-3.5 pe-8 rounded-xl border border-[#c4c5da] bg-white font-vazirmatn text-sm outline-none appearance-none focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] cursor-pointer"
            />

            {/* Detailed Street Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">{trText('آدرس دقیق پستی دفتر مرکزی:', 'Exact postal address of the head office:', 'Merkez ofisin tam posta adresi:')}</label>
              <textarea
                rows={2}
                value={officeAddress}
                onChange={(e) => {
                  setOfficeAddress(e.target.value);
                  if (errors.officeAddress) setErrors({ ...errors, officeAddress: '' });
                }}
                placeholder={trText('خیابان، میدان، کوچه، پلاک، طبقه، واحد...', 'Street, square, alley, number, floor, unit...', 'Cadde, meydan, sokak, kapı no, kat, daire...')}
                className={`p-3.5 rounded-xl border font-vazirmatn text-sm outline-none resize-none transition-colors ${
                  errors.officeAddress
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#c4c5da] focus:border-[#00258e]'
                }`}
              />
              {errors.officeAddress && (
                <span className="text-xs text-red-600 font-semibold">{errors.officeAddress}</span>
              )}
            </div>

            {/* Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('کد پستی ۱۰ رقمی دفتر:', '10-digit office postal code:', 'Ofisin 10 haneli posta kodu:')}</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={officePostalCode}
                  onChange={(e) => {
                    setOfficePostalCode(e.target.value.replace(/\D/g, ''));
                    if (errors.officePostalCode) setErrors({ ...errors, officePostalCode: '' });
                  }}
                  placeholder="1998877665"
                  className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                    errors.officePostalCode
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.officePostalCode && (
                  <span className="text-xs text-red-600 font-semibold">{errors.officePostalCode}</span>
                )}
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center gap-2 text-xs text-[#545f72]">
                <span className="material-symbols-outlined text-[#00258e] text-lg shrink-0">mark_email_read</span>
                <span>{trText('کد پستی جهت تطبیق نشانی با سامانه سازمان امور مالیاتی الزامی است.', 'The postal code is required to match the address with the tax administration system.', 'Adresin vergi idaresi sistemiyle eşleştirilmesi için posta kodu zorunludur.')}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Loading Warehouse / Factory */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#00258e] flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">warehouse</span>
                <span>{trText('محل کارخانه / انبار و بارگیرگاه اصلی (Main Loading Depot)', 'Main factory / warehouse and loading site (Main Loading Depot)', 'Fabrika / depo ve ana yükleme alanı (Main Loading Depot)')}</span>
              </h3>

              <label className="flex items-center gap-2 text-xs font-bold text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsOffice}
                  onChange={(e) => handleToggleSame(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00258e] accent-[#00258e] cursor-pointer"
                />
                <span>{trText('محل بارگیری همان نشانی دفتر مرکزی است', 'The loading location is the same as the head office address', 'Yükleme yeri merkez ofis adresiyle aynıdır')}</span>
              </label>
            </div>

            {!sameAsOffice && (
              <>
                <ProvinceCitySelect
                  selectedProvince={warehouseProvince}
                  selectedCity={warehouseCity}
                  onProvinceChange={(p) => setWarehouseProvince(p)}
                  onCityChange={(c) => setWarehouseCity(c)}
                  selectClassName="w-full h-12 px-3.5 pe-8 rounded-xl border border-[#c4c5da] bg-white font-vazirmatn text-sm outline-none appearance-none focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] cursor-pointer"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">{trText('آدرس دقیق کارخانه، شهرک صنعتی یا انبار:', 'Exact address of the factory, industrial estate or warehouse:', 'Fabrikanın, sanayi sitesinin veya deponun tam adresi:')}</label>
                  <textarea
                    rows={2}
                    value={warehouseAddress}
                    onChange={(e) => {
                      setWarehouseAddress(e.target.value);
                      if (errors.warehouseAddress) setErrors({ ...errors, warehouseAddress: '' });
                    }}
                    placeholder={trText('نام شهرک صنعتی، بلوار، خیابان، پلاک، نام سوله یا انبار...', 'Industrial estate name, boulevard, street, number, shed or warehouse name...', 'Sanayi sitesi adı, bulvar, cadde, kapı no, hangar veya depo adı...')}
                    className={`p-3.5 rounded-xl border font-vazirmatn text-sm outline-none resize-none transition-colors ${
                      errors.warehouseAddress
                        ? 'border-red-500 bg-red-50'
                        : 'border-[#c4c5da] focus:border-[#00258e]'
                    }`}
                  />
                  {errors.warehouseAddress && (
                    <span className="text-xs text-red-600 font-semibold">{errors.warehouseAddress}</span>
                  )}
                </div>
              </>
            )}

            {/* Warehouse Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('نام و سمت مسئول بارگیری / انباردار:', 'Name and position of the loading officer / storekeeper:', 'Yükleme sorumlusunun / depo görevlisinin adı ve unvanı:')}</label>
                <input
                  type="text"
                  value={warehouseContactPerson}
                  onChange={(e) => {
                    setWarehouseContactPerson(e.target.value);
                    if (errors.warehouseContactPerson) setErrors({ ...errors, warehouseContactPerson: '' });
                  }}
                  placeholder={trText('مثال: مهندس رضایی (مدیر لجستیک انبار)', 'e.g. Rezaei (warehouse logistics manager)', 'örn. Rezaei (depo lojistik müdürü)')}
                  className={`h-12 px-3.5 rounded-xl border font-vazirmatn text-sm outline-none transition-colors ${
                    errors.warehouseContactPerson
                      ? 'border-red-500 bg-red-50'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.warehouseContactPerson && (
                  <span className="text-xs text-red-600 font-semibold">{errors.warehouseContactPerson}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('شماره تماس مستقیم انباردار / هماهنگی بارگیری:', 'Direct number of the storekeeper / loading coordination:', 'Depo görevlisinin doğrudan numarası / yükleme koordinasyonu:')}</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={11}
                  value={warehouseContactPhone}
                  onChange={(e) => {
                    setWarehouseContactPhone(e.target.value.replace(/\D/g, ''));
                    if (errors.warehouseContactPhone) setErrors({ ...errors, warehouseContactPhone: '' });
                  }}
                  placeholder="09123456789"
                  className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                    errors.warehouseContactPhone
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.warehouseContactPhone && (
                  <span className="text-xs text-red-600 font-semibold">{errors.warehouseContactPhone}</span>
                )}
              </div>
            </div>

            {/* Warehouse Facilities Checkboxes */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-[#1a1b23] flex items-center justify-between">
                <span>{trText('تجهیزات و امکانات بارگیری موجود در محل انبار:', 'Loading equipment and facilities available at the warehouse:', 'Depoda mevcut yükleme ekipmanı ve olanakları:')}</span>
                <span className="text-[11px] font-jetbrains text-[#00258e]">{trText(`${facilities.length} مورد فعال`, `${facilities.length} active`, `${facilities.length} aktif`)}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAREHOUSE_FACILITIES_OPTIONS.map((f) => {
                  const isChecked = facilities.includes(f.label);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFacility(f.label)}
                      className={`p-3 rounded-xl border text-start flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-[#00258e] bg-[#f4f2fe] text-[#00258e] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#334155]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${isChecked ? 'text-[#00258e]' : 'text-gray-400'}`}>
                        {f.icon}
                      </span>
                      <span className="text-xs flex-1 truncate">{trText(f.label, f.en, f.tr)}</span>
                      <span className="material-symbols-outlined text-[18px]">
                        {isChecked ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0] mt-2">
            <button
              type="button"
              onClick={onPrev}
              className="px-5 py-2.5 rounded-xl border border-[#c4c5da] text-[#475569] text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {trText('مرحله قبل', 'Previous step', 'Önceki adım')}
            </button>

            <Button
              type="button"
              onClick={handleNext}
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined text-[18px]">arrow_back</span>}
            >
              {trText('مرحله بعد: بارگذاری اسناد و مدارک رسمی', 'Next step: upload official documents', 'Sonraki adım: resmî belgeleri yükle')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
