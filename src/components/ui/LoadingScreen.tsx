'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

interface LoadingScreenProps {
  minDisplayTime?: number; // الحد الأدنى لوقت العرض بالمللي ثانية
}

export default function LoadingScreen({ minDisplayTime = 1500 }: LoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;
    let progressInterval: NodeJS.Timeout;

    // تحديث شريط التقدم
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        // زيادة التقدم بشكل تدريجي، مع إبطاء السرعة كلما اقتربنا من 100%
        const remaining = 100 - prev;
        const increment = remaining > 50 ? 5 : remaining > 20 ? 3 : remaining > 5 ? 1 : 0.5;
        return Math.min(prev + increment, 99); // نتوقف عند 99% حتى يكتمل التحميل فعليًا
      });
    }, 100);

    // التحقق من اكتمال التحميل
    const checkLoadingComplete = () => {
      // التحقق من اكتمال تحميل الصفحة
      if (document.readyState === 'complete') {
        const elapsedTime = Date.now() - startTime;
        
        // التأكد من عرض شاشة التحميل للحد الأدنى من الوقت
        if (elapsedTime >= minDisplayTime) {
          setProgress(100);
          setTimeout(() => setIsLoading(false), 500); // تأخير قصير لإظهار 100%
          clearInterval(progressInterval);
        } else {
          // إذا لم يمر الوقت الكافي، ننتظر
          setTimeout(() => {
            setProgress(100);
            setTimeout(() => setIsLoading(false), 500);
          }, minDisplayTime - elapsedTime);
          clearInterval(progressInterval);
        }
      } else {
        animationFrameId = requestAnimationFrame(checkLoadingComplete);
      }
    };

    animationFrameId = requestAnimationFrame(checkLoadingComplete);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(progressInterval);
    };
  }, [minDisplayTime]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <img
                src="/images/logo.svg"
                alt="Iseix Logo"
                className="w-full h-full animate-pulse-slow"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaSpinner className="text-primary text-2xl animate-spin" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-gradient">Iseix</h2>
            <p className="text-foreground-muted mb-6">منصة الاستثمار الذكي</p>
            
            <div className="w-64 h-2 bg-background-lighter rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-sm text-foreground-muted">{Math.round(progress)}%</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
