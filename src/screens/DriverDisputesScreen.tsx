import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, DriverDisputeItem, DisputeType } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { driverDisputeService } from '../services/driverDisputeService';

interface DriverDisputesScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverDisputesScreen: React.FC<DriverDisputesScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [disputes, setDisputes] = useState<DriverDisputeItem[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [disputeType, setDisputeType] = useState<DisputeType>('DEMURRAGE_CLAIM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('2000000');
  const [tripId, setTripId] = useState('TRP-9021');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    const data = await driverDisputeService.fetchDisputes();
    setDisputes(data);
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('error', trText('لطفاً عنوان و شرح کامل اختلاف را بنویسید.', 'Please enter a title and a full description of the dispute.', 'Lütfen anlaşmazlık için bir başlık ve tam açıklama yazın.'));
      return;
    }

    await driverDisputeService.submitDispute({
      disputeType,
      title,
      description,
      claimedAmount: Number(claimedAmount) || 0,
      tripId,
      cargoTitle: trText('مواد اولیه دارویی و زنجیره سرد', 'Pharmaceutical raw materials and cold chain', 'İlaç hammaddeleri ve soğuk zincir'),
    });

    showToast('success', trText('شکایت / درخواست شما در سامانه داوری TLD ثبت شد.', 'Your complaint / request was registered in the TLD arbitration system.', 'Şikayetiniz / talebiniz TLD tahkim sistemine kaydedildi.'));
    setShowNewModal(false);
    setTitle('');
    setDescription('');
    await loadDisputes();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return (
          <span className="bg-[#fff8e1] text-[#b27b00] border border-[#ffe082] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {trText('در حال بررسی کارشناس داوری', 'Under review by arbitration specialist', 'Tahkim uzmanı tarafından inceleniyor')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-[#e6f4ea] text-[#137333] border border-[#a8dab5] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {trText('تأیید و خسارت پرداخت شد', 'Approved and compensation paid', 'Onaylandı ve tazminat ödendi')}
          </span>
        );
      case 'RESOLVED_WITH_PAYOUT':
        return (
          <span className="bg-[#e8f0fe] text-[#1967d2] border border-[#aecbfa] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {trText('مختومه با توافق طرفین', 'Closed by mutual agreement', 'Tarafların anlaşmasıyla kapatıldı')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      <AppHeader
        currentScreen="DRIVER_DISPUTES"
        title={trText('شکایات، دموراژ و سوانح جاده‌ای', 'Disputes, Demurrage & Road Incidents', 'Anlaşmazlıklar, Demuraj ve Yol Kazaları')}
        subtitle="Demurrage Claims & SOS Incident Arbitration"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_DISPUTES" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-28px">gavel</span>
              <h1 className="font-vazirmatn text-xl md:text-2xl font-black text-[#1a1b23]">
                {trText('رسیدگی به اختلافات، حق توقف و سوانح', 'Dispute, Demurrage & Incident Handling', 'Anlaşmazlık, Bekleme Ücreti ve Kaza Süreçleri')}
              </h1>
            </div>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText('مطالبه خسارت دموراژ انبارها، گزارش معطلی، عدم واریز کرایه یا امداد اضطراری جاده‌ای تحت نظارت کمیته داوری TLD', 'Warehouse demurrage claims, delay reports, unpaid fares or roadside emergency assistance under TLD Arbitration Committee supervision', 'TLD Tahkim Komitesi denetiminde depo demuraj tazminat talepleri, bekleme bildirimleri, ödenmeyen navlun veya yol acil yardım başvuruları')}
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-18px">add_circle</span>
            <span>{trText('ثبت ادعا یا شکایت جدید', 'File a New Claim or Complaint', 'Yeni Talep veya Şikayet Oluştur')}</span>
          </button>
        </div>

        {/* Dispute List */}
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#e2e1ed] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-jetbrains text-[10px] text-[#747686]" dir="ltr">
                      {d.id} • {d.tripId}
                    </span>
                    <span className="text-xs font-bold text-[#00258e] bg-[#eeedf9] px-2 py-0.5 rounded">
                      {d.disputeType === 'DEMURRAGE_CLAIM' ? trText('حق توقف و معطلی (دموراژ)', 'Detention & Demurrage', 'Bekleme ve Demuraj') : trText('سانحه و نقص فنی جاده‌ای', 'Road Incident & Breakdown', 'Yol Kazası ve Arıza')}
                    </span>
                  </div>
                  <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23] mt-1">
                    {d.title}
                  </h3>
                </div>

                <div>{getStatusBadge(d.status)}</div>
              </div>

              <p className="text-xs text-[#444655] leading-relaxed">
                {d.description}
              </p>

              {d.claimedAmount > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#747686]">{trText('مبلغ مطالبه شده:', 'Claimed amount:', 'Talep edilen tutar:')}</span>
                  <span className="font-bold text-[#ba1a1a] font-jetbrains">{d.claimedAmountFormatted}</span>
                </div>
              )}

              {/* Arbitration Response Box */}
              {d.arbitrationNote && (
                <div className="p-4 bg-[#f8f9fe] rounded-xl border border-[#c4c5da] text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-[#00258e] font-bold">
                    <span className="material-symbols-outlined text-16px">verified_user</span>
                    <span>{trText('پاسخ و رأی واحد داوری TLD:', 'TLD Arbitration Unit response:', 'TLD Tahkim Birimi yanıtı:')}</span>
                  </div>
                  <p className="text-[#333] leading-relaxed">{d.arbitrationNote}</p>
                </div>
              )}

              <div className="text-[11px] text-[#747686] pt-1 flex justify-between items-center border-t border-[#e2e1ed]">
                <span>{trText('تاریخ ثبت:', 'Filed on:', 'Kayıt tarihi:')} {d.submittedAt}</span>
                <span className="text-[#00258e] font-bold">{trText('سامانه داوری آنلاین TLD Legal Engine', 'TLD Online Arbitration - Legal Engine', 'TLD Çevrimiçi Tahkim - Legal Engine')}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal: New Dispute */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#c4c5da] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">gavel</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('ثبت شکایت یا مطالبه حق توقف (دموراژ)', 'File a Complaint or Demurrage Claim', 'Şikayet veya Demuraj Talebi Oluştur')}</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-[#747686] hover:text-[#1a1b23]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('موضوع اختلاف', 'Dispute subject', 'Anlaşmazlık konusu')}</label>
                <select
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none text-xs"
                >
                  <option value="DEMURRAGE_CLAIM">{trText('مطالبه حق توقف (دموراژ) بیش از حد مجاز بارگیری/تخلیه', 'Demurrage claim beyond the allowed loading/unloading time', 'İzin verilen yükleme/boşaltma süresini aşan demuraj talebi')}</option>
                  <option value="ROUTE_ACCIDENT_SOS">{trText('گزارش نقص فنی یا سانحه اضطراری در مسیر (SOS)', 'Report a breakdown or emergency incident en route (SOS)', 'Yolda arıza veya acil durum bildirimi (SOS)')}</option>
                  <option value="UNPAID_FARE">{trText('عدم پرداخت کرایه یا مغایرت مبلغ تسویه', 'Unpaid fare or settlement amount mismatch', 'Ödenmeyen navlun veya mutabakat tutarı uyuşmazlığı')}</option>
                  <option value="CARGO_DAMAGE">{trText('مغایرت در تناژ یا نوع محموله اعلامی', 'Declared tonnage or cargo type mismatch', 'Beyan edilen tonaj veya yük tipi uyuşmazlığı')}</option>
                  <option value="OTHER">{trText('سایر موارد حقوقی', 'Other legal matters', 'Diğer hukuki konular')}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('عنوان خلاصه', 'Short title', 'Kısa başlık')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={trText('مثلاً: توقف ۱۰ ساعته روی رمپ تخلیه انبار مشهد', 'e.g. 10-hour wait on the unloading ramp at the Mashhad warehouse', 'örn. Meşhed deposunun boşaltma rampasında 10 saatlik bekleme')}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('کد سفر مرتبط', 'Related trip code', 'İlgili sefer kodu')}</label>
                <input
                  type="text"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-jetbrains"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('مبلغ خسارت ادعا شده (تومان)', 'Claimed compensation amount (Toman)', 'Talep edilen tazminat tutarı (Tümen)')}</label>
                <input
                  type="number"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 outline-none font-jetbrains font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#444655] block mb-1">{trText('شرح کامل واقعه', 'Full description of the incident', 'Olayın tam açıklaması')}</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={trText('جزئیات زمان ورود به محوطه، ساعت شروع و پایان، نام مسئول انبار و مستندات...', 'Details of entry time, start and end times, warehouse supervisor name and documents...', 'Sahaya giriş zamanı, başlangıç ve bitiş saatleri, depo sorumlusunun adı ve belgeler...')}
                  className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 outline-none text-xs"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'Vazgeç')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00258e] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#0036c5]"
                >
                  {trText('ثبت در کمیته داوری', 'Submit to Arbitration Committee', 'Tahkim Komitesine Gönder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
