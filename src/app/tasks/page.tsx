'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTasks, FaChartLine, FaInfoCircle, FaTrophy, FaClock } from 'react-icons/fa';

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

  return (
    <PageTemplate
      title="المهام اليومية"
      description="أكمل المهام اليومية للحصول على مكافآت إضافية وزيادة أرباحك"
      icon={<FaTasks className="text-white text-xl" />}
    >
      {/* معلومات المهام اليومية */}
      <Card
        className="mb-6"
        variant="info"
        icon={<FaInfoCircle />}
        title="كيف تعمل المهام اليومية؟"
        delay={0.2}
      >
        <ul className="text-sm space-y-1 pr-5 list-disc">
          <li>يمكنك إكمال <span className="font-bold">3</span> مهام يوميًا</li>
          <li>معدل الربح: <span className="font-bold">{profitRateDisplay}</span> لكل مهمة</li>
          <li>يتم إعادة تعيين المهام تلقائيًا كل 24 ساعة</li>
        </ul>
      </Card>

      {/* إحصائيات المهام */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card variant="primary" delay={0.3}>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-primary/20 ml-2">
                <FaTasks className="text-primary text-lg" />
              </div>
              <div>
                <h3 className="text-foreground-muted text-xs">المهام المكتملة</h3>
                <p className="text-xl font-bold">{taskRewards.length}</p>
              </div>
            </div>
          </Card>

          <Card variant="success" delay={0.35}>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-success/20 ml-2">
                <FaChartLine className="text-success text-lg" />
              </div>
              <div>
                <h3 className="text-foreground-muted text-xs">إجمالي المكافآت</h3>
                <p className="text-xl font-bold">{calculateTotalRewards().toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card
          variant="secondary"
          delay={0.4}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-secondary/20 ml-2">
                <FaTrophy className="text-secondary text-lg" />
              </div>
              <div>
                <h3 className="text-foreground-muted text-xs">مستوى العضوية</h3>
                <p className="text-lg font-bold">
                  {MEMBERSHIP_LEVEL_NAMES[membershipLevel]}
                </p>
              </div>
            </div>
            <div className="bg-secondary/10 px-2 py-1 rounded text-xs">
              {profitRateDisplay}
            </div>
          </div>
        </Card>
      </div>

      {/* المهام اليومية */}
      <div className="mb-8">
        <FadeInView direction="up" delay={0.3}>
          <DailyTasksCard />
        </FadeInView>
      </div>

      {/* معلومات إعادة تعيين المهام */}
      <Card
        className="mb-8"
        variant="primary"
        title="إعادة تعيين المهام"
        icon={<FaClock className="text-primary" />}
        delay={0.4}
      >
        <p className="text-sm text-foreground-muted mb-4">يتم إعادة تعيين المهام اليومية عند منتصف الليل</p>

        <div className="bg-background-light/30 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-foreground-muted">المهام المكتملة اليوم:</span>
            <span className="font-bold">{taskRewards.filter(r => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const rewardDate = r.timestamp?.toDate ? new Date(r.timestamp.toDate()) : new Date(r.timestamp);
              rewardDate.setHours(0, 0, 0, 0);
              return rewardDate.getTime() === today.getTime();
            }).length} من 3</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">المهام المتاحة:</span>
            <span className="font-bold text-primary">{Math.max(0, 3 - taskRewards.filter(r => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const rewardDate = r.timestamp?.toDate ? new Date(r.timestamp.toDate()) : new Date(r.timestamp);
              rewardDate.setHours(0, 0, 0, 0);
              return rewardDate.getTime() === today.getTime();
            }).length)}</span>
          </div>
        </div>
      </Card>

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
