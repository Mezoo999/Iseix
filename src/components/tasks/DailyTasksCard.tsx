'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTasks, FaCheckCircle, FaSpinner, FaCoins, FaClock, FaPercentage } from 'react-icons/fa';
import { getUserDailyTasks, completeTask, MembershipLevel, PROFIT_RATES, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { CircleLoader, ButtonLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';

// مكون شريط التقدم الدائري
const CircularProgress = ({ value, max }: { value: number; max: number }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45; // محيط الدائرة (نصف القطر = 45)
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* الدائرة الخلفية */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* الدائرة المتحركة */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-foreground-muted">من {max}</span>
      </div>
    </div>
  );
};

// مكون شريط التقدم الخطي
const LinearProgressBar = ({ value, max }: { value: number; max: number }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="relative w-full h-4 bg-background-light rounded-full overflow-hidden mb-2">
      <motion.div
        className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary to-primary-dark"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
        <span className="text-xs font-medium text-white">
          {value}/{max} مهام مكتملة
        </span>
      </div>
    </div>
  );
};

// مكون العداد التنازلي
const CountdownTimer = ({ nextReset }: { nextReset: Date }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = nextReset.getTime() - now.getTime();

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReset]);

  return (
    <div className="flex items-center justify-center space-x-2 text-foreground-muted">
      <FaClock className="ml-2" />
      <div className="flex items-center">
        <div className="bg-background-light px-2 py-1 rounded">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <span className="mx-1">:</span>
        <div className="bg-background-light px-2 py-1 rounded">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <span className="mx-1">:</span>
        <div className="bg-background-light px-2 py-1 rounded">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default function DailyTasksCard() {
  const { currentUser, userData } = useAuth();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [tasksData, setTasksData] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState(0);

  // تحديد درجة العضوية ومعدل الربح
  const membershipLevel = userData?.membershipLevel || MembershipLevel.BASIC;

  // التعامل مع القيم الرقمية والنصية
  let profitRateRange;
  if (typeof membershipLevel === 'number') {
    profitRateRange = PROFIT_RATES[membershipLevel] || { min: 2.76, max: 2.84 };
  } else {
    profitRateRange = PROFIT_RATES[membershipLevel] || { min: 2.76, max: 2.84 };
  }

  const profitRateDisplay = `${profitRateRange.min}% ~ ${profitRateRange.max}%`;

  // تحميل بيانات المهام
  const loadTasksData = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const data = await getUserDailyTasks(currentUser.uid);
      setTasksData(data);
    } catch (error) {
      console.error('Error loading tasks data:', error);
      showAlert('error', 'حدث خطأ أثناء تحميل بيانات المهام');
    } finally {
      setIsLoading(false);
    }
  };

  // تنفيذ المهمة
  const handleCompleteTask = async () => {
    if (!currentUser || isCompleting) return;

    setIsCompleting(true);
    try {
      const result = await completeTask(currentUser.uid);

      if (result.success) {
        setTasksData(prev => ({
          ...prev,
          completedTasks: prev.completedTasks + 1,
          remainingTasks: prev.remainingTasks - 1,
          totalReward: prev.totalReward + (result.reward || 0)
        }));

        setLastReward(result.reward || 0);
        setShowReward(true);

        // إخفاء رسالة المكافأة بعد 5 ثوانٍ
        setTimeout(() => {
          setShowReward(false);
        }, 5000);

        showAlert('success', `تم إكمال المهمة بنجاح! حصلت على ${result.reward?.toFixed(2)} USDT`);
      } else {
        showAlert('error', result.error || 'حدث خطأ أثناء إكمال المهمة');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      showAlert('error', 'حدث خطأ أثناء إكمال المهمة');
    } finally {
      setIsCompleting(false);
    }
  };

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    loadTasksData();
  }, [currentUser]);

  // حساب وقت إعادة تعيين المهام
  const getNextResetTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  if (isLoading) {
    return (
      <div className="card card-primary">
        <div className="flex justify-center py-8">
          <CircleLoader color="primary" size="md" />
        </div>
      </div>
    );
  }

  if (!tasksData) {
    return (
      <div className="card card-primary">
        <div className="text-center py-4 text-foreground-muted">
          لا توجد بيانات متاحة للمهام اليومية
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="card card-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
            <FaTasks className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold">المهام اليومية</h3>
            <p className="text-sm text-foreground-muted">أكمل المهام للحصول على مكافآت يومية</p>
          </div>
        </div>

        <CircularProgress value={tasksData.completedTasks} max={tasksData.totalTasks} />
      </div>

      {/* شريط التقدم الخطي */}
      <div className="mb-4">
        <LinearProgressBar value={tasksData.completedTasks} max={tasksData.totalTasks} />
        <div className="flex justify-between text-xs text-foreground-muted">
          <span>0</span>
          <span>تقدم المهام</span>
          <span>{tasksData.totalTasks}</span>
        </div>
      </div>

      <div className="bg-background-light/30 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground-muted flex items-center">
            <FaPercentage className="ml-1 text-success" />
            معدل الربح:
          </span>
          <span className="font-bold text-success">{profitRateDisplay} لكل مهمة</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground-muted flex items-center">
            <FaCheckCircle className="ml-1 text-primary" />
            المهام المكتملة:
          </span>
          <span className="font-bold">{tasksData.completedTasks} من {tasksData.totalTasks}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground-muted flex items-center">
            <FaTasks className="ml-1 text-info" />
            المهام المتبقية:
          </span>
          <span className="font-bold">{tasksData.remainingTasks}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-foreground-muted flex items-center">
            <FaCoins className="ml-1 text-warning" />
            إجمالي المكافآت اليوم:
          </span>
          <span className="font-bold text-primary">{tasksData.totalReward.toFixed(2)} USDT</span>
        </div>
      </div>

      <div className="mb-6">
        <ActionButton
          variant={tasksData.remainingTasks <= 0 ? "outline" : "primary"}
          fullWidth
          disabled={tasksData.remainingTasks <= 0 || isCompleting}
          onClick={handleCompleteTask}
          icon={tasksData.remainingTasks <= 0 ? <FaCheckCircle /> : <FaCoins />}
        >
          {isCompleting ? (
            <ButtonLoader />
          ) : tasksData.remainingTasks <= 0 ? (
            'تم إكمال جميع المهام'
          ) : (
            'إكمال مهمة'
          )}
        </ActionButton>
      </div>

      <AnimatePresence>
        {showReward && (
          <motion.div
            className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6 text-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center">
              <FaCoins className="ml-2" />
              <span className="font-bold">مكافأة: {lastReward.toFixed(2)} USDT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center bg-background-light/30 p-4 rounded-lg">
        <p className="text-sm text-foreground-muted mb-2">إعادة تعيين المهام في</p>
        <CountdownTimer nextReset={getNextResetTime()} />
      </div>
    </motion.div>
  );
}
