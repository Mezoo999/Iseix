'use client';

import React from 'react';
import { FaCheck, FaTimes, FaStar } from 'react-icons/fa';
import { MembershipLevel, PROFIT_RATES } from '@/services/dailyTasks';

interface MembershipBenefitsProps {
  currentLevel: MembershipLevel;
}

const MembershipBenefits: React.FC<MembershipBenefitsProps> = ({ currentLevel }) => {
  // معلومات المستويات
  const levels = [
    {
      level: MembershipLevel.BASIC,
      name: 'Iseix Basic',
      arabicName: 'المستوى الأساسي',
      profitRate: `${PROFIT_RATES[MembershipLevel.BASIC].min}% ~ ${PROFIT_RATES[MembershipLevel.BASIC].max}%`,
      directReferralCommission: '5%',
      indirectReferralCommission: '2%',
      dailyTasks: 3,
      prioritySupport: false,
      advancedAnalytics: false,
      vipConsultations: false,
      exclusiveOpportunities: false
    },
    {
      level: MembershipLevel.SILVER,
      name: 'Iseix Silver',
      arabicName: 'المستوى الفضي',
      profitRate: `${PROFIT_RATES[MembershipLevel.SILVER].min}% ~ ${PROFIT_RATES[MembershipLevel.SILVER].max}%`,
      directReferralCommission: '6%',
      indirectReferralCommission: '3%',
      dailyTasks: 3,
      prioritySupport: true,
      advancedAnalytics: false,
      vipConsultations: false,
      exclusiveOpportunities: false
    },
    {
      level: MembershipLevel.GOLD,
      name: 'Iseix Gold',
      arabicName: 'المستوى الذهبي',
      profitRate: `${PROFIT_RATES[MembershipLevel.GOLD].min}% ~ ${PROFIT_RATES[MembershipLevel.GOLD].max}%`,
      directReferralCommission: '7%',
      indirectReferralCommission: '3.5%',
      dailyTasks: 3,
      prioritySupport: true,
      advancedAnalytics: true,
      vipConsultations: false,
      exclusiveOpportunities: false
    },
    {
      level: MembershipLevel.PLATINUM,
      name: 'Iseix Platinum',
      arabicName: 'المستوى البلاتيني',
      profitRate: `${PROFIT_RATES[MembershipLevel.PLATINUM].min}% ~ ${PROFIT_RATES[MembershipLevel.PLATINUM].max}%`,
      directReferralCommission: '8%',
      indirectReferralCommission: '4%',
      dailyTasks: 3,
      prioritySupport: true,
      advancedAnalytics: true,
      vipConsultations: true,
      exclusiveOpportunities: false
    },
    {
      level: MembershipLevel.DIAMOND,
      name: 'Iseix Diamond',
      arabicName: 'المستوى الماسي',
      profitRate: `${PROFIT_RATES[MembershipLevel.DIAMOND].min}% ~ ${PROFIT_RATES[MembershipLevel.DIAMOND].max}%`,
      directReferralCommission: '9%',
      indirectReferralCommission: '4.5%',
      dailyTasks: 3,
      prioritySupport: true,
      advancedAnalytics: true,
      vipConsultations: true,
      exclusiveOpportunities: true
    },
    {
      level: MembershipLevel.ELITE,
      name: 'Iseix Elite',
      arabicName: 'المستوى النخبة',
      profitRate: `${PROFIT_RATES[MembershipLevel.ELITE].min}% ~ ${PROFIT_RATES[MembershipLevel.ELITE].max}%`,
      directReferralCommission: '10%',
      indirectReferralCommission: '5%',
      dailyTasks: 3,
      prioritySupport: true,
      advancedAnalytics: true,
      vipConsultations: true,
      exclusiveOpportunities: true
    }
  ];
  
  // تحديد المستوى الحالي
  const currentLevelIndex = levels.findIndex(l => l.level === currentLevel);
  
  return (
    <div className="bg-gradient-to-br from-background-light/50 to-background-light/20 p-4 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">مزايا مستوى العضوية</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground-muted/20">
              <th className="py-2 px-3 text-right">الميزة</th>
              {levels.map((level, index) => (
                <th 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">نسبة الربح اليومي</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.profitRate}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">عدد المهام اليومية</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.dailyTasks}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">عمولة الإحالة المباشرة</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.directReferralCommission}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">عمولة الإحالة غير المباشرة</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.indirectReferralCommission}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">دعم ذو أولوية</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.prioritySupport ? (
                    <FaCheck className="inline-block text-success" />
                  ) : (
                    <FaTimes className="inline-block text-foreground-muted" />
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">تحليلات متقدمة</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.advancedAnalytics ? (
                    <FaCheck className="inline-block text-success" />
                  ) : (
                    <FaTimes className="inline-block text-foreground-muted" />
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">استشارات VIP</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.vipConsultations ? (
                    <FaCheck className="inline-block text-success" />
                  ) : (
                    <FaTimes className="inline-block text-foreground-muted" />
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-foreground-muted/10">
              <td className="py-2 px-3">فرص استثمارية حصرية</td>
              {levels.map((level, index) => (
                <td 
                  key={level.level}
                  className={`py-2 px-3 text-center ${
                    index === currentLevelIndex ? 'text-primary font-bold' : ''
                  }`}
                >
                  {level.exclusiveOpportunities ? (
                    <FaCheck className="inline-block text-success" />
                  ) : (
                    <FaTimes className="inline-block text-foreground-muted" />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-block bg-primary/10 text-primary text-sm py-1 px-3 rounded-full">
          <FaStar className="inline-block ml-1" />
          <span>المستوى الحالي: {levels[currentLevelIndex].name}</span>
        </div>
      </div>
    </div>
  );
};

export default MembershipBenefits;
