'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCoins, FaChartLine, FaWallet, FaExchangeAlt } from 'react-icons/fa';

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  type: 'profit' | 'investment' | 'deposit' | 'withdrawal';
  currency?: string;
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

export default function StatCard({ title, value, change, type, currency = 'USDT' }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [value]);

  return (
    <motion.div
      className={`rounded-lg p-6 ${bgMap[type]} border shadow-sm`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -5,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-foreground-muted text-sm mb-1">{title}</h3>
          <div className="flex items-end">
            <h2 className="text-2xl font-bold">{count.toFixed(2)}</h2>
            <span className="mr-1 text-sm">{currency}</span>
          </div>
          <div className={`mt-2 text-sm flex items-center ${change >= 0 ? 'text-success' : 'text-error'}`}>
            <span className="inline-block ml-1">
              {change >= 0 ? '↑' : '↓'}
            </span>
            {Math.abs(change).toFixed(2)}% من الأسبوع الماضي
          </div>
        </div>
        <div className={`p-3 rounded-full ${iconBgMap[type]}`}>
          {iconMap[type]}
        </div>
      </div>
    </motion.div>
  );
}
