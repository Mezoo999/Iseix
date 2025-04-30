'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaExclamationTriangle, FaSync, FaDatabase, FaExclamation, FaPlus, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function WithdrawalDebugPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [missingWithdrawals, setMissingWithdrawals] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(0);

  // التحقق من صلاحيات المالك
  useEffect(() => {
    if (!loading && currentUser) {
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحبًا بك في صفحة تشخيص طلبات السحب');
        loadData();
      }
    } else if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // تحميل البيانات
  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('بدء تحميل البيانات من قاعدة البيانات...');

      // جلب جميع طلبات السحب من مجموعة withdrawals
      console.log('جاري جلب طلبات السحب من مجموعة withdrawals...');
      const withdrawalsRef = collection(db, 'withdrawals');
      console.log('مرجع المجموعة:', withdrawalsRef.path);

      const withdrawalsQuery = query(
        withdrawalsRef,
        orderBy('createdAt', 'desc')
      );
      console.log('تم إنشاء الاستعلام لمجموعة withdrawals');

      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      console.log(`تم العثور على ${withdrawalsSnapshot.size} طلب سحب في مجموعة withdrawals`);

      const withdrawalsData: any[] = [];
      withdrawalsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`معرف المستند: ${doc.id}, المستخدم: ${data.userId}, المبلغ: ${data.amount}, الحالة: ${data.status}`);
        withdrawalsData.push({
          id: doc.id,
          ...data,
          collection: 'withdrawals'
        });
      });

      // جلب معاملات السحب من مجموعة transactions
      console.log('جاري جلب معاملات السحب من مجموعة transactions...');
      const transactionsRef = collection(db, 'transactions');
      console.log('مرجع المجموعة:', transactionsRef.path);

      const transactionsQuery = query(
        transactionsRef,
        where('type', '==', 'withdrawal'),
        orderBy('createdAt', 'desc')
      );
      console.log('تم إنشاء الاستعلام لمجموعة transactions');

      const transactionsSnapshot = await getDocs(transactionsQuery);
      console.log(`تم العثور على ${transactionsSnapshot.size} معاملة سحب في مجموعة transactions`);

      const transactionsData: any[] = [];
      const transactionUserIds = new Set<string>();

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`معرف المستند: ${doc.id}, المستخدم: ${data.userId}, المبلغ: ${data.amount}, الحالة: ${data.status}`);
        transactionsData.push({
          id: doc.id,
          ...data,
          collection: 'transactions'
        });

        // حفظ معرفات المستخدمين لاستخدامها في التحليل
        if (data.userId) {
          transactionUserIds.add(data.userId);
        }
      });

      // تحليل البيانات
      console.log('جاري تحليل البيانات للعثور على طلبات السحب المفقودة...');

      // تحويل البيانات إلى تنسيق موحد للمقارنة
      const normalizeData = (data) => {
        try {
          return {
            userId: data.userId || '',
            amount: parseFloat(data.amount) || 0,
            timestamp: data.createdAt?.toDate?.()
              ? data.createdAt.toDate().getTime()
              : (data.createdAt instanceof Date
                ? data.createdAt.getTime()
                : new Date(data.createdAt || 0).getTime())
          };
        } catch (error) {
          console.error('خطأ في تحويل البيانات:', error, data);
          return { userId: '', amount: 0, timestamp: 0 };
        }
      };

      // فلترة المعاملات للحصول على طلبات السحب المفقودة
      const missingWithdrawals = transactionsData.filter(transaction => {
        // تخطي المعاملات الفاشلة
        if (transaction.status === 'failed') {
          return false;
        }

        // تخطي المعاملات التي لا تحتوي على معرف مستخدم أو مبلغ
        if (!transaction.userId || !transaction.amount) {
          console.log(`تخطي معاملة غير صالحة: ${transaction.id}`);
          return false;
        }

        // تحويل بيانات المعاملة
        const transactionNormalized = normalizeData(transaction);

        // البحث عن طلب سحب مطابق في مجموعة withdrawals
        const matchingWithdrawal = withdrawalsData.find(withdrawal => {
          // تخطي طلبات السحب التي لا تحتوي على معرف مستخدم أو مبلغ
          if (!withdrawal.userId || !withdrawal.amount) {
            return false;
          }

          // تحويل بيانات طلب السحب
          const withdrawalNormalized = normalizeData(withdrawal);

          // مقارنة معرف المستخدم والمبلغ
          const userIdMatch = withdrawalNormalized.userId === transactionNormalized.userId;
          const amountMatch = Math.abs(withdrawalNormalized.amount - transactionNormalized.amount) < 0.01; // تسامح صغير للفروق العشرية

          // مقارنة التاريخ (فرق أقل من يوم)
          const timeMatch = Math.abs(withdrawalNormalized.timestamp - transactionNormalized.timestamp) < 86400000;

          return userIdMatch && amountMatch && timeMatch;
        });

        // إذا لم يتم العثور على طلب سحب مطابق، أضف المعاملة إلى قائمة الطلبات المفقودة
        const isMissing = !matchingWithdrawal;
        if (isMissing) {
          console.log(`معاملة سحب مفقودة: ${transaction.id}, المستخدم: ${transaction.userId}, المبلغ: ${transaction.amount}`);
        }

        return isMissing;
      });

      console.log('عدد طلبات السحب المفقودة:', missingWithdrawals.length);
      if (missingWithdrawals.length > 0) {
        console.log('تفاصيل طلبات السحب المفقودة:');
        missingWithdrawals.forEach((transaction, index) => {
          console.log(`${index + 1}. معرف: ${transaction.id}, المستخدم: ${transaction.userId}, المبلغ: ${transaction.amount}, الحالة: ${transaction.status}`);
        });
      }

      setWithdrawalRequests(withdrawalsData);
      setTransactions(transactionsData);
      setMissingWithdrawals(missingWithdrawals);

      // تم تفعيل إنشاء طلبات السحب المفقودة عند الضغط على زر "إنشاء طلبات السحب المفقودة"
    } catch (error) {
      console.error('Error loading data:', error);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء طلبات السحب المفقودة (النظام الموحد)
  const createMissingWithdrawals = async () => {
    // إذا لم تكن هناك طلبات سحب مفقودة، قم بإعادة تحميل البيانات
    if (missingWithdrawals.length === 0) {
      setError('لا توجد طلبات سحب مفقودة. جاري إعادة تحميل البيانات...');
      await loadData();
      return;
    }

    setIsCreating(true);
    setCreationSuccess(0);
    setError('');
    let successCount = 0;
    let errorCount = 0;
    let errorMessages = [];

    try {
      console.log(`بدء إنشاء ${missingWithdrawals.length} طلب سحب مفقود...`);

      // إنشاء نسخة من طلبات السحب المفقودة للعمل عليها
      const missingWithdrawalsCopy = [...missingWithdrawals];

      for (const transaction of missingWithdrawalsCopy) {
        try {
          console.log(`معالجة المعاملة: ${transaction.id}`);

          // التحقق من وجود البيانات المطلوبة
          if (!transaction.userId) {
            throw new Error('معرف المستخدم غير موجود');
          }

          if (!transaction.amount || transaction.amount <= 0) {
            throw new Error('المبلغ غير صالح');
          }

          // استخراج عنوان المحفظة من البيانات الوصفية
          let address = transaction.metadata?.address || 'Unknown';
          let network = transaction.metadata?.network || 'TRC20';

          console.log(`البيانات الأولية: العنوان=${address}, الشبكة=${network}`);

          // محاولة استخراج العنوان من الوصف إذا لم يكن موجودًا في البيانات الوصفية
          if (address === 'Unknown' && transaction.description) {
            console.log(`محاولة استخراج العنوان من الوصف: ${transaction.description}`);

            // محاولة استخراج العنوان باستخدام عدة أنماط مختلفة
            const addressPatterns = [
              /إلى العنوان ([A-Za-z0-9]+)/,
              /العنوان[:\s]+([A-Za-z0-9]+)/,
              /address[:\s]+([A-Za-z0-9]+)/i,
              /([A-Za-z0-9]{30,})/  // عناوين العملات المشفرة عادة طويلة
            ];

            for (const pattern of addressPatterns) {
              const match = transaction.description.match(pattern);
              if (match && match[1]) {
                address = match[1];
                console.log(`تم استخراج العنوان: ${address}`);
                break;
              }
            }

            // محاولة استخراج الشبكة من الوصف
            const networkPatterns = [
              /على شبكة ([A-Za-z0-9]+)/,
              /شبكة[:\s]+([A-Za-z0-9]+)/,
              /network[:\s]+([A-Za-z0-9]+)/i,
              /(TRC20|ERC20|BEP20|BTC)/i  // شبكات شائعة
            ];

            for (const pattern of networkPatterns) {
              const match = transaction.description.match(pattern);
              if (match && match[1]) {
                network = match[1];
                console.log(`تم استخراج الشبكة: ${network}`);
                break;
              }
            }
          }

          // إذا لم نتمكن من استخراج العنوان، نستخدم عنوانًا افتراضيًا
          if (address === 'Unknown') {
            address = 'DefaultAddress_' + Math.random().toString(36).substring(2, 10);
            console.log(`استخدام عنوان افتراضي: ${address}`);
          }

          // تحديد الحالة المناسبة
          let status = 'processing';
          if (transaction.status === 'completed') {
            status = 'approved';
          } else if (transaction.status === 'pending') {
            status = 'pending';
          }

          console.log(`إنشاء طلب سحب جديد: المستخدم=${transaction.userId}, المبلغ=${transaction.amount}, العملة=${transaction.currency || 'USDT'}, الحالة=${status}`);

          // تحديث المعاملة لتتوافق مع النظام الموحد
          const updateData = {
            'metadata.isWithdrawalRequest': true,
            'metadata.network': network,
            'metadata.address': address,
            'metadata.reviewStatus': status,
            updatedAt: serverTimestamp(),
            notes: `تم تحديثه تلقائيًا لتتوافق مع النظام الموحد (${transaction.id})`,
          };

          console.log('بيانات التحديث:', updateData);

          // التحقق من عدم وجود طلب سحب مطابق بالفعل
          const normalizeData = (data) => {
            try {
              return {
                userId: data.userId || '',
                amount: parseFloat(data.amount) || 0
              };
            } catch (error) {
              return { userId: '', amount: 0 };
            }
          };

          const transactionNormalized = normalizeData(transaction);

          const existingWithdrawals = withdrawalRequests.filter(w => {
            const withdrawalNormalized = normalizeData(w);
            return withdrawalNormalized.userId === transactionNormalized.userId &&
                   Math.abs(withdrawalNormalized.amount - transactionNormalized.amount) < 0.01;
          });

          if (existingWithdrawals.length > 0) {
            console.log(`تم العثور على طلب سحب مطابق بالفعل: ${existingWithdrawals[0].id}`);
            throw new Error('يوجد طلب سحب مطابق بالفعل');
          }

          // تحديث المعاملة في قاعدة البيانات
          try {
            await updateDoc(doc(db, 'transactions', transaction.id), updateData);
            console.log(`تم تحديث المعاملة بنجاح. المعرف: ${transaction.id}`);

            successCount++;
            setCreationSuccess(successCount);
            console.log(`تقدم العملية: ${successCount}/${missingWithdrawals.length}`);
          } catch (dbError) {
            console.error('خطأ في تحديث المعاملة في قاعدة البيانات:', dbError);
            throw new Error(`خطأ في قاعدة البيانات: ${dbError.message}`);
          }
        } catch (error) {
          errorCount++;
          const errorMessage = `خطأ في تحديث المعاملة ${transaction.id}: ${error.message || 'خطأ غير معروف'}`;
          errorMessages.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      console.log(`اكتملت العملية. نجاح: ${successCount}, فشل: ${errorCount}`);

      // إعادة تحميل البيانات بعد الانتهاء
      console.log('جاري إعادة تحميل البيانات...');
      await loadData();

      // عرض ملخص النتائج
      if (errorCount > 0) {
        const errorMsg = `تم تحديث ${successCount} معاملة سحب بنجاح، وفشل تحديث ${errorCount} معاملة. راجع وحدة التحكم للتفاصيل.`;
        console.log(errorMsg);
        setError(
          <div>
            <p>{errorMsg}</p>
            <p className="mt-2">
              <button
                className="text-primary underline font-bold"
                onClick={() => router.push('/admin/withdrawals')}
              >
                العودة إلى صفحة إدارة طلبات السحب
              </button>{' '}
              للتحقق من ظهور طلبات السحب.
            </p>
          </div>
        );

        // طباعة تفاصيل الأخطاء
        console.log('تفاصيل الأخطاء:');
        errorMessages.forEach((msg, index) => {
          console.log(`${index + 1}. ${msg}`);
        });
      } else {
        const successMsg = `تم تحديث ${successCount} معاملة سحب بنجاح!`;
        console.log(successMsg);
        setError(
          <div>
            <p className="text-success">{successMsg}</p>
            <p className="mt-2">
              <button
                className="text-primary underline font-bold"
                onClick={() => router.push('/admin/withdrawals')}
              >
                العودة إلى صفحة إدارة طلبات السحب
              </button>{' '}
              للتحقق من ظهور طلبات السحب.
            </p>
          </div>
        );
      }
    } catch (error) {
      console.error('Error updating withdrawal transactions:', error);
      setError('حدث خطأ أثناء تحديث معاملات السحب: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCreating(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">تشخيص طلبات السحب</h1>
        <p className="text-foreground-muted">فحص طلبات السحب في قاعدة البيانات وإصلاح المشاكل</p>
      </div>

      <div className="bg-info/10 p-6 rounded-xl mb-6">
        <h2 className="font-bold text-info text-xl mb-3">معلومات هامة</h2>
        <p className="mb-3">
          تستخدم هذه الصفحة لتشخيص وإصلاح مشاكل طلبات السحب. تم تحديث النظام لاستخدام مجموعة "transactions" فقط لجميع أنواع المعاملات، بما في ذلك طلبات السحب.
        </p>
        <p className="mb-3">
          يمكن لهذه الأداة تحديث معاملات السحب الموجودة في مجموعة "transactions" لتتوافق مع النظام الموحد الجديد.
        </p>

        <div className="mt-4 bg-white/10 p-4 rounded-lg">
          <h3 className="font-bold mb-2">كيفية استخدام هذه الصفحة (النظام الموحد):</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>انتظر حتى يتم تحميل البيانات من قاعدة البيانات.</li>
            <li>تحقق من وجود معاملات سحب في مجموعة "transactions".</li>
            <li>إذا كانت هناك معاملات سحب تحتاج إلى تحديث لتتوافق مع النظام الموحد، ستظهر في قسم "طلبات السحب المفقودة".</li>
            <li>اضغط على زر "تحديث معاملات السحب" لتحديث المعاملات الموجودة لتتوافق مع النظام الموحد.</li>
            <li>بعد الانتهاء، عد إلى صفحة إدارة السحوبات للتحقق من ظهور طلبات السحب.</li>
          </ol>
        </div>

        <div className="mt-4 bg-warning/10 p-4 rounded-lg text-warning-dark">
          <h3 className="font-bold mb-2">ملاحظة هامة:</h3>
          <p>
            هذه الأداة تقوم بإنشاء سجلات جديدة في قاعدة البيانات. تأكد من أنك تفهم ما تقوم به قبل استخدامها. إذا كنت غير متأكد، يرجى الاتصال بمسؤول النظام.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
          <FaExclamationTriangle className="inline ml-2" />
          {error}
        </div>
      )}

      <div className="flex justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-background-dark text-white rounded-lg hover:bg-background-darker transition-colors flex items-center"
            onClick={() => router.push('/admin/withdrawals')}
          >
            <FaArrowRight className="ml-2" />
            العودة إلى إدارة طلبات السحب
          </button>

          <button
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center"
            onClick={() => router.push('/admin/test-data')}
          >
            <FaPlus className="ml-2" />
            إنشاء بيانات اختبارية
          </button>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? <FaSpinner className="animate-spin ml-2" /> : <FaSync className="ml-2" />}
            تحديث البيانات
          </button>

          <button
            className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center"
            onClick={createMissingWithdrawals}
            disabled={isCreating || missingWithdrawals.length === 0}
          >
            {isCreating ? <FaSpinner className="animate-spin ml-2" /> : <FaPlus className="ml-2" />}
            {isCreating
              ? `جاري التحديث (${creationSuccess}/${missingWithdrawals.length})`
              : `تحديث معاملات السحب${missingWithdrawals.length > 0 ? ` (${missingWithdrawals.length})` : ''}`}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <FaSpinner className="animate-spin text-primary text-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* طلبات السحب المفقودة */}
          {missingWithdrawals.length > 0 && (
            <div className="bg-warning/10 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <FaExclamation className="text-warning ml-2" />
                <h2 className="text-xl font-bold">طلبات السحب المفقودة</h2>
              </div>
              <p className="mb-4">
                تم العثور على {missingWithdrawals.length} معاملة سحب في مجموعة transactions تحتاج إلى تحديث لتتوافق مع النظام الموحد.
                يمكنك تحديث هذه المعاملات بالضغط على زر "تحديث معاملات السحب" أعلاه.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المعرف</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">التاريخ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المستخدم</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المبلغ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">العملة</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الحالة</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingWithdrawals.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`border-b border-background-lighter hover:bg-background-lighter/30 transition-colors ${index % 2 === 0 ? 'bg-background-lighter/10' : ''}`}
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={transaction.id}>
                            {transaction.id?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(transaction.createdAt)}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={transaction.userId}>
                            {transaction.userId?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-primary">{transaction.amount?.toFixed(2)}</td>
                        <td className="py-3 px-4">{transaction.currency}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'pending' ? 'bg-warning/20 text-warning' :
                            transaction.status === 'processing' ? 'bg-info/20 text-info' :
                            transaction.status === 'completed' ? 'bg-success/20 text-success' :
                            transaction.status === 'failed' ? 'bg-error/20 text-error' :
                            'bg-foreground-muted/20 text-foreground-muted'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="tooltip" data-tip={transaction.description}>
                            {transaction.description?.length > 30 ? transaction.description.substring(0, 30) + '...' : transaction.description}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 text-center text-sm text-foreground-muted">
                  إجمالي النتائج: {missingWithdrawals.length} معاملة سحب مفقودة
                </div>
              </div>
            </div>
          )}

          {/* طلبات السحب من مجموعة withdrawals */}
          <div className="bg-background-light p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <FaDatabase className="text-primary ml-2" />
              <h2 className="text-xl font-bold">طلبات السحب (مجموعة withdrawals)</h2>
            </div>
            <p className="mb-4">عدد الطلبات: {withdrawalRequests.length}</p>

            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                لا توجد طلبات سحب في مجموعة withdrawals
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المعرف</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">التاريخ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المستخدم</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المبلغ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الشبكة</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request, index) => (
                      <tr
                        key={request.id}
                        className={`border-b border-background-lighter hover:bg-background-lighter/30 transition-colors ${index % 2 === 0 ? 'bg-background-lighter/10' : ''}`}
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={request.id}>
                            {request.id?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(request.createdAt)}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={request.userId}>
                            {request.userId?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-primary">{request.amount?.toFixed(2)} {request.coin}</td>
                        <td className="py-3 px-4">{request.network}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            request.status === 'pending' ? 'bg-warning/20 text-warning' :
                            request.status === 'processing' ? 'bg-info/20 text-info' :
                            request.status === 'approved' ? 'bg-success/20 text-success' :
                            request.status === 'rejected' ? 'bg-error/20 text-error' :
                            'bg-foreground-muted/20 text-foreground-muted'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 text-center text-sm text-foreground-muted">
                  إجمالي النتائج: {withdrawalRequests.length} طلب سحب
                </div>
              </div>
            )}
          </div>

          {/* معاملات السحب من مجموعة transactions */}
          <div className="bg-background-light p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <FaDatabase className="text-primary ml-2" />
              <h2 className="text-xl font-bold">معاملات السحب (مجموعة transactions)</h2>
            </div>
            <p className="mb-4">عدد المعاملات: {transactions.length}</p>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                لا توجد معاملات سحب في مجموعة transactions
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المعرف</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">التاريخ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المستخدم</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">المبلغ</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">العملة</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الحالة</th>
                      <th className="py-3 px-4 text-right border-b border-primary-dark">الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`border-b border-background-lighter hover:bg-background-lighter/30 transition-colors ${index % 2 === 0 ? 'bg-background-lighter/10' : ''}`}
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={transaction.id}>
                            {transaction.id?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(transaction.createdAt)}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="tooltip" data-tip={transaction.userId}>
                            {transaction.userId?.substring(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-primary">{transaction.amount?.toFixed(2)}</td>
                        <td className="py-3 px-4">{transaction.currency}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'pending' ? 'bg-warning/20 text-warning' :
                            transaction.status === 'processing' ? 'bg-info/20 text-info' :
                            transaction.status === 'completed' ? 'bg-success/20 text-success' :
                            transaction.status === 'failed' ? 'bg-error/20 text-error' :
                            'bg-foreground-muted/20 text-foreground-muted'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="tooltip" data-tip={transaction.description}>
                            {transaction.description?.length > 30 ? transaction.description.substring(0, 30) + '...' : transaction.description}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 text-center text-sm text-foreground-muted">
                  إجمالي النتائج: {transactions.length} معاملة سحب
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* أزرار التنقل */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <div className="card bg-background-light shadow-lg p-6 w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-center">خيارات التنقل</h3>

          <div className="flex flex-col gap-3">
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/withdrawals')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              العودة إلى إدارة السحوبات
            </button>

            <button
              className="px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              العودة إلى لوحة المشرف
            </button>

            <button
              className="px-6 py-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
              onClick={() => loadData()}
            >
              <FaSync className="ml-2" />
              تحديث البيانات
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-foreground-muted">
            يمكنك العودة إلى صفحة إدارة السحوبات بعد إصلاح المشكلة
          </div>
        </div>
      </div>
    </div>
  );
}
