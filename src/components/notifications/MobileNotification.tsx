'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import useDeviceDetect from '@/hooks/useDeviceDetect';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface MobileNotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  showIcon?: boolean;
  showClose?: boolean;
  position?: 'top' | 'bottom';
  onClose?: () => void;
}

export default function MobileNotification({
  message,
  type = 'info',
  duration = 3000,
  showIcon = true,
  showClose = true,
  position = 'top',
  onClose
}: MobileNotificationProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const [isVisible, setIsVisible] = useState(true);
  
  // إغلاق الإشعار بعد المدة المحددة
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  // معالجة إغلاق الإشعار
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  // تحديد أيقونة الإشعار حسب النوع
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-success" />;
      case 'error':
        return <FaExclamationCircle className="text-error" />;
      case 'warning':
        return <FaExclamationCircle className="text-warning" />;
      case 'info':
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };
  
  // تحديد لون الإشعار حسب النوع
  const getNotificationClass = () => {
    switch (type) {
      case 'success':
        return 'bg-success bg-opacity-10 border-success';
      case 'error':
        return 'bg-error bg-opacity-10 border-error';
      case 'warning':
        return 'bg-warning bg-opacity-10 border-warning';
      case 'info':
      default:
        return 'bg-info bg-opacity-10 border-info';
    }
  };
  
  // تحديد موضع الإشعار
  const getPositionClass = () => {
    return position === 'top' 
      ? 'top-0 pt-safe-area-top' 
      : 'bottom-0 pb-safe-area-bottom';
  };
  
  // إذا لم يكن الجهاز محمولاً أو جهازاً لوحياً، استخدم نمط مختلف
  const notificationClass = isMobile || isTablet
    ? `fixed left-0 right-0 z-50 mx-4 my-4 ${getPositionClass()}`
    : 'fixed top-4 right-4 z-50 max-w-md';
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={notificationClass}
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`rounded-md border p-3 shadow-lg ${getNotificationClass()}`}>
            <div className="flex items-center">
              {showIcon && (
                <div className="flex-shrink-0 ml-3">
                  {getIcon()}
                </div>
              )}
              <div className="flex-1 mr-2">
                <p className="text-sm">{message}</p>
              </div>
              {showClose && (
                <button
                  className="flex-shrink-0 p-1 rounded-full hover:bg-background-light transition-colors"
                  onClick={handleClose}
                  aria-label="إغلاق الإشعار"
                >
                  <FaTimes className="text-foreground-muted" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
