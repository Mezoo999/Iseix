'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import AnimatedButton from './AnimatedButton';

interface PlanFeature {
  text: string;
}

interface PlanCardProps {
  name: string;
  price: number;
  duration: string;
  returnRate: string;
  features: PlanFeature[];
  isPopular?: boolean;
  delay?: number;
}

const PlanCard = ({
  name,
  price,
  duration,
  returnRate,
  features,
  isPopular = false,
  delay = 0,
}: PlanCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`glass-effect p-6 rounded-xl relative ${
        isPopular ? 'border-2 border-primary' : ''
      }`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* شارة الخطة الشائعة */}
      {isPopular && (
        <div className="absolute -top-4 right-0 left-0 mx-auto w-max">
          <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
            الأكثر شيوعًا
          </div>
        </div>
      )}

      {/* اسم الخطة */}
      <h3 className="text-xl font-bold mb-2 text-center">{name}</h3>

      {/* السعر */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-primary">${price}</div>
        <div className="text-foreground-muted">{duration}</div>
      </div>

      {/* معدل العائد */}
      <div className="text-center mb-6 p-3 bg-background-light rounded-lg">
        <div className="text-2xl font-bold text-gradient">{returnRate}</div>
        <div className="text-foreground-muted">عائد متوقع</div>
      </div>

      {/* قائمة الميزات */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <FaCheck className="text-secondary ml-2 flex-shrink-0" />
            <span className="text-foreground-muted">{feature.text}</span>
          </li>
        ))}
      </ul>

      {/* زر الاشتراك */}
      <div className="text-center">
        <AnimatedButton
          href="/register"
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
        >
          اشترك الآن
        </AnimatedButton>
      </div>

      {/* تأثير التوهج */}
      {isPopular && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-xl opacity-20 blur-xl"
          initial={{ scale: 0.85, backgroundColor: '#3B82F6' }}
          animate={{
            scale: isHovered ? 1 : 0.85,
            opacity: isHovered ? 0.3 : 0.2,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default PlanCard;
