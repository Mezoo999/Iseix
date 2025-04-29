'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoader } from './Loaders';

interface PagePreloaderProps {
  children: React.ReactNode;
  loadingTime?: number;
  minLoadingTime?: number;
  showLoaderAfter?: number;
}

export default function PagePreloader({
  children,
  loadingTime = 0,
  minLoadingTime = 500,
  showLoaderAfter = 200
}: PagePreloaderProps) {
  const [isLoading, setIsLoading] = useState(loadingTime > 0);
  const [showLoader, setShowLoader] = useState(false);
  const pathname = usePathname();

  // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
  const isMounted = useRef(true);

  // استخدام مرجع لتخزين حالة التحميل الحالية
  const isLoadingRef = useRef(loadingTime > 0);

  useEffect(() => {
    // تعيين المرجع عند التثبيت
    isMounted.current = true;
    isLoadingRef.current = loadingTime > 0;

    // إعادة تعيين حالة التحميل عند تغيير المسار
    if (isMounted.current) {
      setIsLoading(loadingTime > 0);
    }

    // إظهار شاشة التحميل بعد فترة محددة لتجنب الوميض
    const loaderTimer = setTimeout(() => {
      if (isMounted.current && isLoadingRef.current) {
        setShowLoader(true);
      }
    }, showLoaderAfter);

    // إنهاء التحميل بعد الوقت المحدد
    const loadingTimer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }, Math.max(loadingTime, minLoadingTime));

    return () => {
      // تعيين المرجع عند إزالة المكون
      isMounted.current = false;
      clearTimeout(loaderTimer);
      clearTimeout(loadingTimer);
    };
  }, [pathname, loadingTime, minLoadingTime, showLoaderAfter]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && showLoader ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PageLoader />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// مكون لتتبع تغييرات المسار وإظهار شاشة التحميل
export function RouteChangeLoader() {
  const [isChangingRoute, setIsChangingRoute] = useState(false);
  const pathname = usePathname();

  // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
  const isMounted = useRef(true);

  useEffect(() => {
    // تعيين المرجع عند التثبيت
    isMounted.current = true;

    const handleRouteChangeStart = () => {
      if (isMounted.current) {
        setIsChangingRoute(true);
      }
    };

    // تسجيل الأحداث
    window.addEventListener('beforeunload', handleRouteChangeStart);

    return () => {
      // تعيين المرجع عند إزالة المكون
      isMounted.current = false;
      window.removeEventListener('beforeunload', handleRouteChangeStart);
    };
  }, []);

  // استخدام useEffect منفصل لتتبع تغييرات المسار
  useEffect(() => {
    // إعادة تعيين حالة التحميل عند تغيير المسار
    if (isMounted.current) {
      setIsChangingRoute(false);
    }
  }, [pathname]);

  return (
    <AnimatePresence>
      {isChangingRoute && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
