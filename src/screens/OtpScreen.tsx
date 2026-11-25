import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { OtpInput } from '../components/ui/OtpInput';
import { Button } from '../components/ui/Button';

interface OtpScreenProps {
  onVerificationSuccess: () => void;
  onChangeNumber: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  onVerificationSuccess,
  onChangeNumber,
}) => {
  const { verifyOtp, requestOtp, currentMobile, isOffline } = useAuth();
  const { t, trText } = useLanguage();

  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) {
      setError(trText('لطفاً کد ۶ رقمی را به طور کامل وارد نمایید', 'Please enter the complete 6-digit code', 'Lütfen 6 haneli kodu tamamen girin'));
      return;
    }

    if (!currentMobile) {
      setError(trText('شماره موبایل مشخص نیست؛ لطفاً دوباره وارد شوید.', 'The mobile number is not set; please sign in again.', 'Cep telefonu numarası belirlenmedi; lütfen tekrar giriş yapın.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(currentMobile, otpValue);
      onVerificationSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('کد تأیید نامعتبر است', 'Invalid verification code', 'Geçersiz doğrulama kodu'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending || isOffline) return;
    setResending(true);
    setError(null);
    try {
      await requestOtp(currentMobile || '09123456789');
      setTimeLeft(120);
      setOtpValue('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('خطا در ارسال مجدد کد', 'Error resending the code', 'Kod yeniden gönderilirken hata oluştu'));
    } finally {
      setResending(false);
    }
  };

  // Mask mobile number for display: 0912****345
  const maskedMobile = currentMobile
    ? currentMobile.replace(/(\d{4})\d+(\d{3})/, '$1****$2')
    : '0912****345';

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 md:p-6 select-none">
      <div className="w-full max-w-md bg-white border border-[#c4c5da] rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(0,37,142,0.08)] flex flex-col items-center relative">
        {/* Brand & Icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="font-jetbrains text-xs font-black tracking-tighter text-[#00258e] mb-4 uppercase">
            TLD Logistics
          </div>
          <div className="bg-[#eeedf9] text-[#00258e] border border-[#b9c3ff] rounded-2xl w-14 h-14 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl">lock_open</span>
          </div>
          <h1 className="font-vazirmatn text-xl font-bold text-[#1a1b23] mb-1">
            {t.verifyMobile}
          </h1>
          <p className="font-vazirmatn text-xs text-[#545f72] max-w-[280px]">
            {t.codeSentTo}{' '}
            <span className="font-jetbrains font-bold text-[#1a1b23] inline-block mx-1" dir="ltr">
              {maskedMobile}
            </span>
          </p>
          {import.meta.env.DEV && (
            <div className="mt-1 font-jetbrains text-[10px] text-[#00258e] bg-[#dde1ff] px-2.5 py-0.5 rounded font-semibold">
              {trText('کد تستی (فقط محیط توسعه): 123456', 'Test code (development environment only): 123456', 'Test kodu (yalnızca geliştirme ortamı): 123456')}
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="w-full mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg text-[#93000a] font-vazirmatn text-xs font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Grid */}
        <div className="mb-6">
          <OtpInput
            length={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              if (error) setError(null);
            }}
            hasError={Boolean(error)}
            disabled={loading || isOffline}
          />
        </div>

        {/* Actions & Resend */}
        <div className="w-full flex flex-col items-center gap-4">
          <Button
            onClick={handleVerify}
            variant="primary"
            loading={loading}
            disabled={isOffline || otpValue.length !== 4}
            fullWidth
          >
            {t.verifyAndContinue}
          </Button>

          {/* Bottom Timer & Change Number row */}
          <div className="flex items-center justify-between w-full px-1 text-xs">
            {/* Resend Code Button with Countdown */}
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0 || resending || isOffline}
              className={`flex items-center gap-1 font-vazirmatn transition-colors cursor-pointer ${
                timeLeft > 0
                  ? 'text-[#747686] cursor-not-allowed opacity-75'
                  : 'text-[#00258e] font-bold hover:underline'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>{t.resendCode}</span>
              {timeLeft > 0 && (
                <span className="font-jetbrains font-bold ms-1" dir="ltr">
                  {formatTimer(timeLeft)}
                </span>
              )}
            </button>

            {/* Change Number */}
            <button
              type="button"
              onClick={onChangeNumber}
              className="text-[#00258e] hover:underline font-vazirmatn font-semibold transition-colors cursor-pointer"
            >
              {t.changeNumber}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
