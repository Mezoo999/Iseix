'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaArrowUp, FaUsers } from 'react-icons/fa';
import { MembershipLevel, PROFIT_RATES } from '@/services/dailyTasks';

interface MembershipRequirementsProps {
  currentLevel: MembershipLevel;
  referralCount: number;
}

const MembershipRequirements: React.FC<MembershipRequirementsProps> = ({ 
  currentLevel,
  referralCount = 0
}) => {
  // معلومات المستويات
  const levels = [
    {
      level: MembershipLevel.BASIC,
      name: 'Iseix Basic',
      arabicName: 'المستوى الأساسي',
      requiredReferrals: 0,
      profitRate: `${PROFIT_RATES[MembershipLevel.BASIC].min}% ~ ${PROFIT_RATES[MembershipLevel.BASIC].max}%`
    },
    {
      level: MembershipLevel.SILVER,
      name: 'Iseix Silver',
      arabicName: 'المستوى الفضي',
      requiredReferrals: 3,
      profitRate: `${PROFIT_RATES[MembershipLevel.SILVER].min}% ~ ${PROFIT_RATES[MembershipLevel.SILVER].max}%`
    },
    {
      level: MembershipLevel.GOLD,
      name: 'Iseix Gold',
      arabicName: 'المستوى الذهبي',
      requiredReferrals: 10,
      profitRate: `${PROFIT_RATES[MembershipLevel.GOLD].min}% ~ ${PROFIT_RATES[MembershipLevel.GOLD].max}%`
    },
    {
      level: MembershipLevel.PLATINUM,
      name: 'Iseix Platinum',
      arabicName: 'المستوى البلاتيني',
      requiredReferrals: 20,
      profitRate: `${PROFIT_RATES[MembershipLevel.PLATINUM].min}% ~ ${PROFIT_RATES[MembershipLevel.PLATINUM].max}%`
    },
    {
      level: MembershipLevel.DIAMOND,
      name: 'Iseix Diamond',
      arabicName: 'المستوى الماسي',
      requiredReferrals: 50,
      profitRate: `${PROFIT_RATES[MembershipLevel.DIAMOND].min}% ~ ${PROFIT_RATES[MembershipLevel.DIAMOND].max}%`
    },
    {
      level: MembershipLevel.ELITE,
      name: 'Iseix Elite',
      arabicName: 'المستوى النخبة',
      requiredReferrals: 100,
      profitRate: `${PROFIT_RATES[MembershipLevel.ELITE].min}% ~ ${PROFIT_RATES[MembershipLevel.ELITE].max}%`
    }
  ];
  
  // تحديد المستوى التالي
  const nextLevelIndex = Math.min(levels.findIndex(l => l.level === currentLevel) + 1, levels.length - 1);
  const nextLevel = levels[nextLevelIndex];
  
  // حساب عدد الإحالات المطلوبة للترقية
  const requiredReferralsForNextLevel = nextLevel.requiredReferrals;
  const remainingReferrals = Math.max(0, requiredReferralsForNextLevel - referralCount);
  
  // حساب نسبة التقدم
  const progressPercentage = Math.min(100, (referralCount / requiredReferralsForNextLevel) * 100);
  
  return (
    <div className="bg-gradient-to-br from-background-light/50 to-background-light/20 p-4 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">متطلبات مستويات العضوية</h2>
      
      {/* عرض المستوى التالي والتقدم */}
      {currentLevel < MembershipLevel.ELITE && (
        <div className="bg-background-light/30 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-foreground-muted">المستوى التالي</p>
              <h3 className="font-bold">{nextLevel.name}</h3>
            </div>
            <div className="bg-primary/10 text-primary text-sm py-1 px-3 rounded-full flex items-center">
              <FaArrowUp className="ml-1" />
              <span>ترقية</span>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-foreground-muted">التقدم</span>
              <span className="text-xs font-bold">{referralCount}/{requiredReferralsForNextLevel} إحالة</span>
            </div>
            <div className="relative w-full h-3 bg-background-light rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 right-0 h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="text-sm text-center mt-3">
            <span className="text-foreground-muted">تحتاج إلى </span>
            <span className="font-bold text-primary">{remainingReferrals}</span>
            <span className="text-foreground-muted"> إحالات إضافية للترقية</span>
          </div>
        </div>
      )}
      
      {/* عرض جميع المستويات */}
      <div className="space-y-4">
        {levels.map((level, index) => {
          const isCurrentLevel = level.level === currentLevel;
          const isPastLevel = level.level < currentLevel;
          
          return (
            <div 
              key={level.level}
              className={`p-3 rounded-lg border ${
                isCurrentLevel 
                  ? 'border-primary bg-primary/10' 
                  : isPastLevel 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-foreground-muted/30 bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${
                    isCurrentLevel 
                      ? 'bg-primary text-white' 
                      : isPastLevel 
                        ? 'bg-success text-white' 
                        : 'bg-foreground-muted/20 text-foreground-muted'
                  }`}>
                    {isPastLevel ? <FaCheck /> : index + 1}
                  </div>
                  <div>
                    <div className="font-bold">{level.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {level.profitRate} ربح يومي
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaUsers className="ml-1 text-foreground-muted" />
                  <span className="font-bold">{level.requiredReferrals}</span>
                  <span className="text-xs text-foreground-muted mr-1"> إحالة</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipRequirements;
