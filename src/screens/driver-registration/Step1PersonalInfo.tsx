import React, { useMemo, useState } from 'react';
import { UserProfile } from '../../types';
import { IRAN_PROVINCES, getCitiesForProvince } from '../../data/iranLocations';
import { validateIranianNationalId } from '../../data/iranBanks';
import { useLanguage } from '../../context/LanguageContext';
import { RegistrationHeader } from './RegistrationHeader';
import { ErrorBanner, FormField, SectionCard, StepActions, digitsOnly, inputClass, selectClass } from './RegistrationFields';

interface Step1PersonalInfoProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
  onLoginClick: () => void;
}

const YEARS = Array.from({ length: 67 }, (_, i) => String(1320 + i)).reverse();
const MONTHS: { fa: string; en: string; tr: string }[] = [
  { fa: 'فروردین', en: 'Farvardin', tr: 'Farvardin' },
  { fa: 'اردیبهشت', en: 'Ordibehesht', tr: 'Ordibeheşt' },
  { fa: 'خرداد', en: 'Khordad', tr: 'Hordad' },
  { fa: 'تیر', en: 'Tir', tr: 'Tir' },
  { fa: 'مرداد', en: 'Mordad', tr: 'Mordad' },
  { fa: 'شهریور', en: 'Shahrivar', tr: 'Şehrivar' },
  { fa: 'مهر', en: 'Mehr', tr: 'Mehr' },
  { fa: 'آبان', en: 'Aban', tr: 'Aban' },
  { fa: 'آذر', en: 'Azar', tr: 'Azar' },
  { fa: 'دی', en: 'Dey', tr: 'Dey' },
  { fa: 'بهمن', en: 'Bahman', tr: 'Bahman' },
  { fa: 'اسفند', en: 'Esfand', tr: 'Esfand' },
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const parseDob = (dob?: string) => {
  const [y = '', m = '', d = ''] = (dob ?? '').split('/');
  return { year: y, month: m, day: d };
};

const isMobile = (value: string) => /^09\d{9}$/.test(value);

export const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({ data, onChange, onNext, onPrev, onLoginClick }) => {
  const { trText } = useLanguage();
  const initialDob = parseDob(data.dob);
  const [firstName, setFirstName] = useState(data.firstName ?? '');
  const [lastName, setLastName] = useState(data.lastName ?? '');
  const [nationalId, setNationalId] = useState(data.nationalId ?? '');
  const [dobYear, setDobYear] = useState(initialDob.year);
  const [dobMonth, setDobMonth] = useState(initialDob.month);
  const [dobDay, setDobDay] = useState(initialDob.day);
  const [smartCardNumber, setSmartCardNumber] = useState(data.driverId ?? '');
  const [mobile, setMobile] = useState(data.mobile ?? '');
  const [province, setProvince] = useState(data.province ?? '');
  const [city, setCity] = useState(data.city ?? '');
  const [address, setAddress] = useState(data.address ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const cities = useMemo(() => (province ? getCitiesForProvince(province) : []), [province]);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setCity('');
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = trText('نام را وارد کنید.', 'Please enter your first name.', 'Lütfen adınızı girin.');
    if (!lastName.trim()) next.lastName = trText('نام خانوادگی را وارد کنید.', 'Please enter your last name.', 'Lütfen soyadınızı girin.');
    if (!/^\d{10}$/.test(nationalId)) next.nationalId = trText('کد ملی باید ۱۰ رقم باشد.', 'The national ID must be 10 digits.', 'Kimlik numarası 10 haneli olmalıdır.');
    else if (!validateIranianNationalId(nationalId)) next.nationalId = trText('کد ملی وارد شده معتبر نیست.', 'The national ID entered is not valid.', 'Girilen kimlik numarası geçerli değil.');
    if (!dobYear || !dobMonth || !dobDay) next.dob = trText('تاریخ تولد را کامل انتخاب کنید.', 'Please select your full date of birth.', 'Lütfen doğum tarihinizi tam olarak seçin.');
    if (!/^\d{6,10}$/.test(smartCardNumber)) next.smartCardNumber = trText('شماره کارت هوشمند راهداری را وارد کنید.', 'Please enter your road administration smart card number.', 'Lütfen karayolları akıllı kart numaranızı girin.');
    if (!isMobile(mobile)) next.mobile = trText('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.', 'The mobile number must be 11 digits and start with 09.', 'Cep telefonu numarası 11 haneli olmalı ve 09 ile başlamalıdır.');
    if (!province) next.province = trText('استان را انتخاب کنید.', 'Please select a province.', 'Lütfen bir il seçin.');
    if (!city) next.city = trText('شهر را انتخاب کنید.', 'Please select a city.', 'Lütfen bir şehir seçin.');
    if (!address.trim()) next.address = trText('نشانی محل سکونت را وارد کنید.', 'Please enter your residential address.', 'Lütfen ikamet adresinizi girin.');
    return next;
  };

  const handleNext = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(trText('لطفاً خطاهای فرم را برطرف کنید.', 'Please fix the form errors.', 'Lütfen formdaki hataları düzeltin.'));
      return;
    }
    setFormError('');
    onChange({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      nationalId,
      dob: `${dobYear}/${dobMonth}/${dobDay}`,
      province,
      city,
      mobile,
      driverId: smartCardNumber,
      address: address.trim(),
    });
    onNext();
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <RegistrationHeader
        currentStep={1}
        title={trText('اطلاعات شخصی و هویتی', 'Personal and identity information', 'Kişisel ve kimlik bilgileri')}
        subtitle={trText('مشخصات شناسنامه‌ای، گواهینامه و محل سکونت', 'Birth certificate details, licence and place of residence', 'Nüfus bilgileri, ehliyet ve ikamet bilgileri')}
        onBack={onPrev}
      />

      <main className="w-full max-w-3xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6">
        <ErrorBanner message={formError} />

        <SectionCard icon="badge" title={trText('مشخصات هویتی', 'Identity details', 'Kimlik bilgileri')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={trText('نام', 'First name', 'Ad')} error={errors.firstName}>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label={trText('نام خانوادگی', 'Last name', 'Soyad')} error={errors.lastName}>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label={trText('کد ملی (۱۰ رقم)', 'National ID (10 digits)', 'Kimlik numarası (10 hane)')} error={errors.nationalId}>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(digitsOnly(e.target.value))}
                className={`${inputClass} font-jetbrains tracking-widest`}
              />
            </FormField>
            <FormField label={trText('شماره کارت هوشمند راهداری', 'Road administration smart card number', 'Karayolları akıllı kart numarası')} error={errors.smartCardNumber}>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={10}
                value={smartCardNumber}
                onChange={(e) => setSmartCardNumber(digitsOnly(e.target.value))}
                className={`${inputClass} font-jetbrains`}
              />
            </FormField>
          </div>

          <FormField label={trText('تاریخ تولد (شمسی)', 'Date of birth (Persian calendar)', 'Doğum tarihi (Hicri Şemsi)')} error={errors.dob}>
            <div className="grid grid-cols-3 gap-2">
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className={selectClass} aria-label={trText('روز تولد', 'Day of birth', 'Doğum günü')}>
                <option value="">{trText('روز', 'Day', 'Gün')}</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className={selectClass} aria-label={trText('ماه تولد', 'Month of birth', 'Doğum ayı')}>
                <option value="">{trText('ماه', 'Month', 'Ay')}</option>
                {MONTHS.map((month, idx) => (
                  <option key={month.en} value={String(idx + 1).padStart(2, '0')}>{trText(month.fa, month.en, month.tr)}</option>
                ))}
              </select>
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} className={selectClass} aria-label={trText('سال تولد', 'Year of birth', 'Doğum yılı')}>
                <option value="">{trText('سال', 'Year', 'Yıl')}</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </FormField>

        </SectionCard>

        <SectionCard icon="location_on" title={trText('اطلاعات تماس و سکونت', 'Contact and residence information', 'İletişim ve ikamet bilgileri')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={trText('شماره موبایل', 'Mobile number', 'Cep telefonu numarası')} error={errors.mobile}>
              <input
                type="tel"
                inputMode="numeric"
                dir="ltr"
                maxLength={11}
                value={mobile}
                onChange={(e) => setMobile(digitsOnly(e.target.value))}
                placeholder="09xxxxxxxxx"
                className={`${inputClass} font-jetbrains`}
              />
            </FormField>
            <FormField label={trText('استان محل سکونت', 'Province of residence', 'İkamet ili')} error={errors.province}>
              <select value={province} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass}>
                <option value="">{trText('انتخاب استان', 'Select province', 'İl seçin')}</option>
                {IRAN_PROVINCES.map((prov) => (
                  <option key={prov.id} value={prov.name}>{prov.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label={trText('شهر محل سکونت', 'City of residence', 'İkamet şehri')} error={errors.city}>
              <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!province} className={selectClass}>
                <option value="">{province ? trText('انتخاب شهر', 'Select city', 'Şehir seçin') : trText('ابتدا استان را انتخاب کنید', 'Select a province first', 'Önce ili seçin')}</option>
                {cities.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label={trText('نشانی دقیق محل سکونت', 'Full residential address', 'Tam ikamet adresi')} error={errors.address}>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={trText('خیابان، کوچه، پلاک', 'Street, alley, number', 'Sokak, ara sokak, kapı no')}
              className={inputClass}
            />
          </FormField>
        </SectionCard>

        <StepActions onBack={onPrev} onNext={handleNext} nextLabel={trText('ادامه به بارگذاری مدارک', 'Continue to document upload', 'Belge yüklemeye devam et')} />

        <div className="text-center">
          <span className="text-xs text-[#64748b]">{trText('قبلاً ثبت‌نام کرده‌اید؟ ', 'Already registered? ', 'Daha önce kayıt oldunuz mu? ')}</span>
          <button type="button" onClick={onLoginClick} className="text-xs font-bold text-[#00258e] hover:underline cursor-pointer">
            {trText('ورود به حساب کاربری', 'Sign in to your account', 'Hesabınıza giriş yapın')}
          </button>
        </div>
      </main>
    </div>
  );
};
