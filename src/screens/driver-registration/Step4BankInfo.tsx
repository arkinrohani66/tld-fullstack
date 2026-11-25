import React, { useMemo, useState } from 'react';
import { DriverBankInfo, UserProfile } from '../../types';
import { detectIranBank } from '../../data/iranBanks';
import { useLanguage } from '../../context/LanguageContext';
import { RegistrationHeader } from './RegistrationHeader';
import { ErrorBanner, FormField, SectionCard, StepActions, digitsOnly, inputClass } from './RegistrationFields';

interface Step4BankInfoProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4BankInfo: React.FC<Step4BankInfoProps> = ({ data, onChange, onNext, onPrev }) => {
  const { trText } = useLanguage();
  const saved: Partial<DriverBankInfo> = data.driverBank ?? {};
  const [cardNumber, setCardNumber] = useState(saved.cardNumber ?? '');
  const [iban, setIban] = useState(saved.iban ?? '');
  const [accountHolderName, setAccountHolderName] = useState(
    saved.accountHolderName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
  );
  const [termsConfirmed, setTermsConfirmed] = useState(Boolean(saved.termsConfirmed));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const bankName = useMemo(() => (cardNumber.length >= 6 ? detectIranBank(cardNumber).name : ''), [cardNumber]);

  const handleNext = () => {
    const next: Record<string, string> = {};
    if (!/^\d{16}$/.test(cardNumber)) next.cardNumber = trText('شماره کارت شتاب باید ۱۶ رقم باشد.', 'The Shetab card number must be 16 digits.', 'Şetab kart numarası 16 haneli olmalıdır.');
    if (!/^\d{24}$/.test(iban)) next.iban = trText('شماره شبا باید ۲۴ رقم (بدون IR) باشد.', 'The IBAN must be 24 digits (without IR).', 'IBAN 24 haneli olmalıdır (IR olmadan).');
    if (!accountHolderName.trim()) next.accountHolderName = trText('نام صاحب حساب را وارد کنید.', 'Please enter the account holder name.', 'Lütfen hesap sahibinin adını girin.');
    if (!termsConfirmed) next.terms = trText('تأیید مالکیت حساب الزامی است.', 'Confirming account ownership is required.', 'Hesap sahipliğini onaylamanız gerekir.');
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError(trText('لطفاً خطاهای فرم را برطرف کنید.', 'Please fix the form errors.', 'Lütfen formdaki hataları düzeltin.'));
      return;
    }
    setFormError('');
    onChange({
      driverBank: {
        iban,
        cardNumber,
        accountHolderName: accountHolderName.trim(),
        termsConfirmed,
      },
    });
    onNext();
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <RegistrationHeader
        currentStep={4}
        title={trText('اطلاعات حساب بانکی', 'Bank account information', 'Banka hesap bilgileri')}
        subtitle={trText('کارت شتاب و شبای حسابی که کرایه به آن واریز می‌شود', 'The Shetab card and IBAN of the account that receives the freight payment', 'Navlun ödemesinin yapılacağı hesabın Şetab kartı ve IBAN numarası')}
        onBack={onPrev}
      />

      <main className="w-full max-w-3xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6">
        <ErrorBanner message={formError} />

        <SectionCard icon="account_balance" title={trText('حساب دریافت کرایه', 'Freight payment account', 'Navlun ödeme hesabı')}>
          <FormField label={trText('شماره کارت شتاب (۱۶ رقم)', 'Shetab card number (16 digits)', 'Şetab kart numarası (16 hane)')} error={errors.cardNumber} hint={bankName ? trText(`بانک صادرکننده: ${bankName}`, `Issuing bank: ${bankName}`, `Kartı veren banka: ${bankName}`) : undefined}>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={16}
              value={cardNumber}
              onChange={(e) => setCardNumber(digitsOnly(e.target.value))}
              className={`${inputClass} font-jetbrains tracking-widest`}
            />
          </FormField>

          <FormField label={trText('شماره شبا (۲۴ رقم بدون IR)', 'IBAN (24 digits, without IR)', 'IBAN numarası (24 hane, IR olmadan)')} error={errors.iban}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00258e] font-jetbrains">IR</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={24}
                value={iban}
                onChange={(e) => setIban(digitsOnly(e.target.value))}
                className={`${inputClass} pl-12 font-jetbrains tracking-wider`}
              />
            </div>
          </FormField>

          <FormField label={trText('نام صاحب حساب', 'Account holder name', 'Hesap sahibinin adı')} error={errors.accountHolderName} hint={trText('باید دقیقاً مطابق نام کارت ملی باشد', 'It must exactly match the name on the national ID card', 'Kimlik kartındaki ad ile tam olarak aynı olmalıdır')}>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <label className="flex items-start gap-3 p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#00258e] shrink-0"
            />
            <span className="text-xs text-[#334155] leading-relaxed">
              {trText('تأیید می‌کنم این حساب متعلق به خودم است و با کد ملی ثبت‌نام‌شده مطابقت دارد.', 'I confirm that this account belongs to me and matches the registered national ID.', 'Bu hesabın bana ait olduğunu ve kayıtlı kimlik numarasıyla eşleştiğini onaylıyorum.')}
            </span>
          </label>
          {errors.terms && <p className="text-[11px] font-medium text-rose-600">{errors.terms}</p>}
        </SectionCard>

        <StepActions onBack={onPrev} onNext={handleNext} nextLabel={trText('ادامه به بازبینی نهایی', 'Continue to final review', 'Son incelemeye devam et')} />
      </main>
    </div>
  );
};
