import React, { forwardRef, ElementType, ComponentPropsWithRef } from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  as?: ElementType;
  loading?: boolean;
  [x: string]: any; // Diğer olası props'lar için 
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  leftIcon,
  as: Component = 'button',
  loading = false,
  ...rest
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    secondary: 'bg-blue-900 text-white hover:bg-blue-800 focus:ring-blue-500 shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-emerald-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-emerald-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:scale-105 active:scale-100';

  const buttonClasses = `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${widthClass} ${disabledClass} ${className}`;

  const buttonProps = {
    ...rest,
    type: Component === 'button' ? type : undefined,
    className: buttonClasses,
    onClick,
    disabled: disabled || loading,
    ref
  };

  return (
    <Component {...buttonProps}>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {loading ? 'Yükleniyor...' : children}
    </Component>
  );
});

Button.displayName = 'Button';

export default Button;