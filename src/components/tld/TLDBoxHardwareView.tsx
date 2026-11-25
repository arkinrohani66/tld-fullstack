import React, { useState } from 'react';
import { TLDBoxDeviceInfo, TLDSensorMetrics } from '../../types';
import { tldTrackingService } from '../../services/tldTrackingService';
import { useLanguage } from '../../context/LanguageContext';

interface TLDBoxHardwareViewProps {
  boxInfo: TLDBoxDeviceInfo;
  metrics: TLDSensorMetrics;
  onRefresh: () => void;
}

export const TLDBoxHardwareView: React.FC<TLDBoxHardwareViewProps> = ({
  boxInfo,
  metrics,
  onRefresh,
}) => {
  const { trText } = useLanguage();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = tldTrackingService.remoteUnlockSmartSeal(unlockCode);
    if (result.success) {
      setModalMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setShowUnlockModal(false);
        setModalMessage(null);
        setUnlockCode('');
        onRefresh();
      }, 1500);
    } else {
      setModalMessage({ type: 'error', text: result.message });
    }
  };

  const handleRemoteLock = () => {
    const result = tldTrackingService.remoteLockSmartSeal();
    setModalMessage({ type: result.success ? 'success' : 'error', text: result.message });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Device Overview Hero Banner */}
      <div className="bg-gradient-to-l from-[#00258e] to-[#00175a] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        {/* Background circuit motif */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a368] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{trText('سخت‌افزار آنلاین و متصل', 'Hardware online & connected', 'Donanım çevrimiçi ve bağlı')}</span>
              </span>
              <span className="bg-white/10 text-white/90 text-[10px] font-jetbrains px-2 py-0.5 rounded">
                {trText(`استاندارد ${boxInfo.ipRating}`, `IP rating ${boxInfo.ipRating}`, `IP sınıfı ${boxInfo.ipRating}`)}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black">{boxInfo.model}</h2>
            <p className="text-xs text-white/80 max-w-xl leading-relaxed">
              {trText('هاب پایش و کنترل مرکزی مجهز به پردازشگر Dual-Core، مودم کوانتومی 5G/Satellite، سنسورهای ۶ محوره ژیروسکوپ و پلمپ الکترومکانیکی ضدسرقت.', 'Central monitoring & control hub with a Dual-Core processor, 5G/Satellite quantum modem, 6-axis gyroscope sensors and an anti-theft electromechanical seal.', 'Dual-Core işlemci, 5G/Uydu kuantum modem, 6 eksenli jiroskop sensörleri ve hırsızlık önleyici elektromekanik mühür ile merkezi izleme ve kontrol merkezi.')}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-1 text-xs shrink-0 font-jetbrains">
            <div className="flex justify-between gap-4">
              <span className="text-white/70">{trText('شماره سریال:', 'Serial number:', 'Seri numarası:')}</span>
              <span className="font-bold text-white">{boxInfo.boxSerialNumber}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/70">{trText('شناسه IMEI:', 'IMEI:', 'IMEI:')}</span>
              <span className="font-bold text-white">{boxInfo.imeiNumber}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/70">{trText('نسخه فریم‌ور:', 'Firmware version:', 'Yazılım sürümü:')}</span>
              <span className="font-bold text-[#00a368]">{boxInfo.firmwareVersion}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/70">{trText('زمان فعالیت (Uptime):', 'Uptime:', 'Çalışma süresi (Uptime):')}</span>
              <span className="font-bold text-white">{trText(`${boxInfo.uptimeHours} ساعت متوالی`, `${boxInfo.uptimeHours} consecutive hours`, `${boxInfo.uptimeHours} saat kesintisiz`)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Subsystems (Connectivity, Power, Smart Lock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Connectivity Subsystem */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e]">cell_tower</span>
              <span>{trText('سیستم ارتباطی و لینک ماهواره‌ای', 'Connectivity & Satellite Link', 'İletişim Sistemi ve Uydu Bağlantısı')}</span>
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a368] animate-ping" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#747686] block">{trText('سیم‌کارت اول (Primary LTE-M):', 'Primary SIM (LTE-M):', 'Birincil SIM (LTE-M):')}</span>
                <span className="font-bold text-[#1a1b23]">{boxInfo.primarySimCarrier}</span>
              </div>
              <span className="bg-[#00a368]/15 text-[#00a368] font-bold text-[10px] px-2 py-0.5 rounded">
                {trText('سیگنال عالی (-68 dBm)', 'Excellent signal (-68 dBm)', 'Mükemmel sinyal (-68 dBm)')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#747686] block">{trText('پشتیبان اضطراری ماهواره:', 'Satellite emergency backup:', 'Uydu acil yedek:')}</span>
                <span className="font-bold text-[#1a1b23]">{trText('لینک ایریدیوم (Iridium SBD)', 'Iridium link (Iridium SBD)', 'Iridium bağlantısı (Iridium SBD)')}</span>
              </div>
              <span className="bg-[#00258e]/15 text-[#00258e] font-bold text-[10px] px-2 py-0.5 rounded font-jetbrains">
                ONLINE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#eeedf9] flex items-center justify-between text-[11px]">
              <span>{trText('حافظه بافر آفلاین (Black Box):', 'Offline buffer storage (Black Box):', 'Çevrimdışı tampon bellek (Kara Kutu):')}</span>
              <span className="font-jetbrains font-bold text-[#00258e]">
                {trText(`${boxInfo.internalStorageRemainingMb} MB آزاد (ذخیره ۳۰ روز لاگ)`, `${boxInfo.internalStorageRemainingMb} MB free (30 days of logs)`, `${boxInfo.internalStorageRemainingMb} MB boş (30 günlük kayıt)`)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Power & Battery Subsystem */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00a368]">battery_charging_full</span>
              <span>{trText('سیستم تغذیه، باتری و پنل خورشیدی', 'Power, Battery & Solar Panel', 'Güç, Batarya ve Güneş Paneli')}</span>
            </h3>
            <span className="text-xs font-bold text-[#00a368]">{trText('شارژ پایدار', 'Stable charging', 'Kararlı şarj')}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#545f72]">{trText('باتری داخلی LiFePO4:', 'Internal LiFePO4 battery:', 'Dahili LiFePO4 batarya:')}</span>
                <span className="font-jetbrains font-bold text-lg text-[#00a368]">
                  %{boxInfo.batteryLevelPercent} ({boxInfo.batteryCapacityMah} mAh)
                </span>
              </div>
              {/* Battery bar */}
              <div className="w-full bg-[#eeedf9] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#00a368] h-full transition-all duration-500"
                  style={{ width: `${boxInfo.batteryLevelPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#747686] block">{trText('پنل خورشیدی سقفی (Solar):', 'Roof solar panel (Solar):', 'Çatı güneş paneli (Solar):')}</span>
                <span className="font-bold text-[#1a1b23]">{trText('شارژ تریکل خورشیدی فعال', 'Solar trickle charging active', 'Güneş enerjili damla şarj aktif')}</span>
              </div>
              <span className="font-jetbrains font-bold text-[#00a368] text-xs">
                +{boxInfo.solarInputWatts}W
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#eeedf9] flex items-center justify-between text-[11px]">
              <span>{trText('برق دینام خودرو:', 'Vehicle alternator power:', 'Araç alternatör gücü:')}</span>
              <span className="font-jetbrains font-bold text-[#1a1b23]">{boxInfo.externalPowerVoltage}V DC</span>
            </div>
          </div>
        </div>

        {/* 3. Smart Electronic E-Lock / E-Seal Controller */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e]">lock</span>
              <span>{trText('پلمپ دیجیتال هوشمند (E-Lock)', 'Smart Digital Seal (E-Lock)', 'Akıllı Dijital Mühür (E-Lock)')}</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.eLockStatus === 'LOCKED_SEALED'
                  ? 'bg-[#00a368]/15 text-[#00a368]'
                  : metrics.eLockStatus === 'AUTHORIZED_UNLOCKED'
                  ? 'bg-[#00258e]/15 text-[#00258e]'
                  : 'bg-[#ba1a1a] text-white animate-pulse'
              }`}
            >
              {metrics.eLockStatus === 'LOCKED_SEALED'
                ? trText('قفل و پلمپ فعال', 'Lock & seal active', 'Kilit ve mühür aktif')
                : metrics.eLockStatus === 'AUTHORIZED_UNLOCKED'
                ? trText('بازگشایی مجاز', 'Authorized unlock', 'Yetkili açma')
                : trText('هشدار شکست پلمپ!', 'Seal breach alert!', 'Mühür kırılma uyarısı!')}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#747686]">{trText('کد رهگیری پلمپ راهداری:', 'RMTO seal tracking code:', 'Karayolları mühür takip kodu:')}</span>
                <span className="font-jetbrains font-bold text-[#00258e]">SEAL-8924-TLD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747686]">{trText('سنسور تمپر بدنه (Anti-Tamper):', 'Body tamper sensor (Anti-Tamper):', 'Gövde müdahale sensörü (Anti-Tamper):')}</span>
                <span className="font-bold text-[#00a368]">
                  {boxInfo.tamperSwitchTriggered ? trText('⚠️ دستکاری بدنه ثبت شد', '⚠️ Body tampering recorded', '⚠️ Gövde müdahalesi kaydedildi') : trText('سالم و بدون دستکاری', 'Intact, no tampering', 'Sağlam, müdahale yok')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747686]">{trText('وضعیت درب کانتینر:', 'Container door status:', 'Konteyner kapı durumu:')}</span>
                <span className="font-bold text-[#1a1b23]">
                  {metrics.doorOpenSensor === 'DOOR_CLOSED' ? trText('بسته و درزبندی کامل', 'Closed & fully sealed', 'Kapalı ve tam sızdırmaz') : trText('درب باز است', 'Door is open', 'Kapı açık')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {metrics.eLockStatus === 'LOCKED_SEALED' ? (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="flex-1 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  <span>{trText('بازگشایی امن پلمپ (2FA)', 'Secure seal unlock (2FA)', 'Güvenli mühür açma (2FA)')}</span>
                </button>
              ) : (
                <button
                  onClick={handleRemoteLock}
                  className="flex-1 py-2.5 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>{trText('قفل و پلمپ مجدد محفظه', 'Re-lock & re-seal compartment', 'Bölmeyi yeniden kilitle ve mühürle')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Unseal Modal Dialog */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#c4c5da] shadow-2xl space-y-4 font-vazirmatn text-[#1a1b23]">
            <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                </div>
                <h3 className="font-black text-base text-[#1a1b23]">{trText('احراز هویت و بازگشایی پلمپ TLD', 'Authentication & TLD Seal Unlock', 'Kimlik Doğrulama ve TLD Mühür Açma')}</h3>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#545f72] leading-relaxed">
              {trText('جهت بازگشایی الکترومکانیکی پلمپ کانتینر در مقصد یا ایست بازرسی، لطفاً کد تایید ۴ رقمی ارسال شده به صاحب بار را وارد فرمایید (کد آزمایشی:', 'To electromechanically unlock the container seal at the destination or inspection station, please enter the 4-digit verification code sent to the shipper (demo code:', 'Konteyner mührünü varış noktasında veya denetim istasyonunda elektromekanik olarak açmak için lütfen yük sahibine gönderilen 4 haneli doğrulama kodunu girin (demo kod:')} <strong className="font-jetbrains text-[#00258e]">7492</strong>):
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1a1b23] block mb-1">{trText('کد یکبارمصرف امنیتی (OTP):', 'One-time security code (OTP):', 'Tek kullanımlık güvenlik kodu (OTP):')}</label>
                <input
                  type="text"
                  maxLength={6}
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  placeholder={trText('مثال: 7492', 'e.g. 7492', 'Örnek: 7492')}
                  className="w-full px-4 py-3 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] text-center font-jetbrains text-xl font-bold tracking-widest focus:outline-none focus:border-[#00258e]"
                  autoFocus
                />
              </div>

              {modalMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    modalMessage.type === 'success' ? 'bg-[#00a368]/15 text-[#00a368]' : 'bg-[#ba1a1a]/15 text-[#ba1a1a]'
                  }`}
                >
                  {trText(modalMessage.text)}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#c4c5da] text-[#545f72] text-xs font-bold hover:bg-[#eeedf9] cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'İptal')}
                </button>
                <button
                  type="submit"
                  disabled={!unlockCode}
                  className="flex-1 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {trText('ارسال دستور بازگشایی', 'Send Unlock Command', 'Açma Komutu Gönder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
