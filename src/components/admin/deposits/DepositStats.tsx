'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface DepositStatsProps {
  pendingCount: number;
  totalAmount: number;
  recentCount: number;
}

export default function DepositStats({ pendingCount, totalAmount, recentCount }: DepositStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        className="bg-primary/10 p-4 rounded-xl flex items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
          <FaMoneyBillWave className="text-xl" />
        </div>
        <div>
          <p className="text-foreground-muted text-sm">إجمالي الإيداعات</p>
          <p className="text-2xl font-bold">{totalAmount.toFixed(2)} USDT</p>
        </div>
      </motion.div>

      <motion.div
        className="bg-warning/10 p-4 rounded-xl flex items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="p-3 rounded-full bg-warning/20 text-warning ml-4">
          <FaSpinner className="text-xl" />
        </div>
        <div>
          <p className="text-foreground-muted text-sm">طلبات قيد المراجعة</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
      </motion.div>

      <motion.div
        className="bg-success/10 p-4 rounded-xl flex items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="p-3 rounded-full bg-success/20 text-success ml-4">
          <FaCheckCircle className="text-xl" />
        </div>
        <div>
          <p className="text-foreground-muted text-sm">إيداعات آخر 7 أيام</p>
          <p className="text-2xl font-bold">{recentCount}</p>
        </div>
      </motion.div>
    </div>
  );
}

// دالة لجلب إحصائيات الإيداعات
export async function fetchDepositStats() {
  try {
    // جلب طلبات الإيداع المعلقة
    const pendingQuery = query(
      collection(db, 'deposit_requests'),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingCount = pendingSnapshot.size;

    // جلب جميع طلبات الإيداع المقبولة
    const approvedQuery = query(
      collection(db, 'deposit_requests'),
      where('status', '==', 'approved')
    );
    const approvedSnapshot = await getDocs(approvedQuery);
    
    // حساب إجمالي المبلغ
    let totalAmount = 0;
    approvedSnapshot.forEach((doc) => {
      totalAmount += doc.data().amount || 0;
    });

    // جلب طلبات الإيداع في آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentQuery = query(
      collection(db, 'deposit_requests'),
      where('status', '==', 'approved'),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
    );
    const recentSnapshot = await getDocs(recentQuery);
    const recentCount = recentSnapshot.size;

    return {
      pendingCount,
      totalAmount,
      recentCount
    };
  } catch (error) {
    console.error('Error fetching deposit stats:', error);
    return {
      pendingCount: 0,
      totalAmount: 0,
      recentCount: 0
    };
  }
}
