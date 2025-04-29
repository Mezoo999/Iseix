'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserShield, FaMoneyBillWave, FaSpinner, FaCheckCircle } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { setAdminAndAddFunds } from '@/scripts/setAdminAndAddFunds';

export default function SetAdminFundsPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // التحقق من تسجيل الدخول والصلاحيات
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !userData?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 glass-effect rounded-xl max-w-md">
          <h1 className="text-2xl font-bold mb-4">غير مصرح</h1>
          <p className="mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/')}
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const handleSetAdminAndAddFunds = async () => {
    setIsProcessing(true);
    setSuccess('');
    setError('');

    try {
      const result = await setAdminAndAddFunds();
      
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Error setting admin and adding funds:', err);
      setError(`حدث خطأ: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <motion.h1
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              تعيين مدير المنصة وإضافة رصيد
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              تعيين المستخدم PAeCtT8GNoYwRTiLM1CjYL59a3J3 كمدير للمنصة وإضافة 100,000 USDT إلى حسابه
            </motion.p>
          </div>
          
          <motion.div
            className="glass-effect p-6 rounded-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {error && (
              <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-success/20 text-success p-4 rounded-lg mb-6 flex items-start">
                <FaCheckCircle className="mt-1 ml-2 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="bg-background-light/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-primary/10 ml-3">
                    <FaUserShield className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold">تعيين كمدير</h3>
                    <p className="text-foreground-muted text-sm">
                      سيتم تعيين المستخدم PAeCtT8GNoYwRTiLM1CjYL59a3J3 كمدير ومالك للمنصة
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background-light/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-success/10 ml-3">
                    <FaMoneyBillWave className="text-success text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold">إضافة رصيد</h3>
                    <p className="text-foreground-muted text-sm">
                      سيتم إضافة 100,000 USDT إلى حساب المستخدم
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                className={`btn ${isProcessing ? 'btn-disabled' : 'btn-primary'} w-full py-3`}
                onClick={handleSetAdminAndAddFunds}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    تنفيذ العملية
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
