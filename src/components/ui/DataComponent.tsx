import React from 'react';
import { DataComponentState, SensorReading } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface DataComponentProps {
  label: string;
  reading: SensorReading;
  icon?: string;
  variant?: 'compact' | 'standard' | 'expanded';
  className?: string;
  onCopy?: () => void;
}

const statusColors: Record<DataComponentState, { bg: string; text: string; border: string; dot: string }> = {
  LIVE: { bg: 'bg-[#00a368]/10', text: 'text-[#00a368]', border: 'border-[#00a368]/30', dot: 'bg-[#00a368]' },
  UPDATING: { bg: 'bg-[#0036c5]/10', text: 'text-[#0036c5]', border: 'border-[#0036c5]/30', dot: 'bg-[#0036c5]' },
  STALE: { bg: 'bg-[#f97316]/10', text: 'text-[#f97316]', border: 'border-[#f97316]/30', dot: 'bg-[#f97316]' },
  OFFLINE: { bg: 'bg-[#545f72]/10', text: 'text-[#545f72]', border: 'border-[#545f72]/30', dot: 'bg-[#545f72]' },
  NO_DATA: { bg: 'bg-[#747686]/10', text: 'text-[#747686]', border: 'border-[#747686]/30', dot: 'bg-[#747686]' },
  WARNING: { bg: 'bg-[#f97316]/10', text: 'text-[#f97316]', border: 'border-[#f97316]/30', dot: 'bg-[#f97316]' },
  CRITICAL: { bg: 'bg-[#ba1a1a]/10', text: 'text-[#ba1a1a]', border: 'border-[#ba1a1a]/30', dot: 'bg-[#ba1a1a]' },
  ERROR: { bg: 'bg-[#ba1a1a]/10', text: 'text-[#ba1a1a]', border: 'border-[#ba1a1a]/30', dot: 'bg-[#ba1a1a]' },
};

export const DataComponent: React.FC<DataComponentProps> = ({
  label,
  reading,
  icon,
  variant = 'standard',
  className = '',
  onCopy,
}) => {
  const { trText } = useLanguage();
  const statusCfg = statusColors[reading.status] || statusColors.LIVE;

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-2.5 rounded-lg border border-[#c4c5da] bg-white ${className}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[18px] text-[#545f72]">{icon}</span>}
          <span className="text-xs font-vazirmatn text-[#444655]">{trText(label)}</span>
        </div>
        <div className="flex items-center gap-2" dir="ltr">
          <span className="font-jetbrains text-sm font-bold text-[#1a1b23]">
            {reading.value} <span className="text-xs font-normal text-[#545f72]">{reading.unit}</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col p-3.5 rounded-xl border border-[#c4c5da] bg-white shadow-[0px_2px_8px_rgba(0,37,142,0.04)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-7 h-7 rounded-md bg-[#eeedf9] flex items-center justify-center text-[#00258e]">
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
          )}
          <span className="text-xs font-semibold text-[#444655] font-vazirmatn">{trText(label)}</span>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-jetbrains font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          dir="ltr"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {reading.status}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between my-1" dir="ltr">
        <div className="flex items-baseline gap-1.5">
          <span className="font-jetbrains text-2xl font-bold text-[#1a1b23] tracking-tight">
            {typeof reading.value === 'object' ? JSON.stringify(reading.value) : reading.value}
          </span>
          {reading.unit && <span className="font-jetbrains text-xs text-[#545f72] font-semibold">{reading.unit}</span>}
        </div>

        {onCopy && (
          <button
            onClick={onCopy}
            title={trText('کپی در حافظه', 'Copy to clipboard', 'Panoya kopyala')}
            className="p-1 rounded text-[#747686] hover:text-[#00258e] hover:bg-[#eeedf9] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
        )}
      </div>

      {/* Footer Info: Timestamp & Source */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#e2e1ed] text-[11px] text-[#747686]" dir="ltr">
        <span className="font-jetbrains flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {reading.timestamp}
        </span>
        <span className="font-jetbrains text-[10px] bg-[#eeedf9] text-[#00258e] px-1.5 py-0.2 rounded font-semibold">
          {reading.source}
        </span>
      </div>
    </div>
  );
};
