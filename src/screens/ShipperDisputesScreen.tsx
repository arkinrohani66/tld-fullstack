import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, ShipperDisputeRecord } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService } from '../services/shipperService';

interface ShipperDisputesScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperDisputesScreen: React.FC<ShipperDisputesScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [disputes, setDisputes] = useState<ShipperDisputeRecord[]>(shipperService.getDisputes());
  const [showNewModal, setShowNewModal] = useState(false);

  // New Dispute Form
  const [selectedCargoId, setSelectedCargoId] = useState('CRG-8892');
  const [disputeType, setDisputeType] = useState<ShipperDisputeRecord['disputeType']>('CARGO_DAMAGE');
  const [claimedLossTomans, setClaimedLossTomans] = useState<number>(3500000);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !title.trim()) {
      showToast('error', trText('لطفاً عنوان و شرح کامل شکایت را بنویسید', 'Please write the complaint title and a full description', 'Lütfen şikâyet başlığını ve tam açıklamasını yazın'));
      return;
    }

    const newTicket = shipperService.createDispute({
      cargoId: selectedCargoId,
      cargoNumber: selectedCargoId === 'CRG-8892' ? 'CRG-8892-TH' : 'CRG-9021-IS',
      driverName: trText('محمدرضا سلطانی', 'Mohammad Reza Soltani', 'Muhammed Rıza Soltani'),
      disputeType,
      title,
      claimedLossTomans,
      description,
      evidencePhotoUrls: ['/assets/images/dispute1.jpg'],
    });

    setDisputes([newTicket, ...disputes]);
    setShowNewModal(false);
    setTitle('');
    setDescription('');
    showToast('success', trText(`تیکت داوری ${newTicket.id} ثبت شد و کارشناس حقوقی ظرف ۲ ساعت با شما تماس می‌گیرد.`, `Arbitration ticket ${newTicket.id} was registered and a legal expert will contact you within 2 hours.`, `${newTicket.id} numaralı tahkim talebi kaydedildi ve hukuk uzmanı 2 saat içinde sizinle iletişime geçecek.`));
  };

  const getCategoryLabel = (cat: ShipperDisputeRecord['disputeType']) => {
    switch (cat) {
      case 'CARGO_DAMAGE':
        return trText('خسارت فیزیکی به کالا', 'Physical damage to the cargo', 'Yükte fiziksel hasar');
      case 'CARGO_SHORTAGE':
        return trText('کسری اقلام یا کارتن‌ها', 'Shortage of items or cartons', 'Kalem veya koli eksikliği');
      case 'DELAY_DEMURRAGE':
        return trText('تاخیر نامتعارف و ادعای دموراژ', 'Unusual delay and demurrage claim', 'Olağan dışı gecikme ve demuraj talebi');
      case 'TEMPERATURE_DEVIATION':
        return trText('نوسان دمای یخچال و فساد بار', 'Refrigeration temperature deviation and cargo spoilage', 'Soğutma sıcaklığı sapması ve yük bozulması');
      case 'DRIVER_OVERCHARGE':
        return trText('مطالبه کرایه اضافی یا اضافه بار', 'Claim for extra fare or overload', 'Ek ücret veya aşırı yük talebi');
      case 'UNAUTHORIZED_UNSEAL':
        return trText('فک غیرمجاز پلمپ دیجیتال', 'Unauthorized breaking of the digital seal', 'Dijital mührün izinsiz açılması');
      default:
        return trText('سایر موارد', 'Other cases', 'Diğer durumlar');
    }
  };

  const getStatusBadge = (status: ShipperDisputeRecord['status']) => {
    switch (status) {
      case 'REGISTERED':
        return { label: trText('ثبت شده / در نوبت بررسی', 'Registered / awaiting review', 'Kaydedildi / inceleme sırasında'), color: 'bg-blue-100 text-blue-700' };
      case 'INSURANCE_INVESTIGATION':
        return { label: trText('کارشناسی بیمه و ارزیابی خسارت', 'Insurance assessment and damage evaluation', 'Sigorta ekspertizi ve hasar değerlendirmesi'), color: 'bg-amber-100 text-amber-700' };
      case 'ARBITRATION_PANEL':
        return { label: trText('در حال داوری حقوقی ترابران', 'Under legal arbitration by the transport panel', 'Taşıma hakem heyetinde hukuki tahkim'), color: 'bg-purple-100 text-purple-700' };
      case 'SETTLED_COMPENSATION':
        return { label: trText('مختومه و پرداخت خسارت ✓', 'Closed and compensation paid ✓', 'Kapatıldı ve hasar ödendi ✓'), color: 'bg-emerald-100 text-emerald-700' };
      case 'REJECTED':
        return { label: trText('رد شده', 'Rejected', 'Reddedildi'), color: 'bg-red-100 text-red-700' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_DISPUTES" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_DISPUTES" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#ba1a1a] font-bold">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>{trText('سامانه داوری حقوقی و جبران خسارت ترابران', 'Legal arbitration and compensation system', 'Hukuki tahkim ve tazminat sistemi')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('ثبت شکایت، مغایرت و ادعای خسارت', 'File a complaint, discrepancy or damage claim', 'Şikâyet, uyuşmazlık ve hasar talebi bildir')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('رسیدگی سریع توسط هیئت داوری حمل‌ونقل و پرداخت خسارت از محل حساب امانی یا پوشش بیمه‌ای', 'Fast handling by the transport arbitration board and compensation paid from the escrow account or insurance cover', 'Taşıma hakem heyeti tarafından hızlı inceleme ve tazminatın emanet hesabından veya sigorta teminatından ödenmesi')}
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#9c1414] flex items-center gap-2 shadow-md shadow-[#ba1a1a]/20 cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add_alert</span>
            <span>{trText('ثبت تیکت شکایت جدید', 'File a new complaint ticket', 'Yeni şikâyet talebi oluştur')}</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-[#1a1b23]">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[24px] shrink-0 mt-0.5">
            shield_with_heart
          </span>
          <div>
            <strong className="font-bold text-[#ba1a1a] block mb-0.5">{trText('ضمانت بازگشت وجه و جبران خسارت:', 'Money-back guarantee and compensation:', 'Para iadesi ve tazminat güvencesi:')}</strong>
            {trText('تا زمان رفع کامل مغایرت و اعلام نظر کارشناس رسمی دادگستری یا داور سامانه، وجه امانی در حساب امن بلوکه باقی خواهد ماند.', 'Until the discrepancy is fully resolved and the official court expert or platform arbitrator issues an opinion, the escrow funds will remain locked in the secure account.', 'Uyuşmazlık tamamen giderilip resmî adli bilirkişi veya platform hakemi görüşünü bildirene kadar emanet tutarı güvenli hesapta bloke kalacaktır.')}
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da]">
              <span className="material-symbols-outlined text-4xl text-[#00a368]">verified</span>
              <h3 className="text-sm font-bold text-[#1a1b23] mt-2">{trText('هیچ پرونده شکایتی ثبت نشده است', 'No complaint case has been registered', 'Hiç şikâyet dosyası kaydedilmedi')}</h3>
              <p className="text-xs text-[#545f72] mt-1">{trText('کلیه سفرهای شما در وضعیت سلامت و رضایت کامل قرار دارند.', 'All your trips are completed in good condition and with full satisfaction.', 'Tüm seferleriniz sorunsuz ve tam memnuniyetle tamamlandı.')}</p>
            </div>
          ) : (
            disputes.map((ticket) => {
              const statusBadge = getStatusBadge(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e1ed] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-jetbrains font-bold text-xs text-[#ba1a1a] bg-[#ba1a1a]/10 px-2.5 py-1 rounded-lg">
                        {ticket.id}
                      </span>
                      <span className="font-bold text-xs text-[#1a1b23]">
                        {ticket.title} ({getCategoryLabel(ticket.disputeType)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[11px] text-[#747686]">{ticket.submittedAt}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#fbf8ff] p-3 rounded-xl border border-[#e2e1ed] text-xs">
                    <div>
                      <span className="text-[#747686] text-[10px] block">{trText('شناسه محموله مربوطه:', 'Related cargo ID:', 'İlgili yük no:')}</span>
                      <span className="font-jetbrains font-bold text-[#00258e]">{ticket.cargoNumber}</span>
                    </div>
                    <div>
                      <span className="text-[#747686] text-[10px] block">{trText('مبلغ ادعای خسارت:', 'Damage claim amount:', 'Hasar talebi tutarı:')}</span>
                      <span className="font-jetbrains font-bold text-[#ba1a1a]">
                        {ticket.claimedLossTomans.toLocaleString('fa-IR')} {trText('تومان', 'Toman', 'Toman')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#747686] text-[10px] block">{trText('راننده متصدی حمل:', 'Carrier driver:', 'Taşıyıcı sürücü:')}</span>
                      <span className="font-bold text-[#1a1b23]">{ticket.driverName}</span>
                    </div>
                  </div>

                  <div className="text-xs text-[#1a1b23] leading-relaxed bg-[#fbf8ff] p-3 rounded-xl border border-[#e2e1ed]">
                    <strong className="block text-[#545f72] text-[11px] mb-1">{trText('شرح واقعه ثبت‌شده:', 'Description of the recorded incident:', 'Kaydedilen olay açıklaması:')}</strong>
                    {ticket.description}
                  </div>

                  {ticket.arbitrationVerdict && (
                    <div className="bg-[#00a368]/10 border border-[#00a368]/30 p-3 rounded-xl text-xs text-[#1a1b23] space-y-1">
                      <strong className="font-bold text-[#00a368] block">{trText('رأی نهایی هیئت داوری ترابران:', 'Final ruling of the transport arbitration board:', 'Taşıma hakem heyetinin nihai kararı:')}</strong>
                      <p>{ticket.arbitrationVerdict}</p>
                      {ticket.compensatedAmountTomans && (
                        <div className="font-jetbrains font-bold text-[#00a368] text-xs pt-1">
                          {trText(`مبلغ واریزی خسارت به کیف پول: ${ticket.compensatedAmountTomans.toLocaleString('fa-IR')} تومان`, `Compensation amount transferred to the wallet: ${ticket.compensatedAmountTomans.toLocaleString('fa-IR')} Toman`, `Cüzdana aktarılan tazminat tutarı: ${ticket.compensatedAmountTomans.toLocaleString('fa-IR')} Toman`)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* NEW DISPUTE MODAL */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#c4c5da] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">report_problem</span>
                  <h3 className="font-black text-sm text-[#1a1b23]">{trText('فرم ثبت ادعای خسارت و شکایت داوری', 'Damage claim and arbitration complaint form', 'Hasar talebi ve tahkim şikâyet formu')}</h3>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#747686]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1a1b23] mb-1">{trText('انتخاب محموله مورد شکایت:', 'Select the cargo in question:', 'Şikâyete konu yükü seçin:')}</label>
                  <select
                    value={selectedCargoId}
                    onChange={(e) => setSelectedCargoId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] font-jetbrains text-xs"
                  >
                    <option value="CRG-8892">{trText('محموله قطعات صنعتی سنگین (CRG-8892-TH)', 'Heavy industrial parts shipment (CRG-8892-TH)', 'Ağır sanayi parçaları yükü (CRG-8892-TH)')}</option>
                    <option value="CRG-9021">{trText('محموله رول ورق فولادی (CRG-9021-IS)', 'Steel sheet roll shipment (CRG-9021-IS)', 'Çelik sac rulo yükü (CRG-9021-IS)')}</option>
                    <option value="CRG-7719">{trText('محموله لوازم خانگی (CRG-7719-TB)', 'Home appliance shipment (CRG-7719-TB)', 'Ev aletleri yükü (CRG-7719-TB)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1b23] mb-1">{trText('عنوان کوتاه شکایت:', 'Short complaint title:', 'Kısa şikâyet başlığı:')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={trText('مثال: شکستگی پالت در اثر مهاربندی نادرست', 'e.g. broken pallet due to incorrect lashing', 'örn. hatalı bağlama nedeniyle kırılan palet')}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1b23] mb-1">{trText('علت و طبقه‌بندی شکایت:', 'Complaint cause and category:', 'Şikâyet nedeni ve kategorisi:')}</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] text-xs font-bold"
                  >
                    <option value="CARGO_DAMAGE">{trText('خسارت فیزیکی، شکستگی یا آسیب به کالا', 'Physical damage, breakage or harm to the cargo', 'Fiziksel hasar, kırılma veya yüke zarar')}</option>
                    <option value="CARGO_SHORTAGE">{trText('کسری تعداد بسته‌ها در باسکول یا انبار مقصد', 'Shortage in the number of packages at the weighbridge or destination warehouse', 'Kantarda veya varış deposunda paket sayısı eksikliği')}</option>
                    <option value="DELAY_DEMURRAGE">{trText('تاخیر غیرموجه بیش از حد و ادعای دموراژ', 'Excessive unjustified delay and demurrage claim', 'Aşırı haksız gecikme ve demuraj talebi')}</option>
                    <option value="TEMPERATURE_DEVIATION">{trText('انحراف دمای کابین یخچال و فساد مواد غذایی', 'Refrigeration compartment temperature deviation and food spoilage', 'Soğutma bölmesi sıcaklık sapması ve gıda bozulması')}</option>
                    <option value="DRIVER_OVERCHARGE">{trText('مطالبه کرایه مازاد غیرقانونی توسط راننده', 'Unlawful extra fare demand by the driver', 'Sürücünün hukuka aykırı ek ücret talebi')}</option>
                    <option value="UNAUTHORIZED_UNSEAL">{trText('فک پلمپ یا دستکاری قفل هوشمند', 'Seal removal or tampering with the smart lock', 'Mührün açılması veya akıllı kilide müdahale')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1b23] mb-1">{trText('مبلغ برآوردی خسارت مدعی (تومان):', 'Estimated claimed damage amount (Toman):', 'Tahmini talep edilen hasar tutarı (Toman):')}</label>
                  <input
                    type="number"
                    step={100000}
                    value={claimedLossTomans}
                    onChange={(e) => setClaimedLossTomans(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] font-jetbrains text-sm font-bold text-[#ba1a1a]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1b23] mb-1">{trText('شرح دقیق واقعه و مستندات:', 'Detailed description of the incident and evidence:', 'Olayın ayrıntılı açıklaması ve belgeler:')}</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={trText('شرح دهید چه مشکلی در زمان بارگیری، مسیر یا تخلیه رخ داده است...', 'Describe what went wrong during loading, in transit or at unloading...', 'Yükleme, yol veya boşaltma sırasında neyin yanlış gittiğini açıklayın...')}
                    className="w-full p-3 rounded-xl border border-[#c4c5da] text-xs leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#ba1a1a] text-white font-bold text-xs hover:bg-[#9c1414]"
                  >
                    {trText('ثبت نهایی و ارسال به هیئت داوری', 'Submit and send to the arbitration board', 'Son kaydı yap ve hakem heyetine gönder')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-3 rounded-xl border border-[#c4c5da] text-xs font-bold text-[#545f72]"
                  >
                    {trText('انصراف', 'Cancel', 'Vazgeç')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav currentScreen="PROFILE" onNavigate={onNavigate} />
    </div>
  );
};
