'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // بالمللي ثانية، 0 لعدم الإغلاق التلقائي
  onClose?: () => void;
}

const iconMap = {
  success: <FaCheckCircle className="text-xl" />,
  error: <FaTimesCircle className="text-xl" />,
  warning: <FaExclamationTriangle className="text-xl" />,
  info: <FaInfoCircle className="text-xl" />
};

const bgMap = {
  success: 'bg-success/20 border-success/30 text-success',
  error: 'bg-error/20 border-error/30 text-error',
  warning: 'bg-warning/20 border-warning/30 text-warning',
  info: 'bg-info/20 border-info/30 text-info'
};

export default function AnimatedAlert({ type, message, duration = 5000, onClose }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // بعد انتهاء تأثير الخروج
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300);
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`p-4 rounded-lg border flex items-start mb-4 ${bgMap[type]}`}
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="ml-3 mt-0.5">
            {iconMap[type]}
          </div>
          <div className="flex-1 mr-3">
            {message}
          </div>
          <button 
            onClick={handleClose}
            className="text-current opacity-70 hover:opacity-100"
          >
            <FaTimes />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
