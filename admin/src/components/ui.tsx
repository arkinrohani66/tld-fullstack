import React from 'react';

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`bg-white border border-[#dfe3ee] rounded-2xl shadow-sm ${className}`}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#eef0f6]">
        <div>
          {title && <h2 className="text-sm font-extrabold text-[#101828]">{title}</h2>}
          {subtitle && <p className="text-[11px] text-[#667085] mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const StatCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  icon?: string;
}> = ({ label, value, hint, tone = 'default', icon }) => {
  const tones: Record<string, string> = {
    default: 'text-[#00258e] bg-[#eef1fb]',
    success: 'text-[#067647] bg-[#e7f6ec]',
    warning: 'text-[#b54708] bg-[#fdf3e7]',
    danger: 'text-[#b42318] bg-[#fee9e7]',
  };
  return (
    <div className="bg-white border border-[#dfe3ee] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#667085] font-bold">{label}</span>
        {icon && (
          <span className={`material-symbols-outlined rounded-lg p-1.5 ${tones[tone]}`}>{icon}</span>
        )}
      </div>
      <div className="mt-2 text-xl font-extrabold text-[#101828] font-mono-num">{value}</div>
      {hint && <div className="text-[10px] text-[#98a2b3] mt-1">{hint}</div>}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children,
  tone = 'default',
}) => {
  const tones: Record<string, string> = {
    default: 'bg-[#eef1fb] text-[#00258e] border-[#c9d2f5]',
    success: 'bg-[#e7f6ec] text-[#067647] border-[#a9e2bd]',
    warning: 'bg-[#fdf3e7] text-[#b54708] border-[#f5d9ac]',
    danger: 'bg-[#fee9e7] text-[#b42318] border-[#f7c3bd]',
    muted: 'bg-[#f2f4f7] text-[#475467] border-[#e4e7ec]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'success' }
> = ({ variant = 'primary', className = '', ...rest }) => {
  const styles: Record<string, string> = {
    primary: 'bg-[#00258e] text-white hover:bg-[#001c70]',
    ghost: 'bg-white text-[#344054] border border-[#d0d5dd] hover:bg-[#f9fafb]',
    danger: 'bg-[#b42318] text-white hover:bg-[#912018]',
    success: 'bg-[#067647] text-white hover:bg-[#05603a]',
  };
  return (
    <button
      {...rest}
      className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles[variant]} ${className}`}
    />
  );
};

export const Spinner: React.FC<{ label?: string }> = ({ label = 'در حال بارگذاری…' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-[#667085] text-xs">
    <span className="w-4 h-4 rounded-full border-2 border-[#c9d2f5] border-t-[#00258e] animate-spin" />
    <span>{label}</span>
  </div>
);

export const EmptyState: React.FC<{ text: string; icon?: string }> = ({
  text,
  icon = 'inbox',
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#98a2b3]">
    <span className="material-symbols-outlined text-[32px]">{icon}</span>
    <span className="text-xs">{text}</span>
  </div>
);

export const ErrorNote: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="mb-4 rounded-xl border border-[#f7c3bd] bg-[#fee9e7] px-3 py-2 text-[11px] font-bold text-[#b42318]">
      {message}
    </div>
  ) : null;

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th className={`text-right text-[10px] font-bold text-[#667085] px-3 py-2 whitespace-nowrap ${className}`}>
    {children}
  </th>
);

export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <td className={`px-3 py-2.5 text-[11px] text-[#344054] align-middle ${className}`}>{children}</td>;
