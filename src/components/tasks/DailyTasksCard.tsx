'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTasks, FaCheckCircle, FaSpinner, FaCoins, FaClock, FaPercentage } from 'react-icons/fa';
import { getUserDailyTasks, completeTask, MembershipLevel, PROFIT_RATES, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { CircleLoader, ButtonLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';

// مكون شريط التقدم الدائري المحسن
const CircularProgress = ({ value, max }: { value: number; max: number }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45; // محيط الدائرة (نصف القطر = 45)
  const offset = circumference - (percentage / 100) * circumference;

  // تحديد اللون بناءً على نسبة الإكمال
  const getProgressColor = () => {
    if (percentage === 0) return "gradientBlue";
    if (percentage < 50) return "gradientBlue";
    if (percentage < 100) return "gradientGreen";
    return "gradientGold"; // 100% مكتمل
  };

  // تحديد ما إذا كان يجب عرض تأثيرات الاحتفال
  const isComplete = percentage === 100;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* تأثير الاحتفال عند اكتمال المهام */}
      {isComplete && (
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* نجوم متحركة */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-400"
              style={{
                top: `${50 + 45 * Math.sin(i * (Math.PI / 6))}%`,
                left: `${50 + 45 * Math.cos(i * (Math.PI / 6))}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 1, 0.8],
                x: [0, (Math.random() - 0.5) * 20],
                y: [0, (Math.random() - 0.5) * 20]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </motion.div>
      )}

      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* الدائرة الخلفية */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />

        {/* الدائرة المتحركة */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={`url(#${getProgressColor()})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: offset,
            rotate: isComplete ? [0, 360] : 0
          }}
          transition={{
            duration: isComplete ? 2 : 1.5,
            ease: "easeInOut",
            rotate: {
              repeat: isComplete ? 1 : 0,
              duration: 1.5
            }
          }}
        />

        {/* تعريف التدرجات اللونية */}
        <defs>
          <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="gradientGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>

      {/* إضافة تأثير توهج خلف الدائرة */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`absolute w-24 h-24 rounded-full ${
            isComplete ? "bg-yellow-500/30" : "bg-primary/20"
          } blur-xl`}
          animate={{
            scale: isComplete ? [1, 1.2, 1] : 1,
            opacity: isComplete ? [0.3, 0.5, 0.3] : percentage / 200 + 0.1
          }}
          transition={{
            repeat: isComplete ? Infinity : 0,
            duration: 2
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="flex flex-col items-center justify-center"
          animate={isComplete ? {
            scale: [1, 1.2, 1],
            rotateZ: [0, 5, -5, 0]
          } : {}}
          transition={{
            duration: 0.5,
            repeat: isComplete ? 1 : 0
          }}
        >
          <motion.span
            className={`text-4xl font-bold ${isComplete ? "text-yellow-500" : ""}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {value}
          </motion.span>
          <motion.span
            className="text-sm text-foreground-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            من {max}
          </motion.span>

          {/* رسالة الإكمال */}
          {isComplete && (
            <motion.div
              className="absolute -bottom-8 whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                تم إكمال جميع المهام! 🎉
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// مكون شريط التقدم الخطي المحسن
const LinearProgressBar = ({ value, max }: { value: number; max: number }) => {
  const percentage = (value / max) * 100;
  const isComplete = value === max;

  // تحديد لون الشريط بناءً على نسبة الإكمال
  const getProgressGradient = () => {
    if (percentage === 0) return "from-blue-500 via-blue-600 to-blue-700";
    if (percentage < 50) return "from-blue-500 via-blue-600 to-blue-700";
    if (percentage < 100) return "from-green-500 via-green-600 to-green-700";
    return "from-yellow-500 via-yellow-600 to-yellow-700"; // 100% مكتمل
  };

  return (
    <div className="relative w-full h-8 bg-background-dark/50 rounded-full overflow-hidden mb-3 border border-primary/10 shadow-inner">
      {/* نقاط المراحل المحسنة */}
      <div className="absolute top-0 right-0 w-full h-full flex justify-between items-center px-3 z-10">
        {Array.from({ length: max }).map((_, index) => (
          <motion.div
            key={index}
            className="relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <motion.div
              className={`w-4 h-4 rounded-full ${
                index < value
                  ? isComplete
                    ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                    : 'bg-white shadow-lg'
                  : 'bg-background-lighter/50'
              }`}
              animate={{
                scale: index < value ? [1, 1.2, 1] : 0.7,
                opacity: index < value ? 1 : 0.5
              }}
              transition={{
                duration: 0.5,
                repeat: index < value && isComplete ? Infinity : 0,
                repeatType: "reverse",
                repeatDelay: 1
              }}
            />

            {/* رقم المهمة */}
            <motion.span
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold ${
                index < value ? 'text-background-dark' : 'text-foreground-muted'
              }`}
            >
              {index + 1}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* شريط التقدم المحسن */}
      <motion.div
        className={`absolute top-0 right-0 h-full bg-gradient-to-l ${getProgressGradient()}`}
        style={{
          boxShadow: isComplete
            ? '0 0 10px rgba(234, 179, 8, 0.5), 0 0 20px rgba(234, 179, 8, 0.3)'
            : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
        }}
        initial={{ width: 0 }}
        animate={{
          width: `${percentage}%`,
          x: isComplete ? [0, -5, 5, 0] : 0
        }}
        transition={{
          width: { duration: 0.8, ease: "easeOut" },
          x: { duration: 0.3, repeat: isComplete ? 1 : 0 }
        }}
      />

      {/* النص المحسن */}
      <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.span
            className="text-sm font-medium text-white z-20 drop-shadow-md"
            animate={isComplete ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: isComplete ? 1 : 0 }}
          >
            {value}/{max} مهام مكتملة
          </motion.span>

          {/* أيقونة الإكمال */}
          {isComplete && (
            <motion.span
              className="mr-2 text-yellow-300"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              ✓
            </motion.span>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// مكون العداد التنازلي المحسن
const CountdownTimer = ({ nextReset }: { nextReset: Date }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [timerColor, setTimerColor] = useState("primary");

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

      // تحديد لون المؤقت بناءً على الوقت المتبقي
      if (hours >= 12) {
        setTimerColor("success"); // أخضر للوقت الطويل
        setIsBlinking(false);
      } else if (hours >= 6) {
        setTimerColor("primary"); // أزرق للوقت المتوسط
        setIsBlinking(false);
      } else if (hours >= 1) {
        setTimerColor("info"); // أزرق فاتح للوقت القصير
        setIsBlinking(false);
      } else if (minutes >= 30) {
        setTimerColor("warning"); // أصفر للوقت القصير جداً
        setIsBlinking(false);
      } else {
        setTimerColor("danger"); // أحمر للوقت القصير جداً
        setIsBlinking(true);
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

  // تحديد ألوان المؤقت
  const getColorClasses = () => {
    switch (timerColor) {
      case "success":
        return {
          bg: "bg-success/20",
          text: "text-success",
          border: "border-success/30",
          gradient: "from-success/20 to-success/10",
          progressBg: "bg-success"
        };
      case "info":
        return {
          bg: "bg-info/20",
          text: "text-info",
          border: "border-info/30",
          gradient: "from-info/20 to-info/10",
          progressBg: "bg-info"
        };
      case "warning":
        return {
          bg: "bg-warning/20",
          text: "text-warning",
          border: "border-warning/30",
          gradient: "from-warning/20 to-warning/10",
          progressBg: "bg-warning"
        };
      case "danger":
        return {
          bg: "bg-red-500/20",
          text: "text-red-500",
          border: "border-red-500/30",
          gradient: "from-red-500/20 to-red-500/10",
          progressBg: "bg-red-500"
        };
      default:
        return {
          bg: "bg-primary/20",
          text: "text-primary",
          border: "border-primary/30",
          gradient: "from-primary/20 to-primary/10",
          progressBg: "bg-primary"
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="flex flex-col items-center justify-center">
      {/* عنوان المؤقت */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses.bg}`}
          animate={isBlinking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <FaClock className={`text-2xl ${colorClasses.text}`} />
        </motion.div>
        <div className="mr-3">
          <p className="text-sm font-medium">إعادة تعيين المهام في</p>
          <div className="h-2 w-full bg-background-lighter rounded-full mt-1 overflow-hidden shadow-inner">
            <motion.div
              className={`h-full ${colorClasses.progressBg}`}
              style={{
                width: `${percentageLeft}%`,
                boxShadow: `0 0 10px ${timerColor === "primary" ? "rgba(59, 130, 246, 0.5)" : timerColor === "success" ? "rgba(34, 197, 94, 0.5)" : timerColor === "warning" ? "rgba(234, 179, 8, 0.5)" : timerColor === "danger" ? "rgba(239, 68, 68, 0.5)" : "rgba(6, 182, 212, 0.5)"}`
              }}
              initial={{ width: `${percentageLeft}%` }}
              animate={{ width: `${percentageLeft}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* مؤقت دائري */}
        <div className="relative w-32 h-32 mb-3">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* الدائرة الخلفية */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            {/* الدائرة المتحركة */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timerColor === "primary" ? "url(#gradientBlue)" :
                     timerColor === "success" ? "url(#gradientGreen)" :
                     timerColor === "warning" ? "url(#gradientYellow)" :
                     timerColor === "danger" ? "url(#gradientRed)" :
                     "url(#gradientCyan)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - percentageLeft / 100) }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />

            {/* تعريف التدرجات اللونية */}
            <defs>
              <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
              <linearGradient id="gradientYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
              <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              <linearGradient id="gradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
            </defs>
          </svg>

          {/* عرض الوقت في وسط الدائرة */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-1 space-x-reverse">
              <motion.span
                className={`font-mono font-bold text-xl ${colorClasses.text}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {String(timeLeft.hours).padStart(2, '0')}
              </motion.span>
              <span className={`text-lg font-bold ${colorClasses.text}`}>:</span>
              <motion.span
                className={`font-mono font-bold text-xl ${colorClasses.text}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {String(timeLeft.minutes).padStart(2, '0')}
              </motion.span>
              <span className={`text-lg font-bold ${colorClasses.text}`}>:</span>
              <motion.span
                className={`font-mono font-bold text-xl ${colorClasses.text}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </motion.span>
            </div>
          </div>
        </div>

        {/* عرض الوقت بالأرقام */}
        <div className="flex items-center justify-center space-x-2 space-x-reverse">
          <motion.div
            className={`bg-gradient-to-b ${colorClasses.gradient} px-3 py-2 rounded-lg shadow-inner border ${colorClasses.border}`}
            animate={isBlinking ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="font-mono font-bold text-lg">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <div className="text-xs text-foreground-muted mt-1 text-center">ساعة</div>
          </motion.div>

          <span className="text-xl font-bold mx-1">:</span>

          <motion.div
            className={`bg-gradient-to-b ${colorClasses.gradient} px-3 py-2 rounded-lg shadow-inner border ${colorClasses.border}`}
            animate={isBlinking ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          >
            <span className="font-mono font-bold text-lg">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <div className="text-xs text-foreground-muted mt-1 text-center">دقيقة</div>
          </motion.div>

          <span className="text-xl font-bold mx-1">:</span>

          <motion.div
            className={`bg-gradient-to-b ${colorClasses.gradient} px-3 py-2 rounded-lg shadow-inner border ${colorClasses.border}`}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
          >
            <span className="font-mono font-bold text-lg">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <div className="text-xs text-foreground-muted mt-1 text-center">ثانية</div>
          </motion.div>
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
      className="bg-gradient-to-br from-background-dark/30 to-background-dark/10 rounded-xl border border-primary/10 shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* شريط المهام العلوي */}
      <div className="bg-gradient-to-r from-warning/20 to-warning/10 p-3 border-b border-warning/20 flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-warning/20 text-warning ml-2">
            <FaTasks className="text-sm" />
          </div>
          <span className="text-sm font-bold">مهامك اليومية: {tasksData.completedTasks}/{tasksData.totalTasks}</span>
        </div>
        <div className="bg-background-dark/30 px-3 py-1 rounded-full text-xs">
          <span className="text-foreground-muted">المتبقي: </span>
          <span className="font-bold">{tasksData.remainingTasks}</span>
        </div>
      </div>

      {/* قسم تقدم المهام الموحد */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* شريط التقدم الدائري */}
          <div className="flex flex-col items-center justify-center md:col-span-1">
            <CircularProgress value={tasksData.completedTasks} max={tasksData.totalTasks} />

            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaPercentage className="text-primary text-xs" />
                </div>
                <span className="text-sm font-bold text-success">{profitRateDisplay}</span>
              </div>
              <div className="text-xs text-foreground-muted">معدل الربح</div>
            </div>
          </div>

          {/* شريط التقدم الخطي والإحصائيات */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <LinearProgressBar value={tasksData.completedTasks} max={tasksData.totalTasks} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background-lighter/10 p-3 rounded-lg border border-primary/10 text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <FaCoins className="text-warning" />
                  </div>
                </div>
                <p className="text-lg font-bold text-warning">{tasksData.totalReward?.toFixed(2) || "0.00"}</p>
                <p className="text-xs text-foreground-muted">USDT اليوم</p>
              </div>

              <div className="bg-background-lighter/10 p-3 rounded-lg border border-success/10 text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <FaCheckCircle className="text-success" />
                  </div>
                </div>
                <p className="text-lg font-bold text-success">{tasksData.completedTasks}</p>
                <p className="text-xs text-foreground-muted">مهام مكتملة</p>
              </div>

              <div className="bg-background-lighter/10 p-3 rounded-lg border border-info/10 text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                    <FaTasks className="text-info" />
                  </div>
                </div>
                <p className="text-lg font-bold text-info">{tasksData.remainingTasks}</p>
                <p className="text-xs text-foreground-muted">مهام متبقية</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* قسم إكمال المهام والمؤقت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background-dark/20">
        {/* زر إكمال المهمة المحسن */}
        <div className="bg-gradient-to-br from-background-dark/40 to-background-dark/20 p-4 rounded-xl border border-primary/10 shadow-lg">
          <div className="text-center mb-2">
            <h3 className="text-base font-bold">إكمال المهام اليومية</h3>
            <p className="text-xs text-foreground-muted">أكمل المهام للحصول على مكافآت فورية</p>
          </div>

          <motion.div
            whileHover={tasksData.remainingTasks > 0 ? { scale: 1.03 } : {}}
            whileTap={tasksData.remainingTasks > 0 ? { scale: 0.97 } : {}}
            className="relative"
          >
            {/* تأثير توهج خلف الزر */}
            {tasksData.remainingTasks > 0 && (
              <motion.div
                className="absolute inset-0 bg-primary/30 rounded-xl blur-xl -z-10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <ActionButton
              variant={tasksData.remainingTasks <= 0 ? "outline" : "primary"}
              fullWidth
              disabled={tasksData.remainingTasks <= 0 || isCompleting}
              onClick={handleCompleteTask}
              icon={
                isCompleting ? null :
                tasksData.remainingTasks <= 0 ?
                  <FaCheckCircle className="text-xl" /> :
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FaCoins className="text-xl text-yellow-300" />
                  </motion.div>
              }
              size="lg"
              className={`py-4 text-lg shadow-lg ${tasksData.remainingTasks > 0 ? 'bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-primary' : ''}`}
            >
              {isCompleting ? (
                <div className="flex items-center justify-center">
                  <ButtonLoader />
                  <span className="mr-2">جاري إكمال المهمة...</span>
                </div>
              ) : tasksData.remainingTasks <= 0 ? (
                <div className="flex items-center justify-center">
                  <span>تم إكمال جميع المهام</span>
                  <motion.span
                    className="mr-2 text-success"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✓
                  </motion.span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="ml-2">إكمال مهمة</span>
                  <motion.span
                    className="text-sm bg-white/20 px-2 py-0.5 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {tasksData.remainingTasks} متبقية
                  </motion.span>
                </div>
              )}
            </ActionButton>
          </motion.div>
        </div>

        {/* مؤقت إعادة تعيين المهام */}
        <div className="bg-gradient-to-br from-background-dark/40 to-background-dark/20 p-4 rounded-xl border border-primary/10 shadow-lg">
          <div className="text-center mb-2">
            <h3 className="text-base font-bold">إعادة تعيين المهام</h3>
            <p className="text-xs text-foreground-muted">الوقت المتبقي حتى تجديد المهام</p>
          </div>
          <CountdownTimer nextReset={getNextResetTime()} />
        </div>
      </div>

      {/* عرض المكافأة المحسن */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            className="bg-gradient-to-r from-success/30 to-success/20 border border-success/30 p-5 rounded-xl mb-6 text-center shadow-lg relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            {/* تأثيرات خلفية متحركة */}
            <motion.div
              className="absolute inset-0 -z-10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="absolute top-0 left-0 w-20 h-20 rounded-full bg-success/20 blur-xl"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-success/20 blur-xl"></div>
            </motion.div>

            {/* أيقونات العملات المتساقطة */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400 text-xs"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  opacity: 0.7,
                  zIndex: 5
                }}
                animate={{
                  y: ['0%', '120%'],
                  rotate: [0, 360],
                  opacity: [0.7, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                {i % 2 === 0 ? '💰' : '🪙'}
              </motion.div>
            ))}

            <motion.div
              className="flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 3, duration: 0.6 }}
            >
              <motion.div
                className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center ml-4 shadow-lg shadow-success/20"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaCoins className="text-success text-2xl" />
              </motion.div>
              <div>
                <span className="text-sm text-success/80">تم إضافة مكافأة</span>
                <motion.p
                  className="font-bold text-2xl text-success"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                >
                  {lastReward.toFixed(2)} USDT
                </motion.p>
                <div className="text-xs text-success/70 mt-1">تمت إضافة المكافأة إلى رصيدك</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
