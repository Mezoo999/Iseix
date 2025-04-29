'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface TouchFeedbackProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  feedbackColor?: string;
  feedbackScale?: number;
  activeScale?: number;
  tapDuration?: number;
  ripple?: boolean;
}

export default function TouchFeedback({
  children,
  className = '',
  onClick,
  disabled = false,
  feedbackColor = 'rgba(59, 130, 246, 0.2)',
  feedbackScale = 1.05,
  activeScale = 0.95,
  tapDuration = 0.2,
  ripple = true
}: TouchFeedbackProps) {
  const { isMobile, isTablet, isTouchDevice } = useDeviceDetect();
  const [rippleEffect, setRippleEffect] = useState<{ x: number; y: number; size: number } | null>(null);
  
  // معالجة النقر
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    // إنشاء تأثير الموجة إذا كان مفعلاً
    if (ripple && (isMobile || isTablet || isTouchDevice)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setRippleEffect({ x, y, size: size * 2 });
      
      // إزالة تأثير الموجة بعد الانتهاء
      setTimeout(() => {
        setRippleEffect(null);
      }, 600);
    }
    
    if (onClick) onClick();
  };
  
  // إذا لم يكن الجهاز محمولاً أو جهازاً لوحياً، استخدم تأثيرات أبسط
  if (!isMobile && !isTablet && !isTouchDevice) {
    return (
      <motion.div
        className={`relative overflow-hidden ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        whileHover={disabled ? {} : { scale: feedbackScale }}
        whileTap={disabled ? {} : { scale: activeScale }}
        transition={{ duration: tapDuration }}
        onClick={handleClick}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className={`relative overflow-hidden ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      whileTap={disabled ? {} : { scale: activeScale }}
      transition={{ duration: tapDuration }}
      onClick={handleClick}
    >
      {children}
      
      {/* تأثير الموجة */}
      {rippleEffect && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: rippleEffect.y - rippleEffect.size / 2,
            left: rippleEffect.x - rippleEffect.size / 2,
            width: rippleEffect.size,
            height: rippleEffect.size,
            backgroundColor: feedbackColor
          }}
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
}
