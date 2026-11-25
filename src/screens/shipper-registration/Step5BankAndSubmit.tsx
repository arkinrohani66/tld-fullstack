import React, { useState } from 'react';
import { UserProfile, ShipperBankInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShipperRegistrationHeader } from './ShipperRegistrationHeader';
import { Button } from '../../components/ui/Button';

interface Step5BankAndSubmitProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
  isSubmitting?: boolean;
}

const IRANIAN_BANKS = [
  { fa: 'بانک ملت', en: 'Bank Mellat', tr: 'Mellat Bankası' },
  { fa: 'بانک سامان', en: 'Saman Bank', tr: 'Saman Bankası' },
  { fa: 'بانک پاسارگاد', en: 'Pasargad Bank', tr: 'Pasargad Bankası' },
  { fa: 'بانک ملی ایران', en: 'Bank Melli Iran', tr: 'İran Melli Bankası' },
  { fa: 'بانک تجارت', en: 'Tejarat Bank', tr: 'Tejarat Bankası' },
  { fa: 'بانک صادرات ایران', en: 'Bank Saderat Iran', tr: 'İran Saderat Bankası' },
  { fa: 'بانک سپه', en: 'Bank Sepah', tr: 'Sepah Bankası' },
  { fa: 'بانک پارسیان', en: 'Parsian Bank', tr: 'Parsian Bankası' },
  { fa: 'بانک آینده', en: 'Ayandeh Bank', tr: 'Ayandeh Bankası' },
  { fa: 'بانک کشاورزی', en: 'Bank Keshavarzi (Agriculture Bank)', tr: 'Keshavarzi Bankası (Ziraat Bankası)' },
  { fa: 'بانک مسکن', en: 'Bank Maskan (Housing Bank)', tr: 'Maskan Bankası (Konut Bankası)' },
  { fa: 'بانک صنعت و معدن', en: 'Bank of Industry and Mine', tr: 'Sanayi ve Maden Bankası' },
  { fa: 'بانک کارآفرین', en: 'Karafarin Bank', tr: 'Karafarin Bankası' },
];

export const Step5BankAndSubmit: React.FC<Step5BankAndSubmitProps> = ({
  data,
  onChange,
  onSubmit,
  onPrev,
  onGoToStep,
  isSubmitting = false,
}) => {
  const { trText } = useLanguage();
  const existingBank = data.shipperBank || {
    bankName: 'بانک ملت',
    iban: 'IR820120000000001234567890',
    accountNumber: '4829104820',
    bankBranch: 'شعبه ملاصدرا تهران (کد 6520)',
    accountHolderName: data.shipperCompany?.companyName || data.companyName || data.fullName || 'شرکت تولیدی فولاد پارس',
    termsConfirmed: true,
  };

  const [bankName, setBankName] = useState<string>(existingBank.bankName || 'بانک ملت');
  const [iban, setIban] = useState<string>(existingBank.iban || 'IR820120000000001234567890');
  const [accountNumber, setAccountNumber] = useState<string>(existingBank.accountNumber || '4829104820');
  const [bankBranch, setBankBranch] = useState<string>(existingBank.bankBranch || 'شعبه ملاصدرا کد ۶۵۲۰');
  const [accountHolderName, setAccountHolderName] = useState<string>(
    existingBank.accountHolderName || data.shipperCompany?.companyName || data.fullName || ''
  );
  const [termsConfirmed, setTermsConfirmed] = useState<boolean>(existingBank.termsConfirmed ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    let cleanIban = iban.trim().toUpperCase();
    if (!cleanIban.startsWith('IR')) {
      cleanIban = 'IR' + cleanIban;
    }
    const ibanDigits = cleanIban.replace(/[^A-Z0-9]/g, '');
    if (ibanDigits.length !== 26) {
      errs.iban = trText('شماره شبا باید ۲۴ رقم بعد از IR باشد (مجموعاً ۲۶ کاراکتر)', 'The IBAN must be 24 digits after IR (26 characters in total)', 'IBAN, IR\'den sonra 24 hane olmalıdır (toplam 26 karakter)');
    }

    if (!accountNumber.trim()) {
      errs.accountNumber = trText('شماره حساب بانکی الزامی است', 'The bank account number is required', 'Banka hesap numarası zorunludur');
    }

    if (!accountHolderName.trim()) {
      errs.accountHolderName = trText('نام دقیق صاحب حساب حقوقی / تجاری الزامی است', 'The exact name of the corporate / commercial account holder is required', 'Kurumsal / ticari hesap sahibinin tam adı zorunludur');
    }

    if (!termsConfirmed) {
      errs.termsConfirmed = trText('پذیرش قوانین و مقررات امانی سامانه لجستیک الزامی است', 'Accepting the escrow terms and conditions of the logistics platform is required', 'Lojistik platformunun emanet koşullarını kabul etmeniz gerekir');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let cleanIban = iban.trim().toUpperCase();
    if (!cleanIban.startsWith('IR')) {
      cleanIban = 'IR' + cleanIban;
    }

    const updatedBank: ShipperBankInfo = {
      bankName,
      iban: cleanIban,
      accountNumber,
      bankBranch,
      accountHolderName,
      termsConfirmed,
    };

    onChange({
      shipperBank: updatedBank,
    });

    onSubmit();
  };

  const docsCount = Object.keys(data.shipperDocuments || {}).filter(
    (k) => !!data.shipperDocuments?.[k as keyof typeof data.shipperDocuments]
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111c2d] flex flex-col font-vazirmatn">
      <ShipperRegistrationHeader
        currentStep={5}
        stepTitle={trText('اطلاعات حساب بانکی، تسویه امانی و تأیید نهایی', 'Bank account information, escrow settlement and final confirmation', 'Banka hesap bilgileri, emanet ödemesi ve nihai onay')}
        stepSubtitle={trText('تایید مشخصات حساب بانکی جهت بازگشت وجوه امانی، ضمانت‌ها و صدور بارنامه رسمی', 'Confirming the bank account details for escrow fund returns, guarantees and issuing the official waybill', 'Emanet fonlarının iadesi, garantiler ve resmî irsaliye düzenlenmesi için banka hesap bilgilerinin onaylanması')}
        onPrev={onPrev}
        onGoToStep={onGoToStep}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Review Summary Card */}
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2 text-[#00258e]">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
              <h3 className="font-bold text-sm text-[#1a1b23]">{trText('خلاصه اطلاعات پرونده صاحب بار', 'Summary of the shipper file information', 'Yük sahibi dosyası bilgilerinin özeti')}</h3>
            </div>
            <span className="text-xs font-bold font-jetbrains text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {trText('آماده ثبت نهایی', 'Ready for final submission', 'Nihai kayda hazır')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
            <div>
              <span className="text-[#64748b] block text-[11px]">{trText('نام شرکت / کارخانه:', 'Company / factory name:', 'Şirket / fabrika adı:')}</span>
              <span className="font-bold text-[#1a1b23]">
                {data.shipperCompany?.companyName || data.companyName || trText('ثبت نشده', 'Not registered', 'Kayıtlı değil')}
              </span>
            </div>

            <div>
              <span className="text-[#64748b] block text-[11px]">{trText('شناسه ملی شرکت:', 'National company ID:', 'Ulusal şirket kimliği:')}</span>
              <span className="font-bold font-jetbrains text-[#1a1b23]" dir="ltr">
                {data.shipperCompany?.nationalCompanyId || data.nationalId || '---'}
              </span>
            </div>

            <div>
              <span className="text-[#64748b] block text-[11px]">{trText('مدیرعامل / نماینده:', 'CEO / representative:', 'Genel müdür / temsilci:')}</span>
              <span className="font-bold text-[#1a1b23]">
                {data.shipperCompany?.ceoFullName || data.fullName || '---'}
              </span>
            </div>

            <div>
              <span className="text-[#64748b] block text-[11px]">{trText('مدارک پیوست شده:', 'Attached documents:', 'Ekli belgeler:')}</span>
              <span className="font-bold font-jetbrains text-[#00258e]">
                {trText(`${docsCount} سند بارگذاری شده`, `${docsCount} documents uploaded`, `${docsCount} belge yüklendi`)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details Form */}
        <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[#00258e]">
            <span className="material-symbols-outlined text-xl">account_balance</span>
            <h3 className="text-sm font-bold text-[#1a1b23]">{trText('مشخصات حساب بانکی رسمی شرکت', 'Official company bank account details', 'Şirketin resmî banka hesap bilgileri')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">{trText('نام بانک عامل:', 'Operating bank name:', 'Çalışılan banka adı:')}</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-12 px-3 rounded-xl border border-[#c4c5da] bg-white font-vazirmatn text-sm outline-none focus:border-[#00258e] cursor-pointer"
              >
                {IRANIAN_BANKS.map((b) => (
                  <option key={b.fa} value={b.fa}>{trText(b.fa, b.en, b.tr)}</option>
                ))}
              </select>
            </div>

            {/* Account Holder Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">{trText('نام صاحب حساب / عنوان رسمی شرکت:', 'Account holder name / official company title:', 'Hesap sahibinin adı / şirketin resmî unvanı:')}</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => {
                  setAccountHolderName(e.target.value);
                  if (errors.accountHolderName) setErrors({ ...errors, accountHolderName: '' });
                }}
                placeholder={trText('مطابق با نام درج شده در دفترچه یا تاییدیه شبا', 'Matching the name on the passbook or the IBAN confirmation', 'Hesap cüzdanında veya IBAN onayında yazan ad ile aynı')}
                className={`h-12 px-3.5 rounded-xl border font-vazirmatn text-sm outline-none transition-colors ${
                  errors.accountHolderName
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#c4c5da] focus:border-[#00258e]'
                }`}
              />
              {errors.accountHolderName && (
                <span className="text-xs text-red-600 font-semibold">{errors.accountHolderName}</span>
              )}
            </div>
          </div>

          {/* IBAN Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#1a1b23] flex items-center justify-between">
              <span>{trText('شماره شبای بین‌بانکی (IBAN):', 'International bank account number (IBAN):', 'Uluslararası banka hesap numarası (IBAN):')}</span>
              <span className="text-[11px] font-jetbrains text-[#545f72]">IR + 24 Digits</span>
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={iban}
                onChange={(e) => {
                  setIban(e.target.value.toUpperCase());
                  if (errors.iban) setErrors({ ...errors, iban: '' });
                }}
                placeholder="IR820120000000001234567890"
                className={`w-full h-12 px-3.5 font-jetbrains font-bold tracking-wider text-sm rounded-xl border outline-none transition-colors ${
                  errors.iban
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-[#c4c5da] focus:border-[#00258e] text-[#00258e]'
                }`}
              />
              <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-[#00258e] text-[20px]">
                credit_card
              </span>
            </div>
            {errors.iban && (
              <span className="text-xs text-red-600 font-semibold">{errors.iban}</span>
            )}
          </div>

          {/* Account Number & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">{trText('شماره حساب بانکی:', 'Bank account number:', 'Banka hesap numarası:')}</label>
              <input
                type="text"
                dir="ltr"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                }}
                placeholder="4829104820"
                className={`h-12 px-3.5 rounded-xl border font-jetbrains text-sm outline-none transition-colors ${
                  errors.accountNumber
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-[#c4c5da] focus:border-[#00258e]'
                }`}
              />
              {errors.accountNumber && (
                <span className="text-xs text-red-600 font-semibold">{errors.accountNumber}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1a1b23]">{trText('نام و کد شعبه افتتاح کننده حساب:', 'Name and code of the opening branch:', 'Hesabın açıldığı şubenin adı ve kodu:')}</label>
              <input
                type="text"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder={trText('شعبه ملاصدرا (کد ۶۵۲۰)', 'Mollasadra branch (code 6520)', 'Mollasadra şubesi (kod 6520)')}
                className="h-12 px-3.5 rounded-xl border border-[#c4c5da] font-vazirmatn text-sm outline-none focus:border-[#00258e]"
              />
            </div>
          </div>

          {/* Terms and Agreement */}
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="shipper-terms"
                checked={termsConfirmed}
                onChange={(e) => {
                  setTermsConfirmed(e.target.checked);
                  if (errors.termsConfirmed) setErrors({ ...errors, termsConfirmed: '' });
                }}
                className="w-4 h-4 rounded text-[#00258e] accent-[#00258e] mt-1 cursor-pointer"
              />
              <label htmlFor="shipper-terms" className="text-xs text-[#334155] leading-relaxed cursor-pointer select-none">
                <span className="font-bold text-[#1a1b23] block mb-1">
                  {trText('تعهدنامه، قوانین و شرایط عضویت صاحبان بار در شبکه لجستیک TLD:', 'Undertaking, rules and membership terms of shippers in the TLD logistics network:', 'TLD lojistik ağında yük sahiplerinin taahhüdü, kuralları ve üyelik koşulları:')}
                </span>
                {trText('اینجانب صحت کلیه اسناد و اطلاعات وارد شده را تایید نموده و بدینوسیله موافقت خود را با صدور بارنامه الکترونیک رسمی، اعمال ماده ۱۶۹ مکرر امور مالیاتی و نظام پرداخت حساب امانی (Escrow) سامانه TLD اعلام می‌دارم.', 'I confirm the accuracy of all documents and information entered and hereby declare my agreement with the issuance of the official electronic waybill, the application of repeated Article 169 of the tax code and the escrow payment system of the TLD platform.', 'Girilen tüm belge ve bilgilerin doğruluğunu onaylıyor ve resmî elektronik irsaliye düzenlenmesi, vergi kanununun mükerrer 169. maddesinin uygulanması ve TLD platformunun emanet (Escrow) ödeme sistemiyle mutabık olduğumu beyan ediyorum.')}
              </label>
            </div>
            {errors.termsConfirmed && (
              <span className="text-xs text-red-600 font-semibold">{errors.termsConfirmed}</span>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0] mt-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[#c4c5da] text-[#475569] text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {trText('مرحله قبل', 'Previous step', 'Önceki adım')}
            </button>

            <Button
              type="button"
              onClick={handleSubmit}
              variant="primary"
              size="md"
              loading={isSubmitting}
              icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
            >
              {isSubmitting ? trText('در حال ثبت در پایگاه داده سوپابیس...', 'Saving to the Supabase database...', 'Supabase veritabanına kaydediliyor...') : trText('ثبت نهایی و ارسال جهت بررسی و تایید', 'Final submission and sending for review and approval', 'Nihai kayıt ve incelenip onaylanması için gönderim')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
