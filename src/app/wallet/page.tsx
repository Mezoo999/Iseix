'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DepositForm from '@/components/wallet/DepositForm';
import WithdrawForm from '@/components/wallet/WithdrawForm';
import { PageLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { getUserTransactions, Transaction, createTransaction } from '@/services/transactions';
import { createDepositRequest, getUserDepositRequests, DepositRequest } from '@/services/deposits';
import { createWithdrawalRequest, getAvailableProfitsForWithdrawal, hasPendingWithdrawals } from '@/services/withdrawals';
import { FadeInView } from '@/components/ui/AnimatedElements';
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard';
import DepositWithdrawInfo from '@/components/wallet/DepositWithdrawInfo';
import TransactionsList from '@/components/wallet/TransactionsList';
import Tabs from '@/components/ui/Tabs';
import TabContent from '@/components/ui/TabContent';
import Card from '@/components/ui/Card';

export default function WalletPage() {
  const router = useRouter();
  const { currentUser, userData, loading, refreshUserData } = useAuth();
  const { showAlert, showModalAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('deposit');

  // حالة الإيداع
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [isLoadingDepositRequests, setIsLoadingDepositRequests] = useState(false);

  // حالة السحب
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // حالة المعاملات
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] = useState('all');
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // حالة المكافآت المتاحة للسحب
  const [availableProfits, setAvailableProfits] = useState(0);
  const [isLoadingProfits, setIsLoadingProfits] = useState(false);

  // التحقق من تسجيل الدخول وتحديث البيانات عند تحميل الصفحة
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    } else if (!loading && currentUser) {
      // تحديث البيانات عند تحميل الصفحة
      loadUserData();
      loadAvailableProfits();
    }
  }, [currentUser, loading, router]);

  // جلب المعاملات عند تحميل الصفحة
  useEffect(() => {
    if (currentUser && activeTab === 'history') {
      loadTransactions();
    }
  }, [currentUser, activeTab]);

  // جلب المعاملات وطلبات الإيداع عند تحميل الصفحة
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'history') {
      loadTransactions();
    } else if (activeTab === 'deposit') {
      loadDepositRequests();
    }

    // جلب المكافآت المتاحة للسحب في جميع الحالات
    loadAvailableProfits();
  }, [currentUser, activeTab]);

  // جلب المكافآت المتاحة للسحب
  const loadAvailableProfits = async () => {
    if (!currentUser) return;

    setIsLoadingProfits(true);
    try {
      console.log('[wallet/page.tsx] جلب المكافآت المتاحة للسحب للمستخدم:', currentUser.uid);
      const profits = await getAvailableProfitsForWithdrawal(currentUser.uid, 'USDT');
      console.log('[wallet/page.tsx] المكافآت المتاحة للسحب:', profits);
      setAvailableProfits(profits);

      // تحديث قيمة المكافآت المتاحة في localStorage للاستخدام في أماكن أخرى
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.availableProfits = profits;
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('[wallet/page.tsx] تم تحديث المكافآت المتاحة في localStorage:', profits);
        }
      } catch (localStorageErr) {
        console.error('[wallet/page.tsx] Error updating localStorage:', localStorageErr);
      }
    } catch (err) {
      console.error('[wallet/page.tsx] Error loading available profits:', err);
      setAvailableProfits(0);
    } finally {
      setIsLoadingProfits(false);
    }
  };

  // جلب بيانات المستخدم
  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      console.log('[wallet/page.tsx] جلب بيانات المستخدم:', currentUser.uid);
      // استخدام دالة refreshUserData من سياق المصادقة
      await refreshUserData();
      console.log('[wallet/page.tsx] تم تحديث بيانات المستخدم بنجاح');
    } catch (err) {
      console.error('[wallet/page.tsx] Error loading user data:', err);
    }
  };

  // جلب طلبات الإيداع
  const loadDepositRequests = async () => {
    if (!currentUser) return;

    setIsLoadingDepositRequests(true);
    try {
      const requests = await getUserDepositRequests(currentUser.uid);
      setDepositRequests(requests);
    } catch (err) {
      console.error('Error loading deposit requests:', err);
      showAlert('error', 'حدث خطأ أثناء تحميل طلبات الإيداع');
    } finally {
      setIsLoadingDepositRequests(false);
    }
  };

  // جلب المعاملات
  const loadTransactions = async () => {
    if (!currentUser) return;

    setIsLoadingTransactions(true);
    try {
      let type: 'deposit' | 'withdrawal' | undefined = undefined;
      if (transactionType === 'deposit') type = 'deposit';
      if (transactionType === 'withdraw') type = 'withdrawal';

      const userTransactions = await getUserTransactions(currentUser.uid, type);
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
      showAlert('error', 'حدث خطأ أثناء تحميل المعاملات');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // معالجة طلب الإيداع
  const handleDepositSubmit = async (amount: number, txId: string, platform: string, proofFile?: File) => {
    if (!currentUser) return;

    setIsProcessingDeposit(true);

    try {
      // إنشاء طلب إيداع
      await createDepositRequest(
        currentUser.uid,
        amount,
        txId,
        platform,
        proofFile
      );

      showAlert('success', 'تم إرسال طلب الإيداع بنجاح. سيتم مراجعته وتحديث رصيدك في أقرب وقت.');

      // إعادة تحميل طلبات الإيداع
      loadDepositRequests();

      // إعادة تحميل المعاملات
      loadTransactions();
    } catch (err) {
      console.error('Error creating deposit request:', err);
      showAlert('error', 'حدث خطأ أثناء إرسال طلب الإيداع');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // إنشاء طلب سحب
  const handleWithdrawal = async (amount: number, address: string, method: string) => {
    if (!currentUser) return;

    setIsProcessingWithdrawal(true);
    console.log(`[wallet/page.tsx] بدء عملية السحب: المبلغ=${amount}, العنوان=${address}, الطريقة=${method}`);

    // تحديد العملة والشبكة بناءً على 'method'
    let coin = 'USDT';
    let network = 'TRC20'; // الافتراضي
    if (method === 'bnb_bep20') {
        coin = 'BNB';
        network = 'BEP20';
    }

    try {
      // التحقق من الحد الأدنى للسحب
      if (amount < 20) {
        showModalAlert(
          'error',
          'خطأ في المبلغ',
          `الحد الأدنى للسحب هو 20 ${coin}`,
          'فهمت'
        );
        setIsProcessingWithdrawal(false);
        return;
      }

      // تحديث المكافآت المتاحة قبل التحقق
      await loadAvailableProfits();
      console.log(`[wallet/page.tsx] المكافآت المتاحة للسحب: ${availableProfits} ${coin}`);

      // التحقق من أن المبلغ المطلوب سحبه لا يتجاوز المكافآت المتاحة
      if (amount > availableProfits) {
        showModalAlert(
          'error',
          'خطأ في المبلغ',
          `يمكنك فقط سحب المكافآت. المكافآت المتاحة للسحب: ${availableProfits.toFixed(2)} ${coin}`,
          'فهمت'
        );
        setIsProcessingWithdrawal(false);
        return;
      }

      // التحقق من وجود طلبات سحب معلقة
      console.log(`[wallet/page.tsx] التحقق من وجود طلبات سحب معلقة للمستخدم: ${currentUser.uid}`);
      const hasPending = await hasPendingWithdrawals(currentUser.uid);
      console.log(`[wallet/page.tsx] نتيجة التحقق من وجود طلبات سحب معلقة: ${hasPending}`);

      if (hasPending) {
        // استخدام النافذة المنبثقة المركزية لعرض رسالة الخطأ
        showModalAlert(
          'error',
          'طلب سحب معلق',
          'لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.',
          'الذهاب إلى سجل المعاملات',
          () => setActiveTab('history')
        );
        setIsProcessingWithdrawal(false);
        return;
      }

      // إنشاء طلب سحب - سيقوم هذا تلقائيًا بإنشاء معاملة سحب وتحديث الرصيد
      console.log(`[wallet/page.tsx] إنشاء طلب سحب: userId=${currentUser.uid}, amount=${amount}, coin=${coin}, network=${network}, address=${address}`);
      const withdrawalId = await createWithdrawalRequest(
        currentUser.uid,
        amount,
        coin,
        network,
        address
      );
      console.log(`[wallet/page.tsx] تم إنشاء طلب السحب بنجاح. المعرف: ${withdrawalId}`);

      showModalAlert(
        'success',
        'تم إنشاء طلب السحب بنجاح',
        'سيتم مراجعة طلبك ومعالجته في غضون 24-48 ساعة.',
        'عرض المعاملات',
        () => setActiveTab('history')
      );

      // تحديث المعاملات والمكافآت المتاحة والبيانات
      loadTransactions();
      loadAvailableProfits();
      loadUserData(); // تحديث بيانات المستخدم لتحديث الرصيد
    } catch (err) {
      console.error('[wallet/page.tsx] Error processing withdrawal:', err);

      // عرض رسالة الخطأ المحددة إذا كانت متاحة
      if (err instanceof Error) {
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          err.message,
          'فهمت'
        );
      } else {
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          'حدث خطأ أثناء معالجة طلب السحب',
          'فهمت'
        );
      }
    } finally {
      setIsProcessingWithdrawal(false);
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
    <div className="wallet-page">
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-3">
                  <FaWallet className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">المحفظة</h1>
                  <p className="text-white/80 text-sm">إدارة الإيداعات والسحوبات</p>
                </div>
              </div>
              <div className="text-sm bg-white/10 p-2 rounded-lg">
                {new Date().toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>

          {/* بطاقة الرصيد */}
          <FadeInView direction="up" delay={0.2}>
            <WalletBalanceCard
              balance={userData.balances?.USDT || 0}
              currency="USDT"
              totalDeposited={userData.totalDeposited || 0}
              totalWithdrawn={userData.totalWithdrawn || 0}
              availableProfits={availableProfits}
              onDeposit={() => setActiveTab('deposit')}
              onWithdraw={() => setActiveTab('withdraw')}
            />
          </FadeInView>

          {/* معلومات الإيداع والسحب */}
          <FadeInView direction="up" delay={0.3}>
            <DepositWithdrawInfo />
          </FadeInView>

          {/* علامات التبويب */}
          <FadeInView direction="up" delay={0.4}>
            <Tabs
              tabs={[
                { id: 'deposit', label: 'إيداع', icon: <FaArrowDown /> },
                { id: 'withdraw', label: 'سحب', icon: <FaArrowUp /> },
                { id: 'history', label: 'السجل', icon: <FaHistory /> }
              ]}
              defaultTab={activeTab}
              onChange={setActiveTab}
            />
          </FadeInView>

          {/* محتوى علامة التبويب */}
          <TabContent id="deposit" activeTab={activeTab} className="mb-6">
            <Card title="إيداع الأموال" icon={<FaArrowDown className="text-primary" />} delay={0.5}>
              {/* نموذج الإيداع */}
              <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 sm:p-4 rounded-xl mb-4 border border-primary/20 shadow-md">
                <DepositForm
                  onSubmit={handleDepositSubmit}
                  isProcessing={isProcessingDeposit}
                />
              </div>

              {/* طلبات الإيداع السابقة */}
              {depositRequests.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2">
                      <FaHistory className="text-primary text-sm" />
                    </div>
                    <h3 className="text-base font-bold">آخر الطلبات</h3>
                  </div>

                  <div className="overflow-x-auto table-container bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-md rounded-xl border border-primary/20">
                    <table className="w-full text-sm border-collapse table table-striped">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 text-right">التاريخ</th>
                          <th className="py-3 px-4 text-right">المبلغ</th>
                          <th className="py-3 px-4 text-right">المنصة</th>
                          <th className="py-3 px-4 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositRequests.slice(0, 3).map((request: DepositRequest, index) => (
                          <tr
                            key={request.id}
                          >
                            <td className="py-3 px-4 text-sm">
                              {request.createdAt?.toDate
                                ? new Date(request.createdAt.toDate()).toLocaleDateString('ar-SA')
                                : new Date().toLocaleDateString('ar-SA')}
                            </td>
                            <td className="py-3 px-4 font-medium text-primary">{request.amount.toFixed(2)} USDT</td>
                            <td className="py-3 px-4">{request.platform}</td>
                            <td className="py-3 px-4">
                              {request.status === 'pending' && (
                                <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-medium inline-block">
                                  قيد المراجعة
                                </span>
                              )}
                              {request.status === 'approved' && (
                                <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-medium inline-block">
                                  تمت الموافقة
                                </span>
                              )}
                              {request.status === 'rejected' && (
                                <span className="px-3 py-1 bg-error/20 text-error rounded-full text-xs font-medium inline-block">
                                  مرفوض
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {depositRequests.length > 3 && (
                <button
                  className="text-primary text-sm font-medium hover:underline w-full text-center mt-2"
                  onClick={() => setActiveTab('history')}
                >
                  عرض جميع الطلبات ({depositRequests.length})
                </button>
              )}

              <div className="bg-warning/10 text-warning p-4 rounded-lg mb-4 text-xs sm:text-sm mt-4 border border-warning/20">
                <div className="flex items-start">
                  <FaExclamationTriangle className="ml-2 mt-1 flex-shrink-0 text-xs sm:text-sm" />
                  <div>
                    <p className="font-medium mb-1">ملاحظات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>استخدم شبكة TRC20 (TRON) للإيداع بعملة USDT</li>
                      <li>استخدم شبكة BEP20 (BSC) للإيداع بعملة BNB</li>
                      <li>الحد الأدنى للإيداع: 10 USDT أو 0.05 BNB</li>
                      <li>سيتم مراجعة طلبك وتحديث رصيدك خلال 24 ساعة</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 rounded-lg text-center border border-primary/20">
                  <div className="text-xs text-foreground-muted">العملة</div>
                  <div className="font-bold text-sm sm:text-base text-yellow-500">USDT</div>
                </div>

                <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 rounded-lg text-center border border-primary/20">
                  <div className="text-xs text-foreground-muted">الشبكة</div>
                  <div className="font-bold text-sm sm:text-base text-yellow-500">TRC20</div>
                </div>

                <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 rounded-lg text-center border border-primary/20">
                  <div className="text-xs text-foreground-muted">العملة</div>
                  <div className="font-bold text-sm sm:text-base text-orange-500">BNB</div>
                </div>

                <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 rounded-lg text-center border border-primary/20">
                  <div className="text-xs text-foreground-muted">الشبكة</div>
                  <div className="font-bold text-sm sm:text-base text-orange-500">BEP20</div>
                </div>
              </div>

              <div className="text-center mb-4">
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open('https://www.binance.com', '_blank')}
                  className="text-xs sm:text-sm py-2"
                >
                  الذهاب إلى Binance
                </ActionButton>
              </div>

              {isLoadingDepositRequests && (
                <div className="flex justify-center my-8">
                  <FaSpinner className="animate-spin text-primary text-2xl" />
                </div>
              )}
            </Card>
          </TabContent>

          <TabContent id="withdraw" activeTab={activeTab} className="mb-6">
            <Card title="سحب الأموال" icon={<FaArrowUp className="text-primary" />} delay={0.5}>
              <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 sm:p-4 rounded-xl mb-4 border border-primary/20 shadow-md">
                <WithdrawForm
                  balance={userData.balances?.USDT || 0}
                  currency="USDT"
                  onSubmit={handleWithdrawal}
                  isProcessing={isProcessingWithdrawal}
                  initialAvailableProfits={availableProfits}
                />
              </div>

              <div className="bg-warning/10 text-warning p-4 rounded-lg mt-4 text-xs sm:text-sm border border-warning/20">
                <div className="flex items-start">
                  <FaExclamationTriangle className="ml-2 mt-1 flex-shrink-0 text-xs sm:text-sm" />
                  <div>
                    <p className="font-medium mb-1">ملاحظات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>تأكد من صحة عنوان المحفظة قبل إرسال الطلب</li>
                      <li>قد تستغرق عملية السحب ما بين 24-48 ساعة</li>
                      <li>الحد الأدنى للسحب: 20 USDT</li>
                      <li>يمكنك فقط سحب المكافآت وليس مبلغ الإيداع الأصلي</li>
                      <li>لا يمكن إنشاء طلب سحب جديد حتى تتم معالجة الطلب السابق</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </TabContent>

          <TabContent id="history" activeTab={activeTab} className="mb-6">
            <Card title="سجل المعاملات" icon={<FaHistory className="text-primary" />} delay={0.5}>
              <div className="bg-gradient-to-br from-background-light/30 to-background-lighter/20 backdrop-blur-md p-3 rounded-xl mb-4 border border-primary/20 shadow-md">
                <TransactionsList
                  transactions={transactions}
                  isLoading={isLoadingTransactions}
                  showFilters={true}
                  onFilterChange={(type) => {
                    setTransactionType(type);
                    loadTransactions();
                  }}
                />

                <div className="mt-4 text-center">
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={loadTransactions}
                    disabled={isLoadingTransactions}
                    icon={isLoadingTransactions ? <FaSpinner className="animate-spin" /> : undefined}
                  >
                    {isLoadingTransactions ? 'جاري التحميل...' : 'تحديث'}
                  </ActionButton>
                </div>
              </div>
            </Card>
          </TabContent>
        </div>
      </main>
      <Footer />
    </div>
  );
}
