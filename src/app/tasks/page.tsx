'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageTemplate from '@/components/layout/PageTemplate';
import DailyTasksCard from '@/components/tasks/DailyTasksCard';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { FadeInView } from '@/components/ui/AnimatedElements';

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

  // تم تبسيط الكود بإزالة الأجزاء غير المستخدمة

  return (
    <PageTemplate>
      {/* بطاقة المهام الرئيسية */}
      <div className="mb-6">
        <FadeInView direction="up">
          <DailyTasksCard />
        </FadeInView>
      </div>
    </PageTemplate>
  );
}
