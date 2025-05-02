'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaFilter, FaDownload, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { getUserCommissions, Commission, getCommissionTypeLabel, formatCommissionDate } from '@/services/commissions';
import { useAuth } from '@/contexts/AuthContext';
import { CircleLoader } from '@/components/ui/Loaders';

interface CommissionsHistoryProps {
  className?: string;
}

export default function CommissionsHistory({ className = '' }: CommissionsHistoryProps) {
  const { currentUser } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // جلب سجل العمولات
  useEffect(() => {
    const fetchCommissions = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const userCommissions = await getUserCommissions(currentUser.uid, 100);
        setCommissions(userCommissions);
        setFilteredCommissions(userCommissions);
      } catch (error) {
        console.error('Error fetching commissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchCommissions();
    }
  }, [currentUser]);

  // تصفية وفرز العمولات
  useEffect(() => {
    if (commissions.length === 0) return;

    let filtered = [...commissions];

    // تصفية حسب المستوى
    if (levelFilter !== 'all') {
      filtered = filtered.filter(commission => commission.level === parseInt(levelFilter));
    }

    // تصفية حسب النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(commission => commission.type === typeFilter);
    }

    // تصفية حسب البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(commission => 
        commission.referredName.toLowerCase().includes(term) ||
        commission.referredEmail.toLowerCase().includes(term) ||
        commission.description?.toLowerCase().includes(term)
      );
    }

    // فرز العمولات
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'timestamp') {
        comparison = a.timestamp.seconds - b.timestamp.seconds;
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'level') {
        comparison = a.level - b.level;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredCommissions(filtered);
  }, [commissions, levelFilter, typeFilter, searchTerm, sortField, sortDirection]);

  // تبديل اتجاه الفرز
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // تغيير حقل الفرز
  const changeSortField = (field: string) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (filteredCommissions.length === 0) return;

    const headers = ['التاريخ', 'المستخدم', 'البريد الإلكتروني', 'المستوى', 'النوع', 'المبلغ', 'العملة', 'الوصف'];
    
    const csvContent = [
      headers.join(','),
      ...filteredCommissions.map(commission => [
        formatCommissionDate(commission.timestamp),
        commission.referredName,
        commission.referredEmail,
        commission.level,
        getCommissionTypeLabel(commission.type),
        commission.amount,
        commission.currency,
        commission.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `عمولات_الإحالة_${new Date().toLocaleDateString('ar-SA')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // حساب إجمالي العمولات
  const totalCommissions = filteredCommissions.reduce((total, commission) => total + commission.amount, 0);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex justify-center py-8">
          <CircleLoader color="primary" size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-bold flex items-center">
          <FaCoins className="ml-2 text-primary" />
          سجل العمولات
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {/* البحث */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث..."
              className="input input-sm input-bordered pl-8 pr-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-2.5 text-foreground-muted" />
          </div>
          
          {/* تصفية حسب المستوى */}
          <select
            className="select select-sm select-bordered"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">جميع المستويات</option>
            <option value="1">المستوى الأول</option>
            <option value="2">المستوى الثاني</option>
            <option value="3">المستوى الثالث</option>
            <option value="4">المستوى الرابع</option>
            <option value="5">المستوى الخامس</option>
            <option value="6">المستوى السادس</option>
          </select>
          
          {/* تصفية حسب النوع */}
          <select
            className="select select-sm select-bordered"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">جميع الأنواع</option>
            <option value="deposit">إيداع</option>
            <option value="task">مهمة</option>
            <option value="withdrawal">سحب</option>
            <option value="other">أخرى</option>
          </select>
          
          {/* زر التصدير */}
          <button
            className="btn btn-sm btn-outline"
            onClick={exportToCSV}
            disabled={filteredCommissions.length === 0}
          >
            <FaDownload className="ml-1" />
            تصدير
          </button>
        </div>
      </div>
      
      {/* ملخص العمولات */}
      <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <span className="text-foreground-muted">إجمالي العمولات:</span>
            <span className="text-xl font-bold text-primary mr-2">{totalCommissions.toFixed(2)} USDT</span>
          </div>
          <div>
            <span className="text-foreground-muted">عدد العمولات:</span>
            <span className="text-xl font-bold text-primary mr-2">{filteredCommissions.length}</span>
          </div>
        </div>
      </div>
      
      {/* جدول العمولات */}
      {filteredCommissions.length > 0 ? (
        <div className="overflow-x-auto bg-background-light/30 rounded-lg border border-background-lighter">
          <table className="w-full text-sm">
            <thead className="bg-background-dark/20">
              <tr>
                <th className="py-3 px-4 text-right">
                  <button
                    className="flex items-center"
                    onClick={() => changeSortField('timestamp')}
                  >
                    التاريخ
                    {sortField === 'timestamp' && (
                      sortDirection === 'desc' ? <FaSortAmountDown className="mr-1" /> : <FaSortAmountUp className="mr-1" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-right">المستخدم</th>
                <th className="py-3 px-4 text-center">
                  <button
                    className="flex items-center justify-center"
                    onClick={() => changeSortField('level')}
                  >
                    المستوى
                    {sortField === 'level' && (
                      sortDirection === 'desc' ? <FaSortAmountDown className="mr-1" /> : <FaSortAmountUp className="mr-1" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-center">النوع</th>
                <th className="py-3 px-4 text-left">
                  <button
                    className="flex items-center justify-end"
                    onClick={() => changeSortField('amount')}
                  >
                    المبلغ
                    {sortField === 'amount' && (
                      sortDirection === 'desc' ? <FaSortAmountDown className="mr-1" /> : <FaSortAmountUp className="mr-1" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((commission, index) => (
                <motion.tr
                  key={commission.id}
                  className="border-b border-background-lighter hover:bg-background-light/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <td className="py-3 px-4 text-right">
                    {formatCommissionDate(commission.timestamp)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-bold">{commission.referredName}</div>
                      <div className="text-xs text-foreground-muted">{commission.referredEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      المستوى {commission.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      commission.type === 'deposit' ? 'bg-success/10 text-success' :
                      commission.type === 'task' ? 'bg-info/10 text-info' :
                      commission.type === 'withdrawal' ? 'bg-warning/10 text-warning' :
                      'bg-foreground-muted/10 text-foreground-muted'
                    }`}>
                      {getCommissionTypeLabel(commission.type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-bold text-success">
                    {commission.amount.toFixed(2)} {commission.currency}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-background-dark/20 rounded-lg">
          <FaCoins className="text-primary text-3xl mx-auto mb-2 opacity-50" />
          <p className="text-foreground-muted">لم يتم العثور على أي عمولات</p>
          {commissions.length > 0 && (
            <p className="text-sm text-foreground-muted mt-2">
              جرب تغيير معايير التصفية للعثور على النتائج
            </p>
          )}
        </div>
      )}
    </div>
  );
}
