import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { dir, trText } = useLanguage();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'apk' | 'domain' | 'ios' | 'investor' | 'export'>('android');
  const [promptCopied, setPromptCopied] = useState(false);

  const handoverPromptText = trText(
    `من پروژه سامانه ترابری هوشمند و مانیتورینگ زنجیره سرد TLD Logistics را در اختیار شما قرار داده‌ام.
اطلاعات کلیدی سیستم:
- دامنه رسمی: tldlogistics.ir
- پشته نرم‌افزاری: React 19 + TypeScript + Vite + Tailwind CSS + PWA (و دیتابیس Supabase PostgreSQL 15+)
- کارمزد مصوب سامانه: دقیقا ۵ درصد (5.0%) از کرایه حمل کسر و به خزانه‌داری متمرکز هدایت می‌شود
- دیتابیس: دارای اسکیما و RLS کامل در فایل supabase_schema.sql (شامل جداول profiles, shippers, cargos, cargo_bids, escrow_accounts, tld_boxes, tld_sensor_telemetry, platform_revenue_ledger)
- ماژول اینترنت اشیا: مانیتورینگ ۳ زون دما، وزن محورها، سنسور شوک/ضربه، پلمپ الکترونیک دیجیتال
- پنل مدیریت: Admin Dashboard جامع با دسترسی به مدیریت کاربران حقوقی، رانندگان، خزانه‌داری و حل اختلاف
لطفاً فایل‌های پیوست شده را تحلیل کن و آماده همکاری در توسعه ادامه بخش‌های پروژه باش.`,
    `I have handed over the TLD Logistics smart freight and cold-chain monitoring platform project to you.
Key system information:
- Official domain: tldlogistics.ir
- Tech stack: React 19 + TypeScript + Vite + Tailwind CSS + PWA (with a Supabase PostgreSQL 15+ database)
- Approved platform commission: exactly 5 percent (5.0%) of the freight rate is deducted and routed to the central treasury
- Database: full schema and RLS in supabase_schema.sql (including the profiles, shippers, cargos, cargo_bids, escrow_accounts, tld_boxes, tld_sensor_telemetry and platform_revenue_ledger tables)
- IoT module: 3-zone temperature monitoring, axle weights, shock/impact sensor, digital electronic seal
- Admin panel: comprehensive Admin Dashboard with access to legal-entity user management, drivers, treasury and dispute resolution
Please analyze the attached files and get ready to collaborate on developing the remaining parts of the project.`,
    `TLD Logistics akıllı yük taşımacılığı ve soğuk zincir izleme platformu projesini size devrettim.
Temel sistem bilgileri:
- Resmi alan adı: tldlogistics.ir
- Yazılım yığını: React 19 + TypeScript + Vite + Tailwind CSS + PWA (ve Supabase PostgreSQL 15+ veritabanı)
- Onaylı platform komisyonu: navlun ücretinden tam olarak yüzde 5 (5.0%) kesilir ve merkezi hazineye aktarılır
- Veritabanı: supabase_schema.sql dosyasında tam şema ve RLS (profiles, shippers, cargos, cargo_bids, escrow_accounts, tld_boxes, tld_sensor_telemetry ve platform_revenue_ledger tabloları dahil)
- IoT modülü: 3 bölgeli sıcaklık izleme, aks ağırlıkları, şok/darbe sensörü, dijital elektronik mühür
- Yönetim paneli: tüzel kişi kullanıcı yönetimi, sürücüler, hazine ve uyuşmazlık çözümüne erişimi olan kapsamlı Admin Dashboard
Lütfen ekteki dosyaları inceleyin ve projenin kalan bölümlerinin geliştirilmesinde işbirliğine hazır olun.`
  );

  if (!isOpen) return null;

  // Official custom domain & AI Studio shared preview URL
  const officialDomain = 'https://tldlogistics.ir';
  const stagingUrl = 'https://ais-pre-ufswztmu7j5uhti2vrxqqt-944579706475.europe-west2.run.app';
  
  // By default use officialDomain for display and copy, or fallback to current host
  const [selectedUrlType, setSelectedUrlType] = useState<'domain' | 'staging'>('domain');
  const activeUrl = selectedUrlType === 'domain' ? officialDomain : stagingUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeUrl)}&margin=8`;

  const handleCopy = async (textToCopy = activeUrl) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const input = document.createElement('input');
        input.value = textToCopy;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={dir}>
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c4c5da] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#00258e] to-[#1a44c2] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-white text-[24px]">install_mobile</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-vazirmatn">
                {trText('نصب اپلیکیشن روی تلفن همراه (نسخه اندروید / PWA)', 'Install App on Mobile (Android / PWA)', 'Mobil Uygulamayı Yükle')}
              </h2>
              <p className="text-xs text-white/80 font-vazirmatn">
                {trText('راهنمای نصب بدون واسطه جهت ارائه به سرمایه‌گذار و اداره مالکیت معنوی', 'Direct install guide for investors & IP office presentation')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-white"
            aria-label={trText('بستن', 'Close', 'Kapat')}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-vazirmatn text-[#1a1b23]">
          {/* Quick Install Banner (if browser triggers native prompt) */}
          {isInstallable && !isInstalled && (
            <div className="p-3.5 bg-[#eef2ff] border border-[#00258e]/20 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#00258e] text-[24px]">download</span>
                <div>
                  <div className="text-xs font-bold text-[#00258e]">
                    {trText('دستگاه شما آماده نصب فوری است', 'Your device is ready for 1-click install')}
                  </div>
                  <div className="text-[11px] text-[#444655]">
                    {trText('با یک کلیک آیکون سامانه روی گوشی یا دسکتاپ شما نصب می‌شود.', 'Click below to install immediately to your home screen.')}
                  </div>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className="bg-[#00258e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#001c70] transition shadow-sm shrink-0 cursor-pointer"
              >
                {trText('نصب فوری', 'Install Now')}
              </button>
            </div>
          )}

          {/* QR Code & Public Link Card */}
          <div className="p-4 bg-[#f8f9ff] border border-[#dde1ff] rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-[#e1e2ec] shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code for mobile installation"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                loading="eager"
              />
              <span className="block text-[10px] text-[#545f72] mt-1 font-jetbrains">
                {trText('اسکن با دوربین گوشی', 'Scan with Phone Camera')}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="text-xs font-bold text-[#00258e] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  <span>{trText('دامنه رسمی سامانه:', 'Official App Domain:')}</span>
                </div>
                <div className="flex items-center gap-1 bg-[#eeedf9] p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setSelectedUrlType('domain')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      selectedUrlType === 'domain' ? 'bg-[#00258e] text-white shadow-xs' : 'text-[#545f72]'
                    }`}
                  >
                    tldlogistics.ir
                  </button>
                  <button
                    onClick={() => setSelectedUrlType('staging')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      selectedUrlType === 'staging' ? 'bg-[#00258e] text-white shadow-xs' : 'text-[#545f72]'
                    }`}
                  >
                    {trText('پیش‌نمایش زنده', 'Live Preview', 'Canlı Önizleme')}
                  </button>
                </div>
              </div>
              
              <div className="bg-white px-3 py-2 rounded-lg border border-[#c4c5da] text-[11px] font-jetbrains text-[#1a1b23] break-all select-all flex items-center justify-between gap-2">
                <span className="truncate font-bold text-[#00258e]">{activeUrl}</span>
                <button
                  onClick={() => handleCopy(activeUrl)}
                  className="bg-[#dde1ff] text-[#00258e] px-2.5 py-1 rounded text-xs font-bold hover:bg-[#c9d0ff] transition shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? trText('کپی شد!', 'Copied!') : trText('کپی', 'Copy')}</span>
                </button>
              </div>

              <div className="text-[11px] text-[#545f72] leading-relaxed">
                {selectedUrlType === 'domain'
                  ? trText(
                      'دامنه رسمی tldlogistics.ir برای ارائه به سرمایه‌گذاران، داوران ثبت اختراع و انتشار عمومی ثبت شده است.',
                      'The official domain tldlogistics.ir is configured for investors, patent examiners, and public launch.'
                    )
                  : trText(
                      'لینک پیش‌نمایش زنده دارای گواهی SSL و سرویس‌ورکر فعال جهت نصب فوری در محیط تست است.',
                      'The live preview URL has an active SSL and Service Worker for instant testing.'
                    )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#c4c5da] text-xs font-bold gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('android')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'android'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">android</span>
              <span>{trText('نصب اندروید (WebAPK)', 'Android (WebAPK)')}</span>
            </button>

            <button
              onClick={() => setActiveTab('apk')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">deployed_code</span>
              <span>{trText('تبدیل به فایل خام APK', 'Build Raw APK')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
              <span>{trText('آیفون (iOS)', 'iPhone (iOS)')}</span>
            </button>

            <button
              onClick={() => setActiveTab('domain')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'domain'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>{trText('دامنه tldlogistics.ir', 'Domain (tldlogistics.ir)')}</span>
            </button>

            <button
              onClick={() => setActiveTab('investor')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'investor'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{trText('ارائه به سرمایه‌گذار', 'For Investors')}</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'export'
                  ? 'border-[#00258e] text-[#00258e]'
                  : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">share_windows</span>
              <span>{trText('انتقال به هوش مصنوعی (جمنای)', 'Export & Gemini')}</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'android' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-[#00258e] text-sm">
                {trText('مراحل نصب بدون واسطه در گوشی اندروید (Chrome / Samsung Internet):', 'Steps to install on Android:')}
              </div>
              <ol className="list-decimal list-inside space-y-2 text-[#2c2d38] pr-2">
                <li>
                  <strong>{trText('گام ۱:', 'Step 1:')}</strong>{' '}
                  {trText('لینک بالا را در مرورگر Google Chrome گوشی خود باز کنید یا کد QR را اسکن نمایید.', 'Open the URL in Chrome on your Android phone.')}
                </li>
                <li>
                  <strong>{trText('گام ۲:', 'Step 2:')}</strong>{' '}
                  {trText('در بالای صفحه سمت راست، روی آیکون سه‌نقطه (⋮) مرورگر کروم ضربه بزنید.', 'Tap the three-dots menu (⋮) at the top of Chrome.')}
                </li>
                <li>
                  <strong>{trText('گام ۳:', 'Step 3:')}</strong>{' '}
                  {trText('گزینه «نصب برنامه» (Install app) یا «افزودن به صفحه اصلی» (Add to Home screen) را انتخاب کنید.', 'Select "Install app" or "Add to Home screen".')}
                </li>
                <li>
                  <strong>{trText('گام ۴:', 'Step 4:')}</strong>{' '}
                  {trText('دکمه Install یا افزودن را تأیید کنید. سیستم‌عامل اندروید در عرض چند ثانیه برنامه را در لیست اپلیکیشن‌های گوشی شما ثبت می‌کند.', 'Confirm installation. Android packages it as a native standalone app.')}
                </li>
              </ol>
              <div className="bg-[#eef2ff] p-3 rounded-xl border border-[#00258e]/20 text-[11px] text-[#00258e] flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                <span>
                  {trText(
                    'ویژگی ممتاز: این برنامه پس از نصب مانند یک فایل APK نیتیو بدون نوار آدرس مرورگر اجرا می‌شود و دارای کش آفلاین و آیکون اختصاصی در صفحه اصلی گوشی شما خواهد بود.',
                    'Key feature: Once installed, it launches full-screen with no browser address bar and works offline.'
                  )}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-[#00258e] text-sm">
                {trText('روش دریافت فایل فیزیکی APK (جهت تحویل به اداره ثبت اختراع یا انتشار در بازار):', 'How to generate raw .APK file for stores/patent office:')}
              </div>
              <p className="text-[#444655]">
                {trText(
                  'این وب‌اپلیکیشن به استاندارد PWA و Trusted Web Activity (TWA) کاملاً مجهز است. برای ساخت فایل فیزیکی .apk با امضای دیجیتال برای انتشار در کافه بازار، مایکت یا گوگل‌پلی، پلتفرم رسمی مایکروسافت PWABuilder را پیشنهاد می‌کنیم:',
                  'The app meets all PWA and TWA standards. To generate a signed .apk file for Cafe Bazaar or Play Store, use Microsoft PWABuilder:'
                )}
              </p>
              
              <div className="bg-[#f4f2fe] p-3.5 rounded-xl border border-[#c4c5da] space-y-2.5">
                <div className="font-bold text-[#00258e]">
                  {trText('ساخت فایل APK با ۱ کلیک در PWABuilder:', '1-Click APK generation via PWABuilder:')}
                </div>
                <div className="text-[11px] text-[#444655] space-y-1">
                  <div>{trText('۱. روی دکمه زیر کلیک کنید تا وارد سایت رسمی pwabuilder.com شوید.', '1. Click the button below to open the official pwabuilder.com site.', "1. Resmi pwabuilder.com sitesine gitmek için aşağıdaki düğmeye tıklayın.")}</div>
                  <div>{trText('۲. لینک سامانه از قبل تنظیم شده و کافیست گزینه', '2. The app URL is pre-filled; just select', '2. Uygulama bağlantısı önceden ayarlıdır; sadece')} <strong>Package for Android</strong> {trText('را انتخاب کنید.', 'and continue.', 'seçeneğini seçin.')}</div>
                  <div>{trText('۳. فایل APK و AAB آماده برای نصب مستقیم روی هر گوشی اندروید تولید و دانلود می‌شود.', '3. An APK and AAB ready for direct installation on any Android phone is generated and downloaded.', '3. Herhangi bir Android telefona doğrudan kurulum için hazır APK ve AAB dosyası oluşturulup indirilir.')}</div>
                </div>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(activeUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#00258e] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#001c70] transition shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>{trText('ورود به ابزار ساخت APK (PWABuilder)', 'Open PWABuilder APK Generator')}</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-[#00258e] text-sm">
                {trText('مراحل نصب روی آیفون و آیپد (Apple iOS Safari):', 'Installation steps on Apple iOS Safari:')}
              </div>
              <ol className="list-decimal list-inside space-y-2 text-[#2c2d38] pr-2">
                <li>
                  {trText('لینک عمومی را حتماً در مرورگر پیش‌فرض Safari باز کنید.', 'Open the link in Safari on your iPhone.')}
                </li>
                <li>
                  {trText('در نوار پایین صفحه، روی دکمه اشتراک‌گذاری (Share - آیکون مربع با فلش رو به بالا) بزنید.', 'Tap the Share icon at the bottom of Safari.')}
                </li>
                <li>
                  {trText('صفحه را کمی به پایین اسکرول کرده و گزینه «Add to Home Screen» (افزودن به صفحه اصلی) را لمس کنید.', 'Scroll down and tap "Add to Home Screen".')}
                </li>
                <li>
                  {trText('نام برنامه را تأیید کرده و دکمه Add در بالا سمت راست را بزنید.', 'Tap "Add" in the top right corner.')}
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-[#00258e] text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>{trText('چک‌لیست راه‌اندازی واقعی سامانه با دامنه tldlogistics.ir:', 'Production Launch Checklist for tldlogistics.ir:')}</span>
              </div>

              <p className="text-[#444655]">
                {trText(
                  'ثبت دامنه tldlogistics.ir گام بسیار مهمی در هویت رسمی سامانه است. برای اینکه سامانه رسماً شروع به کار کند و رانندگان و صاحبان کالا در سراسر کشور بدون وقفه از آن استفاده کنند، ۵ نیازمندی زیر به ترتیب انجام می‌شود:',
                  'Registering tldlogistics.ir is a major milestone. To take the platform fully live for real truckers and shippers across Iran, complete these 5 steps:'
                )}
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00893f]">check_circle</span>
                    {trText('۱. اتصال دامنه tldlogistics.ir به CDN و سرور ابری', '1. DNS, CDN & Cloud Hosting Setup')}
                  </strong>
                  <span className="text-[#545f72] block leading-relaxed">
                    {trText(
                      'در سایت arvancloud.ir (ابر آروان) یا کلودفلر، دامنه tldlogistics.ir را ثبت کنید. نیم‌سرورهای (NS) داده شده را در پنل ایرنیک (nic.ir) وارد کنید. سپس رکورد CNAME را به سرور ابری متصل کرده و گواهی رایگان SSL فعال کنید تا آدرس https://tldlogistics.ir فوراً در دسترس قرار گیرد.',
                      'Register tldlogistics.ir in ArvanCloud CDN, update NS in nic.ir, configure CNAME to cloud host, and enable free SSL.'
                    )}
                  </span>
                </div>

                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00258e]">database</span>
                    {trText('۲. اتصال پایگاه داده ابری زنده (Cloud Database)', '2. Production Database Connection')}
                  </strong>
                  <span className="text-[#545f72] block leading-relaxed">
                    {trText(
                      'برای ذخیره دائم بارهای واقعی، رانندگان تاییدشده، تراکنش‌ها و موقعیت‌های GPS، پایگاه داده Supabase یا PostgreSQL اختصاصی متصل می‌شود تا اطلاعات در همه دستگاه‌ها همگام بماند.',
                      'Connect dedicated PostgreSQL or Supabase database for persistent live storage of loads, fleets, and GPS points.'
                    )}
                  </span>
                </div>

                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00258e]">sms</span>
                    {trText('۳. پنل پیامک خدماتی برای ارسال OTP ورود', '3. SMS OTP Gateway for Mobile Auth')}
                  </strong>
                  <span className="text-[#545f72] block leading-relaxed">
                    {trText(
                      'خرید یک خط خدماتی از سامانه‌های ایرانی مانند کاوه‌نگار یا فراز اس‌ام‌اس برای ارسال آنی کد تأیید ۴ رقمی به شماره همراه رانندگان (بدون فیلتر شدن در بلک‌لیست تبلیغاتی).',
                      'Integrate dedicated transactional SMS API (e.g. Kavenegar) for instantaneous 4-digit OTP login.'
                    )}
                  </span>
                </div>

                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00258e]">verified</span>
                    {trText('۴. دریافت اینماد و درگاه پرداخت بانکی شاپرک (Escrow)', '4. e-Namad & Shaparak Escrow Payment')}
                  </strong>
                  <span className="text-[#545f72] block leading-relaxed">
                    {trText(
                      'با دامنه فعال tldlogistics.ir، نماد اعتماد الکترونیکی (اینماد) ثبت شده و درگاه پرداخت شاپرک (بانک ملت/سداد یا زرین‌پال/زیبال) جهت تسویه کرایه بار و ودیعه امانی فعال می‌شود.',
                      'Acquire e-Namad with tldlogistics.ir domain and configure Shaparak payment gateway for freight escrow.'
                    )}
                  </span>
                </div>

                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#00258e]">satellite_alt</span>
                    {trText('۵. سخت‌افزار ردیاب TLD-Box یا اپلیکیشن راننده (IoT)', '5. Driver App or TLD-Box Fleet IoT')}
                  </strong>
                  <span className="text-[#545f72] block leading-relaxed">
                    {trText(
                      'رانندگان می‌توانند نسخه وب یا APK را روی گوشی خود نصب کرده و با GPS داخلی تلفن ردیابی شوند؛ همچنین کامیون‌های ثابت می‌توانند به باکس سخت‌افزاری TLD-Box با سنسور باک سوخت متصل گردند.',
                      'Drivers use the installed mobile app with native GPS, or trucks equip the dedicated TLD-Box IoT seal hardware.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investor' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-[#00258e] text-sm">
                {trText('نکات کلیدی برای ارائه به سرمایه‌گذاران و اداره اختراع و مالکیت معنوی:', 'Key points for investors and patent examiners:')}
              </div>
              <div className="space-y-2 text-[#2c2d38]">
                <div className="p-2.5 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1">
                    {trText('۱. معماری مدرن ابری و چندسکویی (Cloud-Native & PWA):', '1. Modern Cloud Architecture:')}
                  </strong>
                  <span>
                    {trText(
                      'سامانه بدون وابستگی به استورهای تحریم‌پذیر، با فناوری Progressive Web App و استانداردهای W3C طراحی شده است. این فناوری توسط گوگل و اپل به عنوان نسل آینده اپلیکیشن‌ها تایید شده است.',
                      'Built on W3C PWA standards recognized by Google and Apple for cross-platform resilient deployment.'
                    )}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1">
                    {trText('۲. تاب‌آوری در شرایط قطعی اینترنت (Offline Service Worker):', '2. Offline Resilience:')}
                  </strong>
                  <span>
                    {trText(
                      'کلیه منابع، آیکون‌ها و ساختار سامانه در حافظه گوشی کش می‌شوند و در صورت قطعی یا کندی اینترنت جاده‌ای رانندگان، برنامه باز شده و داده‌های ذخیره شده را نمایش می‌دهد.',
                      'Resources are cached locally via Service Worker so drivers can access telemetry and bills even with poor reception.'
                    )}
                  </span>
                </div>

                <div className="p-2.5 bg-[#f8f9ff] rounded-xl border border-[#dde1ff]">
                  <strong className="text-[#00258e] block mb-1">
                    {trText('۳. ارتباط Real-Time با دیتابیس و رهگیری IoT:', '3. Real-time IoT Connectivity:')}
                  </strong>
                  <span>
                    {trText(
                      'تراکنش‌ها، کیف پول، مزایده بار، تاییدیه تحویل الکترونیکی (e-POD) و سنسورهای باک سوخت به صورت زنده بین صاحبان بار و رانندگان مبادله می‌گردد.',
                      'Real-time data exchange for cargo bids, e-POD, smart backhaul, and fuel telemetry.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-3.5 bg-gradient-to-r from-[#00258e]/10 to-[#1a44c2]/10 border border-[#00258e]/30 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-bold text-[#00258e] mb-1.5">
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  <span>{trText('انتقال سورس کد و دیتابیس به جمنای یا هوش مصنوعی جدید', 'Transfer Project to Gemini or New AI')}</span>
                </div>
                <p className="text-[#444655] text-xs">
                  {trText(
                    'پکیج سورس کد و دیتابیس Supabase به صورت فایل Zip آماده شده است. می‌توانید آن را دانلود کرده و مستقیماً در جمنای (Gemini) آپلود نمایید تا ادامه پروژه را برایتان کدنویسی کند.',
                    'Source code and Supabase schema are packaged as a Zip file. You can download and upload directly to Gemini.'
                  )}
                </p>
              </div>

              {/* 1-Click Zip Download */}
              <div className="p-3.5 bg-white border border-[#c4c5da] rounded-xl shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00893f] text-[22px]">folder_zip</span>
                    <div>
                      <div className="font-bold text-[#1a1b23]">tldlogistics-export.zip</div>
                      <div className="text-[11px] text-[#545f72]">{trText('شامل تمام کدها، کامپوننت‌ها، تایپ‌ها و اسکریپت دیتابیس (۱.۴ مگابایت)', 'Includes all code, components, types and the database script (1.4 MB)', 'Tüm kodlar, bileşenler, tipler ve veritabanı betiği dahil (1,4 MB)')}</div>
                    </div>
                  </div>
                  <a
                    href="/tldlogistics-export.zip"
                    download="tldlogistics-export.zip"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00893f] text-white rounded-lg font-bold text-xs hover:bg-[#007033] transition shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>{trText('دانلود فایل Zip', 'Download Zip File', 'Zip Dosyasını İndir')}</span>
                  </a>
                </div>
              </div>

              {/* Ready Prompt for Gemini */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a1b23] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#00258e]">smart_toy</span>
                    <span>{trText('متن پرامپت آماده برای ارسال به جمنای (Handover Prompt):', 'Ready-to-send Gemini prompt (Handover Prompt):', 'Gemini için hazır istem metni (Handover Prompt):')}</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(handoverPromptText);
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 3000);
                    }}
                    className="px-2.5 py-1 bg-[#00258e] text-white rounded-md text-[11px] font-bold hover:bg-[#001c70] transition flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {promptCopied ? 'check' : 'content_copy'}
                    </span>
                    <span>{promptCopied ? trText('کپی شد!', 'Copied!', 'Kopyalandı!') : trText('کپی متن', 'Copy Text', 'Metni Kopyala')}</span>
                  </button>
                </div>
                <div className="p-3 bg-[#f8f9ff] border border-[#c4c5da] rounded-xl font-mono text-[11px] text-[#2c2d38] max-h-36 overflow-y-auto whitespace-pre-wrap leading-normal select-all">
                  {handoverPromptText}
                </div>
              </div>

              {/* 3 Step Instruction */}
              <div className="space-y-2 text-[#444655] pt-1">
                <div className="font-bold text-[#1a1b23]">{trText('سه مرحله ساده برای ادامه با جمنای:', 'Three simple steps to continue with Gemini:', 'Gemini ile devam etmek için üç basit adım:')}</div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00258e] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{trText('۱', '1', '1')}</span>
                  <span>{trText('فایل Zip بالا را دانلود کنید و در چت جمنای (دکمه سنجاق + یا Drag & Drop) بیندازید.', 'Download the Zip file above and drop it into the Gemini chat (attach button or drag & drop).', 'Yukarıdaki Zip dosyasını indirin ve Gemini sohbetine bırakın (ataç düğmesi veya sürükle-bırak).')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00258e] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{trText('۲', '2', '2')}</span>
                  <span>{trText('متن پرامپت بالا را کپی کرده و به عنوان اولین پیام ارسال کنید.', 'Copy the prompt above and send it as your first message.', 'Yukarıdaki istem metnini kopyalayın ve ilk mesaj olarak gönderin.')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00258e] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{trText('۳', '3', '3')}</span>
                  <span>{trText('سپس درخواست ویژگی‌های جدید (مثلاً نسخه فلاتر، ماژول بارنامه، یا اتصال به درگاه) را مطرح نمایید.', 'Then request new features (for example a Flutter version, a waybill module, or gateway integration).', 'Ardından yeni özellikler talep edin (örneğin Flutter sürümü, irsaliye modülü veya ödeme geçidi entegrasyonu).')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#f4f2fe] border-t border-[#c4c5da] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#545f72] font-jetbrains">
            <span className="w-2 h-2 rounded-full bg-[#00893f] inline-block animate-ping" />
            <span>PWA v2.0 • Standalone Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#00258e] text-white rounded-xl text-xs font-bold hover:bg-[#001c70] transition cursor-pointer font-vazirmatn"
          >
            {trText('متوجه شدم و بستن', 'Close', 'Kapat')}
          </button>
        </div>
      </div>
    </div>
  );
};
