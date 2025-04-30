'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCoins, FaChartLine, FaWallet, FaExchangeAlt } from 'react-icons/fa';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: number;
  changeText?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  type?: 'profit' | 'investment' | 'deposit' | 'withdrawal';
  currency?: string;
  delay?: number;
  animated?: boolean;
}

const iconMap = {
  profit: <FaChartLine className="text-2xl text-success" />,
  investment: <FaCoins className="text-2xl text-primary" />,
  deposit: <FaWallet className="text-2xl text-info" />,
  withdrawal: <FaExchangeAlt className="text-2xl text-warning" />
};

const bgMap = {
  profit: 'bg-success/10 border-success/20',
  investment: 'bg-primary/10 border-primary/20',
  deposit: 'bg-info/10 border-info/20',
  withdrawal: 'bg-warning/10 border-warning/20'
};

const iconBgMap = {
  profit: 'bg-success/20',
  investment: 'bg-primary/20',
  deposit: 'bg-info/20',
  withdrawal: 'bg-warning/20'
};

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeText,
  variant = 'primary',
  type,
  currency = 'USDT',
  delay = 0,
  animated = true
}: StatCardProps) {
  const [count, setCount] = useState(0);

  // تحديد الألوان حسب النوع
  const getVariantClasses = () => {
    if (type) {
      return bgMap[type];
    }

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

  // تحديد الأيقونة
  const getIcon = () => {
    if (icon) return icon;
    if (type) return iconMap[type];
    return null;
  };

  // تحديد خلفية الأيقونة
  const getIconBg = () => {
    if (type) return iconBgMap[type];
    return `${getVariantClasses()}`;
  };

  useEffect(() => {
    if (!animated || typeof value !== 'number') return;

    const duration = 1000; // مدة التأثير بالمللي ثانية
    const steps = 20; // عدد الخطوات
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      setCount(Math.min(currentStep * stepValue, value));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  const displayValue = animated && typeof value === 'number' ? count.toFixed(2) : value;

  return (
    <motion.div
      className={`rounded-xl border p-6 ${getVariantClasses()}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        y: -5,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium">{title}</h3>
        {getIcon() && <div className={`p-2 rounded-full ${getIconBg()}`}>{getIcon()}</div>}
      </div>
      <div className="text-2xl font-bold mb-2">
        {displayValue}
        {currency && typeof value === 'number' && <span className="mr-1 text-sm">{currency}</span>}
      </div>
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
