import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';

interface RMTOWaybillScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const RMTOWaybillScreen: React.FC<RMTOWaybillScreenProps> = ({ onNavigate }) => {
  const { showToast, currentUser } = useAuth();
  const { dir, trText } = useLanguage();

  const [inquiryType, setInquiryType] = useState<'WAYBILL' | 'DRIVER_CARD' | 'TRUCK_CARD'>('WAYBILL');
  const [inquiryCode, setInquiryCode] = useState('');
  const [nationalCode, setNationalCode] = useState(currentUser?.profile?.nationalId || '');
  const [isInquiring, setIsInquiring] = useState(false);
  const [hasInquiryResult, setHasInquiryResult] = useState(false);

  const handleRunInquiry = () => {
    if (!inquiryCode.trim()) {
      showToast('error', trText('لطفاً کد رهگیری بارنامه یا شماره کارت هوشمند را وارد فرمایید.', 'Please enter the waybill tracking code or the smart card number.', 'Lütfen irsaliye takip kodunu veya akıllı kart numarasını girin.'));
      return;
    }
    setIsInquiring(true);
    setTimeout(() => {
      setIsInquiring(false);
      setHasInquiryResult(true);
      showToast(
        'info',
        trText(
          'اتصال به وب‌سرویس راهداری هنوز فعال نیست؛ سند نمایش‌داده‌شده نمونه آزمایشی سامانه است.',
          'RMTO web service is not connected yet; the displayed document is a system sample.',
          'Karayolları web servisine bağlantı henüz etkin değil; gösterilen belge sistemin deneme örneğidir.'
        )
      );
    }, 800);
  };

  const handlePrintWaybill = () => {
    window.print();
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader
        currentScreen="RMTO_WAYBILL_VERIFY"
        title={trText('استعلام برخط راهداری و بارنامه دولتی تمبردار', 'RMTO Legal Waybill & Smart Card Portal', 'Karayolları Resmî İrsaliye ve Akıllı Kart Portalı')}
        subtitle={trText('استعلام برخط کارت هوشمند، صدور بارنامه رسمی راهداری و تایید پلیس‌راه', 'Official Road Maintenance & Transport Org inquiry & printed waybill', 'Karayolları akıllı kart sorgusu, resmî irsaliye düzenleme ve trafik polisi onayı')}
        showBack={true}
        onBack={() => onNavigate('DRIVER_ACTIVE_TRIP')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="RMTO_WAYBILL_VERIFY" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto space-y-6 w-full print:p-0 print:max-w-none">
        {/* Inquiry Form (Hidden on Print) */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-xs space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e1ed] pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00258e]">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{trText('سامانه استعلام اصالت سند حمل و کارت هوشمند راهداری', 'RMTO Transport Organization Official Gateway', 'Karayolları Taşıma Belgesi ve Akıllı Kart Resmî Geçidi')}</span>
              </div>
              <h2 className="text-lg font-black text-[#1a1b23] mt-1">
                {trText('استعلام برخط بارنامه و صلاحیت‌های حرفه‌ای ناوگان', 'Waybill Validation & Professional Fleet Inquiry', 'İrsaliye Doğrulama ve Filo Mesleki Yeterlilik Sorgusu')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintWaybill}
                className="px-4 py-2 rounded-xl bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{trText('چاپ نسخه رسمی بارنامه', 'Print Waybill', 'Resmî irsaliyeyi yazdır')}</span>
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setInquiryType('WAYBILL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                inquiryType === 'WAYBILL' ? 'bg-[#00258e] text-white' : 'bg-[#f4f2fe] text-[#545f72]'
              }`}
            >
              {trText('استعلام کد رهگیری بارنامه دولتی', 'Official waybill tracking code inquiry', 'Resmî irsaliye takip kodu sorgusu')}
            </button>
            <button
              onClick={() => setInquiryType('DRIVER_CARD')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                inquiryType === 'DRIVER_CARD' ? 'bg-[#00258e] text-white' : 'bg-[#f4f2fe] text-[#545f72]'
              }`}
            >
              {trText('استعلام کارت هوشمند راننده', 'Driver smart card inquiry', 'Sürücü akıllı kartı sorgusu')}
            </button>
            <button
              onClick={() => setInquiryType('TRUCK_CARD')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                inquiryType === 'TRUCK_CARD' ? 'bg-[#00258e] text-white' : 'bg-[#f4f2fe] text-[#545f72]'
              }`}
            >
              {trText('استعلام کارت هوشمند ناوگان (کامیون)', 'Fleet (truck) smart card inquiry', 'Filo (kamyon) akıllı kartı sorgusu')}
            </button>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs text-[#545f72] block mb-1 font-bold">
                {inquiryType === 'WAYBILL' ? trText('کد رهگیری ۱۶ رقمی بارنامه:', '16-digit waybill tracking code:', '16 haneli irsaliye takip kodu:') : trText('شماره کارت هوشمند:', 'Smart card number:', 'Akıllı kart numarası:')}
              </label>
              <input
                type="text"
                value={inquiryCode}
                onChange={(e) => setInquiryCode(e.target.value)}
                className="w-full bg-[#f4f2fe] border border-[#c4c5da] rounded-xl px-3 py-2 text-xs font-jetbrains font-bold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs text-[#545f72] block mb-1 font-bold">{trText('کد ملی استعلام‌گیرنده:', 'National ID of the requester:', 'Sorgulayanın kimlik numarası:')}</label>
              <input
                type="text"
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value)}
                className="w-full bg-[#f4f2fe] border border-[#c4c5da] rounded-xl px-3 py-2 text-xs font-jetbrains font-bold focus:outline-hidden"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunInquiry}
                disabled={isInquiring}
                className="w-full py-2 rounded-xl bg-[#00a368] hover:bg-[#008f5a] text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">search_check</span>
                <span>{isInquiring ? trText('در حال پردازش...', 'Processing...', 'İşleniyor...') : trText('استعلام نمونه (آزمایشی)', 'Sample inquiry (test)', 'Örnek sorgu (test)')}</span>
              </button>
            </div>
          </div>
        </div>

        {!hasInquiryResult && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#f4f2fe] text-[#00258e] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 className="font-bold text-base text-[#1a1b23]">{trText('استعلام برخط سند و بارنامه رسمی راهداری', 'RMTO Legal Waybill Inquiry', 'Karayolları Resmî İrsaliye Sorgusu')}</h3>
            <p className="text-xs text-[#545f72] max-w-md">
              {trText('جهت استعلام و اعتبارسنجی بارنامه یا کارت هوشمند، شماره کد رهگیری را در کادر بالا وارد نموده و دکمه استعلام لحظه‌ای را لمس فرمایید.', 'Enter the waybill code or smart card number above and click Instant Inquiry to verify.', 'İrsaliye veya akıllı kartı sorgulamak ve doğrulamak için takip kodunu yukarıdaki alana girip anlık sorgula düğmesine dokunun.')}
            </p>
          </div>
        )}

        {/* Official Printable Waybill Document */}
        {hasInquiryResult && (
          <div className="bg-white rounded-2xl border-2 border-[#1a1b23] p-6 shadow-md space-y-6 text-[#1a1b23] print:border-none print:shadow-none print:p-0">
            {/* Waybill Header */}
            <div className="flex justify-between items-center border-b-2 border-[#1a1b23] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#00258e] text-white font-black flex items-center justify-center text-xl shadow-xs">
                  TLD
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight">{trText('سازمان راهداری و حمل‌ونقل جاده‌ای کشور', 'Road Maintenance and Road Transport Organization', 'Karayolları ve Kara Taşımacılığı Kurumu')}</h1>
                  <h2 className="text-xs font-bold text-[#545f72]">{trText('بارنامه رسمی حمل جاده‌ای کالا (نسخه الکترونیک تمبردار)', 'Official road freight waybill (stamped electronic copy)', 'Resmî kara yükü irsaliyesi (damgalı elektronik nüsha)')}</h2>
                  <span className="text-[10px] text-[#00258e] font-bold">{trText('سامانه لجستیک هوشمند TLD — مجوز حمل برخط', 'TLD Smart Logistics Platform — online transport permit', 'TLD Akıllı Lojistik Platformu — çevrimiçi taşıma izni')}</span>
                </div>
              </div>

              <div className="text-end space-y-1">
                <div className="text-xs font-bold">
                  <span>{trText('کد رهگیری راهداری: ', 'RMTO tracking code: ', 'Karayolları takip kodu: ')}</span>
                  <span className="font-jetbrains font-black text-sm text-[#00258e]">99824-10382914401</span>
                </div>
                <div className="text-xs text-[#545f72]">{trText('تاریخ و ساعت صدور: ۱۴۰۳/۰۶/۱۰ - ساعت ۰۹:۳۰', 'Issue date and time: 1403/06/10 - 09:30', 'Düzenleme tarihi ve saati: 1403/06/10 - 09:30')}</div>
                <div className="inline-block px-2 py-0.5 rounded bg-[#e6f4ea] text-[#137333] text-[10px] font-bold">
                  {trText('وضعیت در سامانه: دارای اعتبار رسمی (تایید پلیس راه)', 'Status in the system: officially valid (approved by the traffic police)', 'Sistemdeki durum: resmî olarak geçerli (trafik polisi onaylı)')}
                </div>
              </div>
            </div>

            {/* Document Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Shipper & Consignee */}
              <div className="border border-[#c4c5da] rounded-xl p-3 space-y-2">
                <h3 className="font-bold text-xs text-[#00258e] border-b border-[#e2e1ed] pb-1">{trText('مشخصات فرستنده و گیرنده', 'Sender and consignee details', 'Gönderici ve alıcı bilgileri')}</h3>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('فرستنده:', 'Sender:', 'Gönderici:')}</span>
                  <span className="font-bold">{trText('شرکت داروسازی اکسیر سلامت (کد ملی: ۱۰۱۰۱۹۲۳۸۴۹)', 'Exir Salamat Pharmaceutical Company (national ID: 10101923849)', 'Exir Salamat İlaç Şirketi (kimlik no: 10101923849)')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('مبدأ بارگیری:', 'Loading origin:', 'Yükleme çıkışı:')}</span>
                  <span className="font-bold">{trText('تهران، جاده مخصوص کرج، کیلومتر ۱۸', 'Tehran, Karaj Special Road, km 18', 'Tahran, Karaj Özel Yolu, 18. km')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('گیرنده (تحویل‌گیرنده):', 'Consignee (recipient):', 'Alıcı (teslim alan):')}</span>
                  <span className="font-bold">{trText('شرکت توزیع سراسری درمان دارو مشهد', 'Darman Darou National Distribution Company, Mashhad', 'Darman Darou Ulusal Dağıtım Şirketi, Meşhed')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('مقصد تخلیه:', 'Unloading destination:', 'Boşaltma varış noktası:')}</span>
                  <span className="font-bold">{trText('مشهد، بلوار توس، خیابان بهارستان ۴', 'Mashhad, Tus Boulevard, Baharestan 4 Street', 'Meşhed, Tus Bulvarı, Baharestan 4. Sokak')}</span>
                </div>
              </div>

              {/* Carrier & Truck */}
              <div className="border border-[#c4c5da] rounded-xl p-3 space-y-2">
                <h3 className="font-bold text-xs text-[#00258e] border-b border-[#e2e1ed] pb-1">{trText('مشخصات راننده و ناوگان ترابری', 'Driver and transport fleet details', 'Sürücü ve taşıma filosu bilgileri')}</h3>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('نام و نام خانوادگی راننده:', 'Driver full name:', 'Sürücünün adı ve soyadı:')}</span>
                  <span className="font-bold">{trText('احمد رضایی (کد ملی: ۰۰۷۶۴۸۱۹۲۳)', 'Ahmad Rezaei (national ID: 0076481923)', 'Ahmad Rezaei (kimlik no: 0076481923)')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('شماره کارت هوشمند راننده:', 'Driver smart card number:', 'Sürücü akıllı kart numarası:')}</span>
                  <span className="font-jetbrains font-bold text-[#00a368]">{trText('۲۴۹۸۱۲۰۳ (دارای اعتبار)', '24981203 (valid)', '24981203 (geçerli)')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('کارت هوشمند ناوگان:', 'Fleet smart card:', 'Filo akıllı kartı:')}</span>
                  <span className="font-jetbrains font-bold text-[#00a368]">۱۸۴۹۲۰۰۴</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f72]">{trText('نوع خودرو و پلاک:', 'Vehicle type and plate:', 'Araç tipi ve plaka:')}</span>
                  <span className="font-bold">{trText('کشنده ولوو FH500 (پلاک: ۳۴ ع ۷۸۹ ایران ۴۴)', 'Volvo FH500 tractor (plate: 34 A 789 Iran 44)', 'Volvo FH500 çekici (plaka: 34 A 789 İran 44)')}</span>
                </div>
              </div>
            </div>

            {/* Cargo Description */}
            <div className="border border-[#c4c5da] rounded-xl p-3 text-xs space-y-2">
              <h3 className="font-bold text-xs text-[#00258e] border-b border-[#e2e1ed] pb-1">{trText('مشخصات فنی محموله', 'Cargo technical details', 'Yükün teknik özellikleri')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[#545f72] block">{trText('شرح کالا:', 'Goods description:', 'Mal açıklaması:')}</span>
                  <strong>{trText('فرآورده‌های دارویی یخچالی', 'Refrigerated pharmaceutical products', 'Soğutmalı ilaç ürünleri')}</strong>
                </div>
                <div>
                  <span className="text-[#545f72] block">{trText('تعداد بسته‌ها:', 'Number of packages:', 'Paket sayısı:')}</span>
                  <strong>{trText('۲۴ پالت استاندارد', '24 standard pallets', '24 standart palet')}</strong>
                </div>
                <div>
                  <span className="text-[#545f72] block">{trText('وزن ناخالص بارنامه:', 'Waybill gross weight:', 'İrsaliye brüt ağırlığı:')}</span>
                  <strong className="font-jetbrains">{trText('۱۴,۵۰۰ کیلوگرم', '14,500 kg', '14.500 kg')}</strong>
                </div>
                <div>
                  <span className="text-[#545f72] block">{trText('دمای حمل تعهد شده:', 'Committed transport temperature:', 'Taahhüt edilen taşıma sıcaklığı:')}</span>
                  <strong className="font-jetbrains text-[#00258e]">{trText('۲ الی ۸ درجه سانتی‌گراد', '2 to 8 °C', '2 ila 8 °C')}</strong>
                </div>
              </div>
            </div>

            {/* Financial Details Table */}
            <div className="border border-[#c4c5da] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-[#f4f2fe] border-b border-[#c4c5da] font-bold text-[#545f72]">
                  <tr>
                    <th className="p-2.5">{trText('عنوان ردیف هزینه', 'Cost item', 'Maliyet kalemi')}</th>
                    <th className="p-2.5">{trText('مبلغ به تومان', 'Amount in tomans', 'Tutan (tümen)')}</th>
                    <th className="p-2.5">{trText('توضیحات و مستند قانونی', 'Description and legal basis', 'Açıklama ve yasal dayanak')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e1ed]">
                  <tr>
                    <td className="p-2.5 font-bold">{trText('کرایه پایه حمل تن-کیلومتر', 'Base freight per ton-kilometre', 'Ton-kilometre temel navlun')}</td>
                    <td className="p-2.5 font-jetbrains font-bold">{trText('۳۳,۵۰۰,۰۰۰', '33,500,000', '33.500.000')}</td>
                    <td className="p-2.5 text-[#545f72]">{trText('محاسبه طبق نرخ شاخص تن-کیلومتر راهداری', 'Calculated per the RMTO ton-kilometre index rate', 'Karayolları ton-kilometre endeks ücretine göre hesaplanmıştır')}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">{trText('عوارض قانونی سازمان راهداری (۹٪)', 'Statutory RMTO levy (9%)', 'Karayolları yasal harçı (%9)')}</td>
                    <td className="p-2.5 font-jetbrains">{trText('۳,۰۱۵,۰۰۰', '3,015,000', '3.015.000')}</td>
                    <td className="p-2.5 text-[#545f72]">{trText('واریز به حساب خزانه دولت', 'Paid into the state treasury account', 'Devlet hazinesi hesabına yatırılır')}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">{trText('حق بیمه مسئولیت مدنی حمل بار', 'Cargo transport civil liability insurance premium', 'Yük taşımacılığı sorumluluk sigortası primi')}</td>
                    <td className="p-2.5 font-jetbrains">{trText('۴۸۵,۰۰۰', '485,000', '485.000')}</td>
                    <td className="p-2.5 text-[#545f72]">{trText('پوشش بیمه ایران تا سقف ۲ میلیارد تومان', 'Iran Insurance coverage up to 2 billion tomans', 'İran Sigorta kapsamı 2 milyar tümene kadar')}</td>
                  </tr>
                  <tr className="bg-[#fbf8ff] font-black text-sm">
                    <td className="p-3 text-[#00258e]">{trText('جمع کل صورت‌حساب بارنامه', 'Total waybill invoice', 'İrsaliye toplam tutarı')}</td>
                    <td className="p-3 font-jetbrains text-[#00258e]">{trText('۳۷,۰۰۰,۰۰۰ تومان', '37,000,000 tomans', '37.000.000 tümen')}</td>
                    <td className="p-3 text-[#00a368]">{trText('پرداخت شده در سامانه امن امانی شاپرک', 'Paid through the secure Shaparak escrow system', 'Güvenli Shaparak emanet sistemi üzerinden ödenmiştir')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Seals & Verification Barcode */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t-2 border-[#1a1b23] text-xs">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-[#1a1b23] text-white flex flex-col items-center justify-center p-1 rounded-lg text-center font-jetbrains text-[9px]">
                  <span>[ QR CODE ]</span>
                  <span>POLICE RAH</span>
                  <span>VERIFIED</span>
                </div>
                <div className="space-y-1">
                  <div className="font-bold">{trText('استعلام معتبر توسط پلیس‌راه و پاسگاه‌های سراسر کشور', 'Valid inquiry by the traffic police and checkpoints nationwide', 'Ülke genelinde trafik polisi ve kontrol noktalarınca geçerli sorgu')}</div>
                  <div className="text-[11px] text-[#545f72]">{trText('پلمپ هوشمند دیجیتال: SEAL-TLD-99824', 'Digital smart seal: SEAL-TLD-99824', 'Dijital akıllı mühür: SEAL-TLD-99824')}</div>
                  <div className="text-[10px] text-[#545f72]">{trText('شناسه دیجیتال یکتای سند: SHA256-8a7e3b91c...', 'Unique digital document ID: SHA256-8a7e3b91c...', 'Belgenin benzersiz dijital kimliği: SHA256-8a7e3b91c...')}</div>
                </div>
              </div>

              <div className="text-center sm:text-end border-2 border-dashed border-[#00258e] p-3 rounded-xl">
                <span className="text-[10px] text-[#00258e] font-bold block">{trText('مهر دیجیتال موسسه لجستیک TLD', 'Digital seal of the TLD logistics institution', 'TLD lojistik kurumunun dijital mührü')}</span>
                <span className="text-xs font-black text-[#1a1b23]">{trText('ممهور به امضای الکترونیک راهداری', 'Sealed with the RMTO electronic signature', 'Karayolları elektronik imzasıyla mühürlenmiştir')}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
