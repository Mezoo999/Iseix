'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaWallet, FaChartLine, FaUsers, FaMoneyBillWave, FaTasks,
  FaExchangeAlt, FaCrown, FaUserCircle, FaInfoCircle
} from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import AutoCompoundInterest from '@/components/investment/AutoCompoundInterest';
import DailyTasksCard from '@/components/tasks/DailyTasksCard';
import ReferralStatsCard from '@/components/referral/ReferralStatsCard';
import StatCard from '@/components/dashboard/StatCard';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { FadeInView } from '@/components/ui/AnimatedElements';
import ActionButton from '@/components/ui/ActionButton';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  return (
    <AlertProvider>
      <PageTemplate
        title={`مرحبًا، ${userData.displayName}`}
        description="هذه هي لوحة التحكم الخاصة بك. يمكنك إدارة حسابك ومتابعة أرباحك من هنا."
        icon={<FaUserCircle className="text-white text-xl" />}
      >
        {/* روابط سريعة */}
        <Card className="mb-6" delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionButton
              variant="primary"
              onClick={() => router.push('/wallet')}
              icon={<FaWallet />}
              className="w-full"
            >
              المحفظة
            </ActionButton>

            <ActionButton
              variant="secondary"
              onClick={() => router.push('/tasks')}
              icon={<FaTasks />}
              className="w-full"
            >
              المهام
            </ActionButton>

            <ActionButton
              variant="success"
              onClick={() => router.push('/membership')}
              icon={<FaCrown />}
              className="w-full"
            >
              العضوية
            </ActionButton>

            <ActionButton
              variant="warning"
              onClick={() => router.push('/transactions')}
              icon={<FaExchangeAlt />}
              className="w-full"
            >
              المعاملات
            </ActionButton>
          </div>
        </Card>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FadeInView direction="up" delay={0.2}>
            <StatCard
              title="إجمالي الأرباح"
              value={userData?.totalProfit || 0}
              change={12.5}
              type="profit"
            />
          </FadeInView>

          <FadeInView direction="up" delay={0.25}>
            <StatCard
              title="إجمالي الاستثمارات"
              value={userData?.totalInvested || 0}
              change={8.3}
              type="investment"
            />
          </FadeInView>

          <FadeInView direction="up" delay={0.3}>
            <StatCard
              title="إجمالي الإيداعات"
              value={userData?.totalDeposited || 0}
              change={5.7}
              type="deposit"
            />
          </FadeInView>

          <FadeInView direction="up" delay={0.35}>
            <StatCard
              title="إجمالي السحوبات"
              value={userData?.totalWithdrawn || 0}
              change={-2.1}
              type="withdrawal"
            />
          </FadeInView>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* المهام اليومية */}
          <FadeInView direction="up" delay={0.4}>
            <Card
              title="المهام اليومية"
              icon={<FaTasks className="text-primary" />}
              className="h-full"
            >
              <DailyTasksCard />

              <div className="mt-4 text-center">
                <ActionButton
                  variant="primary"
                  onClick={() => router.push('/tasks')}
                  size="sm"
                >
                  عرض جميع المهام
                </ActionButton>
              </div>
            </Card>
          </FadeInView>

          {/* نظام الإحالات */}
          <FadeInView direction="up" delay={0.45}>
            <Card
              title="نظام الإحالات"
              icon={<FaUsers className="text-primary" />}
              className="h-full"
            >
              <ReferralStatsCard />

              <div className="mt-4 text-center">
                <ActionButton
                  variant="primary"
                  onClick={() => router.push('/referrals')}
                  size="sm"
                >
                  عرض الإحالات
                </ActionButton>
              </div>
            </Card>
          </FadeInView>
        </div>

        {/* الفائدة المركبة التلقائية */}
        <FadeInView direction="up" delay={0.5}>
          <Card
            title="الفائدة المركبة التلقائية"
            icon={<FaChartLine className="text-primary" />}
            className="mb-8"
          >
            <AutoCompoundInterest />
          </Card>
        </FadeInView>

        {/* الاستثمارات النشطة */}
        <FadeInView direction="up" delay={0.55}>
          <Card
            title="الاستثمارات النشطة"
            icon={<FaChartLine className="text-primary" />}
            description="استثماراتك الحالية وأرباحها"
            className="mb-8"
          >
            {(userData.totalInvested || 0) > 0 ? (
              <div>
                {/* هنا سيتم عرض الاستثمارات النشطة */}
                <p>قريبًا...</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-background-light/50 rounded-lg border border-background-lighter">
                <FaChartLine className="text-4xl mx-auto mb-4 text-foreground-muted opacity-50" />
                <p className="text-foreground-muted font-medium mb-4">ليس لديك استثمارات نشطة حاليًا</p>
                <ActionButton
                  variant="primary"
                  onClick={() => router.push('/wallet')}
                  icon={<FaWallet />}
                >
                  قم بإيداع مبلغ للبدء
                </ActionButton>
              </div>
            )}
          </Card>
        </FadeInView>

        {/* آخر المعاملات */}
        <FadeInView direction="up" delay={0.6}>
          <Card
            title="آخر المعاملات"
            icon={<FaExchangeAlt className="text-primary" />}
            description="سجل معاملاتك الأخيرة"
          >
            <div className="text-center py-8 bg-background-light/50 rounded-lg border border-background-lighter">
              <FaExchangeAlt className="text-4xl mx-auto mb-4 text-foreground-muted opacity-50" />
              <p className="text-foreground-muted font-medium mb-4">لا توجد معاملات حديثة</p>
              <ActionButton
                variant="primary"
                onClick={() => router.push('/transactions')}
                icon={<FaExchangeAlt />}
              >
                عرض جميع المعاملات
              </ActionButton>
            </div>
          </Card>
        </FadeInView>

        {/* معلومات العضوية */}
        <FadeInView direction="up" delay={0.65}>
          <Card
            title="مستوى العضوية"
            icon={<FaCrown className="text-primary" />}
            className="mt-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between bg-background-light/50 p-4 rounded-lg">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
                  <FaCrown className="text-xl" />
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">المستوى الحالي</p>
                  <h2 className="text-lg font-bold">
                    {userData.membershipLevel === 0 && 'Iseix Basic'}
                    {userData.membershipLevel === 1 && 'Iseix Silver'}
                    {userData.membershipLevel === 2 && 'Iseix Gold'}
                    {userData.membershipLevel === 3 && 'Iseix Platinum'}
                    {userData.membershipLevel === 4 && 'Iseix Diamond'}
                    {userData.membershipLevel === 5 && 'Iseix Elite'}
                  </h2>
                </div>
              </div>

              <ActionButton
                variant="primary"
                onClick={() => router.push('/membership')}
                icon={<FaCrown />}
              >
                عرض تفاصيل العضوية
              </ActionButton>
            </div>
          </Card>
        </FadeInView>
      </PageTemplate>
    </AlertProvider>
  );
}
