'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaHourglassHalf, FaLock } from 'react-icons/fa';

interface TasksScheduleProps {
  totalTasks: number;
  completedTasks: number;
  nextResetTime: Date;
}

export default function TasksSchedule({ totalTasks, completedTasks, nextResetTime }: TasksScheduleProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // حساب الوقت المتبقي حتى إعادة تعيين المهام
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = nextResetTime.getTime() - now.getTime();

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    setCurrentHour(new Date().getHours());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setCurrentHour(new Date().getHours());
    }, 1000);

    return () => clearInterval(timer);
  }, [nextResetTime]);

  // إنشاء مصفوفة للساعات (24 ساعة)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // تحديد حالة المهمة لكل ساعة
  const getTaskStatus = (hour: number) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
    
    // إذا كانت الساعة قد مرت وتم إكمال المهام
    if (hour < currentHour && completedTasks >= totalTasks) {
      return 'completed';
    }
    
    // إذا كانت الساعة قد مرت ولم يتم إكمال جميع المهام
    if (hour < currentHour && completedTasks < totalTasks) {
      return 'missed';
    }
    
    // إذا كانت الساعة الحالية وتم إكمال المهام
    if (hour === currentHour && completedTasks >= totalTasks) {
      return 'completed';
    }
    
    // إذا كانت الساعة الحالية ولم يتم إكمال جميع المهام
    if (hour === currentHour && completedTasks < totalTasks) {
      return 'current';
    }
    
    // إذا كانت الساعة في المستقبل
    return 'upcoming';
  };

  return (
    <motion.div
      className="card card-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
          <FaCalendarAlt className="text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold">الجدول الزمني للمهام</h3>
          <p className="text-sm text-foreground-muted">متابعة المهام اليومية وإعادة تعيينها</p>
        </div>
      </div>

      {/* عرض الوقت المتبقي */}
      <div className="bg-background-light/30 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FaClock className="ml-2 text-primary" />
            <span className="font-medium">إعادة تعيين المهام في:</span>
          </div>
          <div className="flex items-center space-x-1 space-x-reverse text-foreground-muted">
            <div className="bg-background-light/50 px-2 py-1 rounded">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span>:</span>
            <div className="bg-background-light/50 px-2 py-1 rounded">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span>:</span>
            <div className="bg-background-light/50 px-2 py-1 rounded">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-muted">المهام المكتملة اليوم:</span>
          <span className="font-bold">{completedTasks} من {totalTasks}</span>
        </div>
      </div>

      {/* عرض الجدول الزمني */}
      <div className="mb-4">
        <h4 className="font-bold mb-3">جدول المهام اليومي</h4>
        <div className="grid grid-cols-6 gap-2">
          {hours.map(hour => {
            const status = getTaskStatus(hour);
            
            return (
              <motion.div
                key={hour}
                className={`p-2 rounded-lg text-center ${
                  status === 'completed' ? 'bg-success/20 border border-success/30' :
                  status === 'current' ? 'bg-primary/20 border border-primary/30' :
                  status === 'missed' ? 'bg-error/20 border border-error/30' :
                  'bg-background-light/30 border border-background-lighter'
                }`}
                whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="text-xs mb-1">{hour}:00</div>
                <div className="flex justify-center">
                  {status === 'completed' && <FaCheckCircle className="text-success" />}
                  {status === 'current' && <FaHourglassHalf className="text-primary" />}
                  {status === 'missed' && <FaLock className="text-error" />}
                  {status === 'upcoming' && <FaLock className="text-foreground-muted opacity-50" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* مفتاح الرموز */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-success/50 ml-2"></div>
          <span className="text-foreground-muted">مكتملة</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-primary/50 ml-2"></div>
          <span className="text-foreground-muted">متاحة حاليًا</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-error/50 ml-2"></div>
          <span className="text-foreground-muted">فائتة</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-foreground-muted/30 ml-2"></div>
          <span className="text-foreground-muted">قادمة</span>
        </div>
      </div>
    </motion.div>
  );
}
