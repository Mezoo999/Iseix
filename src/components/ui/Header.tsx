'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface HeaderProps {
  title: string;
  subtitle?: string;
  infoText?: string;
  icon?: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
  }[];
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  infoText,
  icon,
  stats = []
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // تأثير التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? 'bg-background-dark/90 backdrop-blur-lg shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        {/* بطاقة عصرية موحدة */}
        <motion.div
          className="bg-gradient-to-br from-background-dark/80 to-background-dark/60 backdrop-blur-lg rounded-xl shadow-lg border border-primary/20 p-4 overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* خلفية زخرفية */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="flex flex-col">
            {/* عنوان الصفحة والمعلومات */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {icon && (
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 text-primary ml-3 shadow-lg">
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-foreground-muted">{subtitle}</p>
                  )}
                </div>
              </div>

              {infoText && (
                <motion.button
                  className="p-2 rounded-full bg-background-lighter/50 hover:bg-background-lighter transition-colors"
                  onClick={() => setShowInfo(!showInfo)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showInfo ? <FaChevronUp /> : <FaChevronDown />}
                </motion.button>
              )}
            </div>

            {/* معلومات إضافية */}
            {infoText && (
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: showInfo ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gradient-to-br from-info/10 to-info/5 rounded-xl p-4 mb-4 border border-info/30 shadow-md">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center ml-3 mt-1">
                      <FaInfoCircle className="text-info" />
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {infoText}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* إحصائيات */}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-background-lighter/20 rounded-lg p-3 border border-primary/10 shadow-inner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center mb-1">
                      {stat.icon && (
                        <div className={`w-8 h-8 rounded-full bg-${stat.color || 'primary'}/10 flex items-center justify-center ml-2`}>
                          {stat.icon}
                        </div>
                      )}
                      <span className="text-xs text-foreground-muted">{stat.label}</span>
                    </div>
                    <p className={`text-lg font-bold text-${stat.color || 'primary'}`}>
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Header;
