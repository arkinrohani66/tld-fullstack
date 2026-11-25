import React, { useState, useEffect } from 'react';
import { platformRevenueService, PlatformRevenueSummary, PlatformRevenueEntry } from '../../services/platformRevenueService';
import { useLanguage } from '../../context/LanguageContext';

interface PlatformRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformRevenueModal: React.FC<PlatformRevenueModalProps> = ({ isOpen, onClose }) => {
  const { trText } = useLanguage();
  const [summary, setSummary] = useState<PlatformRevenueSummary>(platformRevenueService.getRevenueSummary());
  const [ledger, setLedger] = useState<PlatformRevenueEntry[]>(platformRevenueService.getRevenueLedger());
  const [filter, setFilter] = useState<'ALL' | 'COLLECTED' | 'LOCKED'>('ALL');

  useEffect(() => {
    const updateData = () => {
      setSummary(platformRevenueService.getRevenueSummary());
      setLedger(platformRevenueService.getRevenueLedger());
    };
    const unsubscribe = platformRevenueService.subscribe(updateData);
    updateData();
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLedger = ledger.filter((entry) => {
    if (filter === 'COLLECTED') return entry.status === 'COLLECTED_IN_TREASURY';
    if (filter === 'LOCKED') return entry.status === 'LOCKED_IN_ESCROW';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-vazirmatn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#c4c5da] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#00258e] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-white text-[28px]">payments</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base md:text-lg">{trText('سامانه مدیریت درآمد و کارمزدهای پلتفرم', 'Platform Revenue & Commission Management', 'Platform Gelir ve Komisyon Yönetimi')}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00a368] text-white text-[10px] font-bold">
                  {trText('کارمزد ۵٪ مصوب', 'Approved 5% commission', 'Onaylı %5 komisyon')}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {trText('دفتر کل شفاف کسر ۵ درصد کارمزد سامانه از کرایه‌ها هنگام مسدودی در حساب امانی', 'Transparent ledger of the 5% platform commission deducted from freight rates on escrow hold', 'Navlunlardan emanet hesapta bloke sırasında kesilen %5 platform komisyonunun şeffaf defteri')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#f4f2fe] border border-[#c4c5da]">
              <div className="text-[11px] text-[#545f72] font-bold">{trText('کل کارمزد وصول‌شده (۵٪)', 'Total commission collected (5%)', 'Tahsil edilen toplam komisyon (%5)')}</div>
              <div className="text-base md:text-lg font-extrabold font-jetbrains text-[#00258e] mt-1">
                {summary.totalCommissionEarnedTomans.toLocaleString('fa-IR')}
                <span className="text-[10px] font-vazirmatn text-[#545f72] mr-1">{trText('تومان', 'Toman', 'Tümen')}</span>
              </div>
              <div className="text-[10px] text-[#00a368] font-bold mt-1 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                <span>{trText('درآمد خالص سامانه', 'Net platform revenue', 'Net platform geliri')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#eeedf9] border border-[#c4c5da]">
              <div className="text-[11px] text-[#545f72] font-bold">{trText('موجودی صندوق خزانه‌داری', 'Treasury fund balance', 'Hazine fonu bakiyesi')}</div>
              <div className="text-base md:text-lg font-extrabold font-jetbrains text-[#1a1b23] mt-1">
                {summary.treasuryBalanceTomans.toLocaleString('fa-IR')}
                <span className="text-[10px] font-vazirmatn text-[#545f72] mr-1">{trText('تومان', 'Toman', 'Tümen')}</span>
              </div>
              <div className="text-[10px] text-[#545f72] font-bold mt-1">{trText('حساب متمرکز بانکی', 'Centralized bank account', 'Merkezi banka hesabı')}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fff8e1] border border-[#ffe082]">
              <div className="text-[11px] text-[#795548] font-bold">{trText('کارمزد امانی در صف', 'Escrow commission pending', 'Sıradaki emanet komisyonu')}</div>
              <div className="text-base md:text-lg font-extrabold font-jetbrains text-[#f57c00] mt-1">
                {summary.pendingEscrowCommissionTomans.toLocaleString('fa-IR')}
                <span className="text-[10px] font-vazirmatn text-[#795548] mr-1">{trText('تومان', 'Toman', 'Tümen')}</span>
              </div>
              <div className="text-[10px] text-[#f57c00] font-bold mt-1">{trText('بلوکه‌شده در شاپرک', 'Locked in Shaparak', "Shaparak'ta bloke")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#e8f5e9] border border-[#a5d6a7]">
              <div className="text-[11px] text-[#2e7d32] font-bold">{trText('مالیات بر ارزش افزوده (۹٪)', 'Value added tax (9%)', 'Katma değer vergisi (%9)')}</div>
              <div className="text-base md:text-lg font-extrabold font-jetbrains text-[#00a368] mt-1">
                {summary.totalVatTaxCollectedTomans.toLocaleString('fa-IR')}
                <span className="text-[10px] font-vazirmatn text-[#2e7d32] mr-1">{trText('تومان', 'Toman', 'Tümen')}</span>
              </div>
              <div className="text-[10px] text-[#2e7d32] font-bold mt-1">{trText('مشمول اظهارنامه مالیاتی', 'Included in tax return', 'Vergi beyanına dahil')}</div>
            </div>
          </div>

          {/* Revenue Mechanism Diagram */}
          <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-3">
            <h3 className="font-extrabold text-xs text-[#1a1b23] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#00258e] text-[18px]">account_tree</span>
              <span>{trText('چرخه هوشمند کسر و واریز درآمد ۵٪ پلتفرم:', 'Smart cycle for deducting and depositing the 5% platform revenue:', 'Platformun %5 gelirinin kesilme ve yatırılma döngüsü:')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#c4c5da] space-y-1">
                <div className="flex items-center gap-2 text-[#00258e] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#00258e] text-white flex items-center justify-center text-[10px]">{trText('۱', '1', '1')}</span>
                  <span>{trText('واریز به حساب امانی شاپرک', 'Deposit to Shaparak escrow account', 'Shaparak emanet hesabına yatırma')}</span>
                </div>
                <p className="text-[11px] text-[#545f72]">
                  {trText('هنگامی که صاحب کالا مبلغ بارنامه را پرداخت می‌کند، وجه در حساب امن امانی مسدود می‌گردد.', 'When the shipper pays the waybill amount, the funds are locked in the secure escrow account.', 'Yük sahibi irsaliye tutarını ödediğinde, para güvenli emanet hesabında bloke edilir.')}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#00a368] space-y-1 relative">
                <div className="flex items-center gap-2 text-[#00a368] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#00a368] text-white flex items-center justify-center text-[10px]">{trText('۲', '2', '2')}</span>
                  <span>{trText('کارمزد ۵٪ + ۹٪ مالیات (بر عهده صاحب بار)', '5% commission + 9% tax (borne by the shipper)', '%5 komisyon + %9 vergi (yük sahibine ait)')}</span>
                </div>
                <p className="text-[11px] text-[#545f72]">
                  {trText('۵ درصد کارمزد سامانه و ۹ درصد مالیات بر ارزش افزوده آن، روی کرایه محاسبه و توسط صاحب بار به مبلغ اسکرو اضافه می‌شود و به خزانه‌داری منتقل و در دفتر کل ثبت می‌گردد.', 'The 5% platform commission plus 9% VAT on it are calculated on the freight rate, added to the escrow amount by the shipper, transferred to the treasury and recorded in the ledger.', 'Platformun %5 komisyonu ve bunun üzerindeki %9 KDV navlun ücreti üzerinden hesaplanır, yük sahibi tarafından emanet tutarına eklenir, hazineye aktarılır ve deftere kaydedilir.')}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#c4c5da] space-y-1">
                <div className="flex items-center gap-2 text-[#6750a4] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#6750a4] text-white flex items-center justify-center text-[10px]">{trText('۳', '3', '3')}</span>
                  <span>{trText('تسویه ۱۰۰٪ کرایه با راننده', '100% freight settlement to the driver', 'Sürücüye %100 navlun ödemesi')}</span>
                </div>
                <p className="text-[11px] text-[#545f72]">
                  {trText('پس از رسیدن بار به مقصد، ثبت POD و کد OTP، کل کرایه توافق‌شده بدون کسر کارمزد به کیف پول راننده واریز می‌شود.', 'After the cargo arrives, POD and OTP are recorded and the full agreed freight is credited to the driver wallet without any commission deduction.', 'Kargo varış noktasına ulaşıp POD ve OTP kaydedildikten sonra, anlaşılan navlunun tamamı komisyon kesintisi yapılmadan sürücü cüzdanına aktarılır.')}
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="font-extrabold text-xs md:text-sm text-[#1a1b23] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00258e] text-[18px]">receipt_long</span>
                <span>{trText('دفتر کل ثبت کارمزدهای دریافتی (Platform Revenue Ledger)', 'Platform Revenue Ledger', 'Tahsil Edilen Komisyonlar Defteri (Platform Revenue Ledger)')}</span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center bg-[#eeedf9] p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'ALL' ? 'bg-[#00258e] text-white shadow-xs' : 'text-[#545f72] hover:text-[#1a1b23]'
                  }`}
                >
                  {trText(`همه تراکنش‌ها (${ledger.length})`, `All transactions (${ledger.length})`, `Tüm işlemler (${ledger.length})`)}
                </button>
                <button
                  onClick={() => setFilter('COLLECTED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'COLLECTED' ? 'bg-[#00a368] text-white shadow-xs' : 'text-[#545f72] hover:text-[#1a1b23]'
                  }`}
                >
                  {trText('وصول‌شده به خزانه‌داری', 'Collected by treasury', 'Hazineye tahsil edildi')}
                </button>
                <button
                  onClick={() => setFilter('LOCKED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'LOCKED' ? 'bg-[#f57c00] text-white shadow-xs' : 'text-[#545f72] hover:text-[#1a1b23]'
                  }`}
                >
                  {trText('در صف امانی', 'Pending escrow', 'Emanet sırasında')}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#c4c5da] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#f4f2fe] text-[#545f72] border-b border-[#e2e1ed] font-bold">
                    <tr>
                      <th className="p-3">{trText('کد بار / شناسه', 'Cargo Code / ID', 'Kargo Kodu / Kimlik')}</th>
                      <th className="p-3">{trText('عنوان محموله و طرفین', 'Cargo Title & Parties', 'Kargo Başlığı ve Taraflar')}</th>
                      <th className="p-3">{trText('کل کرایه بار', 'Total Freight', 'Toplam Navlun')}</th>
                      <th className="p-3">{trText('کارمزد سامانه (۵٪)', 'Platform Commission (5%)', 'Platform Komisyonu (%5)')}</th>
                      <th className="p-3">{trText('مالیات (۹٪)', 'Tax (9%)', 'Vergi (%9)')}</th>
                      <th className="p-3">{trText('درآمد ناخالص', 'Gross Revenue', 'Brüt Gelir')}</th>
                      <th className="p-3">{trText('وضعیت و تاریخ', 'Status & Date', 'Durum ve Tarih')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e1ed]">
                    {filteredLedger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#fbf8ff] transition-colors">
                        <td className="p-3 font-jetbrains font-bold text-[#00258e]">
                          <div>{entry.cargoId}</div>
                          <div className="text-[10px] text-[#545f72] font-normal">{entry.escrowRef}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#1a1b23] line-clamp-1 max-w-[200px]">
                            {trText(entry.cargoTitle)}
                          </div>
                          <div className="text-[10px] text-[#545f72]">
                            {trText('صاحب بار:', 'Shipper:', 'Yük sahibi:')} {entry.shipperName} | {trText('راننده:', 'Driver:', 'Sürücü:')} {entry.driverName}
                          </div>
                        </td>
                        <td className="p-3 font-jetbrains font-bold text-[#1a1b23]">
                          {trText(`${entry.freightAmountTomans.toLocaleString('fa-IR')} تومان`, `${entry.freightAmountTomans.toLocaleString('fa-IR')} Toman`, `${entry.freightAmountTomans.toLocaleString('fa-IR')} Tümen`)}
                        </td>
                        <td className="p-3 font-jetbrains font-bold text-[#00a368]">
                          {trText(`+${entry.commissionAmountTomans.toLocaleString('fa-IR')} تومان`, `+${entry.commissionAmountTomans.toLocaleString('fa-IR')} Toman`, `+${entry.commissionAmountTomans.toLocaleString('fa-IR')} Tümen`)}
                        </td>
                        <td className="p-3 font-jetbrains text-[#545f72]">
                          {trText(`+${entry.vatTaxTomans.toLocaleString('fa-IR')} تومان`, `+${entry.vatTaxTomans.toLocaleString('fa-IR')} Toman`, `+${entry.vatTaxTomans.toLocaleString('fa-IR')} Tümen`)}
                        </td>
                        <td className="p-3 font-jetbrains font-black text-[#00258e]">
                          {trText(`${entry.totalPlatformCutTomans.toLocaleString('fa-IR')} تومان`, `${entry.totalPlatformCutTomans.toLocaleString('fa-IR')} Toman`, `${entry.totalPlatformCutTomans.toLocaleString('fa-IR')} Tümen`)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {entry.status === 'COLLECTED_IN_TREASURY' ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#00a368]/15 text-[#00a368] font-bold text-[10px]">
                                {trText('واریز به خزانه‌داری', 'Deposited to treasury', 'Hazineye yatırıldı')}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#f57c00]/15 text-[#f57c00] font-bold text-[10px]">
                                {trText('مسدود در امانی', 'Locked in escrow', 'Emanette bloke')}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#545f72] mt-0.5">{entry.timestamp}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f4f2fe] border-t border-[#e2e1ed] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[#545f72] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00a368] text-[18px]">verified</span>
            <span>{trText('تمام محاسبات ۵٪ طبق ماده ۳۸ قانون تجارت الکترونیک و درگاه بانکی شاپرک ثبت امن می‌گردند.', 'All 5% calculations are securely recorded under Article 38 of the E-Commerce Law and the Shaparak payment gateway.', 'Tüm %5 hesaplamaları E-Ticaret Kanunu 38. maddesi ve Shaparak ödeme geçidi kapsamında güvenle kaydedilir.')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#00258e] text-white font-bold text-xs hover:bg-[#0036c5] transition-colors cursor-pointer w-full sm:w-auto"
          >
            {trText('بستن پنجره', 'Close Window', 'Pencereyi Kapat')}
          </button>
        </div>
      </div>
    </div>
  );
};
