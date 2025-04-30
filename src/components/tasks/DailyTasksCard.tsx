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
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* الدائرة الخلفية */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="8"
        />
        {/* الدائرة المتحركة */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#gradientCircle)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* تعريف التدرج اللوني */}
        <defs>
          <linearGradient id="gradientCircle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>

      {/* إضافة تأثير توهج خلف الدائرة */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl"
          style={{ opacity: percentage / 200 + 0.1 }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {value}
        </motion.span>
        <motion.span
          className="text-xs text-foreground-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          من {max}
        </motion.span>
      </div>
    </div>
  );
};

// مكون شريط التقدم الخطي
const LinearProgressBar = ({ value, max }: { value: number; max: number }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="relative w-full h-6 bg-background-dark/50 rounded-full overflow-hidden mb-3 border border-primary/10 shadow-inner">
      {/* نقاط المراحل */}
      <div className="absolute top-0 right-0 w-full h-full flex justify-between items-center px-2 z-10">
        {Array.from({ length: max }).map((_, index) => (
          <motion.div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < value
                ? 'bg-white shadow-lg'
                : 'bg-background-lighter/50'
            }`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: index < value ? 1 : 0.7,
              opacity: index < value ? 1 : 0.5
            }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          />
        ))}
      </div>

      {/* شريط التقدم */}
      <motion.div
        className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary via-primary-dark to-blue-700"
        style={{
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
        }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* النص */}
      <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
        <motion.span
          className="text-xs font-medium text-white z-20 drop-shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {value}/{max} مهام مكتملة
        </motion.span>
      </div>
    </div>
  );
};

// مكون العداد التنازلي
const CountdownTimer = ({ nextReset }: { nextReset: Date }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

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

      // تفعيل الوميض عندما يكون الوقت المتبقي أقل من ساعة
      if (hours === 0 && minutes < 60) {
        setIsBlinking(true);
      } else {
        setIsBlinking(false);
      }

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReset]);

  // حساب النسبة المئوية للوقت المتبقي (24 ساعة كاملة)
  const totalSecondsInDay = 24 * 60 * 60;
  const secondsLeft = timeLeft.hours * 60 * 60 + timeLeft.minutes * 60 + timeLeft.seconds;
  const percentageLeft = (secondsLeft / totalSecondsInDay) * 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center mb-3">
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isBlinking ? 'bg-warning/20' : 'bg-primary/20'
          }`}
          animate={isBlinking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <FaClock className={`text-xl ${isBlinking ? 'text-warning' : 'text-primary'}`} />
        </motion.div>
        <div className="mr-3">
          <p className="text-sm font-medium">إعادة تعيين المهام في</p>
          <div className="h-1 w-full bg-background-lighter rounded-full mt-1 overflow-hidden">
            <motion.div
              className={`h-full ${isBlinking ? 'bg-warning' : 'bg-primary'}`}
              initial={{ width: `${percentageLeft}%` }}
              animate={{ width: `${percentageLeft}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2 space-x-reverse">
        <motion.div
          className={`bg-gradient-to-b ${
            isBlinking
              ? 'from-warning/20 to-warning/10'
              : 'from-primary/20 to-primary/10'
          } px-3 py-2 rounded-lg shadow-inner border ${
            isBlinking ? 'border-warning/30' : 'border-primary/30'
          }`}
          animate={isBlinking && timeLeft.seconds % 2 === 0 ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="font-mono font-bold text-lg">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <div className="text-xs text-foreground-muted mt-1 text-center">ساعة</div>
        </motion.div>

        <span className="text-xl font-bold mx-1">:</span>

        <motion.div
          className={`bg-gradient-to-b ${
            isBlinking
              ? 'from-warning/20 to-warning/10'
              : 'from-primary/20 to-primary/10'
          } px-3 py-2 rounded-lg shadow-inner border ${
            isBlinking ? 'border-warning/30' : 'border-primary/30'
          }`}
          animate={isBlinking && timeLeft.seconds % 2 === 0 ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="font-mono font-bold text-lg">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <div className="text-xs text-foreground-muted mt-1 text-center">دقيقة</div>
        </motion.div>

        <span className="text-xl font-bold mx-1">:</span>

        <motion.div
          className={`bg-gradient-to-b ${
            isBlinking
              ? 'from-warning/20 to-warning/10'
              : 'from-primary/20 to-primary/10'
          } px-3 py-2 rounded-lg shadow-inner border ${
            isBlinking ? 'border-warning/30' : 'border-primary/30'
          }`}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="font-mono font-bold text-lg">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <div className="text-xs text-foreground-muted mt-1 text-center">ثانية</div>
        </motion.div>
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
      className="bg-gradient-to-br from-background-light/80 to-background-lighter/60 backdrop-blur-lg rounded-xl shadow-lg border border-primary/20 p-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* خلفية زخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 text-primary ml-4 shadow-lg">
            <FaTasks className="text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold">المهام اليومية</h3>
            <p className="text-sm text-foreground-muted">أكمل المهام للحصول على مكافآت يومية</p>
          </div>
        </div>

        <CircularProgress value={tasksData.completedTasks} max={tasksData.totalTasks} />
      </div>

      {/* شريط التقدم الخطي */}
      <div className="mb-6">
        <LinearProgressBar value={tasksData.completedTasks} max={tasksData.totalTasks} />
        <div className="flex justify-between text-xs text-foreground-muted mt-1 px-1">
          <span>0</span>
          <span>تقدم المهام اليومية</span>
          <span>{tasksData.totalTasks}</span>
        </div>
      </div>

      <motion.div
        className="bg-gradient-to-br from-background-dark/50 to-background-dark/30 p-5 rounded-xl mb-6 border border-primary/10 shadow-inner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-background-lighter/20 p-3 rounded-lg border border-primary/10">
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2">
                <FaPercentage className="text-primary" />
              </div>
              <span className="text-sm">معدل الربح</span>
            </div>
            <p className="text-lg font-bold text-success">{profitRateDisplay}</p>
            <p className="text-xs text-foreground-muted">لكل مهمة مكتملة</p>
          </div>

          <div className="bg-background-lighter/20 p-3 rounded-lg border border-primary/10">
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center ml-2">
                <FaCoins className="text-warning" />
              </div>
              <span className="text-sm">إجمالي المكافآت</span>
            </div>
            <p className="text-lg font-bold text-warning">{tasksData.totalReward.toFixed(2)} USDT</p>
            <p className="text-xs text-foreground-muted">اليوم</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center ml-2">
              <FaCheckCircle className="text-success" />
            </div>
            <div>
              <span className="text-sm">المهام المكتملة</span>
              <p className="font-bold">{tasksData.completedTasks} من {tasksData.totalTasks}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center ml-2">
              <FaTasks className="text-info" />
            </div>
            <div>
              <span className="text-sm">المهام المتبقية</span>
              <p className="font-bold">{tasksData.remainingTasks}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6">
        <motion.div
          whileHover={tasksData.remainingTasks > 0 ? { scale: 1.02 } : {}}
          whileTap={tasksData.remainingTasks > 0 ? { scale: 0.98 } : {}}
        >
          <ActionButton
            variant={tasksData.remainingTasks <= 0 ? "outline" : "primary"}
            fullWidth
            disabled={tasksData.remainingTasks <= 0 || isCompleting}
            onClick={handleCompleteTask}
            icon={tasksData.remainingTasks <= 0 ? <FaCheckCircle /> : <FaCoins />}
            size="lg"
            className="py-4 text-lg shadow-lg"
          >
            {isCompleting ? (
              <ButtonLoader />
            ) : tasksData.remainingTasks <= 0 ? (
              'تم إكمال جميع المهام'
            ) : (
              'إكمال مهمة'
            )}
          </ActionButton>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReward && (
          <motion.div
            className="bg-gradient-to-r from-success/20 to-success/10 border border-success/30 text-success p-5 rounded-xl mb-6 text-center shadow-md"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            <motion.div
              className="flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 3, duration: 0.6 }}
            >
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center ml-3">
                <FaCoins className="text-success text-xl" />
              </div>
              <div>
                <span className="text-sm">تم إضافة مكافأة</span>
                <p className="font-bold text-xl">{lastReward.toFixed(2)} USDT</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-gradient-to-br from-background-dark/50 to-background-dark/30 p-5 rounded-xl border border-primary/10 shadow-inner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CountdownTimer nextReset={getNextResetTime()} />
      </motion.div>
    </motion.div>
  );
}
