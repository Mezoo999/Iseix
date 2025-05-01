'use client';

import { useState } from 'react';
import { FaArrowUp, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';

export default function UpdateMembershipPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: Array<{ userId: string; oldLevel: string; newLevel: string; success: boolean }>;
  } | null>(null);

  const handleUpdateMembership = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/update-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.message || (data.success ? 'تم تحديث مستويات العضوية بنجاح' : 'حدث خطأ أثناء تحديث مستويات العضوية'),
        details: data.results?.details
      });
    } catch (error) {
      console.error('Error updating membership levels:', error);
      setResult({
        success: false,
        message: 'حدث خطأ أثناء تحديث مستويات العضوية'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="تحديث مستويات العضوية"
      description="تحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة"
    >
      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary ml-3">
            <FaArrowUp className="text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold">تحديث مستويات العضوية</h2>
            <p className="text-foreground-muted">
              سيقوم هذا الإجراء بتحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة.
            </p>
          </div>
        </div>

        <div className="bg-info/10 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-info ml-2 mt-1" />
            <div>
              <p className="font-medium text-info mb-2">معلومات هامة</p>
              <ul className="list-disc list-inside text-sm">
                <li>سيتم تحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة.</li>
                <li>قد تستغرق هذه العملية بعض الوقت إذا كان هناك عدد كبير من المستخدمين.</li>
                <li>سيتم عرض تفاصيل التحديث بعد الانتهاء من العملية.</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          className={`w-full p-4 rounded-lg flex items-center justify-center ${
            isLoading
              ? 'bg-primary/50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark'
          } text-white transition-colors`}
          onClick={handleUpdateMembership}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin ml-2" />
              جاري تحديث مستويات العضوية...
            </>
          ) : (
            <>
              <FaArrowUp className="ml-2" />
              تحديث مستويات العضوية
            </>
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'
          }`}>
            <div className="flex items-center mb-2">
              {result.success ? (
                <FaCheckCircle className="text-success ml-2" />
              ) : (
                <FaExclamationTriangle className="text-error ml-2" />
              )}
              <p className={`font-medium ${result.success ? 'text-success' : 'text-error'}`}>
                {result.message}
              </p>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">تفاصيل التحديث:</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background-lighter/50">
                      <tr>
                        <th className="py-2 px-3 text-right">معرف المستخدم</th>
                        <th className="py-2 px-3 text-center">المستوى القديم</th>
                        <th className="py-2 px-3 text-center">المستوى الجديد</th>
                        <th className="py-2 px-3 text-left">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((detail, index) => (
                        <tr key={index} className="border-b border-background-lighter">
                          <td className="py-2 px-3">{detail.userId.substring(0, 8)}...</td>
                          <td className="py-2 px-3 text-center">{detail.oldLevel}</td>
                          <td className="py-2 px-3 text-center">{detail.newLevel}</td>
                          <td className="py-2 px-3 text-left">
                            {detail.success ? (
                              <span className="text-success">تم التحديث</span>
                            ) : (
                              <span className="text-error">فشل</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
