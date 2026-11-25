import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ShipperRegistrationHeaderProps {
  currentStep: number;
  totalSteps?: number;
  stepTitle: string;
  stepSubtitle: string;
  onPrev: () => void;
  onGoToStep?: (step: number) => void;
}

const SHIPPER_STEPS_META = [
  { id: 1, title: 'نوع فعالیت', enTitle: 'Activity type', trTitle: 'Faaliyet türü', fullTitle: 'نوع شخصیت و حوزه فعالیت تجاری', enFullTitle: 'Entity type and area of commercial activity', trFullTitle: 'Tüzel kişilik türü ve ticari faaliyet alanı', icon: 'domain' },
  { id: 2, title: 'مشخصات ثبتی', enTitle: 'Registration details', trTitle: 'Tescil bilgileri', fullTitle: 'شناسه ملی، کد اقتصادی و اطلاعات مدیران', enFullTitle: 'National ID, economic code and management details', trFullTitle: 'Ulusal kimlik, ekonomik kod ve yönetici bilgileri', icon: 'badge' },
  { id: 3, title: 'نشانی و انبارها', enTitle: 'Address and warehouses', trTitle: 'Adres ve depolar', fullTitle: 'محل دفتر مرکزی، کارخانه و بارگیرگاه', enFullTitle: 'Head office, factory and loading site locations', trFullTitle: 'Merkez ofis, fabrika ve yükleme alanı konumları', icon: 'warehouse' },
  { id: 4, title: 'بارگذاری اسناد', enTitle: 'Document upload', trTitle: 'Belge yükleme', fullTitle: 'روزنامه رسمی، ارزش افزوده و مدارک هویتی', enFullTitle: 'Official gazette, VAT and identity documents', trFullTitle: 'Resmî gazete, KDV ve kimlik belgeleri', icon: 'upload_file' },
  { id: 5, title: 'حساب و تأیید', enTitle: 'Account and confirmation', trTitle: 'Hesap ve onay', fullTitle: 'شماره شبا، تعهدنامه امانی و ارسال نهایی', enFullTitle: 'IBAN, escrow undertaking and final submission', trFullTitle: 'IBAN, emanet taahhüdü ve nihai gönderim', icon: 'verified' },
];

export const ShipperRegistrationHeader: React.FC<ShipperRegistrationHeaderProps> = ({
  currentStep,
  totalSteps = 5,
  stepTitle,
  onPrev,
  onGoToStep,
}) => {
  const { trText } = useLanguage();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <>
      <header className="w-full bg-white border-b border-[#e2e8f0] sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrev}
                className="w-10 h-10 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                title={trText('بازگشت', 'Back', 'Geri')}
              >
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00258e]/10 text-[#00258e] font-jetbrains">
                    {trText(`صاحب بار • مرحله ${currentStep} از ${totalSteps}`, `Shipper • Step ${currentStep} of ${totalSteps}`, `Yük sahibi • Adım ${currentStep} / ${totalSteps}`)}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {trText('همگام‌سازی ابری با سوپابیس', 'Cloud sync with Supabase', 'Supabase ile bulut eşitleme')}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-[#0f172a] mt-0.5 flex items-center gap-1.5">
                  <span>{stepTitle}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-2.5 py-1.5 rounded-xl border border-[#cbd5e1] text-[#475569] hover:text-[#00258e] hover:border-[#00258e] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
                <span className="hidden sm:inline">{trText('راهنمای مدارک حقوقی', 'Legal document guide', 'Tüzel belge rehberi')}</span>
              </button>

              <div className="text-left font-jetbrains">
                <span className="text-xs font-bold text-[#00258e]">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-[#00258e] to-[#2563eb] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Step Navigator */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-3 pt-1">
            {SHIPPER_STEPS_META.map((s) => {
              const isCurrent = s.id === currentStep;
              const isPast = s.id < currentStep;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onGoToStep?.(s.id)}
                  className={`flex flex-col items-center p-1.5 rounded-xl transition-all text-center group cursor-pointer ${
                    isCurrent
                      ? 'bg-[#00258e]/5 border border-[#00258e]/30 shadow-xs'
                      : isPast
                      ? 'hover:bg-[#f8fafc]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={trText(s.fullTitle, s.enFullTitle, s.trFullTitle)}
                >
                  <div className="flex items-center justify-center">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${
                        isCurrent
                          ? 'bg-[#00258e] text-white shadow-sm ring-2 ring-[#00258e]/20'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#e2e8f0] text-[#64748b]'
                      }`}
                    >
                      {isPast ? (
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                      ) : (
                        <span className="font-jetbrains">{s.id}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold mt-1 truncate max-w-full ${
                      isCurrent
                        ? 'text-[#00258e]'
                        : isPast
                        ? 'text-emerald-700'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {trText(s.title, s.enTitle, s.trTitle)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Shipper Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150 font-vazirmatn">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2 text-[#00258e]">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
                <h3 className="font-bold text-base text-[#0f172a]">{trText('راهنمای مدارک احراز هویت صاحبان بار', 'Shipper identity verification document guide', 'Yük sahibi kimlik doğrulama belge rehberi')}</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#334155] leading-relaxed">
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#00258e] text-lg mt-0.5">domain</span>
                <div>
                  <h4 className="font-bold text-[#0f172a] mb-0.5">{trText('شخصیت‌های حقوقی (شرکت‌ها و کارخانجات):', 'Legal entities (companies and factories):', 'Tüzel kişiler (şirketler ve fabrikalar):')}</h4>
                  <p className="text-[#64748b]">{trText('روزنامه رسمی تاسیس و آخرین تغییرات، گواهی ثبت نام ارزش افزوده، شناسه ملی ۱۱ رقمی، کارت ملی مدیرعامل و شماره شبا حقوقی شرکت.', 'Official gazette of incorporation and latest amendments, VAT registration certificate, 11-digit national company ID, CEO national ID card and the company corporate IBAN.', 'Kuruluş ve son değişikliklere ait resmî gazete, KDV kayıt belgesi, 11 haneli ulusal şirket kimliği, genel müdürün kimlik kartı ve şirketin kurumsal IBAN numarası.')}</p>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg mt-0.5">person</span>
                <div>
                  <h4 className="font-bold text-[#0f172a] mb-0.5">{trText('شخصیت‌های حقیقی (کسب‌وکارهای صنفی و تجار):', 'Natural persons (guild businesses and traders):', 'Gerçek kişiler (esnaf işletmeleri ve tüccarlar):')}</h4>
                  <p className="text-[#64748b]">{trText('کارت ملی، شناسنامه، جواز کسب / پروانه فعالیت معتبر از اتحادیه و شماره شبا تجاری فردی.', 'National ID card, birth certificate, a valid business licence / activity permit from the guild union and the personal commercial IBAN.', 'Kimlik kartı, nüfus cüzdanı, esnaf odasından geçerli işyeri ruhsatı / faaliyet izni ve kişisel ticari IBAN.')}</p>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5">cloud_sync</span>
                <div>
                  <h4 className="font-bold text-[#0f172a] mb-0.5">{trText('ذخیره خودکار در سوپابیس:', 'Automatic saving in Supabase:', 'Supabase\'te otomatik kayıt:')}</h4>
                  <p className="text-[#64748b]">{trText('تمام اطلاعات در هر مرحله در جدول shippers و فایل‌های اسناد در جدول shipper_documents پایگاه داده با قابلیت اتصال مجدد ذخیره می‌گردند.', 'At every step all information is stored in the shippers table and the document files in the shipper_documents table of the database, and can be resumed later.', 'Her adımda tüm bilgiler veritabanının shippers tablosuna, belge dosyaları ise shipper_documents tablosuna kaydedilir ve daha sonra kaldığınız yerden devam edebilirsiniz.')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#00258e] text-white rounded-xl font-bold text-xs hover:bg-[#001f75] cursor-pointer"
            >
              {trText('متوجه شدم، ادامه تکمیل مدارک', 'Got it, continue completing the documents', 'Anladım, belgeleri tamamlamaya devam et')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
