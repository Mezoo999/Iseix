'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle, FaEye, FaFileDownload } from 'react-icons/fa';

import { useAuth } from '@/contexts/AuthContext';
import { getAllWithdrawalRequests, approveWithdrawalRequest, rejectWithdrawalRequest, WithdrawalRequest } from '@/services/withdrawals';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processing'>('pending');

  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [txId, setTxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    try {
      let status: 'pending' | 'approved' | 'rejected' | 'processing' | undefined;

      if (filter !== 'all') {
        status = filter;
      }

      const requests = await getAllWithdrawalRequests(status);
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      setError('حدث خطأ أثناء تحميل طلبات السحب');
    } finally {
      setIsLoading(false);
    }
  };

  // الموافقة على طلب السحب
  const handleApproveWithdrawal = async (requestId: string) => {
    if (!currentUser) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await approveWithdrawalRequest(requestId, currentUser.uid, txId || undefined);
      setSuccess('تمت الموافقة على طلب السحب بنجاح');
      setSelectedRequest(null);
      setTxId('');
      loadWithdrawalRequests();
    } catch (error) {
      console.error('Error approving withdrawal request:', error);
      setError('حدث خطأ أثناء الموافقة على طلب السحب');
    } finally {
      setIsProcessing(false);
    }
  };

  // رفض طلب السحب
  const handleRejectWithdrawal = async (requestId: string) => {
    if (!currentUser || !rejectReason) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await rejectWithdrawalRequest(requestId, currentUser.uid, rejectReason);
      setSuccess('تم رفض طلب السحب بنجاح');
      setSelectedRequest(null);
      setRejectReason('');
      loadWithdrawalRequests();
    } catch (error) {
      console.error('Error rejecting withdrawal request:', error);
      setError('حدث خطأ أثناء رفض طلب السحب');
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة طلبات السحب</h1>
        <p className="text-foreground-muted">مراجعة والموافقة على طلبات السحب من المستخدمين</p>
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

          <button
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            onClick={loadWithdrawalRequests}
            disabled={isLoading}
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : 'تحديث'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : withdrawalRequests.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            لا توجد طلبات سحب {filter !== 'all' ? `بحالة "${getStatusText(filter)}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-dark text-white">
                <tr>
                  <th className="py-3 px-4 text-right">المعرف</th>
                  <th className="py-3 px-4 text-right">التاريخ</th>
                  <th className="py-3 px-4 text-right">المستخدم</th>
                  <th className="py-3 px-4 text-right">المبلغ</th>
                  <th className="py-3 px-4 text-right">الشبكة</th>
                  <th className="py-3 px-4 text-right">العنوان</th>
                  <th className="py-3 px-4 text-right">الحالة</th>
                  <th className="py-3 px-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((request) => (
                  <tr key={request.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4 font-mono text-xs">{request.id?.substring(0, 8)}</td>
                    <td className="py-3 px-4">{formatDate(request.createdAt)}</td>
                    <td className="py-3 px-4 font-mono text-xs">{request.userId.substring(0, 8)}</td>
                    <td className="py-3 px-4 font-medium">{request.amount.toFixed(2)} {request.coin}</td>
                    <td className="py-3 px-4">{request.network}</td>
                    <td className="py-3 px-4 font-mono text-xs">{request.address.substring(0, 10)}...</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
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

                        {(request.status === 'pending' || request.status === 'processing') && (
                          <>
                            <button
                              className="p-2 bg-success/10 text-success rounded-lg"
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
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">تفاصيل طلب السحب</h3>

          {selectedRequest && (
            <div>
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
                  <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                  <p className="font-mono">{selectedRequest.userId}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-sm">المبلغ</p>
                  <p className="font-medium">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</p>
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
              </div>

              <div className="mb-4">
                <p className="text-foreground-muted text-sm">عنوان المحفظة</p>
                <p className="font-mono break-all">{selectedRequest.address}</p>
              </div>

              {selectedRequest.txId && (
                <div className="mb-4">
                  <p className="text-foreground-muted text-sm">رقم المعاملة (TXID)</p>
                  <p className="font-mono break-all">{selectedRequest.txId}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="mb-4">
                  <p className="text-foreground-muted text-sm">ملاحظات</p>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="mb-4">
                  <p className="text-foreground-muted text-sm">تمت المراجعة بواسطة</p>
                  <p className="font-mono">{selectedRequest.reviewedBy}</p>
                  <p className="text-foreground-muted text-sm mt-2">تاريخ المراجعة</p>
                  <p>{formatDate(selectedRequest.reviewedAt)}</p>
                </div>
              )}
            </div>
          )}

          <div className="modal-action">
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
                هل أنت متأكد من الموافقة على طلب السحب هذا؟ سيتم سحب <span className="font-bold">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</span> من رصيد المستخدم.
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
                  تأكد من التحقق من عنوان المحفظة والشبكة قبل الموافقة على طلب السحب.
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
                هل أنت متأكد من رفض طلب السحب هذا؟ سيتم إعادة <span className="font-bold">{selectedRequest.amount.toFixed(2)} {selectedRequest.coin}</span> إلى رصيد المستخدم.
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
