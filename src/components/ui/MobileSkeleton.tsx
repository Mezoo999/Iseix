'use client';

import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface MobileSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'form' | 'profile';
  count?: number;
  className?: string;
}

export default function MobileSkeleton({
  type = 'card',
  count = 3,
  className = ''
}: MobileSkeletonProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // إذا لم يكن الجهاز محمولاً أو جهازاً لوحياً، استخدم هيكل عظمي أبسط
  if (!isMobile && !isTablet) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-background-light animate-pulse rounded-md h-24 w-full"
          />
        ))}
      </div>
    );
  }
  
  // هيكل عظمي للبطاقات
  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className="bg-background-light rounded-md p-4 h-32"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          >
            <div className="flex flex-col space-y-2">
              <div className="h-4 bg-background-lighter rounded w-3/4"></div>
              <div className="h-3 bg-background-lighter rounded w-1/2"></div>
              <div className="h-3 bg-background-lighter rounded w-2/3"></div>
              <div className="mt-2 flex justify-between">
                <div className="h-6 bg-background-lighter rounded w-1/4"></div>
                <div className="h-6 bg-background-lighter rounded w-1/4"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  
  // هيكل عظمي للقوائم
  if (type === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className="bg-background-light rounded-md p-3 flex items-center"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          >
            <div className="h-10 w-10 bg-background-lighter rounded-full ml-3"></div>
            <div className="flex-1">
              <div className="h-3 bg-background-lighter rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-background-lighter rounded w-1/2"></div>
            </div>
            <div className="h-4 w-4 bg-background-lighter rounded"></div>
          </motion.div>
        ))}
      </div>
    );
  }
  
  // هيكل عظمي للجداول
  if (type === 'table') {
    return (
      <div className={`rounded-md overflow-hidden ${className}`}>
        <div className="bg-background-light p-3">
          <div className="h-5 bg-background-lighter rounded w-full mb-3"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-4 bg-background-lighter rounded"></div>
            <div className="h-4 bg-background-lighter rounded"></div>
            <div className="h-4 bg-background-lighter rounded"></div>
          </div>
        </div>
        
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className="bg-background-light p-3 border-t border-background-lighter"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="h-3 bg-background-lighter rounded"></div>
              <div className="h-3 bg-background-lighter rounded"></div>
              <div className="h-3 bg-background-lighter rounded"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
  
  // هيكل عظمي للنماذج
  if (type === 'form') {
    return (
      <div className={`bg-background-light rounded-md p-4 ${className}`}>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-4 bg-background-lighter rounded w-1/3 mb-1"></div>
          <div className="h-10 bg-background-lighter rounded w-full"></div>
          
          <div className="h-4 bg-background-lighter rounded w-1/3 mb-1"></div>
          <div className="h-10 bg-background-lighter rounded w-full"></div>
          
          <div className="h-4 bg-background-lighter rounded w-1/3 mb-1"></div>
          <div className="h-10 bg-background-lighter rounded w-full"></div>
          
          <div className="h-10 bg-background-lighter rounded w-1/2 mt-6 mr-auto"></div>
        </motion.div>
      </div>
    );
  }
  
  // هيكل عظمي للملف الشخصي
  if (type === 'profile') {
    return (
      <div className={`bg-background-light rounded-md p-4 ${className}`}>
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-20 w-20 bg-background-lighter rounded-full mb-4"></div>
          <div className="h-5 bg-background-lighter rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-background-lighter rounded w-2/3 mb-4"></div>
          
          <div className="w-full space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-background-lighter rounded w-1/4"></div>
              <div className="h-4 bg-background-lighter rounded w-1/2"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-background-lighter rounded w-1/4"></div>
              <div className="h-4 bg-background-lighter rounded w-1/2"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-background-lighter rounded w-1/4"></div>
              <div className="h-4 bg-background-lighter rounded w-1/2"></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // الهيكل العظمي الافتراضي
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-background-light rounded-md h-24 w-full"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
        />
      ))}
    </div>
  );
}
