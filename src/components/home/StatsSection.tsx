'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaMoneyBillWave, FaGlobe, FaServer } from 'react-icons/fa';
import { FadeInView } from '@/components/ui/AnimatedElements';

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
  endValue: number;
  suffix?: string;
}

function StatItem({ icon, value, label, delay, endValue, suffix = '' }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  // استخدام useEffect منفصل لإعداد المراقب
  useEffect(() => {
    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && isMounted.current && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`stat-${label}`);
    if (element) observer.observe(element);

    return () => {
      isMounted.current = false;
      observer.disconnect();
    };
  }, [label, isVisible]);

  // استخدام useEffect منفصل لتشغيل الرسوم المتحركة
  useEffect(() => {
    if (!isVisible || animationStarted) return;

    // تعيين علامة بدء الرسوم المتحركة
    setAnimationStarted(true);

    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };
    let animationFrameId: number;
    let startTime: number;
    const duration = 2000; // مدة التأثير بالمللي ثانية

    const step = (timestamp: number) => {
      if (!isMounted.current) return;

      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    // بدء الرسوم المتحركة
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      isMounted.current = false;
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVisible, animationStarted, endValue]);

  return (
    <FadeInView direction="up" delay={delay} className="relative">
      <div
        id={`stat-${label}`}
        className="card card-primary p-3 sm:p-6 text-center h-full"
      >
        <div className="p-3 sm:p-4 rounded-full bg-primary/20 text-primary inline-block mb-2 sm:mb-4">
          {icon}
        </div>
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-1 sm:mb-2">
          {count}
          {suffix}
        </div>
        <div className="text-foreground-muted text-sm sm:text-base">{label}</div>
      </div>
    </FadeInView>
  );
}

export default function StatsSection() {
  const stats = [
    {
      icon: <FaUsers className="text-xl sm:text-2xl" />,
      value: '15K+',
      endValue: 15000,
      suffix: '+',
      label: 'مستخدم نشط',
      delay: 0.1
    },
    {
      icon: <FaMoneyBillWave className="text-xl sm:text-2xl" />,
      value: '$10M+',
      endValue: 10,
      suffix: 'M+',
      label: 'استثمارات مُدارة',
      delay: 0.2
    },
    {
      icon: <FaGlobe className="text-xl sm:text-2xl" />,
      value: '25+',
      endValue: 25,
      suffix: '+',
      label: 'دولة',
      delay: 0.3
    },
    {
      icon: <FaServer className="text-xl sm:text-2xl" />,
      value: '99.9%',
      endValue: 99.9,
      suffix: '%',
      label: 'وقت تشغيل',
      delay: 0.4
    }
  ];

  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <FadeInView direction="up">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">إحصائيات المنصة</h2>
            <p className="text-sm sm:text-base text-foreground-muted max-w-2xl mx-auto">
              تعرف على أرقامنا وإنجازاتنا التي تعكس نجاح منصتنا وثقة المستخدمين
            </p>
          </FadeInView>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              delay={stat.delay}
              endValue={stat.endValue}
              suffix={stat.suffix}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
