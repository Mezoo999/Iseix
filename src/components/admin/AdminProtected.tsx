'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';
import { FaExclamationTriangle, FaLock, FaUserShield, FaSync, FaCheckCircle } from 'react-icons/fa';
import { updateAllUsersMembershipLevels } from '@/services/referral';

interface AdminProtectedProps {
  children: ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingMemberships, setIsUpdatingMemberships] = useState(false);
  const [membershipUpdateResult, setMembershipUpdateResult] = useState<{
    success: boolean;
    total: number;
    updated: number;
  } | null>(null);

  // إخفاء إشعار نتيجة التحديث بعد 10 ثوان
  useEffect(() => {
    if (membershipUpdateResult && !isUpdatingMemberships) {
      const timer = setTimeout(() => {
        setMembershipUpdateResult(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [membershipUpdateResult, isUpdatingMemberships]);

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

          // التحقق من صلاحيات المالك
          if (!userData) {
            console.log('بيانات المستخدم غير متوفرة');
            setError('لا يمكن التحقق من صلاحيات المستخدم. يرجى المحاولة مرة أخرى.');
            return;
          }

          if (!userData.isOwner) {
            console.log('المستخدم ليس لديه صلاحيات المالك');
            console.log('معلومات المستخدم:', currentUser.uid, userData);
            setError('ليس لديك صلاحيات الوصول إلى لوحة المشرف');
            setTimeout(() => {
              router.push('/admin/make-me-owner');
            }, 2000);
            return;
          }

          console.log('مرحباً بك في لوحة المشرف');
          setIsChecking(false);

          // تحديث مستويات العضوية تلقائيًا عند تسجيل دخول المشرف
          setIsUpdatingMemberships(true);
          try {
            console.log('بدء تحديث مستويات العضوية تلقائيًا...');
            const result = await updateAllUsersMembershipLevels();
            console.log('تم تحديث مستويات العضوية بنجاح:', result);
            setMembershipUpdateResult({
              success: true,
              total: result.total,
              updated: result.updated
            });
          } catch (updateError) {
            console.error('خطأ في تحديث مستويات العضوية:', updateError);
            setMembershipUpdateResult({
              success: false,
              total: 0,
              updated: 0
            });
          } finally {
            setIsUpdatingMemberships(false);
          }
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

        {currentUser && !userData?.isOwner && (
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-primary/20 text-primary mb-3">
              <FaUserShield />
            </div>
            <p className="text-sm text-center">جاري توجيهك إلى صفحة تعيين المالك...</p>
          </div>
        )}
      </div>
    );
  }

  // إذا كان المستخدم مالكًا، اعرض محتوى الصفحة مع إشعار تحديث مستويات العضوية
  return (
    <>
      {isUpdatingMemberships && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <FaSync className="animate-spin ml-2" />
          <span>جاري تحديث مستويات العضوية...</span>
        </div>
      )}

      {membershipUpdateResult && !isUpdatingMemberships && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${membershipUpdateResult.success ? 'bg-success' : 'bg-error'} text-white px-4 py-2 rounded-lg shadow-lg flex items-center transition-opacity duration-500 opacity-90 hover:opacity-100`}>
          {membershipUpdateResult.success ? (
            <>
              <FaCheckCircle className="ml-2" />
              <span>تم تحديث مستويات العضوية بنجاح! تم تحديث {membershipUpdateResult.updated} من أصل {membershipUpdateResult.total} مستخدم.</span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="ml-2" />
              <span>حدث خطأ أثناء تحديث مستويات العضوية.</span>
            </>
          )}
        </div>
      )}

      {children}
    </>
  );
}
