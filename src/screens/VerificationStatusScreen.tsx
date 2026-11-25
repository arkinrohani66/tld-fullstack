import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { VerificationStatus } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface VerificationStatusScreenProps {
  onBack: () => void;
  onGoToDashboard: () => void;
  onResubmitProfile: () => void;
}

export const VerificationStatusScreen: React.FC<VerificationStatusScreenProps> = ({
  onBack,
  onGoToDashboard,
  onResubmitProfile,
}) => {
  const {
    currentUser,
    verificationStatus,
    logout,
    role,
  } = useAuth();
  const { t, language, trText } = useLanguage();

  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const requestId = currentUser?.requestId || 'REQ-9428-B';
  const submittedAt =
    currentUser?.submittedAt
      ? new Date(currentUser.submittedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      : '2023-10-27 10:45:22 UTC';

  const handleCopyRequestId = () => {
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex flex-col items-center justify-start p-4 md:p-8 select-none">
      {/* Top App Bar */}
      <header className="w-full max-w-3xl flex items-center justify-between py-3 px-4 border-b border-[#c4c5da] bg-white rounded-xl shadow-sm mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#00258e] hover:bg-[#eeedf9] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">
            {language === 'fa' ? 'arrow_forward' : 'arrow_back'}
          </span>
          <span className="font-vazirmatn text-xs font-semibold">{t.back}</span>
        </button>

        <h1 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
          {trText('وضعیت احراز هویت', 'Verification Status', 'Doğrulama Durumu')}
        </h1>

        <div className="font-jetbrains text-xs font-black tracking-tighter text-[#00258e]">
          TLD.LOGISTICS
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-3xl flex flex-col gap-6">
        {/* Status Card (Pending / Approved / Rejected) */}
        {verificationStatus === 'APPROVED' ? (
          <section className="bg-white rounded-2xl border-2 border-[#00a368] p-6 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#00a368]/10 flex items-center justify-center border-4 border-[#00a368]">
              <span className="material-symbols-outlined text-[#00a368] text-5xl">verified</span>
            </div>
            <div>
              <h2 className="font-vazirmatn text-2xl font-bold text-[#00a368]">
                {trText('احراز هویت تایید شد', 'Verification Approved', 'Kimlik Doğrulaması Onaylandı')}
              </h2>
              <p className="font-jetbrains text-xs font-bold text-[#00a368] uppercase tracking-widest mt-0.5">
                VERIFICATION APPROVED
              </p>
            </div>
            <p className="font-vazirmatn text-sm text-[#545f72] max-w-md">
              {trText('حساب کاربری شما با موفقیت تایید و فعال شد. اکنون می‌توانید به داشبورد دسترسی داشته باشید.', 'Your account has been successfully verified and activated. You can now access the dashboard.', 'Hesabınız başarıyla doğrulandı ve etkinleştirildi. Artık panonuza erişebilirsiniz.')}
            </p>
            <Button onClick={onGoToDashboard} variant="primary" size="lg">
              {role === 'DRIVER'
                ? trText('ورود به داشبورد راننده', 'Go to Driver Dashboard', 'Sürücü Panosuna Git')
                : trText('ورود به داشبورد صاحب بار', 'Go to Cargo Owner Dashboard', 'Yük Sahibi Panosuna Git')}
            </Button>
          </section>
        ) : verificationStatus === 'REJECTED' || verificationStatus === 'RESUBMIT_REQUIRED' ? (
          <section className="bg-white rounded-2xl border-2 border-[#ba1a1a] p-6 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#ffdad6] flex items-center justify-center border-4 border-[#ba1a1a]">
              <span className="material-symbols-outlined text-[#ba1a1a] text-5xl">cancel</span>
            </div>
            <div>
              <h2 className="font-vazirmatn text-2xl font-bold text-[#ba1a1a]">
                {trText('نیاز به اصلاح مدارک', 'Documents Need Correction', 'Belgelerin Düzeltilmesi Gerekiyor')}
              </h2>
              <p className="font-jetbrains text-xs font-bold text-[#ba1a1a] uppercase tracking-widest mt-0.5">
                ACTION REQUIRED / RESUBMISSION
              </p>
            </div>
            <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 p-3 rounded-lg text-xs font-vazirmatn text-[#93000a] max-w-md">
              {trText('علت رد: اطلاعات کد ملی یا تصویر ارسالی با مشخصات هویتی همخوانی ندارد. لطفاً پروفایل را ویرایش نمایید.', 'Rejection reason: The national ID details or the uploaded image do not match your identity information. Please edit your profile.', 'Red nedeni: Kimlik numarası bilgileri veya gönderilen görsel kimlik bilgilerinizle eşleşmiyor. Lütfen profilinizi düzenleyin.')}
            </div>
            <Button onClick={onResubmitProfile} variant="danger">
              {trText('ویرایش و ارسال مجدد پروفایل', 'Edit and Resubmit Profile', 'Profili Düzenle ve Yeniden Gönder')}
            </Button>
          </section>
        ) : (
          /* Default: PENDING REVIEW */
          <section className="bg-white rounded-2xl border border-[#c4c5da] shadow-[0px_4px_16px_rgba(0,37,142,0.06)] p-6 md:p-8 flex flex-col items-center text-center gap-4 relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-[#f4f2fe] flex items-center justify-center border-4 border-[#eab308] relative z-10 animate-pulse">
              <span className="material-symbols-outlined text-[#eab308] text-4xl">hourglass_top</span>
            </div>

            <div className="flex flex-col gap-1 z-10">
              <h2 className="font-vazirmatn text-2xl font-bold text-[#1a1b23]">
                {t.underReview}
              </h2>
              <p className="font-jetbrains text-xs font-bold text-[#eab308] tracking-widest uppercase">
                {t.pendingReview}
              </p>
            </div>

            <p className="font-vazirmatn text-sm text-[#545f72] max-w-lg leading-relaxed z-10">
              {t.reviewNotice}
            </p>

            <button
              onClick={() => setDocsModalOpen(true)}
              className="mt-1 bg-[#00258e] text-white hover:bg-[#0036c5] px-5 py-2.5 rounded-lg text-xs font-jetbrains font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer z-10"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>{t.viewDocs}</span>
            </button>
          </section>
        )}

        {/* Technical Details & Timeline Grid (Bento) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Timeline Section */}
          <section className="md:col-span-7 bg-white rounded-2xl border border-[#c4c5da] p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="font-vazirmatn text-base font-bold text-[#1a1b23] flex items-center gap-2 border-b border-[#e2e1ed] pb-3">
              <span className="material-symbols-outlined text-[#00258e]">timeline</span>
              <span>{t.approvalStages}</span>
            </h2>

            <div className="flex flex-col relative border-s-2 border-[#e2e1ed] gap-6 ms-4 ps-6 my-1">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -start-[31px] top-0.5 w-5 h-5 rounded-full bg-[#00a368] border-2 border-white flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">{t.step1}</span>
                  <span className="font-jetbrains text-[10px] text-[#545f72] mt-0.5" dir="ltr">
                    COMPLETED • 10:42 AM
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -start-[31px] top-0.5 w-5 h-5 rounded-full bg-[#00a368] border-2 border-white flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-vazirmatn text-sm font-semibold text-[#1a1b23]">{t.step2}</span>
                  <span className="font-jetbrains text-[10px] text-[#545f72] mt-0.5" dir="ltr">
                    COMPLETED • 10:45 AM
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -start-[32px] top-0.5 w-5 h-5 rounded-full bg-[#eab308] border-2 border-white flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-vazirmatn text-sm font-bold text-[#00258e]">{t.step3}</span>
                  <span className="font-jetbrains text-[10px] text-[#eab308] font-bold mt-0.5" dir="ltr">
                    IN PROGRESS • EST: &lt; 24H
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative opacity-60">
                <div className="absolute -start-[31px] top-0.5 w-5 h-5 rounded-full bg-[#e2e1ed] border-2 border-white flex items-center justify-center" />
                <div className="flex flex-col">
                  <span className="font-vazirmatn text-sm text-[#545f72]">{t.step4}</span>
                  <span className="font-jetbrains text-[10px] text-[#747686] mt-0.5" dir="ltr">
                    PENDING
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Metadata & Support Section */}
          <section className="md:col-span-5 flex flex-col gap-4">
            {/* Request ID Box */}
            <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm flex flex-col gap-2">
              <span className="font-jetbrains text-[11px] text-[#545f72] uppercase font-bold tracking-wider">
                {t.requestId}
              </span>
              <div className="flex items-center justify-between bg-[#f4f2fe] p-2 rounded-lg border border-[#c4c5da]">
                <span className="font-jetbrains text-sm font-bold text-[#1a1b23]" dir="ltr">
                  {requestId}
                </span>
                <button
                  onClick={handleCopyRequestId}
                  className="p-1 rounded text-[#00258e] hover:bg-white transition-colors cursor-pointer"
                  title={trText('کپی شناسه درخواست', 'Copy Request ID', 'Talep No’yu Kopyala')}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submitted Timestamp Box */}
            <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm flex flex-col gap-1">
              <span className="font-jetbrains text-[11px] text-[#545f72] uppercase font-bold tracking-wider">
                {t.submittedAt}
              </span>
              <span className="font-jetbrains text-sm font-bold text-[#1a1b23]" dir="ltr">
                {submittedAt}
              </span>
            </div>

            {/* Support Box */}
            <div className="bg-[#f4f2fe] rounded-2xl border border-[#c4c5da] p-4 flex items-start gap-3 mt-auto">
              <span className="material-symbols-outlined text-[#00258e] text-2xl mt-0.5">support_agent</span>
              <div className="flex flex-col">
                <span className="font-vazirmatn text-xs font-bold text-[#1a1b23]">{t.needSupport}</span>
                <span className="font-vazirmatn text-[11px] text-[#545f72] mt-0.5">
                  {trText('تماس با پشتیبانی فنی لجستیک TLD', 'Contact TLD logistics technical support', 'TLD lojistik teknik desteğiyle iletişime geçin')}
                </span>
                <a
                  href="tel:+982191000000"
                  className="font-jetbrains text-xs font-bold text-[#00258e] mt-1.5 hover:underline"
                  dir="ltr"
                >
                  +98 (21) 9100 0000
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] px-4 py-2 rounded-lg font-jetbrains font-bold text-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>{t.logOut}</span>
          </button>
        </div>
      </main>

      {/* View Documents Modal */}
      <Modal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        title={trText('مدارک ثبت شده کاربر', 'Submitted Documents', 'Gönderilen Belgeler')}
      >
        <div className="flex flex-col gap-4 font-vazirmatn text-sm">
          {currentUser?.profile?.profileImage && (
            <div className="flex items-center gap-3 bg-[#f4f2fe] p-3 rounded-lg border border-[#c4c5da]">
              <img
                src={currentUser.profile.profileImage}
                alt={trText('تصویر پروفایل', 'Profile photo', 'Profil fotoğrafı')}
                className="w-14 h-14 rounded-full object-cover border"
              />
              <div>
                <span className="font-bold text-xs block text-[#1a1b23]">{trText('تصویر پرسنلی / چهره', 'Personal / Face Photo', 'Kişisel / Yüz Fotoğrafı')}</span>
                <span className="font-jetbrains text-[10px] text-[#00a368] font-bold">VERIFIED_HASH_OK</span>
              </div>
            </div>
          )}

          <div className="bg-[#f4f2fe] p-3 rounded-lg border border-[#c4c5da] flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('نام و نام خانوادگی:', 'Full name:', 'Ad soyad:')}</span>
              <span className="font-bold text-[#1a1b23]">{currentUser?.profile?.fullName || trText('ثبت نشده', 'Not provided', 'Kayıtlı değil')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('کد ملی:', 'National ID:', 'Kimlik no:')}</span>
              <span className="font-jetbrains font-bold text-[#1a1b23]">{currentUser?.profile?.nationalId || trText('ثبت نشده', 'Not provided', 'Kayıtlı değil')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('نقش کاربری:', 'User role:', 'Kullanıcı rolü:')}</span>
              <span className="font-jetbrains font-bold text-[#00258e]">{role || 'DRIVER'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545f72]">{trText('آدرس پستی:', 'Postal address:', 'Posta adresi:')}</span>
              <span className="font-semibold text-[#1a1b23] text-xs max-w-[200px] truncate">{currentUser?.profile?.address || trText('ثبت نشده', 'Not provided', 'Kayıtlı değil')}</span>
            </div>
          </div>

          <Button onClick={() => setDocsModalOpen(false)} variant="outline" fullWidth>
            {trText('بستن', 'Close', 'Kapat')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
