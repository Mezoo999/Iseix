'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaCheckCircle, FaSpinner, FaPlay, FaCoins, FaGift } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDailyTasks, completeTask, MembershipLevel, getUserMembershipLevel, PROFIT_RATES } from '@/services/dailyTasks';

export default function DailyTasks() {
  const { currentUser, userData } = useAuth();
  const [dailyTasks, setDailyTasks] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [membershipLevel, setMembershipLevel] = useState<MembershipLevel>(MembershipLevel.BASIC);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastReward, setLastReward] = useState<number | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        // جلب درجة العضوية
        const level = await getUserMembershipLevel(currentUser.uid);
        setMembershipLevel(level);

        // جلب المهام اليومية
        const tasks = await getUserDailyTasks(currentUser.uid);
        setDailyTasks(tasks);
      } catch (err) {
        console.error('Error loading daily tasks:', err);
        setError('حدث خطأ أثناء تحميل المهام اليومية');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [currentUser]);

  const handleCompleteTask = async () => {
    if (!currentUser || isProcessing) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const result = await completeTask(currentUser.uid);

      if (result.success) {
        // تحديث المهام اليومية
        const updatedTasks = await getUserDailyTasks(currentUser.uid);
        setDailyTasks(updatedTasks);

        // حفظ المكافأة الأخيرة
        setLastReward(result.reward);

        // عرض رسالة نجاح
        setSuccess(`تم إكمال المهمة بنجاح! حصلت على ${result.reward?.toFixed(2)} USDT`);
      } else {
        setError(result.error || 'حدث خطأ أثناء إكمال المهمة');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      setError('حدث خطأ أثناء إكمال المهمة');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMembershipLevelName = (level: MembershipLevel) => {
    switch (level) {
      case MembershipLevel.BASIC:
        return 'أساسي';
      case MembershipLevel.SILVER:
        return 'فضي';
      case MembershipLevel.GOLD:
        return 'ذهبي';
      case MembershipLevel.PLATINUM:
        return 'بلاتيني';
      case MembershipLevel.DIAMOND:
        return 'ماسي';
      default:
        return 'أساسي';
    }
  };

  const getMembershipLevelColor = (level: MembershipLevel) => {
    switch (level) {
      case MembershipLevel.BASIC:
        return 'text-gray-500';
      case MembershipLevel.SILVER:
        return 'text-gray-400';
      case MembershipLevel.GOLD:
        return 'text-yellow-500';
      case MembershipLevel.PLATINUM:
        return 'text-blue-400';
      case MembershipLevel.DIAMOND:
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  // حساب المكافأة المتوقعة
  const calculateExpectedReward = () => {
    if (!userData?.balances?.USDT) return 0;

    const balance = userData.balances.USDT;
    const rate = PROFIT_RATES[membershipLevel];
    return balance * (rate / 100);
  };

  return (
    <motion.div
      className="glass-effect p-6 rounded-xl mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/10 ml-3">
            <FaTasks className="text-primary text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold">المهام اليومية</h2>
            <p className="text-foreground-muted">أكمل المهام اليومية للحصول على مكافآت إضافية</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${getMembershipLevelColor(membershipLevel)} bg-background-light/50 ml-2`}>
            <FaCoins />
          </div>
          <div>
            <p className="text-sm text-foreground-muted">درجة العضوية</p>
            <p className={`font-bold ${getMembershipLevelColor(membershipLevel)}`}>
              {getMembershipLevelName(membershipLevel)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error/20 text-error p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/20 text-success p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-primary text-2xl" />
        </div>
      ) : dailyTasks ? (
        <div className="space-y-4">
          <div className="bg-background-light/30 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">تقدم المهام اليومية</h3>
              <div className="text-sm text-foreground-muted">
                {dailyTasks.completedTasks}/{dailyTasks.totalTasks} مكتملة
              </div>
            </div>
            <div className="w-full bg-background-light rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${(dailyTasks.completedTasks / dailyTasks.totalTasks) * 100}%` }}
              ></div>
            </div>
            {dailyTasks.completedTasks > 0 && (
              <div className="mt-2 text-sm text-success text-center">
                إجمالي المكافآت اليوم: {dailyTasks.totalReward.toFixed(2)} USDT
              </div>
            )}
          </div>

          {/* عرض المهمة الحالية */}
          <motion.div
            className="bg-background-light/30 p-6 rounded-lg border border-primary/30"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
                <FaGift className="text-primary text-3xl" />
              </div>
              <h3 className="font-bold text-xl mb-2">المهمة اليومية</h3>
              <p className="text-foreground-muted">
                أكمل المهمة اليومية للحصول على مكافأة فورية تضاف إلى رصيدك
              </p>
            </div>

            <div className="bg-background-light/50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">المهام المتبقية اليوم:</span>
                <span className="font-bold text-primary">{dailyTasks.remainingTasks}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">معدل المكافأة:</span>
                <span className="font-bold text-success">{PROFIT_RATES[membershipLevel]}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">المكافأة المتوقعة:</span>
                <span className="font-bold text-success">{calculateExpectedReward().toFixed(2)} USDT</span>
              </div>
            </div>

            {lastReward !== null && (
              <div className="bg-success/10 p-4 rounded-lg mb-6 text-center">
                <FaCheckCircle className="text-success text-2xl mx-auto mb-2" />
                <p className="font-bold text-success">تم إكمال المهمة بنجاح!</p>
                <p className="text-lg">حصلت على <span className="font-bold">{lastReward.toFixed(2)} USDT</span></p>
              </div>
            )}

            <button
              className={`btn ${
                dailyTasks.remainingTasks <= 0
                  ? 'btn-disabled'
                  : isProcessing
                  ? 'btn-disabled'
                  : 'btn-primary'
              } w-full text-white py-3 rounded-lg text-lg`}
              onClick={handleCompleteTask}
              disabled={dailyTasks.remainingTasks <= 0 || isProcessing}
            >
              {dailyTasks.remainingTasks <= 0 ? (
                <span className="flex items-center justify-center">
                  <FaCheckCircle className="ml-2" />
                  تم إكمال جميع المهام اليوم
                </span>
              ) : isProcessing ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin ml-2" />
                  جاري المعالجة...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <FaPlay className="ml-2" />
                  ابدأ المهمة
                </span>
              )}
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-foreground-muted">لا توجد مهام يومية متاحة حاليًا</p>
        </div>
      )}

      <div className="mt-6 bg-background-light/30 p-4 rounded-lg">
        <h3 className="font-bold mb-3">معدلات المكافآت حسب درجة العضوية</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-light/50">
                <th className="py-2 px-3 text-right">درجة العضوية</th>
                <th className="py-2 px-3 text-right">معدل المكافأة</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PROFIT_RATES).map(([level, rate]) => (
                <tr
                  key={level}
                  className={`border-b border-background-lighter ${
                    level === membershipLevel ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className={`py-2 px-3 font-medium ${getMembershipLevelColor(level as MembershipLevel)}`}>
                    {getMembershipLevelName(level as MembershipLevel)}
                  </td>
                  <td className="py-2 px-3 font-bold text-success">{rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-foreground-muted mt-3">
          * النسب المئوية تطبق على رصيدك الحالي. كلما زاد رصيدك، زادت قيمة المكافآت.
        </p>
      </div>
    </motion.div>
  );
}
