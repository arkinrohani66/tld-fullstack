import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, DriverRatingStats, DriverReview } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { driverRatingService } from '../services/driverRatingService';

interface DriverRatingsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverRatingsScreen: React.FC<DriverRatingsScreenProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const { dir, trText } = useLanguage();

  // Instant initial state so the page NEVER displays blank/empty
  const [stats, setStats] = useState<DriverRatingStats>(() =>
    driverRatingService.getInitialStats()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [filterRating, setFilterRating] = useState<'ALL' | '5' | '4' | 'HAS_REPLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'HIGHEST_RATING'>('NEWEST');

  // Reply state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Dispute modal state
  const [disputeReview, setDisputeReview] = useState<DriverReview | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await driverRatingService.fetchRatingStats();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.warn('Error loading driver rating stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReply = (reviewId: string, currentResponse?: string) => {
    setReplyingReviewId(reviewId);
    setReplyText(currentResponse || '');
  };

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    const success = await driverRatingService.submitDriverReply(reviewId, replyText);
    setIsSubmittingReply(false);

    if (success) {
      showToast(
        'success',
        trText(
          'پاسخ رسمی شما با موفقیت ثبت شد',
          'Your official response was submitted successfully',
          'Resmî yanıtınız başarıyla kaydedildi'
        )
      );
      // Update local reviews list
      setStats((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                driverResponse: replyText.trim(),
                responseDate: new Date().toLocaleDateString('fa-IR'),
              }
            : r
        ),
      }));
      setReplyingReviewId(null);
      setReplyText('');
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReview || !disputeReason.trim()) return;

    await driverRatingService.submitRatingDispute(disputeReview.id, disputeReason);
    setDisputeSubmitted(true);
    showToast(
      'info',
      trText(
        'درخواست بازبینی نظر به واحد داوری TLD ارجاع شد',
        'The review dispute request was forwarded to the TLD arbitration unit',
        'Değerlendirme itirazı TLD hakem birimine iletildi'
      )
    );
    setTimeout(() => {
      setDisputeReview(null);
      setDisputeReason('');
      setDisputeSubmitted(false);
    }, 1800);
  };

  // Filter and sort reviews
  const filteredReviews = stats.reviews
    .filter((rev) => {
      if (filterRating === '5' && rev.rating < 5) return false;
      if (filterRating === '4' && (rev.rating >= 5 || rev.rating < 4)) return false;
      if (filterRating === 'HAS_REPLY' && !rev.driverResponse) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inShipper = rev.shipperName.toLowerCase().includes(q);
        const inCompany = rev.shipperCompany.toLowerCase().includes(q);
        const inRoute = rev.tripRoute.toLowerCase().includes(q);
        const inComment = rev.comment.toLowerCase().includes(q);
        const inCargo = rev.cargoType?.toLowerCase().includes(q);
        return inShipper || inCompany || inRoute || inComment || inCargo;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'HIGHEST_RATING') return b.rating - a.rating;
      return 0; // default order in mock data is newest
    });

  // Breakdown percentages
  const fiveStarsCount = stats.reviews.filter((r) => r.rating >= 4.95).length;
  const fourStarsCount = stats.reviews.filter((r) => r.rating >= 4.0 && r.rating < 4.95).length;
  const threeStarsCount = stats.reviews.filter((r) => r.rating < 4.0).length;

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn text-right" dir={dir}>
      <AppHeader
        currentScreen="DRIVER_RATINGS"
        title={trText('امتیازات و نظرات راننده', 'Driver Ratings & Reviews', 'Sürücü Puanları ve Değerlendirmeleri')}
        subtitle="Driver Scorecard & Shipper Reviews"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      <DesktopSidebar currentScreen="DRIVER_RATINGS" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Scorecard Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#c4c5da]/70 shadow-sm space-y-6 relative overflow-hidden">
          {/* Subtle gradient banner accent */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#00258e] via-[#00a368] to-[#fbbc04]" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e1ed] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fbbc04] text-[32px]">hotel_class</span>
                <h1 className="text-xl md:text-2xl font-black text-[#1a1b23]">
                  {trText('کارنامه عملکرد و اعتبار راننده', 'Driver Performance & Reputation Record', 'Sürücü Performans ve İtibar Karnesi')}
                </h1>
              </div>
              <p className="text-[#545f72] text-xs md:text-sm mt-1">
                {trText('سطح راننده در شبکه هوشمند TLD:', 'Driver tier in the TLD smart network:', 'TLD akıllı ağındaki sürücü seviyesi:')}{' '}
                <strong className="text-[#00258e] font-extrabold">{trText('راننده الماس (Diamond Tier)', 'Diamond Tier Driver', 'Elmas Seviye Sürücü')}</strong>{' '}
                {trText(
                  'با اولویت اختصاص بار، کارمزد حمایتی و واریز آنی پایا',
                  'with priority load allocation, supported commission and instant Paya settlement',
                  'öncelikli yük tahsisi, destekli komisyon ve anında Paya transferi ile'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-gradient-to-l from-[#fff8e1] to-[#fff3cd] border border-[#ffe082] px-4 py-2.5 rounded-2xl text-[#855700] shadow-xs">
              <span className="material-symbols-outlined text-[24px] text-[#f59e0b]">verified</span>
              <div>
                <span className="font-black text-xs block">{trText('نشان رسمی اعتماد طلایی TLD', 'Official TLD Gold Trust Badge', 'Resmî TLD Altın Güven Rozeti')}</span>
                <span className="text-[10px] text-[#855700]/80">{trText('احراز هویت ۱۰۰٪ کامل و بدون سابقه تخلف', '100% verified identity with no violation record', '%100 eksiksiz kimlik doğrulaması, ihlal kaydı yok')}</span>
              </div>
            </div>
          </div>

          {/* Key KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-[#f8f9fe] to-[#edf0ff] rounded-2xl border border-[#c4c5da]/50 text-center space-y-1 shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-[#1a1b23] font-jetbrains flex items-center justify-center gap-1">
                <span>{stats.averageRating}</span>
                <span className="text-[#fbbc04] text-xl">★</span>
              </div>
              <div className="text-xs font-bold text-[#1a1b23]">{trText('میانگین کل امتیازات', 'Overall Average Rating', 'Genel Ortalama Puan')}</div>
              <div className="text-[11px] text-[#00258e] font-bold">
                {trText(`از مجموع ${stats.totalReviews} دیدگاه ثبت‌شده`, `from ${stats.totalReviews} submitted reviews`, `${stats.totalReviews} kayıtlı değerlendirme üzerinden`)}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#f4fcf6] to-[#e6f8ec] rounded-2xl border border-[#b2e5c4] text-center space-y-1 shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-[#00a368] font-jetbrains">
                {stats.onTimeDeliveryRate}%
              </div>
              <div className="text-xs font-bold text-[#1a1b23]">{trText('تحویل کاملاً به‌موقع', 'Fully On-Time Delivery', 'Tam Zamanında Teslimat')}</div>
              <div className="text-[11px] text-[#00a368] font-bold">{trText('بدون تاخیر در مقصد', 'No delay at destination', 'Varış noktasında gecikme yok')}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#f0f4ff] to-[#e3ecff] rounded-2xl border border-[#b5caff] text-center space-y-1 shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-[#00258e] font-jetbrains">
                {stats.safetyScore}%
              </div>
              <div className="text-xs font-bold text-[#1a1b23]">{trText('شاخص رانندگی ایمن', 'Safe Driving Index', 'Güvenli Sürüş Endeksi')}</div>
              <div className="text-[11px] text-[#00258e] font-bold">{trText('سنسور شتاب و سرعت مجاز', 'Acceleration & speed limit sensors', 'İvme ve hız limiti sensörleri')}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#f2fcf5] to-[#def5e6] rounded-2xl border border-[#99e2b4] text-center space-y-1 shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-[#137333] font-jetbrains">
                {stats.cargoIntegrityScore}%
              </div>
              <div className="text-xs font-bold text-[#1a1b23]">{trText('سلامت کامل محموله', 'Full Cargo Integrity', 'Tam Kargo Bütünlüğü')}</div>
              <div className="text-[11px] text-[#137333] font-bold">{trText('صفر درصد کسری یا خسارت', 'Zero shortage or damage', 'Sıfır eksiklik veya hasar')}</div>
            </div>
          </div>

          {/* Operational Breakdown & Star Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[#e2e1ed]">
            {/* Star Distribution Bars */}
            <div className="space-y-3 bg-[#fbf8ff] p-4 rounded-2xl border border-[#c4c5da]/40">
              <span className="text-xs font-bold text-[#1a1b23] block">
                {trText('توزیع سطوح رضایت صاحبان کالا (Stars Breakdown):', 'Cargo owner satisfaction distribution (Stars Breakdown):', 'Yük sahibi memnuniyet dağılımı (Stars Breakdown):')}
              </span>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-[#545f72] font-bold text-[11px] shrink-0">{trText('۵ ستاره', '5 stars', '5 yıldız')}</span>
                  <div className="flex-1 h-3 bg-[#e2e1ed] rounded-full overflow-hidden">
                    <div className="h-full bg-[#fbbc04] rounded-full" style={{ width: '92%' }} />
                  </div>
                  <span className="w-12 text-left font-jetbrains font-bold text-[11px] text-[#1a1b23]">{trText(`۹۲٪ (${fiveStarsCount})`, `92% (${fiveStarsCount})`, `%92 (${fiveStarsCount})`)}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-[#545f72] font-bold text-[11px] shrink-0">{trText('۴ ستاره', '4 stars', '4 yıldız')}</span>
                  <div className="flex-1 h-3 bg-[#e2e1ed] rounded-full overflow-hidden">
                    <div className="h-full bg-[#fbbc04]/70 rounded-full" style={{ width: '6%' }} />
                  </div>
                  <span className="w-12 text-left font-jetbrains font-bold text-[11px] text-[#1a1b23]">{trText(`۶٪ (${fourStarsCount})`, `6% (${fourStarsCount})`, `%6 (${fourStarsCount})`)}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-[#545f72] font-bold text-[11px] shrink-0">{trText('۳ ستاره', '3 stars', '3 yıldız')}</span>
                  <div className="flex-1 h-3 bg-[#e2e1ed] rounded-full overflow-hidden">
                    <div className="h-full bg-[#fbbc04]/40 rounded-full" style={{ width: '2%' }} />
                  </div>
                  <span className="w-12 text-left font-jetbrains font-bold text-[11px] text-[#1a1b23]">{trText(`۲٪ (${threeStarsCount})`, `2% (${threeStarsCount})`, `%2 (${threeStarsCount})`)}</span>
                </div>
              </div>
            </div>

            {/* Quality Standard Badges */}
            <div className="space-y-3 bg-[#fbf8ff] p-4 rounded-2xl border border-[#c4c5da]/40">
              <span className="text-xs font-bold text-[#1a1b23] block">
                {trText('گواهینامه‌ها و نشان‌های مهارتی اختصاص‌یافته:', 'Assigned certificates and skill badges:', 'Atanmış sertifikalar ve beceri rozetleri:')}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-xl border border-[#c4c5da]/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00258e] text-[18px]">ac_unit</span>
                  <div>
                    <span className="font-bold text-[11px] block text-[#1a1b23]">{trText('زنجیره سرد برتر', 'Top Cold Chain', 'En İyi Soğuk Zincir')}</span>
                    <span className="text-[10px] text-[#545f72]">{trText('ثبت دمای پیوسته IoT', 'Continuous IoT temperature logging', 'Sürekli IoT sıcaklık kaydı')}</span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-[#c4c5da]/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00a368] text-[18px]">speed</span>
                  <div>
                    <span className="font-bold text-[11px] block text-[#1a1b23]">{trText('سفر بدون تاخیر', 'Delay-Free Trips', 'Gecikmesiz Yolculuklar')}</span>
                    <span className="text-[10px] text-[#545f72]">{trText('۱۰۰+ سفر آن‌تایم', '100+ on-time trips', '100+ zamanında yolculuk')}</span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-[#c4c5da]/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f59e0b] text-[18px]">shield</span>
                  <div>
                    <span className="font-bold text-[11px] block text-[#1a1b23]">{trText('مهار ایمن بار', 'Secure Load Lashing', 'Güvenli Yük Bağlama')}</span>
                    <span className="text-[10px] text-[#545f72]">{trText('تاییدیه باسکول مبدأ/مقصد', 'Origin/destination weighbridge approval', 'Çıkış/varış kantarcı onayı')}</span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-[#c4c5da]/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7c3aed] text-[18px]">verified_user</span>
                  <div>
                    <span className="font-bold text-[11px] block text-[#1a1b23]">{trText('بارنامه هوشمند RMTO', 'RMTO Smart Waybill', 'RMTO Akıllı İrsaliye')}</span>
                    <span className="text-[10px] text-[#545f72]">{trText('استعلام برخط راهداری', 'Online road authority verification', 'Çevrimiçi karayolları doğrulaması')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#c4c5da]/70 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Rating Tabs */}
          <div className="flex bg-[#f0f3fa] p-1 rounded-xl border border-[#c4c5da]/50 gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterRating('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterRating === 'ALL'
                  ? 'bg-white text-[#00258e] shadow-xs'
                  : 'text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              {trText(`همه دیدگاه‌ها (${stats.reviews.length})`, `All reviews (${stats.reviews.length})`, `Tüm değerlendirmeler (${stats.reviews.length})`)}
            </button>
            <button
              onClick={() => setFilterRating('5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterRating === '5'
                  ? 'bg-white text-[#00258e] shadow-xs'
                  : 'text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              {trText(`★ ۵ ستاره (${fiveStarsCount})`, `★ 5 stars (${fiveStarsCount})`, `★ 5 yıldız (${fiveStarsCount})`)}
            </button>
            <button
              onClick={() => setFilterRating('4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterRating === '4'
                  ? 'bg-white text-[#00258e] shadow-xs'
                  : 'text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              {trText(`★ ۴ ستاره (${fourStarsCount})`, `★ 4 stars (${fourStarsCount})`, `★ 4 yıldız (${fourStarsCount})`)}
            </button>
            <button
              onClick={() => setFilterRating('HAS_REPLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterRating === 'HAS_REPLY'
                  ? 'bg-white text-[#00258e] shadow-xs'
                  : 'text-[#545f72] hover:text-[#1a1b23]'
              }`}
            >
              {trText('دارای پاسخ رسمی راننده', 'With official driver reply', 'Resmî sürücü yanıtı olan')}
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#747686] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder={trText('جستجو در متن، شرکت، مسیر...', 'Search text, company, route...', 'Metin, şirket, güzergâh ara...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#fbf8ff] pr-9 pl-3 py-1.5 rounded-xl text-xs border border-[#c4c5da] text-[#1a1b23] focus:border-[#00258e] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-[#747686] hover:text-[#1a1b23]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#f0f3fa] text-xs font-bold text-[#1a1b23] px-3 py-2 rounded-xl border border-[#c4c5da]/50 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">{trText('جدیدترین دیدگاه‌ها', 'Newest reviews', 'En yeni değerlendirmeler')}</option>
              <option value="HIGHEST_RATING">{trText('بالاترین امتیاز', 'Highest rating', 'En yüksek puan')}</option>
            </select>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-[#1a1b23] flex items-center gap-2">
              <span>{trText('نظرات و بازخوردهای ثبت شده توسط فرستندگان کالا', 'Reviews and feedback submitted by cargo senders', 'Kargo göndericileri tarafından kaydedilen değerlendirmeler ve geri bildirimler')}</span>
              <span className="text-xs bg-[#eeedf9] text-[#00258e] px-2 py-0.5 rounded-full font-jetbrains font-bold">
                {trText(`${filteredReviews.length} مورد`, `${filteredReviews.length} items`, `${filteredReviews.length} kayıt`)}
              </span>
            </h3>
            {isLoading && (
              <span className="text-xs text-[#545f72] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                {trText('در حال به‌روزرسانی...', 'Updating...', 'Güncelleniyor...')}
              </span>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#c4c5da]/60 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#f0f3fa] text-[#545f72] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">reviews</span>
              </div>
              <h4 className="text-base font-bold text-[#1a1b23]">{trText('هیچ دیدگاهی با فیلتر انتخابی یافت نشد', 'No reviews found with the selected filter', 'Seçilen filtreyle değerlendirme bulunamadı')}</h4>
              <p className="text-xs text-[#545f72]">
                {trText(
                  'می‌توانید فیلتر امتیاز را روی «همه دیدگاه‌ها» تنظیم کرده یا عبارت جستجو را پاک کنید.',
                  'You can set the rating filter to "All reviews" or clear the search term.',
                  'Puan filtresini "Tüm değerlendirmeler" olarak ayarlayabilir veya arama ifadesini temizleyebilirsiniz.'
                )}
              </p>
              <button
                onClick={() => {
                  setFilterRating('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-2 bg-[#00258e] text-white rounded-xl text-xs font-bold hover:bg-[#0036c5] transition-colors cursor-pointer"
              >
                {trText('نمایش تمام نظرات', 'Show all reviews', 'Tüm değerlendirmeleri göster')}
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-3xl border border-[#c4c5da]/70 shadow-xs space-y-4 hover:border-[#00258e]/40 transition-all"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#eeedf9] text-[#00258e] flex items-center justify-center font-bold text-sm shrink-0 border border-[#c4c5da]/40">
                      {rev.shipperName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1a1b23]">{rev.shipperName}</span>
                        <span className="text-xs font-semibold text-[#00258e] bg-[#e8e7f3] px-2 py-0.5 rounded-lg">
                          {rev.shipperCompany}
                        </span>
                        <span className="text-[10px] text-[#005a36] bg-[#d7f2dc] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          {trText('صاحب کالای تاییدشده', 'Verified cargo owner', 'Doğrulanmış yük sahibi')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#747686] mt-1 flex items-center gap-2 flex-wrap">
                        <span>{trText('مسیر حمل:', 'Trip route:', 'Taşıma güzergâhı:')} <strong className="text-[#1a1b23]">{rev.tripRoute}</strong></span>
                        {rev.cargoType && <span>• {trText('نوع محموله:', 'Cargo type:', 'Kargo tipi:')} <strong>{rev.cargoType}</strong></span>}
                        {rev.waybillNumber && (
                          <span className="font-jetbrains text-[10px] bg-[#f0f3fa] px-1.5 py-0.5 rounded text-[#545f72]">
                            {trText('بارنامه:', 'Waybill:', 'İrsaliye:')} {rev.waybillNumber}
                          </span>
                        )}
                        <span>• {trText('تاریخ ثبت:', 'Recorded on:', 'Kayıt tarihi:')} {rev.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#fff9e6] to-[#fff3cd] px-3 py-1.5 rounded-xl border border-[#ffe082] text-xs font-jetbrains font-black text-[#855700] shrink-0 self-end sm:self-auto">
                    <span className="text-base text-[#f59e0b]">★</span>
                    <span className="text-sm">{rev.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs md:text-sm text-[#2d2f39] leading-relaxed bg-[#fbf8ff] p-3.5 rounded-2xl border border-[#e2e1ed]">
                  "{rev.comment}"
                </p>

                {/* Sub-ratings breakdown if present */}
                {rev.ratingBreakdown && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-[#545f72]">
                    <span className="bg-[#f0f3fa] px-2 py-1 rounded-lg">
                      {trText('وقت‌شناسی:', 'Punctuality:', 'Dakiklik:')} <strong>{rev.ratingBreakdown.punctuality}★</strong>
                    </span>
                    <span className="bg-[#f0f3fa] px-2 py-1 rounded-lg">
                      {trText('حفظ سلامت بار:', 'Cargo protection:', 'Kargo koruması:')} <strong>{rev.ratingBreakdown.cargoCare}★</strong>
                    </span>
                    <span className="bg-[#f0f3fa] px-2 py-1 rounded-lg">
                      {trText('رفتار حرفه‌ای:', 'Professionalism:', 'Profesyonellik:')} <strong>{rev.ratingBreakdown.professionalism}★</strong>
                    </span>
                    <span className="bg-[#f0f3fa] px-2 py-1 rounded-lg">
                      {trText('وضعیت کامیون:', 'Truck condition:', 'Kamyon durumu:')} <strong>{rev.ratingBreakdown.vehicleCondition}★</strong>
                    </span>
                  </div>
                )}

                {/* Commendation Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {rev.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#eeedf9] text-[#00258e] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Driver's Official Response Display */}
                {rev.driverResponse && (
                  <div className="bg-[#f0f9f5] border border-[#a3e3c5] rounded-2xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#005a36] font-bold">
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        <span>{trText('پاسخ رسمی راننده:', 'Official driver reply:', 'Resmî sürücü yanıtı:')}</span>
                      </div>
                      {rev.responseDate && (
                        <span className="text-[10px] text-[#545f72] font-jetbrains">{rev.responseDate}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#0f5132] leading-relaxed">
                      {rev.driverResponse}
                    </p>
                  </div>
                )}

                {/* Action Buttons: Reply or Dispute */}
                <div className="flex items-center justify-between pt-2 border-t border-[#e2e1ed] text-xs">
                  <div className="flex items-center gap-2">
                    {!rev.driverResponse && replyingReviewId !== rev.id && (
                      <button
                        onClick={() => handleOpenReply(rev.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#eeedf9] text-[#00258e] hover:bg-[#e0def8] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">reply</span>
                        <span>{trText('ارسال پاسخ رسمی به این دیدگاه', 'Send an official reply to this review', 'Bu değerlendirmeye resmî yanıt gönder')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDisputeReview(rev)}
                      className="px-3 py-1.5 rounded-xl text-[#747686] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/20 font-bold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                    >
                      <span className="material-symbols-outlined text-[15px]">flag</span>
                      <span>{trText('گزارش یا درخواست داوری این نظر', 'Report or request arbitration for this review', 'Bu değerlendirmeyi bildir veya itiraz et')}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-[#747686]">{trText('کد دیدگاه:', 'Review code:', 'Değerlendirme kodu:')} {rev.id}</span>
                </div>

                {/* Inline Reply Input if Open */}
                {replyingReviewId === rev.id && (
                  <div className="bg-[#f8f9fe] border border-[#c4c5da] rounded-2xl p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00258e] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        {trText(`ثبت پاسخ رسمی به ${rev.shipperName} (${rev.shipperCompany})`, `Write an official reply to ${rev.shipperName} (${rev.shipperCompany})`, `${rev.shipperName} (${rev.shipperCompany}) için resmî yanıt yaz`)}
                      </span>
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="text-[#747686] hover:text-[#1a1b23]"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      placeholder={trText('متن پاسخ رسمی شما (با لحن مودبانه و حرفه‌ای)...', 'Your official reply (in a polite and professional tone)...', 'Resmî yanıtınız (kibar ve profesyonel bir üslupla)...')}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-white p-3 rounded-xl border border-[#c4c5da] text-xs text-[#1a1b23] focus:border-[#00258e] focus:outline-none"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#545f72] hover:bg-[#e2e1ed] cursor-pointer"
                      >
                        {trText('انصراف', 'Cancel', 'İptal')}
                      </button>
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-1.5 rounded-xl bg-[#00258e] hover:bg-[#0036c5] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>
                          {isSubmittingReply
                            ? trText('در حال ثبت...', 'Submitting...', 'Kaydediliyor...')
                            : trText('ارسال و ثبت پاسخ', 'Send and save reply', 'Yanıtı gönder ve kaydet')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Dispute Modal */}
        {disputeReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-vazirmatn text-right animate-fade-in" dir={dir}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c4c5da]/70 space-y-5 relative">
              <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-2 text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[24px]">gavel</span>
                  <h3 className="font-bold text-base text-[#1a1b23]">{trText('درخواست داوری و بررسی نظر غیرمنصفانه', 'Arbitration Request and Unfair Review Investigation', 'Hakem Talebi ve Haksız Değerlendirme İncelemesi')}</h3>
                </div>
                <button
                  onClick={() => setDisputeReview(null)}
                  className="w-8 h-8 rounded-full bg-[#f0f3fa] text-[#545f72] hover:bg-[#e2e1ed] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {disputeSubmitted ? (
                <div className="p-6 text-center space-y-2 bg-[#d7f2dc]/50 rounded-2xl border border-[#a3e3c5]">
                  <span className="material-symbols-outlined text-[#005a36] text-[40px]">task_alt</span>
                  <h4 className="font-bold text-sm text-[#005a36]">{trText('درخواست با موفقیت ثبت شد', 'Request submitted successfully', 'Talep başarıyla kaydedildi')}</h4>
                  <p className="text-xs text-[#545f72]">
                    {trText(
                      'کارشناسان حل اختلاف و کمیته داوری TLD مدارک بارنامه و سنسورهای مسیر را جهت احراز صحت نظر بررسی خواهند کرد.',
                      'TLD dispute resolution experts and the arbitration committee will review waybill documents and route sensor data to verify the review.',
                      'TLD uyuşmazlık çözüm uzmanları ve hakem komitesi, değerlendirmenin doğruluğunu teyit etmek için irsaliye belgelerini ve güzergâh sensör verilerini inceleyecektir.'
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDisputeSubmit} className="space-y-4">
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#c4c5da]/50 text-xs space-y-1">
                    <span className="text-[#747686] block">{trText('دیدگاه مورد اعتراض:', 'Disputed review:', 'İtiraz edilen değerlendirme:')}</span>
                    <strong className="text-[#1a1b23] block">{disputeReview.shipperName} ({disputeReview.shipperCompany})</strong>
                    <p className="text-[#545f72] italic text-[11px]">"{disputeReview.comment}"</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1a1b23] block">
                      {trText('دلیل اعتراض و توضیحات مستند راننده:', 'Reason for the dispute and documented driver explanation:', 'İtiraz gerekçesi ve belgelenmiş sürücü açıklaması:')}
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={trText(
                        'مثال: تاخیر تخلیه ناشی از عدم حضور پرسنل انبار مبدأ در ساعت مقرر بوده و مدارک دوربین و ساعت ورود باسکول موجود است...',
                        'Example: the unloading delay was caused by the absence of origin warehouse staff at the agreed time, and camera footage and weighbridge entry time records are available...',
                        'Örnek: boşaltma gecikmesi, çıkış deposu personelinin kararlaştırılan saatte bulunmamasından kaynaklandı; kamera kayıtları ve kantara giriş saati belgeleri mevcuttur...'
                      )}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full bg-[#fbf8ff] p-3 rounded-xl border border-[#c4c5da] text-xs text-[#1a1b23] focus:border-[#00258e] focus:outline-none"
                    />
                  </div>

                  <div className="text-[11px] text-[#545f72] bg-[#f0f3fa] p-2.5 rounded-xl">
                    ⚖️ {trText(
                      'طبق آیین‌نامه راهداری TLD، در صورت اثبات خطای فرستنده، امتیاز نامطلوب از کارنامه راننده حذف می‌گردد.',
                      'According to the TLD road transport regulations, if the sender is proven to be at fault, the unfavorable rating is removed from the driver record.',
                      'TLD karayolu taşımacılığı yönetmeliğine göre, göndericinin kusuru kanıtlanırsa olumsuz puan sürücü karnesinden kaldırılır.'
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDisputeReview(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#545f72] hover:bg-[#f0f3fa] cursor-pointer"
                    >
                      {trText('انصراف', 'Cancel', 'İptal')}
                    </button>
                    <button
                      type="submit"
                      disabled={!disputeReason.trim()}
                      className="px-5 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                    >
                      {trText('ثبت و ارسال به کمیته داوری', 'Submit to Arbitration Committee', 'Hakem Komitesine Gönder')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
