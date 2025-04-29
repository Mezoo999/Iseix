'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle, FaEye, FaFileDownload, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { getAllDepositRequests, approveDepositRequest, rejectDepositRequest, DepositRequest } from '@/services/deposits';
import AdminLayout from '@/components/admin/AdminLayout';
import DepositStats, { fetchDepositStats } from '@/components/admin/deposits/DepositStats';
import DepositFilters from '@/components/admin/deposits/DepositFilters';
import AdminChart from '@/components/admin/charts/AdminChart';
import LineChart from '@/components/admin/charts/LineChart';

export default function AdminDepositsPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // إحصائيات الإيداعات
  const [stats, setStats] = useState({
    pendingCount: 0,
    totalAmount: 0,
    recentCount: 0
  });

  // بيانات الرسم البياني
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  // التحقق من صلاحيات المالك
  // التحقق من صلاحيات المستخدم وتحميل البيانات الأولية
  useEffect(() => {
    if (!loading && currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحبًا بك في صفحة إدارة طلبات الإيداع');

        // التحقق من وجود فلتر في عنوان URL
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam && ['all', 'pending', 'approved', 'rejected'].includes(filterParam)) {
          setFilter(filterParam as any);
        }
      }
    } else if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // تحميل البيانات عند تغيير الفلتر
  useEffect(() => {
    if (currentUser && userData?.isOwner) {
      loadDepositRequests();
    }
  }, [filter, currentUser, userData?.isOwner]);

  // تحميل طلبات الإيداع
  const loadDepositRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      let status: 'pending' | 'approved' | 'rejected' | undefined;

      if (filter !== 'all') {
        status = filter;
      }

      // جلب طلبات الإيداع
      const requests = await getAllDepositRequests(status);
      setDepositRequests(requests);

      // تطبيق البحث إذا كان هناك مصطلح بحث
      if (searchTerm) {
        filterRequests(requests, searchTerm);
      } else {
        setFilteredRequests(requests);
      }

      // جلب إحصائيات الإيداعات
      const depositStats = await fetchDepositStats();
      setStats(depositStats);

      // إنشاء بيانات الرسم البياني
      generateChartData(requests);

    } catch (error) {
      console.error('Error loading deposit requests:', error);
      setError('حدث خطأ أثناء تحميل طلبات الإيداع');
    } finally {
      setIsLoading(false);
    }
  };

  // تصفية طلبات الإيداع حسب مصطلح البحث
  const filterRequests = (requests: DepositRequest[], term: string) => {
    if (!term.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(request =>
      request.userId.toLowerCase().includes(term.toLowerCase()) ||
      request.txId.toLowerCase().includes(term.toLowerCase()) ||
      request.id?.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredRequests(filtered);
  };

  // معالجة البحث
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterRequests(depositRequests, term);
  };

  // إنشاء بيانات الرسم البياني
  const generateChartData = (requests: DepositRequest[]) => {
    // إنشاء قاموس لتجميع المبالغ حسب التاريخ
    const dateAmounts: Record<string, number> = {};

    // الحصول على طلبات الإيداع المقبولة فقط
    const approvedRequests = requests.filter(req => req.status === 'approved');

    // تجميع المبالغ حسب التاريخ (آخر 7 أيام)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      dateAmounts[dateStr] = 0;
    }

    // حساب المبالغ لكل يوم
    approvedRequests.forEach(request => {
      if (request.createdAt) {
        const date = request.createdAt.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
        // التحقق مما إذا كان التاريخ في آخر 7 أيام
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          const dateStr = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
          dateAmounts[dateStr] = (dateAmounts[dateStr] || 0) + request.amount;
        }
      }
    });

    // تحويل القاموس إلى مصفوفة للرسم البياني
    const data = Object.entries(dateAmounts).map(([label, value]) => ({ label, value }));
    setChartData(data);
  };

  // الموافقة على طلب الإيداع
  const handleApproveDeposit = async (requestId: string) => {
    if (!currentUser) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await approveDepositRequest(requestId, currentUser.uid);
      setSuccess('تمت الموافقة على طلب الإيداع بنجاح');
      setSelectedRequest(null);
      loadDepositRequests();
    } catch (error) {
      console.error('Error approving deposit request:', error);
      setError('حدث خطأ أثناء الموافقة على طلب الإيداع');
    } finally {
      setIsProcessing(false);
    }
  };

  // رفض طلب الإيداع
  const handleRejectDeposit = async (requestId: string) => {
    if (!currentUser || !rejectReason) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await rejectDepositRequest(requestId, currentUser.uid, rejectReason);
      setSuccess('تم رفض طلب الإيداع بنجاح');
      setSelectedRequest(null);
      setRejectReason('');
      loadDepositRequests();
    } catch (error) {
      console.error('Error rejecting deposit request:', error);
      setError('حدث خطأ أثناء رفض طلب الإيداع');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // التحقق من أن المستخدم هو مالك المنصة
  if (!currentUser || !userData?.isOwner) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة طلبات الإيداع</h1>
        <p className="text-foreground-muted">مراجعة والموافقة على طلبات الإيداع من المستخدمين</p>
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

      {/* إحصائيات الإيداعات */}
      <DepositStats
        pendingCount={stats.pendingCount}
        totalAmount={stats.totalAmount}
        recentCount={stats.recentCount}
      />

      {/* رسم بياني للإيداعات */}
      <div className="mb-8">
        <AdminChart
          title="إيداعات آخر 7 أيام"
          description="إجمالي مبالغ الإيداعات المقبولة خلال الأسبوع الماضي"
          type="line"
        >
          <LineChart
            data={chartData}
            color="#10b981"
            showArea={true}
          />
        </AdminChart>
      </div>

      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">طلبات الإيداع</h2>
        </div>

        {/* فلاتر البحث والتصفية */}
        <DepositFilters
          onSearch={handleSearch}
          onFilterChange={setFilter}
          currentFilter={filter}
          onRefresh={loadDepositRequests}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="flex justify-center my-12">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            {searchTerm ? (
              <>لا توجد نتائج مطابقة لـ "{searchTerm}"</>
            ) : (
              <>لا توجد طلبات إيداع {filter !== 'all' ? `بحالة "${filter === 'pending' ? 'قيد المراجعة' : filter === 'approved' ? 'تمت الموافقة' : 'مرفوض'}"` : ''}</>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 text-foreground-muted text-sm">
              عرض {filteredRequests.length} من أصل {depositRequests.length} طلب
            </div>
            <table className="w-full text-sm">
              <thead className="bg-background-dark text-white">
                <tr>
                  <th className="py-3 px-4 text-right">المعرف</th>
                  <th className="py-3 px-4 text-right">التاريخ</th>
                  <th className="py-3 px-4 text-right">المستخدم</th>
                  <th className="py-3 px-4 text-right">المبلغ</th>
                  <th className="py-3 px-4 text-right">المنصة</th>
                  <th className="py-3 px-4 text-right">رقم المعاملة</th>
                  <th className="py-3 px-4 text-right">الحالة</th>
                  <th className="py-3 px-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4 font-mono text-xs">{request.id?.substring(0, 8)}</td>
                    <td className="py-3 px-4">{formatDate(request.createdAt)}</td>
                    <td className="py-3 px-4 font-mono text-xs">{request.userId.substring(0, 8)}</td>
                    <td className="py-3 px-4 font-medium">{request.amount.toFixed(2)} USDT</td>
                    <td className="py-3 px-4">{request.platform}</td>
                    <td className="py-3 px-4 font-mono text-xs">{request.txId.substring(0, 12)}...</td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' && (
                        <span className="px-2 py-1 bg-warning/20 text-warning rounded-full text-xs">
                          قيد المراجعة
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs">
                          تمت الموافقة
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="px-2 py-1 bg-error/20 text-error rounded-full text-xs">
                          مرفوض
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          className="p-2 bg-info/10 text-info rounded-lg"
                          onClick={() => {
                            setSelectedRequest(request);
                            document.getElementById('details-modal')?.classList.add('modal-open');
                          }}
                          title="عرض التفاصيل"
                        >
                          <FaEye />
                        </button>

                        {request.status === 'pending' && (
                          <>
                            <button
                              className="p-2 bg-success/10 text-success rounded-lg"
                              onClick={() => {
                                setSelectedRequest(request);
                                document.getElementById('approve-modal')?.classList.add('modal-open');
                              }}
                              title="موافقة"
                            >
                              <FaCheckCircle />
                            </button>

                            <button
                              className="p-2 bg-error/10 text-error rounded-lg"
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

                        {request.proofImageUrl && (
                          <a
                            href={request.proofImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-primary/10 text-primary rounded-lg"
                            title="تنزيل الإثبات"
                          >
                            <FaFileDownload />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة عرض التفاصيل */}
      <div className="modal" id="details-modal">
        <div className="modal-box max-w-3xl">
          <h3 className="font-bold text-lg mb-4">تفاصيل طلب الإيداع</h3>

          {selectedRequest && (
            <div>
              <div className="bg-background-lighter p-4 rounded-lg mb-6">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full mr-3 ${
                    selectedRequest.status === 'pending' ? 'bg-warning/20 text-warning' :
                    selectedRequest.status === 'approved' ? 'bg-success/20 text-success' :
                    'bg-error/20 text-error'
                  }`}>
                    {selectedRequest.status === 'pending' && <FaSpinner />}
                    {selectedRequest.status === 'approved' && <FaCheckCircle />}
                    {selectedRequest.status === 'rejected' && <FaTimesCircle />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">حالة الطلب</p>
                    <p className="font-medium">
                      {selectedRequest.status === 'pending' && 'قيد المراجعة'}
                      {selectedRequest.status === 'approved' && 'تمت الموافقة'}
                      {selectedRequest.status === 'rejected' && 'مرفوض'}
                    </p>
                  </div>
                  <div className="mr-auto">
                    <p className="text-sm text-foreground-muted">المبلغ</p>
                    <p className="font-bold text-xl">{selectedRequest.amount.toFixed(2)} USDT</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-foreground-muted text-sm">تاريخ الطلب</p>
                    <p>{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-foreground-muted text-sm">المنصة</p>
                    <p>{selectedRequest.platform}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-medium mb-3">معلومات المستخدم</h4>
                  <div>
                    <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                    <p className="font-mono">{selectedRequest.userId}</p>
                  </div>
                </div>

                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-medium mb-3">معلومات المعاملة</h4>
                  <div>
                    <p className="text-foreground-muted text-sm">معرف الطلب</p>
                    <p className="font-mono">{selectedRequest.id}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-foreground-muted text-sm">رقم المعاملة (TXID)</p>
                    <p className="font-mono break-all text-xs">{selectedRequest.txId}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="bg-background-lighter p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">ملاحظات</h4>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.proofImageUrl && (
                <div className="bg-background-lighter p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">إثبات التحويل</h4>
                  <div className="flex justify-center">
                    <img
                      src={selectedRequest.proofImageUrl}
                      alt="إثبات التحويل"
                      className="max-h-64 rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        document.getElementById('proof-error')?.classList.remove('hidden');
                      }}
                    />
                    <div id="proof-error" className="hidden text-center p-4">
                      <p className="text-foreground-muted">تعذر تحميل الصورة</p>
                      <a
                        href={selectedRequest.proofImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm mt-2"
                      >
                        <FaFileDownload className="ml-2" />
                        فتح الإثبات في نافذة جديدة
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="bg-background-lighter p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">معلومات المراجعة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-foreground-muted text-sm">تمت المراجعة بواسطة</p>
                      <p className="font-mono">{selectedRequest.reviewedBy}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">تاريخ المراجعة</p>
                      <p>{formatDate(selectedRequest.reviewedAt)}</p>
                    </div>
                    {selectedRequest.rejectReason && (
                      <div className="col-span-2">
                        <p className="text-foreground-muted text-sm">سبب الرفض</p>
                        <p>{selectedRequest.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors"
                  onClick={() => document.getElementById('details-modal')?.classList.remove('modal-open')}
                >
                  إغلاق
                </button>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors"
                      onClick={() => {
                        document.getElementById('details-modal')?.classList.remove('modal-open');
                        document.getElementById('approve-modal')?.classList.add('modal-open');
                      }}
                    >
                      <FaCheckCircle className="inline ml-2" />
                      موافقة
                    </button>

                    <button
                      className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors"
                      onClick={() => {
                        document.getElementById('details-modal')?.classList.remove('modal-open');
                        document.getElementById('reject-modal')?.classList.add('modal-open');
                      }}
                    >
                      <FaTimesCircle className="inline ml-2" />
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الموافقة */}
      <div className="modal" id="approve-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 flex items-center text-success">
            <FaCheckCircle className="ml-2" />
            تأكيد الموافقة على طلب الإيداع
          </h3>

          {selectedRequest && (
            <div>
              <div className="bg-success/10 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-muted">المبلغ:</span>
                  <span className="font-bold text-xl">{selectedRequest.amount.toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-muted">المستخدم:</span>
                  <span className="font-mono">{selectedRequest.userId.substring(0, 12)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">رقم المعاملة:</span>
                  <span className="font-mono text-xs">{selectedRequest.txId.substring(0, 16)}...</span>
                </div>
              </div>

              <div className="bg-info/10 p-4 rounded-lg mb-6">
                <p className="text-info font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  معلومات هامة
                </p>
                <ul className="text-sm list-disc mr-5 mt-2 space-y-1">
                  <li>تأكد من التحقق من رقم المعاملة (TXID) والتأكد من أن المبلغ قد تم استلامه بالفعل في محفظتك.</li>
                  <li>بعد الموافقة، سيتم إضافة المبلغ تلقائيًا إلى رصيد المستخدم.</li>
                  <li>سيتم إنشاء سجل معاملة جديد في قاعدة البيانات.</li>
                </ul>
              </div>

              <p className="mb-6 text-center font-medium">
                هل أنت متأكد من الموافقة على طلب الإيداع هذا؟
              </p>

              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors"
                  onClick={() => document.getElementById('approve-modal')?.classList.remove('modal-open')}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>

                <button
                  className="px-6 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center"
                  onClick={() => {
                    handleApproveDeposit(selectedRequest.id || '');
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
                    <>
                      <FaCheckCircle className="ml-2" />
                      تأكيد الموافقة
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الرفض */}
      <div className="modal" id="reject-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 flex items-center text-error">
            <FaTimesCircle className="ml-2" />
            تأكيد رفض طلب الإيداع
          </h3>

          {selectedRequest && (
            <div>
              <div className="bg-error/10 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-muted">المبلغ:</span>
                  <span className="font-bold text-xl">{selectedRequest.amount.toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-muted">المستخدم:</span>
                  <span className="font-mono">{selectedRequest.userId.substring(0, 12)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">رقم المعاملة:</span>
                  <span className="font-mono text-xs">{selectedRequest.txId.substring(0, 16)}...</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">سبب الرفض <span className="text-error">*</span></label>
                <textarea
                  className="w-full p-3 bg-background-light border border-background-lighter rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="يرجى كتابة سبب رفض طلب الإيداع بوضوح ليتمكن المستخدم من فهم السبب..."
                  required
                ></textarea>
                {!rejectReason.trim() && (
                  <p className="text-error text-sm mt-1">يجب كتابة سبب الرفض</p>
                )}
              </div>

              <div className="bg-info/10 p-4 rounded-lg mb-6">
                <p className="text-info font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  معلومات هامة
                </p>
                <p className="text-sm mt-2">
                  سيتم إرسال سبب الرفض إلى المستخدم. يرجى كتابة سبب واضح ومفهوم.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors"
                  onClick={() => document.getElementById('reject-modal')?.classList.remove('modal-open')}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>

                <button
                  className="px-6 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors flex items-center"
                  onClick={() => {
                    if (rejectReason.trim()) {
                      handleRejectDeposit(selectedRequest.id || '');
                      document.getElementById('reject-modal')?.classList.remove('modal-open');
                    }
                  }}
                  disabled={isProcessing || !rejectReason.trim()}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    <>
                      <FaTimesCircle className="ml-2" />
                      تأكيد الرفض
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
