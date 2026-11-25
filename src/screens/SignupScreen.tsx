import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { TLDLogo } from '../components/brand/TLDLogo';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onBackToLogin,
}) => {
  const { signup, isOffline } = useAuth();
  const { t, trText } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = trText('نام الزامی است', 'First name is required', 'Ad gereklidir');
    if (!lastName.trim()) errs.lastName = trText('نام خانوادگی الزامی است', 'Last name is required', 'Soyad gereklidir');

    const cleanedMobile = mobile.replace(/\s+/g, '');
    if (!cleanedMobile) errs.mobile = trText('شماره موبایل الزامی است', 'Mobile number is required', 'Cep telefonu numarası gereklidir');
    else if (cleanedMobile.length < 10) errs.mobile = trText('شماره موبایل باید حداقل ۱۰ رقم باشد', 'Mobile number must be at least 10 digits', 'Cep telefonu numarası en az 10 haneli olmalıdır');

    // تا زمانی که سرویس پیامک فعال نشده، ثبت‌نام با ایمیل انجام می‌شود.
    if (!email.trim()) {
      errs.email = trText('ایمیل الزامی است', 'Email is required', 'E-posta gereklidir');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) errs.email = trText('فرمت ایمیل نامعتبر است', 'Invalid email format', 'Geçersiz e-posta biçimi');
    }

    if (!password) errs.password = trText('رمز عبور الزامی است', 'Password is required', 'Şifre gereklidir');
    else if (password.length < 6) errs.password = trText('رمز عبور باید حداقل ۶ کاراکتر باشد', 'Password must be at least 6 characters', 'Şifre en az 6 karakter olmalıdır');

    if (password !== confirmPassword) errs.confirmPassword = trText('تکرار رمز عبور مطابقت ندارد', 'Password confirmation does not match', 'Şifre tekrarı eşleşmiyor');
    if (!terms) errs.terms = trText('پذیرش قوانین و مقررات الزامی است', 'You must accept the terms and conditions', 'Kullanım koşullarını kabul etmeniz gereklidir');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup({
        firstName,
        lastName,
        mobile,
        email: email || undefined,
        password,
      });
      onSignupSuccess();
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : trText('خطا در ثبت نام', 'Error during sign-up', 'Kayıt sırasında hata oluştu') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 md:p-6 select-none">
      <div className="w-full max-w-md bg-white border border-[#c4c5da] rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(0,37,142,0.08)] flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <TLDLogo variant="compact" showPersianSlogan={false} className="mb-1" />
          <h1 className="font-vazirmatn text-xl font-bold text-[#00258e]">
            {t.createAccount}
          </h1>
          <p className="font-vazirmatn text-xs text-[#545f72]">
            {trText('برای دسترسی به سامانه اطلاعات خود را وارد کنید.', 'Enter your information to access the system.', 'Sisteme erişmek için bilgilerinizi girin.')}
          </p>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="p-3 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg text-[#93000a] font-vazirmatn text-xs font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {/* First & Last Name Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
                {t.firstName}
              </label>
              <input
                type="text"
                placeholder={trText('علی', 'Ali', 'Ali')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`h-11 px-3 rounded-lg border bg-white font-vazirmatn text-sm outline-none transition-colors ${
                  errors.firstName
                    ? 'border-[#ba1a1a] bg-[#ffdad6]/20'
                    : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                }`}
              />
              {errors.firstName && (
                <span className="text-[11px] text-[#ba1a1a] font-vazirmatn">{errors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
                {t.lastName}
              </label>
              <input
                type="text"
                placeholder={trText('رضایی', 'Rezaei', 'Rezaei')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`h-11 px-3 rounded-lg border bg-white font-vazirmatn text-sm outline-none transition-colors ${
                  errors.lastName
                    ? 'border-[#ba1a1a] bg-[#ffdad6]/20'
                    : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                }`}
              />
              {errors.lastName && (
                <span className="text-[11px] text-[#ba1a1a] font-vazirmatn">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
              {t.mobileNumber}
            </label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                placeholder="09120000000"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={`w-full h-11 px-3 pe-10 rounded-lg border bg-white font-jetbrains text-sm outline-none transition-colors ${
                  errors.mobile
                    ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#ba1a1a]'
                    : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                }`}
              />
              <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
                smartphone
              </span>
            </div>
            {errors.mobile && (
              <span className="text-[11px] text-[#ba1a1a] font-vazirmatn flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">error</span>
                {errors.mobile}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
              {trText('ایمیل (برای ورود به حساب)', 'Email (used to sign in)', 'E-posta (giriş için)')}
            </label>
            <div className="relative">
              <input
                type="email"
                dir="ltr"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-11 px-3 pe-10 rounded-lg border bg-white font-jetbrains text-sm outline-none transition-colors ${
                  errors.email
                    ? 'border-[#ba1a1a] bg-[#ffdad6]/20'
                    : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                }`}
              />
              <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-[#747686] text-[18px]">
                mail
              </span>
            </div>
            {errors.email && (
              <span className="text-[11px] text-[#ba1a1a] font-vazirmatn">{errors.email}</span>
            )}
            <span className="text-[10px] text-[#667085] font-vazirmatn leading-4">
              {trText(
                'در حال حاضر ورود با ایمیل و رمز عبور انجام می‌شود؛ ورود با پیامک به‌زودی فعال می‌شود.',
                'Sign-in currently uses email and password; SMS login will be enabled soon.',
                'Giriş şu anda e-posta ve şifre ile yapılır; SMS ile giriş yakında etkinleştirilecek.'
              )}
            </span>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-11 px-3 ps-9 rounded-lg border bg-white font-jetbrains text-sm outline-none transition-colors ${
                    errors.password
                      ? 'border-[#ba1a1a] bg-[#ffdad6]/20'
                      : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1a1b23]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-[#ba1a1a] font-vazirmatn">{errors.password}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
                {t.confirmPassword}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full h-11 px-3 ps-9 rounded-lg border bg-white font-jetbrains text-sm outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-[#ba1a1a] bg-[#ffdad6]/20'
                      : 'border-[#c4c5da] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1a1b23]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-[11px] text-[#ba1a1a] font-vazirmatn">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="w-4 h-4 rounded border-[#c4c5da] text-[#00258e] focus:ring-[#00258e] cursor-pointer"
            />
            <label htmlFor="terms" className="font-vazirmatn text-xs text-[#545f72] cursor-pointer select-none">
              <span className="text-[#00258e] font-semibold">{t.terms}</span> {t.termsAgreement}
            </label>
          </div>
          {errors.terms && (
            <span className="text-[11px] text-[#ba1a1a] font-vazirmatn -mt-2">{errors.terms}</span>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5 mt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={isOffline}
              fullWidth
              icon={<span className="material-symbols-outlined text-[18px]">arrow_left_alt</span>}
            >
              {trText('ایجاد حساب', 'Sign Up', 'Kayıt Ol')}
            </Button>

            <Button
              type="button"
              onClick={onBackToLogin}
              variant="outline"
              fullWidth
            >
              {t.backToLogin}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
