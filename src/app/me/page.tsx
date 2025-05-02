'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUser, FaWallet, FaTasks, FaUsers, FaExchangeAlt, FaCrown, FaSignOutAlt, FaCog, FaBell, FaGift } from 'react-icons/fa';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import SmartNotifications from '@/components/notifications/SmartNotifications';
import { getUserBalanceInfo } from '@/services/userBalance';

export default function MePage() {
  const router = useRouter();
  const { currentUser, userData, loading, logout } = useAuth();
  const [balanceInfo, setBalanceInfo] = useState({
    totalBalance: 0,
    withdrawableBalance: 0,
    nonWithdrawableBalance: 0
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب معلومات الرصيد
  useEffect(() => {
    const fetchBalanceInfo = async () => {
      if (!currentUser) return;

      try {
        setIsLoadingBalance(true);
        const info = await getUserBalanceInfo(currentUser.uid);
        setBalanceInfo(info);
      } catch (error) {
        console.error('Error fetching balance info:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (currentUser) {
      fetchBalanceInfo();
    }
  }, [currentUser]);

  // معالج تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // قائمة الروابط السريعة
  const quickLinks = [
    { name: 'المحفظة', icon: <FaWallet />, href: '/wallet', color: 'bg-primary/10 text-primary' },
    { name: 'المهام اليومية', icon: <FaTasks />, href: '/tasks', color: 'bg-success/10 text-success' },
    { name: 'عجلة الحظ', icon: <FaGift />, href: '/rewards/lucky-wheel', color: 'bg-error/10 text-error' },
    { name: 'الإحالات', icon: <FaUsers />, href: '/referrals', color: 'bg-info/10 text-info' },
    { name: 'المعاملات', icon: <FaExchangeAlt />, href: '/transactions', color: 'bg-warning/10 text-warning' },
    { name: 'العضوية', icon: <FaCrown />, href: '/membership', color: 'bg-secondary/10 text-secondary' },
    { name: 'الإعدادات', icon: <FaCog />, href: '/profile', color: 'bg-foreground-muted/10 text-foreground-muted' },
  ];

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="container mx-auto px-4">
        {/* بطاقة الملف الشخصي */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl ml-4">
                <FaUser />
              </div>
              <div>
                <h1 className="text-xl font-bold">{userData.displayName || 'مستخدم'}</h1>
                <p className="text-foreground-muted text-sm">{userData.email}</p>
                <div className="flex items-center mt-1">
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">
                    {userData.membershipLevel === 0 && 'Iseix Basic'}
                    {userData.membershipLevel === 1 && 'Iseix Silver'}
                    {userData.membershipLevel === 2 && 'Iseix Gold'}
                    {userData.membershipLevel === 3 && 'Iseix Platinum'}
                    {userData.membershipLevel === 4 && 'Iseix Diamond'}
                    {userData.membershipLevel === 5 && 'Iseix Elite'}
                  </span>
                </div>
              </div>
              <div className="mr-auto">
                <SmartNotifications userId={currentUser.uid} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* بطاقة الرصيد */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">الرصيد</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background-light/30 p-4 rounded-lg">
                <p className="text-foreground-muted text-sm">الرصيد الكلي</p>
                <p className="text-2xl font-bold text-primary">{balanceInfo.totalBalance.toFixed(2)} USDT</p>
              </div>
              <div className="bg-background-light/30 p-4 rounded-lg">
                <p className="text-foreground-muted text-sm">الرصيد القابل للسحب</p>
                <p className="text-2xl font-bold text-success">{balanceInfo.withdrawableBalance.toFixed(2)} USDT</p>
              </div>
              <div className="bg-background-light/30 p-4 rounded-lg">
                <p className="text-foreground-muted text-sm">الرصيد غير القابل للسحب</p>
                <p className="text-2xl font-bold text-warning">{balanceInfo.nonWithdrawableBalance.toFixed(2)} USDT</p>
                <p className="text-xs text-foreground-muted mt-1">من المكافآت والهدايا</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                className="btn btn-primary w-full"
                onClick={() => router.push('/wallet/deposit')}
              >
                إيداع
              </button>
              <button
                className="btn btn-outline w-full"
                onClick={() => router.push('/wallet/withdraw')}
              >
                سحب
              </button>
            </div>
          </Card>
        </motion.div>

        {/* الروابط السريعة */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">الروابط السريعة</h2>
            <div className="grid grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <motion.button
                  key={link.name}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg ${link.color}`}
                  onClick={() => router.push(link.href)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <div className="text-2xl mb-2">{link.icon}</div>
                  <span className="text-xs text-center">{link.name}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* زر تسجيل الخروج */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            className="btn btn-error w-full flex items-center justify-center"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="ml-2" />
            تسجيل الخروج
          </button>
        </motion.div>
      </div>
    </main>
  );
}
