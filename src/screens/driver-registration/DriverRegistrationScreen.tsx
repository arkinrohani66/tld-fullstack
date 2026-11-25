import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../types';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2Documents } from './Step2Documents';
import { Step3TruckInfo } from './Step3TruckInfo';
import { Step4BankInfo } from './Step4BankInfo';
import { Step5Confirmation } from './Step5Confirmation';

interface DriverRegistrationScreenProps {
  onComplete: () => void;
  onBackToRoleSelect: () => void;
  onGoToLogin: () => void;
  initialStep?: number;
}

export const DriverRegistrationScreen: React.FC<DriverRegistrationScreenProps> = ({
  onComplete,
  onBackToRoleSelect,
  onGoToLogin,
  initialStep = 1,
}) => {
  const { currentUser, saveProfile, saveDraft, draftProfile, showToast } = useAuth();
  const { trText } = useLanguage();

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [formData, setFormData] = useState<Partial<UserProfile>>(() => ({
    mobile: currentUser?.mobile,
    firstName: currentUser?.firstName,
    lastName: currentUser?.lastName,
    ...(draftProfile || currentUser?.profile || {}),
  }));

  const handleUpdateData = (fields: Partial<UserProfile>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      saveDraft(updated);
      return updated;
    });
  };

  const handleFinalSubmit = async () => {
    const { firstName, lastName, nationalId, dob, city, address, mobile, driverDocuments, driverTruck, driverBank } = formData;
    if (!firstName || !lastName || !nationalId || !dob || !city || !address || !mobile || !driverDocuments || !driverTruck || !driverBank) {
      showToast('error', trText('اطلاعات ثبت‌نام کامل نیست. لطفاً مراحل قبلی را بررسی کنید.', 'The registration information is incomplete. Please check the previous steps.', 'Kayıt bilgileri eksik. Lütfen önceki adımları kontrol edin.'));
      return;
    }

    const profile: UserProfile = {
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      nationalId,
      dob,
      city,
      address,
      mobile,
      province: formData.province ?? '',
      postalCode: formData.postalCode ?? '',
      driverId: formData.driverId ?? '',
      fleetType: formData.fleetType ?? '',
      driverDocuments,
      driverTruck,
      driverBank,
      registrationStep: 5,
      truckModel: `${driverTruck.brand} ${driverTruck.model}`.trim(),
      plateNumber: `${driverTruck.platePart1} ${driverTruck.plateLetter} ${driverTruck.platePart2} ایران ${driverTruck.plateIranCode}`,
    };

    await saveProfile(profile);
    showToast('success', trText('ثبت‌نام راننده با موفقیت انجام شد.', 'Driver registration completed successfully.', 'Sürücü kaydı başarıyla tamamlandı.'));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-vazirmatn">
      {currentStep === 1 && (
        <Step1PersonalInfo
          data={formData}
          onChange={handleUpdateData}
          onNext={() => setCurrentStep(2)}
          onPrev={onBackToRoleSelect}
          onLoginClick={onGoToLogin}
        />
      )}
      {currentStep === 2 && (
        <Step2Documents
          data={formData}
          onChange={handleUpdateData}
          onNext={() => setCurrentStep(3)}
          onPrev={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 3 && (
        <Step3TruckInfo
          data={formData}
          onChange={handleUpdateData}
          onNext={() => setCurrentStep(4)}
          onPrev={() => setCurrentStep(2)}
        />
      )}
      {currentStep === 4 && (
        <Step4BankInfo
          data={formData}
          onChange={handleUpdateData}
          onNext={() => setCurrentStep(5)}
          onPrev={() => setCurrentStep(3)}
        />
      )}
      {currentStep === 5 && (
        <Step5Confirmation
          data={formData}
          onSubmit={handleFinalSubmit}
          onPrev={() => setCurrentStep(4)}
          onGoToStep={setCurrentStep}
        />
      )}
    </div>
  );
};
