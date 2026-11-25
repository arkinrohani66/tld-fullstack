import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { PlatformRevenueModal } from '../components/revenue/PlatformRevenueModal';

interface WalletScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigate }) => {
  const { role, showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const {
    walletBalance,
    driverIncomeToday,
    shipperPendingPayment,
    shipperSettledMonth,
    monthlyTurnover,
    walletTransactions,
    chargeWallet,
  } = useLogistics();

  const [chargeAmount, setChargeAmount] = useState('5,000,000');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await chargeWallet(chargeAmount);
    setShowRechargeModal(false);
  };

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      {/* Top App Bar */}
      <AppHeader
        currentScreen="WALLET"
        title={trText('کیف پول و مالی', 'Wallet & Finance', 'Cüzdan ve Finans')}
        subtitle="TLD Financials & Tolls"
        showBack={true}
        onBack={() => onNavigate(homeScreen)}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="WALLET" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="font-vazirmatn text-2xl md:text-3xl font-extrabold text-[#1a1b23]">
              {trText('امور مالی و کیف پول هوشمند', 'Finance & Smart Wallet', 'Finans ve Akıllı Cüzdan')}
            </h1>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText('تسویه حساب‌های نقدی بارنامه، پرداخت خودکار عوارض آزادراهی و گزارش تراکنش‌ها', 'Cash waybill settlements, automatic freeway toll payments and transaction reports', 'Nakit irsaliye hesaplaşmaları, otomatik otoyol geçiş ödemeleri ve işlem raporları')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRevenueModal(true)}
              className="bg-[#f4f2fe] border border-[#c4c5da] text-[#00258e] px-4 py-2.5 rounded-xl font-jetbrains text-xs font-bold hover:bg-[#00258e] hover:text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span className="font-vazirmatn">{trText('درآمد ۵٪ سامانه', '5% Platform Fee', 'Platformun %5 Geliri')}</span>
            </button>

            <button
              onClick={() => setShowRechargeModal(true)}
              className="bg-[#00258e] text-white px-5 py-2.5 rounded-xl font-jetbrains text-xs font-bold hover:bg-[#0036c5] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              <span className="font-vazirmatn">{trText('افزایش موجودی', 'Top Up Balance', 'Bakiye Yükle')}</span>
            </button>
          </div>
        </div>

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Balance */}
          <div className="bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm flex flex-col justify-between">
            <span className="font-vazirmatn text-xs text-[#545f72]">{trText('موجودی قابل برداشت', 'Available Balance', 'Çekilebilir Bakiye')}</span>
            <div className="my-2">
              <span className="font-jetbrains text-2xl md:text-3xl font-extrabold text-[#00258e]" dir="ltr">
                {role === 'SHIPPER' ? `${shipperSettledMonth}` : trText(`${walletBalance} تومان`, `${walletBalance} Tomans`, `${walletBalance} Tümen`)}
              </span>
            </div>
            <div className="text-[11px] text-[#545f72] font-vazirmatn">
              {role === 'SHIPPER'
                ? trText('مجموع محموله‌های تسویه‌شده ماه جاری', 'Total shipments settled this month', 'Bu ay hesaplaşılan yüklerin toplamı')
                : trText(`درآمد امروز: ${driverIncomeToday} تومان`, `Today income: ${driverIncomeToday} Tomans`, `Bugünkü gelir: ${driverIncomeToday} Tümen`)}
            </div>
          </div>

          {/* Pending Escrow Card */}
          <div className="bg-[#f4f2fe] p-5 rounded-2xl border border-[#c4c5da] shadow-xs flex flex-col justify-between text-[#00258e]">
            <div className="flex justify-between items-center">
              <span className="font-vazirmatn text-xs font-bold">{trText('وجه امانی در انتظار آزادسازی', 'Escrow Pending Release', 'Serbest Bırakılmayı Bekleyen Emanet')}</span>
              <span className="material-symbols-outlined text-[20px] text-[#00258e]">lock</span>
            </div>
            <div className="my-2">
              <span className="font-jetbrains text-xl md:text-2xl font-bold" dir="ltr">
                {shipperPendingPayment}
              </span>
            </div>
            <div className="text-[11px] text-[#545f72] font-vazirmatn">
              {trText('مجموع محموله‌هایی که کرایه آن‌ها مسدود شده است', 'Total shipments whose freight payment is blocked', 'Navlun bedeli bloke edilmiş yüklerin toplamı')}
            </div>
          </div>

          {/* Monthly Turnover */}
          <div className="bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-xs flex flex-col justify-between">
            <span className="font-vazirmatn text-xs text-[#545f72]">{trText('گردش مالی ماه جاری', 'Current Month Turnover', 'Bu Ayki Ciro')}</span>
            <div className="my-2">
              <span className="font-jetbrains text-xl md:text-2xl font-bold text-[#1a1b23]" dir="ltr">
                {monthlyTurnover}
              </span>
            </div>
            <div className="text-[11px] text-[#545f72] font-vazirmatn">
              {trText('مجموع تراکنش‌های ثبت‌شده در دفتر کیف پول', 'Total transactions recorded in the wallet ledger', 'Cüzdan defterine kaydedilen işlemlerin toplamı')}
            </div>
          </div>
        </div>

        {/* Transactions History */}
        <div className="bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm space-y-4">
          <h2 className="font-vazirmatn text-base font-bold text-[#1a1b23] border-b border-[#e2e1ed] pb-3">
            {trText('تاریخچه آخرین تراکنش‌ها', 'Recent Transactions', 'Son İşlemler')}
          </h2>

          <div className="space-y-3">
            {walletTransactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#e2e1ed] hover:bg-[#fbf8ff] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit ? 'bg-[#00a368]/10 text-[#00a368]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isCredit ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <div className="font-vazirmatn text-sm font-bold text-[#1a1b23]">
                        {tx.title}
                      </div>
                      <div className="font-jetbrains text-[11px] text-[#747686] mt-0.5" dir="ltr">
                        {tx.id} • {tx.date}
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <div
                      className={`font-jetbrains text-sm font-bold ${
                        isCredit ? 'text-[#00a368]' : 'text-[#ba1a1a]'
                      }`}
                      dir="ltr"
                    >
                      {tx.amount}
                    </div>
                    <span
                      className={`text-[10px] font-jetbrains font-bold px-2 py-0.5 rounded ${
                        tx.status === 'SUCCESS'
                          ? 'bg-[#00a368]/10 text-[#00a368]'
                          : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Recharge Wallet */}
        {showRechargeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#c4c5da] shadow-2xl space-y-4 font-vazirmatn">
              <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
                <h3 className="text-lg font-bold text-[#1a1b23]">{trText('شارژ کیف پول TLD', 'Top Up TLD Wallet', 'TLD Cüzdanını Yükle')}</h3>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="text-[#747686] hover:text-[#ba1a1a]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleChargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#545f72] font-semibold mb-1">
                    {trText('مبلغ شارژ (تومان)', 'Top-up Amount (Tomans)', 'Yükleme Tutarı (Tümen)')}
                  </label>
                  <input
                    type="text"
                    required
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 font-jetbrains font-bold text-lg text-[#00258e]"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2">
                  {['1,000,000', '5,000,000', '10,000,000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setChargeAmount(amt)}
                      className="flex-1 py-1.5 bg-[#eeedf9] hover:bg-[#dde1ff] rounded-lg text-xs font-jetbrains font-bold text-[#00258e] transition-colors"
                      dir="ltr"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-[#fff9e6] rounded-xl border border-[#ffe082] text-[11px] text-[#7a5900] leading-relaxed">
                  {trText('درگاه پرداخت بانکی هنوز به سامانه متصل نیست؛ با فعال‌سازی درگاه، شارژ مستقیماً از طریق شاپرک انجام خواهد شد.', 'The bank payment gateway is not connected yet. Once it is enabled, top-ups will be processed directly through Shaparak.', 'Banka ödeme geçidi henüz sisteme bağlı değil. Geçit etkinleştirildiğinde yükleme doğrudan Şaparak üzerinden yapılacaktır.')}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00258e] text-white py-3 rounded-xl font-jetbrains text-xs font-bold hover:bg-[#0036c5] cursor-pointer"
                  >
                    {trText('ثبت درخواست شارژ', 'Submit Top-up Request', 'Yükleme Talebini Gönder')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRechargeModal(false)}
                    className="px-4 py-3 border border-[#c4c5da] rounded-xl text-xs font-jetbrains hover:bg-[#f4f2fe] cursor-pointer"
                  >
                    {trText('انصراف', 'Cancel', 'İptal')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Platform Revenue & Commission Ledger Modal */}
        <PlatformRevenueModal
          isOpen={showRevenueModal}
          onClose={() => setShowRevenueModal(false)}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="WALLET" onNavigate={onNavigate} />
    </div>
  );
};
