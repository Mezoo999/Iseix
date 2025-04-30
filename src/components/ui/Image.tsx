'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  progressive?: boolean;
  lowQualitySrc?: string;
  animation?: 'fade' | 'scale' | 'slide' | 'rotate' | 'none';
  animationDelay?: number;
}

export default function Image({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  loading,
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  progressive = false,
  lowQualitySrc,
  animation = 'fade',
  animationDelay = 0
}: ImageProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [imageQuality, setImageQuality] = useState(quality);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [shouldLoadHighQuality, setShouldLoadHighQuality] = useState(!isMobile || priority);

  // إعادة تعيين الحالة عند تغيير المصدر
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
    setImageSrc(src);
    setHighQualityLoaded(false);
    
    if (progressive && !priority) {
      setShouldLoadHighQuality(!isMobile);
    } else {
      setShouldLoadHighQuality(true);
    }
  }, [src, progressive, priority, isMobile]);

  // تحسين جودة الصورة بناءً على نوع الجهاز
  useEffect(() => {
    if (isMobile) {
      // تقليل جودة الصورة للأجهزة المحمولة لتحسين الأداء
      setImageQuality(Math.min(quality, 60));
    } else if (isTablet) {
      // جودة متوسطة للأجهزة اللوحية
      setImageQuality(Math.min(quality, 70));
    } else {
      setImageQuality(quality);
    }
  }, [isMobile, isTablet, quality]);

  // تحميل الصورة عالية الجودة بعد تحميل الصورة منخفضة الجودة
  useEffect(() => {
    if (!progressive || priority) return;
    
    // على الأجهزة المحمولة، انتظر قليلاً قبل تحميل الصورة عالية الجودة
    if (isMobile || isTablet) {
      const timer = setTimeout(() => {
        setShouldLoadHighQuality(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShouldLoadHighQuality(true);
    }
  }, [isMobile, isTablet, priority, progressive]);

  // التعامل مع تحميل الصورة
  const handleLoad = () => {
    setIsLoaded(true);
    if (progressive) {
      setHighQualityLoaded(true);
    }
    if (onLoad) onLoad();
  };

  // التعامل مع خطأ تحميل الصورة
  const handleError = () => {
    setIsError(true);

    // محاولة تحميل صورة بديلة
    if (imageSrc === src) {
      // يمكن استخدام صورة بديلة هنا
      // setImageSrc('/images/fallback.jpg');
    } else if (onError) {
      onError();
    }
  };

  // تحديد حجم الصورة المناسب للجهاز
  const getDefaultSizes = () => {
    if (sizes) return sizes;

    if (isMobile) {
      return '(max-width: 640px) 100vw, 100vw';
    } else if (isTablet) {
      return '(max-width: 1024px) 75vw, 50vw';
    } else {
      return '(max-width: 1536px) 33vw, 25vw';
    }
  };

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
      case 'none':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  const defaultSizes = getDefaultSizes();
  const variants = getAnimationVariants();

  // إذا كان وضع الصورة التدريجي مفعل
  if (progressive && lowQualitySrc) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* الصورة منخفضة الجودة */}
        <motion.div
          animate={{ opacity: highQualityLoaded ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <NextImage
            src={lowQualitySrc}
            alt={alt}
            width={width}
            height={height}
            quality={10}
            priority={true}
            sizes={defaultSizes}
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
            <NextImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              quality={imageQuality}
              priority={priority}
              sizes={defaultSizes}
              fill={fill}
              style={{
                objectFit: objectFit as any,
                objectPosition
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
          </motion.div>
        )}
      </div>
    );
  }

  // الوضع العادي
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !isError && (
        <motion.div
          className="absolute inset-0 bg-background-light"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {isError ? (
        <div className="flex items-center justify-center w-full h-full bg-background-light text-foreground-muted">
          <span>فشل تحميل الصورة</span>
        </div>
      ) : (
        <motion.div
          initial={animation !== 'none' ? "hidden" : undefined}
          animate={isLoaded && animation !== 'none' ? "visible" : undefined}
          variants={variants}
          transition={{ duration: 0.5, delay: animationDelay }}
          style={{ width: '100%', height: '100%' }}
        >
          <NextImage
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            quality={imageQuality}
            sizes={defaultSizes}
            loading={isMobile && !priority ? 'lazy' : loading}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            fill={fill}
            style={{
              objectFit: objectFit as any,
              objectPosition
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
