'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle, FaTimes, FaHistory } from 'react-icons/fa';
import ActionButton from '@/components/ui/ActionButton';

interface InvestmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: any;
}

export default function InvestmentDetailsModal({
  isOpen,
  onClose,
  investment
}: InvestmentDetailsModalProps) {
  if (!investment) return null;
  
  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // حساب الأيام المتبقية
  const calculateDaysLeft = () => {
    const now = new Date();
    const endDate = new Date(investment.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  // حساب نسبة التقدم
  const calculateProgress = () => {
    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary ml-3">
                    <FaChartLine className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{investment.planName}</h2>
                    <p className="text-foreground-muted">تفاصيل الاستثمار</p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-full bg-background-light hover:bg-background-lighter transition-colors"
                  onClick={onClose}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold mb-4 text-primary">معلومات الاستثمار</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">المبلغ المستثمر:</span>
                      <span className="font-bold">{investment.amount.toFixed(2)} {investment.currency}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">الربح اليومي:</span>
                      <span className="font-bold text-success">{investment.dailyProfitRate}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">الربح المتراكم:</span>
                      <span className="font-bold text-success">{investment.accumulatedProfit.toFixed(2)} {investment.currency}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">إجمالي الربح المتوقع:</span>
                      <span className="font-bold">{investment.totalProfit.toFixed(2)} {investment.currency}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">إجمالي العائد:</span>
                      <span className="font-bold">{(investment.amount + investment.totalProfit).toFixed(2)} {investment.currency}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-4 text-primary">الجدول الزمني</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-primary ml-2" />
                        <span className="text-foreground-muted">تاريخ البدء:</span>
                      </div>
                      <span>{formatDate(new Date(investment.startDate))}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-primary ml-2" />
                        <span className="text-foreground-muted">تاريخ الانتهاء:</span>
                      </div>
                      <span>{formatDate(new Date(investment.endDate))}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">المدة الإجمالية:</span>
                      <span>{investment.duration} يوم</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">الأيام المتبقية:</span>
                      <span>{calculateDaysLeft()} يوم</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">الحالة:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        investment.status === 'active' ? 'bg-success/20 text-success' :
                        investment.status === 'completed' ? 'bg-primary/20 text-primary' :
                        'bg-error/20 text-error'
                      }`}>
                        {investment.status === 'active' ? 'نشط' :
                         investment.status === 'completed' ? 'مكتمل' : 'ملغي'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-4 text-primary">التقدم</h3>
                
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-primary">
                        التقدم: {calculateProgress().toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold inline-block text-primary">
                        {calculateDaysLeft()} يوم متبقي
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/10">
                    <div
                      style={{ width: `${calculateProgress()}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-4 text-primary">سجل الأرباح</h3>
                
                {investment.profitHistory && investment.profitHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background-light">
                        <tr>
                          <th className="py-3 px-4 text-right">التاريخ</th>
                          <th className="py-3 px-4 text-right">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investment.profitHistory.map((profit: any, index: number) => (
                          <tr key={index} className="border-b border-background-lighter">
                            <td className="py-3 px-4">{formatDate(new Date(profit.date))}</td>
                            <td className="py-3 px-4 text-success">+{profit.amount.toFixed(2)} {investment.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-foreground-muted">
                    <FaHistory className="mx-auto mb-2 text-2xl opacity-50" />
                    <p>لا توجد أرباح مسجلة بعد</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <ActionButton
                  variant="primary"
                  onClick={onClose}
                >
                  إغلاق
                </ActionButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
