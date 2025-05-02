'use client';

import { useState, useEffect } from 'react';
import {
  FaUsers, FaMoneyBillWave, FaExchangeAlt, FaUserTag, FaChartLine,
  FaWallet, FaTasks, FaCrown, FaCog, FaBell, FaSearch, FaCheck,
  FaTimes, FaEdit, FaBan, FaTrash, FaUserShield, FaBolt, FaUserPlus,
  FaSpinner, FaArrowUp, FaPlus, FaUserLock, FaGift
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, updateDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AdminProtected from '@/components/admin/AdminProtected';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminCard from '@/components/admin/AdminCard';
import StatCard from '@/components/ui/StatCard';
import { useRouter } from 'next/navigation';

// استيراد مكونات الرسوم البيانية
import AdminChart from '@/components/admin/charts/AdminChart';
import LineChart from '@/components/admin/charts/LineChart';
import PieChart from '@/components/admin/charts/PieChart';
import BarChart from '@/components/admin/charts/BarChart';

// استيراد خدمة الإحصائيات
import { getStatistics, Statistics } from '@/services/statistics';

export default function AdminDashboard() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0,
    totalReferrals: 0,
    totalProfit: 0,
    depositsByDay: [],
    withdrawalsByDay: [],
    usersByMembership: [],
    tasksByDay: [],
    topReferrers: []
  });

  // حالة المستخدمين
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // حالة الإيداعات
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [depositSearchTerm, setDepositSearchTerm] = useState('');
  const [depositStatusFilter, setDepositStatusFilter] = useState('all');

  // حالة السحوبات
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [withdrawalSearchTerm, setWithdrawalSearchTerm] = useState('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all');

  // حالة التحميل
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);

  // جلب الإحصائيات
  const fetchStats = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setIsChartLoading(true);

      // استخدام خدمة الإحصائيات لجلب جميع البيانات
      const statistics = await getStatistics();
      setStats(statistics);

      console.log('تم جلب الإحصائيات بنجاح:', statistics);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
      setIsChartLoading(false);
    }
  };

  // جلب الإحصائيات عند تحميل الصفحة
  useEffect(() => {
    // نعتمد على مكون AdminProtected للتحقق من الصلاحيات
    // ونقوم فقط بجلب الإحصائيات عندما يكون المستخدم مسجل الدخول ولديه صلاحيات المالك
    if (!loading && currentUser && userData?.isOwner) {
      console.log('مرحبًا بك في لوحة تحكم المشرف');
      fetchStats();
    }
  }, [currentUser, userData, loading]);

  return (
    <div className="container mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/20 text-primary ml-4">
            <FaUserShield className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم المشرف</h1>
            <p className="text-foreground-muted">مرحبًا {userData?.displayName || 'المشرف'}، يمكنك إدارة المنصة من هنا.</p>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={<FaUsers />}
          changeText={`${stats.activeUsers} مستخدم نشط`}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          title="إجمالي الإيداعات"
          value={`${stats.totalDeposits.toFixed(2)} USDT`}
          icon={<FaMoneyBillWave />}
          changeText={`${stats.pendingDeposits} طلب معلق`}
          variant="success"
          delay={0.2}
        />
        <StatCard
          title="إجمالي السحوبات"
          value={`${stats.totalWithdrawals.toFixed(2)} USDT`}
          icon={<FaExchangeAlt />}
          changeText={`${stats.pendingWithdrawals} طلب معلق`}
          variant="warning"
          delay={0.3}
        />
        <StatCard
          title="إجمالي الإحالات"
          value={stats.totalReferrals}
          icon={<FaUserTag />}
          changeText={`${stats.totalProfit.toFixed(2)} USDT أرباح`}
          variant="info"
          delay={0.4}
        />
      </div>

      {/* الإجراءات السريعة */}
      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-8">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full bg-primary/10 text-primary ml-3">
            <FaBolt />
          </div>
          <h2 className="text-xl font-bold">الإجراءات السريعة</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <button
            className="flex flex-col items-center justify-center p-4 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
            onClick={() => router.push('/admin/deposits?filter=pending')}
          >
            <FaMoneyBillWave className="text-2xl mb-2" />
            <span className="text-sm font-bold">الإيداعات</span>
            <span className="text-xs mt-1">{stats.pendingDeposits} معلق</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors"
            onClick={() => router.push('/admin/withdrawals?filter=pending')}
          >
            <FaWallet className="text-2xl mb-2" />
            <span className="text-sm font-bold">السحوبات</span>
            <span className="text-xs mt-1">{stats.pendingWithdrawals} معلق</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            onClick={() => router.push('/admin/users')}
          >
            <FaUsers className="text-2xl mb-2" />
            <span className="text-sm font-bold">المستخدمين</span>
            <span className="text-xs mt-1">{stats.totalUsers} مستخدم</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors"
            onClick={() => router.push('/admin/roles')}
          >
            <FaUserLock className="text-2xl mb-2" />
            <span className="text-sm font-bold">الصلاحيات</span>
            <span className="text-xs mt-1">إدارة الأدوار</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            onClick={() => router.push('/admin/platform-stats')}
          >
            <FaChartLine className="text-2xl mb-2" />
            <span className="text-sm font-bold">الإحصائيات</span>
            <span className="text-xs mt-1">إحصائيات المنصة</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
            onClick={() => router.push('/admin/lucky-wheel')}
          >
            <FaGift className="text-2xl mb-2" />
            <span className="text-sm font-bold">عجلة الحظ</span>
            <span className="text-xs mt-1">إدارة المكافآت</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-4 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
            onClick={() => router.push('/admin/settings')}
          >
            <FaCog className="text-2xl mb-2" />
            <span className="text-sm font-bold">الإعدادات</span>
            <span className="text-xs mt-1">ضبط المنصة</span>
          </button>
        </div>
      </div>

      {/* أقسام لوحة التحكم */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* قسم إدارة المستخدمين والصلاحيات */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary ml-3">
              <FaUsers className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">المستخدمين والصلاحيات</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-foreground-muted">إجمالي المستخدمين</div>
            </div>
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{stats.activeUsers}</div>
              <div className="text-xs text-foreground-muted">المستخدمين النشطين</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/users')}
            >
              <FaUsers className="ml-2" />
              إدارة المستخدمين
            </button>
            <button
              className="w-full p-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/roles')}
            >
              <FaUserLock className="ml-2" />
              الأدوار والصلاحيات
            </button>
          </div>
        </div>

        {/* قسم إدارة المعاملات المالية */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-success/10 hover:border-success/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-success/10 text-success ml-3">
              <FaExchangeAlt className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">المعاملات المالية</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{stats.totalDeposits.toFixed(1)}</div>
              <div className="text-xs text-foreground-muted">إجمالي الإيداعات</div>
            </div>
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{stats.totalWithdrawals.toFixed(1)}</div>
              <div className="text-xs text-foreground-muted">إجمالي السحوبات</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="p-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/deposits')}
              >
                <FaMoneyBillWave className="ml-2" />
                الإيداعات
              </button>
              <button
                className="p-3 bg-warning text-white rounded-lg hover:bg-warning-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/withdrawals')}
              >
                <FaWallet className="ml-2" />
                السحوبات
              </button>
            </div>
            <button
              className="w-full p-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/transactions')}
            >
              <FaExchangeAlt className="ml-2" />
              جميع المعاملات
            </button>
          </div>
        </div>

        {/* قسم إدارة المنصة */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-warning/10 hover:border-warning/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-warning/10 text-warning ml-3">
              <FaCog className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">إدارة المنصة</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
              <div className="text-xs text-foreground-muted">إجمالي الإحالات</div>
            </div>
            <div className="bg-background-lighter/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">6</div>
              <div className="text-xs text-foreground-muted">مستويات العضوية</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/referrals')}
              >
                <FaUserTag className="ml-2" />
                الإحالات
              </button>
              <button
                className="p-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/membership')}
              >
                <FaCrown className="ml-2" />
                العضويات
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="p-3 bg-warning text-white rounded-lg hover:bg-warning-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/tasks')}
              >
                <FaTasks className="ml-2" />
                المهام
              </button>
              <button
                className="p-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
                onClick={() => router.push('/admin/notifications')}
              >
                <FaBell className="ml-2" />
                الإشعارات
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات والرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* قسم إدارة المهام */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-warning/10 hover:border-warning/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-warning/10 text-warning ml-3">
              <FaTasks className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">إدارة المهام</h2>
          </div>
          <p className="text-foreground-muted mb-4">إدارة المهام اليومية ومعدلات الربح</p>

          <div className="bg-background-lighter/50 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">عدد المهام اليومية:</span>
              <span className="font-bold">3 مهام</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">معدلات الربح:</span>
              <span className="font-bold text-warning">2.76% - 5.04%</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full p-3 bg-warning text-white rounded-lg hover:bg-warning-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/tasks')}
            >
              <FaTasks className="ml-2" />
              إدارة المهام
            </button>
            <button
              className="w-full p-3 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/tasks/rewards')}
            >
              <FaChartLine className="ml-2" />
              تقارير مكافآت المهام
            </button>
          </div>
        </div>

        {/* قسم الإشعارات */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-error/10 hover:border-error/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-error/10 text-error ml-3">
              <FaBell className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">إدارة الإشعارات</h2>
          </div>
          <p className="text-foreground-muted mb-4">إرسال وإدارة الإشعارات للمستخدمين</p>

          <div className="bg-background-lighter/50 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">إشعارات النظام:</span>
              <span className="font-bold">متاحة</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">إشعارات المستخدمين:</span>
              <span className="font-bold text-error">متاحة</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full p-3 bg-error text-white rounded-lg hover:bg-error-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/notifications')}
            >
              <FaBell className="ml-2" />
              إدارة الإشعارات
            </button>
            <button
              className="w-full p-3 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/notifications/new')}
            >
              <FaBell className="ml-2" />
              إرسال إشعار جديد
            </button>
          </div>
        </div>

        {/* قسم الإعدادات */}
        <div className="bg-background-light p-6 rounded-xl shadow-sm border border-info/10 hover:border-info/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-info/10 text-info ml-3">
              <FaCog className="text-xl" />
            </div>
            <h2 className="text-xl font-bold">إعدادات المنصة</h2>
          </div>
          <p className="text-foreground-muted mb-4">تعديل إعدادات المنصة العامة</p>

          <div className="bg-background-lighter/50 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">إصدار المنصة:</span>
              <span className="font-bold">1.0.0</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">حالة المنصة:</span>
              <span className="font-bold text-success">نشطة</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full p-3 bg-info text-white rounded-lg hover:bg-info-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/settings')}
            >
              <FaCog className="ml-2" />
              إدارة الإعدادات
            </button>
            <button
              className="w-full p-3 bg-background-lighter text-foreground rounded-lg hover:bg-background-light/80 transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin/settings/system')}
            >
              <FaCog className="ml-2" />
              إعدادات النظام
            </button>
          </div>
        </div>
      </div>

      {/* قسم الإحصائيات المتقدمة */}
      <div className="bg-background-light p-6 rounded-xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary ml-3">
            <FaChartLine className="text-xl" />
          </div>
          <h2 className="text-xl font-bold">الإحصائيات المتقدمة</h2>
        </div>
        <p className="text-foreground-muted mb-4">عرض إحصائيات متقدمة ومؤشرات أداء المنصة</p>

        {isChartLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <AdminChart
                title="الإيداعات اليومية"
                description="إجمالي مبالغ الإيداعات خلال الأسبوع الماضي"
                type="line"
                delay={0.1}
              >
                <LineChart
                  data={stats.depositsByDay}
                  color="#3b82f6"
                  showArea={true}
                />
              </AdminChart>

              <AdminChart
                title="توزيع المستخدمين حسب مستوى العضوية"
                description="نسبة المستخدمين في كل مستوى من مستويات العضوية"
                type="pie"
                delay={0.2}
              >
                <PieChart
                  data={stats.usersByMembership}
                  colors={['#3b82f6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554']}
                />
              </AdminChart>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminChart
                title="أداء المهام اليومية"
                description="عدد المهام المكتملة خلال الأسبوع الماضي"
                type="bar"
                delay={0.3}
              >
                <BarChart
                  data={stats.tasksByDay}
                  color="#3b82f6"
                />
              </AdminChart>

              <AdminChart
                title="أعلى المستخدمين إحالة"
                description="المستخدمين الأكثر نشاطًا في الإحالات"
                type="bar"
                delay={0.4}
              >
                <BarChart
                  data={stats.topReferrers}
                  horizontal={true}
                  colors={['#3b82f6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A']}
                />
              </AdminChart>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-lighter/50 p-4 rounded-lg">
            <h3 className="text-sm text-foreground-muted mb-2">نسبة الإيداعات إلى السحوبات</h3>
            <p className="text-2xl font-bold text-primary">
              {stats.totalWithdrawals > 0
                ? (stats.totalDeposits / stats.totalWithdrawals).toFixed(2)
                : '∞'}
            </p>
          </div>

          <div className="bg-background-lighter/50 p-4 rounded-lg">
            <h3 className="text-sm text-foreground-muted mb-2">متوسط الإيداع</h3>
            <p className="text-2xl font-bold text-success">
              {stats.totalDeposits > 0 && stats.pendingDeposits > 0
                ? (stats.totalDeposits / (stats.pendingDeposits + stats.totalDeposits)).toFixed(2)
                : '0.00'} USDT
            </p>
          </div>

          <div className="bg-background-lighter/50 p-4 rounded-lg">
            <h3 className="text-sm text-foreground-muted mb-2">متوسط السحب</h3>
            <p className="text-2xl font-bold text-warning">
              {stats.totalWithdrawals > 0 && stats.pendingWithdrawals > 0
                ? (stats.totalWithdrawals / (stats.pendingWithdrawals + stats.totalWithdrawals)).toFixed(2)
                : '0.00'} USDT
            </p>
          </div>

          <div className="bg-background-lighter/50 p-4 rounded-lg">
            <h3 className="text-sm text-foreground-muted mb-2">إجمالي الأرباح</h3>
            <p className="text-2xl font-bold text-info">
              {stats.totalProfit.toFixed(2)} USDT
            </p>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
            onClick={() => router.push('/admin/statistics')}
          >
            <FaChartLine className="ml-2" />
            عرض الإحصائيات المفصلة
          </button>
        </div>
      </div>
    </div>
  );
}
