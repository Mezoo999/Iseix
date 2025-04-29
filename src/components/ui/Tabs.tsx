'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className = '',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };
  
  // تحديد الأنماط حسب النوع
  const getTabStyles = (tab: Tab) => {
    const isActive = activeTab === tab.id;
    
    switch (variant) {
      case 'pills':
        return {
          container: `py-2 px-4 rounded-full transition-colors ${
            isActive
              ? 'bg-primary text-white'
              : 'bg-background-light hover:bg-background-lighter text-foreground-muted hover:text-foreground'
          }`,
          indicator: 'hidden',
        };
      case 'underline':
        return {
          container: `py-4 px-6 font-medium transition-colors ${
            isActive
              ? 'text-primary'
              : 'text-foreground-muted hover:text-foreground'
          }`,
          indicator: `absolute bottom-0 left-0 right-0 h-0.5 bg-primary transform ${
            isActive ? 'scale-x-100' : 'scale-x-0'
          } transition-transform origin-left`,
        };
      default:
        return {
          container: `py-3 px-4 font-medium border-b-2 transition-colors ${
            isActive
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground hover:border-primary/30'
          }`,
          indicator: 'hidden',
        };
    }
  };
  
  return (
    <div className={`mb-6 ${className}`}>
      <nav className={`flex ${variant === 'default' ? 'border-b border-primary/20' : ''}`}>
        {tabs.map((tab) => (
          <div key={tab.id} className="relative">
            <button
              className={`flex items-center ${getTabStyles(tab).container}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon && <span className="ml-2">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
            <motion.div
              className={getTabStyles(tab).indicator}
              initial={false}
              animate={{ scaleX: activeTab === tab.id ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </nav>
    </div>
  );
}
