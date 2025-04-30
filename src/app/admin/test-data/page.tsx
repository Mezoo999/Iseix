'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaPlus, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { createTestWithdrawalTransactions } from '@/services/testData';

export default function TestDataPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [count, setCount] = useState(3);

  // إنشاء معاملات سحب اختبارية
  const handleCreateTestWithdrawals = async () => {
    if (!currentUser) return;
    
    setIsCreating(true);
    setSuccess('');
    setError('');
    
    try {
      const transactionIds = await createTestWithdrawalTransactions(currentUser.uid, count);
      
      setSuccess(`تم إنشاء ${transactionIds.length} معاملة سحب اختبارية بنجاح!`);
    } catch (error: any) {
      setError(`حدث خطأ أثناء إنشاء معاملات السحب الاختبارية: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // التحقق من صلاحيات المالك
  if (!loading && currentUser) {
    if (!userData?.isOwner) {
      router.push('/dashboard');
      return null;
    }
  } else if (!loading && !currentUser) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-primary text-3xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إنشاء بيانات اختبارية</h1>
        <p className="text-foreground-muted">إنشاء بيانات اختبارية لاختبار وظائف المنصة</p>
      </div>

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
          <div className="mt-4">
            <p>الخطوات التالية:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>
                انتقل إلى{' '}
                <button
                  className="text-primary underline font-bold"
                  onClick={() => router.push('/admin/withdrawals/debug/')}
                >
                  صفحة تشخيص طلبات السحب
                </button>{' '}
                لإنشاء سجلات في مجموعة "withdrawals" بناءً على المعاملات التي تم إنشاؤها.
              </li>
              <li>
                بعد ذلك، انتقل إلى{' '}
                <button
                  className="text-primary underline font-bold"
                  onClick={() => router.push('/admin/withdrawals')}
                >
                  صفحة إدارة السحوبات
                </button>{' '}
                للتحقق من ظهور طلبات السحب.
              </li>
            </ol>
          </div>
        </div>
      )}

      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4">إنشاء معاملات سحب اختبارية</h2>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium">عدد المعاملات</label>
          <input
            type="number"
            className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-3"
            min="1"
            max="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          />
          <p className="text-sm text-foreground-muted mt-1">عدد معاملات السحب الاختبارية المراد إنشاؤها (1-10)</p>
        </div>
        
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
          onClick={handleCreateTestWithdrawals}
          disabled={isCreating}
        >
          {isCreating ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin ml-2" />
              جاري الإنشاء...
            </span>
          ) : (
            <span className="flex items-center">
              <FaPlus className="ml-2" />
              إنشاء معاملات سحب اختبارية
            </span>
          )}
        </button>
      </div>

      <div className="bg-info/10 p-4 rounded-lg mb-6">
        <h3 className="font-bold text-info mb-2">معلومات هامة</h3>
        <p className="mb-2">
          تستخدم هذه الصفحة لإنشاء بيانات اختبارية لاختبار وظائف المنصة. يمكنك إنشاء معاملات سحب اختبارية ثم استخدام صفحة تشخيص طلبات السحب لإنشاء سجلات في مجموعة "withdrawals".
        </p>
        <p>
          بعد إنشاء البيانات الاختبارية، يمكنك التحقق من عمل صفحة إدارة السحوبات بشكل صحيح.
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <button
          className="px-4 py-2 bg-background-dark text-white rounded-lg hover:bg-background-darker transition-colors flex items-center"
          onClick={() => router.push('/admin')}
        >
          <FaArrowRight className="ml-2" />
          العودة إلى لوحة المشرف
        </button>

        <button
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center"
          onClick={() => router.push('/admin/withdrawals/debug/')}
        >
          <FaArrowRight className="ml-2" />
          الانتقال إلى صفحة تشخيص طلبات السحب
        </button>
      </div>
    </div>
  );
}
