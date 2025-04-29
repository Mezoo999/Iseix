'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeText?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeText,
  variant = 'primary',
  delay = 0,
}: StatCardProps) {
  // تحديد الألوان حسب النوع
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'error':
        return 'bg-error/10 text-error border-error/20';
      case 'info':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  // تحديد لون التغيير
  const getChangeColor = () => {
    if (!change) return 'text-foreground-muted';
    return change > 0 ? 'text-success' : 'text-error';
  };

  return (
    <motion.div
      className={`rounded-xl border p-6 ${getVariantClasses()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">{title}</h3>
        <div className={`p-2 rounded-full ${getVariantClasses()}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      {(change !== undefined || changeText) && (
        <div className={`text-sm ${getChangeColor()} flex items-center`}>
          {change !== undefined && (
            <>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </>
          )}
          {changeText && <span className="mr-1">{changeText}</span>}
        </div>
      )}
    </motion.div>
  );
}
