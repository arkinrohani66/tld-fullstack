import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { isSupabaseConfigured, getTargetSupabaseUrl } from '../services/supabaseClient';

interface ChangePasswordScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onNavigate }) => {
  const { changePassword, showToast, isOffline } = useAuth();
  const { trText } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const passedRequirementsCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isFormValid = hasMinLength && isMatching && currentPassword.length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      if (!hasMinLength) {
        showToast('error', trText('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.', 'The new password must be at least 8 characters long.', 'Yeni şifre en az 8 karakter olmalıdır.'));
      } else if (!isMatching) {
        showToast('error', trText('تکرار رمز عبور با رمز عبور جدید مطابقت ندارد.', 'The password confirmation does not match the new password.', 'Şifre tekrarı yeni şifreyle eşleşmiyor.'));
      } else if (!currentPassword) {
        showToast('error', trText('لطفاً رمز عبور فعلی را وارد کنید.', 'Please enter your current password.', 'Lütfen mevcut şifrenizi girin.'));
      }
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword, signOutOtherDevices);
      showToast('success', trText('رمز عبور شما با موفقیت در Supabase تغییر یافت.', 'Your password was changed successfully in Supabase.', 'Şifreniz Supabase üzerinde başarıyla değiştirildi.'));
      setTimeout(() => {
        onNavigate('PROFILE');
      }, 700);
    } catch (err: any) {
      showToast('error', err.message || trText('خطا در تغییر رمز عبور', 'Failed to change the password', 'Şifre değiştirilirken hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] font-vazirmatn min-h-screen flex flex-col selection:bg-[#0036c5] selection:text-white">
      {/* TopAppBar */}
      <header className="flex items-center w-full px-4 md:px-8 h-16 bg-[#fbf8ff] border-b border-[#c4c5da] top-0 z-40 sticky shadow-xs">
        <button
          aria-label="Back"
          onClick={() => onNavigate('PROFILE')}
          className="flex items-center gap-1 text-[#00258e] hover:bg-[#e8e7f3] transition-colors p-2 rounded-xl active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined rtl:rotate-180 text-[20px]">arrow_back</span>
          <span className="font-jetbrains text-sm font-semibold">{trText('بازگشت', 'Back', 'Geri')}</span>
        </button>

        <h1 className="flex-1 text-center text-lg md:text-xl font-bold text-[#00258e]">
          {trText('تغییر رمز عبور', 'Change Password', 'Şifre Değiştir')}
        </h1>

        <div className="flex items-center justify-end">
          <span className="font-jetbrains text-xl font-bold text-[#00258e] tracking-tight">TLD</span>
        </div>
      </header>

      {/* Supabase Status Pill */}
      <div className="max-w-3xl w-full mx-auto px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between bg-white border border-[#c4c5da] rounded-xl px-4 py-2 text-xs font-jetbrains">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConfigured() && !isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[#444655]">
              {isSupabaseConfigured() && !isOffline
                ? 'AUTH PROVIDER: SUPABASE AUTH'
                : 'AUTH PROVIDER: LOCAL ENGINE'}
            </span>
          </div>
          <span className="text-[#747686] truncate max-w-[200px]" dir="ltr">
            {getTargetSupabaseUrl()}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Security Header Section */}
        <section className="bg-white border border-[#c4c5da] p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 justify-between shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#d8e3fa] text-[#5a6578] rounded-xl shrink-0">
              <span className="material-symbols-outlined text-[32px]">shield</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1b23]">{trText('امنیت حساب', 'Account Security', 'Hesap Güvenliği')}</h2>
              <p className="text-[#444655] text-sm mt-1">
                {trText('برای حفظ امنیت حساب، رمز عبور خود را به صورت دوره‌ای تغییر دهید.', 'To keep your account safe, change your password periodically.', 'Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirin.')}
              </p>
            </div>
          </div>

          <div className="bg-[#00a368]/10 border border-[#00a368]/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 self-start md:self-auto">
            <span className="material-symbols-outlined text-[#00a368] text-[16px]">check_circle</span>
            <span className="font-jetbrains text-[11px] font-bold text-[#00a368] uppercase">
              ACCOUNT SECURE
            </span>
          </div>
        </section>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#c4c5da] p-6 rounded-2xl shadow-sm space-y-6">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#1a1b23]" htmlFor="current-password">
              {trText('رمز عبور فعلی', 'Current Password', 'Mevcut Şifre')}
            </label>
            <div className="relative">
              <input
                className="w-full bg-[#fbf8ff] border border-[#747686] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] rounded-xl p-3 pr-10 font-jetbrains text-sm text-[#1a1b23] outline-none transition-shadow text-left"
                dir="ltr"
                id="current-password"
                placeholder="••••••••"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444655] hover:text-[#1a1b23] p-1 rounded focus:outline-none cursor-pointer"
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#1a1b23]" htmlFor="new-password">
                {trText('رمز عبور جدید', 'New Password', 'Yeni Şifre')}
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[#fbf8ff] border border-[#747686] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] rounded-xl p-3 pr-10 font-jetbrains text-sm text-[#1a1b23] outline-none transition-shadow text-left"
                  dir="ltr"
                  id="new-password"
                  placeholder="Enter new password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444655] hover:text-[#1a1b23] p-1 rounded focus:outline-none cursor-pointer"
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Strength Indicator */}
            <div className="space-y-1">
              <div className="flex h-2 gap-1.5 rounded-full overflow-hidden">
                <div
                  className={`flex-1 rounded-l transition-colors duration-300 ${
                    passedRequirementsCount >= 1 ? 'bg-amber-500' : 'bg-[#c4c5da]'
                  }`}
                />
                <div
                  className={`flex-1 transition-colors duration-300 ${
                    passedRequirementsCount >= 3
                      ? passedRequirementsCount >= 4
                        ? 'bg-[#00a368]'
                        : 'bg-amber-500'
                      : 'bg-[#c4c5da]'
                  }`}
                />
                <div
                  className={`flex-1 transition-colors duration-300 ${
                    passedRequirementsCount >= 4 ? 'bg-[#00a368]' : 'bg-[#c4c5da]'
                  }`}
                />
                <div
                  className={`flex-1 rounded-r transition-colors duration-300 ${
                    passedRequirementsCount === 5 ? 'bg-[#00a368]' : 'bg-[#c4c5da]'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-jetbrains text-[#444655]">
                <span className="uppercase">Strength</span>
                <span className="font-bold">
                  {passedRequirementsCount <= 1
                    ? trText('ضعیف (Weak)', 'Weak', 'Zayıf')
                    : passedRequirementsCount <= 3
                    ? trText('متوسط (Medium)', 'Medium', 'Orta')
                    : trText('قوی (Strong)', 'Strong', 'Güçlü')}
                </span>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="bg-[#eeedf9] p-3.5 rounded-xl border border-[#c4c5da]">
              <ul className="space-y-1.5 font-vazirmatn text-xs text-[#444655]">
                <li className={`flex items-center gap-2 ${hasMinLength ? 'text-[#00a368] font-bold' : ''}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{trText('حداقل ۸ کاراکتر', 'At least 8 characters', 'En az 8 karakter')}</span>
                </li>
                <li className={`flex items-center gap-2 ${hasUppercase ? 'text-[#00a368] font-bold' : ''}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {hasUppercase ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{trText('یک حرف بزرگ انگلیسی (A-Z)', 'One uppercase letter (A-Z)', 'Bir büyük harf (A-Z)')}</span>
                </li>
                <li className={`flex items-center gap-2 ${hasLowercase ? 'text-[#00a368] font-bold' : ''}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {hasLowercase ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{trText('یک حرف کوچک انگلیسی (a-z)', 'One lowercase letter (a-z)', 'Bir küçük harf (a-z)')}</span>
                </li>
                <li className={`flex items-center gap-2 ${hasNumber ? 'text-[#00a368] font-bold' : ''}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{trText('یک عدد (0-9)', 'One number (0-9)', 'Bir rakam (0-9)')}</span>
                </li>
                <li className={`flex items-center gap-2 ${hasSpecial ? 'text-[#00a368] font-bold' : ''}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{trText('یک کاراکتر خاص (!@#$%)', 'One special character (!@#$%)', 'Bir özel karakter (!@#$%)')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#1a1b23]" htmlFor="confirm-password">
              {trText('تکرار رمز عبور جدید', 'Confirm New Password', 'Yeni Şifreyi Onayla')}
            </label>
            <div className="relative">
              <input
                className={`w-full bg-[#fbf8ff] border ${
                  confirmPassword && !isMatching
                    ? 'border-[#ba1a1a]'
                    : confirmPassword && isMatching
                    ? 'border-[#00a368]'
                    : 'border-[#747686]'
                } focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] rounded-xl p-3 pr-10 font-jetbrains text-sm text-[#1a1b23] outline-none transition-shadow text-left`}
                dir="ltr"
                id="confirm-password"
                placeholder="Confirm new password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444655] hover:text-[#1a1b23] p-1 rounded focus:outline-none cursor-pointer"
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Dynamic feedback */}
            <div className="text-xs font-jetbrains min-h-[18px]">
              {confirmPassword && isMatching && (
                <span className="text-[#00a368] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  {trText('رمز عبور یکسان است (PASSWORDS MATCH)', 'Passwords match', 'Şifreler eşleşiyor')}
                </span>
              )}
              {confirmPassword && !isMatching && (
                <span className="text-[#ba1a1a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  {trText('رمزهای عبور وارد شده همخوانی ندارند', 'The passwords you entered do not match', 'Girilen şifreler eşleşmiyor')}
                </span>
              )}
            </div>
          </div>

          {/* Session Management */}
          <div className="border-t border-[#c4c5da] pt-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center pt-0.5">
                <input
                  type="checkbox"
                  checked={signOutOtherDevices}
                  onChange={(e) => setSignOutOtherDevices(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 bg-white border-2 border-[#747686] rounded-md flex items-center justify-center peer-checked:bg-[#00258e] peer-checked:border-[#00258e] transition-colors">
                  <span className="material-symbols-outlined text-white text-[16px] opacity-0 peer-checked:opacity-100 font-bold">
                    check
                  </span>
                </div>
              </div>
              <div>
                <span className="font-jetbrains text-xs font-bold text-[#1a1b23] block mb-0.5" dir="ltr">
                  SIGN OUT OTHER DEVICES
                </span>
                <span className="text-xs text-[#444655]">
                  {trText('انتخاب این گزینه شما را از سایر دستگاه‌هایی که وارد شده‌اید خارج می‌کند.', 'Enabling this option signs you out of every other device you are logged in on.', 'Bu seçenek, giriş yaptığınız diğer tüm cihazlardan çıkış yapmanızı sağlar.')}
                </span>
              </div>
            </label>

            {/* Current Session Data Component */}
            <div className="bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#545f72]">smartphone</span>
                <div className="flex flex-col">
                  <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                    CURRENT DEVICE
                  </span>
                  <span className="font-jetbrains text-xs font-bold text-[#1a1b23]">Android / Web Applet</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                  LAST ACTIVE
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-jetbrains text-xs text-[#1a1b23]">{trText('هم‌اکنون', 'Just now', 'Şu anda')}</span>
                  <span className="px-1.5 py-0.5 bg-[#00a368]/10 text-[#00a368] font-jetbrains text-[10px] rounded border border-[#00a368]/20 font-bold">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Component */}
          <div className="bg-amber-50 border-s-4 border-s-amber-500 border border-y-[#c4c5da] border-e-[#c4c5da] p-3.5 rounded-r-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
            <div>
              <p className="text-sm font-bold text-[#1a1b23]">
                {trText('رمز عبور خود را با هیچ شخصی به اشتراک نگذارید.', 'Never share your password with anyone.', 'Şifrenizi kimseyle paylaşmayın.')}
              </p>
              <p className="text-xs text-[#444655] mt-0.5">
                {trText('TLD هرگز رمز عبور شما را از طریق پیام یا تماس درخواست نمی‌کند.', 'TLD never asks for your password over message or phone call.', 'TLD şifrenizi hiçbir zaman mesaj veya telefonla istemez.')}
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`font-jetbrains text-sm font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 ${
                isFormValid && !isLoading
                  ? 'bg-[#00258e] text-white hover:bg-[#0034bf] cursor-pointer shadow-md active:scale-95'
                  : 'bg-[#00258e]/40 text-white cursor-not-allowed'
              }`}
            >
              {isLoading && (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              )}
              <span className="font-vazirmatn">{trText('تغییر رمز عبور در Supabase', 'Change Password in Supabase', 'Supabase Üzerinde Şifre Değiştir')}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
