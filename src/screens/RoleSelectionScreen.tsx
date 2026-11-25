import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { TLDLogo } from '../components/brand/TLDLogo';

interface RoleSelectionScreenProps {
  onRoleSelected: (role: UserRole) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onRoleSelected,
}) => {
  const { selectRole, role, isOffline } = useAuth();
  const { t, language } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(role || 'DRIVER');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole || isOffline) return;
    setLoading(true);
    try {
      await selectRole(selectedRole);
      onRoleSelected(selectedRole);
    } catch (err) {
      console.error(err);
      onRoleSelected(selectedRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex flex-col items-center justify-center p-4 md:p-6 select-none relative">
      {/* Decorative Technical Tag */}
      <div className="fixed top-4 start-4 font-jetbrains text-xs text-[#747686] opacity-60" dir="ltr">
        SYS_AUTH_INIT // v1.0.42
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#c4c5da] shadow-[0px_4px_24px_rgba(0,37,142,0.08)] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-[#c4c5da] bg-[#f4f2fe] text-center flex flex-col items-center">
          <TLDLogo variant="compact" showPersianSlogan={false} className="mb-2" />
          <h1 className="font-vazirmatn text-xl font-bold text-[#1a1b23] mb-1">
            {t.selectRole}
          </h1>
          <p className="font-vazirmatn text-xs text-[#545f72]">
            {t.selectRoleSubtitle}
          </p>
        </header>

        {/* Content Roles List */}
        <main className="p-6 flex flex-col gap-4">
          {/* Driver Card */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === 'DRIVER'}
            onClick={() => setSelectedRole('DRIVER')}
            className={`w-full text-start p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer ${
              selectedRole === 'DRIVER'
                ? 'border-[#00258e] bg-[#f4f2fe] shadow-[0px_4px_12px_rgba(0,37,142,0.08)]'
                : 'border-[#c4c5da] bg-white hover:bg-[#fbf8ff]'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                selectedRole === 'DRIVER'
                  ? 'bg-[#00258e] text-white shadow-md'
                  : 'bg-[#eeedf9] text-[#00258e]'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>

            <div className="flex-1">
              <h2 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                {t.driver}
              </h2>
              <div className="font-jetbrains text-xs font-bold text-[#00258e] uppercase tracking-wider" dir="ltr">
                DRIVER
              </div>
              <p className="font-vazirmatn text-xs text-[#545f72] mt-0.5">
                {t.driverSubtitle}
              </p>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedRole === 'DRIVER' ? 'border-[#00258e]' : 'border-[#c4c5da]'
              }`}
            >
              {selectedRole === 'DRIVER' && <div className="w-3 h-3 rounded-full bg-[#00258e]" />}
            </div>
          </button>

          {/* Shipper Card */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === 'SHIPPER'}
            onClick={() => setSelectedRole('SHIPPER')}
            className={`w-full text-start p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer ${
              selectedRole === 'SHIPPER'
                ? 'border-[#00258e] bg-[#f4f2fe] shadow-[0px_4px_12px_rgba(0,37,142,0.08)]'
                : 'border-[#c4c5da] bg-white hover:bg-[#fbf8ff]'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                selectedRole === 'SHIPPER'
                  ? 'bg-[#00258e] text-white shadow-md'
                  : 'bg-[#eeedf9] text-[#00258e]'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>

            <div className="flex-1">
              <h2 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                {t.shipper}
              </h2>
              <div className="font-jetbrains text-xs font-bold text-[#00258e] uppercase tracking-wider" dir="ltr">
                SHIPPER
              </div>
              <p className="font-vazirmatn text-xs text-[#545f72] mt-0.5">
                {t.shipperSubtitle}
              </p>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedRole === 'SHIPPER' ? 'border-[#00258e]' : 'border-[#c4c5da]'
              }`}
            >
              {selectedRole === 'SHIPPER' && <div className="w-3 h-3 rounded-full bg-[#00258e]" />}
            </div>
          </button>
        </main>

        {/* Footer Action */}
        <footer className="p-6 bg-[#f4f2fe] border-t border-[#c4c5da]">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!selectedRole || isOffline}
            loading={loading}
            variant="primary"
            fullWidth
            icon={
              <span className="material-symbols-outlined text-[18px]">
                {language === 'fa' ? 'arrow_back' : 'arrow_forward'}
              </span>
            }
          >
            {t.continue}
          </Button>
        </footer>
      </div>
    </div>
  );
};
