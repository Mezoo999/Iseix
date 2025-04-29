'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaCrown } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function MakeMeOwnerPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // تعيين نفسك كمالك للمنصة
  const makeMeOwner = async () => {
    if (!currentUser) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('بدء عملية تعيين المالك...');
      console.log('معرف المستخدم:', currentUser.uid);

      // التحقق من وجود المستخدم في قاعدة البيانات
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // إذا لم يكن المستخدم موجودًا في قاعدة البيانات، قم بإنشاء بيانات افتراضية
        console.log('لم يتم العثور على بيانات المستخدم في قاعدة البيانات، سيتم إنشاء بيانات جديدة');

        // إنشاء بيانات المستخدم الافتراضية
        const defaultUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'مستخدم Iseix',
          photoURL: currentUser.photoURL,
          isAdmin: true,
          isOwner: true,
          balances: {
            USDT: 1000000,
            BTC: 0,
            ETH: 0,
            BNB: 0
          },
          totalInvested: 0,
          totalProfit: 0,
          totalDeposited: 100000,
          totalWithdrawn: 0,
          totalReferrals: 0,
          totalReferralEarnings: 0,
          referralCode: generateReferralCode(),
          referredBy: null,
          emailVerified: currentUser.emailVerified || true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // إنشاء وثيقة المستخدم في قاعدة البيانات
        await setDoc(userRef, defaultUserData);
        console.log('تم إنشاء بيانات المستخدم بنجاح');

        setSuccess('تم إنشاء حسابك وتعيينك كمالك للمنصة بنجاح! يمكنك الآن الوصول إلى جميع الميزات الإدارية.');
      } else {
        console.log('بيانات المستخدم الحالية:', userDoc.data());

        // تحديث بيانات المستخدم
        await updateDoc(userRef, {
          isOwner: true,
          isAdmin: true, // تعيين المستخدم كمسؤول أيضًا
          updatedAt: new Date()
        });

        console.log('تم تحديث بيانات المستخدم بنجاح');

        setSuccess('تم تعيينك كمالك للمنصة بنجاح! يمكنك الآن الوصول إلى جميع الميزات الإدارية.');
      }

      // إعادة تحميل الصفحة بعد ثوانٍ قليلة
      setTimeout(() => {
        // استخدام router بدلاً من window.location لتجنب إعادة تحميل الصفحة بالكامل
        router.push('/admin');
      }, 3000);
    } catch (error: any) {
      console.error('Error setting user as owner:', error);
      setError(`حدث خطأ أثناء تعيينك كمالك للمنصة: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء رمز إحالة فريد
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
          <h1 className="text-3xl font-bold mb-6">تعيين نفسك كمالك للمنصة</h1>

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
                <p className="text-foreground-muted text-sm">الصلاحيات الحالية</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userData?.isOwner && (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center">
                      <FaCrown className="ml-1" />
                      مالك المنصة
                    </span>
                  )}

                  {userData?.isAdmin && (
                    <span className="px-2 py-1 bg-info/20 text-info rounded-full text-xs">
                      مسؤول
                    </span>
                  )}

                  {!userData?.isAdmin && !userData?.isOwner && (
                    <span className="px-2 py-1 bg-background-lighter text-foreground-muted rounded-full text-xs">
                      مستخدم عادي
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!userData?.isOwner ? (
              <button
                className="btn btn-primary"
                onClick={makeMeOwner}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaCrown className="ml-2" />
                    تعيين نفسي كمالك للمنصة
                  </span>
                )}
              </button>
            ) : (
              <div className="bg-success/10 p-4 rounded-lg">
                <p className="text-success font-medium flex items-center">
                  <FaCheckCircle className="ml-2" />
                  أنت بالفعل مالك المنصة
                </p>
                <p className="text-sm mt-2">
                  يمكنك الآن الوصول إلى جميع الميزات الإدارية، بما في ذلك:
                </p>
                <ul className="list-disc list-inside text-sm mt-2">
                  <li>إدارة طلبات الإيداع</li>
                  <li>تعيين مستخدمين آخرين كمسؤولين</li>
                  <li>الوصول إلى جميع البيانات والإحصائيات</li>
                </ul>

                <div className="mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/admin')}
                  >
                    الذهاب إلى لوحة تحكم المشرف
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-info/10 p-4 rounded-lg mb-6">
            <p className="font-medium text-info mb-2">معلومات هامة</p>
            <ul className="list-disc list-inside text-sm">
              <li>استخدم هذه الصفحة مرة واحدة فقط لتعيين نفسك كمالك للمنصة.</li>
              <li>بعد تعيين نفسك كمالك، يمكنك الوصول إلى جميع الميزات الإدارية.</li>
              <li>يمكنك تعيين مستخدمين آخرين كمسؤولين من خلال لوحة التحكم.</li>
              <li>تأكد من حماية حسابك بكلمة مرور قوية وتفعيل المصادقة الثنائية إذا كان ذلك متاحًا.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
