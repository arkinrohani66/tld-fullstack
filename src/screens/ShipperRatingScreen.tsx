import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { shipperService, adaptDbCargoToShipperCargo } from '../services/shipperService';

interface ShipperRatingScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperRatingScreen: React.FC<ShipperRatingScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();
  const { cargos: dbCargos, selectedCargoId } = useLogistics();

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
  const driver = cargo?.assignedDriver;

  const [overallScore, setOverallScore] = useState(5);
  const [punctualityScore, setPunctualityScore] = useState(5);
  const [cargoCareScore, setCargoCareScore] = useState(5);
  const [professionalismScore, setProfessionalismScore] = useState(5);
  const [truckConditionScore, setTruckConditionScore] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    { id: 'خوش‌قول و دقیق', en: 'Punctual and precise', tr: 'Sözünde duran ve titiz' },
    { id: 'ناوگان تمیز و استاندارد', en: 'Clean and standard fleet', tr: 'Temiz ve standart filo' },
    { id: 'رانندگی ایمن', en: 'Safe driving', tr: 'Güvenli sürüş' },
    { id: 'پاسخگویی سریع', en: 'Fast response', tr: 'Hızlı yanıt' },
    { id: 'مهارت بالا در مهار بار', en: 'High skill in cargo lashing', tr: 'Yük bağlamada yüksek beceri' },
    { id: 'حضور به‌موقع در مبدأ', en: 'On-time arrival at origin', tr: 'Kalkış noktasına zamanında varış' },
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo || !driver) return;

    setIsSubmitting(true);
    try {
      const saved = await shipperService.submitDriverRating({
        cargoId: cargo.id,
        driverId: driver.driverId,
        overallScore,
        punctualityScore,
        cargoCareScore,
        professionalismScore,
        truckConditionScore,
        comment,
        tags: selectedTags,
        tripRoute: trText(`${cargo.origin.city} به ${cargo.destination.city}`, `${cargo.origin.city} to ${cargo.destination.city}`, `${cargo.origin.city} - ${cargo.destination.city}`),
      });

      if (saved) {
        setIsSubmitted(true);
        showToast('success', trText('امتیاز و بازخورد ارزشمند شما برای راننده ثبت گردید.', 'Your valuable rating and feedback for the driver was recorded.', 'Sürücü için değerli puanınız ve geri bildiriminiz kaydedildi.'));
      } else {
        showToast('error', trText('ثبت امتیاز در پایگاه داده ناموفق بود. لطفاً دوباره تلاش کنید.', 'Saving the rating to the database failed. Please try again.', 'Puan veritabanına kaydedilemedi. Lütfen tekrar deneyin.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_RATING" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_RATING" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#ff9800] font-bold">
              <span className="material-symbols-outlined text-[18px]">hotel_class</span>
              <span>{trText('نظام ارزیابی کیفیت و رتبه‌بندی رانندگان', 'Driver quality evaluation and ranking system', 'Sürücü kalite değerlendirme ve sıralama sistemi')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('ارزیابی عملکرد و ثبت نظر راننده', 'Evaluate performance and rate the driver', 'Performansı değerlendir ve sürücüyü puanla')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('بازخورد شما در ارتقای رتبه الماس/طلایی و اولویت دریافت بارهای بعدی راننده تاثیر مستقیم دارد.', 'Your feedback directly affects the driver’s promotion to diamond/gold tier and their priority for future cargos.', 'Geri bildiriminiz sürücünün elmas/altın seviyeye yükselmesini ve sonraki yüklerde öncelik almasını doğrudan etkiler.')}
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-[#c4c5da] p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#00a368]/15 text-[#00a368] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <h2 className="text-lg font-black text-[#1a1b23]">{trText('ارزیابی با موفقیت ثبت شد!', 'Rating submitted successfully!', 'Değerlendirme başarıyla kaydedildi!')}</h2>
            <p className="text-xs text-[#545f72] max-w-md mx-auto">
              {trText('با تشکر از ثبت نظر دقیق شما. امتیاز راننده با این نظر به روزرسانی شد.', 'Thank you for your detailed review. The driver’s rating has been updated with this feedback.', 'Ayrıntılı değerlendirmeniz için teşekkürler. Sürücünün puanı bu geri bildirimle güncellendi.')}
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => onNavigate('SHIPPER_DASHBOARD')}
                className="px-5 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5]"
              >
                {trText('بازگشت به داشبورد صاحب بار', 'Back to the cargo owner dashboard', 'Yük sahibi panosuna dön')}
              </button>
              <button
                onClick={() => onNavigate('SHIPPER_PAST_CARGOS')}
                className="px-5 py-2.5 rounded-xl border border-[#c4c5da] text-[#545f72] text-xs font-bold hover:bg-[#eeedf9]"
              >
                {trText('مشاهده سوابق بارها', 'View cargo history', 'Yük geçmişini görüntüle')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="bg-white rounded-3xl border border-[#c4c5da] p-6 md:p-8 shadow-sm space-y-6">
            {/* Driver Profile Header */}
            {driver && (
              <div className="flex items-center gap-4 bg-[#fbf8ff] p-4 rounded-2xl border border-[#e2e1ed]">
                <div className="w-14 h-14 rounded-2xl bg-[#00258e] text-white font-black text-lg flex items-center justify-center">
                  {driver.fullName.slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1a1b23]">{driver.fullName}</div>
                  <div className="text-xs text-[#545f72] mt-0.5">
                    {trText(`ناوگان: ${driver.truckBrand} ${driver.truckModel} (${driver.plateNumber})`, `Fleet: ${driver.truckBrand} ${driver.truckModel} (${driver.plateNumber})`, `Filo: ${driver.truckBrand} ${driver.truckModel} (${driver.plateNumber})`)}
                  </div>
                  <div className="text-[11px] text-[#00258e] mt-0.5">
                    {trText(`محموله: ${cargo?.cargoInfo.title} | ${cargo?.origin.city} به ${cargo?.destination.city}`, `Cargo: ${cargo?.cargoInfo.title} | ${cargo?.origin.city} to ${cargo?.destination.city}`, `Yük: ${cargo?.cargoInfo.title} | ${cargo?.origin.city} - ${cargo?.destination.city}`)}
                  </div>
                </div>
              </div>
            )}

            {/* Overall Star Rating */}
            <div className="text-center py-4 bg-[#eeedf9]/40 rounded-2xl border border-[#c4c5da] space-y-2">
              <div className="text-xs font-bold text-[#1a1b23]">{trText('امتیاز کلی به سفر و راننده:', 'Overall rating for the trip and driver:', 'Seyahat ve sürücü için genel puan:')}</div>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallScore(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  >
                    <span
                      className={`material-symbols-outlined text-[36px] ${
                        star <= overallScore ? 'text-[#ff9800] fill-current' : 'text-gray-300'
                      }`}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-[#00258e]">
                {overallScore === 5
                  ? trText('عالی و بی‌نقص (۵ از ۵)', 'Excellent and flawless (5 of 5)', 'Mükemmel ve kusursuz (5/5)')
                  : overallScore === 4
                  ? trText('خیلی خوب (۴ از ۵)', 'Very good (4 of 5)', 'Çok iyi (4/5)')
                  : overallScore === 3
                  ? trText('متوسط (۳ از ۵)', 'Average (3 of 5)', 'Orta (3/5)')
                  : trText('نیاز به بهبود', 'Needs improvement', 'Geliştirilmeli')}
              </div>
            </div>

            {/* Detailed Criteria Scores */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-[#1a1b23]">{trText('ارزیابی معیارهای جزئی:', 'Evaluation of detailed criteria:', 'Ayrıntılı kriterlerin değerlendirilmesi:')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Criterion 1 */}
                <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed] space-y-2">
                  <div className="flex justify-between font-bold text-[#1a1b23]">
                    <span>{trText('آن‌تایم بودن و خوش‌قولی زمانی:', 'Punctuality and keeping to schedule:', 'Zamanında olma ve sözünü tutma:')}</span>
                    <span className="text-[#ff9800]">★ {punctualityScore}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPunctualityScore(s)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          s <= punctualityScore ? 'bg-[#00258e] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criterion 2 */}
                <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed] space-y-2">
                  <div className="flex justify-between font-bold text-[#1a1b23]">
                    <span>{trText('حفظ سلامت فیزیکی و مهار کالا:', 'Preserving cargo integrity and lashing:', 'Yükün fiziksel bütünlüğü ve bağlanması:')}</span>
                    <span className="text-[#ff9800]">★ {cargoCareScore}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCargoCareScore(s)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          s <= cargoCareScore ? 'bg-[#00258e] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criterion 3 */}
                <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed] space-y-2">
                  <div className="flex justify-between font-bold text-[#1a1b23]">
                    <span>{trText('برخورد حرفه‌ای و پاسخگویی:', 'Professional conduct and responsiveness:', 'Profesyonel davranış ve yanıt verebilirlik:')}</span>
                    <span className="text-[#ff9800]">★ {professionalismScore}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfessionalismScore(s)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          s <= professionalismScore ? 'bg-[#00258e] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criterion 4 */}
                <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed] space-y-2">
                  <div className="flex justify-between font-bold text-[#1a1b23]">
                    <span>{trText('کیفیت و تمیزی اتاق بار و ناوگان:', 'Quality and cleanliness of the cargo box and fleet:', 'Kargo bölmesi ve filo kalitesi/temizliği:')}</span>
                    <span className="text-[#ff9800]">★ {truckConditionScore}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTruckConditionScore(s)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          s <= truckConditionScore ? 'bg-[#00258e] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Positive Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1a1b23]">{trText('نقاط قوت برجسته راننده:', 'Outstanding driver strengths:', 'Sürücünün öne çıkan güçlü yönleri:')}</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00258e] text-white border-[#00258e]'
                          : 'bg-[#fbf8ff] text-[#545f72] border-[#c4c5da] hover:bg-[#eeedf9]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {trText(tag.id, tag.en, tag.tr)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Comment */}
            <div>
              <label className="block text-xs font-bold text-[#1a1b23] mb-1.5">
                {trText('توضیحات تکمیلی و نظر شما برای سایر صاحبان بار:', 'Additional comments and your review for other cargo owners:', 'Ek açıklamalar ve diğer yük sahipleri için yorumunuz:')}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-[#c4c5da] text-xs leading-relaxed"
                placeholder={trText('نظر خود را درباره نحوه بارگیری، مسیر و تخلیه بنویسید...', 'Write your opinion about the loading, the route and the unloading...', 'Yükleme, güzergâh ve boşaltma hakkında görüşünüzü yazın...')}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-[#00258e] text-white font-bold text-xs hover:bg-[#0036c5] shadow-md shadow-[#00258e]/20 cursor-pointer"
              >
                {trText('ثبت قطعی ارزیابی راننده', 'Submit the driver rating', 'Sürücü değerlendirmesini kesinleştir')}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('SHIPPER_DISPUTES')}
                className="px-4 py-3.5 rounded-2xl border border-[#ba1a1a] text-[#ba1a1a] font-bold text-xs hover:bg-[#ba1a1a]/5 cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">report_problem</span>
                <span>{trText('ثبت شکایت و ادعای خسارت', 'File a complaint and damage claim', 'Şikâyet ve hasar talebi bildir')}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      <MobileBottomNav currentScreen="PROFILE" onNavigate={onNavigate} />
    </div>
  );
};
