'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface InfoCardProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  variant?: 'info' | 'warning' | 'success' | 'error' | 'primary';
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  icon = <FaInfoCircle />,
  expandable = false,
  defaultExpanded = true,
  variant = 'info',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // تحديد الألوان بناءً على النوع
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'from-warning/10 to-warning/5',
          border: 'border-warning/30',
          iconBg: 'bg-warning/20',
          iconColor: 'text-warning'
        };
      case 'success':
        return {
          bg: 'from-success/10 to-success/5',
          border: 'border-success/30',
          iconBg: 'bg-success/20',
          iconColor: 'text-success'
        };
      case 'error':
        return {
          bg: 'from-error/10 to-error/5',
          border: 'border-error/30',
          iconBg: 'bg-error/20',
          iconColor: 'text-error'
        };
      case 'primary':
        return {
          bg: 'from-primary/10 to-primary/5',
          border: 'border-primary/30',
          iconBg: 'bg-primary/20',
          iconColor: 'text-primary'
        };
      default:
        return {
          bg: 'from-info/10 to-info/5',
          border: 'border-info/30',
          iconBg: 'bg-info/20',
          iconColor: 'text-info'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      className={`bg-gradient-to-br ${styles.bg} rounded-xl p-5 border ${styles.border} shadow-md mb-6 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start">
        {/* أيقونة */}
        <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center ml-3 mt-1`}>
          <span className={styles.iconColor}>{icon}</span>
        </div>
        
        {/* المحتوى */}
        <div className="flex-1">
          {/* العنوان وزر التوسيع */}
          {(title || expandable) && (
            <div className="flex justify-between items-center mb-2">
              {title && <h3 className="font-bold">{title}</h3>}
              
              {expandable && (
                <motion.button
                  className={`p-2 rounded-full ${styles.iconBg} ${styles.iconColor} hover:opacity-80 transition-opacity`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </motion.button>
              )}
            </div>
          )}
          
          {/* المحتوى القابل للتوسيع */}
          <AnimatePresence>
            {(!expandable || isExpanded) && (
              <motion.div
                className="text-sm text-foreground-muted"
                initial={expandable ? { opacity: 0, height: 0 } : { opacity: 1 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={expandable ? { opacity: 0, height: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default InfoCard;
