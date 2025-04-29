'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  once?: boolean;
}

export default function LazyLoad({
  children,
  placeholder,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px',
  className = '',
  once = true
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMounted.current) return;

        // استخدام requestAnimationFrame لتحسين الأداء
        requestAnimationFrame(() => {
          if (!isMounted.current) return;

          if (entry.isIntersecting) {
            // عنصر مرئي الآن
            setIsVisible(true);

            if (once) {
              // إلغاء المراقبة بعد الظهور الأول
              observer.unobserve(currentRef);
            }
          } else if (!once) {
            // إذا لم يكن العنصر مرئيًا وكان once = false
            setIsVisible(false);
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    observer.observe(currentRef);

    return () => {
      isMounted.current = false;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, rootMargin, threshold]);

  useEffect(() => {
    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    if (isVisible && delay > 0) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setIsLoaded(true);
        }
      }, delay);

      return () => {
        isMounted.current = false;
        clearTimeout(timer);
      };
    } else if (isVisible) {
      // استخدام requestAnimationFrame لتحسين الأداء
      requestAnimationFrame(() => {
        if (isMounted.current) {
          setIsLoaded(true);
        }
      });

      return () => {
        isMounted.current = false;
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, [isVisible, delay]);

  return (
    <div ref={ref} className={className}>
      {isLoaded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      ) : (
        placeholder || (
          <div className="animate-pulse bg-background-light rounded-lg h-full w-full min-h-[100px]" />
        )
      )}
    </div>
  );
}

// مكون للتحميل المتأخر للقوائم
export function LazyLoadList({
  items,
  renderItem,
  placeholder,
  delay = 100,
  className = '',
  itemClassName = ''
}: {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  placeholder?: ReactNode;
  delay?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <LazyLoad
          key={item.id || index}
          delay={delay * index}
          className={itemClassName}
          placeholder={placeholder}
        >
          {renderItem(item, index)}
        </LazyLoad>
      ))}
    </div>
  );
}
