'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import features from '@/config/features';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
}

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // التحقق من ما إذا كان الجهاز محمولاً وتمكين/تعطيل الخلفية المتحركة
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // تحديث حالة التمكين بناءً على الإعدادات
      const enabled = features.animatedBackground &&
        !(mobile && features.performance.disableBackgroundOnMobile);
      setIsEnabled(enabled);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // تحديث أبعاد الحاوية
  useEffect(() => {
    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    const updateDimensions = () => {
      if (!isMounted.current) return;

      // استخدام requestAnimationFrame لتحسين الأداء
      requestAnimationFrame(() => {
        if (containerRef.current && isMounted.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
          });
        }
      });
    };

    updateDimensions();

    // استخدام خاصية passive لتحسين الأداء
    window.addEventListener('resize', updateDimensions, { passive: true });

    return () => {
      isMounted.current = false;
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // إنشاء الجسيمات
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const colors = [
      'rgba(59, 130, 246, 0.15)',  // أزرق فاتح
      'rgba(139, 92, 246, 0.15)',  // بنفسجي
      'rgba(16, 185, 129, 0.15)',  // أخضر
      'rgba(99, 102, 241, 0.15)'   // أزرق بنفسجي
    ];

    const newParticles: Particle[] = [];
    const particleCount = Math.min(Math.floor(dimensions.width / 80), 25);

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 40 + 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }

    setParticles(newParticles);
  }, [dimensions]);

  // تحريك الجسيمات
  useEffect(() => {
    if (particles.length === 0) return;

    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    // نسخ الأبعاد والجسيمات لتجنب التحديثات غير الضرورية
    const currentDimensions = {
      width: dimensions.width,
      height: dimensions.height
    };

    // استخدام متغير لتتبع آخر وقت تحديث
    let lastUpdateTime = 0;
    let animationFrameId: number;

    // استخدام وظيفة تحريك الجسيمات
    const moveParticles = (timestamp: number) => {
      if (!isMounted.current) return;

      // تحديث الجسيمات كل 50 مللي ثانية فقط
      if (timestamp - lastUpdateTime >= 50) {
        lastUpdateTime = timestamp;

        setParticles(prevParticles => {
          // إذا لم يكن المكون مثبتًا، لا تقم بالتحديث
          if (!isMounted.current) return prevParticles;

          return prevParticles.map(particle => {
            let newX = particle.x + particle.vx;
            let newY = particle.y + particle.vy;

            // ارتداد الجسيمات عند وصولها للحدود
            if (newX <= 0 || newX >= currentDimensions.width) {
              const newVx = particle.vx * -1;
              newX = particle.x + newVx;
              return {
                ...particle,
                x: newX,
                vx: newVx
              };
            }

            if (newY <= 0 || newY >= currentDimensions.height) {
              const newVy = particle.vy * -1;
              newY = particle.y + newVy;
              return {
                ...particle,
                y: newY,
                vy: newVy
              };
            }

            return {
              ...particle,
              x: newX,
              y: newY
            };
          });
        });
      }

      // استمرار حلقة الرسوم المتحركة
      if (isMounted.current) {
        animationFrameId = requestAnimationFrame(moveParticles);
      }
    };

    // بدء حلقة الرسوم المتحركة
    animationFrameId = requestAnimationFrame(moveParticles);

    return () => {
      isMounted.current = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]"
    >
      {isEnabled && particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full blur-2xl"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            left: particle.x,
            top: particle.y
          }}
          animate={{
            x: [0, 15, -15, 0],
            y: [0, -15, 15, 0],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}
