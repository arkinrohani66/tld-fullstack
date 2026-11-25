import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { TLDLogo } from '../components/brand/TLDLogo';
import { getStoredCredentials, BiometricCredential } from '../utils/webAuthn';
import { BiometricAuthModal } from '../components/auth/BiometricAuthModal';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onRequestOtp: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onRequestOtp,
  onForgotPassword,
  onCreateAccount,
}) => {
  const { loginWithPassword, loginWithBiometrics, loginWithGoogle, requestOtp, setCurrentMobile, isOffline, showToast, currentUser } = useAuth();
  const { t, language, trText } = useLanguage();

  const [countryCode, setCountryCode] = useState('+98');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [enrolledCreds, setEnrolledCreds] = useState<BiometricCredential[]>([]);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    setEnrolledCreds(creds);
  }, []);

  const isEmailInput = mobile.includes('@');

  const validateMobile = (val: string) => {
    const cleaned = val.trim().replace(/\s+/g, '');
    if (!cleaned) return trText('شماره موبایل یا ایمیل الزامی است', 'Mobile number or email is required', 'Cep telefonu numarası veya e-posta gereklidir');
    if (cleaned.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        return trText('ایمیل وارد‌شده معتبر نیست', 'The email address is not valid', 'Girilen e-posta geçerli değil');
      }
      return null;
    }
    if (cleaned.length < 10) return trText('شماره موبایل باید حداقل ۱۰ رقم باشد (مثال: 09120000000)', 'Mobile number must be at least 10 digits (e.g. 09120000000)', 'Cep telefonu numarası en az 10 haneli olmalıdır (örn. 09120000000)');
    return null;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mobileErr = validateMobile(mobile);
    if (mobileErr) {
      setError(mobileErr);
      return;
    }

    if (!password || password.length < 6) {
      setError(trText('رمز عبور باید حداقل ۶ کاراکتر باشد', 'Password must be at least 6 characters', 'Şifre en az 6 karakter olmalıdır'));
      return;
    }

    setLoading(true);
    try {
      // اگر ایمیل وارد شده باشد همان ارسال می‌شود؛ در غیر این صورت شماره موبایل.
      const identifier = isEmailInput ? mobile.trim() : `${countryCode} ${mobile}`.trim();
      await loginWithPassword(identifier, password);
      onLoginSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('خطا در برقراری ارتباط با سرور', 'Error connecting to the server', 'Sunucuya bağlanırken hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setError(null);
    const mobileErr = validateMobile(mobile);
    if (mobileErr) {
      setError(mobileErr);
      return;
    }

    setOtpLoading(true);
    try {
      const fullMobile = `${countryCode} ${mobile}`.trim();
      setCurrentMobile(fullMobile);
      await requestOtp(fullMobile);
      onRequestOtp();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('خطا در ارسال کد تأیید', 'Error sending the verification code', 'Doğrulama kodu gönderilirken hata oluştu'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBiometricLogin = async (specificMobile?: string) => {
    setError(null);
    const target = specificMobile || (mobile ? `${countryCode} ${mobile}`.trim() : (enrolledCreds[0]?.userName || ''));
    setBiometricLoading(true);
    try {
      const user = await loginWithBiometrics(target || undefined);
      if (user) {
        showToast('success', trText('ورود امن بیومتریک تایید شد', 'Secure biometric login verified', 'Güvenli biyometrik giriş doğrulandı'));
        onLoginSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : trText('احراز هویت بیومتریک ناموفق بود', 'Biometric authentication failed', 'Biyometrik kimlik doğrulama başarısız oldu'));
      // If no creds or failure, allow opening setup modal
      if (enrolledCreds.length === 0) {
        setIsBiometricModalOpen(true);
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // Supabase OAuth مسئول احراز هویت است؛ بعد از بازگشت از گوگل،
      // AuthProvider جلسه و پروفایل را تازه میکند. نباید اینجا onLoginSuccess
      // را صدا بزنیم چون هنوز جلسهای ساخته نشده است.
      await loginWithGoogle();
      showToast('info', trText('در حال انتقال به صفحه ورود گوگل...', 'Redirecting to Google sign-in...', "Google girişine yönlendiriliyor..."));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : trText('خطا در ورود با حساب گوگل', 'Error signing in with Google', 'Google hesabıyla giriş yapılırken hata oluştu'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 md:p-8">
      {/* Bento Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#c4c5da] shadow-[0px_4px_24px_rgba(0,37,142,0.08)] flex flex-col md:flex-row overflow-hidden relative">
        {/* Right Form Panel (Primary in RTL) */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-white z-10">
          {/* Brand Header */}
          <div className="mb-6 text-center md:text-start">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <TLDLogo variant="horizontal" showPersianSlogan={false} />
            </div>

            <h1 className="font-vazirmatn text-2xl font-bold text-[#1a1b23] mb-1">
              {t.login}
            </h1>
            <p className="font-vazirmatn text-sm text-[#545f72] leading-normal">
              {t.enterMobile}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg text-[#93000a] font-vazirmatn text-xs font-semibold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Tap Biometric Login for Enrolled Drivers / Shippers */}
          {enrolledCreds.length > 0 && (
            <div className="mb-4 p-3.5 bg-gradient-to-r from-[#eeedf9] to-[#f4f2fe] border-2 border-[#00258e]/30 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#00258e] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                      {enrolledCreds[0].deviceLabel.includes('Face') ? 'face' : 'fingerprint'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1a1b23] block">
                      {trText('ورود سریع با اثر انگشت / Face ID', 'Fast Biometric Passkey Login', 'Parmak İzi / Face ID ile Hızlı Giriş')}
                    </span>
                    <span className="text-[11px] text-[#545f72] font-jetbrains" dir="ltr">
                      {enrolledCreds[0].displayName} ({enrolledCreds[0].userName})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-[#00a368]/10 text-[#00a368] font-bold px-2 py-0.5 rounded-full border border-[#00a368]/20">
                  {enrolledCreds[0].userRole === 'SHIPPER' ? trText('صاحب بار', 'Cargo Owner', 'Yük Sahibi') : trText('راننده', 'Driver', 'Sürücü')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBiometricLogin(enrolledCreds[0].userName)}
                  disabled={isOffline || biometricLoading}
                  className="flex-1 bg-[#00258e] hover:bg-[#0036c5] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {enrolledCreds[0].deviceLabel.includes('Face') ? 'face' : 'fingerprint'}
                  </span>
                  <span>
                    {biometricLoading
                      ? trText('در حال اسکن...', 'Scanning...', 'Taranıyor...')
                      : trText(`ورود با اثر انگشت: ${enrolledCreds[0].displayName}`, `Quick Login: ${enrolledCreds[0].displayName}`, `Parmak iziyle giriş: ${enrolledCreds[0].displayName}`)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBiometricModalOpen(true)}
                  className="p-2.5 bg-white border border-[#c4c5da] hover:border-[#00258e] text-[#00258e] rounded-xl text-xs font-bold cursor-pointer"
                  title={trText('مدیریت حسگرها', 'Manage sensors', 'Sensörleri yönet')}
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
              </div>
            </div>
          )}


          {/* Form */}
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
            {/* Mobile Number Field with Country Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">
                {t.mobileNumber}
              </label>

              <div className="flex items-stretch border border-[#c4c5da] rounded-lg bg-white focus-within:border-[#00258e] focus-within:ring-2 focus-within:ring-[#00258e]/20 transition-all overflow-hidden h-12">
                {/* Country Code Picker */}
                <div className="flex items-center bg-[#eeedf9] border-e border-[#c4c5da] px-2.5" dir="ltr">
                  <span className="material-symbols-outlined text-[#545f72] text-[18px] me-1">public</span>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent border-none outline-none font-jetbrains text-xs font-bold text-[#1a1b23] cursor-pointer"
                  >
                    <option value="+98">+98 (IR)</option>
                    <option value="+90">+90 (TR)</option>
                    <option value="+1">+1 (US)</option>
                  </select>
                </div>

                {/* Mobile Input */}
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="912 000 0000"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (error) setError(null);
                  }}
                  className="flex-1 bg-transparent border-none outline-none px-3.5 font-jetbrains text-base text-[#1a1b23] placeholder:text-[#747686]"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="font-vazirmatn text-xs font-semibold text-[#00258e] hover:underline cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>

              <div className="flex items-stretch border border-[#c4c5da] rounded-lg bg-white focus-within:border-[#00258e] focus-within:ring-2 focus-within:ring-[#00258e]/20 transition-all overflow-hidden h-12 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="flex-1 bg-transparent border-none outline-none px-3.5 font-jetbrains text-base text-[#1a1b23] placeholder:text-[#747686]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-[#747686] hover:text-[#1a1b23] transition-colors flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={isOffline}
                fullWidth
                icon={<span className="material-symbols-outlined text-[18px]">login</span>}
              >
                {t.login}
              </Button>

              <Button
                type="button"
                onClick={handleOtpLogin}
                variant="outline"
                loading={otpLoading}
                disabled={isOffline}
                fullWidth
                icon={<span className="material-symbols-outlined text-[18px]">passkey</span>}
              >
                {t.loginOtp}
              </Button>

              {/* WebAuthn Biometric Driver & Shipper Login */}
              <button
                type="button"
                onClick={() => {
                  if (enrolledCreds.length > 0) {
                    handleBiometricLogin();
                  } else {
                    setIsBiometricModalOpen(true);
                  }
                }}
                disabled={isOffline || biometricLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#c4c5da] hover:border-[#00258e] hover:bg-[#f4f2fe] text-[#00258e] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                <span>
                  {biometricLoading
                    ? trText('در حال اسکن بیومتریک...', 'Scanning biometrics...', 'Biyometrik veriler taranıyor...')
                    : trText('ورود با اثر انگشت یا چهره (WebAuthn Passkey)', 'Login with Fingerprint / Face ID (Passkey)', 'Parmak İzi veya Yüz ile Giriş (WebAuthn Passkey)')}
                </span>
              </button>

              {/* Google Sign-in via Supabase OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isOffline || googleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#c4c5da] hover:border-[#00258e] bg-white hover:bg-[#f8f9fe] text-[#1a1b23] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {googleLoading
                    ? trText('در حال اتصال به گوگل...', 'Connecting to Google...', "Google'a bağlanılıyor...")
                    : trText('ورود امن با حساب کاربری Google', 'Sign in with Google', 'Google Hesabı ile Güvenli Giriş')}
                </span>
              </button>
            </div>
          </form>

          {/* Footer Signup Link */}
          <div className="mt-8 text-center border-t border-[#e2e1ed] pt-4">
            <span className="font-vazirmatn text-sm text-[#545f72]">{t.noAccount} </span>
            <button
              onClick={onCreateAccount}
              className="font-vazirmatn text-sm font-bold text-[#00258e] hover:underline cursor-pointer ms-1"
            >
              {t.createAccount}
            </button>
          </div>
        </div>

        {/* Left Side Industrial Graphic (Desktop View) */}
        <div className="hidden md:flex w-1/2 bg-[#eeedf9] border-s border-[#c4c5da] relative flex-col justify-between p-8 overflow-hidden">
          {/* Tech Grid Pattern */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #c4c5da 1px, transparent 1px), linear-gradient(to bottom, #c4c5da 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Status */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="font-jetbrains text-xs font-bold text-[#00258e] bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-[#c4c5da]">
              SYSTEM READY
            </span>
            <span className="font-jetbrains text-xs text-[#545f72]">NODE_ID: IR-TEH-01</span>
          </div>

          {/* Center Graphic */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-[#c4c5da]/60 shadow-md">
            <TLDLogo variant="full" showPersianSlogan={true} className="w-full" />
          </div>

          {/* Bottom Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur border border-[#c4c5da] rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#00a368]/10 flex items-center justify-center text-[#00a368]">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="text-start">
              <div className="font-jetbrains text-[10px] text-[#545f72] uppercase font-bold" dir="ltr">
                ALL ENGINES OPERATIONAL
              </div>
              <div className="font-vazirmatn text-xs font-semibold text-[#1a1b23]">
                {trText('اتصال امن به شبکه اینترنت اشیاء', 'Secure connection to the Internet of Things network', 'Nesnelerin İnterneti ağına güvenli bağlantı')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WebAuthn Biometric Login & Registration Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => {
          setIsBiometricModalOpen(false);
          setEnrolledCreds(getStoredCredentials());
        }}
        onSuccess={() => {
          onLoginSuccess();
        }}
        userMobile={mobile ? `${countryCode} ${mobile}`.trim() : (enrolledCreds[0]?.userName || '')}
        userName={enrolledCreds[0]?.displayName || (mobile ? trText(`کاربر ${mobile}`, `User ${mobile}`, `Kullanıcı ${mobile}`) : '')}
        userRole={enrolledCreds[0]?.userRole || 'DRIVER'}
        purpose="LOGIN"
      />
    </div>
  );
};
