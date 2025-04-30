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
  availableProfits?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export default function WalletBalanceCard({
  balance,
  currency,
  totalDeposited = 0,
  totalWithdrawn = 0,
  availableProfits = 0,
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
      className="bg-background-dark rounded-xl shadow-lg border border-primary/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-br from-primary via-primary-dark to-blue-900 p-4 sm:p-6 text-white relative overflow-hidden">
        {/* أشكال زخرفية في الخلفية */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white"></div>
        </div>

        <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center ml-3 sm:ml-4 shadow-lg">
              <FaWallet className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">رصيد المحفظة</h2>
              <p className="text-white/80 text-xs">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </div>

        <motion.div
          className="text-center mb-4 sm:mb-6 relative z-10"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">الرصيد المتاح</p>
          <motion.p
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {count.toFixed(2)} <span className="text-xl sm:text-2xl md:text-3xl">{currency}</span>
          </motion.p>
        </motion.div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-5">
          <motion.div
            className="bg-gradient-to-br from-background-light to-background-lighter p-3 sm:p-4 rounded-xl border border-success/20 shadow-sm hover:shadow-md transition-all duration-300"
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-success/10 flex items-center justify-center ml-2 sm:ml-3">
                <FaArrowDown className="text-success text-xs sm:text-base" />
              </div>
              <span className="text-xs sm:text-sm text-foreground-muted">إجمالي الإيداعات</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-foreground">{totalDeposited.toFixed(2)} {currency}</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-background-light to-background-lighter p-3 sm:p-4 rounded-xl border border-error/20 shadow-sm hover:shadow-md transition-all duration-300"
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-error/10 flex items-center justify-center ml-2 sm:ml-3">
                <FaArrowUp className="text-error text-xs sm:text-base" />
              </div>
              <span className="text-xs sm:text-sm text-foreground-muted">إجمالي السحوبات</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-foreground">{totalWithdrawn.toFixed(2)} {currency}</p>
          </motion.div>
        </div>

        <motion.div
          className="bg-gradient-to-br from-success/5 to-success/10 p-3 sm:p-5 rounded-xl border border-success/30 mb-3 sm:mb-5 shadow-sm hover:shadow-md transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/10 flex items-center justify-center ml-2 sm:ml-3">
              <FaExchangeAlt className="text-success text-sm sm:text-base" />
            </div>
            <div>
              <span className="text-xs sm:text-sm text-foreground-muted">المكافآت المتاحة للسحب</span>
              <p className="text-lg sm:text-2xl font-bold text-success">{availableProfits.toFixed(2)} {currency}</p>
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-1 sm:mt-2 pr-2 border-r-2 border-success/30">يمكنك فقط سحب المكافآت وليس مبلغ الإيداع الأصلي</p>
        </motion.div>

        <div className="flex space-x-2 sm:space-x-3 space-x-reverse">
          <ActionButton
            variant="primary"
            icon={<FaArrowDown />}
            onClick={handleDeposit}
            className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
            size="lg"
          >
            إيداع
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon={<FaArrowUp />}
            onClick={handleWithdraw}
            disabled={availableProfits <= 0}
            className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
            size="lg"
          >
            سحب
          </ActionButton>
        </div>
      </div>
    </motion.div>
  );
}
