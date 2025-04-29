'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import DepositForm from '@/components/wallet/DepositForm';
import WithdrawForm from '@/components/wallet/WithdrawForm';
import { PageLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { createWithdrawalRequest } from '@/services/binance';
import { getUserTransactions, Transaction, createTransaction } from '@/services/transactions';
import { createDepositRequest, getUserDepositRequests, DepositRequest } from '@/services/deposits';
import { FadeInView } from '@/components/ui/AnimatedElements';
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard';
import DepositWithdrawInfo from '@/components/wallet/DepositWithdrawInfo';
import TransactionsList from '@/components/wallet/TransactionsList';
import Tabs from '@/components/ui/Tabs';
import TabContent from '@/components/ui/TabContent';
import Card from '@/components/ui/Card';

export default function WalletPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();
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

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
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
  }, [currentUser, activeTab]);

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

  // إنشاء طلب سحب (تم تحديث التوقيع ليطابق WithdrawForm)
  const handleWithdrawal = async (amount: number, address: string, method: string) => {
    if (!currentUser) return;

    setIsProcessingWithdrawal(true);

    // تحديد العملة والشبكة بناءً على 'method'
    // هذا افتراض بناءً على الكود الحالي في WithdrawForm. قد تحتاج لتعديله إذا كان لديك طرق أخرى.
    let coin = 'USDT';
    let network = 'TRC20'; // الافتراضي
    if (method === 'usdt_erc20') {
        network = 'ERC20';
    } else if (method === 'btc') {
        coin = 'BTC';
        network = 'BTC'; // أو الشبكة المناسبة للبيتكوين
    }
    // أضف المزيد من الشروط إذا لزم الأمر

    try {
      // إنشاء طلب سحب باستخدام المتغيرات المحدثة
      await createWithdrawalRequest(
        currentUser.uid,
        coin,
        network,
        amount,
        address
      );

      // إنشاء معاملة سحب باستخدام المتغيرات المحدثة
      await createTransaction({
        userId: currentUser.uid,
        type: 'withdrawal',
        amount: amount,
        currency: coin,
        status: 'pending',
        description: `سحب ${amount} ${coin} على شبكة ${network}`,
        metadata: {
          network: network,
          address: address
        }
      });

      showAlert('success', 'تم إنشاء طلب السحب بنجاح');

      // تحديث المعاملات
      loadTransactions();
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      showAlert('error', 'حدث خطأ أثناء معالجة طلب السحب');
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
    <PageTemplate
      title="المحفظة"
      description="إدارة الإيداعات والسحوبات"
      icon={<FaWallet className="text-white text-xl" />}
      showDate={true}
    >
      {/* بطاقة الرصيد */}
      <FadeInView direction="up" delay={0.2}>
        <WalletBalanceCard
          balance={userData.balances?.USDT || 0}
          currency="USDT"
          totalDeposited={userData.totalDeposited || 0}
          totalWithdrawn={userData.totalWithdrawn || 0}
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
          <div className="bg-white/50 p-4 rounded-xl mb-4 shadow-sm">
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

              <div className="space-y-2">
                {depositRequests.slice(0, 3).map((request: DepositRequest) => (
                  <div
                    key={request.id}
                    className="bg-white/50 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="text-sm font-medium">{request.amount.toFixed(2)} USDT</div>
                      <div className="text-xs text-foreground-muted flex items-center">
                        <span className="ml-1">{request.platform}</span> •
                        <span className="mr-1">
                          {request.createdAt?.toDate
                            ? new Date(request.createdAt.toDate()).toLocaleDateString('ar-SA')
                            : new Date().toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>

                    <div>
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
                    </div>
                  </div>
                ))}

                {depositRequests.length > 3 && (
                  <button
                    className="text-primary text-sm font-medium hover:underline w-full text-center mt-2"
                    onClick={() => setActiveTab('history')}
                  >
                    عرض جميع الطلبات ({depositRequests.length})
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-warning/10 text-warning p-3 rounded-lg mb-4 text-sm">
            <div className="flex items-start">
              <FaExclamationTriangle className="ml-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">ملاحظات مهمة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>استخدم شبكة TRC20 (TRON) للإيداع</li>
                  <li>الحد الأدنى للإيداع: 10 USDT</li>
                  <li>سيتم مراجعة طلبك وتحديث رصيدك خلال 24 ساعة</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/30 p-2 rounded-lg text-center">
              <div className="text-xs text-foreground-muted">العملة</div>
              <div className="font-bold">USDT</div>
            </div>

            <div className="bg-white/30 p-2 rounded-lg text-center">
              <div className="text-xs text-foreground-muted">الشبكة</div>
              <div className="font-bold">TRC20</div>
            </div>

            <div className="bg-white/30 p-2 rounded-lg text-center">
              <div className="text-xs text-foreground-muted">الرسوم</div>
              <div className="font-bold text-success">منخفضة</div>
            </div>
          </div>

          <div className="text-center mb-4">
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => window.open('https://www.binance.com', '_blank')}
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
          <WithdrawForm
            balance={userData.balances?.USDT || 0}
            currency="USDT"
            onSubmit={handleWithdrawal}
            isProcessing={isProcessingWithdrawal}
          />

          <div className="bg-warning/10 text-warning p-3 rounded-lg mt-4 text-sm">
            <div className="flex items-start">
              <FaExclamationTriangle className="ml-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">ملاحظات مهمة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تأكد من صحة عنوان المحفظة قبل إرسال الطلب</li>
                  <li>قد تستغرق عملية السحب ما بين 24-48 ساعة</li>
                  <li>الحد الأدنى للسحب: 20 USDT</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </TabContent>

      <TabContent id="history" activeTab={activeTab} className="mb-6">
        <Card title="سجل المعاملات" icon={<FaHistory className="text-primary" />} delay={0.5}>
          <div className="bg-white/50 p-3 rounded-xl mb-4">
            {/* @ts-ignore */}
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
    </PageTemplate>
  );
}
