'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTasks, FaChartLine, FaInfoCircle, FaTrophy, FaClock, FaCoins, FaPercentage } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import DailyTasksCard from '@/components/tasks/DailyTasksCard';
import MembershipLevelsCard from '@/components/tasks/MembershipLevelsCard';
import TaskRewardsHistory from '@/components/tasks/TaskRewardsHistory';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { getUserTaskRewards, MembershipLevel, PROFIT_RATES, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import { FadeInView } from '@/components/ui/AnimatedElements';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Header from '@/components/ui/Header';
import StatsGrid from '@/components/ui/StatsGrid';
import InfoCard from '@/components/ui/InfoCard';

export default function TasksPage() {
  return (
    <AlertProvider>
      <TasksContent />
    </AlertProvider>
  );
}

function TasksContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();

  const [taskRewards, setTaskRewards] = useState<any[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب سجل مكافآت المهام
  useEffect(() => {
    const loadTaskRewards = async () => {
      if (!currentUser) return;

      setIsLoadingRewards(true);
      try {
        const rewards = await getUserTaskRewards(currentUser.uid);
        setTaskRewards(rewards);
      } catch (err) {
        console.error('Error loading task rewards:', err);
        showAlert('error', 'حدث خطأ أثناء تحميل سجل المكافآت');
      } finally {
        setIsLoadingRewards(false);
      }
    };

    if (currentUser) {
      loadTaskRewards();
    }
  }, [currentUser, showAlert]);

  // حساب إجمالي المكافآت
  const calculateTotalRewards = () => {
    return taskRewards.reduce((total, reward) => total + reward.amount, 0);
  };

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  // تحديد درجة العضوية ومعدل الربح
  const membershipLevel = userData.membershipLevel || MembershipLevel.BASIC;

  // التعامل مع القيم الرقمية والنصية
  let profitRateRange;
  if (typeof membershipLevel === 'number') {
    profitRateRange = PROFIT_RATES[membershipLevel] || { min: 2.76, max: 2.84 };
  } else {
    profitRateRange = PROFIT_RATES[membershipLevel as MembershipLevel] || { min: 2.76, max: 2.84 };
  }

  const profitRateDisplay = `${profitRateRange.min}% ~ ${profitRateRange.max}%`;

  // تحضير إحصائيات الرأس
  const headerStats = [
    {
      label: 'المهام المكتملة',
      value: taskRewards.length,
      icon: <FaTasks className="text-primary" />,
      color: 'primary'
    },
    {
      label: 'إجمالي المكافآت',
      value: `${calculateTotalRewards().toFixed(2)} USDT`,
      icon: <FaCoins className="text-success" />,
      color: 'success'
    },
    {
      label: 'معدل الربح',
      value: profitRateDisplay,
      icon: <FaPercentage className="text-info" />,
      color: 'info'
    },
    {
      label: 'مستوى العضوية',
      value: MEMBERSHIP_LEVEL_NAMES[membershipLevel],
      icon: <FaTrophy className="text-secondary" />,
      color: 'secondary'
    }
  ];

  // نص المعلومات
  const infoText = "يمكنك إكمال 3 مهام يوميًا للحصول على مكافآت إضافية. يتم إعادة تعيين المهام تلقائيًا كل 24 ساعة. معدل الربح يختلف حسب مستوى العضوية الخاص بك.";

  return (
    <PageTemplate>
      {/* رأس الصفحة الثابت */}
      <Header
        title="المهام اليومية"
        subtitle="أكمل المهام للحصول على مكافآت يومية"
        icon={<FaTasks className="text-xl" />}
        infoText={infoText}
        stats={headerStats}
      />

      {/* رأس الصفحة الرئيسي */}
      <PageHeader
        title="المهام اليومية"
        subtitle="أكمل المهام اليومية للحصول على مكافآت إضافية وزيادة أرباحك"
        icon={<FaTasks className="text-2xl" />}
        infoText={infoText}
      />

      {/* إحصائيات المهام */}
      <StatsGrid stats={headerStats} columns={4} variant="glass" />

      {/* المهام اليومية */}
      <div className="mb-8">
        <FadeInView direction="up" delay={0.3}>
          <DailyTasksCard />
        </FadeInView>
      </div>

      {/* معلومات إعادة تعيين المهام */}
      <InfoCard
        title="إعادة تعيين المهام"
        icon={<FaClock />}
        variant="primary"
        expandable={true}
        defaultExpanded={false}
      >
        <p className="mb-4">يتم إعادة تعيين المهام اليومية عند منتصف الليل لتتمكن من الحصول على مكافآت جديدة كل يوم.</p>

        <div className="bg-background-dark/50 p-4 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center ml-2">
                <FaTasks className="text-primary text-sm" />
              </div>
              <span>المهام المكتملة اليوم:</span>
            </div>
            <span className="font-bold bg-primary/10 px-2 py-1 rounded-lg">{taskRewards.filter(r => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const rewardDate = r.timestamp?.toDate ? new Date(r.timestamp.toDate()) : new Date(r.timestamp);
              rewardDate.setHours(0, 0, 0, 0);
              return rewardDate.getTime() === today.getTime();
            }).length} من 3</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center ml-2">
                <FaCoins className="text-success text-sm" />
              </div>
              <span>المهام المتاحة:</span>
            </div>
            <span className="font-bold bg-success/10 px-2 py-1 rounded-lg text-success">{Math.max(0, 3 - taskRewards.filter(r => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const rewardDate = r.timestamp?.toDate ? new Date(r.timestamp.toDate()) : new Date(r.timestamp);
              rewardDate.setHours(0, 0, 0, 0);
              return rewardDate.getTime() === today.getTime();
            }).length)}</span>
          </div>
        </div>
      </InfoCard>

      {/* سجل المكافآت */}
      <div className="mb-8">
        <FadeInView direction="up" delay={0.5}>
          <TaskRewardsHistory
            rewards={taskRewards.map(reward => ({
              id: reward.id,
              amount: reward.amount,
              currency: reward.currency || 'USDT',
              timestamp: reward.timestamp?.toDate ? new Date(reward.timestamp.toDate()) : new Date(reward.timestamp),
              taskTitle: 'مكافأة مهمة يومية',
              profitRate: reward.profitRate
            }))}
            isLoading={isLoadingRewards}
          />
        </FadeInView>
      </div>

      {/* مستويات العضوية */}
      <div className="mb-8">
        <FadeInView direction="up" delay={0.6}>
          <MembershipLevelsCard currentLevel={membershipLevel} />
        </FadeInView>
      </div>
    </PageTemplate>
  );
}
