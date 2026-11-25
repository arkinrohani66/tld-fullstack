import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen, WalletTransaction } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

interface TransactionsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT';

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onNavigate }) => {
  const { role, showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { walletTransactions, chargeWallet } = useLogistics();

  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('5,000,000');

  const filteredTransactions = walletTransactions.filter((tx) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        tx.title.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.relatedEntityId && tx.relatedEntityId.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterType === 'ALL') return true;
    if (filterType === 'CREDIT') return tx.type === 'CREDIT';
    if (filterType === 'DEBIT') return tx.type === 'DEBIT';
    return true;
  });

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await chargeWallet(chargeAmount);
    setShowChargeModal(false);
  };

  // Real CSV export of the loaded transaction ledger
  const handleExportReport = () => {
    try {
      const headers = ['id', 'title', 'amount', 'type', 'date', 'relatedEntityId'];
      const rows = filteredTransactions.map((tx) =>
        [tx.id, tx.title, tx.amount, tx.type, tx.date, tx.relatedEntityId || '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tld-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('success', trText('خروجی CSV تراکنش‌ها دانلود شد.', 'Transactions CSV export downloaded.', 'İşlemler CSV dışa aktarımı indirildi.'));
    } catch (err) {
      console.error('Export failed:', err);
      showToast('error', trText('ایجاد خروجی گزارش ناموفق بود.', 'Failed to generate the report export.', 'Rapor dışa aktarımı oluşturulamadı.'));
    }
  };

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn antialiased selection:bg-[#0036c5] selection:text-white"
      dir={dir}
    >
      {/* Top App Bar */}
      <AppHeader
        currentScreen="WALLET"
        title={trText('تاریخچه تراکنش‌ها', 'Transaction History', 'İşlem Geçmişi')}
        subtitle="Financial Transactions Ledger"
        showBack={true}
        onBack={() => onNavigate(homeScreen)}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="WALLET" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Title & Top Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1b23]">
              {trText('صورت‌حساب و گردش مالی', 'Statement & Cash Flow', 'Hesap Ekstresi ve Nakit Akışı')}
            </h1>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText('جزئیات واریزی‌ها، کرایه حمل، عوارض آزادراهی و تسویه حساب‌های بانکی TLD', 'Details of deposits, freight charges, freeway tolls and TLD bank settlements', 'Yatırımlar, navlun ücretleri, otoyol geçişleri ve TLD banka hesaplaşmalarının ayrıntıları')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="bg-white border border-[#c4c5da] hover:border-[#00258e] text-[#1a1b23] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#00258e]">file_download</span>
              <span>{trText('خروجی گزارش', 'Export Report', 'Raporu Dışa Aktar')}</span>
            </button>
            <button
              onClick={() => setShowChargeModal(true)}
              className="bg-[#00258e] hover:bg-[#0036c5] text-white px-4 py-2 rounded-xl text-xs font-jetbrains font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              <span>{trText('افزایش موجودی', 'Top Up Balance', 'Bakiye Yükle')}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Chips */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm space-y-3">
          <div className="relative flex items-center w-full h-11 rounded-xl bg-[#fbf8ff] border border-[#c4c5da] focus-within:border-[#00258e] focus-within:ring-1 focus-within:ring-[#00258e] transition-all">
            <span className="material-symbols-outlined text-[#747686] ms-3 me-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={trText('جستجو با عنوان، کد پیگیری تراکنش یا شناسه بار...', 'Search by title, transaction reference or cargo ID...', 'Başlık, işlem takip kodu veya yük kimliğiyle arayın...')}
              className="w-full bg-transparent border-none outline-none font-vazirmatn text-xs text-[#1a1b23] placeholder:text-[#747686] h-full pe-3"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3.5 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-[#f4f2fe] text-[#444655] hover:bg-[#e8e7f3]'
              }`}
            >
              {trText('همه تراکنش‌ها', 'All Transactions', 'Tüm İşlemler')}
            </button>
            <button
              onClick={() => setFilterType('CREDIT')}
              className={`px-3.5 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterType === 'CREDIT'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-[#f4f2fe] text-[#444655] hover:bg-[#e8e7f3]'
              }`}
            >
              {trText('واریزی‌ها (Credit)', 'Credits', 'Gelenler (Alacak)')}
            </button>
            <button
              onClick={() => setFilterType('DEBIT')}
              className={`px-3.5 py-1.5 rounded-full font-jetbrains text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterType === 'DEBIT'
                  ? 'bg-[#00258e] text-white shadow-sm'
                  : 'bg-[#f4f2fe] text-[#444655] hover:bg-[#e8e7f3]'
              }`}
            >
              {trText('برداشت و پرداخت‌ها (Debit)', 'Debits', 'Gidenler (Borç)')}
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-sm overflow-hidden divide-y divide-[#e2e1ed]">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-[#747686] mb-2">
                receipt_long
              </span>
              <p className="text-sm font-bold text-[#1a1b23]">{trText('تراکنشی با این مشخصات یافت نشد', 'No transaction matches these details', 'Bu özelliklere uygun işlem bulunamadı')}</p>
              <p className="text-xs text-[#747686] mt-1">
                {trText('فیلترها را تغییر داده یا مجدداً جستجو نمایید.', 'Change the filters or search again.', 'Filtreleri değiştirin veya yeniden arayın.')}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'CREDIT';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 hover:bg-[#fbf8ff] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-[#00a368]/15 text-[#00a368]'
                          : 'bg-[#e8e7f3] text-[#00258e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isIncome ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1a1b23]">{tx.title}</span>
                        {tx.relatedEntityId && (
                          <span
                            className="bg-[#f4f2fe] text-[#00258e] text-[10px] font-jetbrains font-bold px-2 py-0.5 rounded border border-[#00258e]/20"
                            dir="ltr"
                          >
                            {tx.relatedEntityId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#747686] mt-0.5 font-jetbrains">
                        <span dir="ltr">{tx.id}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e1ed]">
                    <span
                      className={`font-jetbrains text-base font-bold ${
                        isIncome ? 'text-[#00a368]' : 'text-[#1a1b23]'
                      }`}
                      dir="ltr"
                    >
                      {isIncome ? `+${tx.amount}` : `-${tx.amount}`} {trText('تومان', 'Tomans', 'Tümen')}
                    </span>
                    <span className="px-2 py-0.5 bg-[#00a368]/10 text-[#00a368] font-jetbrains text-[10px] font-bold rounded mt-1">
                      {tx.status || 'SUCCESS'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#1a1b23]/50 backdrop-blur-xs"
              onClick={() => setSelectedTx(null)}
            />
            <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-2xl p-6 relative z-10 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-[#c4c5da]">
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('رسید دیجیتال تراکنش', 'Digital Transaction Receipt', 'Dijital İşlem Makbuzu')}</h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-[#747686] hover:text-[#1a1b23] p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="text-center py-2">
                <span className="font-jetbrains text-2xl font-black text-[#00258e]" dir="ltr">
                  {trText(`${selectedTx.amount} تومان`, `${selectedTx.amount} Tomans`, `${selectedTx.amount} Tümen`)}
                </span>
                <p className="text-xs text-[#545f72] mt-1">{selectedTx.title}</p>
              </div>

              <div className="bg-[#fbf8ff] p-4 rounded-xl border border-[#c4c5da] space-y-2.5 text-xs font-jetbrains">
                <div className="flex justify-between">
                  <span className="text-[#747686]">TRANSACTION ID:</span>
                  <span className="font-bold text-[#1a1b23]" dir="ltr">
                    {selectedTx.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747686]">DATE & TIME:</span>
                  <span className="text-[#1a1b23]">{selectedTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747686]">TYPE:</span>
                  <span className="font-bold text-[#00258e]">{selectedTx.type}</span>
                </div>
                {selectedTx.relatedEntityId && (
                  <div className="flex justify-between">
                    <span className="text-[#747686]">CARGO / REF ID:</span>
                    <span className="font-bold text-[#1a1b23]" dir="ltr">
                      {selectedTx.relatedEntityId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#747686]">SOURCE:</span>
                  <span className="text-[#1a1b23]">{trText('دفتر کیف پول TLD', 'TLD Wallet Ledger', 'TLD Cüzdan Defteri')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747686]">STATUS:</span>
                  <span className="text-[#00a368] font-bold">{trText('ثبت‌شده', 'Recorded', 'Kaydedildi')}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedTx(null);
                  }}
                  className="flex-1 bg-[#00258e] hover:bg-[#0036c5] text-white py-2.5 rounded-xl font-jetbrains text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span className="font-vazirmatn">{trText('بستن جزئیات', 'Close Details', 'Ayrıntıları Kapat')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recharge Modal */}
        {showChargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#1a1b23]/50 backdrop-blur-xs"
              onClick={() => setShowChargeModal(false)}
            />
            <div className="bg-white rounded-2xl border border-[#c4c5da] shadow-2xl p-6 relative z-10 max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-[#c4c5da] mb-4">
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('افزایش موجودی کیف پول', 'Top Up Wallet Balance', 'Cüzdan Bakiyesini Yükle')}</h3>
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="text-[#747686] hover:text-[#1a1b23] p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleChargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#444655] mb-1.5">{trText('مبلغ شارژ (تومان)', 'Top-up Amount (Tomans)', 'Yükleme Tutarı (Tümen)')}</label>
                  <input
                    type="text"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder={trText('مثال: ۵,۰۰۰,۰۰۰', 'e.g. 5,000,000', 'örn. 5.000.000')}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 font-jetbrains text-base font-bold text-[#00258e] text-left outline-none focus:border-[#00258e]"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2">
                  {['۱,۰۰۰,۰۰۰', '۲,۰۰۰,۰۰۰', '۵,۰۰۰,۰۰۰', '۱۰,۰۰۰,۰۰۰'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setChargeAmount(amt)}
                      className="flex-1 py-2 rounded-lg bg-[#f4f2fe] border border-[#c4c5da] text-[11px] font-bold text-[#00258e] hover:bg-[#eeedf9] cursor-pointer"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChargeModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#444655] hover:bg-[#f4f2fe] cursor-pointer"
                  >
                    {trText('انصراف', 'Cancel', 'İptal')}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#00258e] hover:bg-[#0036c5] text-white px-5 py-2.5 rounded-xl text-xs font-jetbrains font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">payment</span>
                    <span className="font-vazirmatn">{trText('اتصال به درگاه بانکی', 'Connect to Bank Gateway', 'Banka Geçidine Bağlan')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="WALLET" onNavigate={onNavigate} />
    </div>
  );
};
