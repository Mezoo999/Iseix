'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'outline-secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary hover:bg-primary-dark text-foreground-inverted shadow-sm hover:shadow',
  secondary: 'bg-secondary hover:bg-secondary-dark text-foreground-inverted shadow-sm hover:shadow',
  success: 'bg-success hover:bg-success-dark text-foreground-inverted shadow-sm hover:shadow',
  danger: 'bg-error hover:bg-error-dark text-foreground-inverted shadow-sm hover:shadow',
  warning: 'bg-warning hover:bg-warning-dark text-foreground-inverted shadow-sm hover:shadow',
  info: 'bg-info hover:bg-info-dark text-foreground-inverted shadow-sm hover:shadow',
  outline: 'bg-transparent hover:bg-primary/10 text-primary border border-primary',
  'outline-secondary': 'bg-transparent hover:bg-secondary/10 text-secondary border border-secondary',
  ghost: 'bg-transparent hover:bg-background-light text-foreground'
};

const sizeClasses = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4',
  lg: 'py-3 px-6 text-lg'
};

export default function ActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  type = 'button',
  className = ''
}: ActionButtonProps) {
  const handleClick = () => {
    if (disabled || !onClick) return;

    try {
      onClick();
    } catch (error) {
      console.error('Button click error:', error);
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      className={`
        rounded-lg font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${icon ? 'flex items-center justify-center gap-2' : ''}
        ${className}
      `}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {icon && <span className="ml-1">{icon}</span>}
      {children}
    </motion.button>
  );
}
