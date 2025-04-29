'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserPlus, FaCoins, FaLink, FaShareAlt, FaTwitter, FaFacebook, FaTelegram, FaWhatsapp, FaCopy, FaPercentage } from 'react-icons/fa';
import { getUserReferralCode, getUserReferralStats, getReferralRatesForLevel } from '@/services/referral';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { CircleLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';
import { MembershipLevel } from '@/services/dailyTasks';

interface ReferralStatsCardProps {
  className?: string;
}

export default function ReferralStatsCard({ className = '' }: ReferralStatsCardProps) {
  const { currentUser, userData } = useAuth();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState<any>(null);
  const [referralLink, setReferralLink] = useState('');
  const [referralRates, setReferralRates] = useState<{level1Rate: string, level2Rate: string, level3Rate: string}>({
    level1Rate: '0%',
    level2Rate: '0%',
    level3Rate: '0%'
  });

  // تحميل بيانات الإحالة
  const loadReferralData = async () => {
    if (!currentUser || !userData) return;

    setIsLoading(true);
    try {
      // الحصول على رمز الإحالة
      const code = await getUserReferralCode(currentUser.uid);
      setReferralCode(code);

      // إنشاء رابط الإحالة
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setReferralLink(`${baseUrl}/register?ref=${code}`);

      try {
        // الحصول على إحصائيات الإحالة
        const stats = await getUserReferralStats(currentUser.uid);
        setReferralStats(stats);
      } catch (statsError) {
        console.error('Error loading referral stats:', statsError);
        // إنشاء إحصائيات افتراضية في حالة الخطأ
        setReferralStats({
          totalReferrals: 0,
          activeReferrals: 0,
          pendingReferrals: 0,
          totalCommission: 0,
          currency: 'USDT',
          level1Referrals: 0,
          level2Referrals: 0,
          level3Referrals: 0,
          level4Referrals: 0,
          level5Referrals: 0,
          level6Referrals: 0
        });
      }

      // الحصول على معدلات العمولة بناءً على مستوى العضوية
      try {
        const membershipLevel = userData?.membershipLevel as MembershipLevel || MembershipLevel.BASIC;
        const rates = getReferralRatesForLevel(membershipLevel);
        setReferralRates(rates);
      } catch (ratesError) {
        console.error('Error loading referral rates:', ratesError);
        // استخدام معدلات افتراضية في حالة الخطأ
        setReferralRates({
          level1Rate: '3.0%',
          level2Rate: '0.0%',
          level3Rate: '0.0%'
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      showAlert('error', 'حدث خطأ أثناء تحميل بيانات الإحالة');
    } finally {
      setIsLoading(false);
    }
  };

  // نسخ رابط الإحالة
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        showAlert('success', 'تم نسخ رابط الإحالة بنجاح');
      })
      .catch(() => {
        showAlert('error', 'فشل نسخ رابط الإحالة');
      });
  };

  // مشاركة رابط الإحالة
  const shareReferralLink = (platform: 'twitter' | 'facebook' | 'telegram' | 'whatsapp') => {
    const text = `انضم إلى منصة Iseix واحصل على مكافآت مجانية! استخدم رمز الإحالة الخاص بي: ${referralCode}`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    if (currentUser && userData) {
      loadReferralData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userData]);

  if (isLoading) {
    return (
      <div className={`card card-primary ${className}`}>
        <div className="flex justify-center py-8">
          <CircleLoader color="primary" size="md" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`card card-primary ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold">برنامج الإحالة</h3>
            <p className="text-sm text-foreground-muted">ادعُ أصدقاءك واكسب عمولات</p>
          </div>
        </div>
      </div>

      {/* رمز الإحالة */}
      <div className="mb-6">
        <label className="form-label mb-2 block">رمز الإحالة الخاص بك</label>
        <div className="flex">
          <div className="flex-1 form-input rounded-r-lg font-mono text-center text-lg font-bold">
            {referralCode}
          </div>
          <button
            className="bg-primary text-foreground-inverted p-3 rounded-l-lg hover:bg-primary-dark transition-colors"
            onClick={copyReferralLink}
          >
            <FaCopy />
          </button>
        </div>
        <p className="text-xs text-foreground-muted mt-2 text-center">
          هذا هو رمز الإحالة الخاص بك. شاركه مع أصدقائك ليستخدموه عند التسجيل
        </p>
      </div>



      {/* إحصائيات الإحالة */}
      {referralStats && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <motion.div
            className="p-4 bg-background-light/30 rounded-lg border border-primary/10"
            whileHover={{ y: -3, boxShadow: '0 5px 10px -2px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-primary/20 ml-2">
                <FaUserPlus className="text-primary" />
              </div>
              <span className="text-foreground-muted text-sm">إجمالي الإحالات</span>
            </div>
            <div className="text-xl font-bold">{referralStats.totalReferrals}</div>
          </motion.div>

          <motion.div
            className="p-4 bg-background-light/30 rounded-lg border border-success/10"
            whileHover={{ y: -3, boxShadow: '0 5px 10px -2px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-success/20 ml-2">
                <FaCoins className="text-success" />
              </div>
              <span className="text-foreground-muted text-sm">إجمالي العمولات</span>
            </div>
            <div className="text-xl font-bold">{referralStats.totalCommission.toFixed(2)} {referralStats.currency}</div>
          </motion.div>
        </div>
      )}

      {/* أزرار المشاركة */}
      <div>
        <button
          className="btn btn-primary w-full flex items-center justify-center"
          onClick={copyReferralLink}
        >
          <FaShareAlt className="ml-2" />
          نسخ رابط الإحالة
        </button>
      </div>
    </motion.div>
  );
}
