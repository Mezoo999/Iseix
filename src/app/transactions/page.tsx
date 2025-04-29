'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaInfoCircle, FaDownload, FaFilter } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import TransactionsList from '@/components/wallet/TransactionsList';
import { PageLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { getUserTransactions } from '@/services/transactions';
import { FadeInView } from '@/components/ui/AnimatedElements';
import Card from '@/components/ui/Card';

export default function TransactionsPage() {
  return (
    <AlertProvider>
      <TransactionsContent />
    </AlertProvider>
  );
}

function TransactionsContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalProfits: 0,
    totalReferrals: 0
  });

  // تحميل المعاملات
  const loadTransactions = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      let type: string | undefined = undefined;
      if (filter !== 'all') {
        type = filter;
      }

      const userTransactions = await getUserTransactions(currentUser.uid, type);

      // تصفية حسب النطاق الزمني
      let filteredTransactions = [...userTransactions];

      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (dateRange === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = new Date(tx.timestamp?.toDate ? tx.timestamp.toDate() : tx.timestamp);
          return txDate >= startDate;
        });
      }

      setTransactions(filteredTransactions);

      // حساب الإحصائيات
      calculateStats(filteredTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showAlert('error', 'حدث خطأ أثناء تحميل المعاملات');
    } finally {
      setIsLoading(false);
    }
  };

  // حساب الإحصائيات
  const calculateStats = (txs: any[]) => {
    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalProfits: 0,
      totalReferrals: 0
    };

    txs.forEach(tx => {
      if (tx.type === 'deposit' && tx.status === 'completed') {
        stats.totalDeposits += tx.amount;
      } else if (tx.type === 'withdrawal' && tx.status === 'completed') {
        stats.totalWithdrawals += tx.amount;
      } else if ((tx.type === 'profit' || tx.type === 'investment') && tx.status === 'completed') {
        stats.totalProfits += tx.amount;
      } else if (tx.type === 'referral' && tx.status === 'completed') {
        stats.totalReferrals += tx.amount;
      }
    });

    setStats(stats);
  };

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    if (!loading && currentUser) {
      loadTransactions();
    }
  }, [loading, currentUser, filter, dateRange]);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // تصدير المعاملات كملف CSV
  const exportTransactions = () => {
    if (transactions.length === 0) {
      showAlert('warning', 'لا توجد معاملات للتصدير');
      return;
    }

    // إنشاء محتوى CSV
    const headers = ['النوع', 'المبلغ', 'العملة', 'الحالة', 'التاريخ', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => {
        const date = tx.timestamp?.toDate ?
          new Date(tx.timestamp.toDate()).toLocaleString() :
          new Date(tx.timestamp).toLocaleString();

        return [
          tx.type,
          tx.amount,
          tx.currency,
          tx.status,
          date,
          tx.description || ''
        ].join(',');
      })
    ].join('\n');

    // إنشاء ملف للتنزيل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('success', 'تم تصدير المعاملات بنجاح');
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
      title="سجل المعاملات"
      description="عرض وتصفية جميع معاملاتك"
      icon={<FaExchangeAlt className="text-white text-xl" />}
    >
      <Card
        className="mb-8"
        variant="info"
        icon={<FaInfoCircle />}
        title="معلومات المعاملات"
        delay={0.2}
      >
        <p className="text-sm">
          يمكنك تصفية المعاملات حسب النوع والفترة الزمنية. يمكنك أيضًا تصدير المعاملات كملف CSV.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <FadeInView direction="up" delay={0.3}>
          <Card variant="success">
            <h3 className="text-sm text-foreground-muted mb-2">إجمالي الإيداعات</h3>
            <p className="text-2xl font-bold text-success">{stats.totalDeposits.toFixed(2)} USDT</p>
          </Card>
        </FadeInView>

        <FadeInView direction="up" delay={0.4}>
          <Card variant="error">
            <h3 className="text-sm text-foreground-muted mb-2">إجمالي السحوبات</h3>
            <p className="text-2xl font-bold text-error">{stats.totalWithdrawals.toFixed(2)} USDT</p>
          </Card>
        </FadeInView>

        <FadeInView direction="up" delay={0.5}>
          <Card variant="primary">
            <h3 className="text-sm text-foreground-muted mb-2">إجمالي الأرباح</h3>
            <p className="text-2xl font-bold text-primary">{stats.totalProfits.toFixed(2)} USDT</p>
          </Card>
        </FadeInView>

        <FadeInView direction="up" delay={0.6}>
          <Card variant="warning">
            <h3 className="text-sm text-foreground-muted mb-2">عمولات الإحالة</h3>
            <p className="text-2xl font-bold text-warning">{stats.totalReferrals.toFixed(2)} USDT</p>
          </Card>
        </FadeInView>
      </div>

      <Card className="mb-6" delay={0.7}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaFilter className="text-foreground-muted" />
              </div>
              <select
                className="bg-background border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10 appearance-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">جميع المعاملات</option>
                <option value="deposit">الإيداعات</option>
                <option value="withdrawal">السحوبات</option>
                <option value="profit">الأرباح</option>
                <option value="investment">الاستثمارات</option>
                <option value="referral">عمولات الإحالة</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaFilter className="text-foreground-muted" />
              </div>
              <select
                className="bg-background border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10 appearance-none"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">جميع الفترات</option>
                <option value="today">اليوم</option>
                <option value="week">آخر أسبوع</option>
                <option value="month">آخر شهر</option>
                <option value="year">آخر سنة</option>
              </select>
            </div>
          </div>

          <ActionButton
            variant="secondary"
            onClick={exportTransactions}
            icon={<FaDownload />}
            disabled={transactions.length === 0}
          >
            تصدير CSV
          </ActionButton>
        </div>
      </Card>

      <FadeInView direction="up" delay={0.8}>
        <Card className="p-0 overflow-hidden">
          <TransactionsList
            transactions={transactions}
            isLoading={isLoading}
            showFilters={false}
          />
        </Card>
      </FadeInView>
    </PageTemplate>
  );
}
