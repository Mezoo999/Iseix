'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  href: string;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const AnimatedButton = ({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: AnimatedButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // تحديد الفئات بناءً على المتغيرات
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary-dark';
      case 'outline':
        return 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white';
      case 'secondary':
        return 'bg-secondary text-white hover:bg-secondary-dark';
      default:
        return 'bg-primary text-white hover:bg-primary-dark';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm py-2 px-4';
      case 'md':
        return 'text-base py-3 px-6';
      case 'lg':
        return 'text-lg py-4 px-8';
      default:
        return 'text-base py-3 px-6';
    }
  };

  const handleClick = () => {
    try {
      window.location.href = href;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <motion.div
      className={`relative inline-block ${className} cursor-pointer`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
    >
      <motion.span
        className={`relative z-10 inline-block rounded-md font-bold ${getVariantClasses()} ${getSizeClasses()}`}
      >
        {children}
      </motion.span>

      {/* تأثير التوهج */}
      <motion.span
        className="absolute inset-0 -z-10 bg-primary rounded-md opacity-30 blur-xl"
        initial={{ scale: 0.85 }}
        animate={{
          scale: isHovered ? 1 : 0.85,
          opacity: isHovered ? 0.5 : 0.3
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default AnimatedButton;
