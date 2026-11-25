import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { isSupabaseConfigured, getTargetSupabaseUrl } from '../services/supabaseClient';
import {
  isWebAuthnAvailable,
  getStoredCredentials,
  getPlatformSensorDescription,
  removeStoredCredential,
  BiometricCredential,
} from '../utils/webAuthn';
import { BiometricAuthModal } from '../components/auth/BiometricAuthModal';
import { InstallAppModal } from '../components/pwa/InstallAppModal';

interface SettingsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { isOffline, toggleOfflineMode, showToast, role, currentUser } = useAuth();
  const { language, t, dir, trText } = useLanguage();
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [sensorAlerts, setSensorAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(false);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Biometric Management State
  const [enrolledCreds, setEnrolledCreds] = useState<BiometricCredential[]>([]);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [modalPurpose, setModalPurpose] = useState<'SETTINGS' | 'VERIFY'>('SETTINGS');
  const [hardwareAvailable, setHardwareAvailable] = useState(true);
  const [sensorDesc, setSensorDesc] = useState(getPlatformSensorDescription());

  useEffect(() => {
    setSensorDesc(getPlatformSensorDescription());
    isWebAuthnAvailable().then(setHardwareAvailable);
    const creds = getStoredCredentials(currentUser?.mobile);
    setEnrolledCreds(creds);
    setBiometricLogin(creds.length > 0);
  }, [currentUser]);

  const handleToggleBiometric = (enabled: boolean) => {
    if (enabled) {
      setModalPurpose('SETTINGS');
      setIsBiometricModalOpen(true);
    } else {
      if (currentUser?.mobile) {
        const creds = getStoredCredentials(currentUser.mobile);
        creds.forEach((c) => removeStoredCredential(c.id));
        const remaining = getStoredCredentials(currentUser.mobile);
        setEnrolledCreds(remaining);
        setBiometricLogin(false);
        showToast('info', trText('ورود بیومتریک برای این حساب غیرفعال شد.', 'Biometric login disabled for this account.', 'Bu hesap için biyometrik giriş devre dışı bırakıldı.'));
      }
    }
  };

  const handleRemoveCred = (id: string) => {
    removeStoredCredential(id);
    const updated = getStoredCredentials(currentUser?.mobile);
    setEnrolledCreds(updated);
    setBiometricLogin(updated.length > 0);
    showToast('info', trText('کلید بیومتریک حذف گردید.', 'Biometric passkey removed.', 'Biyometrik anahtar kaldırıldı.'));
  };

  const handleClearCache = () => {
    setClearingCache(true);
    setTimeout(() => {
      setClearingCache(false);
      showToast('success', t.draftSaved);
    }, 800);
  };

  const handleSaveSettings = () => {
    showToast('success', t.draftSaved);
  };

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn antialiased selection:bg-[#0036c5] selection:text-white"
      dir={dir}
    >
      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="PROFILE" onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#fbf8ff] border-b border-[#c4c5da] w-full top-0 sticky flex justify-between items-center px-4 md:px-8 h-16 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('PROFILE')}
              className="p-2 text-[#00258e] hover:bg-[#e8e7f3] transition-colors rounded-full cursor-pointer"
              title={t.back}
            >
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-[#1a1b23]">{t.settings}</h1>
              <span className="font-jetbrains text-[11px] text-[#00258e] tracking-wider font-mono" dir="ltr">
                SETTINGS & PREFERENCES
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="bg-[#00258e] hover:bg-[#0036c5] text-white px-4 py-2 rounded-xl text-xs font-jetbrains font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span className="font-vazirmatn">{t.save}</span>
          </button>
        </header>

        {/* Database Status Banner */}
        <div className="max-w-3xl w-full mx-auto px-4 md:px-8 pt-4">
          <div className="flex items-center justify-between bg-white border border-[#c4c5da] rounded-xl px-4 py-2 text-xs font-jetbrains">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSupabaseConfigured() && !isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[#444655]">
                {isSupabaseConfigured() && !isOffline ? 'CONFIG SYNC: ONLINE (SUPABASE)' : 'CONFIG: LOCAL STORAGE'}
              </span>
            </div>
            <span className="text-[#747686] truncate max-w-[200px]" dir="ltr">
              {getTargetSupabaseUrl()}
            </span>
          </div>
        </div>

        {/* Main Form Content */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6 pb-32">
          {/* Section 1: Notifications */}
          <section className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#c4c5da] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#e8e7f3] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1b23]">{t.notificationsAndAlerts}</h2>
                <p className="text-xs text-[#747686]">
                  {trText('مدیریت دریافت پیام‌ها، اعلام بار و هشدارهای حسگرها', 'Manage cargo messages, dispatch alerts, and sensors', 'Mesaj, yük bildirimi ve sensör uyarılarını yönetin')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#e2e1ed]">
              {/* Push Notifs */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">{t.pushNotifications}</span>
                  <span className="text-xs text-[#545f72]">
                    {trText('دریافت پیام‌های بار، دیسپچ و وضعیت سفر', 'Real-time cargo notifications and status alerts', 'Kargo, dispeç ve sefer durumu bildirimleri')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>

              {/* SMS Alerts */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">{t.smsAlerts}</span>
                  <span className="text-xs text-[#545f72]">
                    {trText('ارسال پیامک برای بارهای اختصاصی و تسویه بانکی', 'SMS for high-priority loads and payout settlements', 'Özel yükler ve banka transferleri için SMS')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>

              {/* Sensor Alerts */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">{t.sensorAlerts}</span>
                  <span className="text-xs text-[#545f72]">
                    {trText('هشدار آنی در زمان تغییر دمای محفظه بار یخچالی', 'Critical refrigerated temperature breach alerts', 'Soğuk zincir sıcaklık dalgalanması uyarısı')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sensorAlerts}
                    onChange={(e) => setSensorAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">{t.sound}</span>
                  <span className="text-xs text-[#545f72]">
                    {trText('پخش صوت هشدار هنگام رسیدن بار جدید', 'Play sound chime on high match load availability', 'Yeni yük geldiğinde sesli uyarı çal')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Navigation & GPS */}
          <section className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#c4c5da] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#e8e7f3] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1b23]">{t.navigationAndNetwork}</h2>
                <p className="text-xs text-[#747686]">
                  {trText('تنظیمات موقعیت‌یابی، مصرف داده و اتصال اینترنت', 'Location positioning, offline sync, and data preferences', 'Konum, veri kullanımı ve internet ayarları')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#e2e1ed]">
              {/* High accuracy GPS */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">{t.highAccuracyGps}</span>
                  <span className="text-xs text-[#545f72]">
                    {trText('ردیابی پیوسته در طول مسیر برای محاسبه دقیق کرایه و زمان', 'Continuous route pinging for live ETA calculation', 'Kira ve süre hesabı için kesintisiz rota takibi')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highAccuracyGps}
                    onChange={(e) => setHighAccuracyGps(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>

              {/* Offline Mode Toggle */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">
                    {trText('شبیه‌ساز حالت آفلاین', 'Offline Storage Mode', 'Çevrimdışı Depolama Modu')}
                  </span>
                  <span className="text-xs text-[#545f72]">
                    {trText('ذخیره داده‌ها در حافظه محلی در نقاط فاقد پوشش آنتن جاده‌ای', 'Local storage caching when cellular signal is unavailable', 'Kapsama alanı dışındayken yerel depolama')}
                  </span>
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
          </section>

          {/* Section 3: Biometric Security & WebAuthn (FIDO2) */}
          <section className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4c5da] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e8e7f3] text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1a1b23]">
                    {trText('امنیت بیومتریک و حسگر اثر انگشت / Face ID', 'Biometric Security & Passkeys (WebAuthn)', 'Biyometrik Güvenlik ve Parmak İzi / Face ID Sensörü')}
                  </h2>
                  <p className="text-xs text-[#747686]">
                    {role === 'SHIPPER'
                      ? trText(
                          'ورود امن بدون نیاز به پیامک، تایید پرداخت‌های اسکرو و امضای دیجیتال قراردادهای بار',
                          'Passwordless login, escrow authorization, and secure cargo dispatch for shippers',
                          'SMS gerekmeden güvenli giriş, emanet ödeme onayı ve yük sözleşmelerinin dijital imzası'
                        )
                      : trText(
                          'ورود سریع با اثر انگشت یا چهره، تایید بارنامه دولتی و ترخیص محموله در پایانه‌ها',
                          'Fast fingerprint login, waybill digital signing, and terminal gate pass for drivers',
                          'Parmak izi veya yüzle hızlı giriş, resmi irsaliye onayı ve terminallerde yük geçişi'
                        )}
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  hardwareAvailable
                    ? 'bg-[#e6f4ea] text-[#137333] border-[#a8dab5]'
                    : 'bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {hardwareAvailable ? 'verified' : 'info'}
                </span>
                <span>{hardwareAvailable ? trText('حسگر آماده', 'Sensor Ready', 'Sensör Hazır') : trText('FIDO2 فعال', 'FIDO2 Active', 'FIDO2 Etkin')}</span>
              </span>
            </div>

            <div className="divide-y divide-[#e2e1ed]">
              {/* Toggle Biometric Login */}
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1a1b23]">
                    {trText('ورود با اثر انگشت یا چهره به جای رمز عبور', 'Biometric Passwordless Login', 'Şifre Yerine Parmak İzi veya Yüz ile Giriş')}
                  </span>
                  <span className="text-xs text-[#545f72]">
                    {trText(
                      'ورود آنی بدون معطلی کد پیامک از طریق ماژول امنیتی دستگاه همراه',
                      'Instant device-level cryptographic authentication without SMS delays',
                      'SMS kodu beklemeden cihazın güvenlik modülüyle anında giriş'
                    )}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biometricLogin}
                    onChange={(e) => handleToggleBiometric(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#c4c5da] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c4c5da] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00258e]"></div>
                </label>
              </div>

              {/* Hardware Sensor Detected */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#00258e]">
                    {sensorDesc.type === 'FACE_ID' ? 'face' : 'fingerprint'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#1a1b23] block">
                      {trText('سنسور شناسایی‌شده روی این دستگاه:', 'Detected Hardware Sensor:', 'Bu cihazda algılanan sensör:')}
                    </span>
                    <span className="text-xs text-[#545f72] font-semibold">{sensorDesc.label}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalPurpose('VERIFY');
                    setIsBiometricModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#f4f2fe] hover:bg-[#eeedf9] text-[#00258e] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#00258e]/20"
                >
                  {trText('تست عملکرد حسگر', 'Test Sensor', 'Sensörü Test Et')}
                </button>
              </div>

              {/* Enrolled Keys Section */}
              <div className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1a1b23]">
                    {trText('کلیدهای امنیتی متصل به این حساب:', 'Enrolled Passkeys for this Account:', 'Bu Hesaba Bağlı Güvenlik Anahtarları:')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalPurpose('SETTINGS');
                      setIsBiometricModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#00258e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>{trText('افزودن حسگر جدید', 'Enroll New', 'Yeni Sensör Ekle')}</span>
                  </button>
                </div>

                {enrolledCreds.length === 0 ? (
                  <div className="p-3 bg-[#f8f9fe] rounded-xl border border-dashed border-[#c4c5da] text-xs text-[#747686] text-center">
                    {trText(
                      'هنوز هیچ اثر انگشت یا کلید بیومتریکی برای این حساب ثبت نشده است. با زدن دکمه زیر می‌توانید حسگر دستگاه را فعال کنید.',
                      'No biometric passkey registered yet. Tap below to activate device biometrics.',
                      'Bu hesap için henüz biyometrik anahtar kaydedilmedi. Cihaz sensörünü etkinleştirmek için aşağıdaki düğmeye dokunun.'
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {enrolledCreds.map((cred) => (
                      <div
                        key={cred.id}
                        className="flex items-center justify-between p-2.5 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[#00a368] text-[20px]">
                            {cred.deviceLabel.includes('Face') ? 'face' : 'fingerprint'}
                          </span>
                          <div>
                            <div className="font-bold text-[#1a1b23] flex items-center gap-1.5">
                              <span>{cred.deviceLabel}</span>
                              <span className="bg-[#eeedf9] text-[#00258e] text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                                {cred.userRole === 'SHIPPER' ? trText('صاحب بار', 'Shipper', 'Yük Sahibi') : trText('راننده', 'Driver', 'Sürücü')}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#747686] font-jetbrains" dir="ltr">
                              ID: {cred.id.slice(0, 18)}... | {new Date(cred.createdAt).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCred(cred.id)}
                          className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-lg transition-colors cursor-pointer"
                          title={trText('حذف کلید', 'Delete', 'Anahtarı Sil')}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 4: Security, Language & Cache */}
          <section className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#c4c5da] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#e8e7f3] text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">security</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1b23]">{t.securityAndData}</h2>
                <p className="text-xs text-[#747686]">
                  {trText('مدیریت رمز عبور، زبان و پاکسازی حافظه موقت', 'Password management, language selection, and cache purge', 'Şifre, dil ve önbellek yönetimi')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#e2e1ed]">
              {/* Language */}
              <div
                onClick={() => onNavigate('LANGUAGE')}
                className="flex items-center justify-between py-3 hover:bg-[#fbf8ff] transition-colors rounded-xl px-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00258e]">language</span>
                  <div>
                    <span className="text-sm font-semibold text-[#1a1b23] block">{t.systemLanguage}</span>
                    <span className="text-xs text-[#747686] font-jetbrains">
                      {language === 'fa' ? 'فارسی (Persian)' : language === 'en' ? 'English (US)' : 'Türkçe (TR)'}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
              </div>

              {/* Password */}
              <div
                onClick={() => onNavigate('CHANGE_PASSWORD')}
                className="flex items-center justify-between py-3 hover:bg-[#fbf8ff] transition-colors rounded-xl px-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00258e]">lock_reset</span>
                  <div>
                    <span className="text-sm font-semibold text-[#1a1b23] block">{t.changePassword}</span>
                    <span className="text-xs text-[#747686]">
                      {trText('بروزرسانی گذرواژه و خروج از سایر دستگاه‌ها', 'Update password & revoke active sessions', 'Şifre güncelleme ve diğer oturumları kapatma')}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#747686] rtl:rotate-180">chevron_left</span>
              </div>

              {/* Clear Cache */}
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a]">delete_sweep</span>
                  <div>
                    <span className="text-sm font-semibold text-[#1a1b23] block">{t.clearCache}</span>
                    <span className="text-xs text-[#747686]">
                      {trText('حذف فایل‌های موقت بدون پاک شدن سوابق سفرها', 'Purge cached media and temporary logs safely', 'Sefer geçmişini silmeden geçici dosyaları temizle')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="px-3 py-1.5 bg-[#f4f2fe] hover:bg-[#eeedf9] text-[#00258e] rounded-xl text-xs font-jetbrains font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {clearingCache ? '...' : t.clearCache}
                </button>
              </div>
            </div>
          </section>

          {/* Quick Access Pages */}
          <section className="bg-[#f4f2fe] rounded-2xl border border-[#c4c5da] p-4 space-y-2">
            <span className="font-jetbrains text-[11px] text-[#747686] uppercase tracking-wider block mb-1">
              {t.quickAccess}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onNavigate('TRANSACTIONS')}
                className="bg-white p-3 rounded-xl border border-[#c4c5da] hover:border-[#00258e] text-xs font-bold text-[#1a1b23] flex items-center gap-2 cursor-pointer transition-colors text-start"
              >
                <span className="material-symbols-outlined text-[#00258e] text-[18px]">receipt_long</span>
                <span>{t.transactions}</span>
              </button>

              <button
                onClick={() => setShowInstallModal(true)}
                className="bg-[#eef2ff] p-3 rounded-xl border border-[#00258e]/30 hover:border-[#00258e] text-xs font-bold text-[#00258e] flex items-center gap-2 cursor-pointer transition-colors text-start col-span-2 sm:col-span-3"
              >
                <span className="material-symbols-outlined text-[#00258e] text-[18px]">install_mobile</span>
                <span>{trText('نصب اپلیکیشن روی تلفن همراه (نسخه اندروید APK / PWA)', 'Install App on Mobile (Android APK / PWA)', 'Mobil Uygulamayı Yükle (Android APK / PWA)')}</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="PROFILE" onNavigate={onNavigate} />

      {/* WebAuthn Biometric Security Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => {
          setIsBiometricModalOpen(false);
          const creds = getStoredCredentials(currentUser?.mobile);
          setEnrolledCreds(creds);
          setBiometricLogin(creds.length > 0);
        }}
        onSuccess={() => {
          const creds = getStoredCredentials(currentUser?.mobile);
          setEnrolledCreds(creds);
          setBiometricLogin(true);
        }}
        userMobile={currentUser?.mobile}
        userName={currentUser?.profile?.fullName}
        userRole={role || 'DRIVER'}
        purpose={modalPurpose}
      />

      {/* Mobile App Install & APK Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
