'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaExchangeAlt, FaUsers, FaTasks, FaChartLine, FaSearch, FaFilter } from 'react-icons/fa';
import { CircleLoader } from '@/components/ui/Loaders';
import { Timestamp } from 'firebase/firestore';

// Improve type definitions
type TransactionType = 'deposit' | 'withdrawal' | 'referral' | 'task' | 'investment' | 'profit';
type TransactionStatus = 'pending' | 'completed' | 'failed';

interface Transaction {
  id?: string;
  type: TransactionType;  // Use the defined type
  amount: number;
  currency: string;
  status: TransactionStatus;  // Use the defined type
  description?: string;
  createdAt: Timestamp | Date;  // Be more specific about the type
}

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  showFilters?: boolean;
  onFilterChange?: (filter: string) => void;  // Add callback prop
}

export default function TransactionsList({
  transactions,
  isLoading = false,
  showFilters = true,
  onFilterChange
}: TransactionsListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // تنسيق التاريخ
  const formatDate = (createdAt: Timestamp | Date) => {
    if (!createdAt) return '-';

    const date = 'toDate' in createdAt ? createdAt.toDate() : createdAt;
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة المعاملة
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <FaArrowUp className="text-success" />;
      case 'withdrawal':
        return <FaArrowDown className="text-error" />;
      case 'referral':
        return <FaUsers className="text-primary" />;
      case 'task':
        return <FaTasks className="text-info" />;
      case 'investment':
      case 'profit':
        return <FaChartLine className="text-warning" />;
      default:
        return <FaExchangeAlt className="text-foreground-muted" />;
    }
  };

  // الحصول على لون حالة المعاملة
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'failed':
        return 'bg-error/20 text-error';
      default:
        return 'bg-foreground-muted/20 text-foreground-muted';
    }
  };

  // الحصول على نص حالة المعاملة
  const getStatusText = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'pending':
        return 'قيد الانتظار';
      case 'failed':
        return 'فشلت';
      default:
        return status;
    }
  };

  // الحصول على نص نوع المعاملة
  const getTypeText = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'إيداع';
      case 'withdrawal':
        return 'سحب';
      case 'referral':
        return 'عمولة إحالة';
      case 'task':
        return 'مكافأة مهمة';
      case 'investment':
        return 'استثمار';
      case 'profit':
        return 'ربح';
      default:
        return type;
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // تصفية المعاملات
  const filteredTransactions = transactions.filter(transaction => {
    // تصفية حسب النوع
    if (filter !== 'all' && transaction.type !== filter) {
      return false;
    }

    // تصفية حسب البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div>
      {showFilters && (
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaSearch className="text-foreground-muted text-xs sm:text-sm" />
              </div>
              <input
                type="text"
                className="w-full bg-blue-950/30 border border-blue-500/30 rounded-lg p-2 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                placeholder="بحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaFilter className="text-foreground-muted text-xs sm:text-sm" />
              </div>
              <select
                className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-2 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-foreground"
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">جميع المعاملات</option>
                <option value="deposit">الإيداعات</option>
                <option value="withdrawal">السحوبات</option>
                <option value="referral">عمولات الإحالة</option>
                <option value="task">مكافآت المهام</option>
                <option value="investment">الاستثمارات</option>
                <option value="profit">الأرباح</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 sm:py-6">
          <CircleLoader color="primary" size="sm" />
          <p className="text-foreground-muted mt-2 text-xs sm:text-sm">جاري تحميل المعاملات...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-background-dark rounded-lg border border-primary/20">
          <FaExchangeAlt className="text-primary text-2xl sm:text-3xl mx-auto mb-2 opacity-50" />
          <p className="text-foreground-muted text-xs sm:text-sm">
            {searchTerm || filter !== 'all' ? 'لا توجد معاملات تطابق معايير البحث' : 'لم تقم بأي معاملات بعد'}
          </p>
        </div>
      ) : (
        <div className="bg-blue-900/30 rounded-lg border border-blue-500/20 overflow-hidden">
          {/* Versión para pantallas grandes */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-blue-600 border-b border-blue-500/20">
                <tr>
                  <th className="py-3 px-4 text-right text-xs font-medium text-white uppercase tracking-wider">النوع</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-white uppercase tracking-wider">التاريخ</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-white uppercase tracking-wider">الحالة</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-white uppercase tracking-wider">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/20">
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id || index}
                    className="hover:bg-blue-800/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-700/30 flex items-center justify-center ml-2">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{getTypeText(transaction.type)}</div>
                          {transaction.description && (
                            <div className="text-xs text-foreground-muted truncate max-w-[150px]">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground-muted">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className={`font-medium ${transaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'}`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}{transaction.amount.toFixed(2)} {transaction.currency}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versión para móviles */}
          <div className="md:hidden">
            <div className="bg-blue-600 py-3 px-4 text-xs font-medium text-white uppercase tracking-wider border-b border-blue-500/20">
              المعاملات
            </div>
            <div className="divide-y divide-blue-500/20">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id || index}
                  className="p-4 hover:bg-blue-800/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-700/30 flex items-center justify-center ml-2">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{getTypeText(transaction.type)}</div>
                      {transaction.description && (
                        <div className="text-xs text-foreground-muted truncate">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <span className={`font-medium ${transaction.type === 'withdrawal' ? 'text-red-400' : 'text-blue-400'}`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}{transaction.amount.toFixed(2)} {transaction.currency}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-foreground-muted">
                      {formatDate(transaction.createdAt)}
                    </div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




