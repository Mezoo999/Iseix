'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WithdrawForm from '@/components/wallet/WithdrawForm';
import PendingWithdrawalInfo from '@/components/wallet/PendingWithdrawalInfo';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { createWithdrawalRequest, hasPendingWithdrawals, getAvailableProfitsForWithdrawal } from '@/services/withdrawals';

export default function WithdrawPage() {
  return (
    <AlertProvider>
      <WithdrawContent />
    </AlertProvider>
  );
}

function WithdrawContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert, showModalAlert } = useAlert();

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // حالة تحميل المكافآت المتاحة
  const [availableProfits, setAvailableProfits] = useState(0);
  const [isLoadingProfits, setIsLoadingProfits] = useState(true);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);

  // جلب المكافآت المتاحة للسحب عند تحميل الصفحة
  useEffect(() => {
    if (currentUser) {
      loadAvailableProfits();
    }
  }, [currentUser]);

  // جلب المكافآت المتاحة للسحب والتحقق من وجود طلبات سحب معلقة
  const loadAvailableProfits = async () => {
    if (!currentUser) return;

    setIsLoadingProfits(true);
    try {
      console.log('[withdraw/page.tsx] جلب المكافآت المتاحة للسحب للمستخدم:', currentUser.uid);
      const profits = await getAvailableProfitsForWithdrawal(currentUser.uid, 'USDT');
      console.log('[withdraw/page.tsx] المكافآت المتاحة للسحب:', profits);
      setAvailableProfits(profits);

      // التحقق من وجود طلبات سحب معلقة
      console.log('[withdraw/page.tsx] التحقق من وجود طلبات سحب معلقة للمستخدم:', currentUser.uid);
      const hasPending = await hasPendingWithdrawals(currentUser.uid);
      console.log('[withdraw/page.tsx] نتيجة التحقق من وجود طلبات سحب معلقة:', hasPending);
      setHasPendingWithdrawal(hasPending);
    } catch (err) {
      console.error('[withdraw/page.tsx] Error loading withdrawal data:', err);
    } finally {
      setIsLoadingProfits(false);
    }
  };

  // التعامل مع تقديم نموذج السحب
  const handleWithdrawSubmit = async (amount: number, address: string, method: string) => {
    if (!currentUser) {
      showAlert('error', 'يرجى تسجيل الدخول للسحب');
      router.push('/login');
      return;
    }

    try {
      console.log(`[withdraw/page.tsx] بدء عملية السحب: المبلغ=${amount}, العنوان=${address}, الطريقة=${method}`);

      // التحقق من الحد الأدنى للسحب
      if (amount < 20) {
        showModalAlert(
          'error',
          'خطأ في المبلغ',
          'الحد الأدنى للسحب هو 20 USDT',
          'فهمت'
        );
        return;
      }

      // التحقق من أن المبلغ المطلوب سحبه لا يتجاوز المكافآت المتاحة
      if (amount > availableProfits) {
        showModalAlert(
          'error',
          'خطأ في المبلغ',
          `يمكنك فقط سحب المكافآت. المكافآت المتاحة للسحب: ${availableProfits.toFixed(2)} USDT`,
          'فهمت'
        );
        return;
      }

      // التحقق من وجود طلبات سحب معلقة
      console.log(`[withdraw/page.tsx] التحقق من وجود طلبات سحب معلقة للمستخدم: ${currentUser.uid}`);
      const hasPending = await hasPendingWithdrawals(currentUser.uid);
      console.log(`[withdraw/page.tsx] نتيجة التحقق من وجود طلبات سحب معلقة: ${hasPending}`);

      if (hasPending) {
        // استخدام النافذة المنبثقة المركزية لعرض رسالة الخطأ
        showModalAlert(
          'error',
          'طلب سحب معلق',
          'لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.',
          'العودة إلى المحفظة',
          () => router.push('/wallet')
        );
        return;
      }

      // تحويل طريقة السحب إلى شبكة
      const network = method === 'usdt_trc20' ? 'TRC20' :
                      method === 'usdt_erc20' ? 'ERC20' : 'BTC';

      console.log(`[withdraw/page.tsx] إنشاء طلب سحب: userId=${currentUser.uid}, amount=${amount}, coin=USDT, network=${network}, address=${address}`);

      // إنشاء طلب سحب - سيقوم هذا تلقائيًا بإنشاء معاملة سحب وتحديث الرصيد
      const withdrawalId = await createWithdrawalRequest(
        currentUser.uid,
        amount,
        'USDT',
        network,
        address
      );

      console.log(`[withdraw/page.tsx] تم إنشاء طلب السحب بنجاح. المعرف: ${withdrawalId}`);

      // تحديث الرصيد المتاح في localStorage
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.balances && userData.balances.USDT !== undefined) {
            // تحديث الرصيد
            userData.balances.USDT = Math.max(0, userData.balances.USDT - amount);
            // تحديث المكافآت المتاحة
            if (userData.totalProfit !== undefined && userData.totalWithdrawn !== undefined) {
              userData.totalWithdrawn = (userData.totalWithdrawn || 0) + amount;
              userData.availableProfits = Math.max(0, userData.totalProfit - userData.totalWithdrawn);
            }
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log(`[withdraw/page.tsx] تم تحديث بيانات المستخدم في localStorage. الرصيد الجديد: ${userData.balances.USDT}`);
          }
        }
      } catch (localStorageError) {
        console.error('[withdraw/page.tsx] خطأ في تحديث بيانات المستخدم في localStorage:', localStorageError);
      }

      showModalAlert(
        'success',
        'تم إنشاء طلب السحب بنجاح',
        'سيتم مراجعة طلبك ومعالجته في غضون 24-48 ساعة. تم تحديث رصيدك.',
        'العودة إلى المحفظة',
        () => router.push('/wallet')
      );

      // العودة إلى صفحة المحفظة بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    } catch (error) {
      console.error('[withdraw/page.tsx] Error creating withdrawal request:', error);
      // عرض رسالة الخطأ المحددة إذا كانت متاحة
      if (error instanceof Error) {
        // استخدام النافذة المنبثقة المركزية لعرض رسالة الخطأ
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          error.message,
          'العودة إلى المحفظة',
          () => router.push('/wallet')
        );
      } else {
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          'حدث خطأ أثناء إرسال طلب السحب',
          'العودة إلى المحفظة',
          () => router.push('/wallet')
        );
      }
    }
  };

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  // الحصول على رصيد المستخدم
  const balance = userData.balances?.USDT || 0;

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                className="p-2 rounded-full bg-background-light hover:bg-background-lighter transition-colors ml-3"
                onClick={() => router.push('/wallet')}
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-3xl font-bold">سحب الأموال</h1>
            </motion.div>
            <motion.p
              className="text-foreground-muted mt-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              سحب الأموال من محفظتك
            </motion.p>
          </div>

          {hasPendingWithdrawal && currentUser && (
            <PendingWithdrawalInfo userId={currentUser.uid} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WithdrawForm
                balance={balance}
                currency="USDT"
                onSubmit={handleWithdrawSubmit}
                initialAvailableProfits={availableProfits}
                isProcessing={isLoadingProfits}
                hasPendingWithdrawal={hasPendingWithdrawal}
              />
            </div>

            <div>
              <motion.div
                className="bg-background-light rounded-xl p-6 shadow-sm sticky top-24"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-lg font-bold mb-4">معلومات السحب</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-1">الحد الأدنى للسحب</h4>
                    <p className="text-foreground-muted">50 USDT</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">رسوم السحب</h4>
                    <p className="text-foreground-muted">2 USDT</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">وقت المعالجة</h4>
                    <p className="text-foreground-muted">24-48 ساعة</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">الشبكات المدعومة</h4>
                    <ul className="text-foreground-muted">
                      <li>USDT (TRC20) - رسوم منخفضة</li>
                      <li>USDT (ERC20) - رسوم مرتفعة</li>
                      <li>BTC (Bitcoin)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">ملاحظات هامة</h4>
                    <ul className="text-foreground-muted list-disc list-inside text-sm">
                      <li>تأكد من إدخال العنوان الصحيح</li>
                      <li>المعاملات غير قابلة للعكس</li>
                      <li>قد تختلف أوقات المعالجة حسب حالة الشبكة</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
