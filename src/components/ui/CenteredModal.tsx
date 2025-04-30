'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface CenteredModalProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
}

const iconMap = {
  success: <FaCheckCircle className="text-3xl" />,
  error: <FaTimesCircle className="text-3xl" />,
  warning: <FaExclamationTriangle className="text-3xl" />,
  info: <FaInfoCircle className="text-3xl" />
};

const bgMap = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-error/10 border-error/30 text-error',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info'
};

const iconBgMap = {
  success: 'bg-success/20',
  error: 'bg-error/20',
  warning: 'bg-warning/20',
  info: 'bg-info/20'
};

export default function CenteredModal({ 
  type, 
  title, 
  message, 
  isOpen, 
  onClose,
  actionText,
  onAction
}: CenteredModalProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* خلفية معتمة */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* المحتوى */}
            <motion.div
              className="bg-background rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* الرأس */}
              <div className={`p-6 flex flex-col items-center ${bgMap[type]}`}>
                <div className={`p-4 rounded-full ${iconBgMap[type]} mb-4`}>
                  {iconMap[type]}
                </div>
                <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>
                <p className="text-center">{message}</p>
              </div>
              
              {/* الأزرار */}
              <div className="p-4 bg-background-light flex justify-center gap-4">
                <button
                  className="px-6 py-2 bg-background-dark hover:bg-background-darker text-white rounded-lg transition-colors"
                  onClick={onClose}
                >
                  إغلاق
                </button>
                
                {actionText && onAction && (
                  <button
                    className={`px-6 py-2 rounded-lg transition-colors ${
                      type === 'success' ? 'bg-success text-white hover:bg-success-dark' :
                      type === 'error' ? 'bg-error text-white hover:bg-error-dark' :
                      type === 'warning' ? 'bg-warning text-white hover:bg-warning-dark' :
                      'bg-info text-white hover:bg-info-dark'
                    }`}
                    onClick={onAction}
                  >
                    {actionText}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
