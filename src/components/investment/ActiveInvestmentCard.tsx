'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import ActionButton from '@/components/ui/ActionButton';

interface ActiveInvestmentProps {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  dailyProfitRate: number;
  startDate: Date;
  endDate: Date;
  totalProfit: number;
  accumulatedProfit: number;
  status: 'active' | 'completed' | 'cancelled';
  onViewDetails: (id: string) => void;
}

export default function ActiveInvestmentCard({
  id,
  planName,
  amount,
  currency,
  dailyProfitRate,
  startDate,
  endDate,
  totalProfit,
  accumulatedProfit,
  status,
  onViewDetails
}: ActiveInvestmentProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // حساب الأيام المتبقية ونسبة التقدم
  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    };
    
    const calculateProgress = () => {
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const passedDays = totalDays - daysLeft;
      return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
    };
    
    const days = calculateDaysLeft();
    setDaysLeft(days);
    
    const progress = calculateProgress();
    setProgressPercent(progress);
    
    // تحديث الأيام المتبقية كل يوم
    const interval = setInterval(() => {
      const updatedDays = calculateDaysLeft();
      setDaysLeft(updatedDays);
      
      const updatedProgress = calculateProgress();
      setProgressPercent(updatedProgress);
    }, 1000 * 60 * 60); // تحديث كل ساعة
    
    return () => clearInterval(interval);
  }, [startDate, endDate, daysLeft]);
  
  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // الحصول على لون الحالة
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success';
      case 'completed':
        return 'bg-primary/20 text-primary';
      case 'cancelled':
        return 'bg-error/20 text-error';
      default:
        return 'bg-foreground-muted/20 text-foreground-muted';
    }
  };
  
  // الحصول على نص الحالة
  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };
  
  return (
    <motion.div
      className="bg-background-light rounded-xl p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{planName}</h3>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <FaChartLine className="text-xl" />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground-muted">المبلغ المستثمر:</span>
          <span className="font-bold">{amount.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground-muted">الربح اليومي:</span>
          <span className="font-bold text-success">{dailyProfitRate}%</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground-muted">الربح المتراكم:</span>
          <span className="font-bold text-success">{accumulatedProfit.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-foreground-muted">إجمالي الربح المتوقع:</span>
          <span className="font-bold">{totalProfit.toFixed(2)} {currency}</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <FaCalendarAlt className="text-primary ml-2" />
            <span className="text-foreground-muted">تاريخ البدء:</span>
          </div>
          <span>{formatDate(startDate)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaCalendarAlt className="text-primary ml-2" />
            <span className="text-foreground-muted">تاريخ الانتهاء:</span>
          </div>
          <span>{formatDate(endDate)}</span>
        </div>
        
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-primary">
                التقدم: {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold inline-block text-primary">
                {daysLeft} يوم متبقي
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/10">
            <motion.div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
            ></motion.div>
          </div>
        </div>
      </div>
      
      <ActionButton
        variant="secondary"
        fullWidth
        onClick={() => onViewDetails(id)}
        icon={<FaArrowRight />}
      >
        عرض التفاصيل
      </ActionButton>
    </motion.div>
  );
}
