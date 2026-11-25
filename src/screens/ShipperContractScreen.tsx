import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService, adaptDbCargoToShipperCargo } from '../services/shipperService';
import { pdfExportService } from '../services/pdfExportService';

interface ShipperContractScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperContractScreen: React.FC<ShipperContractScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { cargos: dbCargos, selectedCargoId } = useLogistics();

  const [activeTab, setActiveTab] = useState<'CONTRACT' | 'WAYBILL' | 'INSURANCE'>('CONTRACT');
  const [isSigned, setIsSigned] = useState(false);
  const [signatureDate, setSignatureDate] = useState('—');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Selected cargo: context selection first, then any cargo with an assigned driver
  const cargo = useMemo(() => {
    const byId = new Map<string, ReturnType<typeof adaptDbCargoToShipperCargo>>();
    dbCargos.forEach((c) => byId.set(c.id, adaptDbCargoToShipperCargo(c)));
    shipperService.getCargos().forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
    const all = Array.from(byId.values());
    return (
      (selectedCargoId && all.find((c) => c.id === selectedCargoId)) ||
      all.find((c) => c.assignedDriver) ||
      all[0]
    );
  }, [dbCargos, selectedCargoId]);

  const cargoId = cargo?.id ?? '—';
  const contract = shipperService.getDigitalContract(cargoId);
  const waybill = shipperService.getElectronicWaybill(cargoId);

  const handleSignContract = () => {
    setIsSigned(true);
    setSignatureDate(trText('هم‌اکنون', 'Just now', 'Şimdi'));
    showToast('success', trText('امضای الکترونیکی شما با موفقیت بر روی قرارداد ثبت و رمزنگاری شد.', 'Your electronic signature was successfully recorded on the contract and encrypted.', 'Elektronik imzanız sözleşmeye başarıyla kaydedildi ve şifrelendi.'));
  };

  const handleDownloadContractPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('info', trText('در حال تولید فایل PDF قرارداد هوشمند...', 'Generating the smart contract PDF...', 'Akıllı sözleşme PDF’i oluşturuluyor...'));
      await pdfExportService.exportDigitalContractPDF(contract);
      showToast('success', trText('فایل PDF قرارداد دیجیتال با موفقیت دانلود شد.', 'The digital contract PDF was downloaded successfully.', 'Dijital sözleşme PDF’i başarıyla indirildi.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در دانلود PDF قرارداد.', 'Failed to download the contract PDF.', 'Sözleşme PDF’i indirilemedi.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadWaybillManifestPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('info', trText('در حال صدور فایل PDF مانیفست و بارنامه رسمی...', 'Issuing the official manifest and waybill PDF...', 'Resmî manifesto ve irsaliye PDF’i düzenleniyor...'));
      await pdfExportService.exportCargoManifestPDF(cargo, waybill);
      showToast('success', trText('فایل PDF مانیفست و بارنامه با موفقیت دانلود شد.', 'The manifest and waybill PDF was downloaded successfully.', 'Manifesto ve irsaliye PDF’i başarıyla indirildi.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در صدور PDF بارنامه.', 'Failed to issue the waybill PDF.', 'İrsaliye PDF’i düzenlenemedi.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_CONTRACT" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_CONTRACT" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{trText('اسناد رسمی و حقوقی حمل و نقل', 'Official transport and legal documents', 'Resmî taşıma ve hukuki belgeler')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('قرارداد دیجیتال، بارنامه و بیمه بار', 'Digital contract, waybill and cargo insurance', 'Dijital sözleşme, irsaliye ve yük sigortası')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('شناسه قرارداد:', 'Contract ID:', 'Sözleşme no:')} <span className="font-jetbrains font-bold text-[#1a1b23]">{contract.contractNumber}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={activeTab === 'CONTRACT' ? handleDownloadContractPDF : handleDownloadWaybillManifestPDF}
              disabled={isExportingPDF}
              className="px-4 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1.5 shadow-md shadow-[#00258e]/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExportingPDF ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>{isExportingPDF ? trText('در حال صدور...', 'Issuing...', 'Düzenleniyor...') : trText('دانلود سند رسمی (PDF)', 'Download official document (PDF)', 'Resmî belgeyi indir (PDF)')}</span>
            </button>
            <button
              onClick={() => onNavigate('SHIPPER_ESCROW')}
              className="px-4 py-2.5 rounded-xl bg-[#00a368] text-white text-xs font-black hover:bg-[#008f5a] flex items-center gap-1.5 shadow-md shadow-[#00a368]/20 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>{trText('تامین اعتبار حساب امانی', 'Fund the escrow account', 'Emanet hesabını finanse et')}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#c4c5da] shadow-sm">
          {[
            { id: 'CONTRACT', label: 'قرارداد هوشمند دیجیتال', labelEn: 'Digital smart contract', labelTr: 'Dijital akıllı sözleşme', icon: 'gavel' },
            { id: 'WAYBILL', label: 'بارنامه الکترونیک و مانیفست', labelEn: 'Electronic waybill and manifest', labelTr: 'Elektronik irsaliye ve manifesto', icon: 'receipt_long' },
            { id: 'INSURANCE', label: 'گواهی بیمه‌نامه باربری', labelEn: 'Cargo insurance certificate', labelTr: 'Yük sigortası sertifikası', icon: 'verified_user' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'text-[#545f72] hover:bg-[#eeedf9]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{trText(tab.label, tab.labelEn, tab.labelTr)}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: DIGITAL SMART CONTRACT */}
        {activeTab === 'CONTRACT' && (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
            {/* Header Stamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#00258e] pb-4">
              <div>
                <div className="text-xs text-[#00258e] font-bold">{trText('جمهوری اسلامی ایران - سامانه هوشمند ترابری جاده‌ای', 'Islamic Republic of Iran - Smart Road Transport System', 'İran İslam Cumhuriyeti - Akıllı Karayolu Taşımacılığı Sistemi')}</div>
                <h2 className="text-xl font-black text-[#1a1b23] mt-1">{trText('قرارداد الکترونیکی حمل و نقل بار', 'Electronic cargo transport contract', 'Elektronik yük taşıma sözleşmesi')}</h2>
                <div className="text-[11px] text-[#747686] mt-0.5">{trText('منعقده بر اساس مواد ۱۰ و ۲۱۹ قانون مدنی و آیین‌نامه راهداری', 'Concluded under Articles 10 and 219 of the Civil Code and the Road Administration Regulation', 'Medeni Kanun’un 10. ve 219. maddeleri ile Karayolları Yönetmeliği uyarınca düzenlenmiştir')}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadContractPDF}
                  disabled={isExportingPDF}
                  className="px-3.5 py-2 rounded-xl bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>{trText('دانلود PDF قرارداد', 'Download contract PDF', 'Sözleşme PDF’ini indir')}</span>
                </button>
                <div className="bg-[#eeedf9] p-3 rounded-2xl border border-[#c4c5da] text-center self-start sm:self-auto">
                  <span className="text-[10px] text-[#545f72] block">{trText('کد رهگیری امنیتی:', 'Security tracking code:', 'Güvenlik takip kodu:')}</span>
                  <span className="font-jetbrains text-xs font-bold text-[#00258e]">{contract.contractNumber}</span>
                </div>
              </div>
            </div>

            {/* Parties Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shipper Side */}
              <div className="bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] space-y-2 text-xs">
                <div className="font-bold text-[#00258e] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                  <span>{trText('طرف اول (صاحب کالا / کارفرما)', 'First party (cargo owner / principal)', 'Birinci taraf (yük sahibi / işveren)')}</span>
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('شرکت/شخص:', 'Company/person:', 'Şirket/kişi:')}</strong> {contract.shipperCompany}
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('نماینده:', 'Representative:', 'Temsilci:')}</strong> {contract.shipperName}
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('شناسه ملی:', 'National ID:', 'Ulusal kimlik no:')}</strong> <span className="font-jetbrains">{contract.shipperNationalId}</span>
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('مبدأ:', 'Origin:', 'Kalkış:')}</strong> {contract.originAddress}
                </div>
              </div>

              {/* Driver Side */}
              <div className="bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] space-y-2 text-xs">
                <div className="font-bold text-[#00a368] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  <span>{trText('طرف دوم (متصدی حمل / راننده)', 'Second party (carrier / driver)', 'İkinci taraf (taşıyıcı / sürücü)')}</span>
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('راننده مسئول:', 'Responsible driver:', 'Sorumlu sürücü:')}</strong> {contract.driverName}
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('کارت هوشمند راننده:', 'Driver smart card:', 'Sürücü akıllı kartı:')}</strong> <span className="font-jetbrains">{contract.driverSmartCard}</span>
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('پلاک ناوگان:', 'Fleet plate:', 'Filo plakası:')}</strong> <span className="font-jetbrains">{contract.truckPlate}</span>
                </div>
                <div className="text-[#1a1b23]">
                  <strong>{trText('مقصد تخلیه:', 'Unloading destination:', 'Boşaltma varış noktası:')}</strong> {contract.destinationAddress}
                </div>
              </div>
            </div>

            {/* Financial & Terms clauses */}
            <div className="space-y-3 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs">
              <h3 className="font-black text-sm text-[#1a1b23]">{trText('مفاد و شرایط اختصاصی قرارداد:', 'Contract terms and special conditions:', 'Sözleşme hükümleri ve özel koşullar:')}</h3>
              <ul className="space-y-2 list-disc list-inside text-[#545f72]">
                {contract.termsAndConditions.map((term, index) => (
                  <li key={index} className="leading-relaxed">
                    <span className="text-[#1a1b23]">{term}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#e2e1ed]">
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('کرایه کل توافقی:', 'Total agreed fare:', 'Toplam anlaşılan ücret:')}</span>
                  <span className="font-jetbrains font-extrabold text-[#00258e]">
                    {contract.agreedFareTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                  </span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('نرخ دموراژ ساعتی:', 'Hourly demurrage rate:', 'Saatlik demuraj ücreti:')}</span>
                  <span className="font-jetbrains font-bold text-[#1a1b23]">
                    {contract.demurrageRatePerHourTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                  </span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('مهلت بارگیری و تخلیه:', 'Loading and unloading allowance:', 'Yükleme ve boşaltma süresi:')}</span>
                  <span className="font-bold text-[#1a1b23]">{trText(`هر کدام ${contract.loadingTimeAllowanceHours} ساعت`, `${contract.loadingTimeAllowanceHours} hours each`, `her biri ${contract.loadingTimeAllowanceHours} saat`)}</span>
                </div>
                <div>
                  <span className="text-[#747686] text-[10px] block">{trText('بیمه‌گر مسئول:', 'Insurer:', 'Sigortacı:')}</span>
                  <span className="font-bold text-[#00a368]">{contract.insuranceUnderwriter}</span>
                </div>
              </div>
            </div>

            {/* E-Signatures Pad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e2e1ed]">
              {/* Shipper Signature */}
              <div className="border-2 border-dashed border-[#00258e] p-4 rounded-2xl text-center space-y-2 bg-[#eeedf9]/30">
                <div className="text-xs font-bold text-[#00258e]">{trText('امضا و مهر الکترونیکی صاحب کالا (شما)', 'Electronic signature and seal of the cargo owner (you)', 'Yük sahibinin elektronik imzası ve mührü (siz)')}</div>
                {isSigned ? (
                  <div className="py-3">
                    <div className="font-black text-sm text-[#00258e] italic">{trText('امضای دیجیتال احراز شده ✓', 'Verified digital signature ✓', 'Doğrulanmış dijital imza ✓')}</div>
                    <div className="text-[10px] text-[#747686] font-jetbrains mt-1">{trText(`زمان امضا: ${signatureDate}`, `Signing time: ${signatureDate}`, `İmza zamanı: ${signatureDate}`)}</div>
                    <div className="text-[9px] text-[#00a368] font-jetbrains mt-0.5">{trText('شناسه کلید عمومی: PKI-SHP-8892', 'Public key ID: PKI-SHP-8892', 'Ortak anahtar kimliği: PKI-SHP-8892')}</div>
                  </div>
                ) : (
                  <button
                    onClick={handleSignContract}
                    className="mt-2 px-6 py-2 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5]"
                  >
                    {trText('ثبت امضای دیجیتال', 'Register digital signature', 'Dijital imzayı kaydet')}
                  </button>
                )}
              </div>

              {/* Driver Signature */}
              <div className="border-2 border-dashed border-[#00a368] p-4 rounded-2xl text-center space-y-2 bg-[#00a368]/5">
                <div className="text-xs font-bold text-[#00a368]">{trText('امضا و تایید الکترونیکی راننده', 'Driver electronic signature and approval', 'Sürücünün elektronik imzası ve onayı')}</div>
                <div className="py-3">
                  <div className="font-black text-sm text-[#00a368] italic">{trText(`امضا شده توسط راننده (${contract.driverName}) ✓`, `Signed by driver (${contract.driverName}) ✓`, `Sürücü tarafından imzalandı (${contract.driverName}) ✓`)}</div>
                  <div className="text-[10px] text-[#747686] font-jetbrains mt-1">{trText(`زمان امضا: ${contract.driverSignatureDate}`, `Signing time: ${contract.driverSignatureDate}`, `İmza zamanı: ${contract.driverSignatureDate}`)}</div>
                  <div className="text-[9px] text-[#00a368] font-jetbrains mt-0.5">{trText(`شناسه هوشمند راننده: ${contract.driverSmartCard}`, `Driver smart ID: ${contract.driverSmartCard}`, `Sürücü akıllı kimliği: ${contract.driverSmartCard}`)}</div>
                </div>
              </div>
            </div>

            {/* Legal Hash Footer */}
            <div className="bg-[#1a1b23] text-[#c4c5da] p-3 rounded-xl font-jetbrains text-[10px] text-center" dir="ltr">
              {contract.legalHash}
            </div>
          </div>
        )}

        {/* TAB 2: ELECTRONIC WAYBILL & MANIFEST (RMTO) */}
        {activeTab === 'WAYBILL' && (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
            {/* RMTO Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1a1b23] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00258e] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[28px]">local_shipping</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{trText('سازمان راهداری و حمل و نقل جاده‌ای', 'Road Maintenance and Transportation Organization', 'Karayolları Bakım ve Ulaştırma Kurumu')}</h2>
                  <div className="text-xs font-bold text-[#00258e]">{trText('بارنامه برخط الکترونیکی تمبردار و مانیفست بار', 'Stamped online electronic waybill and cargo manifest', 'Mühürlü çevrimiçi elektronik irsaliye ve yük manifestosu')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadWaybillManifestPDF}
                  disabled={isExportingPDF}
                  className="px-3.5 py-2 rounded-xl bg-[#00258e] hover:bg-[#0036c5] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00258e]/20 disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  <span>{trText('دانلود مانیفست PDF', 'Download manifest PDF', 'Manifesto PDF’ini indir')}</span>
                </button>
                <div className="text-end">
                  <div className="text-[11px] text-[#747686]">{trText('کد رهگیری راهداری:', 'Road administration tracking code:', 'Karayolları takip kodu:')}</div>
                  <div className="font-jetbrains font-black text-sm text-[#ba1a1a]">{waybill.rmtoTrackingCode}</div>
                  <div className="text-[10px] text-[#747686]">{waybill.issuedDate}</div>
                </div>
              </div>
            </div>

            {/* Waybill Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs">
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('فرستنده:', 'Sender:', 'Gönderici:')}</span>
                <span className="font-bold text-[#1a1b23]">{waybill.shipperFullName}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('گیرنده:', 'Receiver:', 'Alıcı:')}</span>
                <span className="font-bold text-[#1a1b23]">{waybill.receiverFullName}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('پایانه مبدأ:', 'Origin terminal:', 'Çıkış terminali:')}</span>
                <span className="font-bold text-[#1a1b23]">{waybill.originTerminal}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('پایانه مقصد:', 'Destination terminal:', 'Varış terminali:')}</span>
                <span className="font-bold text-[#1a1b23]">{waybill.destinationTerminal}</span>
              </div>

              <div>
                <span className="text-[#747686] text-[10px] block">{trText('راننده اول:', 'First driver:', 'Birinci sürücü:')}</span>
                <span className="font-bold text-[#1a1b23]">{waybill.driverFullName}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('شماره گواهینامه / کارت هوشمند:', 'License number / smart card:', 'Ehliyet no / akıllı kart:')}</span>
                <span className="font-jetbrains font-bold text-[#1a1b23]">{waybill.driverSmartCard}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('پلاک خودرو:', 'Vehicle plate:', 'Araç plakası:')}</span>
                <span className="font-jetbrains font-bold text-[#1a1b23]">{waybill.truckPlateNumber}</span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('کارت هوشمند ناوگان:', 'Fleet smart card:', 'Filo akıllı kartı:')}</span>
                <span className="font-jetbrains font-bold text-[#1a1b23]">{waybill.truckSmartCard}</span>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#eeedf9]/50 p-4 rounded-2xl border border-[#c4c5da] text-xs text-center">
              <div>
                <span className="text-[#545f72] text-[10px] block">{trText('خالص کرایه:', 'Net freight:', 'Net navlun:')}</span>
                <span className="font-jetbrains font-bold text-[#00258e]">
                  {waybill.fareAmountTomans.toLocaleString('fa-IR')} {trText('ت', 'T', 'T')}
                </span>
              </div>
              <div>
                <span className="text-[#545f72] text-[10px] block">{trText('کمیسیون پایانه (۸٪):', 'Terminal commission (8%):', 'Terminal komisyonu (%8):')}</span>
                <span className="font-jetbrains font-bold text-[#1a1b23]">
                  {waybill.commissionTomans.toLocaleString('fa-IR')} {trText('ت', 'T', 'T')}
                </span>
              </div>
              <div>
                <span className="text-[#545f72] text-[10px] block">{trText('حق بیمه بار:', 'Cargo insurance premium:', 'Yük sigorta primi:')}</span>
                <span className="font-jetbrains font-bold text-[#00a368]">
                  {waybill.insuranceFeeTomans.toLocaleString('fa-IR')} {trText('ت', 'T', 'T')}
                </span>
              </div>
              <div>
                <span className="text-[#545f72] text-[10px] block">{trText('عوارض جاده‌ای و پایانه:', 'Road tolls and terminal fees:', 'Karayolu geçiş ve terminal ücretleri:')}</span>
                <span className="font-jetbrains font-bold text-[#1a1b23]">
                  {(waybill.roadTollTomans + waybill.terminalFeeTomans).toLocaleString('fa-IR')} {trText('ت', 'T', 'T')}
                </span>
              </div>
              <div>
                <span className="text-[#545f72] text-[10px] block">{trText('وضعیت بارنامه:', 'Waybill status:', 'İrsaliye durumu:')}</span>
                <span className="bg-[#00a368]/15 text-[#00a368] px-2 py-0.5 rounded font-bold">
                  {trText('فعال و معتبر', 'Active and valid', 'Geçerli ve aktif')}
                </span>
              </div>
            </div>

            {/* QR & Barcode Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-[#c4c5da] rounded-2xl bg-white">
              <div className="flex items-center gap-4">
                <img
                  src={waybill.qrCodeUrl}
                  alt={trText('کد QR بارنامه', 'QR Code Waybill', 'QR Kodlu İrsaliye')}
                  className="w-20 h-20 rounded-xl border border-[#c4c5da] p-1"
                />
                <div>
                  <div className="text-xs font-bold text-[#1a1b23]">{trText('اسکن جهت استعلام اصالت بارنامه در پلیس راه', 'Scan to verify the waybill authenticity at the highway police', 'Karayolu polisinde irsaliye geçerliliğini sorgulamak için tarayın')}</div>
                  <div className="text-[11px] text-[#545f72] mt-0.5">
                    {trText('سازمان راهداری و حمل‌ونقل جاده‌ای کشور (سامانه داپ)', 'National Road Maintenance and Transportation Organization (DAP system)', 'Ülke Karayolları Bakım ve Ulaştırma Kurumu (DAP sistemi)')}
                  </div>
                  <div className="font-jetbrains font-bold text-xs text-[#00258e] mt-1">
                    {trText(`بارکد: ${waybill.barcodeNumber}`, `Barcode: ${waybill.barcodeNumber}`, `Barkod: ${waybill.barcodeNumber}`)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadWaybillManifestPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00258e]/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>{trText('دانلود PDF مانیفست', 'Download manifest PDF', 'Manifesto PDF’ini indir')}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#c4c5da] text-[#1a1b23] text-xs font-bold hover:bg-[#f1f5f9] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>{trText('چاپ فیزیکی', 'Print copy', 'Fiziksel yazdır')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CARGO INSURANCE */}
        {activeTab === 'INSURANCE' && (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#00a368] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00a368]/10 text-[#00a368] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[28px]">verified_user</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1a1b23]">{cargo.insurance.underwriter}</h2>
                  <div className="text-xs font-bold text-[#00a368]">
                    {trText('بیمه‌نامه رسمی حمل و نقل داخلی کالا (تمام‌خطر کلوز A)', 'Official domestic cargo transport insurance policy (all-risks Clause A)', 'Resmî yurt içi yük taşıma sigorta poliçesi (tam risk A Klozu)')}
                  </div>
                </div>
              </div>

              <div className="text-end">
                <div className="text-[11px] text-[#747686]">{trText('شماره بیمه‌نامه:', 'Policy number:', 'Poliçe numarası:')}</div>
                <div className="font-jetbrains font-bold text-sm text-[#00258e]">
                  {cargo.insurance.policyNumber || 'IR-INS-8849204-TR'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs">
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('سرمایه و ارزش بیمه‌شده کالا:', 'Insured capital and cargo value:', 'Sigortalı sermaye ve yük değeri:')}</span>
                <span className="font-jetbrains font-black text-base text-[#00258e]">
                  {cargo.insurance.declaredValueTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                </span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('حق بیمه دریافتی:', 'Premium charged:', 'Alınan prim:')}</span>
                <span className="font-jetbrains font-bold text-sm text-[#00a368]">
                  {cargo.insurance.calculatedPremiumTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                </span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('میزان فرانشیز خسارت:', 'Damage deductible:', 'Hasar muafiyeti:')}</span>
                <span className="font-bold text-[#1a1b23]">{trText('۱۰٪ از مبلغ هر خسارت', '10% of each damage claim', 'Her hasar tutarının %10’u')}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#545f72] leading-relaxed bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed]">
              <div className="font-bold text-[#1a1b23] mb-1">{trText('پوشش‌های تحت ضمانت این بیمه‌نامه:', 'Coverages guaranteed by this policy:', 'Bu poliçenin güvence altına aldığı teminatlar:')}</div>
              <p>
                {trText('۱. خسارت ناشی از تصادف، واژگونی، سقوط و آتش‌سوزی وسیله نقلیه حامل کالا.', '1. Damage caused by collision, overturning, falling and fire of the vehicle carrying the cargo.', '1. Yükü taşıyan aracın çarpışma, devrilme, düşme ve yangınından kaynaklanan hasarlar.')}
                <br />
                {trText('۲. سرقت کلی محموله با شکستن حرز و پلمپ هوشمند دیجیتال (IoT Lock).', '2. Total theft of the cargo by breaking the seal and the smart digital lock (IoT Lock).', '2. Mührün ve akıllı dijital kilidin (IoT Lock) kırılmasıyla yükün tamamen çalınması.')}
                <br />
                {trText('۳. آب‌دیدگی، ریزش بار و خسارات ناشی از ترمز ناگهانی در جاده.', '3. Water damage, load spillage and damage caused by sudden braking on the road.', '3. Su alma, yük dökülmesi ve yolda ani frenlemeden kaynaklanan hasarlar.')}
                <br />
                {trText('۴. خسارت وارده به دلیل فساد مواد غذایی در صورت نقص فنی تاییدشده یخچال.', '4. Damage due to food spoilage in case of a confirmed technical failure of the refrigeration unit.', '4. Soğutucu ünitenin onaylanmış teknik arızası durumunda gıda bozulmasından kaynaklanan hasarlar.')}
              </p>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav currentScreen="CARGOS" onNavigate={onNavigate} />
    </div>
  );
};
