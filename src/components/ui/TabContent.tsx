'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabContentProps {
  children: ReactNode;
  id: string;
  activeTab: string;
  className?: string;
}

export default function TabContent({
  children,
  id,
  activeTab,
  className = '',
}: TabContentProps) {
  const isActive = id === activeTab;
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
