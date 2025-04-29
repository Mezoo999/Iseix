'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
  onClose?: () => void;
}

const iconMap = {
  success: <FaCheckCircle className="text-success text-xl" />,
  error: <FaTimesCircle className="text-error text-xl" />,
  warning: <FaExclamationTriangle className="text-warning text-xl" />,
  info: <FaInfoCircle className="text-info text-xl" />
};

const bgMap = {
  success: 'bg-success/10 border-success/30',
  error: 'bg-error/10 border-error/30',
  warning: 'bg-warning/10 border-warning/30',
  info: 'bg-info/10 border-info/30'
};

export default function MobileToast({
  message,
  type,
  duration = 3000,
  position = 'bottom',
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  const handleAnimationComplete = () => {
    if (!isVisible && onClose) {
      onClose();
    }
  };
  
  const positionClass = position === 'top' ? 'top-4' : 'bottom-20';
  
  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          className={`fixed left-4 right-4 ${positionClass} z-50 md:hidden`}
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`flex items-center p-4 rounded-lg shadow-lg border ${bgMap[type]} bg-background`}>
            <div className="ml-3 flex-shrink-0">
              {iconMap[type]}
            </div>
            <div className="ml-3 flex-1">
              {message}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// مكون لإدارة التنبيهات المتعددة
export function ToastContainer({
  toasts,
  position = 'bottom',
  onClose
}: {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[];
  position?: 'top' | 'bottom';
  onClose: (id: string) => void;
}) {
  return (
    <>
      {toasts.map((toast) => (
        <MobileToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          position={position}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </>
  );
}
