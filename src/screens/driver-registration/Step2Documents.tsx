import React, { useMemo, useState } from 'react';
import { DriverDocuments, UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { RegistrationHeader } from './RegistrationHeader';
import { DocumentUploadTile, ErrorBanner, StepActions, readImageAsDataUrl } from './RegistrationFields';

interface Step2DocumentsProps {
  data: Partial<UserProfile>;
  onChange: (fields: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface DocumentItem {
  id: keyof DriverDocuments;
  title: string;
  hint: string;
  required: boolean;
}

export const Step2Documents: React.FC<Step2DocumentsProps> = ({ data, onChange, onNext, onPrev }) => {
  const { trText } = useLanguage();
  const [docs, setDocs] = useState<Partial<DriverDocuments>>(data.driverDocuments ?? {});
  const [error, setError] = useState('');

  const documentItems = useMemo<DocumentItem[]>(() => [
    { id: 'nationalCardFront', title: trText('کارت ملی (روی کارت)', 'National ID card (front)', 'Kimlik kartı (ön yüz)'), hint: trText('تصویر واضح و بدون بازتاب نور', 'A clear photo without glare', 'Parlama olmadan net bir fotoğraf'), required: true },
    { id: 'nationalCardBack', title: trText('کارت ملی (پشت کارت)', 'National ID card (back)', 'Kimlik kartı (arka yüz)'), hint: trText('بارکد و اطلاعات پشت کارت باید خوانا باشد', 'The barcode and the details on the back must be legible', 'Arka yüzdeki barkod ve bilgiler okunabilir olmalıdır'), required: true },
    { id: 'driverLicense', title: trText('گواهینامه رانندگی', 'Driving licence', 'Sürücü belgesi'), hint: trText('پایه گواهینامه و تاریخ انقضا باید مشخص باشد', 'The licence class and expiry date must be visible', 'Ehliyet sınıfı ve son kullanma tarihi görünmelidir'), required: true },
    { id: 'smartCard', title: trText('کارت هوشمند راننده (راهداری)', 'Driver smart card (road administration)', 'Sürücü akıllı kartı (karayolları)'), hint: trText('کارت هوشمند فعال سازمان راهداری', 'A valid smart card issued by the road administration', 'Karayolları idaresince verilmiş geçerli akıllı kart'), required: true },
    { id: 'healthCard', title: trText('کارت سلامت راننده', 'Driver health card', 'Sürücü sağlık kartı'), hint: trText('تاریخ اعتبار کارت باید مشخص باشد', 'The card expiry date must be visible', 'Kartın geçerlilik tarihi görünmelidir'), required: true },
    { id: 'personalPhoto', title: trText('عکس پرسنلی', 'Personal photo', 'Vesikalık fotoğraf'), hint: trText('عکس روشن از چهره، بدون عینک آفتابی و کلاه', 'A bright photo of your face without sunglasses or a hat', 'Güneş gözlüğü ve şapka olmadan net bir yüz fotoğrafı'), required: true },
    { id: 'selfie', title: trText('سلفی با کارت ملی', 'Selfie with national ID card', 'Kimlik kartıyla selfie'), hint: trText('چهره و کارت ملی هر دو کاملاً واضح باشند', 'Both your face and the ID card must be fully clear', 'Hem yüzünüz hem de kimlik kartınız tamamen net olmalıdır'), required: true },
    { id: 'birthCertificate', title: trText('صفحه اول شناسنامه', 'Birth certificate (first page)', 'Nüfus cüzdanı (ilk sayfa)'), hint: trText('در صورت نیاز به بررسی تکمیلی', 'Only if additional verification is required', 'Yalnızca ek doğrulama gerekirse'), required: false },
  ], [trText]);

  const missingRequired = documentItems.filter((item) => item.required && !docs[item.id]);

  const updateDocs = (next: Partial<DriverDocuments>) => {
    setDocs(next);
    onChange({ driverDocuments: next as DriverDocuments });
  };

  const handleFile = async (key: keyof DriverDocuments, file: File) => {
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setError('');
      updateDocs({ ...docs, [key]: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : trText('بارگذاری تصویر انجام نشد.', 'Image upload failed.', 'Görsel yüklenemedi.'));
    }
  };

  const handleRemove = (key: keyof DriverDocuments) => {
    const next = { ...docs };
    delete next[key];
    updateDocs(next);
  };

  const handleNext = () => {
    if (missingRequired.length > 0) {
      setError(trText(`لطفاً مدارک الزامی را بارگذاری کنید (${missingRequired.length} مدرک باقی مانده).`, `Please upload the required documents (${missingRequired.length} remaining).`, `Lütfen zorunlu belgeleri yükleyin (${missingRequired.length} belge kaldı).`));
      return;
    }
    setError('');
    onChange({ driverDocuments: docs as DriverDocuments });
    onNext();
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <RegistrationHeader
        currentStep={2}
        title={trText('بارگذاری مدارک راننده', 'Upload driver documents', 'Sürücü belgelerini yükle')}
        subtitle={trText('تصویر واضح از مدارک اصلی خود را بارگذاری کنید', 'Upload clear photos of your original documents', 'Orijinal belgelerinizin net fotoğraflarını yükleyin')}
        onBack={onPrev}
      />

      <main className="w-full max-w-3xl mx-auto px-4 py-6 pb-28 flex flex-col gap-4">
        <p className="text-xs text-[#64748b] leading-relaxed">
          {trText(`هر تصویر باید حداکثر ۵ مگابایت باشد. مدارک الزامی ${documentItems.filter((i) => i.required).length - missingRequired.length} از ${documentItems.filter((i) => i.required).length} تکمیل شده است.`, `Each image must be at most 5 MB. Required documents: ${documentItems.filter((i) => i.required).length - missingRequired.length} of ${documentItems.filter((i) => i.required).length} completed.`, `Her görsel en fazla 5 MB olmalıdır. Zorunlu belgeler: ${documentItems.filter((i) => i.required).length - missingRequired.length} / ${documentItems.filter((i) => i.required).length} tamamlandı.`)}
        </p>

        <ErrorBanner message={error} />

        {documentItems.map((item) => (
          <DocumentUploadTile
            key={item.id}
            inputId={`driver-doc-${item.id}`}
            title={item.title}
            hint={item.hint}
            required={item.required}
            value={docs[item.id]}
            onFile={(file) => handleFile(item.id, file)}
            onRemove={() => handleRemove(item.id)}
          />
        ))}

        <StepActions onBack={onPrev} onNext={handleNext} nextLabel={trText('ادامه به مشخصات خودرو', 'Continue to vehicle details', 'Araç bilgilerine devam et')} />
      </main>
    </div>
  );
};
