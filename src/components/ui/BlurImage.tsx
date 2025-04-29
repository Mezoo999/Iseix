'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface BlurImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholderSize?: number;
  priority?: boolean;
}

export default function BlurImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderSize = 10,
  priority = false
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState('');
  
  // إنشاء مسار الصورة المصغرة
  useEffect(() => {
    // إنشاء مسار الصورة المصغرة
    const placeholderSrc = src.includes('?')
      ? `${src}&w=${placeholderSize}&q=20`
      : `${src}?w=${placeholderSize}&q=20`;
    
    setCurrentSrc(placeholderSrc);
    
    // تحميل الصورة الكاملة مسبقًا
    const fullImage = new Image();
    fullImage.src = src;
    fullImage.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
  }, [src, placeholderSize]);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        animate={{ filter: isLoading ? 'blur(20px)' : 'blur(0px)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full h-full"
      >
        <Image
          src={currentSrc || src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover transition-all duration-500"
          priority={priority}
        />
      </motion.div>
    </div>
  );
}

// مكون للصور المتحركة
export function AnimatedImage({
  src,
  alt,
  width,
  height,
  className = '',
  animation = 'fade',
  delay = 0
}: BlurImageProps & {
  animation?: 'fade' | 'scale' | 'slide' | 'rotate';
  delay?: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // تحديد التأثير الحركي
  const getAnimationVariants = () => {
    switch (animation) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'slide':
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 }
        };
      case 'rotate':
        return {
          hidden: { opacity: 0, rotate: -10 },
          visible: { opacity: 1, rotate: 0 }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };
  
  const variants = getAnimationVariants();
  
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial="hidden"
      animate={isLoaded ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.5, delay }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
      />
    </motion.div>
  );
}
