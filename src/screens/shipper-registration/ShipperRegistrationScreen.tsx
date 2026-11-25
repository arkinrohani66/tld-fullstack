import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { shipperService } from '../../services/shipperService';
import { Step1BusinessInfo } from './Step1BusinessInfo';
import { Step2CompanyDetails } from './Step2CompanyDetails';
import { Step3Locations } from './Step3Locations';
import { Step4DocumentsUpload } from './Step4DocumentsUpload';
import { Step5BankAndSubmit } from './Step5BankAndSubmit';

interface ShipperRegistrationScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const LOCAL_STORAGE_KEY = 'tld_shipper_registration_draft';

export const ShipperRegistrationScreen: React.FC<ShipperRegistrationScreenProps> = ({
  onComplete,
  onCancel,
}) => {
  const { currentUser, updateProfile } = useAuth();
  const { trText } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Initial State initialized from user profile or localStorage draft
  const [formData, setFormData] = useState<Partial<UserProfile>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, mobile: currentUser?.mobile || parsed.mobile };
      }
    } catch (e) {
      console.warn('Failed to load shipper registration draft:', e);
    }

    return {
      fullName: currentUser?.profile?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'مهندس مسعود کریمی'),
      nationalId: currentUser?.profile?.nationalId || '0071928374',
      mobile: currentUser?.mobile || '09121112233',
      companyName: currentUser?.profile?.companyName || 'مجتمع تولیدی و صنعتی فولاد پارس',
      province: currentUser?.profile?.province || 'تهران',
      city: currentUser?.profile?.city || 'تهران',
      postalCode: currentUser?.profile?.postalCode || '1998877665',
      address: currentUser?.profile?.address || 'تهران، خیابان ملاصدرا، خیابان شیراز شمالی، پلاک ۴۴، ساختمان پارس، طبقه ۶',
      shipperCompany: {
        shipperType: 'LEGAL_ENTITY',
        companyName: 'مجتمع تولیدی و صنعتی فولاد پارس',
        companyType: 'سهامی خاص',
        nationalCompanyId: '10102938472',
        registrationNumber: '482910',
        economicCode: '411582910482',
        establishmentDate: '1388/05/12',
        industrySector: 'فولاد، آهن‌آلات و صنایع فلزی',
        monthlyFreightVolumeTons: '1500',
        preferredTruckTypes: ['ترانزیت چادری (کشویی و سقف)', 'تریلی کفی (Flatbed)'],
        ceoFullName: 'مهندس مسعود کریمی',
        ceoNationalId: '0071928374',
        ceoMobile: currentUser?.mobile || '09121112233',
        landlinePhone: '02188776655',
        website: 'https://parsteel.ir',
      },
      shipperLocations: {
        officeProvince: 'تهران',
        officeCity: 'تهران',
        officePostalCode: '1998877665',
        officeAddress: 'تهران، خیابان ملاصدرا، خیابان شیراز شمالی، پلاک ۴۴، طبقه ۶',
        warehouseProvince: 'تهران',
        warehouseCity: 'تهران (شهرک صنعتی شمس‌آباد)',
        warehouseAddress: 'تهران، اتوبان تهران-قم، شهرک صنعتی شمس‌آباد، بلوار سروستان، خیابان نارنجستان',
        warehouseContactPerson: 'مهندس رضایی (مدیر لجستیک انبار)',
        warehouseContactPhone: '09123456789',
        warehouseFacilities: ['باسکول ۶۰ تن دیجیتال', 'لیفتراک ۵ تن و ۳ تن', 'رمپ استاندارد بارگیری ترانزیت', 'سوله مسقف بارگیری ایمن'],
      },
      shipperDocuments: {
        officialGazette: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
        vatCertificate: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        businessLicense: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        nationalCardCeoFront: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=600&auto=format&fit=crop&q=80',
        nationalCardCeoBack: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
        bankIbanConfirmation: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
      },
      shipperBank: {
        bankName: 'بانک ملت',
        iban: 'IR820120000000001234567890',
        accountNumber: '4829104820',
        bankBranch: 'شعبه ملاصدرا (کد ۶۵۲۰)',
        accountHolderName: 'مجتمع تولیدی و صنعتی فولاد پارس',
        termsConfirmed: true,
      },
    };
  });

  // Auto-save draft on changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save shipper registration draft:', e);
    }
  }, [formData]);

  const handleChange = (fields: Partial<UserProfile>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    if (currentStep === 1) {
      onCancel();
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const activeUserId = currentUser?.id || `usr_shp_${Date.now()}`;
      const completeProfile: UserProfile = {
        fullName: formData.fullName || formData.shipperCompany?.companyName || 'صاحب بار محترم',
        nationalId: formData.nationalId || formData.shipperCompany?.nationalCompanyId || '',
        mobile: formData.mobile || currentUser?.mobile || '',
        companyName: formData.shipperCompany?.companyName || formData.companyName || '',
        province: formData.shipperLocations?.officeProvince || formData.province || 'تهران',
        city: formData.shipperLocations?.officeCity || formData.city || 'تهران',
        address: formData.shipperLocations?.officeAddress || formData.address || '',
        postalCode: formData.shipperLocations?.officePostalCode || formData.postalCode || '',
        dob: '1365/01/01',
        shipperCompany: formData.shipperCompany,
        shipperLocations: formData.shipperLocations,
        shipperDocuments: formData.shipperDocuments,
        shipperBank: formData.shipperBank,
        registrationStep: 5,
      };

      // 1. Save to Supabase
      const result = await shipperService.saveShipperRegistration(activeUserId, completeProfile);

      // 2. Update AuthContext
      updateProfile(completeProfile);

      // 3. Clear draft
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      setSuccessMessage(result.message || trText('ثبت‌نام صاحب بار با موفقیت در پایگاه داده ثبت شد.', 'The shipper registration was successfully saved to the database.', 'Yük sahibi kaydı veritabanına başarıyla kaydedildi.'));
      setSubmissionSuccess(true);
    } catch (err) {
      console.error('Error submitting shipper registration:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex items-center justify-center p-4 font-vazirmatn">
        <div className="bg-white border border-[#c4c5da] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-lg text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-4xl">verified</span>
          </div>

          <div>
            <span className="text-xs font-jetbrains font-bold text-emerald-700 px-3 py-1 bg-emerald-100 rounded-full">
              SUPABASE // REGISTRATION_SUBMITTED
            </span>
            <h2 className="text-xl font-bold text-[#1a1b23] mt-2">
              {trText('پرونده صاحب بار با موفقیت ثبت و ارسال شد', 'The shipper file was registered and submitted successfully', 'Yük sahibi dosyası başarıyla kaydedildi ve gönderildi')}
            </h2>
            <p className="text-xs text-[#545f72] leading-relaxed mt-2">
              {successMessage}
            </p>
          </div>

          <div className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-start space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">{trText('نام شرکت / مجموعه:', 'Company / organisation name:', 'Şirket / kurum adı:')}</span>
              <span className="font-bold text-[#1a1b23]">
                {formData.shipperCompany?.companyName || formData.companyName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">{trText('شناسه ملی:', 'National company ID:', 'Ulusal şirket kimliği:')}</span>
              <span className="font-bold font-jetbrains text-[#1a1b23]" dir="ltr">
                {formData.shipperCompany?.nationalCompanyId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">{trText('وضعیت احراز هویت:', 'Verification status:', 'Doğrulama durumu:')}</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {trText('در حال بررسی (Pending)', 'Under review (Pending)', 'İncelemede (Pending)')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">{trText('زمان بررسی پرونده:', 'File review time:', 'Dosya inceleme süresi:')}</span>
              <span className="font-bold text-[#00258e]">{trText('حداکثر طی ۲ ساعت کاری', 'Within 2 business hours at most', 'En fazla 2 iş saati içinde')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="w-full py-3.5 bg-[#00258e] hover:bg-[#001f75] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-md"
          >
            {trText('ورود به داشبورد صاحب بار', 'Go to shipper dashboard', 'Yük sahibi paneline gir')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 1 && (
        <Step1BusinessInfo
          data={formData}
          onChange={handleChange}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
          onGoToStep={handleGoToStep}
        />
      )}

      {currentStep === 2 && (
        <Step2CompanyDetails
          data={formData}
          onChange={handleChange}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
          onGoToStep={handleGoToStep}
        />
      )}

      {currentStep === 3 && (
        <Step3Locations
          data={formData}
          onChange={handleChange}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
          onGoToStep={handleGoToStep}
        />
      )}

      {currentStep === 4 && (
        <Step4DocumentsUpload
          data={formData}
          onChange={handleChange}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
          onGoToStep={handleGoToStep}
        />
      )}

      {currentStep === 5 && (
        <Step5BankAndSubmit
          data={formData}
          onChange={handleChange}
          onSubmit={handleFinalSubmit}
          onPrev={handlePrevStep}
          onGoToStep={handleGoToStep}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};
