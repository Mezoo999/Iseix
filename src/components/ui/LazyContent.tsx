'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface LazyContentProps {
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
  delay?: number;
  threshold?: number;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  rootMargin?: string;
}

export default function LazyContent({
  children,
  className = '',
  placeholder,
  delay = 0,
  threshold = 0.1,
  animation = 'fade',
  duration = 0.5,
  rootMargin = '0px'
}: LazyContentProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // تحديد تأثير الحركة
  const getAnimationVariants = () => {
    switch (animation) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'slide-up':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        };
      case 'slide-down':
        return {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slide-right':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'none':
      default:
        return {
          hidden: { opacity: 1 },
          visible: { opacity: 1 }
        };
    }
  };
  
  // استخدام Intersection Observer لتحميل المحتوى عند ظهوره في الشاشة
  useEffect(() => {
    // على الأجهزة المكتبية، قم بتحميل المحتوى مباشرة
    if (!isMobile && !isTablet) {
      setShouldRender(true);
      setIsVisible(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // تأخير التحميل إذا تم تحديد تأخير
          if (delay > 0) {
            setTimeout(() => {
              setShouldRender(true);
              
              // تأخير إضافي لتشغيل الحركة بعد تحميل المحتوى
              setTimeout(() => {
                setIsVisible(true);
              }, 100);
            }, delay);
          } else {
            setShouldRender(true);
            
            // تأخير صغير لتشغيل الحركة بعد تحميل المحتوى
            setTimeout(() => {
              setIsVisible(true);
            }, 100);
          }
          
          // إلغاء المراقبة بعد التحميل
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin
      }
    );
    
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }
    
    return () => {
      if (contentRef.current) {
        observer.unobserve(contentRef.current);
      }
    };
  }, [isMobile, isTablet, delay, threshold, rootMargin]);
  
  const variants = getAnimationVariants();
  
  return (
    <div ref={contentRef} className={className}>
      {shouldRender ? (
        <motion.div
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          variants={variants}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      ) : (
        placeholder || (
          <div className="animate-pulse bg-background-light rounded-md h-full w-full min-h-[100px]"></div>
        )
      )}
    </div>
  );
}
