import React, { useState } from 'react';
import { UserProfile, ShipperDocuments } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShipperRegistrationHeader } from './ShipperRegistrationHeader';
import { Button } from '../../components/ui/Button';

interface Step4DocumentsUploadProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

interface DocSlot {
  key: keyof ShipperDocuments;
  title: string;
  en: string;
  tr: string;
  subtitle: string;
  enSubtitle: string;
  trSubtitle: string;
  required: boolean;
  icon: string;
  samplePlaceholder: string;
}

const LEGAL_DOC_SLOTS: DocSlot[] = [
  {
    key: 'officialGazette',
    title: 'روزنامه رسمی تاسیس و آخرین تغییرات',
    en: 'Official gazette of incorporation and latest amendments',
    tr: 'Kuruluş ve son değişikliklere ait resmî gazete',
    subtitle: 'آگهی تاسیس و روزنامه رسمی آخرین تغییرات هیئت مدیره و دارندگان حق امضا',
    enSubtitle: 'Incorporation notice and the official gazette of the latest changes to the board and authorised signatories',
    trSubtitle: 'Kuruluş ilanı ve yönetim kurulu ile imza yetkililerindeki son değişikliklere ait resmî gazete',
    required: true,
    icon: 'newspaper',
    samplePlaceholder: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'vatCertificate',
    title: 'گواهی ثبت‌نام مالیات بر ارزش افزوده (VAT)',
    en: 'Value added tax (VAT) registration certificate',
    tr: 'Katma değer vergisi (KDV) kayıt belgesi',
    subtitle: 'گواهی معتبر سامانه جامع امور مالیاتی جهت صدور فاکتور رسمی ماده ۱۶۹',
    enSubtitle: 'A valid certificate from the integrated tax system for issuing the official Article 169 invoice',
    trSubtitle: '169. madde resmî faturasının düzenlenmesi için entegre vergi sisteminden geçerli belge',
    required: true,
    icon: 'receipt_long',
    samplePlaceholder: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'businessLicense',
    title: 'پروانه بهره‌برداری / جواز تاسیس / پروانه کسب',
    en: 'Operating licence / establishment permit / business licence',
    tr: 'İşletme izni / kuruluş ruhsatı / işyeri ruhsatı',
    subtitle: 'مجوز رسمی صادره از وزارت صمت، اتحادیه صنفی یا جهاد کشاورزی',
    enSubtitle: 'Official permit issued by the Ministry of Industry, the guild union or the agricultural Jihad',
    trSubtitle: 'Sanayi Bakanlığı, esnaf odası veya tarım teşkilatı tarafından verilen resmî izin',
    required: true,
    icon: 'verified',
    samplePlaceholder: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'nationalCardCeoFront',
    title: 'کارت ملی مدیرعامل / نماینده (روی کارت)',
    en: 'CEO / representative national ID card (front)',
    tr: 'Genel müdür / temsilci kimlik kartı (ön yüz)',
    subtitle: 'تصویر واضح و باکیفیت از روی کارت ملی هوشمند',
    enSubtitle: 'A clear, high-quality photo of the front of the smart national ID card',
    trSubtitle: 'Akıllı kimlik kartının ön yüzünün net ve kaliteli fotoğrafı',
    required: true,
    icon: 'badge',
    samplePlaceholder: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'nationalCardCeoBack',
    title: 'کارت ملی مدیرعامل / نماینده (پشت کارت)',
    en: 'CEO / representative national ID card (back)',
    tr: 'Genel müdür / temsilci kimlik kartı (arka yüz)',
    subtitle: 'تصویر پشت کارت ملی با مشخص بودن بارکد و کد پستی',
    enSubtitle: 'A photo of the back of the national ID card with the barcode and postal code visible',
    trSubtitle: 'Kimlik kartının arka yüzünün barkod ve posta kodu görünecek şekilde fotoğrafı',
    required: true,
    icon: 'flip_to_back',
    samplePlaceholder: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'bankIbanConfirmation',
    title: 'تاییدیه شماره شبا بانکی حقوقی',
    en: 'Corporate bank IBAN confirmation letter',
    tr: 'Kurumsal banka IBAN onay yazısı',
    subtitle: 'نامه تاییدیه شبا از بانک عامل با مهر شعبه به نام شرکت یا صاحب حساب',
    enSubtitle: 'An IBAN confirmation letter from the operating bank with the branch stamp in the name of the company or account holder',
    trSubtitle: 'Şirket veya hesap sahibi adına şube kaşeli, çalışılan bankadan IBAN onay yazısı',
    required: true,
    icon: 'account_balance',
    samplePlaceholder: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'factoryOwnershipLease',
    title: 'سند مالکیت یا اجاره‌نامه کارخانه / انبار',
    en: 'Factory / warehouse ownership deed or lease agreement',
    tr: 'Fabrika / depo tapusu veya kira sözleşmesi',
    subtitle: 'سند رسمی یا اجاره‌نامه دارای کد رهگیری محل انبار و تخلیه بار',
    enSubtitle: 'An official deed or lease agreement with a tracking code for the warehouse and unloading location',
    trSubtitle: 'Depo ve boşaltma yeri için takip kodlu resmî tapu veya kira sözleşmesi',
    required: false,
    icon: 'home_work',
    samplePlaceholder: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
  },
  {
    key: 'signatureSpecimen',
    title: 'گواهی امضای صاحبان امضا در دفترخانه اسناد رسمی',
    en: 'Signature specimen certificate of authorised signatories at the notary',
    tr: 'İmza yetkililerinin noter onaylı imza beyannamesi',
    subtitle: 'فرم گواهی امضای مدیرعامل و اعضای دارای امضای تعهدآور شرکت',
    enSubtitle: 'Signature certificate form of the CEO and the members with binding signature authority',
    trSubtitle: 'Genel müdürün ve şirketi bağlayıcı imza yetkisi olan üyelerin imza beyannamesi formu',
    required: false,
    icon: 'draw',
    samplePlaceholder: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
  },
];

export const Step4DocumentsUpload: React.FC<Step4DocumentsUploadProps> = ({
  data,
  onChange,
  onNext,
  onPrev,
  onGoToStep,
}) => {
  const { trText } = useLanguage();
  const [docs, setDocs] = useState<ShipperDocuments>(data.shipperDocuments || {});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openGalleryForShipperDoc = (key: keyof ShipperDocuments) => {
    const input = document.getElementById(`shipper-gallery-input-${key}`) as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const openCameraForShipperDoc = (key: keyof ShipperDocuments) => {
    const input = document.getElementById(`shipper-camera-input-${key}`) as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleFileUpload = (key: keyof ShipperDocuments, file: File) => {
    setUploadingKey(key);
    setErrorMsg(null);

    // Convert file to Base64 or local object URL
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setDocs((prev) => {
        const updated = { ...prev, [key]: result };
        onChange({ shipperDocuments: updated });
        return updated;
      });
      setUploadingKey(null);
    };
    reader.onerror = () => {
      setUploadingKey(null);
      setErrorMsg(trText('خطا در خواندن فایل، لطفاً مجدداً تلاش نمایید.', 'Error reading the file, please try again.', 'Dosya okunurken hata oluştu, lütfen tekrar deneyin.'));
    };
    reader.readAsDataURL(file);
  };

  const handleSetSampleDoc = (key: keyof ShipperDocuments, sampleUrl: string) => {
    setDocs((prev) => {
      const updated = { ...prev, [key]: sampleUrl };
      onChange({ shipperDocuments: updated });
      return updated;
    });
  };

  const handleRemoveDoc = (key: keyof ShipperDocuments) => {
    setDocs((prev) => {
      const updated = { ...prev, [key]: undefined };
      onChange({ shipperDocuments: updated });
      return updated;
    });
  };

  const handleFillAllSampleDocuments = () => {
    const filledDocs: ShipperDocuments = {};
    LEGAL_DOC_SLOTS.forEach((slot) => {
      filledDocs[slot.key] = slot.samplePlaceholder;
    });
    setDocs(filledDocs);
    onChange({ shipperDocuments: filledDocs });
  };

  const validate = () => {
    const missingRequired = LEGAL_DOC_SLOTS.filter((s) => s.required && !docs[s.key]);
    if (missingRequired.length > 0) {
      setErrorMsg(trText(`لطفاً مدارک الزامی را بارگذاری نمایید: ${missingRequired.map((m) => m.title).join('، ')}`, `Please upload the required documents: ${missingRequired.map((m) => m.en).join(', ')}`, `Lütfen zorunlu belgeleri yükleyin: ${missingRequired.map((m) => m.tr).join(', ')}`));
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    onChange({ shipperDocuments: docs });
    onNext();
  };

  const completedCount = LEGAL_DOC_SLOTS.filter((s) => !!docs[s.key]).length;
  const requiredCount = LEGAL_DOC_SLOTS.filter((s) => s.required).length;
  const requiredCompletedCount = LEGAL_DOC_SLOTS.filter((s) => s.required && !!docs[s.key]).length;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex flex-col font-vazirmatn">
      <ShipperRegistrationHeader
        currentStep={4}
        stepTitle={trText('بارگذاری اسناد، مدارک رسمی و گواهی‌ها', 'Upload of documents, official papers and certificates', 'Belge, resmî evrak ve sertifika yükleme')}
        stepSubtitle={trText('بارگذاری تصاویر واضح از مدارک ثبتی، مالیاتی و هویتی جهت تایید حساب رسمی', 'Upload clear photos of registration, tax and identity documents to verify the official account', 'Resmî hesabın doğrulanması için tescil, vergi ve kimlik belgelerinin net fotoğraflarını yükleyin')}
        onPrev={onPrev}
        onGoToStep={onGoToStep}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Status Bar */}
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">folder_zip</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1a1b23]">{trText('وضعیت بارگذاری پرونده مدارک', 'Document file upload status', 'Belge dosyası yükleme durumu')}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-jetbrains font-bold">
                  {trText(`${requiredCompletedCount} / ${requiredCount} الزامی`, `${requiredCompletedCount} / ${requiredCount} required`, `${requiredCompletedCount} / ${requiredCount} zorunlu`)}
                </span>
              </div>
              <p className="text-xs text-[#545f72] mt-0.5">
                {trText(`مجموع مدارک آپلود شده: ${completedCount} از ${LEGAL_DOC_SLOTS.length} سند`, `Total documents uploaded: ${completedCount} of ${LEGAL_DOC_SLOTS.length}`, `Yüklenen toplam belge: ${completedCount} / ${LEGAL_DOC_SLOTS.length}`)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillAllSampleDocuments}
            className="px-3.5 py-2 rounded-xl bg-[#f4f2fe] border border-[#c4c5da] text-[#00258e] hover:bg-[#eeedf9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">auto_fix_high</span>
            <span>{trText('تکمیل خودکار مدارک نمونه (دمو)', 'Auto-fill sample documents (demo)', 'Örnek belgeleri otomatik doldur (demo)')}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800 font-medium">
            <span className="material-symbols-outlined text-red-600 shrink-0">error</span>
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_DOC_SLOTS.map((slot) => {
            const uploadedUrl = docs[slot.key];
            const isUploading = uploadingKey === slot.key;

            return (
              <div
                key={slot.key}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                  uploadedUrl
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : slot.required
                    ? 'border-[#c4c5da]'
                    : 'border-[#e2e8f0]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        uploadedUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-[#f4f2fe] text-[#00258e]'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {uploadedUrl ? 'check_circle' : slot.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1a1b23] flex items-center gap-1.5">
                          <span>{trText(slot.title, slot.en, slot.tr)}</span>
                          {slot.required ? (
                            <span className="text-[10px] text-red-500 font-normal">{trText('(الزامی)', '(required)', '(zorunlu)')}</span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-normal">{trText('(اختیاری)', '(optional)', '(isteğe bağlı)')}</span>
                          )}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#545f72] leading-relaxed mb-3">
                    {trText(slot.subtitle, slot.enSubtitle, slot.trSubtitle)}
                  </p>

                  {/* Uploaded Preview or Upload Box */}
                  {uploadedUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#e2e8f0] bg-gray-50 h-32 group mb-3">
                      <img
                        src={uploadedUrl}
                        alt={trText(slot.title, slot.en, slot.tr)}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(slot.key)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-red-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>{trText('حذف', 'Remove', 'Kaldır')}</span>
                        </button>
                      </div>
                      <div className="absolute top-2 end-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        <span>{trText('بارگذاری شد', 'Uploaded', 'Yüklendi')}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => openGalleryForShipperDoc(slot.key)}
                      className="border-2 border-dashed border-[#c4c5da] hover:border-[#00258e] active:scale-[0.99] rounded-xl p-4 text-center bg-[#f8fafc] hover:bg-[#00258e]/5 transition-all mb-3 cursor-pointer select-none"
                      title={trText('لمس کنید تا گالری گوشی باز شود', 'Tap to open the phone gallery', 'Telefon galerisini açmak için dokunun')}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center py-3">
                          <span className="material-symbols-outlined text-2xl text-[#00258e] animate-spin">
                            progress_activity
                          </span>
                          <span className="text-xs font-bold text-[#00258e] mt-2">{trText('در حال بارگذاری فایل...', 'Uploading the file...', 'Dosya yükleniyor...')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                          <span className="material-symbols-outlined text-3xl text-[#00258e] mb-1">
                            photo_library
                          </span>
                          <span className="text-xs font-bold text-[#00258e]">
                            {trText('لمس کنید جهت انتخاب از گالری گوشی', 'Tap to choose from the phone gallery', 'Telefon galerisinden seçmek için dokunun')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-jetbrains mt-0.5" dir="ltr">
                            {trText('تصویر سند یا فایل PDF (تا ۱۵ مگابایت)', 'Document image or PDF file (up to 15 MB)', 'Belge görseli veya PDF dosyası (15 MB\'a kadar)')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload & Sample Controls */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]">
                  {/* Direct Gallery Button */}
                  <button
                    type="button"
                    onClick={() => openGalleryForShipperDoc(slot.key)}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#00258e]/10 hover:bg-[#00258e]/20 text-[#00258e] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_library</span>
                    <span>{uploadedUrl ? trText('تغییر از گالری', 'Change from gallery', 'Galeriden değiştir') : trText('انتخاب از گالری', 'Choose from gallery', 'Galeriden seç')}</span>
                  </button>

                  {/* Direct Camera Button */}
                  <button
                    type="button"
                    onClick={() => openCameraForShipperDoc(slot.key)}
                    className="py-2 px-2.5 rounded-lg border border-[#c4c5da] text-[#475569] hover:text-[#00258e] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95 shrink-0"
                    title={trText('عکاسی مستقیم با دوربین', 'Take a photo directly with the camera', 'Doğrudan kamera ile fotoğraf çek')}
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span className="hidden sm:inline">{trText('دوربین', 'Camera', 'Kamera')}</span>
                  </button>

                  {!uploadedUrl && (
                    <button
                      type="button"
                      onClick={() => handleSetSampleDoc(slot.key, slot.samplePlaceholder)}
                      className="py-2 px-2.5 rounded-lg border border-[#c4c5da] text-[#545f72] hover:text-[#00258e] text-[11px] font-bold transition-colors cursor-pointer shrink-0 active:scale-95"
                      title={trText('نمونه آزمایشی', 'Test sample', 'Deneme örneği')}
                    >
                      {trText('نمونه', 'Sample', 'Örnek')}
                    </button>
                  )}

                  {/* Off-screen Inputs */}
                  <input
                    id={`shipper-gallery-input-${slot.key}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(slot.key, f);
                      e.target.value = '';
                    }}
                    style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                  />
                  <input
                    id={`shipper-camera-input-${slot.key}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(slot.key, f);
                      e.target.value = '';
                    }}
                    style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-4 shadow-xs flex items-center justify-between">
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
            {trText('مرحله بعد: اطلاعات حساب بانکی و ثبت نهایی', 'Next step: bank account information and final submission', 'Sonraki adım: banka hesap bilgileri ve nihai kayıt')}
          </Button>
        </div>
      </main>
    </div>
  );
};
