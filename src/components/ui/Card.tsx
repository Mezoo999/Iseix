'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FadeInView } from '@/components/ui/AnimatedElements';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  delay?: number;
}

export default function Card({
  children,
  title,
  icon,
  className = '',
  variant = 'default',
  delay = 0,
}: CardProps) {
  // تحديد الألوان حسب النوع
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary/10 border-primary/20';
      case 'secondary':
        return 'bg-secondary/10 border-secondary/20';
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'error':
        return 'bg-error/10 border-error/20';
      default:
        return 'bg-background-light/50 border-background-lighter/20';
    }
  };
  
  return (
    <FadeInView direction="up" delay={delay}>
      <div className={`rounded-xl border ${getVariantClasses()} overflow-hidden shadow-sm ${className}`}>
        {title && (
          <div className="p-4 border-b border-background-lighter/20 flex items-center">
            {icon && <div className="ml-2">{icon}</div>}
            <h3 className="font-bold">{title}</h3>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </FadeInView>
  );
}
