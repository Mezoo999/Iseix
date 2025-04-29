'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AdminCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  delay?: number;
}

export default function AdminCard({ title, icon, children, delay = 0 }: AdminCardProps) {
  return (
    <motion.div
      className="bg-background-light rounded-xl shadow-sm overflow-hidden mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="bg-background-dark text-white p-4 flex items-center">
        <div className="p-2 rounded-full bg-white/10 ml-3">
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
}
