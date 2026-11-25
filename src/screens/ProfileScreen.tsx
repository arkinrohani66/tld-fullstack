import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { BiometricAuthModal } from '../components/auth/BiometricAuthModal';
import { InstallAppModal } from '../components/pwa/InstallAppModal';
import { getStoredCredentials } from '../utils/webAuthn';

interface ProfileScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const {
    currentUser,
    role,
    verificationStatus,
    logout,
    toggleOfflineMode,
    isOffline,
  } = useAuth();
  const { t, language, setLanguage, trText, dir } = useLanguage();

  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [hasBiometricKey, setHasBiometricKey] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const creds = getStoredCredentials(currentUser?.mobile);
    setHasBiometricKey(creds.length > 0);
  }, [currentUser, isBiometricModalOpen]);

  const fullName = currentUser?.profile?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : (currentUser?.mobile || (role === 'SHIPPER' ? trText('صاحب‌بار', 'Shipper', 'Yük Sahibi') : trText('راننده گرامی', 'Driver', 'Değerli Sürücü'))));
  const mobile = currentUser?.mobile || trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil');
  const nationalId = currentUser?.profile?.nationalId || trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil');
  const requestId = currentUser?.requestId || 'TLD-REQ';

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      {/* Top App Bar */}
      <AppHeader
        currentScreen="PROFILE"
        title={trText('پروفایل کاربری', 'User Profile', 'Kullanıcı Profili')}
        subtitle="User Account & Fleet ID"
        showBack={true}
        onBack={() => onNavigate(homeScreen)}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="PROFILE" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* User Card */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={
              currentUser?.profile?.profileImage ||
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBbl0GTRHoGPo5u0VkyWwX6A7YntbXcfZWFIa3aaG-kCSyj3IIsLzuJ6Nb19KWLXAmXtRgTgqKJH-z3w3KuvtzH6TcAuwNjU6x4K-DnN28jNbULuJxO2B1XmcUoE0Djs7FhCci_sFEKxkD1_Ig4mvx4Az9poJCZ1d1yDFMHBB1I_oQ-lxRKMN2RWLt_wkH1ZI_X5c-eY7WcWZhtNzHqsHgh8Lc794HahCPmUgbK3G4irpMIM_f8C71f'
            }
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover border-2 border-[#00258e] shadow-sm shrink-0"
          />

          <div className="flex-1 text-center sm:text-start">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-[#1a1b23]">{fullName}</h1>
                <p className="font-jetbrains text-xs text-[#545f72] mt-0.5" dir="ltr">
                  MOBILE: {mobile} | REQ: {requestId}
                </p>
              </div>

              <span className="bg-[#00a368]/10 text-[#00a368] border border-[#00a368]/30 px-3 py-1 rounded-xl text-xs font-jetbrains font-bold w-fit mx-auto sm:mx-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{verificationStatus}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <span className="bg-[#eeedf9] text-[#00258e] px-3 py-1 rounded-lg text-xs font-jetbrains font-bold">
                {trText('نقش', 'Role', 'Rol')}: {role === 'SHIPPER' ? trText('صاحب بار تجاری (SHIPPER)', 'Commercial Shipper (SHIPPER)', 'Ticari Yük Sahibi (SHIPPER)') : trText('راننده ناوگان سنگین (DRIVER)', 'Heavy Fleet Driver (DRIVER)', 'Ağır Filo Sürücüsü (DRIVER)')}
              </span>
              <span className="bg-[#f4f2fe] text-[#545f72] px-3 py-1 rounded-lg text-xs font-jetbrains" dir="ltr">
                NID: {nationalId}
              </span>
            </div>
          </div>
        </div>

        {/* Group 1: اطلاعات هویتی و امنیتی */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-2 shadow-sm divide-y divide-[#e2e1ed]">
          <div className="px-4 py-2 text-[11px] font-jetbrains font-bold text-[#747686] uppercase tracking-wider">
            IDENTITY & SECURITY
          </div>

          <button
            onClick={() => onNavigate('EDIT_PROFILE')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('ویرایش پروفایل (Edit Profile)', 'Edit Profile', 'Profili Düzenle')}</div>
                <div className="text-xs text-[#545f72]">{trText('تغییر تصویر، مشخصات فردی، کدملی، آدرس و شناسه سازمانی', 'Change your photo, personal details, national ID, address and organization ID', 'Fotoğraf, kişisel bilgiler, kimlik numarası, adres ve kurum kimliğini değiştirin')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('CHANGE_PASSWORD')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('تغییر رمز عبور (Change Password)', 'Change Password', 'Şifre Değiştir')}</div>
                <div className="text-xs text-[#545f72]">{trText('تغییر رمز عبور و مدیریت نشست‌های فعال سایر دستگاه‌ها', 'Change your password and manage active sessions on other devices', 'Şifrenizi değiştirin ve diğer cihazlardaki aktif oturumları yönetin')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          {/* Biometric Security Row */}
          <button
            onClick={() => setIsBiometricModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              </div>
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#1a1b23]">
                    {trText('امنیت بیومتریک و کلیدهای FIDO2', 'Biometric Security & Passkeys', 'Biyometrik Güvenlik ve FIDO2 Anahtarları')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasBiometricKey
                        ? 'bg-[#e6f4ea] text-[#137333] border-[#a8dab5]'
                        : 'bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]'
                    }`}
                  >
                    {hasBiometricKey ? trText('فعال روی این دستگاه', 'Enrolled', 'Bu cihazda etkin') : trText('آماده فعال‌سازی', 'Setup', 'Kuruluma hazır')}
                  </span>
                </div>
                <div className="text-xs text-[#545f72]">
                  {role === 'SHIPPER'
                    ? trText('ورود بدون رمز، تایید پرداخت اسکرو و امضای قرارداد با اثر انگشت یا Face ID', 'Passwordless login, escrow payment approval and contract signing with fingerprint or Face ID', 'Parmak izi veya Face ID ile şifresiz giriş, emanet ödeme onayı ve sözleşme imzalama')
                    : trText('ورود بدون رمز، تایید بارنامه دولتی و ترخیص پایانه با اثر انگشت یا چهره', 'Passwordless login, official waybill approval and terminal gate pass with fingerprint or face', 'Parmak izi veya yüz ile şifresiz giriş, resmi irsaliye onayı ve terminal geçişi')}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('VERIFICATION_STATUS')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('وضعیت مدارک و احراز هویت', 'Documents & Verification Status', 'Belge ve Kimlik Doğrulama Durumu')}</div>
                <div className="text-xs text-[#545f72]">{trText('مشاهده مراحل تایید هویت و مدارک بارگذاری شده', 'View identity verification steps and uploaded documents', 'Kimlik doğrulama adımlarını ve yüklenen belgeleri görüntüleyin')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>
        </div>

        {/* Group 2: ارتباطات و مالی */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-2 shadow-sm divide-y divide-[#e2e1ed]">
          <div className="px-4 py-2 text-[11px] font-jetbrains font-bold text-[#747686] uppercase tracking-wider">
            COMMUNICATION & FINANCIALS
          </div>

          <button
            onClick={() => onNavigate('MESSAGES')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">forum</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('پیام‌ها و دیسپچ ناوگان (Messages & Chat)', 'Messages & Fleet Dispatch', 'Mesajlar ve Filo Sevk')}</div>
                <div className="text-xs text-[#545f72]">{trText('گفتگوی زنده با رانندگان، صاحبان بار و مرکز دیسپچ', 'Live chat with drivers, shippers and the dispatch center', 'Sürücüler, yük sahipleri ve sevk merkeziyle canlı sohbet')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('WALLET')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('کیف پول (Wallet)', 'Wallet', 'Cüzdan')}</div>
                <div className="text-xs text-[#545f72]">{trText('موجودی، افزایش اعتبار، تسویه حساب و پرداخت عوارض', 'Balance, top-up, settlements and toll payments', 'Bakiye, yükleme, hesaplaşma ve geçiş ücreti ödemeleri')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('TRANSACTIONS')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('تراکنش‌ها (Transactions Ledger)', 'Transactions Ledger', 'İşlem Defteri')}</div>
                <div className="text-xs text-[#545f72]">{trText('صورت‌حساب مالی، کد پیگیری شتاب و خروجی گزارش', 'Financial statements, Shetab tracking codes and report exports', 'Mali ekstre, Şetab takip kodu ve rapor dışa aktarma')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>
        </div>

        {/* Group 3: تنظیمات و سفارشی‌سازی */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-2 shadow-sm divide-y divide-[#e2e1ed]">
          <div className="px-4 py-2 text-[11px] font-jetbrains font-bold text-[#747686] uppercase tracking-wider">
            SYSTEM & SETTINGS
          </div>

          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full flex items-center justify-between p-4 bg-[#eef2ff]/80 hover:bg-[#dde1ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00258e] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">install_mobile</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#00258e]">
                  {trText('نصب اپلیکیشن روی تلفن همراه (نسخه اندروید APK / PWA)', 'Install App on Mobile (Android APK / PWA)', 'Mobil Uygulamayı Yükle (Android APK / PWA)')}
                </div>
                <div className="text-xs text-[#545f72]">
                  {trText('راهنمای نصب آسان، لینک عمومی و راهنمای ارائه به سرمایه‌گذار', 'Easy install, public URL & presentation guide', 'Kolay kurulum, genel bağlantı ve sunum kılavuzu')}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#00258e] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('SETTINGS')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('تنظیمات (Settings)', 'Settings', 'Ayarlar')}</div>
                <div className="text-xs text-[#545f72]">{trText('اعلانات، سنسورهای محفظه بار، GPS و پاکسازی کش', 'Notifications, cargo box sensors, GPS and cache cleanup', 'Bildirimler, kargo bölmesi sensörleri, GPS ve önbellek temizliği')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('ROLE_SELECTION')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('تغییر نقش کاربری', 'Switch User Role', 'Kullanıcı Rolünü Değiştir')}</div>
                <div className="text-xs text-[#545f72]">{trText('جابجایی بین نقش راننده و صاحب بار', 'Switch between driver and shipper roles', 'Sürücü ve yük sahibi rolleri arasında geçiş yapın')}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <button
            onClick={() => onNavigate('LANGUAGE')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#fbf8ff] transition-colors rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('زبان سامانه (Language)', 'System Language', 'Sistem Dili')}</div>
                <div className="text-xs text-[#545f72] font-jetbrains">
                  {language === 'fa' ? 'فارسی (FA)' : language === 'en' ? 'English (EN)' : 'Türkçe (TR)'}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
          </button>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f4f2fe] text-[#545f72] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">cloud_off</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-sm text-[#1a1b23]">{trText('شبیه‌ساز حالت آفلاین', 'Offline Mode Simulator', 'Çevrimdışı Mod Simülatörü')}</div>
                <div className="text-xs text-[#545f72]">{trText('تست واکنش سامانه در زمان قطع اتصال ماهواره‌ای یا اینترنت', 'Test how the system behaves when satellite or internet connectivity drops', 'Uydu veya internet bağlantısı kesildiğinde sistemin tepkisini test edin')}</div>
              </div>
            </div>
            <button
              onClick={toggleOfflineMode}
              className={`px-3 py-1.5 rounded-xl font-jetbrains text-xs font-bold transition-all cursor-pointer ${
                isOffline
                  ? 'bg-[#ba1a1a] text-white'
                  : 'bg-[#e2e1ed] text-[#444655] hover:bg-[#c4c5da]'
              }`}
            >
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-2xl transition-colors font-jetbrains text-sm font-bold cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-vazirmatn">{trText('خروج از حساب کاربری (Logout)', 'Sign Out', 'Hesaptan Çıkış')}</span>
          </button>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="PROFILE" onNavigate={onNavigate} />

      {/* WebAuthn Biometric Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => {
          setIsBiometricModalOpen(false);
          const creds = getStoredCredentials(currentUser?.mobile);
          setHasBiometricKey(creds.length > 0);
        }}
        onSuccess={() => {
          const creds = getStoredCredentials(currentUser?.mobile);
          setHasBiometricKey(creds.length > 0);
        }}
        userMobile={currentUser?.mobile}
        userName={fullName}
        userRole={role || 'DRIVER'}
        purpose="SETTINGS"
      />

      {/* Mobile App Install & APK Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
