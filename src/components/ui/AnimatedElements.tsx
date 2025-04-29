'use client';

import { ReactNode } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';

// مكون للعناصر التي تظهر عند التمرير
export function FadeInView({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true
}: {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });
  
  const directionVariants = {
    up: { y: 40, opacity: 0 },
    down: { y: -40, opacity: 0 },
    left: { x: 40, opacity: 0 },
    right: { x: -40, opacity: 0 },
    none: { opacity: 0 }
  };
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={directionVariants[direction]}
      animate={isInView ? { y: 0, x: 0, opacity: 1 } : directionVariants[direction]}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتحرك مع التمرير
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = ''
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتغير حجمها عند التمرير
export function ScaleOnScroll({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ scale }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتغير شفافيتها عند التمرير
export function FadeOnScroll({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ opacity }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتحرك بشكل متموج
export function FloatingElement({
  children,
  className = '',
  duration = 3,
  distance = 10
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [-distance, distance] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتحرك بشكل دائري
export function PulseElement({
  children,
  className = '',
  duration = 2
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تظهر بشكل متتالي
export function StaggerChildren({
  children,
  className = '',
  staggerDelay = 0.1
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={item}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

// مكون للعناصر التي تتحرك عند التحويم
export function HoverElement({
  children,
  className = '',
  scale = 1.05,
  rotate = 0
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale, rotate, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
}

// مكون للعناصر التي تتحرك بشكل دائم
export function InfiniteMarquee({
  children,
  className = '',
  direction = 'left',
  speed = 20
}: {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  speed?: number;
}) {
  const x = direction === 'left' ? [0, -1000] : [-1000, 0];
  
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        animate={{ x }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 100 / speed,
          ease: 'linear'
        }}
        className="flex"
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// مكون للعناصر التي تتحرك بشكل دائري
export function RotateElement({
  children,
  className = '',
  duration = 10
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear'
      }}
    >
      {children}
    </motion.div>
  );
}
