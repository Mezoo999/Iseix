'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface MobilePageTransitionProps {
  children: ReactNode;
}

export default function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const pathname = usePathname();
  const { isMobile, isTablet } = useDeviceDetect();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [prevPath, setPrevPath] = useState<string | null>(null);
  
  // تحديد اتجاه التنقل
  useEffect(() => {
    if (prevPath) {
      // يمكن تخصيص منطق تحديد الاتجاه هنا
      // مثال بسيط: إذا كان المسار الجديد أطول من السابق، فهو للأمام
      setDirection(pathname.length >= prevPath.length ? 'forward' : 'backward');
    }
    setPrevPath(pathname);
  }, [pathname, prevPath]);
  
  // إذا لم يكن الجهاز محمولاً أو جهازاً لوحياً، لا تستخدم التأثيرات
  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }
  
  // تأثيرات الانتقال
  const variants = {
    forward: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    backward: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={variants[direction].initial}
        animate={variants[direction].animate}
        exit={variants[direction].exit}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
