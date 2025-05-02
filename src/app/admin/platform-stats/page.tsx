'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaMoneyBillWave, FaGlobe, FaServer, FaSave } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { getPlatformStats, updatePlatformStats, PlatformStats } from '@/services/platformStats';
import { toast } from 'react-hot-toast';

export default function PlatformStatsPage() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!loading && (!currentUser || !userData?.isOwner)) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // جلب إحصائيات المنصة
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const platformStats = await getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error('خطأ في جلب إحصائيات المنصة:', error);
        toast.error('حدث خطأ أثناء جلب إحصائيات المنصة');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && userData?.isOwner) {
      fetchStats();
    }
  }, [currentUser, userData]);

  // تحديث الإحصائيات
  const handleUpdateStats = async () => {
    if (!stats) return;

    setIsSaving(true);
    try {
      const success = await updatePlatformStats(stats);
      if (success) {
        toast.success('تم تحديث إحصائيات المنصة بنجاح');

        // إظهار رسالة توضح أن التغييرات ستظهر في الصفحة الرئيسية
        setTimeout(() => {
          toast.success('تم تحديث الإحصائيات في الصفحة الرئيسية', {
            icon: '🔄',
            duration: 5000
          });
        }, 1000);
      } else {
        toast.error('حدث خطأ أثناء تحديث إحصائيات المنصة');
      }
    } catch (error) {
      console.error('خطأ في تحديث إحصائيات المنصة:', error);
      toast.error('حدث خطأ أثناء تحديث إحصائيات المنصة');
    } finally {
      setIsSaving(false);
    }
  };

  // تحديث قيمة إحصائية
  const handleStatChange = (key: keyof PlatformStats, value: number) => {
    if (!stats) return;

    setStats({
      ...stats,
      [key]: value
    });
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!currentUser || !userData?.isOwner) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">إدارة إحصائيات المنصة</h1>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleUpdateStats}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FaSave />
            )}
            حفظ التغييرات
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card card-primary p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">عدد المستخدمين النشطين</h3>
                  <p className="text-sm text-foreground-muted">عدد المستخدمين النشطين على المنصة</p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="form-input w-full"
                  value={stats.activeUsers}
                  onChange={(e) => handleStatChange('activeUsers', parseInt(e.target.value) || 0)}
                  min="0"
                />
                <span className="mr-2 text-foreground-muted">مستخدم</span>
              </div>
            </div>

            <div className="card card-primary p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">الاستثمارات المُدارة</h3>
                  <p className="text-sm text-foreground-muted">حجم الاستثمارات المُدارة (بالمليون دولار)</p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="form-input w-full"
                  value={stats.managedInvestments}
                  onChange={(e) => handleStatChange('managedInvestments', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
                <span className="mr-2 text-foreground-muted">مليون دولار</span>
              </div>
            </div>

            <div className="card card-primary p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
                  <FaGlobe className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">عدد الدول</h3>
                  <p className="text-sm text-foreground-muted">عدد الدول التي يتواجد فيها مستخدمو المنصة</p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="form-input w-full"
                  value={stats.countries}
                  onChange={(e) => handleStatChange('countries', parseInt(e.target.value) || 0)}
                  min="0"
                  max="195"
                />
                <span className="mr-2 text-foreground-muted">دولة</span>
              </div>
            </div>

            <div className="card card-primary p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
                  <FaServer className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">وقت التشغيل</h3>
                  <p className="text-sm text-foreground-muted">نسبة وقت تشغيل المنصة (%)</p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="form-input w-full"
                  value={stats.uptime}
                  onChange={(e) => handleStatChange('uptime', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="mr-2 text-foreground-muted">%</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-background-light/30 rounded-lg">
          <h3 className="text-lg font-bold mb-2">ملاحظات:</h3>
          <ul className="list-disc list-inside space-y-2 text-foreground-muted">
            <li>هذه الإحصائيات تظهر في الصفحة الرئيسية للمنصة.</li>
            <li>يتم تحديث آخر تاريخ تعديل تلقائيًا عند حفظ التغييرات.</li>
            <li>تأكد من استخدام أرقام واقعية لبناء الثقة مع المستخدمين.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
