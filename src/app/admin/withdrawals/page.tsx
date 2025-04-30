'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle, FaEye, FaFileDownload, FaFilter, FaCalendarAlt, FaUser, FaWallet, FaExchangeAlt, FaChartBar, FaDownload, FaTools, FaSync, FaPlus } from 'react-icons/fa';

import { useAuth } from '@/contexts/AuthContext';
import { getAllWithdrawalRequests, approveWithdrawalRequest, rejectWithdrawalRequest, WithdrawalRequest } from '@/services/withdrawals';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processing'>('pending');

  // متغيرات حالة جديدة للفلترة المتقدمة
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [userFilter, setUserFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // متغيرات للإحصائيات
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    processingRequests: 0,
    totalAmount: 0,
    averageAmount: 0,
  });

  // متغيرات للمستخدم المحدد
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [txId, setTxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // التحقق من صلاحيات المالك
  useEffect(() => {
    if (!loading && currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحبًا بك في صفحة إدارة طلبات السحب');

        // التحقق من وجود فلتر في عنوان URL
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam && ['all', 'pending', 'approved', 'rejected', 'processing'].includes(filterParam)) {
          setFilter(filterParam as any);
        }

        loadWithdrawalRequests();
      }
    } else if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // تحميل طلبات السحب
  const loadWithdrawalRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('جاري تحميل طلبات السحب...');
      console.log('الفلتر الحالي:', filter);
      let status: 'pending' | 'approved' | 'rejected' | 'processing' | undefined;

      if (filter !== 'all') {
        status = filter;
        console.log(`تم تعيين الحالة المطلوبة: ${status}`);
      } else {
        console.log('جلب جميع طلبات السحب بغض النظر عن الحالة');
      }

      // محاولة جلب طلبات السحب
      console.log('جاري استدعاء خدمة getAllWithdrawalRequests...');

      // استخدام try/catch داخلي لمعالجة أخطاء استدعاء الخدمة
      try {
        let requests = await getAllWithdrawalRequests(status);
        console.log(`تم جلب ${requests.length} طلب سحب من قاعدة البيانات`);

        // طباعة معرفات الطلبات التي تم جلبها
        if (requests.length > 0) {
          console.log('معرفات الطلبات التي تم جلبها:');
          requests.forEach((req, index) => {
            console.log(`${index + 1}. معرف: ${req.id}, المستخدم: ${req.userId}, المبلغ: ${req.amount}, الحالة: ${req.status}`);
          });
        }

        // إذا لم يتم العثور على طلبات سحب، قم بتشغيل صفحة التشخيص
        if (requests.length === 0 && !status) {
          console.log('لم يتم العثور على طلبات سحب، جاري التحقق من مجموعة المعاملات...');
          console.log('يرجى استخدام صفحة التشخيص لإصلاح المشكلة');

          // يمكن إضافة رسالة للمستخدم هنا
          setError(
            <div>
              لم يتم العثور على طلبات سحب. يرجى استخدام{' '}
              <button
                className="text-primary underline font-bold"
                onClick={() => router.push('/admin/withdrawals/debug')}
              >
                صفحة تشخيص طلبات السحب
              </button>{' '}
              لإصلاح المشكلة.
            </div>
          );
        }

        // تطبيق الفلاتر المتقدمة إذا كانت مفعلة
        let filteredRequests = [...requests];

        if (showAdvancedFilters) {
          // فلترة حسب المستخدم
          if (userFilter) {
            filteredRequests = filteredRequests.filter(req =>
              req.userId.toLowerCase().includes(userFilter.toLowerCase())
            );
          }

          // فلترة حسب نطاق التاريخ
          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            filteredRequests = filteredRequests.filter(req => {
              const reqDate = req.createdAt?.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
              return reqDate >= startDate;
            });
          }

          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999); // نهاية اليوم
            filteredRequests = filteredRequests.filter(req => {
              const reqDate = req.createdAt?.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
              return reqDate <= endDate;
            });
          }

          // فلترة حسب نطاق المبلغ
          if (amountRange.min) {
            const minAmount = parseFloat(amountRange.min);
            filteredRequests = filteredRequests.filter(req => req.amount >= minAmount);
          }

          if (amountRange.max) {
            const maxAmount = parseFloat(amountRange.max);
            filteredRequests = filteredRequests.filter(req => req.amount <= maxAmount);
          }
        }

        setWithdrawalRequests(filteredRequests);

        // حساب الإحصائيات
        calculateStats(requests);
      } catch (serviceError) {
        console.error('Error calling getAllWithdrawalRequests service:', serviceError);
        setError('حدث خطأ أثناء جلب طلبات السحب: ' + (serviceError instanceof Error ? serviceError.message : String(serviceError)));
        setWithdrawalRequests([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      setError('حدث خطأ أثناء تحميل طلبات السحب: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // حساب الإحصائيات
  const calculateStats = (requests: WithdrawalRequest[]) => {
    const stats = {
      totalRequests: requests.length,
      pendingRequests: requests.filter(req => req.status === 'pending').length,
      approvedRequests: requests.filter(req => req.status === 'approved').length,
      rejectedRequests: requests.filter(req => req.status === 'rejected').length,
      processingRequests: requests.filter(req => req.status === 'processing').length,
      totalAmount: requests.reduce((sum, req) => sum + req.amount, 0),
      averageAmount: 0
    };

    // حساب متوسط المبلغ
    if (requests.length > 0) {
      stats.averageAmount = stats.totalAmount / requests.length;
    }

    setStats(stats);
  };

  // تحميل بيانات المستخدم المحدد
  const loadUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setSelectedUserData(userDoc.data());
      } else {
        setSelectedUserData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setSelectedUserData(null);
    }
  };

  // الموافقة على طلب السحب (النظام الموحد)
  const handleApproveWithdrawal = async (requestId: string) => {
    if (!currentUser) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      console.log(`[admin/withdrawals] الموافقة على طلب السحب: ${requestId}`);
      await approveWithdrawalRequest(requestId, currentUser.uid, txId || undefined);
      setSuccess('تمت الموافقة على طلب السحب بنجاح');
      setSelectedRequest(null);
      setTxId('');
      loadWithdrawalRequests();
    } catch (error) {
      console.error('[admin/withdrawals] Error approving withdrawal request:', error);
      setError('حدث خطأ أثناء الموافقة على طلب السحب: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
    }
  };

  // رفض طلب السحب (النظام الموحد)
  const handleRejectWithdrawal = async (requestId: string) => {
    if (!currentUser || !rejectReason) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      console.log(`[admin/withdrawals] رفض طلب السحب: ${requestId}`);
      await rejectWithdrawalRequest(requestId, currentUser.uid, rejectReason);
      setSuccess('تم رفض طلب السحب بنجاح');
      setSelectedRequest(null);
      setRejectReason('');
      loadWithdrawalRequests();
    } catch (error) {
      console.error('[admin/withdrawals] Error rejecting withdrawal request:', error);
      setError('حدث خطأ أثناء رفض طلب السحب: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
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

  // الحصول على نص حالة الطلب
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'processing':
        return 'قيد المعالجة';
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  // الحصول على اسم مستوى العضوية
  const getMembershipLevelName = (level: number | string | undefined) => {
    if (level === undefined) return 'Iseix Basic';

    // التحويل إلى سلسلة نصية للتأكد من التوافق مع المفاتيح في MEMBERSHIP_LEVEL_NAMES
    const levelKey = String(level);
    return MEMBERSHIP_LEVEL_NAMES[levelKey] || 'Iseix Basic';
  };

  // الحصول على لون حالة الطلب
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'processing':
        return 'bg-info/20 text-info';
      case 'approved':
        return 'bg-success/20 text-success';
      case 'rejected':
        return 'bg-error/20 text-error';
      default:
        return 'bg-foreground-muted/20 text-foreground-muted';
    }
  };

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (withdrawalRequests.length === 0) return;

    setIsExporting(true);

    try {
      // إنشاء رأس الجدول
      const headers = ['معرف الطلب', 'تاريخ الطلب', 'معرف المستخدم', 'المبلغ', 'العملة', 'الشبكة', 'العنوان', 'الحالة', 'ملاحظات'];

      // تحويل البيانات إلى تنسيق CSV
      const csvData = withdrawalRequests.map(req => [
        req.id || '',
        formatDate(req.createdAt),
        req.userId,
        req.amount.toString(),
        req.coin,
        req.network,
        req.address,
        getStatusText(req.status),
        req.notes || ''
      ]);

      // دمج الرأس والبيانات
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // إنشاء ملف للتنزيل
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `withdrawal-requests-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  // إعادة تعيين الفلاتر المتقدمة
  const resetAdvancedFilters = () => {
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setUserFilter('');
    loadWithdrawalRequests();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة طلبات السحب</h1>
        <p className="text-foreground-muted">مراجعة والموافقة على طلبات السحب من المستخدمين</p>

        <div className="mt-4 bg-info/10 p-4 rounded-lg">
          <h3 className="font-bold text-info mb-2">تعليمات استخدام الصفحة:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>استخدم الأزرار أعلاه للتصفية حسب حالة طلب السحب (الكل، قيد المراجعة، قيد المعالجة، تمت الموافقة، مرفوض).</li>
            <li>يمكنك استخدام الفلاتر المتقدمة للبحث حسب معرف المستخدم، نطاق التاريخ، أو نطاق المبلغ.</li>
            <li>اضغط على زر "عرض التفاصيل" لمشاهدة معلومات كاملة عن طلب السحب والمستخدم.</li>
            <li>يمكنك الموافقة على طلبات السحب أو رفضها من خلال الأزرار المخصصة.</li>
            <li>إذا لم تظهر أي طلبات سحب، استخدم صفحة التشخيص لإصلاح المشكلة.</li>
          </ul>
        </div>
      </div>

      {/* قسم الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.totalRequests}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <FaExchangeAlt className="text-primary text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
            </div>
            <div className="bg-warning/10 p-3 rounded-full">
              <FaSpinner className="text-warning text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">تمت الموافقة</p>
              <p className="text-2xl font-bold">{stats.approvedRequests}</p>
            </div>
            <div className="bg-success/10 p-3 rounded-full">
              <FaCheckCircle className="text-success text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي المبالغ</p>
              <p className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} USDT</p>
            </div>
            <div className="bg-info/10 p-3 rounded-full">
              <FaWallet className="text-info text-xl" />
            </div>
          </div>
        </div>
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
        </div>
      )}

      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">طلبات السحب</h2>

          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
              onClick={() => setFilter('all')}
            >
              الكل
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
              onClick={() => setFilter('pending')}
            >
              قيد المراجعة
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'processing' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
              onClick={() => setFilter('processing')}
            >
              قيد المعالجة
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
              onClick={() => setFilter('approved')}
            >
              تمت الموافقة
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-primary text-white' : 'bg-background-lighter hover:bg-background-light/80'}`}
              onClick={() => setFilter('rejected')}
            >
              مرفوض
            </button>
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <FaFilter className="ml-2" />
              {showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'الفلاتر المتقدمة'}
            </button>

            <button
              className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center"
              onClick={exportToCSV}
              disabled={isExporting || withdrawalRequests.length === 0}
            >
              {isExporting ? <FaSpinner className="animate-spin ml-2" /> : <FaDownload className="ml-2" />}
              تصدير البيانات
            </button>

            <button
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning-dark transition-colors flex items-center"
              onClick={() => router.push('/admin/withdrawals/debug/')}
            >
              <FaTools className="ml-2" />
              تشخيص طلبات السحب
            </button>

            <button
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center"
              onClick={() => router.push('/admin/test-data')}
            >
              <FaPlus className="ml-2" />
              إنشاء بيانات اختبارية
            </button>

            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={loadWithdrawalRequests}
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : 'تحديث'}
            </button>
          </div>
        </div>

        {/* الفلاتر المتقدمة */}
        {showAdvancedFilters && (
          <div className="bg-background-lighter p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm font-medium">معرف المستخدم</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                  placeholder="البحث حسب معرف المستخدم"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">نطاق التاريخ</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                  <input
                    type="date"
                    className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">نطاق المبلغ</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                    placeholder="الحد الأدنى"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                  />
                  <input
                    type="number"
                    className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                    placeholder="الحد الأقصى"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-background-dark text-white rounded-lg hover:bg-background-darker transition-colors ml-2"
                onClick={resetAdvancedFilters}
              >
                إعادة تعيين
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                onClick={loadWithdrawalRequests}
              >
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center my-12">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : withdrawalRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-warning/10 p-6 rounded-xl mb-6">
              <FaExclamationTriangle className="text-warning text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد طلبات سحب {filter !== 'all' ? `بحالة "${getStatusText(filter)}"` : ''}</h3>

              {filter !== 'all' ? (
                <p className="mb-4 text-foreground-muted">
                  جرب تغيير الفلتر إلى "الكل" لعرض جميع طلبات السحب
                </p>
              ) : (
                <p className="mb-4 text-foreground-muted">
                  لم يتم العثور على أي طلبات سحب في قاعدة البيانات. قد تكون هناك مشكلة في تخزين طلبات السحب.
                </p>
              )}

              {filter === 'all' && (
                <div className="mt-6">
                  <p className="mb-4 font-medium">الحلول المقترحة:</p>

                  <div className="flex flex-col gap-4">
                    <div className="bg-background-lighter p-4 rounded-lg">
                      <h4 className="font-bold mb-2">1. تحديث البيانات</h4>
                      <p className="mb-3">قم بتحديث البيانات للتأكد من أنك تشاهد أحدث المعلومات</p>
                      <button
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        onClick={loadWithdrawalRequests}
                      >
                        <FaSync className="inline ml-2" />
                        تحديث البيانات
                      </button>
                    </div>

                    <div className="bg-background-lighter p-4 rounded-lg">
                      <h4 className="font-bold mb-2">2. استخدام أداة التشخيص</h4>
                      <p className="mb-3">
                        يمكن لأداة التشخيص البحث عن معاملات السحب في مجموعة "transactions" وإنشاء سجلات مقابلة في مجموعة "withdrawals" تلقائيًا
                      </p>
                      <button
                        className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-dark transition-colors"
                        onClick={() => router.push('/admin/withdrawals/debug/')}
                      >
                        <FaTools className="inline ml-2" />
                        فتح صفحة تشخيص طلبات السحب
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  <th className="py-3 px-4 text-right border-b border-primary-dark">العنوان</th>
                  <th className="py-3 px-4 text-right border-b border-primary-dark">الحالة</th>
                  <th className="py-3 px-4 text-right border-b border-primary-dark">الإجراءات</th>
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
                        {request.userId.substring(0, 8)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-primary">{request.amount.toFixed(2)} {request.coin}</td>
                    <td className="py-3 px-4">{request.network}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <div className="tooltip" data-tip={request.address}>
                        {request.address.substring(0, 10)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="p-2 bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors"
                          onClick={() => {
                            setSelectedRequest(request);
                            document.getElementById('details-modal')?.classList.add('modal-open');
                          }}
                          title="عرض التفاصيل"
                        >
                          <FaEye />
                        </button>

                        {(request.status === 'pending' || request.status === 'processing') && (
                          <>
                            <button
                              className="p-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                              onClick={() => {
                                setSelectedRequest(request);
                                setTxId(request.txId || '');
                                document.getElementById('approve-modal')?.classList.add('modal-open');
                              }}
                              title="موافقة"
                            >
                              <FaCheckCircle />
                            </button>

                            <button
                              className="p-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
                              onClick={() => {
                                setSelectedRequest(request);
                                document.getElementById('reject-modal')?.classList.add('modal-open');
                              }}
                              title="رفض"
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                      </div>
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

      {/* نافذة عرض التفاصيل */}
      <div className="modal" id="details-modal">
        <div className="modal-box max-w-3xl">
          <h3 className="font-bold text-lg mb-4">تفاصيل طلب السحب</h3>

          {selectedRequest && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* معلومات الطلب */}
                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-bold mb-3 text-primary">معلومات الطلب</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-foreground-muted text-sm">المعرف</p>
                      <p className="font-mono">{selectedRequest.id}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">التاريخ</p>
                      <p>{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">المبلغ</p>
                      <p className="font-medium text-lg">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">الشبكة</p>
                      <p>{selectedRequest.network}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">الحالة</p>
                      <p>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusText(selectedRequest.status)}
                        </span>
                      </p>
                    </div>
                    {selectedRequest.txId && (
                      <div>
                        <p className="text-foreground-muted text-sm">رقم المعاملة</p>
                        <p className="font-mono text-xs">{selectedRequest.txId.substring(0, 15)}...</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-foreground-muted text-sm">عنوان المحفظة</p>
                    <p className="font-mono break-all text-xs">{selectedRequest.address}</p>
                  </div>

                  {selectedRequest.notes && (
                    <div className="mb-4">
                      <p className="text-foreground-muted text-sm">ملاحظات</p>
                      <p className="bg-background-light p-2 rounded">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {selectedRequest.reviewedBy && (
                    <div className="mt-4 pt-4 border-t border-background-light">
                      <p className="text-foreground-muted text-sm">تمت المراجعة بواسطة</p>
                      <p className="font-mono">{selectedRequest.reviewedBy}</p>
                      <p className="text-foreground-muted text-sm mt-2">تاريخ المراجعة</p>
                      <p>{formatDate(selectedRequest.reviewedAt)}</p>
                    </div>
                  )}
                </div>

                {/* معلومات المستخدم */}
                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-bold mb-3 text-primary flex items-center justify-between">
                    <span>معلومات المستخدم</span>
                    <button
                      className="text-xs bg-info/10 text-info px-2 py-1 rounded"
                      onClick={() => loadUserData(selectedRequest.userId)}
                    >
                      <FaUser className="inline ml-1" />
                      تحميل البيانات
                    </button>
                  </h4>

                  <div className="mb-3">
                    <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                    <p className="font-mono">{selectedRequest.userId}</p>
                  </div>

                  {selectedUserData ? (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-foreground-muted text-sm">البريد الإلكتروني</p>
                          <p>{selectedUserData.email}</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted text-sm">الاسم</p>
                          <p>{selectedUserData.displayName || 'غير محدد'}</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted text-sm">الرصيد الحالي</p>
                          <p className="font-medium">{selectedUserData.balances?.USDT?.toFixed(2) || '0.00'} USDT</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted text-sm">مستوى العضوية</p>
                          <p>{getMembershipLevelName(selectedUserData.membershipLevel)}</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted text-sm">إجمالي الإيداعات</p>
                          <p>{selectedUserData.totalDeposited?.toFixed(2) || '0.00'} USDT</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted text-sm">إجمالي السحوبات</p>
                          <p>{selectedUserData.totalWithdrawn?.toFixed(2) || '0.00'} USDT</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-background-light">
                        <p className="text-foreground-muted text-sm">رمز الإحالة</p>
                        <p className="font-mono">{selectedUserData.referralCode || 'غير محدد'}</p>
                        <p className="text-foreground-muted text-sm mt-2">تاريخ التسجيل</p>
                        <p>{formatDate(selectedUserData.createdAt)}</p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs"
                          onClick={() => {
                            document.getElementById('details-modal')?.classList.remove('modal-open');
                            router.push(`/admin/users?search=${selectedRequest.userId}`);
                          }}
                        >
                          <FaUser className="inline ml-1" />
                          عرض صفحة المستخدم
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground-muted">
                      <p>اضغط على "تحميل البيانات" لعرض معلومات المستخدم</p>
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && (
                  <>
                    <button
                      className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center"
                      onClick={() => {
                        document.getElementById('details-modal')?.classList.remove('modal-open');
                        document.getElementById('approve-modal')?.classList.add('modal-open');
                      }}
                    >
                      <FaCheckCircle className="ml-2" />
                      الموافقة على الطلب
                    </button>

                    <button
                      className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors flex items-center"
                      onClick={() => {
                        document.getElementById('details-modal')?.classList.remove('modal-open');
                        document.getElementById('reject-modal')?.classList.add('modal-open');
                      }}
                    >
                      <FaTimesCircle className="ml-2" />
                      رفض الطلب
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="modal-action">
            <button
              className="px-4 py-2 bg-background-dark text-white rounded-lg hover:bg-background-darker transition-colors"
              onClick={() => document.getElementById('details-modal')?.classList.remove('modal-open')}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* نافذة الموافقة */}
      <div className="modal" id="approve-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">تأكيد الموافقة على طلب السحب</h3>

          {selectedRequest && (
            <div>
              <p className="mb-4">
                هل أنت متأكد من الموافقة على طلب السحب هذا؟ سيتم سحب <span className="font-bold">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</span> من مكافآت المستخدم.
              </p>

              <div className="mb-4">
                <label className="block mb-2 font-medium">رقم المعاملة (TXID) (اختياري)</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل رقم المعاملة إذا كان متاحًا"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                />
                <p className="text-sm text-foreground-muted mt-1">إذا لم تدخل رقم المعاملة، سيتم إنشاء رقم تلقائي</p>
              </div>

              <div className="bg-info/10 p-4 rounded-lg mb-4">
                <p className="text-info font-medium">معلومات هامة</p>
                <p className="text-sm">
                  تأكد من التحقق من عنوان المحفظة والشبكة قبل الموافقة على طلب السحب. يرجى التأكد من أن المبلغ المطلوب سحبه هو من المكافآت المتاحة للمستخدم وليس من مبلغ الإيداع الأصلي.
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors"
                  onClick={() => {
                    handleApproveWithdrawal(selectedRequest.id || '');
                    document.getElementById('approve-modal')?.classList.remove('modal-open');
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    'تأكيد الموافقة'
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => document.getElementById('approve-modal')?.classList.remove('modal-open')}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الرفض */}
      <div className="modal" id="reject-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">تأكيد رفض طلب السحب</h3>

          {selectedRequest && (
            <div>
              <p className="mb-4">
                هل أنت متأكد من رفض طلب السحب هذا؟ سيتم إعادة <span className="font-bold">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</span> إلى مكافآت المستخدم المتاحة للسحب.
              </p>

              <div className="mb-4">
                <label className="block mb-2 font-medium">سبب الرفض</label>
                <textarea
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل سبب الرفض"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors"
                  onClick={() => {
                    if (rejectReason) {
                      handleRejectWithdrawal(selectedRequest.id || '');
                      document.getElementById('reject-modal')?.classList.remove('modal-open');
                    }
                  }}
                  disabled={isProcessing || !rejectReason}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    'تأكيد الرفض'
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => document.getElementById('reject-modal')?.classList.remove('modal-open')}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* أزرار التنقل */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <div className="card bg-background-light shadow-lg p-6 w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-center">خيارات التنقل</h3>

          <div className="flex flex-col gap-3">
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              العودة إلى لوحة المشرف
            </button>

            <button
              className="px-6 py-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/withdrawals/debug/')}
            >
              <FaExclamationTriangle className="ml-2" />
              فتح صفحة تشخيص طلبات السحب
            </button>

            <button
              className="px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
              onClick={loadWithdrawalRequests}
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="animate-spin ml-2" /> : <FaSync className="ml-2" />}
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
