'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaUserPlus } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function CreateUserDocPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      checkUserDoc();
    }
  }, [currentUser, loading, router]);

  // التحقق من وجود وثيقة المستخدم
  const checkUserDoc = async () => {
    if (!currentUser) return;

    try {
      console.log('التحقق من وثيقة المستخدم...');
      console.log('معرف المستخدم:', currentUser.uid);

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const exists = userDocSnap.exists();
      console.log('هل وثيقة المستخدم موجودة؟', exists);

      setUserExists(exists);
    } catch (error: any) {
      console.error('Error checking user document:', error);
      setError(`حدث خطأ أثناء التحقق من وثيقة المستخدم: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  // إنشاء وثيقة المستخدم
  const createUserDoc = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('بدء عملية إنشاء وثيقة المستخدم...');
      console.log('معرف المستخدم:', currentUser.uid);

      // إنشاء وثيقة المستخدم
      const userRef = doc(db, 'users', currentUser.uid);

      // بيانات المستخدم الافتراضية
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'مستخدم Iseix',
        photoURL: currentUser.photoURL,
        isAdmin: true,
        isOwner: true,
        balances: {
          USDT: 0
        },
        totalInvested: 0,
        totalProfit: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalReferrals: 0,
        totalReferralEarnings: 0,
        referralCode: generateReferralCode(),
        referredBy: null,
        emailVerified: currentUser.emailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // إنشاء الوثيقة
      await setDoc(userRef, userData);

      console.log('تم إنشاء وثيقة المستخدم بنجاح');

      setSuccess('تم إنشاء وثيقة المستخدم بنجاح! يمكنك الآن تعيين نفسك كمالك للمنصة.');
      setUserExists(true);

      // الانتقال إلى صفحة تعيين المالك بعد ثوانٍ قليلة
      setTimeout(() => {
        router.push('/admin/make-me-owner');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating user document:', error);
      setError(`حدث خطأ أثناء إنشاء وثيقة المستخدم: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء رمز إحالة عشوائي
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">إنشاء وثيقة المستخدم</h1>

          {error && (
            <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
              <FaExclamationTriangle className="inline ml-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/20 text-success p-4 rounded-lg mb-6">
              <FaCheckCircle className="inline ml-2" />
              {success}
            </div>
          )}

          <div className="glass-effect p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">معلومات المستخدم الحالي</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                <p className="font-mono">{currentUser.uid}</p>
              </div>

              <div>
                <p className="text-foreground-muted text-sm">البريد الإلكتروني</p>
                <p>{currentUser.email || 'غير متوفر'}</p>
              </div>

              <div>
                <p className="text-foreground-muted text-sm">الاسم</p>
                <p>{currentUser.displayName || 'غير متوفر'}</p>
              </div>

              <div>
                <p className="text-foreground-muted text-sm">حالة وثيقة المستخدم</p>
                {userExists === null ? (
                  <p className="text-foreground-muted">جاري التحقق...</p>
                ) : userExists ? (
                  <p className="text-success">موجودة</p>
                ) : (
                  <p className="text-error">غير موجودة</p>
                )}
              </div>
            </div>

            {userExists === false ? (
              <button
                className="btn btn-primary"
                onClick={createUserDoc}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaUserPlus className="ml-2" />
                    إنشاء وثيقة المستخدم
                  </span>
                )}
              </button>
            ) : userExists ? (
              <div className="bg-success/10 p-4 rounded-lg">
                <p className="text-success font-medium flex items-center">
                  <FaCheckCircle className="ml-2" />
                  وثيقة المستخدم موجودة بالفعل
                </p>
                <p className="text-sm mt-2">
                  يمكنك الآن تعيين نفسك كمالك للمنصة من خلال الصفحة التالية:
                </p>

                <div className="mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/admin/make-me-owner')}
                  >
                    الذهاب إلى صفحة تعيين المالك
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <FaSpinner className="animate-spin text-primary text-2xl" />
              </div>
            )}
          </div>

          <div className="bg-info/10 p-4 rounded-lg mb-6">
            <p className="font-medium text-info mb-2">معلومات هامة</p>
            <ul className="list-disc list-inside text-sm">
              <li>يجب إنشاء وثيقة المستخدم في قاعدة البيانات قبل تعيين نفسك كمالك للمنصة.</li>
              <li>هذه الصفحة تتحقق من وجود وثيقة المستخدم وتنشئها إذا لم تكن موجودة.</li>
              <li>بعد إنشاء وثيقة المستخدم، يمكنك الانتقال إلى صفحة تعيين المالك.</li>
              <li>استخدم هذه الصفحة مرة واحدة فقط عند إعداد المنصة لأول مرة.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
