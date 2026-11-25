import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { getSupabaseClient } from '../services/supabaseClient';

interface ResetPasswordScreenProps {
  onSuccess: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onSuccess }) => {
  const { t, trText } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criteria validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const passedCount = [hasMinLength, hasNumber, hasUpperCase, hasSpecial].filter(Boolean).length;

  let strengthLabel = trText('خیلی ضعیف', 'Very weak', 'Çok zayıf');
  let strengthColor = 'bg-[#ba1a1a]';
  let textColor = 'text-[#ba1a1a]';

  if (passedCount === 2) {
    strengthLabel = trText('متوسط', 'Medium', 'Orta');
    strengthColor = 'bg-[#f97316]';
    textColor = 'text-[#f97316]';
  } else if (passedCount === 3) {
    strengthLabel = trText('خوب', 'Good', 'İyi');
    strengthColor = 'bg-[#0ea5e9]';
    textColor = 'text-[#0ea5e9]';
  } else if (passedCount === 4) {
    strengthLabel = trText('بسیار قوی', 'Very strong', 'Çok güçlü');
    strengthColor = 'bg-[#00a368]';
    textColor = 'text-[#00a368]';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passedCount < 3) {
      setError(trText('لطفاً شرایط امنیتی رمز عبور را رعایت فرمایید.', 'Please meet the password security requirements.', 'Lütfen şifre güvenlik koşullarını karşılayın.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(trText('تکرار رمز عبور مطابقت ندارد.', 'Password confirmation does not match.', 'Şifre tekrarı eşleşmiyor.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error(trText('اتصال به پایگاه داده پیکربندی نشده است.', 'Database connection is not configured.', 'Veritabanı bağlantısı yapılandırılmamış.'));
      }

      // بدون نشست بازیابی (کد پیامکی تأییدشده) امکان تغییر رمز وجود ندارد.
      const { data } = await client.auth.getUser();
      if (!data?.user) {
        throw new Error(
          trText('جلسه بازیابی معتبر نیست. لطفاً ابتدا کد پیامکی ارسال‌شده را در صفحه کد تأیید وارد کنید.', 'The recovery session is not valid. Please first enter the SMS code on the verification code screen.', 'Kurtarma oturumu geçerli değil. Lütfen önce doğrulama kodu ekranına gönderilen SMS kodunu girin.')
        );
      }

      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) {
        throw new Error(updateError.message);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : trText('تغییر رمز عبور ناموفق بود.', 'Failed to change the password.', 'Şifre değiştirilemedi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 md:p-6 select-none">
      <div className="w-full max-w-md bg-white border border-[#c4c5da] rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(0,37,142,0.08)] flex flex-col gap-6 relative">
        <div className="flex flex-col items-center text-center gap-1.5">
          <h1 className="font-vazirmatn text-2xl font-bold text-[#00258e]">
            {trText('تغییر رمز عبور', 'Change Password', 'Şifre Değiştir')}
          </h1>
          <p className="font-vazirmatn text-xs text-[#545f72]">
            {trText('لطفا رمز عبور جدید خود را وارد کنید.', 'Please enter your new password.', 'Lütfen yeni şifrenizi girin.')}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg text-[#93000a] font-vazirmatn text-xs font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">
              {trText('رمز عبور جدید', 'New Password', 'Yeni Şifre')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-12 px-4 ps-10 rounded-lg border border-[#c4c5da] bg-white font-jetbrains text-base text-[#1a1b23] focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1a1b23]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Strength Meter */}
          <div className="flex flex-col gap-1.5 bg-[#f4f2fe] p-3 rounded-lg border border-[#c4c5da]">
            <div className="flex justify-between items-center text-xs font-jetbrains">
              <span className="text-[#545f72] font-vazirmatn font-semibold">{trText('قدرت رمز عبور:', 'Password strength:', 'Şifre gücü:')}</span>
              <span className={`font-bold ${textColor}`}>{strengthLabel}</span>
            </div>
            <div className="flex gap-1.5 w-full h-2">
              <div
                className={`flex-1 rounded-full ${
                  passedCount >= 1 ? strengthColor : 'bg-[#e2e1ed]'
                } transition-all duration-300`}
              />
              <div
                className={`flex-1 rounded-full ${
                  passedCount >= 2 ? strengthColor : 'bg-[#e2e1ed]'
                } transition-all duration-300`}
              />
              <div
                className={`flex-1 rounded-full ${
                  passedCount >= 3 ? strengthColor : 'bg-[#e2e1ed]'
                } transition-all duration-300`}
              />
              <div
                className={`flex-1 rounded-full ${
                  passedCount >= 4 ? strengthColor : 'bg-[#e2e1ed]'
                } transition-all duration-300`}
              />
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="bg-[#f4f2fe] rounded-lg p-3.5 border border-[#c4c5da] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-vazirmatn">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  hasMinLength ? 'text-[#00a368]' : 'text-[#747686]'
                }`}
              >
                {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={hasMinLength ? 'text-[#1a1b23] font-semibold' : 'text-[#545f72]'}>
                {trText('حداقل ۸ کاراکتر', 'At least 8 characters', 'En az 8 karakter')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-vazirmatn">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  hasNumber ? 'text-[#00a368]' : 'text-[#747686]'
                }`}
              >
                {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={hasNumber ? 'text-[#1a1b23] font-semibold' : 'text-[#545f72]'}>
                {trText('حداقل یک عدد (0-9)', 'At least one number (0-9)', 'En az bir sayı (0-9)')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-vazirmatn">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  hasUpperCase ? 'text-[#00a368]' : 'text-[#747686]'
                }`}
              >
                {hasUpperCase ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={hasUpperCase ? 'text-[#1a1b23] font-semibold' : 'text-[#545f72]'}>
                {trText('حداقل یک حرف بزرگ انگلیسی', 'At least one uppercase letter', 'En az bir büyük harf')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-vazirmatn">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  hasSpecial ? 'text-[#00a368]' : 'text-[#747686]'
                }`}
              >
                {hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={hasSpecial ? 'text-[#1a1b23] font-semibold' : 'text-[#545f72]'}>
                {trText('حداقل یک نماد خاص (!@#$)', 'At least one special character (!@#$)', 'En az bir özel karakter (!@#$)')}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">
              {trText('تکرار رمز عبور جدید', 'Confirm New Password', 'Yeni Şifre Tekrarı')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-12 px-4 ps-10 rounded-lg border border-[#c4c5da] bg-white font-jetbrains text-base text-[#1a1b23] focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#1a1b23]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
            className="mt-2"
          >
            {trText('ذخیره و ورود', 'Save and Login', 'Kaydet ve Giriş Yap')}
          </Button>
        </form>
      </div>
    </div>
  );
};
