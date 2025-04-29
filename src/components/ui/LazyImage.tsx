'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // إعادة تعيين الحالة عند تغيير المصدر
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);
  
  // التعامل مع تحميل الصورة
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  // التعامل مع خطأ تحميل الصورة
  const handleError = () => {
    setError(true);
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !error && (
        <motion.div
          className="absolute inset-0 bg-background-light animate-pulse"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      
      {error ? (
        <div className="flex items-center justify-center w-full h-full bg-background-light text-foreground-muted">
          <span>فشل تحميل الصورة</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
        />
      )}
    </div>
  );
}
