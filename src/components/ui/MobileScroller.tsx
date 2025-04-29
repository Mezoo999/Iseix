'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface MobileScrollerProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  showScrollbar?: boolean;
  showIndicators?: boolean;
  snapToItem?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export default function MobileScroller({
  children,
  className = '',
  itemClassName = '',
  showScrollbar = false,
  showIndicators = true,
  snapToItem = true,
  direction = 'horizontal'
}: MobileScrollerProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  
  // تحديث حالة التمرير
  useEffect(() => {
    const scrollerElement = scrollerRef.current;
    if (!scrollerElement) return;
    
    const updateScrollInfo = () => {
      if (direction === 'horizontal') {
        setScrollPosition(scrollerElement.scrollLeft);
        setMaxScroll(scrollerElement.scrollWidth - scrollerElement.clientWidth);
      } else {
        setScrollPosition(scrollerElement.scrollTop);
        setMaxScroll(scrollerElement.scrollHeight - scrollerElement.clientHeight);
      }
      
      // حساب العنصر النشط
      const items = Array.from(scrollerElement.children);
      setItemCount(items.length);
      
      if (items.length > 0) {
        const itemSize = direction === 'horizontal' 
          ? items[0].getBoundingClientRect().width 
          : items[0].getBoundingClientRect().height;
        
        const newIndex = Math.round(
          direction === 'horizontal' 
            ? scrollerElement.scrollLeft / itemSize 
            : scrollerElement.scrollTop / itemSize
        );
        
        setActiveIndex(Math.min(Math.max(0, newIndex), items.length - 1));
      }
    };
    
    updateScrollInfo();
    
    const handleScroll = () => {
      updateScrollInfo();
    };
    
    scrollerElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollInfo);
    
    return () => {
      scrollerElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollInfo);
    };
  }, [direction]);
  
  // التمرير إلى عنصر محدد
  const scrollToItem = (index: number) => {
    const scrollerElement = scrollerRef.current;
    if (!scrollerElement || index < 0 || index >= itemCount) return;
    
    const items = Array.from(scrollerElement.children);
    if (items.length <= index) return;
    
    const targetItem = items[index];
    const itemRect = targetItem.getBoundingClientRect();
    
    if (direction === 'horizontal') {
      scrollerElement.scrollTo({
        left: targetItem.getBoundingClientRect().left + scrollerElement.scrollLeft - scrollerElement.getBoundingClientRect().left,
        behavior: 'smooth'
      });
    } else {
      scrollerElement.scrollTo({
        top: targetItem.getBoundingClientRect().top + scrollerElement.scrollTop - scrollerElement.getBoundingClientRect().top,
        behavior: 'smooth'
      });
    }
  };
  
  // تحديد فئات CSS بناءً على الاتجاه
  const scrollerClassName = direction === 'horizontal'
    ? `flex overflow-x-auto ${snapToItem ? 'snap-x snap-mandatory' : ''} ${showScrollbar ? '' : 'hide-scrollbar'}`
    : `flex flex-col overflow-y-auto ${snapToItem ? 'snap-y snap-mandatory' : ''} ${showScrollbar ? '' : 'hide-scrollbar'}`;
  
  const itemClasses = direction === 'horizontal'
    ? `${snapToItem ? 'snap-center' : ''} ${itemClassName}`
    : `${snapToItem ? 'snap-center' : ''} ${itemClassName}`;
  
  // تطبيق فئات مختلفة للأجهزة المحمولة والأجهزة المكتبية
  const finalScrollerClassName = isMobile || isTablet
    ? `${scrollerClassName} ${className}`
    : `overflow-auto ${className}`;
  
  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className={finalScrollerClassName}
        style={{ scrollbarWidth: showScrollbar ? 'auto' : 'none' }}
      >
        {Array.isArray(children) 
          ? children.map((child, index) => (
              <div key={index} className={itemClasses}>
                {child}
              </div>
            ))
          : children
        }
      </div>
      
      {/* مؤشرات التمرير */}
      {showIndicators && itemCount > 1 && (isMobile || isTablet) && (
        <div className={`flex justify-center mt-4 space-x-2 ${direction === 'vertical' ? 'absolute left-2 top-1/2 -translate-y-1/2 flex-col space-y-2 space-x-0' : ''}`}>
          {Array.from({ length: itemCount }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${activeIndex === index ? 'bg-primary w-4' : 'bg-background-lighter'}`}
              onClick={() => scrollToItem(index)}
              aria-label={`Scroll to item ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* شريط التمرير المخصص */}
      {!showScrollbar && maxScroll > 0 && (isMobile || isTablet) && (
        <div 
          className={`mt-2 h-1 bg-background-lighter rounded-full overflow-hidden ${direction === 'vertical' ? 'absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 mt-0 ml-0' : ''}`}
          style={{ width: direction === 'vertical' ? '4px' : '100%', height: direction === 'vertical' ? '100%' : '4px' }}
        >
          <motion.div 
            className="bg-primary h-full rounded-full"
            style={{ 
              width: direction === 'vertical' ? '100%' : `${(scrollerRef.current?.clientWidth || 0) / (scrollerRef.current?.scrollWidth || 1) * 100}%`,
              height: direction === 'vertical' ? `${(scrollerRef.current?.clientHeight || 0) / (scrollerRef.current?.scrollHeight || 1) * 100}%` : '100%',
              x: direction === 'vertical' ? 0 : scrollPosition / maxScroll * ((scrollerRef.current?.clientWidth || 0) - ((scrollerRef.current?.clientWidth || 0) / (scrollerRef.current?.scrollWidth || 1) * (scrollerRef.current?.clientWidth || 0))),
              y: direction === 'vertical' ? scrollPosition / maxScroll * ((scrollerRef.current?.clientHeight || 0) - ((scrollerRef.current?.clientHeight || 0) / (scrollerRef.current?.scrollHeight || 1) * (scrollerRef.current?.clientHeight || 0))) : 0
            }}
          />
        </div>
      )}
    </div>
  );
}
