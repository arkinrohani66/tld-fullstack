import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShipperRegistrationHeader } from './ShipperRegistrationHeader';
import { Button } from '../../components/ui/Button';

interface Step2CompanyDetailsProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

export const Step2CompanyDetails: React.FC<Step2CompanyDetailsProps> = ({
  data,
  onChange,
  onNext,
  onPrev,
  onGoToStep,
}) => {
  const { trText } = useLanguage();
  const existingCompany = data.shipperCompany || {
    shipperType: 'LEGAL_ENTITY',
    companyName: data.companyName || '',
    companyType: 'سهامی خاص',
    nationalCompanyId: '10102938472',
    registrationNumber: '482910',
    economicCode: '411582910482',
    establishmentDate: '1388/05/12',
    industrySector: 'فولاد، آهن‌آلات و صنایع فلزی',
    monthlyFreightVolumeTons: '1500',
    preferredTruckTypes: ['ترانزیت چادری (کشویی و سقف)'],
    ceoFullName: data.fullName || 'مهندس مسعود کریمی',
    ceoNationalId: data.nationalId || '0071928374',
    ceoMobile: data.mobile || '09121112233',
    landlinePhone: '02188776655',
    website: 'https://kaveh-steel.com',
  };

  const isLegal = existingCompany.shipperType === 'LEGAL_ENTITY';

  const [nationalCompanyId, setNationalCompanyId] = useState<string>(existingCompany.nationalCompanyId || '10102938472');
  const [registrationNumber, setRegistrationNumber] = useState<string>(existingCompany.registrationNumber || '482910');
  const [economicCode, setEconomicCode] = useState<string>(existingCompany.economicCode || '411582910482');
  const [establishmentDate, setEstablishmentDate] = useState<string>(existingCompany.establishmentDate || '1388/05/12');
  const [ceoFullName, setCeoFullName] = useState<string>(existingCompany.ceoFullName || data.fullName || 'مهندس مسعود کریمی');
  const [ceoNationalId, setCeoNationalId] = useState<string>(existingCompany.ceoNationalId || data.nationalId || '0071928374');
  const [ceoMobile, setCeoMobile] = useState<string>(existingCompany.ceoMobile || data.mobile || '09121112233');
  const [landlinePhone, setLandlinePhone] = useState<string>(existingCompany.landlinePhone || '02188776655');
  const [website, setWebsite] = useState<string>(existingCompany.website || 'https://kaveh-steel.com');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    if (isLegal) {
      const cleanCompanyId = nationalCompanyId.replace(/\D/g, '');
      if (!cleanCompanyId || cleanCompanyId.length !== 11) {
        errs.nationalCompanyId = trText('شناسه ملی شرکت باید دقیقاً ۱۱ رقم باشد', 'The national company ID must be exactly 11 digits', 'Ulusal şirket kimliği tam olarak 11 haneli olmalıdır');
      }

      if (!registrationNumber.trim()) {
        errs.registrationNumber = trText('شماره ثبت شرکت الزامی است', 'The company registration number is required', 'Şirket tescil numarası zorunludur');
      }

      const cleanEcon = economicCode.replace(/\D/g, '');
      if (!cleanEcon || cleanEcon.length !== 12) {
        errs.economicCode = trText('کد اقتصادی ۱۲ رقمی سازمان امور مالیاتی الزامی است', 'The 12-digit economic code of the tax administration is required', 'Vergi idaresinin 12 haneli ekonomik kodu zorunludur');
      }
    }

    if (!ceoFullName.trim()) {
      errs.ceoFullName = isLegal ? trText('نام و نام خانوادگی مدیرعامل / نماینده الزامی است', 'The full name of the CEO / representative is required', 'Genel müdürün / temsilcinin adı ve soyadı zorunludur') : trText('نام و نام خانوادگی متقاضی الزامی است', 'The applicant full name is required', 'Başvuru sahibinin adı ve soyadı zorunludur');
    }

    const cleanCeoNid = ceoNationalId.replace(/\D/g, '');
    if (!cleanCeoNid || cleanCeoNid.length !== 10) {
      errs.ceoNationalId = trText('کد ملی ۱۰ رقمی مدیرعامل / صاحب بار الزامی است', 'The 10-digit national ID of the CEO / shipper is required', 'Genel müdürün / yük sahibinin 10 haneli kimlik numarası zorunludur');
    }

    const cleanMobile = ceoMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      errs.ceoMobile = trText('شماره موبایل معتبر الزامی است', 'A valid mobile number is required', 'Geçerli bir cep telefonu numarası zorunludur');
    }

    if (!landlinePhone.trim()) {
      errs.landlinePhone = trText('تلفن ثابت دفتر با کد شهر الزامی است', 'The office landline number with the city code is required', 'Ofisin şehir kodlu sabit telefonu zorunludur');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    const updatedCompany = {
      ...existingCompany,
      nationalCompanyId,
      registrationNumber,
      economicCode,
      establishmentDate,
      ceoFullName,
      ceoNationalId,
      ceoMobile,
      landlinePhone,
      website,
    };

    onChange({
      fullName: ceoFullName,
      nationalId: ceoNationalId,
      mobile: ceoMobile,
      shipperCompany: updatedCompany,
    });

    onNext();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex flex-col font-vazirmatn">
      <ShipperRegistrationHeader
        currentStep={2}
        stepTitle={trText('مشخصات ثبتی، کد اقتصادی و اطلاعات مدیران', 'Registration details, economic code and management information', 'Tescil bilgileri, ekonomik kod ve yönetici bilgileri')}
        stepSubtitle={trText('استعلام و تطبیق اطلاعات با پایگاه ثبت اسناد و املاک و سازمان امور مالیاتی', 'Inquiry and matching of the information with the deeds and properties registry and the tax administration', 'Bilgilerin tapu ve kadastro kayıtları ile vergi idaresi veritabanıyla sorgulanması ve eşleştirilmesi')}
        onPrev={onPrev}
        onGoToStep={onGoToStep}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Verified Notice */}
        <div className="bg-[#f4f2fe] border border-[#c4c5da] rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00258e] text-2xl">verified_user</span>
            <div className="text-xs">
              <span className="font-bold text-[#1a1b23] block">{trText('استعلام برخط شناسه ملی و کد اقتصادی:', 'Online inquiry of the national ID and economic code:', 'Ulusal kimlik ve ekonomik kodun çevrimiçi sorgusu:')}</span>
              <span className="text-[#545f72]">
                {trText('اطلاعات وارد شده به صورت برخط جهت صدور بارنامه الکترونیک و صورتحساب رسمی ارزش افزوده ماده ۱۶۹ مکرر بررسی می‌گردد.', 'The information entered is checked online for issuing the electronic waybill and the official VAT invoice under repeated Article 169.', 'Girilen bilgiler, elektronik irsaliye ve mükerrer 169. madde kapsamındaki resmî KDV faturası düzenlenmesi için çevrimiçi kontrol edilir.')}
              </span>
            </div>
          </div>
          <span className="font-jetbrains text-xs font-bold text-[#00a368] px-2.5 py-1 bg-white rounded-lg border border-[#c4c5da] shrink-0" dir="ltr">
            TAX_SYSTEM_READY
          </span>
        </div>

        <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          {/* Legal Identifiers Section */}
          {isLegal && (
            <div className="flex flex-col gap-4 pb-6 border-b border-[#e2e8f0]">
              <h3 className="text-sm font-bold text-[#00258e] flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">corporate_fare</span>
                <span>{trText('شناسه‌های قانونی شرکت / کارخانه (Corporate Registration)', 'Legal identifiers of the company / factory (Corporate Registration)', 'Şirketin / fabrikanın yasal kimlik bilgileri (Corporate Registration)')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* National Company ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">
                    {trText('شناسه ملی شرکت (۱۱ رقم):', 'National company ID (11 digits):', 'Ulusal şirket kimliği (11 hane):')}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={11}
                    value={nationalCompanyId}
                    onChange={(e) => {
                      setNationalCompanyId(e.target.value.replace(/\D/g, ''));
                      if (errors.nationalCompanyId) setErrors({ ...errors, nationalCompanyId: '' });
                    }}
                    placeholder="10102938472"
                    className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                      errors.nationalCompanyId
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#c4c5da] focus:border-[#00258e]'
                    }`}
                  />
                  {errors.nationalCompanyId && (
                    <span className="text-xs text-red-600 font-semibold">{errors.nationalCompanyId}</span>
                  )}
                </div>

                {/* Registration Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">{trText('شماره ثبت شرکت:', 'Company registration number:', 'Şirket tescil numarası:')}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={registrationNumber}
                    onChange={(e) => {
                      setRegistrationNumber(e.target.value);
                      if (errors.registrationNumber) setErrors({ ...errors, registrationNumber: '' });
                    }}
                    placeholder="482910"
                    className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                      errors.registrationNumber
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#c4c5da] focus:border-[#00258e]'
                    }`}
                  />
                  {errors.registrationNumber && (
                    <span className="text-xs text-red-600 font-semibold">{errors.registrationNumber}</span>
                  )}
                </div>

                {/* Economic Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">
                    {trText('کد اقتصادی مالیاتی (۱۲ رقم):', 'Tax economic code (12 digits):', 'Vergi ekonomik kodu (12 hane):')}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={12}
                    value={economicCode}
                    onChange={(e) => {
                      setEconomicCode(e.target.value.replace(/\D/g, ''));
                      if (errors.economicCode) setErrors({ ...errors, economicCode: '' });
                    }}
                    placeholder="411582910482"
                    className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                      errors.economicCode
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#c4c5da] focus:border-[#00258e]'
                    }`}
                  />
                  {errors.economicCode && (
                    <span className="text-xs text-red-600 font-semibold">{errors.economicCode}</span>
                  )}
                </div>
              </div>

              {/* Establishment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">{trText('تاریخ ثبت / تاسیس شرکت:', 'Company registration / incorporation date:', 'Şirketin tescil / kuruluş tarihi:')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={establishmentDate}
                      onChange={(e) => setEstablishmentDate(e.target.value)}
                      placeholder="1388/05/12"
                      className="w-full h-12 px-3.5 pe-10 rounded-xl border border-[#c4c5da] font-jetbrains text-sm outline-none focus:border-[#00258e]"
                    />
                    <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                      calendar_month
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1a1b23]">{trText('وب‌سایت رسمی شرکت / کاتالوگ آنلاین (اختیاری):', 'Official company website / online catalogue (optional):', 'Şirketin resmî web sitesi / çevrimiçi katalog (isteğe bağlı):')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full h-12 px-3.5 pe-10 rounded-xl border border-[#c4c5da] font-jetbrains text-sm outline-none focus:border-[#00258e]"
                    />
                    <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                      language
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CEO / Authorized Signatory Details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#00258e] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">person_pin</span>
              <span>
                {isLegal ? trText('مشخصات مدیرعامل / نماینده تام‌الاختیار صاحب امضا', 'Details of the CEO / authorised signatory representative', 'Genel müdür / imza yetkilisi temsilcinin bilgileri') : trText('مشخصات هویتی صاحب کسب‌وکار', 'Identity details of the business owner', 'İşletme sahibinin kimlik bilgileri')}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">
                  {isLegal ? trText('نام و نام خانوادگی مدیرعامل / نماینده:', 'Full name of the CEO / representative:', 'Genel müdürün / temsilcinin adı ve soyadı:') : trText('نام و نام خانوادگی متقاضی:', 'Full name of the applicant:', 'Başvuru sahibinin adı ve soyadı:')}
                </label>
                <input
                  type="text"
                  value={ceoFullName}
                  onChange={(e) => {
                    setCeoFullName(e.target.value);
                    if (errors.ceoFullName) setErrors({ ...errors, ceoFullName: '' });
                  }}
                  placeholder={trText('مثال: مهندس مسعود کریمی', 'e.g. Masoud Karimi', 'örn. Masoud Karimi')}
                  className={`h-12 px-3.5 rounded-xl border font-vazirmatn text-sm outline-none transition-colors ${
                    errors.ceoFullName
                      ? 'border-red-500 bg-red-50'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.ceoFullName && (
                  <span className="text-xs text-red-600 font-semibold">{errors.ceoFullName}</span>
                )}
              </div>

              {/* National ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">
                  {trText('کد ملی مدیرعامل (۱۰ رقم):', 'CEO national ID (10 digits):', 'Genel müdürün kimlik numarası (10 hane):')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={ceoNationalId}
                  onChange={(e) => {
                    setCeoNationalId(e.target.value.replace(/\D/g, ''));
                    if (errors.ceoNationalId) setErrors({ ...errors, ceoNationalId: '' });
                  }}
                  placeholder="0071928374"
                  className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                    errors.ceoNationalId
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.ceoNationalId && (
                  <span className="text-xs text-red-600 font-semibold">{errors.ceoNationalId}</span>
                )}
              </div>

              {/* Mobile Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">
                  {trText('شماره موبایل جهت پیامک و رمز یک‌بارمصرف:', 'Mobile number for SMS and one-time password:', 'SMS ve tek kullanımlık şifre için cep telefonu numarası:')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={11}
                  value={ceoMobile}
                  onChange={(e) => {
                    setCeoMobile(e.target.value.replace(/\D/g, ''));
                    if (errors.ceoMobile) setErrors({ ...errors, ceoMobile: '' });
                  }}
                  placeholder="09121112233"
                  className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                    errors.ceoMobile
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-[#c4c5da] focus:border-[#00258e]'
                  }`}
                />
                {errors.ceoMobile && (
                  <span className="text-xs text-red-600 font-semibold">{errors.ceoMobile}</span>
                )}
              </div>
            </div>

            {/* Landline Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1a1b23]">{trText('تلفن ثابت دفتر مرکزی / کارخانه با پیش‌شماره:', 'Landline of the head office / factory with area code:', 'Merkez ofisin / fabrikanın alan kodlu sabit telefonu:')}</label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={landlinePhone}
                    onChange={(e) => {
                      setLandlinePhone(e.target.value);
                      if (errors.landlinePhone) setErrors({ ...errors, landlinePhone: '' });
                    }}
                    placeholder="02188776655"
                    className={`w-full h-12 px-3.5 pe-10 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                      errors.landlinePhone
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#c4c5da] focus:border-[#00258e]'
                    }`}
                  />
                  <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                    phone_in_talk
                  </span>
                </div>
                {errors.landlinePhone && (
                  <span className="text-xs text-red-600 font-semibold">{errors.landlinePhone}</span>
                )}
              </div>

              <div className="flex flex-col justify-center p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#545f72]">
                <span className="font-bold text-[#1a1b23] mb-0.5">{trText('امنیت و محرمانگی داده‌ها:', 'Data security and confidentiality:', 'Veri güvenliği ve gizliliği:')}</span>
                {trText('اطلاعات حقوقی فقط با سرورهای سامانه شناسه ملی و امور مالیاتی تطبیق داده شده و نزد TLD کاملاً رمزگذاری می‌گردد.', 'Legal information is only matched against the national ID and tax administration systems and is fully encrypted at TLD.', 'Hukuki bilgiler yalnızca ulusal kimlik ve vergi idaresi sistemleriyle eşleştirilir ve TLD\'de tamamen şifrelenir.')}
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
              {trText('مرحله بعد: نشانی دفتر و انبارهای بارگیری', 'Next step: office address and loading warehouses', 'Sonraki adım: ofis adresi ve yükleme depoları')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
