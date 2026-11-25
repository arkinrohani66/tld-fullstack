import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { detectIranBank } from '../../data/iranBanks';
import { useLanguage } from '../../context/LanguageContext';
import { RegistrationHeader } from './RegistrationHeader';
import { ErrorBanner } from './RegistrationFields';

interface Step5ConfirmationProps {
  data: Partial<UserProfile>;
  onSubmit: () => Promise<void>;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

const display = (value?: string) => (value && value.trim() ? value : '—');

const ReviewRow: React.FC<{ label: string; value: string; ltr?: boolean }> = ({ label, value, ltr }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-[#64748b]">{label}</dt>
    <dd className={`text-sm font-bold text-[#0f172a] mt-0.5 break-words ${ltr ? 'font-jetbrains' : ''}`} dir={ltr ? 'ltr' : undefined}>
      {value}
    </dd>
  </div>
);

const ReviewSection: React.FC<{ title: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }> = ({
  title,
  step,
  onEdit,
  children,
}) => {
  const { trText } = useLanguage();

  return (
    <section className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
        <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-bold text-[#00258e] hover:bg-[#00258e]/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          {trText('ویرایش', 'Edit', 'Düzenle')}
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-3">{children}</dl>
    </section>
  );
};

export const Step5Confirmation: React.FC<Step5ConfirmationProps> = ({ data, onSubmit, onPrev, onGoToStep }) => {
  const { trText } = useLanguage();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
  const truck = data.driverTruck;
  const bank = data.driverBank;
  const docCount = data.driverDocuments ? Object.values(data.driverDocuments).filter(Boolean).length : 0;
  const truckDocCount = truck?.documents ? Object.values(truck.documents).filter(Boolean).length : 0;

  const handleSubmit = async () => {
    if (!termsAccepted || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : trText('ثبت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.', 'Saving the information failed. Please try again.', 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <RegistrationHeader
        currentStep={5}
        title={trText('بازبینی و ارسال', 'Review and submit', 'İncele ve gönder')}
        subtitle={trText('اطلاعات خود را بررسی کنید و ثبت‌نام را نهایی کنید', 'Review your information and complete the registration', 'Bilgilerinizi kontrol edin ve kaydı tamamlayın')}
        onBack={onPrev}
      />

      <main className="w-full max-w-3xl mx-auto px-4 py-6 pb-28 flex flex-col gap-4">
        <ErrorBanner message={submitError} />

        <ReviewSection title={trText('اطلاعات شخصی', 'Personal information', 'Kişisel bilgiler')} step={1} onEdit={onGoToStep}>
          <ReviewRow label={trText('نام و نام خانوادگی', 'Full name', 'Ad ve soyad')} value={display(fullName)} />
          <ReviewRow label={trText('کد ملی', 'National ID', 'Kimlik numarası')} value={display(data.nationalId)} ltr />
          <ReviewRow label={trText('تاریخ تولد', 'Date of birth', 'Doğum tarihi')} value={display(data.dob)} ltr />
          <ReviewRow label={trText('شماره موبایل', 'Mobile number', 'Cep telefonu numarası')} value={display(data.mobile)} ltr />
          <ReviewRow label={trText('محل سکونت', 'Place of residence', 'İkamet yeri')} value={[data.province, data.city, data.address].filter(Boolean).join(trText('، ', ', ', ', ')) || '—'} />
        </ReviewSection>

        <ReviewSection title={trText('مدارک راننده', 'Driver documents', 'Sürücü belgeleri')} step={2} onEdit={onGoToStep}>
          <ReviewRow label={trText('مدارک بارگذاری‌شده', 'Uploaded documents', 'Yüklenen belgeler')} value={trText(`${docCount} مدرک`, `${docCount} documents`, `${docCount} belge`)} />
        </ReviewSection>

        <ReviewSection title={trText('خودرو', 'Vehicle', 'Araç')} step={3} onEdit={onGoToStep}>
          <ReviewRow label={trText('نوع ناوگان', 'Fleet type', 'Filo tipi')} value={display(truck?.type)} />
          <ReviewRow label={trText('برند و مدل', 'Brand and model', 'Marka ve model')} value={truck ? `${truck.brand} ${truck.model}`.trim() || '—' : '—'} />
          <ReviewRow label={trText('پلاک انتظامی', 'Licence plate', 'Tescil plakası')} value={truck ? trText(`${truck.platePart1} ${truck.plateLetter} ${truck.platePart2} ایران ${truck.plateIranCode}`, `${truck.platePart1} ${truck.plateLetter} ${truck.platePart2} Iran ${truck.plateIranCode}`, `${truck.platePart1} ${truck.plateLetter} ${truck.platePart2} İran ${truck.plateIranCode}`) : '—'} ltr />
          <ReviewRow label={trText('ظرفیت', 'Capacity', 'Kapasite')} value={truck?.capacityTons ? trText(`${truck.capacityTons} تن`, `${truck.capacityTons} tons`, `${truck.capacityTons} ton`) : '—'} />
          <ReviewRow label={trText('مدارک خودرو', 'Vehicle documents', 'Araç belgeleri')} value={trText(`${truckDocCount} مدرک`, `${truckDocCount} documents`, `${truckDocCount} belge`)} />
        </ReviewSection>

        <ReviewSection title={trText('حساب بانکی', 'Bank account', 'Banka hesabı')} step={4} onEdit={onGoToStep}>
          <ReviewRow label={trText('بانک', 'Bank', 'Banka')} value={bank?.cardNumber ? detectIranBank(bank.cardNumber).name : '—'} />
          <ReviewRow label={trText('شماره کارت', 'Card number', 'Kart numarası')} value={display(bank?.cardNumber)} ltr />
          <ReviewRow label={trText('شماره شبا', 'IBAN', 'IBAN')} value={bank?.iban ? `IR${bank.iban}` : '—'} ltr />
          <ReviewRow label={trText('صاحب حساب', 'Account holder', 'Hesap sahibi')} value={display(bank?.accountHolderName)} />
        </ReviewSection>

        <label className="flex items-start gap-3 p-4 bg-white border border-[#e2e8f0] rounded-2xl cursor-pointer shadow-xs">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#00258e] shrink-0"
          />
          <span className="text-xs text-[#334155] leading-relaxed">
            {trText('صحت اطلاعات و مدارک ارسالی را تأیید می‌کنم و با قوانین و شرایط استفاده از سامانه TLD موافقم.', 'I confirm that the information and documents submitted are accurate and I agree to the TLD platform terms and conditions.', 'Gönderilen bilgi ve belgelerin doğruluğunu onaylıyor ve TLD platformunun kullanım koşullarını kabul ediyorum.')}
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex-1 h-12 rounded-xl border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#334155] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
            <span>{trText('مرحله قبل', 'Previous step', 'Önceki adım')}</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!termsAccepted || submitting}
            className="flex-[2] h-12 rounded-xl bg-[#00258e] hover:bg-[#001f75] disabled:bg-[#cbd5e1] disabled:text-[#64748b] disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer transition-all active:scale-95"
          >
            <span>{submitting ? trText('در حال ارسال...', 'Submitting...', 'Gönderiliyor...') : trText('ارسال ثبت‌نام', 'Submit registration', 'Kaydı gönder')}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
