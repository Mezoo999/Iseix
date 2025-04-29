'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaUserFriends, FaUsers, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface Referral {
  id: string;
  name: string;
  level: number;
  date: Date;
  earnings?: number;
  referrals?: number;
  avatar?: string;
}

interface ReferralNetworkVisualProps {
  referrals: Referral[];
  totalEarnings: number;
}

const ReferralNetworkVisual: React.FC<ReferralNetworkVisualProps> = ({ 
  referrals,
  totalEarnings
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // تصفية الإحالات حسب المستوى
  const level1Referrals = referrals.filter(r => r.level === 1);
  const level2Referrals = referrals.filter(r => r.level === 2);
  const level3Referrals = referrals.filter(r => r.level === 3);
  
  return (
    <div className="bg-gradient-to-br from-background-light/50 to-background-light/20 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">شبكة الإحالات الخاصة بك</h2>
        <button 
          className="text-primary text-sm flex items-center"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <span>عرض أقل</span>
              <FaChevronUp className="mr-1" />
            </>
          ) : (
            <>
              <span>عرض المزيد</span>
              <FaChevronDown className="mr-1" />
            </>
          )}
        </button>
      </div>
      
      {/* إحصائيات الإحالات */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{referrals.length}</div>
          <div className="text-sm text-foreground-muted">إجمالي الإحالات</div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-success">{totalEarnings.toFixed(2)}</div>
          <div className="text-sm text-foreground-muted">USDT مكتسبة</div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-secondary">{level1Referrals.length}</div>
          <div className="text-sm text-foreground-muted">إحالات مباشرة</div>
        </div>
      </div>
      
      {/* العرض المرئي للشبكة */}
      <div className="relative mb-6">
        {/* المستخدم الرئيسي */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
              <FaUser className="text-2xl" />
            </div>
            <div className="absolute -bottom-1 -left-1 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              أنت
            </div>
          </div>
        </div>
        
        {/* خطوط الاتصال للمستوى الأول */}
        <div className="absolute top-16 left-1/2 w-0.5 h-8 bg-primary-light"></div>
        
        {/* المستوى الأول من الإحالات */}
        <div className="flex justify-center flex-wrap mb-8">
          {level1Referrals.length > 0 ? (
            level1Referrals.map((referral, index) => (
              <div key={referral.id} className="mx-2 mb-2">
                <div className="relative">
                  <div className="bg-secondary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md">
                    {referral.avatar ? (
                      <img src={referral.avatar} alt={referral.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <FaUserFriends className="text-lg" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -left-1 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    1
                  </div>
                </div>
                <div className="text-xs text-center mt-1">{referral.name}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-foreground-muted py-2">
              لا توجد إحالات مباشرة بعد
            </div>
          )}
        </div>
        
        {/* خطوط الاتصال للمستوى الثاني */}
        {level1Referrals.length > 0 && level2Referrals.length > 0 && (
          <div className="absolute top-36 left-1/2 w-0.5 h-8 bg-secondary-light"></div>
        )}
        
        {/* المستوى الثاني من الإحالات */}
        {(showDetails || level2Referrals.length > 0) && (
          <div className="flex justify-center flex-wrap mb-8">
            {level2Referrals.length > 0 ? (
              level2Referrals.map((referral, index) => (
                <div key={referral.id} className="mx-1 mb-2">
                  <div className="relative">
                    <div className="bg-info text-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                      <FaUserFriends className="text-sm" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 bg-info text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      2
                    </div>
                  </div>
                  <div className="text-xs text-center mt-1">{referral.name}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-foreground-muted py-2">
                لا توجد إحالات من المستوى الثاني بعد
              </div>
            )}
          </div>
        )}
        
        {/* المستوى الثالث من الإحالات (مخفي افتراضيًا) */}
        {showDetails && (
          <>
            {level2Referrals.length > 0 && level3Referrals.length > 0 && (
              <div className="absolute top-56 left-1/2 w-0.5 h-8 bg-info-light"></div>
            )}
            
            <div className="flex justify-center flex-wrap">
              {level3Referrals.length > 0 ? (
                level3Referrals.map((referral, index) => (
                  <div key={referral.id} className="mx-1 mb-2">
                    <div className="relative">
                      <div className="bg-warning text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                        <FaUsers className="text-xs" />
                      </div>
                      <div className="absolute -bottom-1 -left-1 bg-warning text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        3
                      </div>
                    </div>
                    <div className="text-xs text-center mt-1">{referral.name}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-foreground-muted py-2">
                  لا توجد إحالات من المستوى الثالث بعد
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* معلومات إضافية */}
      {showDetails && (
        <motion.div 
          className="bg-white/10 p-3 rounded-lg text-sm"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-bold mb-2">معلومات عن نظام الإحالات</h3>
          <ul className="space-y-1 list-disc pr-5 text-foreground-muted">
            <li>تحصل على عمولة من جميع الإحالات حتى المستوى الثالث</li>
            <li>كلما زاد عدد الإحالات، ارتفع مستوى عضويتك</li>
            <li>تختلف نسبة العمولة حسب مستوى العضوية الخاص بك</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ReferralNetworkVisual;
