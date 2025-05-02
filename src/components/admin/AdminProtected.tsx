'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';
import { FaExclamationTriangle, FaLock, FaUserShield } from 'react-icons/fa';
import { checkAdminAccess } from '@/services/permissions';

interface AdminProtectedProps {
  children: ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // التحقق من تسجيل الدخول
        if (!loading) {
          if (!currentUser) {
            console.log('المستخدم غير مسجل الدخول');
            setError('يجب تسجيل الدخول للوصول إلى لوحة المشرف');
            setTimeout(() => {
              router.push('/login');
            }, 2000);
            return;
          }

          // التحقق من صلاحيات المشرف باستخدام خدمة التحقق من الصلاحيات
          const accessResult = await checkAdminAccess(currentUser.uid, 'admin_dashboard');

          if (!accessResult.hasAccess) {
            console.log('المستخدم ليس لديه صلاحيات المشرف:', accessResult.reason);
            setError(accessResult.reason || 'ليس لديك صلاحيات الوصول إلى لوحة المشرف');

            // التحقق من بيانات المستخدم للتوجيه المناسب
            if (!userData) {
              console.log('بيانات المستخدم غير متوفرة');
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else {
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            }
            return;
          }

          console.log('مرحباً بك في لوحة المشرف');
          setIsChecking(false);
        }
      } catch (err) {
        console.error('خطأ في التحقق من الصلاحيات:', err);
        setError('حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.');
      }
    };

    checkAccess();
  }, [currentUser, userData, loading, router]);

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <PageLoader />
        <p className="mt-4 text-foreground-muted">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  // إذا كان هناك خطأ، اعرض رسالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="p-4 rounded-full bg-error/20 text-error mb-4">
          <FaExclamationTriangle size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">خطأ في الوصول</h1>
        <p className="text-foreground-muted text-center mb-6">{error}</p>

        {!currentUser && (
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-primary/20 text-primary mb-3">
              <FaLock />
            </div>
            <p className="text-sm text-center">جاري توجيهك إلى صفحة تسجيل الدخول...</p>
          </div>
        )}

        {currentUser && userData && (!userData.isAdmin && !userData.isOwner) && (
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-primary/20 text-primary mb-3">
              <FaUserShield />
            </div>
            <p className="text-sm text-center">جاري توجيهك إلى لوحة التحكم الخاصة بك...</p>
          </div>
        )}
      </div>
    );
  }

  // إذا كان المستخدم مالكًا، اعرض محتوى الصفحة
  return <>{children}</>;
}
