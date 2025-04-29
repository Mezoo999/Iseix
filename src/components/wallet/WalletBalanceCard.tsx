'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaArrowUp, FaArrowDown, FaExchangeAlt } from 'react-icons/fa';
import ActionButton from '@/components/ui/ActionButton';
import { useRouter } from 'next/navigation';

interface WalletBalanceCardProps {
  balance: number;
  currency: string;
  totalDeposited?: number;
  totalWithdrawn?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export default function WalletBalanceCard({
  balance,
  currency,
  totalDeposited = 0,
  totalWithdrawn = 0,
  onDeposit,
  onWithdraw
}: WalletBalanceCardProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  // تأثير العداد المتحرك
  useEffect(() => {
    const duration = 1000; // مدة التأثير بالمللي ثانية
    const steps = 20; // عدد الخطوات
    const stepValue = balance / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      setCount(Math.min(currentStep * stepValue, balance));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [balance]);

  // التعامل مع النقر على زر الإيداع
  const handleDeposit = () => {
    if (onDeposit) {
      onDeposit();
    } else {
      router.push('/wallet/deposit');
    }
  };

  // التعامل مع النقر على زر السحب
  const handleWithdraw = () => {
    if (onWithdraw) {
      onWithdraw();
    } else {
      router.push('/wallet/withdraw');
    }
  };

  return (
    <motion.div
      className="bg-background-dark rounded-xl shadow-sm border border-primary/20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-3">
              <FaWallet className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">رصيد المحفظة</h2>
              <p className="text-white/80 text-xs">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-white/80 text-sm mb-1">الرصيد المتاح</p>
          <p className="text-5xl font-bold">{count.toFixed(2)} {currency}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-background-light p-4 rounded-lg border border-success/20">
            <div className="flex items-center mb-1">
              <FaArrowDown className="text-success ml-2" />
              <span className="text-sm text-foreground-muted">إجمالي الإيداعات</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalDeposited.toFixed(2)} {currency}</p>
          </div>

          <div className="bg-background-light p-4 rounded-lg border border-error/20">
            <div className="flex items-center mb-1">
              <FaArrowUp className="text-error ml-2" />
              <span className="text-sm text-foreground-muted">إجمالي السحوبات</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalWithdrawn.toFixed(2)} {currency}</p>
          </div>
        </div>

        <div className="flex space-x-2 space-x-reverse">
          <ActionButton
            variant="primary"
            icon={<FaArrowDown />}
            onClick={handleDeposit}
            className="flex-1"
          >
            إيداع
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon={<FaArrowUp />}
            onClick={handleWithdraw}
            disabled={balance <= 0}
            className="flex-1"
          >
            سحب
          </ActionButton>
        </div>
      </div>
    </motion.div>
  );
}
