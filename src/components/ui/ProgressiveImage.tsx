'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface ProgressiveImageProps {
  lowQualitySrc: string;
  highQualitySrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

export default function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center'
}: ProgressiveImageProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [shouldLoadHighQuality, setShouldLoadHighQuality] = useState(!isMobile);
  
  // تحميل الصورة عالية الجودة بعد تحميل الصورة منخفضة الجودة
  useEffect(() => {
    // إذا كانت الصورة ذات أولوية، قم بتحميل الصورة عالية الجودة مباشرة
    if (priority) {
      setShouldLoadHighQuality(true);
      return;
    }
    
    // على الأجهزة المحمولة، انتظر قليلاً قبل تحميل الصورة عالية الجودة
    if (isMobile || isTablet) {
      const timer = setTimeout(() => {
        setShouldLoadHighQuality(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShouldLoadHighQuality(true);
    }
  }, [isMobile, isTablet, priority]);
  
  // تحديد أحجام الصورة بناءً على نوع الجهاز
  const getImageSizes = () => {
    if (sizes) return sizes;
    
    if (isMobile) {
      return '(max-width: 768px) 100vw, 50vw';
    } else if (isTablet) {
      return '(max-width: 1024px) 75vw, 50vw';
    } else {
      return '50vw';
    }
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* الصورة منخفضة الجودة */}
      <motion.div
        animate={{ opacity: highQualityLoaded ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        <Image
          src={lowQualitySrc}
          alt={alt}
          width={width}
          height={height}
          quality={10}
          priority={true}
          sizes={getImageSizes()}
          fill={fill}
          style={{
            objectFit: objectFit as any,
            objectPosition,
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      </motion.div>
      
      {/* الصورة عالية الجودة */}
      {shouldLoadHighQuality && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: highQualityLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Image
            src={highQualitySrc}
            alt={alt}
            width={width}
            height={height}
            quality={isMobile ? 60 : 80}
            priority={priority}
            sizes={getImageSizes()}
            fill={fill}
            style={{
              objectFit: objectFit as any,
              objectPosition
            }}
            onLoad={() => setHighQualityLoaded(true)}
          />
        </motion.div>
      )}
    </div>
  );
}
