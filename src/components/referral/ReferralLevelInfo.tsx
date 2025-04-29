'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaChartLine, FaArrowUp, FaInfoCircle } from 'react-icons/fa';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import {
  getActivePromotersCount,
  getReferralRatesForLevel,
  getNextLevelRequirements,
  MEMBERSHIP_REFERRAL_REQUIREMENTS
} from '@/services/referral';
import { useAuth } from '@/contexts/AuthContext';
import { CircleLoader } from '@/components/ui/Loaders';

interface ReferralLevelInfoProps {
  className?: string;
}

export default function ReferralLevelInfo({ className = '' }: ReferralLevelInfoProps) {
  const { currentUser, userData } = useAuth();
  const [activePromoters, setActivePromoters] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const count = await getActivePromotersCount(currentUser.uid);
        setActivePromoters(count);
      } catch (error) {
        console.error('Error loading active promoters count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className={`card card-primary p-4 ${className}`}>
        <div className="flex justify-center py-6">
          <CircleLoader color="primary" size="md" />
        </div>
      </div>
    );
  }

  if (!userData || activePromoters === null) {
    return null;
  }

  const currentLevel = userData.membershipLevel as MembershipLevel || MembershipLevel.BASIC;
  const nextLevelInfo = getNextLevelRequirements(currentLevel);
  const referralRates = getReferralRatesForLevel(currentLevel);

  // حساب نسبة الإكمال للمستوى التالي
  const currentLevelRequirement = MEMBERSHIP_REFERRAL_REQUIREMENTS[currentLevel];
  const nextLevelRequirement = nextLevelInfo ? nextLevelInfo.requiredPromoters : Infinity;
  const progressPercentage = nextLevelInfo
    ? Math.min(100, (activePromoters - currentLevelRequirement) / (nextLevelInfo.requiredPromoters - currentLevelRequirement) * 100)
    : 100;

  return (
    <div className={`card card-primary p-4 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
          <FaUsers className="text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold">مستوى الإحالات</h3>
          <p className="text-sm text-foreground-muted">مستوى عضويتك ومعدلات العمولة</p>
        </div>
      </div>

      <div className="bg-background-light/30 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground-muted">المستوى الحالي:</span>
          <span className="font-bold text-primary">{MEMBERSHIP_LEVEL_NAMES[currentLevel]}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground-muted">المروجين النشطين:</span>
          <span className="font-bold">{activePromoters} شخص</span>
        </div>

        {nextLevelInfo && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground-muted">المستوى التالي:</span>
              <span className="font-bold text-success">{MEMBERSHIP_LEVEL_NAMES[nextLevelInfo.nextLevel]}</span>
            </div>

            <div className="flex justify-between items-center text-xs mb-1">
              <span>المطلوب: {nextLevelInfo.requiredPromoters} مروج</span>
              <span>المتبقي: {Math.max(0, nextLevelInfo.requiredPromoters - activePromoters)} مروج</span>
            </div>

            <div className="w-full bg-background-light/50 rounded-full h-2 mb-3">
              <motion.div
                className="bg-success h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </>
        )}
      </div>

      <div className="bg-background-light/30 p-4 rounded-lg mb-4">
        <h4 className="font-bold mb-3 flex items-center">
          <FaChartLine className="ml-2" />
          معدلات العمولة الحالية
        </h4>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 1</p>
            <p className="font-bold text-success">{referralRates.level1Rate}</p>
          </div>

          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 2</p>
            <p className="font-bold text-primary">{referralRates.level2Rate}</p>
          </div>

          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 3</p>
            <p className="font-bold text-info">{referralRates.level3Rate}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 4</p>
            <p className="font-bold text-warning">{referralRates.level4Rate}</p>
          </div>

          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 5</p>
            <p className="font-bold text-error">{referralRates.level5Rate}</p>
          </div>

          <div className="bg-background-light/50 p-2 rounded text-center">
            <p className="text-xs text-foreground-muted mb-1">المستوى 6</p>
            <p className="font-bold text-purple-500">{referralRates.level6Rate}</p>
          </div>
        </div>

        {nextLevelInfo && (
          <div className="text-xs text-foreground-muted flex items-center mt-2">
            <FaInfoCircle className="ml-1" />
            <span>قم بترقية مستواك للحصول على معدلات عمولة أعلى</span>
          </div>
        )}
      </div>

      <div className="text-center text-sm">
        <p className="text-foreground-muted mb-2">يتم تحديث مستوى العضوية تلقائيًا بناءً على عدد المروجين النشطين</p>
        <p className="text-primary font-bold">
          <FaArrowUp className="inline ml-1" />
          قم بدعوة المزيد من الأصدقاء للترقية إلى مستوى أعلى
        </p>
      </div>
    </div>
  );
}
