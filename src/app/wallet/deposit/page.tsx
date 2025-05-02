'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DepositForm from '@/components/wallet/DepositForm';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { createDepositRequest } from '@/services/deposits';

export default function DepositPage() {
  return (
    <AlertProvider>
      <DepositContent />
    </AlertProvider>
  );
}

function DepositContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // التعامل مع تقديم نموذج الإيداع
  const handleDepositSubmit = async (amount: number, method: string, txid: string) => {
    if (!currentUser) {
      showAlert('error', 'يرجى تسجيل الدخول للإيداع');
      router.push('/login');
      return;
    }

    try {
      // إنشاء طلب إيداع
      await createDepositRequest(
        currentUser.uid,
        amount,
        txid,
        method === 'usdt_trc20' ? 'binance' : method
      );

      // تحديث بيانات المستخدم في localStorage لتحسين تجربة المستخدم
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          // لا نقوم بتحديث الرصيد هنا لأن الإيداع يحتاج إلى موافقة المسؤول أولاً
          // لكن نقوم بتحديث حالة الإيداع
          userData.pendingDeposits = userData.pendingDeposits || [];
          userData.pendingDeposits.push({
            amount,
            method: method === 'usdt_trc20' ? 'USDT (TRC20)' : method,
            txid,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (localStorageError) {
        console.error('Error updating user data in localStorage:', localStorageError);
      }

      showAlert('success', 'تم إرسال طلب الإيداع بنجاح. سيتم مراجعته وتحديث رصيدك في أقرب وقت.');

      // العودة إلى صفحة المحفظة بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    } catch (error) {
      console.error('Error creating deposit request:', error);
      showAlert('error', 'حدث خطأ أثناء إرسال طلب الإيداع');
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
              <h1 className="text-3xl font-bold">إيداع الأموال</h1>
            </motion.div>
            <motion.p
              className="text-foreground-muted mt-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              أضف أموالًا إلى محفظتك للبدء في الاستثمار
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DepositForm onSubmit={handleDepositSubmit} />
            </div>

            <div>
              <motion.div
                className="bg-background-light rounded-xl p-6 shadow-sm sticky top-24"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-lg font-bold mb-4">معلومات الإيداع</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-1">الحد الأدنى للإيداع</h4>
                    <p className="text-foreground-muted">50 USDT</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">وقت المعالجة</h4>
                    <p className="text-foreground-muted">1-24 ساعة</p>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">الشبكات المدعومة</h4>
                    <ul className="text-foreground-muted">
                      <li>USDT (TRC20) - موصى به</li>
                      <li>USDT (ERC20)</li>
                      <li>BTC (Bitcoin)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">ملاحظات هامة</h4>
                    <ul className="text-foreground-muted list-disc list-inside text-sm">
                      <li>تأكد من إرسال العملة الصحيحة إلى العنوان الصحيح</li>
                      <li>لا ترسل أي عملات أخرى غير المذكورة أعلاه</li>
                      <li>يجب إدخال معرف المعاملة (TXID) بشكل صحيح</li>
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
