'use client';

import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#E8734A] text-white hover:bg-[#D4623C]',
  secondary: 'bg-[#FDE8E8] text-[#2D2D2D] hover:bg-[#FCDADA]',
  outline: 'bg-transparent text-[#E8734A] border border-[#E8734A] hover:bg-[#FFF0EB]',
  ghost: 'bg-transparent text-[#5C5C5C] hover:bg-[#FDE8E8]',
  destructive: 'bg-transparent text-[#D14343] border border-[#D14343] hover:bg-[#FDE8E8]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm font-semibold rounded-xl',
  md: 'px-6 py-3 text-base font-semibold rounded-xl',
  lg: 'px-8 py-4 text-lg font-[family-name:var(--font-jua)] rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        active:scale-[0.97] transition-all duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8734A]
        disabled:opacity-70 disabled:cursor-not-allowed
        cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
}
