'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaClock, FaMoneyBillWave, FaNetworkWired, FaCalendarAlt } from 'react-icons/fa';
import { getUserPendingWithdrawalRequests, formatWithdrawalDate } from '@/services/withdrawals';

interface PendingWithdrawalInfoProps {
  userId: string;
}

export default function PendingWithdrawalInfo({ userId }: PendingWithdrawalInfoProps) {
  const [pendingWithdrawal, setPendingWithdrawal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPendingWithdrawal = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        console.log('[PendingWithdrawalInfo] جلب طلبات السحب المعلقة للمستخدم:', userId);
        const pendingWithdrawals = await getUserPendingWithdrawalRequests(userId);
        
        if (pendingWithdrawals.length > 0) {
          console.log('[PendingWithdrawalInfo] تم العثور على طلب سحب معلق:', pendingWithdrawals[0]);
          setPendingWithdrawal(pendingWithdrawals[0]);
        } else {
          console.log('[PendingWithdrawalInfo] لم يتم العثور على طلبات سحب معلقة');
          setPendingWithdrawal(null);
        }
      } catch (error) {
        console.error('[PendingWithdrawalInfo] خطأ في جلب طلبات السحب المعلقة:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingWithdrawal();
  }, [userId]);

  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-background-light/80 to-background-lighter/60 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-primary/20 shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      </motion.div>
    );
  }

  if (!pendingWithdrawal) {
    return null;
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-4 sm:p-6 border border-warning/30 shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/20 flex items-center justify-center ml-3 sm:ml-4 mt-1">
          <FaExclamationTriangle className="text-warning text-lg sm:text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-warning">لديك طلب سحب معلق</h3>
          <p className="text-sm sm:text-base mb-4 text-foreground-muted">
            يرجى الانتظار حتى تتم معالجة طلب السحب الحالي قبل إنشاء طلب جديد.
          </p>

          <div className="bg-background-dark/20 rounded-lg p-3 sm:p-4 mb-4">
            <h4 className="font-medium mb-3 text-sm sm:text-base">تفاصيل الطلب المعلق</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center">
                <FaMoneyBillWave className="ml-2 text-warning" />
                <span className="text-foreground-muted">المبلغ:</span>
                <span className="font-medium mr-2">{pendingWithdrawal.amount.toFixed(2)} {pendingWithdrawal.coin}</span>
              </div>
              <div className="flex items-center">
                <FaNetworkWired className="ml-2 text-warning" />
                <span className="text-foreground-muted">الشبكة:</span>
                <span className="font-medium mr-2">{pendingWithdrawal.network}</span>
              </div>
              <div className="flex items-center">
                <FaClock className="ml-2 text-warning" />
                <span className="text-foreground-muted">الحالة:</span>
                <span className="font-medium mr-2">
                  {pendingWithdrawal.status === 'pending' ? 'قيد الانتظار' : 
                   pendingWithdrawal.status === 'processing' ? 'قيد المعالجة' : 
                   pendingWithdrawal.status === 'approved' ? 'تمت الموافقة' : 
                   pendingWithdrawal.status === 'rejected' ? 'مرفوض' : 'غير معروف'}
                </span>
              </div>
              <div className="flex items-center">
                <FaCalendarAlt className="ml-2 text-warning" />
                <span className="text-foreground-muted">تاريخ الطلب:</span>
                <span className="font-medium mr-2">
                  {formatWithdrawalDate(pendingWithdrawal.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-foreground-muted">
            <p>يتم مراجعة طلبات السحب ومعالجتها خلال 24-48 ساعة عمل. يرجى التحلي بالصبر.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
