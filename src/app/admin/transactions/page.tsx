'use client';

import { useState, useEffect } from 'react';
import { FaExchangeAlt, FaSearch, FaFilter, FaDownload, FaSpinner } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: any;
}

export default function AdminTransactions() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إدارة المعاملات');

        // التحقق من وجود فلتر في عنوان URL
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam && ['all', 'deposit', 'withdrawal', 'profit', 'referral'].includes(filterParam)) {
          setFilter(filterParam as any);
        }

        loadTransactions();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);

      let transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc')
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);

      const transactionsData: Transaction[] = [];
      let total = 0;

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const transaction = {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || 'مستخدم غير معروف',
          type: data.type || 'غير معروف',
          amount: data.amount || 0,
          status: data.status || 'معلق',
          description: data.description || '',
          createdAt: data.createdAt?.toDate() || new Date(),
        };

        transactionsData.push(transaction);
        total += transaction.amount;
      });

      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = transactions;

    // تطبيق الفلتر
    if (filter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filter);
    }

    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(
        transaction =>
          transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [filter, searchTerm, transactions]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);

    // تحديث عنوان URL
    const url = new URL(window.location.href);
    url.searchParams.set('filter', newFilter);
    window.history.pushState({}, '', url.toString());
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'مكتمل':
        return 'bg-success/20 text-success';
      case 'pending':
      case 'معلق':
        return 'bg-warning/20 text-warning';
      case 'failed':
      case 'فشل':
        return 'bg-error/20 text-error';
      default:
        return 'bg-info/20 text-info';
    }
  };

  const getTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'إيداع':
        return 'bg-success/20 text-success';
      case 'withdrawal':
      case 'سحب':
        return 'bg-error/20 text-error';
      case 'profit':
      case 'ربح':
        return 'bg-primary/20 text-primary';
      case 'referral':
      case 'إحالة':
        return 'bg-info/20 text-info';
      default:
        return 'bg-foreground-muted/20 text-foreground-muted';
    }
  };

  const getTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'إيداع';
      case 'withdrawal':
        return 'سحب';
      case 'profit':
        return 'ربح';
      case 'referral':
        return 'إحالة';
      default:
        return type;
    }
  };

  const exportToCSV = () => {
    const headers = ['المعرف', 'المستخدم', 'النوع', 'المبلغ', 'الحالة', 'الوصف', 'التاريخ'];

    const rows = filteredTransactions.map(transaction => [
      transaction.id,
      transaction.userName,
      getTypeText(transaction.type),
      transaction.amount.toFixed(2),
      transaction.status,
      transaction.description,
      new Date(transaction.createdAt).toLocaleString('ar-SA')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة المعاملات</h1>
        <p className="text-foreground-muted">عرض وإدارة جميع المعاملات على المنصة.</p>
      </div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FaSearch className="text-foreground-muted" />
          </div>
          <input
            type="text"
            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full md:w-80 p-3 pr-10"
            placeholder="البحث في المعاملات..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-outline flex items-center gap-2">
              <FaFilter />
              {filter === 'all' ? 'جميع المعاملات' :
               filter === 'deposit' ? 'الإيداعات' :
               filter === 'withdrawal' ? 'السحوبات' :
               filter === 'profit' ? 'الأرباح' : 'الإحالات'}
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-background-light rounded-box w-52 mt-2">
              <li><a onClick={() => handleFilterChange('all')} className={filter === 'all' ? 'active' : ''}>جميع المعاملات</a></li>
              <li><a onClick={() => handleFilterChange('deposit')} className={filter === 'deposit' ? 'active' : ''}>الإيداعات</a></li>
              <li><a onClick={() => handleFilterChange('withdrawal')} className={filter === 'withdrawal' ? 'active' : ''}>السحوبات</a></li>
              <li><a onClick={() => handleFilterChange('profit')} className={filter === 'profit' ? 'active' : ''}>الأرباح</a></li>
              <li><a onClick={() => handleFilterChange('referral')} className={filter === 'referral' ? 'active' : ''}>الإحالات</a></li>
            </ul>
          </div>

          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={exportToCSV}
          >
            <FaDownload />
            تصدير CSV
          </button>
        </div>
      </div>

      <div className="bg-background-light rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-background-lighter">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">المعاملات ({filteredTransactions.length})</h3>
            <span className="text-sm">
              إجمالي المبالغ: <span className="font-bold">{totalAmount.toFixed(2)} USDT</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">المستخدم</th>
                <th className="py-3 px-4 text-center">النوع</th>
                <th className="py-3 px-4 text-center">المبلغ (USDT)</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الوصف</th>
                <th className="py-3 px-4 text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    <FaSpinner className="animate-spin inline ml-2" />
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    لا توجد معاملات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      <div className="font-medium">{transaction.userName}</div>
                      <div className="text-xs text-foreground-muted">{transaction.userId}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeClass(transaction.type)}`}>
                        {getTypeText(transaction.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {transaction.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="truncate max-w-xs">{transaction.description}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {new Date(transaction.createdAt).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* زر العودة إلى لوحة المشرف */}
      <div className="mt-8">
        <button
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
          onClick={() => router.push('/admin')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          العودة إلى لوحة المشرف
        </button>
      </div>
    </div>
  );
}
