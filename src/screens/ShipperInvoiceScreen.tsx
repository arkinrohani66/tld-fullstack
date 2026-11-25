import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService } from '../services/shipperService';
import { pdfExportService } from '../services/pdfExportService';
import { TLDLogo } from '../components/brand/TLDLogo';

interface ShipperInvoiceScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperInvoiceScreen: React.FC<ShipperInvoiceScreenProps> = ({ onNavigate }) => {
  const { dir, trText } = useLanguage();
  const { showToast } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const cargoId = 'CRG-8892';
  const invoice = shipperService.getOfficialInvoice(cargoId);

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      showToast('info', trText('در حال تولید فایل PDF با کیفیت فاکتور رسمی...', 'Generating a high-quality official invoice PDF...', 'Yüksek kaliteli resmî fatura PDF\'i oluşturuluyor...'));
      await pdfExportService.exportTaxInvoicePDF(invoice);
      showToast('success', trText('فایل PDF صورتحساب مالیاتی با موفقیت دانلود شد.', 'The tax invoice PDF was downloaded successfully.', 'Vergi faturası PDF\'i başarıyla indirildi.'));
    } catch (err) {
      console.error(err);
      showToast('error', trText('خطا در تولید فایل PDF فاکتور.', 'Error generating the invoice PDF.', 'Fatura PDF\'i oluşturulurken hata oluştu.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_INVOICE" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_INVOICE" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00258e] font-bold">
              <span className="material-symbols-outlined text-[18px]">receipt</span>
              <span>{trText('امور مالی و حسابداری رسمی', 'Finance & Official Accounting', 'Finans ve Resmî Muhasebe')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('صورتحساب و فاکتور الکترونیک', 'Electronic Invoice & Billing', 'Elektronik Fatura ve Faturalandırma')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('مطابق با استانداردهای سامانه مودیان مالیاتی و قانون پایانه‌های فروشگاهی', 'Compliant with the Moadian tax system standards and the store terminal law', 'Moadian vergi sistemi standartlarına ve mağaza terminali kanununa uygundur')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-2 cursor-pointer shadow-md shadow-[#00258e]/20 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExporting ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>{isExporting ? trText('در حال صدور PDF...', 'Issuing PDF...', 'PDF oluşturuluyor...') : trText('دانلود PDF فاکتور رسمی', 'Download Official Invoice PDF', 'Resmî Fatura PDF\'ini İndir')}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#c4c5da] text-[#1a1b23] text-xs font-bold hover:bg-[#f1f5f9] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>{trText('چاپ مستقیم', 'Direct Print', 'Doğrudan Yazdır')}</span>
            </button>
            <button
              onClick={() => onNavigate('SHIPPER_RATING')}
              className="px-4 py-2.5 rounded-xl border border-[#00258e] text-[#00258e] text-xs font-bold hover:bg-[#00258e]/5 cursor-pointer transition-all"
            >
              {trText('ارزیابی راننده', 'Driver Rating', 'Sürücü Değerlendirmesi')}
            </button>
          </div>
        </div>

        {/* Invoice Paper Canvas */}
        <div className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6">
          {/* Top Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1a1b23] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#f4f2fe] rounded-xl border border-[#c4c5da]/60">
                <TLDLogo variant="compact" showPersianSlogan={false} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#00258e]">{trText('صورتحساب الکترونیکی خدمات حمل و نقل جاده‌ای', 'Electronic invoice for road transport services', 'Karayolu taşımacılığı hizmetleri için elektronik fatura')}</div>
                <h2 className="text-xl font-black text-[#1a1b23] mt-0.5">{trText('فاکتور رسمی فروش خدمات ترابری', 'Official invoice for transport services', 'Taşımacılık hizmetleri resmî satış faturası')}</h2>
                <div className="text-[11px] text-[#747686]">{trText('نوع اول - سامانه جامع امور مالیاتی کشور', 'Type 1 — National Tax Administration System', 'Tip 1 — Ulusal Vergi İdaresi Sistemi')}</div>
              </div>
            </div>

            <div className="text-end">
              <div className="text-xs text-[#545f72]">{trText('شماره فاکتور', 'Invoice No.', 'Fatura No.')}: <strong className="text-[#1a1b23] font-jetbrains">{invoice.invoiceNumber}</strong></div>
              <div className="text-xs text-[#545f72] mt-0.5">{trText('تاریخ صدور', 'Issue Date', 'Düzenleme Tarihi')}: <span className="font-jetbrains">{invoice.issueDate}</span></div>
              <div className="text-[10px] text-[#00a368] font-jetbrains mt-0.5 truncate max-w-[200px]">{trText('شناسه یکتا', 'Unique ID', 'Benzersiz Kimlik')}: {invoice.taxUniqueId}</div>
            </div>
          </div>

          {/* Parties: Seller & Buyer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller */}
            <div className="bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs space-y-1.5">
              <div className="font-bold text-[#00258e] text-xs border-b border-[#e2e1ed] pb-1">{trText('مشخصات فروشنده (ارائه‌دهنده خدمت)', 'Seller Details (Service Provider)', 'Satıcı Bilgileri (Hizmet Sağlayıcı)')}:</div>
              <div className="text-[#1a1b23]"><strong>{trText('نام شرکت', 'Company Name', 'Şirket Adı')}:</strong> {invoice.sellerInfo.legalName}</div>
              <div className="text-[#1a1b23]"><strong>{trText('شناسه ملی / کد اقتصادی', 'National ID / Economic Code', 'Ulusal Kimlik / Ekonomik Kod')}:</strong> <span className="font-jetbrains">{invoice.sellerInfo.nationalId}</span></div>
              <div className="text-[#1a1b23]"><strong>{trText('نشانی', 'Address', 'Adres')}:</strong> {invoice.sellerInfo.address}</div>
              <div className="text-[#1a1b23]"><strong>{trText('تلفن', 'Phone', 'Telefon')}:</strong> <span className="font-jetbrains">{invoice.sellerInfo.phone}</span></div>
            </div>

            {/* Buyer */}
            <div className="bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed] text-xs space-y-1.5">
              <div className="font-bold text-[#00a368] text-xs border-b border-[#e2e1ed] pb-1">{trText('مشخصات خریدار (صاحب کالا)', 'Buyer Details (Cargo Owner)', 'Alıcı Bilgileri (Yük Sahibi)')}:</div>
              <div className="text-[#1a1b23]"><strong>{trText('نام شخص / شرکت', 'Name of Person / Company', 'Kişi / Şirket Adı')}:</strong> {invoice.buyerInfo.fullNameOrCompany}</div>
              <div className="text-[#1a1b23]"><strong>{trText('شناسه ملی', 'National ID', 'Ulusal Kimlik')}:</strong> <span className="font-jetbrains">{invoice.buyerInfo.nationalId}</span></div>
              <div className="text-[#1a1b23]"><strong>{trText('نشانی', 'Address', 'Adres')}:</strong> {invoice.buyerInfo.address}</div>
              <div className="text-[#1a1b23]"><strong>{trText('تلفن', 'Phone', 'Telefon')}:</strong> <span className="font-jetbrains">{invoice.buyerInfo.phone}</span></div>
            </div>
          </div>

          {/* Service breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-[#c4c5da] bg-[#fbf8ff] text-[#545f72]">
                  <th className="p-2.5 font-bold">{trText('ردیف', 'No.', 'Sıra')}</th>
                  <th className="p-2.5 font-bold">{trText('شرح خدمات', 'Service Description', 'Hizmet Açıklaması')}</th>
                  <th className="p-2.5 font-bold text-center">{trText('مسیر و محموله', 'Route & Cargo', 'Güzergâh ve Yük')}</th>
                  <th className="p-2.5 font-bold text-center">{trText('مبلغ پایه (تومان)', 'Base Amount (Tomans)', 'Taban Tutar (Tümen)')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e1ed]">
                <tr>
                  <td className="p-2.5 font-jetbrains">{trText('۱', '1', '1')}</td>
                  <td className="p-2.5 font-bold text-[#1a1b23]">{invoice.itemDescription}</td>
                  <td className="p-2.5 text-center">{invoice.route}</td>
                  <td className="p-2.5 text-center font-jetbrains font-bold text-[#00258e]">
                    {invoice.netFareTomans.toLocaleString('fa-IR')}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-jetbrains">{trText('۲', '2', '2')}</td>
                  <td className="p-2.5 text-[#545f72]">{trText('کارمزد پلتفرم ترابران و صدور حواله', 'Traberan platform commission and waybill issuance', 'Traberan platform komisyonu ve irsaliye düzenleme')}</td>
                  <td className="p-2.5 text-center">-</td>
                  <td className="p-2.5 text-center font-jetbrains">
                    {invoice.serviceFeeTomans.toLocaleString('fa-IR')}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-jetbrains">{trText('۳', '3', '3')}</td>
                  <td className="p-2.5 text-[#545f72]">{trText('حق بیمه تمام‌خطر کلوز A کالا', 'Full all-risk Class A cargo insurance', 'Tam kapsamlı A sınıfı yük sigortası')}</td>
                  <td className="p-2.5 text-center">-</td>
                  <td className="p-2.5 text-center font-jetbrains">
                    {invoice.insuranceTomans.toLocaleString('fa-IR')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Totals Box */}
          <div className="bg-[#eeedf9] p-4 rounded-2xl border border-[#c4c5da] text-xs space-y-2 max-w-sm mr-auto">
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('مجموع خالص خدمات و کارمزد', 'Net total for services and commission', 'Hizmetler ve komisyon net toplamı')}:</span>
              <span className="font-jetbrains font-bold text-[#1a1b23]">
                {invoice.subtotalTomans.toLocaleString('fa-IR')} {trText('تومان', 'Tomans', 'Tümen')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('مالیات بر ارزش افزوده (VAT ۹٪)', 'Value Added Tax (VAT 9%)', 'Katma Değer Vergisi (KDV %9)')}:</span>
              <span className="font-jetbrains font-bold text-[#1a1b23]">
                {invoice.vat9PercentTomans.toLocaleString('fa-IR')} {trText('تومان', 'Tomans', 'Tümen')}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#c4c5da] pt-2 text-sm font-black text-[#00258e]">
              <span>{trText('مبلغ نهایی پرداخت شده', 'Final amount paid', 'Ödenen nihai tutar')}:</span>
              <span className="font-jetbrains">
                {invoice.totalPayableTomans.toLocaleString('fa-IR')} {trText('تومان', 'Tomans', 'Tümen')}
              </span>
            </div>
          </div>

          {/* Payment & Tax Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e2e1ed] text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00a368]/15 text-[#00a368] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <div className="font-bold text-[#00a368]">{trText('وضعیت صورتحساب: تسویه کامل از طریق حساب امانی شاپرک', 'Invoice status: fully settled via the Shaparak escrow account', 'Fatura durumu: Shaparak emanet hesabı üzerinden tamamen ödendi')}</div>
                <div className="text-[11px] text-[#747686]">{trText('شناسه رهگیری پرداخت', 'Payment tracking reference', 'Ödeme takip referansı')}: {invoice.paymentTrackingRef}</div>
              </div>
            </div>

            <div className="text-end text-[11px] text-[#747686]">
              {trText('مهر و امضای دیجیتال سیستم ترابری ترابران', 'Digital seal and signature of the Traberan transport system', 'Traberan taşımacılık sisteminin dijital mühür ve imzası')}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav currentScreen="WALLET" onNavigate={onNavigate} />
    </div>
  );
};
