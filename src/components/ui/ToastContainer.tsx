import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const bgColors = {
          success: 'bg-[#00258e] text-white border-[#0036c5]',
          error: 'bg-[#ba1a1a] text-white border-[#93000a]',
          warning: 'bg-[#f97316] text-white border-[#c2410c]',
          info: 'bg-[#1a1b23] text-white border-[#444655]',
        };

        const iconNames = {
          success: 'check_circle',
          error: 'error',
          warning: 'warning',
          info: 'info',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3 rounded-lg border shadow-lg transition-all duration-300 font-vazirmatn text-sm ${
              bgColors[toast.type]
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">{iconNames[toast.type]}</span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white ms-2 p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
