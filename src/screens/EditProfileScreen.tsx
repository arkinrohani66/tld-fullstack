import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen } from '../types';
import { isSupabaseConfigured, getTargetSupabaseUrl } from '../services/supabaseClient';
import { ProvinceCitySelect } from '../components/common/ProvinceCitySelect';

interface EditProfileScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onNavigate }) => {
  const { currentUser, role, updateProfile, showToast, isOffline } = useAuth();
  const { trText } = useLanguage();

  const [fullName, setFullName] = useState(
    currentUser?.profile?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '')
  );
  const [email, setEmail] = useState(
    currentUser?.profile?.email || (currentUser?.mobile ? `${currentUser.mobile.replace(/[^0-9]/g, '')}@tldlogistics.ir` : '')
  );
  const [dob, setDob] = useState(currentUser?.profile?.dob || '');
  const [province, setProvince] = useState(currentUser?.profile?.province || '');
  const [city, setCity] = useState(currentUser?.profile?.city || '');
  const [postalCode, setPostalCode] = useState(currentUser?.profile?.postalCode || '');
  const [address, setAddress] = useState(currentUser?.profile?.address || '');
  const [profileImage, setProfileImage] = useState(currentUser?.profile?.profileImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const nationalId = currentUser?.profile?.nationalId || '';
  const maskedNationalId = nationalId.length > 4 ? `********${nationalId.slice(-2)}` : (nationalId ? `****${nationalId}` : trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil'));
  const mobile = currentUser?.mobile || trText('ثبت‌نشده', 'Not registered', 'Kayıtlı değil');
  const driverId = currentUser?.profile?.driverId || currentUser?.requestId || 'TLD-DRIVER';

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (fullName) score += 20;
    if (nationalId) score += 20;
    if (mobile) score += 15;
    if (email) score += 15;
    if (dob) score += 10;
    if (address && postalCode) score += 20;
    return Math.min(score, 100);
  };

  const completion = calculateCompletion();

  const handleCopyId = () => {
    navigator.clipboard?.writeText(driverId);
    setCopiedId(true);
    showToast('info', trText(`شناسه ${driverId} در حافظه کپی شد.`, `ID ${driverId} copied to clipboard.`, `${driverId} kimliği panoya kopyalandı.`));
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
          showToast('success', trText('تصویر پروفایل انتخاب شد.', 'Profile photo selected.', 'Profil fotoğrafı seçildi.'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast('error', trText('لطفاً نام و نام خانوادگی را وارد کنید.', 'Please enter your full name.', 'Lütfen adınızı ve soyadınızı girin.'));
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        dob: dob.trim(),
        province,
        city,
        postalCode: postalCode.trim(),
        address: address.trim(),
        profileImage,
      });
      showToast('success', trText('اطلاعات با موفقیت در پایگاه داده Supabase ثبت شد.', 'Your details were saved to the Supabase database successfully.', 'Bilgileriniz Supabase veritabanına başarıyla kaydedildi.'));
      setTimeout(() => {
        onNavigate('PROFILE');
      }, 600);
    } catch (err: any) {
      showToast('error', err.message || trText('خطا در ذخیره‌سازی اطلاعات', 'Failed to save your details', 'Bilgiler kaydedilirken hata oluştu'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen pb-32 font-vazirmatn selection:bg-[#0036c5] selection:text-white">
      {/* TopAppBar */}
      <header className="bg-[#fbf8ff] border-b border-[#c4c5da] flex justify-between items-center px-4 md:px-8 w-full h-16 sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            aria-label="Back"
            onClick={() => onNavigate('PROFILE')}
            className="p-2 rounded-full hover:bg-[#e8e7f3] transition-colors text-[#00258e] cursor-pointer"
          >
            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-[#1a1b23]">{trText('ویرایش پروفایل', 'Edit Profile', 'Profili Düzenle')}</h1>
            <span className="font-jetbrains text-[11px] text-[#747686] uppercase tracking-wider" dir="ltr">
              EDIT PROFILE
            </span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="font-jetbrains text-sm font-semibold text-[#00258e] hover:bg-[#0036c5]/10 px-4 py-2 rounded transition-colors uppercase cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          {isSaving ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">check</span>
          )}
          <span>{trText('ذخیره', 'Save', 'Kaydet')}</span>
        </button>
      </header>

      {/* Supabase Status Pill */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between bg-white border border-[#c4c5da] rounded-xl px-4 py-2 text-xs font-jetbrains">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConfigured() && !isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[#444655]">
              {isSupabaseConfigured() && !isOffline ? 'SUPABASE SYNC: CONNECTED' : 'STORAGE: LOCAL FALLBACK'}
            </span>
          </div>
          <span className="text-[#747686] truncate max-w-[200px]" dir="ltr">
            {getTargetSupabaseUrl()}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 md:px-8 pt-6 flex flex-col gap-8">
        {/* Profile Image & Completion */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32 group cursor-pointer">
              <img
                className="w-full h-full rounded-full object-cover border-4 border-[#e2e1ed] shadow-sm"
                src={profileImage}
                alt={fullName}
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-[#1a1b23]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
              </label>
              <button
                type="button"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute bottom-0 right-0 bg-[#00258e] text-white rounded-full p-2 border-2 border-white shadow-sm cursor-pointer hover:bg-[#0036c5] active:scale-95"
                title={trText('تغییر عکس از گالری', 'Change photo from gallery', 'Fotoğrafı galeriden değiştir')}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                onChange={handleImageChange}
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="font-jetbrains text-sm font-semibold text-[#00258e] hover:underline mt-2 cursor-pointer active:scale-95"
            >
              {trText('تغییر تصویر از گالری', 'Change photo from gallery', 'Fotoğrafı galeriden değiştir')}
            </button>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center gap-4 pt-4 md:pt-0">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-[#1a1b23]">{trText('تکمیل پروفایل', 'Profile Completion', 'Profil Tamamlama')}</span>
              <div className="flex items-center gap-1 text-[#00a368]">
                <span className="font-jetbrains text-xl font-bold" dir="ltr">
                  {completion}%
                </span>
                <span className="material-symbols-outlined text-sm text-[#00a368]">check_circle</span>
              </div>
            </div>
            <div className="w-full bg-[#e2e1ed] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#00258e] h-full rounded-full transition-all duration-700"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-sm text-[#444655]">
              {trText('برای دسترسی به تمامی امکانات باربری و تسویه خودکار، اطلاعات کاربری خود را تکمیل کنید.', 'Complete your account details to unlock all freight features and automatic settlements.', 'Tüm nakliye özelliklerine ve otomatik hesaplaşmaya erişmek için hesap bilgilerinizi tamamlayın.')}
            </p>
          </div>
        </section>

        {/* Personal Info Form */}
        <section className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <h2 className="text-xl font-bold text-[#1a1b23] border-b border-[#c4c5da] pb-3 flex items-center justify-between">
            <span>{trText('اطلاعات شخصی', 'Personal Information', 'Kişisel Bilgiler')}</span>
            <span className="font-jetbrains text-xs text-[#747686]">PERSONAL DATA</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#444655]">{trText('نام و نام خانوادگی', 'Full Name', 'Ad ve Soyad')}</label>
              <input
                className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 text-base text-[#1a1b23] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none transition-shadow"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={trText('نام و نام خانوادگی خود را وارد کنید', 'Enter your full name', 'Adınızı ve soyadınızı girin')}
              />
            </div>

            {/* National ID (Read Only) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#444655] flex justify-between">
                <span>{trText('کد ملی', 'National ID', 'Kimlik Numarası')}</span>
                <span className="text-[11px] text-[#747686]">{trText('نیاز به تایید مجدد برای تغییر', 'Requires re-verification to change', 'Değiştirmek için yeniden doğrulama gerekir')}</span>
              </label>
              <div className="w-full bg-[#f4f2fe] border border-[#c4c5da] rounded-xl p-3 flex items-center justify-between cursor-not-allowed opacity-85">
                <span className="font-jetbrains text-sm tracking-widest text-[#444655]" dir="ltr">
                  {maskedNationalId}
                </span>
                <span className="material-symbols-outlined text-[#747686] text-[18px]">lock</span>
              </div>
            </div>

            {/* Mobile (Read Only) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#444655]">{trText('شماره موبایل', 'Mobile Number', 'Cep Telefonu')}</label>
              <div className="w-full bg-[#f4f2fe] border border-[#00a368]/40 rounded-xl p-3 flex items-center justify-between cursor-not-allowed">
                <span className="font-jetbrains text-sm font-bold text-[#1a1b23]" dir="ltr">
                  {mobile}
                </span>
                <span
                  className="material-symbols-outlined text-[#00a368] text-sm"
                  title="Verified"
                >
                  verified
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#444655]">{trText('ایمیل', 'Email', 'E-posta')}</label>
              <input
                className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 font-jetbrains text-sm text-[#1a1b23] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none transition-shadow text-left"
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@tld-logistics.ir"
              />
            </div>

            {/* DOB */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-[#444655]">{trText('تاریخ تولد', 'Date of Birth', 'Doğum Tarihi')}</label>
              <div className="relative">
                <input
                  className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 pr-10 font-jetbrains text-sm text-[#1a1b23] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none transition-shadow"
                  dir="ltr"
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="1360/05/15"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none">
                  calendar_month
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Location Info Form */}
        <section className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <h2 className="text-xl font-bold text-[#1a1b23] border-b border-[#c4c5da] pb-3 flex items-center justify-between">
            <span>{trText('اطلاعات محل سکونت', 'Residential Address', 'İkamet Bilgileri')}</span>
            <span className="font-jetbrains text-xs text-[#747686]">LOCATION & ADDRESS</span>
          </h2>

          <ProvinceCitySelect
            selectedProvince={province}
            selectedCity={city}
            onProvinceChange={(p) => setProvince(p)}
            onCityChange={(c) => setCity(c)}
            provinceLabel={trText('استان محل سکونت', 'Province of Residence', 'İkamet Ettiğiniz İl')}
            cityLabel={trText('شهر محل سکونت', 'City of Residence', 'İkamet Ettiğiniz Şehir')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Postal Code */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-[#444655]">{trText('کد پستی (۱۰ رقم)', 'Postal Code (10 digits)', 'Posta Kodu (10 hane)')}</label>
              <input
                className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 font-jetbrains text-sm text-[#1a1b23] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none transition-shadow text-left"
                dir="ltr"
                maxLength={10}
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="14155-6483"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-[#444655]">{trText('آدرس دقیق', 'Full Address', 'Açık Adres')}</label>
              <textarea
                className="w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 text-base text-[#1a1b23] focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none transition-shadow resize-y"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={trText('خیابان، کوچه، پلاک، واحد...', 'Street, alley, number, unit...', 'Sokak, ara sokak, kapı no, daire...')}
              />
            </div>
          </div>
        </section>

        {/* Role & Entity Data */}
        <section className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <h2 className="text-xl font-bold text-[#1a1b23] border-b border-[#c4c5da] pb-3 flex items-center justify-between">
            <span>{trText('اطلاعات سازمانی', 'Organization Details', 'Kurumsal Bilgiler')}</span>
            <span className="font-jetbrains text-xs text-[#747686]">ORGANIZATION & FLEET</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Card */}
            <div className="bg-[#f4f2fe] border border-[#c4c5da] rounded-xl p-4 flex flex-col gap-2">
              <span className="font-jetbrains text-[11px] text-[#747686] uppercase tracking-wider" dir="ltr">
                ROLE
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">
                  {role === 'SHIPPER' ? 'corporate_fare' : 'local_shipping'}
                </span>
                <span className="text-base font-bold text-[#1a1b23]">
                  {role === 'SHIPPER' ? trText('صاحب بار تجاری (SHIPPER)', 'Commercial Shipper (SHIPPER)', 'Ticari Yük Sahibi (SHIPPER)') : trText('راننده خودروی سنگین (DRIVER)', 'Heavy Vehicle Driver (DRIVER)', 'Ağır Vasıta Sürücüsü (DRIVER)')}
                </span>
              </div>
            </div>

            {/* Driver ID Card */}
            <div className="bg-[#f4f2fe] border border-[#c4c5da] rounded-xl p-4 flex flex-col gap-2">
              <span className="font-jetbrains text-[11px] text-[#747686] uppercase tracking-wider" dir="ltr">
                {role === 'SHIPPER' ? 'SHIPPER ID' : 'DRIVER ID'}
              </span>
              <div className="flex justify-between items-center">
                <span className="font-jetbrains text-lg font-bold text-[#1a1b23]" dir="ltr">
                  {driverId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-[#444655] hover:text-[#00258e] transition-colors p-1.5 rounded-lg hover:bg-white cursor-pointer"
                  title={trText('کپی شناسه', 'Copy ID', 'Kimliği kopyala')}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedId ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Fixed Action */}
      <div className="fixed bottom-0 left-0 w-full bg-[#fbf8ff] border-t border-[#c4c5da] p-4 z-40 flex justify-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full max-w-3xl bg-[#00258e] hover:bg-[#0034bf] text-white font-jetbrains text-sm font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50"
          id="saveBtn"
        >
          {isSaving ? (
            <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-xl">save</span>
          )}
          <span className="font-vazirmatn">{trText('ذخیره تغییرات در Supabase', 'Save Changes to Supabase', 'Değişiklikleri Supabase\'e Kaydet')}</span>
        </button>
      </div>
    </div>
  );
};
