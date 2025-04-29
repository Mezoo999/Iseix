'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      className="glass-effect p-6 rounded-xl hover-scale"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="mb-4 text-primary text-4xl">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-foreground-muted">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
