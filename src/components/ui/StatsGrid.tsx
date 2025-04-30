'use client';

import { motion } from 'framer-motion';

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  suffix?: string;
  prefix?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'glass' | 'solid';
}

const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 2,
  variant = 'default'
}) => {
  // تحديد الأنماط بناءً على المتغير
  const getCardStyle = () => {
    switch (variant) {
      case 'glass':
        return 'bg-background-lighter/20 backdrop-blur-md border border-primary/10 shadow-md';
      case 'solid':
        return 'bg-background-lighter border border-primary/20 shadow-lg';
      default:
        return 'bg-gradient-to-br from-background-dark/50 to-background-dark/30 border border-primary/10 shadow-inner';
    }
  };

  // تحديد عدد الأعمدة
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-2 sm:grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-4 mb-6`}>
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className={`p-4 rounded-xl ${getCardStyle()}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center mb-2">
            {stat.icon && (
              <div className={`w-8 h-8 rounded-full bg-${stat.color || 'primary'}/10 flex items-center justify-center ml-2`}>
                {stat.icon}
              </div>
            )}
            <span className="text-sm text-foreground-muted">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold text-${stat.color || 'primary'}`}>
            {stat.prefix}{stat.value}{stat.suffix}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsGrid;
