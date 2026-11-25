import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const inputClass =
  'w-full h-12 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:bg-white focus:border-[#00258e] focus:ring-2 focus:ring-[#00258e]/20 outline-none transition-all';

export const selectClass = `${inputClass} cursor-pointer`;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const digitsOnly = (value: string): string =>
  value.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/\D/g, '');

export const readImageAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('فقط فایل تصویری قابل قبول است.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('حجم هر تصویر نباید بیشتر از ۵ مگابایت باشد.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('خواندن فایل انجام نشد. لطفاً دوباره تلاش کنید.'));
    reader.readAsDataURL(file);
  });

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-[#334155]">{label}</label>
    {children}
    {error ? (
      <p className="text-[11px] font-medium text-rose-600">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-[#64748b]">{hint}</p>
    ) : null}
  </div>
);

interface SectionCardProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, children }) => (
  <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-4 sm:p-6 space-y-5">
    <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9]">
      <span className="material-symbols-outlined text-[#00258e] text-xl">{icon}</span>
      <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
    </div>
    {children}
  </section>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2.5">
      <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
      <span>{message}</span>
    </div>
  );
};

interface StepActionsProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}

export const StepActions: React.FC<StepActionsProps> = ({ onBack, onNext, nextLabel }) => {
  const { trText } = useLanguage();

  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 h-12 rounded-xl border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#334155] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
        <span>{trText('مرحله قبل', 'Previous step', 'Önceki adım')}</span>
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex-[2] h-12 rounded-xl bg-[#00258e] hover:bg-[#001f75] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer transition-all active:scale-95"
      >
        <span>{nextLabel}</span>
        <span className="material-symbols-outlined text-lg">arrow_back</span>
      </button>
    </div>
  );
};

interface DocumentUploadTileProps {
  inputId: string;
  title: string;
  hint: string;
  required: boolean;
  value?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}

export const DocumentUploadTile: React.FC<DocumentUploadTileProps> = ({
  inputId,
  title,
  hint,
  required,
  value,
  onFile,
  onRemove,
}) => {
  const { trText } = useLanguage();

  return (
    <div className={`rounded-2xl border bg-white p-4 flex gap-4 items-start ${value ? 'border-emerald-300' : 'border-[#e2e8f0]'}`}>
      <div className="w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
        {value ? (
          <img src={value} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[#94a3b8]">add_photo_alternate</span>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#0f172a] truncate">{title}</h3>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              required ? 'bg-rose-50 text-rose-700' : 'bg-[#f1f5f9] text-[#64748b]'
            }`}
          >
            {required ? trText('الزامی', 'Required', 'Zorunlu') : trText('اختیاری', 'Optional', 'İsteğe bağlı')}
          </span>
        </div>
        <p className="text-[11px] text-[#64748b]">{hint}</p>
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#00258e] hover:bg-[#001f75] text-white text-xs font-bold transition-colors"
          >
            {value ? trText('تغییر تصویر', 'Change image', 'Görseli değiştir') : trText('انتخاب تصویر', 'Choose image', 'Görsel seç')}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = '';
            }}
          />
          {value && (
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
            >
              {trText('حذف', 'Remove', 'Kaldır')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
