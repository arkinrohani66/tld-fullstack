import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';

interface ForgotPasswordScreenProps {
  onSubmitSuccess: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onSubmitSuccess,
  onBackToLogin,
}) => {
  const { requestOtp, setCurrentMobile, isOffline } = useAuth();
  const { t, language, trText } = useLanguage();

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobile.replace(/\s+/g, '');
    if (!clean || clean.length < 10) {
      setError(trText('شماره موبایل نامعتبر است', 'Invalid mobile number', 'Geçersiz cep telefonu numarası'));
      return;
    }

    setLoading(true);
    try {
      setCurrentMobile(clean);
      await requestOtp(clean);
      onSubmitSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('خطا در ارسال کد', 'Error sending the code', 'Kod gönderilirken hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 md:p-6 select-none">
      <div className="w-full max-w-md bg-white border border-[#c4c5da] rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(0,37,142,0.08)] flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[#eeedf9] border border-[#b9c3ff] flex items-center justify-center text-[#00258e] mb-1">
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
          <h1 className="font-vazirmatn text-xl font-bold text-[#00258e]">
            {t.forgotPassword}
          </h1>
          <p className="font-vazirmatn text-xs text-[#545f72] max-w-xs">
            {t.sendCode}
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
          <div className="flex flex-col gap-1.5">
            <label className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
              {t.mobileNumber}
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-12 px-4 pe-10 rounded-lg border border-[#c4c5da] bg-white font-jetbrains text-sm text-[#1a1b23] focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20 outline-none"
              />
              <span className="material-symbols-outlined absolute end-3 text-[#747686] text-[20px]">
                phone_iphone
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={isOffline}
              fullWidth
              icon={
                <span className="material-symbols-outlined text-[18px]">
                  {language === 'fa' ? 'arrow_back' : 'arrow_forward'}
                </span>
              }
            >
              {t.continue}
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

        <div className="mt-2 pt-4 border-t border-[#e2e1ed] text-center">
          <p className="font-vazirmatn text-xs text-[#545f72] flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#00258e]">support_agent</span>
            <span>{t.needSupport}</span>
            <a href="tel:+982191000000" className="text-[#00258e] font-bold hover:underline">
              {t.contactSupport}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
