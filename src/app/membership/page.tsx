'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCrown, FaUsers, FaChartLine, FaInfoCircle } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { FadeInView } from '@/components/ui/AnimatedElements';
import MembershipBadges from '@/components/membership/MembershipBadges';
import MembershipRequirements from '@/components/membership/MembershipRequirements';
import MembershipBenefits from '@/components/membership/MembershipBenefits';
import { MembershipLevel } from '@/services/dailyTasks';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import TabContent from '@/components/ui/TabContent';

export default function MembershipPage() {
  return (
    <AlertProvider>
      <MembershipContent />
    </AlertProvider>
  );
}

function MembershipContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [referralCount, setReferralCount] = useState(0);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // محاكاة تحميل البيانات
  useEffect(() => {
    if (currentUser) {
      // محاكاة تحميل عدد الإحالات
      setTimeout(() => {
        // هنا يمكن استبدالها بالبيانات الحقيقية من قاعدة البيانات
        setReferralCount(5);
        setIsLoading(false);
      }, 1000);
    }
  }, [currentUser]);

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isLoading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  // تحديد مستوى العضوية
  const membershipLevel = userData.membershipLevel || MembershipLevel.BASIC;

  return (
    <PageTemplate
      title="مستويات العضوية"
      description="اكتشف مزايا كل مستوى وكيفية الترقية للحصول على مكافآت أكبر"
      icon={<FaCrown className="text-white text-xl" />}
    >
      {/* ملخص مستوى العضوية */}
      <Card className="mb-6" variant="primary" delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
              <FaCrown className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">مستوى العضوية</p>
              <h2 className="text-lg font-bold">
                {membershipLevel === MembershipLevel.BASIC && 'Iseix Basic'}
                {membershipLevel === MembershipLevel.SILVER && 'Iseix Silver'}
                {membershipLevel === MembershipLevel.GOLD && 'Iseix Gold'}
                {membershipLevel === MembershipLevel.PLATINUM && 'Iseix Platinum'}
                {membershipLevel === MembershipLevel.DIAMOND && 'Iseix Diamond'}
                {membershipLevel === MembershipLevel.ELITE && 'Iseix Elite'}
              </h2>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success/20 text-success ml-3">
              <FaChartLine className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">نسبة الربح اليومي</p>
              <h2 className="text-lg font-bold text-success">
                {membershipLevel === MembershipLevel.BASIC && '2.76% ~ 2.84%'}
                {membershipLevel === MembershipLevel.SILVER && '3.12% ~ 3.24%'}
                {membershipLevel === MembershipLevel.GOLD && '3.48% ~ 3.64%'}
                {membershipLevel === MembershipLevel.PLATINUM && '3.84% ~ 4.04%'}
                {membershipLevel === MembershipLevel.DIAMOND && '4.32% ~ 4.56%'}
                {membershipLevel === MembershipLevel.ELITE && '4.80% ~ 5.04%'}
              </h2>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-3 rounded-full bg-info/20 text-info ml-3">
              <FaUsers className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">عدد الإحالات</p>
              <h2 className="text-lg font-bold text-info">{referralCount}</h2>
            </div>
          </div>
        </div>
      </Card>

      {/* علامات التبويب */}
      <FadeInView direction="up" delay={0.3}>
        <Tabs
          tabs={[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'requirements', label: 'متطلبات الترقية' },
            { id: 'benefits', label: 'المزايا' }
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </FadeInView>

      {/* محتوى علامة التبويب */}
      <TabContent id="overview" activeTab={activeTab}>
        <Card className="mb-6" delay={0.4}>
          <MembershipBadges currentLevel={membershipLevel} />

          <Card
            className="mt-6"
            variant="info"
            title="كيف تعمل مستويات العضوية؟"
            icon={<FaInfoCircle />}
          >
            <ul className="text-sm space-y-1 pr-5 list-disc">
              <li>يتم تحديد مستوى العضوية بناءً على عدد الإحالات التي قمت بها</li>
              <li>كلما ارتفع مستوى العضوية، زادت نسبة الربح اليومي والمزايا الأخرى</li>
              <li>يمكنك الترقية إلى مستوى أعلى عن طريق دعوة المزيد من الأشخاص</li>
            </ul>
          </Card>
        </Card>
      </TabContent>

      <TabContent id="requirements" activeTab={activeTab}>
        <Card className="mb-6" delay={0.4}>
          <MembershipRequirements
            currentLevel={membershipLevel}
            referralCount={referralCount}
          />
        </Card>
      </TabContent>

      <TabContent id="benefits" activeTab={activeTab}>
        <Card className="mb-6" delay={0.4}>
          <MembershipBenefits currentLevel={membershipLevel} />
        </Card>
      </TabContent>
    </PageTemplate>
  );
}
