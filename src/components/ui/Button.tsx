import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'end',
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-jetbrains font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer';

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-12 px-6 text-sm gap-2',
    lg: 'h-14 px-8 text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#00258e] text-white hover:bg-[#0036c5] focus:ring-[#00258e] shadow-[0px_4px_12px_rgba(0,37,142,0.15)] border border-transparent',
    secondary:
      'bg-[#eeedf9] text-[#1a1b23] hover:bg-[#e2e1ed] focus:ring-[#545f72] border border-[#c4c5da]',
    outline:
      'bg-white text-[#1a1b23] border border-[#c4c5da] hover:bg-[#f4f2fe] focus:ring-[#00258e]',
    danger:
      'bg-[#ba1a1a] text-white hover:bg-[#93000a] focus:ring-[#ba1a1a]',
    ghost:
      'bg-transparent text-[#545f72] hover:bg-[#eeedf9] focus:ring-[#00258e]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          <span>{children}</span>
        </div>
      ) : (
        <>
          {icon && iconPosition === 'start' && <span>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'end' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
};
