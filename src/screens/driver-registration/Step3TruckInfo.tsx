import React, { useState } from 'react';
import { DriverTruckInfo, UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { RegistrationHeader } from './RegistrationHeader';
import {
  DocumentUploadTile,
  ErrorBanner,
  FormField,
  SectionCard,
  StepActions,
  digitsOnly,
  inputClass,
  readImageAsDataUrl,
  selectClass,
} from './RegistrationFields';

interface Step3TruckInfoProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FLEET_TYPES = [
  { name: 'کشنده تریلی (۱۸ چرخ)', en: 'Tractor-trailer (18 wheels)', tr: 'Çekici treyler (18 teker)', axles: '۱۸ چرخ', capacity: '25' },
  { name: 'کامیون جفت (۱۰ چرخ)', en: 'Tandem truck (10 wheels)', tr: 'Çift dingil kamyon (10 teker)', axles: '۱۰ چرخ', capacity: '15' },
  { name: 'کامیون تک (۶ چرخ)', en: 'Single truck (6 wheels)', tr: 'Tek dingil kamyon (6 teker)', axles: '۶ چرخ', capacity: '10' },
  { name: 'تریلی یخچال‌دار', en: 'Refrigerated trailer', tr: 'Soğutmalı treyler', axles: '۱۸ چرخ', capacity: '22' },
  { name: 'کمپرسی سنگین', en: 'Heavy tipper', tr: 'Ağır damperli', axles: '۱۰ یا ۱۸ چرخ', capacity: '24' },
  { name: 'تانکر حمل مایعات', en: 'Liquid tanker', tr: 'Sıvı tankeri', axles: '۱۸ چرخ', capacity: '30' },
  { name: 'کامیونت و خاور', en: 'Light truck and Khawar', tr: 'Hafif kamyon ve Havar', axles: '۶ چرخ', capacity: '6' },
];

const TRUCK_BRANDS = [
  { fa: 'ولوو (Volvo)', en: 'Volvo', tr: 'Volvo' },
  { fa: 'اسکانیا (Scania)', en: 'Scania', tr: 'Scania' },
  { fa: 'مرسدس بنز (Mercedes-Benz)', en: 'Mercedes-Benz', tr: 'Mercedes-Benz' },
  { fa: 'مان (MAN)', en: 'MAN', tr: 'MAN' },
  { fa: 'داف (DAF)', en: 'DAF', tr: 'DAF' },
  { fa: 'رنو تراکس (Renault)', en: 'Renault Trucks', tr: 'Renault Trucks' },
  { fa: 'ایویکو (IVECO)', en: 'IVECO', tr: 'IVECO' },
  { fa: 'فاو (FAW)', en: 'FAW', tr: 'FAW' },
  { fa: 'شاکمن (Shacman)', en: 'Shacman', tr: 'Shacman' },
  { fa: 'دانگ‌فنگ (Dongfeng)', en: 'Dongfeng', tr: 'Dongfeng' },
  { fa: 'هوو / سینوتراک (HOWO)', en: 'HOWO / Sinotruk', tr: 'HOWO / Sinotruk' },
  { fa: 'ایسوزو (Isuzu)', en: 'Isuzu', tr: 'Isuzu' },
  { fa: 'ماک (Mack)', en: 'Mack', tr: 'Mack' },
  { fa: 'فوتون (Foton)', en: 'Foton', tr: 'Foton' },
  { fa: 'سایر برندها', en: 'Other brands', tr: 'Diğer markalar' },
];

const TRUCK_DOCUMENTS = [
  { id: 'truckCard', title: 'کارت خودرو', en: 'Vehicle registration card', tr: 'Araç tescil kartı', hint: 'تصویر کارت خودرو با مشخصات پلاک', enHint: 'A photo of the vehicle card showing the plate details', trHint: 'Plaka bilgilerini gösteren araç kartı fotoğrafı' },
  { id: 'greenSheet', title: 'برگ سبز (سند مالکیت)', en: 'Green sheet (ownership deed)', tr: 'Yeşil belge (ruhsat)', hint: 'سند مالکیت صادره از پلیس راهور', enHint: 'Ownership deed issued by the traffic police', trHint: 'Trafik polisi tarafından verilen ruhsat' },
  { id: 'insurance', title: 'بیمه‌نامه شخص ثالث', en: 'Third-party insurance policy', tr: 'Üçüncü şahıs sigorta poliçesi', hint: 'بیمه‌نامه معتبر حداقل ۳ ماه', enHint: 'A valid policy of at least 3 months', trHint: 'En az 3 ay geçerli poliçe' },
  { id: 'technicalInspection', title: 'برگه معاینه فنی', en: 'Technical inspection sheet', tr: 'Teknik muayene belgesi', hint: 'گواهی معاینه فنی معتبر', enHint: 'A valid technical inspection certificate', trHint: 'Geçerli teknik muayene belgesi' },
  { id: 'smartCardTruck', title: 'کارت هوشمند ناوگان (راهداری)', en: 'Fleet smart card (road administration)', tr: 'Filo akıllı kartı (karayolları)', hint: 'کارت هوشمند فعال ناوگان باربری', enHint: 'An active smart card for the freight fleet', trHint: 'Geçerli yük filosu akıllı kartı' },
];

const PLATE_LETTERS = ['ع', 'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن', 'و', 'ه', 'ی'];

type TruckForm = Partial<DriverTruckInfo>;

export const Step3TruckInfo: React.FC<Step3TruckInfoProps> = ({ data, onChange, onNext, onPrev }) => {
  const { trText } = useLanguage();
  const [truck, setTruck] = useState<TruckForm>(data.driverTruck ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const docs: Record<string, string> = truck.documents ?? {};

  const update = (fields: TruckForm) => setTruck((prev) => ({ ...prev, ...fields }));

  const handleSelectFleet = (fleet: (typeof FLEET_TYPES)[number]) => {
    update({ type: fleet.name, axles: fleet.axles, capacityTons: fleet.capacity });
  };

  const handleDocFile = async (docId: string, file: File) => {
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setError('');
      update({ documents: { ...docs, [docId]: dataUrl } });
    } catch (err) {
      setError(err instanceof Error ? err.message : trText('بارگذاری تصویر انجام نشد.', 'Image upload failed.', 'Görsel yüklenemedi.'));
    }
  };

  const handleDocRemove = (docId: string) => {
    const next = { ...docs };
    delete next[docId];
    update({ documents: next });
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!truck.type) next.type = trText('نوع ناوگان را انتخاب کنید.', 'Please select a fleet type.', 'Lütfen filo tipini seçin.');
    if (!truck.brand) next.brand = trText('برند خودرو را انتخاب کنید.', 'Please select the vehicle brand.', 'Lütfen araç markasını seçin.');
    if (!truck.model?.trim()) next.model = trText('مدل خودرو را وارد کنید.', 'Please enter the vehicle model.', 'Lütfen araç modelini girin.');
    if (!/^\d{2}$/.test(truck.platePart1 ?? '')) next.plate = trText('شماره پلاک را کامل وارد کنید.', 'Please enter the complete plate number.', 'Lütfen plaka numarasını eksiksiz girin.');
    else if (!/^\d{3}$/.test(truck.platePart2 ?? '')) next.plate = trText('شماره پلاک را کامل وارد کنید.', 'Please enter the complete plate number.', 'Lütfen plaka numarasını eksiksiz girin.');
    else if (!/^\d{2}$/.test(truck.plateIranCode ?? '')) next.plate = trText('کد ایران پلاک را وارد کنید.', 'Please enter the plate Iran code.', 'Lütfen plakanın İran kodunu girin.');
    if (!truck.plateLetter) next.plate = trText('کد ایران پلاک را وارد کنید.', 'Please enter the plate Iran code.', 'Lütfen plakanın İran kodunu girin.');
    if (!truck.capacityTons || Number(truck.capacityTons) <= 0) next.capacityTons = trText('ظرفیت بارگیری را وارد کنید.', 'Please enter the load capacity.', 'Lütfen yük kapasitesini girin.');
    if (!/^\d{4}$/.test(truck.buildYear ?? '')) next.buildYear = trText('سال ساخت را به صورت ۴ رقمی وارد کنید.', 'Please enter the production year as 4 digits.', 'Lütfen üretim yılını 4 hane olarak girin.');
    if (!truck.engineNumber?.trim()) next.engineNumber = trText('شماره موتور را وارد کنید.', 'Please enter the engine number.', 'Lütfen motor numarasını girin.');
    return next;
  };

  const missingDocs = TRUCK_DOCUMENTS.filter((doc) => !docs[doc.id]);

  const handleNext = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError(trText('لطفاً خطاهای فرم را برطرف کنید.', 'Please fix the form errors.', 'Lütfen formdaki hataları düzeltin.'));
      return;
    }
    if (missingDocs.length > 0) {
      setError(trText(`مدارک خودرو کامل نیست (${missingDocs.length} مدرک باقی مانده).`, `Vehicle documents are incomplete (${missingDocs.length} remaining).`, `Araç belgeleri eksik (${missingDocs.length} belge kaldı).`));
      return;
    }
    setError('');

    const finalTruck: DriverTruckInfo = {
      type: truck.type ?? '',
      brand: truck.brand ?? '',
      model: truck.model?.trim() ?? '',
      color: truck.color?.trim() ?? '',
      engineNumber: truck.engineNumber?.trim() ?? '',
      chassisNumber: truck.chassisNumber?.trim() ?? '',
      axles: truck.axles ?? '',
      platePart1: truck.platePart1 ?? '',
      plateLetter: truck.plateLetter ?? '',
      platePart2: truck.platePart2 ?? '',
      plateIranCode: truck.plateIranCode ?? '',
      capacityTons: truck.capacityTons ?? '',
      buildYear: truck.buildYear ?? '',
      documents: docs,
    };

    onChange({
      driverTruck: finalTruck,
      truckModel: `${finalTruck.brand} ${finalTruck.model}`,
      plateNumber: `${finalTruck.platePart1} ${finalTruck.plateLetter} ${finalTruck.platePart2} ایران ${finalTruck.plateIranCode}`,
    });
    onNext();
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <RegistrationHeader
        currentStep={3}
        title={trText('مشخصات خودرو و مدارک ناوگان', 'Vehicle details and fleet documents', 'Araç bilgileri ve filo belgeleri')}
        subtitle={trText('نوع بارگیر، پلاک و مدارک رسمی خودرو', 'Body type, plate and official vehicle documents', 'Kasa tipi, plaka ve resmî araç belgeleri')}
        onBack={onPrev}
      />

      <main className="w-full max-w-3xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6">
        <ErrorBanner message={error} />

        <SectionCard icon="local_shipping" title={trText('نوع ناوگان', 'Fleet type', 'Filo tipi')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FLEET_TYPES.map((fleet) => {
              const selected = truck.type === fleet.name;
              return (
                <button
                  key={fleet.name}
                  type="button"
                  onClick={() => handleSelectFleet(fleet)}
                  aria-pressed={selected}
                  className={`p-3 rounded-xl border text-right text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'border-[#00258e] bg-[#00258e]/5 ring-2 ring-[#00258e]/20 text-[#00258e]'
                      : 'border-[#cbd5e1] text-[#334155] hover:border-[#00258e]'
                  }`}
                >
                  {trText(fleet.name, fleet.en, fleet.tr)}
                </button>
              );
            })}
          </div>
          {errors.type && <p className="text-[11px] font-medium text-rose-600">{errors.type}</p>}
        </SectionCard>

        <SectionCard icon="pin" title={trText('مشخصات خودرو', 'Vehicle details', 'Araç bilgileri')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={trText('برند خودروساز', 'Manufacturer brand', 'Üretici markası')} error={errors.brand}>
              <select value={truck.brand ?? ''} onChange={(e) => update({ brand: e.target.value })} className={selectClass}>
                <option value="">{trText('انتخاب برند', 'Select brand', 'Marka seçin')}</option>
                {TRUCK_BRANDS.map((brand) => (
                  <option key={brand.fa} value={brand.fa}>{trText(brand.fa, brand.en, brand.tr)}</option>
                ))}
              </select>
            </FormField>
            <FormField label={trText('مدل خودرو', 'Vehicle model', 'Araç modeli')} error={errors.model}>
              <input
                type="text"
                value={truck.model ?? ''}
                onChange={(e) => update({ model: e.target.value })}
                placeholder={trText('مثال: FH500', 'e.g. FH500', 'örn. FH500')}
                className={`${inputClass} font-jetbrains`}
              />
            </FormField>
            <FormField label={trText('ظرفیت بارگیری (تن)', 'Load capacity (tons)', 'Yük kapasitesi (ton)')} error={errors.capacityTons}>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={truck.capacityTons ?? ''}
                onChange={(e) => update({ capacityTons: e.target.value.replace(/[^\d.]/g, '') })}
                className={`${inputClass} font-jetbrains`}
              />
            </FormField>
            <FormField label={trText('سال ساخت', 'Production year', 'Üretim yılı')} error={errors.buildYear}>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={4}
                value={truck.buildYear ?? ''}
                onChange={(e) => update({ buildYear: digitsOnly(e.target.value) })}
                className={`${inputClass} font-jetbrains`}
              />
            </FormField>
            <FormField label={trText('شماره موتور', 'Engine number', 'Motor numarası')} error={errors.engineNumber}>
              <input
                type="text"
                dir="ltr"
                value={truck.engineNumber ?? ''}
                onChange={(e) => update({ engineNumber: e.target.value.toUpperCase() })}
                className={`${inputClass} font-jetbrains uppercase`}
              />
            </FormField>
            <FormField label={trText('شماره شاسی (اختیاری)', 'Chassis number (optional)', 'Şasi numarası (isteğe bağlı)')} hint={trText('مندرج در برگ سبز', 'Shown on the green sheet', 'Yeşil belgede yer alır')}>
              <input
                type="text"
                dir="ltr"
                value={truck.chassisNumber ?? ''}
                onChange={(e) => update({ chassisNumber: e.target.value.toUpperCase() })}
                className={`${inputClass} font-jetbrains uppercase`}
              />
            </FormField>
          </div>

          <FormField label={trText('پلاک انتظامی', 'Licence plate', 'Tescil plakası')} error={errors.plate} hint={trText('مطابق با کارت خودرو و برگ سبز وارد شود', 'Must match the vehicle card and green sheet', 'Araç kartı ve yeşil belgeyle aynı olmalıdır')}>
            <div dir="ltr" className="grid grid-cols-4 gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                aria-label={trText('دو رقم اول پلاک', 'First two digits of the plate', 'Plakanın ilk iki hanesi')}
                value={truck.platePart1 ?? ''}
                onChange={(e) => update({ platePart1: digitsOnly(e.target.value) })}
                placeholder="۱۲"
                className={`${inputClass} text-center font-jetbrains font-bold`}
              />
              <select
                aria-label={trText('حرف پلاک', 'Plate letter', 'Plaka harfi')}
                value={truck.plateLetter ?? ''}
                onChange={(e) => update({ plateLetter: e.target.value })}
                className={`${selectClass} text-center font-bold`}
              >
                <option value="">{trText('حرف', 'Letter', 'Harf')}</option>
                {PLATE_LETTERS.map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                aria-label={trText('سه رقم پلاک', 'Three digits of the plate', 'Plakanın üç hanesi')}
                value={truck.platePart2 ?? ''}
                onChange={(e) => update({ platePart2: digitsOnly(e.target.value) })}
                placeholder="۳۴۵"
                className={`${inputClass} text-center font-jetbrains font-bold`}
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                aria-label={trText('کد ایران', 'Iran code', 'İran kodu')}
                value={truck.plateIranCode ?? ''}
                onChange={(e) => update({ plateIranCode: digitsOnly(e.target.value) })}
                placeholder={trText('ایران ۲۲', 'Iran 22', 'İran 22')}
                className={`${inputClass} text-center font-jetbrains font-bold`}
              />
            </div>
          </FormField>
        </SectionCard>

        <SectionCard icon="assignment" title={trText('مدارک رسمی خودرو', 'Official vehicle documents', 'Resmî araç belgeleri')}>
          <div className="space-y-3">
            {TRUCK_DOCUMENTS.map((doc) => (
              <DocumentUploadTile
                key={doc.id}
                inputId={`truck-doc-${doc.id}`}
                title={trText(doc.title, doc.en, doc.tr)}
                hint={trText(doc.hint, doc.enHint, doc.trHint)}
                required
                value={docs[doc.id]}
                onFile={(file) => handleDocFile(doc.id, file)}
                onRemove={() => handleDocRemove(doc.id)}
              />
            ))}
          </div>
        </SectionCard>

        <StepActions onBack={onPrev} onNext={handleNext} nextLabel={trText('ادامه به اطلاعات بانکی', 'Continue to bank details', 'Banka bilgilerine devam et')} />
      </main>
    </div>
  );
};
