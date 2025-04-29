'use client';

import { motion } from 'framer-motion';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'success' | 'error';
}

// مؤشر دائري متحرك
export function CircleLoader({ size = 'md', color = 'primary' }: LoaderProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorMap = {
    primary: 'border-primary',
    white: 'border-white',
    success: 'border-success',
    error: 'border-error'
  };
  
  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`rounded-full border-2 border-t-transparent ${sizeMap[size]} ${colorMap[color]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// مؤشر نقاط متحركة
export function DotsLoader({ size = 'md', color = 'primary' }: LoaderProps) {
  const sizeMap = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };
  
  const colorMap = {
    primary: 'bg-primary',
    white: 'bg-white',
    success: 'bg-success',
    error: 'bg-error'
  };
  
  const containerSizeMap = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };
  
  return (
    <div className={`flex ${containerSizeMap[size]}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`rounded-full ${sizeMap[size]} ${colorMap[color]}`}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// مؤشر شعار المنصة
export function LogoLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };
  
  return (
    <div className="flex justify-center items-center">
      <motion.div
        className={`${sizeMap[size]}`}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* استبدل هذا بشعار المنصة */}
        <div className="text-primary font-bold text-center">
          <span className="text-2xl">ISEIX</span>
        </div>
      </motion.div>
    </div>
  );
}

// مؤشر تحميل الصفحة
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col justify-center items-center">
      <LogoLoader size="lg" />
      <motion.div
        className="mt-4 text-foreground-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        جاري التحميل...
      </motion.div>
    </div>
  );
}

// مؤشر تحميل القسم
export function SectionLoader() {
  return (
    <div className="py-12 flex flex-col justify-center items-center">
      <CircleLoader color="primary" size="md" />
      <motion.div
        className="mt-4 text-foreground-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        جاري تحميل البيانات...
      </motion.div>
    </div>
  );
}

// مؤشر تحميل الزر
export function ButtonLoader({ color = 'white' }: { color?: 'white' | 'primary' }) {
  return (
    <div className="flex items-center">
      <DotsLoader size="sm" color={color} />
      <span className="mr-2">جاري المعالجة</span>
    </div>
  );
}
