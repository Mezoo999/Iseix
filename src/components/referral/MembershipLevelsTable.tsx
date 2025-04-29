'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaPercentage, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import { MEMBERSHIP_REFERRAL_REQUIREMENTS, REFERRAL_COMMISSION_RATES } from '@/services/referral';
import { useAuth } from '@/contexts/AuthContext';

interface MembershipLevelsTableProps {
  className?: string;
}

export default function MembershipLevelsTable({ className = '' }: MembershipLevelsTableProps) {
  const { userData } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  const currentLevel = userData?.membershipLevel as MembershipLevel || MembershipLevel.BASIC;

  // التأكد من أن userData متاح
  if (!userData) {
    return (
      <div className={`card card-primary p-4 ${className}`}>
        <div className="flex justify-center py-6">
          <div className="text-foreground-muted">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  // إنشاء مصفوفة المستويات
  const levels = [
    MembershipLevel.BASIC,
    MembershipLevel.SILVER,
    MembershipLevel.GOLD,
    MembershipLevel.PLATINUM,
    MembershipLevel.DIAMOND,
    MembershipLevel.ELITE
  ];

  return (
    <div className={`card card-primary p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold">مستويات العضوية</h3>
            <p className="text-sm text-foreground-muted">متطلبات ومزايا كل مستوى</p>
          </div>
        </div>

        <button
          className="text-primary p-2 rounded-full hover:bg-primary/10"
          onClick={() => setShowInfo(!showInfo)}
        >
          <FaInfoCircle />
        </button>
      </div>

      {showInfo && (
        <motion.div
          className="bg-info/10 border border-info/30 text-info p-3 rounded-lg mb-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center mb-2">
            <FaInfoCircle className="ml-2 flex-shrink-0" />
            <p className="font-bold">كيف يعمل نظام مستويات العضوية؟</p>
          </div>
          <ul className="text-sm space-y-1 pr-5 list-disc">
            <li>يتم ترقية مستوى العضوية تلقائيًا بناءً على عدد المروجين النشطين</li>
            <li>كلما ارتفع مستوى العضوية، زادت معدلات العمولة التي تحصل عليها</li>
            <li>المروج النشط هو الشخص الذي قمت بدعوته وقام بإيداع مبلغ في حسابه</li>
          </ul>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background-light/50">
            <tr>
              <th className="py-2 px-3 text-right">المستوى</th>
              <th className="py-2 px-3 text-center">المروجين</th>
              <th className="py-2 px-3 text-center">المستوى 1</th>
              <th className="py-2 px-3 text-center">المستوى 2</th>
              <th className="py-2 px-3 text-center">المستوى 3</th>
              <th className="py-2 px-3 text-center">المستوى 4</th>
              <th className="py-2 px-3 text-center">المستوى 5</th>
              <th className="py-2 px-3 text-center">المستوى 6</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const isCurrentLevel = level === currentLevel;
              const rates = REFERRAL_COMMISSION_RATES[level];

              return (
                <tr
                  key={level}
                  className={`border-b border-background-lighter ${isCurrentLevel ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      {isCurrentLevel && <FaCheck className="text-success ml-1" />}
                      <span className={isCurrentLevel ? 'font-bold' : ''}>
                        {MEMBERSHIP_LEVEL_NAMES[level]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {MEMBERSHIP_REFERRAL_REQUIREMENTS[level]}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-success">
                    {(rates.LEVEL_1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rates.LEVEL_2 > 0 ? (
                      <span className="font-bold text-primary">{(rates.LEVEL_2 * 100).toFixed(1)}%</span>
                    ) : (
                      <FaTimes className="mx-auto text-foreground-muted" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rates.LEVEL_3 > 0 ? (
                      <span className="font-bold text-info">{(rates.LEVEL_3 * 100).toFixed(1)}%</span>
                    ) : (
                      <FaTimes className="mx-auto text-foreground-muted" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rates.LEVEL_4 > 0 ? (
                      <span className="font-bold text-warning">{(rates.LEVEL_4 * 100).toFixed(1)}%</span>
                    ) : (
                      <FaTimes className="mx-auto text-foreground-muted" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rates.LEVEL_5 > 0 ? (
                      <span className="font-bold text-error">{(rates.LEVEL_5 * 100).toFixed(1)}%</span>
                    ) : (
                      <FaTimes className="mx-auto text-foreground-muted" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rates.LEVEL_6 > 0 ? (
                      <span className="font-bold text-purple-500">{(rates.LEVEL_6 * 100).toFixed(1)}%</span>
                    ) : (
                      <FaTimes className="mx-auto text-foreground-muted" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-foreground-muted">
        <p className="flex items-center">
          <FaPercentage className="ml-1 text-primary" />
          النسب المئوية تمثل معدلات العمولة التي تحصل عليها من إيداعات وأرباح الأشخاص الذين قمت بدعوتهم
        </p>
      </div>
    </div>
  );
}
