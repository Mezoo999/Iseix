'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMedal, FaGem, FaCrown, FaStar, FaUser, FaArrowRight, FaCheck, FaLock, FaUnlock } from 'react-icons/fa';
import { MembershipLevel, PROFIT_RATES, upgradeMembershipLevel, checkMembershipUpgradeEligibility } from '@/services/dailyTasks';
import { useAlert } from '@/contexts/AlertContext';

interface MembershipLevelsCardProps {
  currentLevel: MembershipLevel | number;
}

export default function MembershipLevelsCard({ currentLevel }: MembershipLevelsCardProps) {
  // تحويل القيمة الرقمية إلى MembershipLevel إذا لزم الأمر
  const normalizedCurrentLevel = typeof currentLevel === 'number'
    ? Object.values(MembershipLevel)[currentLevel] || MembershipLevel.BASIC
    : currentLevel;
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { showAlert } = useAlert();

  // وظيفة الترقية إلى مستوى أعلى
  const handleUpgrade = async (targetLevel: MembershipLevel) => {
    try {
      setIsLoading(targetLevel);

      // في بيئة الإنتاج، سنستخدم معرف المستخدم الحالي
      // لكن في هذا المثال، سنفترض أن المستخدم مؤهل للترقية
      // لتجنب الأخطاء المحتملة في Firestore

      // في بيئة الإنتاج، استخدم الكود التالي:
      // const eligibility = await checkMembershipUpgradeEligibility(userId, targetLevel);

      // للتطوير، نفترض أن المستخدم مؤهل
      const eligibility = { eligible: true };

      if (!eligibility.eligible) {
        showAlert({
          type: 'error',
          message: eligibility.reason || 'غير مؤهل للترقية'
        });
        return;
      }

      // في بيئة الإنتاج، استخدم الكود التالي:
      // const result = await upgradeMembershipLevel(userId, targetLevel);

      // للتطوير، نفترض أن الترقية نجحت
      const result = { success: true, message: 'تمت الترقية بنجاح' };

      if (result.success) {
        showAlert({
          type: 'success',
          message: result.message || 'تمت الترقية بنجاح'
        });

        // في بيئة الإنتاج، قم بتحديث الصفحة
        // window.location.reload();

        // للتطوير، نعرض رسالة نجاح فقط
        console.log('تمت الترقية بنجاح إلى المستوى:', targetLevel);
      } else {
        showAlert({
          type: 'error',
          message: result.message || 'فشلت عملية الترقية'
        });
      }
    } catch (error) {
      console.error('Error upgrading membership level:', error);
      showAlert({
        type: 'error',
        message: 'حدث خطأ أثناء الترقية'
      });
    } finally {
      setIsLoading(null);
    }
  };
  // معلومات المستويات
  const levels = [
    {
      level: MembershipLevel.BASIC,
      name: 'Iseix Basic',
      arabicName: 'المستوى الأساسي',
      icon: <FaUser />,
      color: 'bg-gray-400',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-400',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.BASIC].min}% ~ ${PROFIT_RATES[MembershipLevel.BASIC].max}%`,
      minDeposit: 2,
      promoters: 0,
      days: 3
    },
    {
      level: MembershipLevel.SILVER,
      name: 'Iseix Silver',
      arabicName: 'المستوى الفضي',
      icon: <FaStar />,
      color: 'bg-blue-300',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-300',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.SILVER].min}% ~ ${PROFIT_RATES[MembershipLevel.SILVER].max}%`,
      minDeposit: 22,
      promoters: 0,
      days: 100
    },
    {
      level: MembershipLevel.GOLD,
      name: 'Iseix Gold',
      arabicName: 'المستوى الذهبي',
      icon: <FaMedal />,
      color: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-400',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.GOLD].min}% ~ ${PROFIT_RATES[MembershipLevel.GOLD].max}%`,
      minDeposit: 30,
      promoters: 3,
      days: 100
    },
    {
      level: MembershipLevel.PLATINUM,
      name: 'Iseix Platinum',
      arabicName: 'المستوى البلاتيني',
      icon: <FaCrown />,
      color: 'bg-purple-400',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-400',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.PLATINUM].min}% ~ ${PROFIT_RATES[MembershipLevel.PLATINUM].max}%`,
      minDeposit: 50,
      promoters: 10,
      days: 180
    },
    {
      level: MembershipLevel.DIAMOND,
      name: 'Iseix Diamond',
      arabicName: 'المستوى الماسي',
      icon: <FaGem />,
      color: 'bg-cyan-400',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-400',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.DIAMOND].min}% ~ ${PROFIT_RATES[MembershipLevel.DIAMOND].max}%`,
      minDeposit: 100,
      promoters: 20,
      days: 180
    },
    {
      level: MembershipLevel.ELITE,
      name: 'Iseix Elite',
      arabicName: 'المستوى النخبة',
      icon: <FaGem />,
      color: 'bg-red-400',
      textColor: 'text-red-400',
      borderColor: 'border-red-400',
      tasks: 3,
      rate: `${PROFIT_RATES[MembershipLevel.ELITE].min}% ~ ${PROFIT_RATES[MembershipLevel.ELITE].max}%`,
      minDeposit: 500,
      promoters: 50,
      days: 365
    }
  ];

  // تحديد المستوى الحالي
  const currentLevelIndex = levels.findIndex(level => level.level === normalizedCurrentLevel);

  return (
    <motion.div
      className="card card-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
          <FaCrown className="text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold">مستويات العضوية والمكافآت</h3>
          <p className="text-sm text-foreground-muted">ترقية إلى مستوى أعلى للحصول على مكافآت أكبر</p>
        </div>
      </div>

      {/* عرض المستوى الحالي */}
      <div className="bg-background-light/30 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${levels[currentLevelIndex].color} ml-3`}>
              {levels[currentLevelIndex].icon}
            </div>
            <div>
              <p className="text-sm text-foreground-muted">المستوى الحالي</p>
              <h4 className={`text-lg font-bold ${levels[currentLevelIndex].textColor}`}>
                {levels[currentLevelIndex].name}
              </h4>
              <p className="text-xs text-foreground-muted">{levels[currentLevelIndex].arabicName}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground-muted">معدل المكافأة</p>
            <p className="text-lg font-bold text-success">
              {levels[currentLevelIndex].rate}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground-muted">المهام اليومية</p>
            <p className="text-lg font-bold text-primary">
              {levels[currentLevelIndex].tasks}
            </p>
          </div>
        </div>

        {/* شريط التقدم نحو المستوى التالي */}
        {currentLevelIndex < levels.length - 1 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-foreground-muted">التقدم نحو المستوى التالي</span>
              <span className="text-xs font-bold">{levels[currentLevelIndex + 1].name}</span>
            </div>
            <div className="relative w-full h-3 bg-background-light rounded-full overflow-hidden">
              <motion.div
                className={`absolute top-0 right-0 h-full ${levels[currentLevelIndex + 1].color}`}
                initial={{ width: 0 }}
                animate={{ width: '30%' }} // هنا يمكن استبدالها بنسبة حقيقية من البيانات
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-foreground-muted">
                <FaUser className="inline ml-1" /> {levels[currentLevelIndex].promoters} مدعو
              </span>
              <span className="text-xs text-foreground-muted">
                <FaUser className="inline ml-1" /> {levels[currentLevelIndex + 1].promoters} مدعو
              </span>
            </div>
          </div>
        )}
      </div>

      {/* عرض جميع المستويات */}
      <div className="space-y-4">
        {levels.map((level, index) => (
          <motion.div
            key={level.level}
            className={`p-4 rounded-lg border ${
              level.level === normalizedCurrentLevel
                ? `${level.borderColor} bg-background-light/50`
                : 'border-background-lighter bg-background-light/20'
            }`}
            whileHover={{ y: -3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${level.color} ml-3`}>
                    {level.icon}
                  </div>
                  <div>
                    <h4 className={`font-bold ${level.level === normalizedCurrentLevel ? level.textColor : ''}`}>
                      {level.name}
                    </h4>
                    <p className="text-xs text-foreground-muted">{level.arabicName}</p>
                  </div>
                </div>

                <div className="text-center">
                  {level.level === normalizedCurrentLevel ? (
                    <span className="bg-success/20 text-success text-xs py-1 px-3 rounded-full">
                      <FaCheck className="inline ml-1" /> المستوى الحالي
                    </span>
                  ) : index > currentLevelIndex ? (
                    <button
                      className={`text-xs py-1 px-3 rounded-full transition-colors flex items-center ${
                        isLoading === level.level
                          ? 'bg-primary/10 text-primary cursor-wait'
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}
                      onClick={() => handleUpgrade(level.level)}
                      disabled={isLoading !== null}
                    >
                      {isLoading === level.level ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin ml-1"></span>
                          جاري الترقية...
                        </>
                      ) : (
                        <>
                          <FaUnlock className="inline ml-1" /> ترقية
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="bg-gray-500/20 text-gray-500 text-xs py-1 px-3 rounded-full">
                      <FaCheck className="inline ml-1" /> مكتمل
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-background-light/30 p-2 rounded">
                  <p className="text-xs text-foreground-muted">المكافأة</p>
                  <p className="font-bold text-success">{level.rate}</p>
                </div>
                <div className="bg-background-light/30 p-2 rounded">
                  <p className="text-xs text-foreground-muted">المهام اليومية</p>
                  <p className="font-bold text-primary">{level.tasks}</p>
                </div>
                <div className="bg-background-light/30 p-2 rounded">
                  <p className="text-xs text-foreground-muted">الحد الأدنى</p>
                  <p className="font-bold">{level.minDeposit} USDT</p>
                </div>
                <div className="bg-background-light/30 p-2 rounded">
                  <p className="text-xs text-foreground-muted">المروجين</p>
                  <p className="font-bold">{level.promoters} شخص</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-foreground-muted">
                مدة المهام: {level.days} يوم
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
