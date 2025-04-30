'use client';

import { motion } from 'framer-motion';
import { FaInfoCircle } from 'react-icons/fa';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  infoText?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  infoText,
  icon,
  actions
}) => {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-to-br from-background-light/80 to-background-lighter/60 backdrop-blur-lg rounded-xl shadow-lg border border-primary/20 p-5 overflow-hidden">
        {/* خلفية زخرفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-primary/5 blur-3xl"></div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            {icon && (
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 text-primary ml-4 shadow-lg">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2 space-x-reverse">
              {actions}
            </div>
          )}
        </div>
        
        {infoText && (
          <motion.div
            className="mt-4 bg-gradient-to-br from-info/10 to-info/5 rounded-xl p-4 border border-info/30 shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center ml-3 mt-1">
                <FaInfoCircle className="text-info" />
              </div>
              <div className="text-sm text-foreground-muted">
                {infoText}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
