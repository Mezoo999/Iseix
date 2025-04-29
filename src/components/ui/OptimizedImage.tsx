'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import useDeviceDetect from '@/hooks/useDeviceDetect';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
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
  onError
}: OptimizedImageProps) {
  const { isMobile, isTablet } = useDeviceDetect();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [imageQuality, setImageQuality] = useState(quality);

  // إعادة تعيين الحالة عند تغيير المصدر
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
    setImageSrc(src);
  }, [src]);

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

  // التعامل مع تحميل الصورة
  const handleLoad = () => {
    setIsLoaded(true);
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

  const defaultSizes = getDefaultSizes();

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
        <Image
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
        />
      )}
    </div>
  );
}
