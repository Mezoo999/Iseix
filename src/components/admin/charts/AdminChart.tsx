'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaChartBar, FaChartPie, FaChartArea } from 'react-icons/fa';

interface AdminChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  type?: 'line' | 'bar' | 'pie' | 'area';
  className?: string;
  delay?: number;
}

export default function AdminChart({
  title,
  description,
  children,
  type = 'line',
  className = '',
  delay = 0
}: AdminChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'line':
        return <FaChartLine />;
      case 'bar':
        return <FaChartBar />;
      case 'pie':
        return <FaChartPie />;
      case 'area':
        return <FaChartArea />;
      default:
        return <FaChartLine />;
    }
  };

  return (
    <motion.div
      className={`bg-background-light p-6 rounded-xl shadow-sm border border-background-lighter hover:border-primary/20 transition-colors ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary ml-3">
          {getIcon()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && <p className="text-foreground-muted text-sm">{description}</p>}
        </div>
      </div>

      <div className="w-full h-64 mt-4">
        {isClient ? children : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
