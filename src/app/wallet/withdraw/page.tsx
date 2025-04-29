'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WithdrawForm from '@/components/wallet/WithdrawForm';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { createWithdrawalRequest } from '@/services/binance';
import { createTransaction } from '@/services/transactions';

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
  const { showAlert } = useAlert();
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  // التعامل مع تقديم نموذج السحب
  const handleWithdrawSubmit = async (amount: number, address: string, method: string) => {
    if (!currentUser) {
      showAlert('error', 'يرجى تسجيل الدخول للسحب');
      router.push('/login');
      return;
    }
    
    try {
      // تحويل طريقة السحب إلى شبكة
      const network = method === 'usdt_trc20' ? 'TRC20' : 
                      method === 'usdt_erc20' ? 'ERC20' : 'BTC';
      
      // إنشاء طلب سحب
      await createWithdrawalRequest(
        currentUser.uid,
        'USDT',
        network,
        amount,
        address
      );
      
      // إنشاء معاملة سحب
      await createTransaction({
        userId: currentUser.uid,
        type: 'withdrawal',
        amount,
        currency: 'USDT',
        status: 'pending',
        description: `سحب ${amount} USDT على شبكة ${network}`,
        metadata: {
          network,
          address
        }
      });
      
      showAlert('success', 'تم إرسال طلب السحب بنجاح. سيتم معالجته في غضون 24-48 ساعة.');
      
      // العودة إلى صفحة المحفظة بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      showAlert('error', 'حدث خطأ أثناء إرسال طلب السحب');
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WithdrawForm
                balance={balance}
                currency="USDT"
                onSubmit={handleWithdrawSubmit}
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
