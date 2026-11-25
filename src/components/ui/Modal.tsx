import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1b23]/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden relative">
        {title && (
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e2e1ed]">
            <h3 className="font-vazirmatn text-lg font-bold text-[#1a1b23]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#747686] hover:text-[#1a1b23] p-1 rounded-lg hover:bg-[#eeedf9] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
