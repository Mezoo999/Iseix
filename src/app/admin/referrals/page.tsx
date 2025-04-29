'use client';

import { useState, useEffect } from 'react';
import { FaUserTag, FaSearch, FaFilter, FaDownload, FaSpinner, FaUsers, FaChartLine } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  status: string;
  level: number;
  commission: number;
  createdAt: any;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrers: number;
  totalCommission: number;
  topReferrer: {
    name: string;
    count: number;
  };
}

export default function AdminReferrals() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrers: 0,
    totalCommission: 0,
    topReferrer: {
      name: '',
      count: 0
    }
  });

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إدارة الإحالات');

        // التحقق من وجود فلتر في عنوان URL
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam && ['all', 'active', 'pending'].includes(filterParam)) {
          setFilter(filterParam as any);
        }

        loadReferrals();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadReferrals = async () => {
    try {
      setIsLoading(true);

      let referralsQuery = query(
        collection(db, 'referrals'),
        orderBy('createdAt', 'desc')
      );

      const referralsSnapshot = await getDocs(referralsQuery);

      const referralsData: Referral[] = [];
      let totalCommission = 0;
      const referrersMap = new Map();

      referralsSnapshot.forEach((doc) => {
        const data = doc.data();
        const referral = {
          id: doc.id,
          referrerId: data.referrerId || '',
          referrerName: data.referrerName || 'مستخدم غير معروف',
          referredId: data.referredId || '',
          referredName: data.referredName || 'مستخدم غير معروف',
          status: data.status || 'معلق',
          level: data.level || 0,
          commission: data.commission || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        };

        referralsData.push(referral);
        totalCommission += referral.commission;

        // حساب عدد الإحالات لكل مستخدم
        if (referrersMap.has(referral.referrerId)) {
          referrersMap.set(referral.referrerId, {
            name: referral.referrerName,
            count: referrersMap.get(referral.referrerId).count + 1
          });
        } else {
          referrersMap.set(referral.referrerId, {
            name: referral.referrerName,
            count: 1
          });
        }
      });

      // حساب عدد المستخدمين النشطين في الإحالات
      const activeReferrers = referrersMap.size;

      // العثور على أفضل مستخدم في الإحالات
      let topReferrer = { name: '', count: 0 };
      referrersMap.forEach((value, key) => {
        if (value.count > topReferrer.count) {
          topReferrer = value;
        }
      });

      setReferrals(referralsData);
      setFilteredReferrals(referralsData);
      setStats({
        totalReferrals: referralsData.length,
        activeReferrers,
        totalCommission,
        topReferrer
      });
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = referrals;

    // تطبيق الفلتر
    if (filter === 'active') {
      filtered = filtered.filter(referral => referral.status.toLowerCase() === 'active' || referral.status === 'نشط');
    } else if (filter === 'pending') {
      filtered = filtered.filter(referral => referral.status.toLowerCase() === 'pending' || referral.status === 'معلق');
    }

    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(
        referral =>
          referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          referral.referredName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReferrals(filtered);
  }, [filter, searchTerm, referrals]);

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
      case 'active':
      case 'نشط':
        return 'bg-success/20 text-success';
      case 'pending':
      case 'معلق':
        return 'bg-warning/20 text-warning';
      case 'inactive':
      case 'غير نشط':
        return 'bg-error/20 text-error';
      default:
        return 'bg-info/20 text-info';
    }
  };

  const getLevelClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-primary/20 text-primary';
      case 2:
        return 'bg-info/20 text-info';
      case 3:
        return 'bg-success/20 text-success';
      default:
        return 'bg-foreground-muted/20 text-foreground-muted';
    }
  };

  const exportToCSV = () => {
    const headers = ['المعرف', 'المحيل', 'المحال', 'الحالة', 'المستوى', 'العمولة', 'التاريخ'];

    const rows = filteredReferrals.map(referral => [
      referral.id,
      referral.referrerName,
      referral.referredName,
      referral.status,
      referral.level,
      referral.commission.toFixed(2),
      new Date(referral.createdAt).toLocaleString('ar-SA')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة الإحالات</h1>
        <p className="text-foreground-muted">عرض وإدارة نظام الإحالات والمكافآت.</p>
      </div>
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-primary/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary ml-2">
              <FaUserTag />
            </div>
            <h3 className="font-bold">إجمالي الإحالات</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-success/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-success/10 text-success ml-2">
              <FaUsers />
            </div>
            <h3 className="font-bold">المستخدمين النشطين</h3>
          </div>
          <p className="text-2xl font-bold">{stats.activeReferrers}</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-info/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-info/10 text-info ml-2">
              <FaChartLine />
            </div>
            <h3 className="font-bold">إجمالي العمولات</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalCommission.toFixed(2)} USDT</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-warning/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-warning/10 text-warning ml-2">
              <FaUserTag />
            </div>
            <h3 className="font-bold">أفضل محيل</h3>
          </div>
          <p className="text-lg font-bold truncate">{stats.topReferrer.name}</p>
          <p className="text-sm">{stats.topReferrer.count} إحالة</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FaSearch className="text-foreground-muted" />
          </div>
          <input
            type="text"
            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full md:w-80 p-3 pr-10"
            placeholder="البحث في الإحالات..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-outline flex items-center gap-2">
              <FaFilter />
              {filter === 'all' ? 'جميع الإحالات' :
               filter === 'active' ? 'الإحالات النشطة' : 'الإحالات المعلقة'}
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-background-light rounded-box w-52 mt-2">
              <li><a onClick={() => handleFilterChange('all')} className={filter === 'all' ? 'active' : ''}>جميع الإحالات</a></li>
              <li><a onClick={() => handleFilterChange('active')} className={filter === 'active' ? 'active' : ''}>الإحالات النشطة</a></li>
              <li><a onClick={() => handleFilterChange('pending')} className={filter === 'pending' ? 'active' : ''}>الإحالات المعلقة</a></li>
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
            <h3 className="font-bold">الإحالات ({filteredReferrals.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">المحيل</th>
                <th className="py-3 px-4 text-right">المحال</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">المستوى</th>
                <th className="py-3 px-4 text-center">العمولة (USDT)</th>
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
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    لا توجد إحالات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      <div className="font-medium">{referral.referrerName}</div>
                      <div className="text-xs text-foreground-muted">{referral.referrerId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{referral.referredName}</div>
                      <div className="text-xs text-foreground-muted">{referral.referredId}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(referral.status)}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getLevelClass(referral.level)}`}>
                        المستوى {referral.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {referral.commission.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {new Date(referral.createdAt).toLocaleString('ar-SA')}
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
