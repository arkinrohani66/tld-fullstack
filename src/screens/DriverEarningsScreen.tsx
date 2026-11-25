import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, DriverEarningRecord, DriverSettlementRecord } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { driverEarningsService } from '../services/driverEarningsService';
import { walletService } from '../services/walletService';

interface DriverEarningsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverEarningsScreen: React.FC<DriverEarningsScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [earnings, setEarnings] = useState<DriverEarningRecord[]>([]);
  const [settlements, setSettlements] = useState<DriverSettlementRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'EARNINGS' | 'SETTLEMENTS'>('EARNINGS');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [eData, sData, balance] = await Promise.all([
      driverEarningsService.fetchEarnings(),
      driverEarningsService.fetchSettlements(),
      walletService.fetchWalletBalance(),
    ]);
    setEarnings(eData);
    setSettlements(sData);
    setWalletBalance(balance);
  };

  const totalEarningsNet = earnings.reduce((acc, curr) => acc + curr.netEarnings, 0);
  const totalEarningsGross = earnings.reduce((acc, curr) => acc + curr.grossFare, 0);
  const availableForCashout = walletBalance; // Real withdrawable balance from the wallet ledger

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('error', trText('مبلغ نامعتبر است.', 'Invalid amount.', 'Geçersiz tutar.'));
      return;
    }
    if (amountNum > availableForCashout) {
      showToast('error', trText(`مبلغ درخواستی بیشتر از موجودی قابل تسویه (${availableForCashout.toLocaleString('fa-IR')} تومان) است.`, `The requested amount exceeds the available settlement balance (${availableForCashout.toLocaleString('fa-IR')} Toman).`, `Talep edilen tutar, kullanılabilir mutabakat bakiyesini (${availableForCashout.toLocaleString('fa-IR')} Tümen) aşıyor.`));
      return;
    }

    try {
      await driverEarningsService.requestInstantPayout(amountNum, iban, bankName);
      showToast('success', trText('درخواست تسویه پایا با موفقیت ثبت شد و در سیکل بانکی بعدی واریز می‌گردد.', 'The Paya settlement request was registered successfully and will be transferred in the next banking cycle.', 'Paya mutabakat talebi başarıyla kaydedildi ve bir sonraki banka döngüsünde aktarılacak.'));
      setShowPayoutModal(false);
      await loadData();
    } catch (err) {
      console.error('Payout request failed:', err);
      showToast('error', err instanceof Error ? err.message : trText('ثبت درخواست تسویه ناموفق بود.', 'Submitting the settlement request failed.', 'Mutabakat talebi kaydedilemedi.'));
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      <AppHeader
        currentScreen="DRIVER_EARNINGS"
        title={trText('درآمد و تسویه حساب راننده', 'Driver Earnings & Settlements', 'Sürücü Kazancı ve Mutabakat')}
        subtitle="Earnings Analytics & Paya Settlements"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_EARNINGS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Balance & KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#00258e] text-white p-6 rounded-2xl shadow-md space-y-3">
            <div className="flex justify-between items-center text-xs opacity-80">
              <span>{trText('موجودی قابل تسویه راننده', 'Withdrawable balance', 'Kullanılabilir bakiye')}</span>
              <span className="material-symbols-outlined text-20px">account_balance_wallet</span>
            </div>
            <div className="text-2xl md:text-3xl font-black font-jetbrains">
              {availableForCashout.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowPayoutModal(true)}
                className="w-full bg-white hover:bg-[#eeedf9] text-[#00258e] font-black text-xs py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-18px">payments</span>
                <span>{trText('درخواست تسویه آنی پایا / شبا', 'Request Instant Paya / IBAN Payout', 'Anında Paya / IBAN Ödemesi Talep Et')}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-[#747686]">
              <span>{trText('مجموع درآمد ناخالص ثبت‌شده', 'Total recorded gross earnings', 'Kayıtlı toplam brüt kazanç')}</span>
              <span className="material-symbols-outlined text-20px text-[#00a368]">trending_up</span>
            </div>
            <div className="text-xl font-bold font-jetbrains text-[#1a1b23]">
              {totalEarningsGross.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}
            </div>
            <p className="text-[11px] text-[#545f72]">
              {trText('پیش از کسر کارمزد ۵٪ سامانه', 'Before the 5% platform commission', 'Platform komisyonu (%5) düşülmeden önce')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-[#747686]">
              <span>{trText('سفرهای تسویه‌شده', 'Settled trips', 'Mutabakatı tamamlanan seferler')}</span>
              <span className="material-symbols-outlined text-20px text-[#0036c5]">route</span>
            </div>
            <div className="text-xl font-bold font-jetbrains text-[#1a1b23]">
              {earnings.length.toLocaleString('fa-IR')} {trText('سفر', 'trips', 'sefer')}
            </div>
            <p className="text-[11px] text-[#545f72]">
              {trText('به‌صورت خودکار پس از آزادسازی امانی ثبت می‌شود', 'Recorded automatically after escrow release', 'Emanet serbest bırakıldıktan sonra otomatik kaydedilir')}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#c4c5da] pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EARNINGS'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">receipt</span>
            <span>{trText('تفکیک درآمد سفرها (', 'Trip earnings breakdown (', 'Sefer kazanç dökümü (')}{earnings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTLEMENTS')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SETTLEMENTS'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
            }`}
          >
            <span className="material-symbols-outlined text-18px">history_edu</span>
            <span>{trText('تاریخچه واریزها و تسویه‌ها (', 'Payout & settlement history (', 'Ödeme ve mutabakat geçmişi (')}{settlements.length})</span>
          </button>
        </div>

        {/* Tab 1: Earnings Breakdown */}
        {activeTab === 'EARNINGS' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
              {trText('فهرست درآمدهای ثبت شده به تفکیک سفر', 'Recorded earnings by trip', 'Sefer bazında kayıtlı kazançlar')}
            </h3>

            <div className="space-y-3">
              {earnings.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#747686]">receipt_long</span>
                  <p className="text-xs text-[#545f72] mt-2">
                    {trText('هنوز درآمدی ثبت نشده است؛ درآمد سفرها پس از تأیید تحویل و آزادسازی حساب امانی به‌صورت خودکار اینجا ثبت می‌شود.', 'No earnings recorded yet; trip earnings are recorded here automatically after delivery is confirmed and the escrow account is released.', 'Henüz kazanç kaydedilmedi; sefer kazançları teslimat onaylanıp emanet hesabı serbest bırakıldıktan sonra buraya otomatik olarak kaydedilir.')}
                  </p>
                </div>
              ) : (
                earnings.map((e) => (
                  <div
                    key={e.id}
                    className="p-4 rounded-xl border border-[#e2e1ed] bg-[#fbf8ff] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-[#1a1b23]">{e.cargoTitle}</div>
                      <div className="text-[#545f72]">
                        {trText('سفر', 'Trip', 'Sefer')} {e.tripId} • {e.originCity} {trText('به', 'to', '→')} {e.destinationCity} • {e.date}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-[#747686] text-[10px] block">{trText('کرایه ناخالص', 'Gross fare', 'Brüt navlun')}</span>
                        <span className="font-jetbrains font-bold">{e.grossFare.toLocaleString('fa-IR')}</span>
                      </div>
                      <div>
                        <span className="text-[#ba1a1a] text-[10px] block">{trText('کارمزد TLD (۵٪)', 'TLD commission (5%)', 'TLD komisyonu (%5)')}</span>
                        <span className="font-jetbrains font-bold text-[#ba1a1a]">-{e.commission.toLocaleString('fa-IR')}</span>
                      </div>
                      <div>
                        <span className="text-[#00a368] text-[10px] block font-bold">{trText('خالص دریافتی', 'Net payout', 'Net ödeme')}</span>
                        <span className="font-jetbrains font-black text-sm text-[#00a368]">
                          {e.netEarnings.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Settlements History */}
        {activeTab === 'SETTLEMENTS' && (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
            <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
              {trText('سوابق واریز شبا و حواله‌های پایا به حساب راننده', 'IBAN payouts and Paya transfers to the driver account', 'Sürücü hesabına IBAN ve Paya havalesi geçmişi')}
            </h3>

            <div className="space-y-3">
              {settlements.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#747686]">history_edu</span>
                  <p className="text-xs text-[#545f72] mt-2">
                    {trText('هنوز درخواست تسویه‌ای ثبت نشده است.', 'No settlement request has been submitted yet.', 'Henüz mutabakat talebi oluşturulmadı.')}
                  </p>
                </div>
              ) : (
                settlements.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#e2e1ed] bg-[#fbf8ff] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#e6f4ea] text-[#137333] font-bold text-[10px] px-2 py-0.5 rounded border border-[#a8dab5]">
                        {s.status === 'SUCCESS' ? trText('واریز موفق', 'Payout successful', 'Ödeme başarılı') : trText('در حال پردازش', 'Processing', 'İşleniyor')}
                      </span>
                      <span className="font-jetbrains font-bold text-[#1a1b23]" dir="ltr">
                        {s.referenceCode}
                      </span>
                    </div>
                    <div className="text-[#545f72]">
                      {trText('شماره شبا:', 'IBAN:', 'IBAN:')} <strong className="font-jetbrains" dir="ltr">{s.iban}</strong> ({s.bankName})
                    </div>
                    <div className="text-[11px] text-[#747686]">
                      {trText('کد پیگیری بانکی:', 'Bank tracking code:', 'Banka takip kodu:')} <span className="font-jetbrains">{s.trackingCode}</span> {trText('• زمان درخواست:', '• Requested at:', '• Talep zamanı:')} {s.requestedAt}
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-lg font-black text-[#00258e] font-jetbrains">
                      {s.amountFormatted}
                    </div>
                    <span className="text-[10px] text-[#00a368]">
                      {s.status === 'SUCCESS' ? trText('تسویه کامل', 'Fully settled', 'Tamamen ödendi') : trText('در صف واریز', 'Queued for payout', 'Ödeme kuyruğunda')}
                    </span>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Request Payout */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#c4c5da] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">account_balance</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('درخواست تسویه و انتقال به شبا', 'Request Settlement to IBAN', 'IBAN Hesabına Mutabakat Talebi')}</h3>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-[#747686] hover:text-[#1a1b23]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('مبلغ درخواستی (تومان)', 'Requested amount (Toman)', 'Talep edilen tutar (Tümen)')}</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-jetbrains font-bold text-sm"
                  max={availableForCashout}
                  required
                />
                <span className="text-[10px] text-[#747686] mt-0.5 block">
                  {trText('حداکثر سقف مجاز:', 'Maximum allowed:', 'İzin verilen üst sınır:')} {availableForCashout.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Tümen')}
                </span>
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('شماره شبا مقصد (IR)', 'Destination IBAN (IR)', 'Hedef IBAN (IR)')}</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-jetbrains font-bold"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('نام بانک', 'Bank name', 'Banka adı')}</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-bold"
                  required
                />
              </div>

              <div className="p-3 bg-[#e8e7f3] rounded-xl text-[11px] text-[#545f72] leading-relaxed">
                {trText('تسویه‌های پایا در دو نوبت کاری بانکی (ساعت ۱۳:۴۵ و ۰۴:۰۰ بامداد) مستقیماً به حساب شبا واریز می‌گردند.', 'Paya settlements are transferred directly to the IBAN account in two banking cycles (13:45 and 04:00 AM).', 'Paya mutabakatları iki banka döngüsünde (13:45 ve 04:00) doğrudan IBAN hesabına aktarılır.')}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'Vazgeç')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00258e] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#0036c5]"
                >
                  {trText('تأیید و ثبت درخواست واریز', 'Confirm & Submit Payout Request', 'Onayla ve Ödeme Talebini Gönder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
