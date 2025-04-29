'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
  const isMounted = useRef(true);

  useEffect(() => {
    // تعيين المرجع عند التثبيت
    isMounted.current = true;

    // التحقق من حالة الاتصال الأولية
    if (isMounted.current) {
      setIsOnline(navigator.onLine);
    }

    // إضافة مستمعي الأحداث
    const handleOnline = () => {
      if (isMounted.current) {
        setIsOnline(true);
        setShowStatus(true);

        // إخفاء الحالة بعد 3 ثوانٍ
        setTimeout(() => {
          if (isMounted.current) {
            setShowStatus(false);
          }
        }, 3000);
      }
    };

    const handleOffline = () => {
      if (isMounted.current) {
        setIsOnline(false);
        setShowStatus(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // تعيين المرجع عند إزالة المكون
      isMounted.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // إذا كان المستخدم متصلاً ولا نريد عرض الحالة، لا نعرض شيئًا
  if (isOnline && !showStatus) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showStatus || !isOnline) && (
        <motion.div
          className={`fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-auto z-50 p-3 rounded-lg shadow-lg ${
            isOnline ? 'bg-success/10 border border-success/30 text-success' : 'bg-error/10 border border-error/30 text-error'
          }`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center md:justify-start">
            {isOnline ? (
              <>
                <FaWifi className="ml-2" />
                <span>تم استعادة الاتصال بالإنترنت</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="ml-2" />
                <span>انقطع الاتصال بالإنترنت</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// مكون للتحقق من حالة الاتصال بقاعدة البيانات
export function FirebaseConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
  const isMounted = useRef(true);

  // استخدام مرجع لتخزين حالة الاتصال الحالية
  const isConnectedRef = useRef(true);

  useEffect(() => {
    // تعيين المرجع عند التثبيت
    isMounted.current = true;
    isConnectedRef.current = true;

    // التحقق من الاتصال بقاعدة البيانات
    const checkConnection = async () => {
      try {
        // يمكن استخدام Firebase Realtime Database لمراقبة حالة الاتصال
        // أو يمكن استخدام Firestore للتحقق من الاتصال

        // مثال باستخدام fetch للتحقق من الاتصال بالخادم
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-cache'
        });

        const newConnectionStatus = response.ok;

        // إذا تغيرت حالة الاتصال وكان المكون لا يزال مثبتًا
        if (newConnectionStatus !== isConnectedRef.current && isMounted.current) {
          setIsConnected(newConnectionStatus);
          isConnectedRef.current = newConnectionStatus;
          setShowStatus(true);

          // إخفاء الحالة بعد 3 ثوانٍ إذا تم استعادة الاتصال
          if (newConnectionStatus) {
            setTimeout(() => {
              if (isMounted.current) {
                setShowStatus(false);
              }
            }, 3000);
          }
        }
      } catch (error) {
        // فشل الاتصال
        if (isMounted.current) {
          setIsConnected(false);
          isConnectedRef.current = false;
          setShowStatus(true);
        }
      }
    };

    // التحقق من الاتصال كل 30 ثانية
    const interval = setInterval(checkConnection, 30000);

    // التحقق من الاتصال عند تحميل المكون
    checkConnection();

    return () => {
      // تعيين المرجع عند إزالة المكون
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // إذا كان المستخدم متصلاً ولا نريد عرض الحالة، لا نعرض شيئًا
  if (isConnected && !showStatus) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showStatus || !isConnected) && (
        <motion.div
          className={`fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-auto z-50 p-3 rounded-lg shadow-lg ${
            isConnected ? 'bg-success/10 border border-success/30 text-success' : 'bg-warning/10 border border-warning/30 text-warning'
          }`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center md:justify-start">
            {isConnected ? (
              <>
                <FaWifi className="ml-2" />
                <span>تم استعادة الاتصال بالخادم</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="ml-2" />
                <span>انقطع الاتصال بالخادم، جاري المحاولة مرة أخرى...</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
