'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaSearch, FaEdit, FaBan, FaCheck, FaTrash, FaUserPlus, FaMoneyBillWave, FaCrown, FaSpinner, FaEnvelope, FaUser, FaLock, FaCoins, FaDownload, FaFilter, FaBell, FaChartBar, FaExchangeAlt, FaWallet, FaCalendarAlt, FaUserCog } from 'react-icons/fa';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
// AdminLayout غير مستخدم
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit, addDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { addUserBalance } from '@/services/users';

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isBlocked: boolean;
  balances: {
    USDT: number;
  };
  totalDeposited: number;
  totalWithdrawn: number;
  referralCode: string;
  createdAt: any;
  membershipLevel: number;
}

export default function AdminUsers() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [isUpgradeMembershipModalOpen, setIsUpgradeMembershipModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // متغيرات للفلترة المتقدمة
  const [membershipFilter, setMembershipFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'admin'>('all');
  const [balanceFilter, setBalanceFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // متغيرات للإشعارات
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  // متغيرات للإحصائيات
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    adminUsers: 0,
    totalBalance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    membershipLevels: {
      0: 0, // Basic
      1: 0, // Silver
      2: 0, // Gold
      3: 0, // Platinum
      4: 0, // Diamond
      5: 0  // Elite
    }
  });

  const [balanceAmount, setBalanceAmount] = useState('');
  const [selectedMembershipLevel, setSelectedMembershipLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // بيانات المستخدم الجديد
  const [newUserData, setNewUserData] = useState({
    email: '',
    displayName: '',
    password: '',
    membershipLevel: 0,
    initialBalance: '0'
  });

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!currentUser) {
      console.log('المستخدم غير مسجل الدخول');
      router.push('/login');
      return;
    }

    if (!userData?.isOwner) {
      console.log('المستخدم ليس لديه صلاحيات المالك');
      router.push('/admin/make-me-owner');
      return;
    }

    console.log('مرحباً بك في صفحة إدارة المستخدمين');
    fetchUsers();
  }, [currentUser, userData, router]);

  // جلب بيانات المستخدمين
  const fetchUsers = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const usersSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        )
      );

      const usersData: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          email: userData.email || '',
          displayName: userData.displayName || '',
          isAdmin: userData.isAdmin || false,
          isBlocked: userData.isBlocked || false,
          balances: userData.balances || { USDT: 0 },
          totalDeposited: userData.totalDeposited || 0,
          totalWithdrawn: userData.totalWithdrawn || 0,
          referralCode: userData.referralCode || '',
          createdAt: userData.createdAt,
          membershipLevel: userData.membershipLevel || 0,
        });
      });

      setUsers(usersData);
      setFilteredUsers(usersData);

      // حساب الإحصائيات
      calculateStats(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // حساب الإحصائيات
  const calculateStats = (usersData: User[]) => {
    const newStats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(user => !user.isBlocked && !user.isAdmin).length,
      blockedUsers: usersData.filter(user => user.isBlocked).length,
      adminUsers: usersData.filter(user => user.isAdmin).length,
      totalBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      membershipLevels: {
        0: 0, // Basic
        1: 0, // Silver
        2: 0, // Gold
        3: 0, // Platinum
        4: 0, // Diamond
        5: 0  // Elite
      }
    };

    // حساب إجماليات المبالغ
    usersData.forEach(user => {
      newStats.totalBalance += user.balances.USDT || 0;
      newStats.totalDeposited += user.totalDeposited || 0;
      newStats.totalWithdrawn += user.totalWithdrawn || 0;

      // حساب عدد المستخدمين في كل مستوى عضوية
      const level = user.membershipLevel || 0;
      if (level >= 0 && level <= 5) {
        newStats.membershipLevels[level as keyof typeof newStats.membershipLevels]++;
      }
    });

    setStats(newStats);
  };

  // تصدير بيانات المستخدمين كملف CSV
  const exportUsersToCSV = () => {
    if (users.length === 0) return;

    setIsExporting(true);

    try {
      // إنشاء رأس الجدول
      const headers = ['معرف المستخدم', 'البريد الإلكتروني', 'الاسم', 'رمز الإحالة', 'مستوى العضوية', 'الرصيد', 'إجمالي الإيداعات', 'إجمالي السحوبات', 'الحالة', 'تاريخ التسجيل'];

      // تحويل البيانات إلى تنسيق CSV
      const csvData = filteredUsers.map(user => [
        user.id,
        user.email,
        user.displayName,
        user.referralCode,
        getMembershipLevelName(user.membershipLevel),
        user.balances.USDT.toFixed(2),
        user.totalDeposited.toFixed(2),
        user.totalWithdrawn.toFixed(2),
        user.isAdmin ? 'مشرف' : user.isBlocked ? 'محظور' : 'نشط',
        formatDate(user.createdAt)
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
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
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

  // إرسال إشعار للمستخدم
  const sendNotification = async () => {
    if (!selectedUser || !notificationData.title || !notificationData.message) return;

    setIsProcessing(true);

    try {
      // إنشاء إشعار جديد
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        isRead: false,
        createdAt: serverTimestamp()
      });

      // إغلاق النافذة
      setIsSendNotificationModalOpen(false);
      setNotificationData({
        title: '',
        message: '',
        type: 'info'
      });
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // تطبيق الفلاتر المتقدمة
  const applyAdvancedFilters = () => {
    let filtered = [...users];

    // فلترة حسب مستوى العضوية
    if (membershipFilter !== '') {
      filtered = filtered.filter(user => user.membershipLevel === membershipFilter);
    }

    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.isBlocked && !user.isAdmin);
      } else if (statusFilter === 'blocked') {
        filtered = filtered.filter(user => user.isBlocked);
      } else if (statusFilter === 'admin') {
        filtered = filtered.filter(user => user.isAdmin);
      }
    }

    // فلترة حسب الرصيد
    if (balanceFilter.min) {
      const minBalance = parseFloat(balanceFilter.min);
      filtered = filtered.filter(user => user.balances.USDT >= minBalance);
    }

    if (balanceFilter.max) {
      const maxBalance = parseFloat(balanceFilter.max);
      filtered = filtered.filter(user => user.balances.USDT <= maxBalance);
    }

    // فلترة حسب تاريخ التسجيل
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      filtered = filtered.filter(user => {
        const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return userDate >= startDate;
      });
    }

    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999); // نهاية اليوم
      filtered = filtered.filter(user => {
        const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return userDate <= endDate;
      });
    }

    // تطبيق البحث النصي إذا كان موجودًا
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  // إعادة تعيين الفلاتر المتقدمة
  const resetAdvancedFilters = () => {
    setMembershipFilter('');
    setStatusFilter('all');
    setBalanceFilter({ min: '', max: '' });
    setDateFilter({ start: '', end: '' });
    setSearchTerm('');
    setFilteredUsers(users);
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // تنفيذ حذف المستخدم
  const executeDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    setIsProcessing(true);
    try {
      // حذف المستخدم من قاعدة البيانات
      await deleteDoc(doc(db, 'users', selectedUser.id));

      // تحديث القائمة
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(filteredUsers.filter(u => u.id !== selectedUser.id));

      // إغلاق النافذة
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBlock = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isBlocked: !user.isBlocked,
      });

      // تحديث القائمة
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u
        )
      );
    } catch (error) {
      console.error('Error toggling user block status:', error);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isAdmin: !user.isAdmin,
      });

      // تحديث القائمة
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );
    } catch (error) {
      console.error('Error toggling user admin status:', error);
    }
  };

  // إضافة رصيد للمستخدم
  const handleAddBalance = (user: User) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setIsAddBalanceModalOpen(true);
  };

  // تنفيذ إضافة الرصيد
  const executeAddBalance = async () => {
    if (!selectedUser || !balanceAmount || isNaN(parseFloat(balanceAmount)) || parseFloat(balanceAmount) <= 0) {
      return;
    }

    setIsProcessing(true);
    try {
      const amount = parseFloat(balanceAmount);

      console.log(`إضافة رصيد للمستخدم ${selectedUser.id}. المبلغ المضاف: ${amount}`);

      // استخدام دالة addUserBalance لإضافة الرصيد وإنشاء معاملة
      await addUserBalance(
        selectedUser.id,
        amount,
        'USDT',
        `إيداع من المشرف: ${amount} USDT (${currentUser?.displayName || 'مدير النظام'})`
      );

      console.log(`تم إضافة الرصيد للمستخدم ${selectedUser.id} بنجاح`);

      // الحصول على بيانات المستخدم المحدثة
      const userRef = doc(db, 'users', selectedUser.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newBalance = userData.balances?.USDT || 0;
        console.log(`الرصيد الجديد للمستخدم: ${newBalance} USDT`);
      }

      console.log('تم إنشاء معاملة إيداع بنجاح');

      // تحديث القائمة
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                balances: {
                  ...u.balances,
                  USDT: u.balances.USDT + amount
                },
                totalDeposited: (u.totalDeposited || 0) + amount
              }
            : u
        )
      );

      // إغلاق النافذة
      setIsAddBalanceModalOpen(false);
      setBalanceAmount('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error adding balance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ترقية مستوى عضوية المستخدم
  const handleUpgradeMembership = (user: User) => {
    setSelectedUser(user);
    setSelectedMembershipLevel(user.membershipLevel);
    setIsUpgradeMembershipModalOpen(true);
  };

  // الحصول على اسم مستوى العضوية
  const getMembershipLevelName = (level: number | string | undefined) => {
    if (level === undefined) return 'Iseix Basic';

    // التحويل إلى سلسلة نصية للتأكد من التوافق مع المفاتيح في MEMBERSHIP_LEVEL_NAMES
    const levelKey = String(level);
    return MEMBERSHIP_LEVEL_NAMES[levelKey] || 'Iseix Basic';
  };

  // فتح نافذة إضافة مستخدم جديد
  const handleOpenAddUserModal = () => {
    setNewUserData({
      email: '',
      displayName: '',
      password: '',
      membershipLevel: 0,
      initialBalance: '0'
    });
    setIsAddUserModalOpen(true);
  };

  // تغيير بيانات المستخدم الجديد
  const handleNewUserDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value
    });
  };

  // إضافة مستخدم جديد
  const executeAddUser = async () => {
    if (!newUserData.email || !newUserData.displayName || !newUserData.password) {
      return;
    }

    setIsProcessing(true);
    try {
      // إنشاء المستخدم في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email,
        newUserData.password
      );

      const uid = userCredential.user.uid;

      // إنشاء رمز إحالة فريد
      const referralCode = uid.substring(0, 8).toUpperCase();

      // إنشاء المستخدم في Firestore
      await setDoc(doc(db, 'users', uid), {
        email: newUserData.email,
        displayName: newUserData.displayName,
        referralCode,
        membershipLevel: parseInt(newUserData.membershipLevel.toString()),
        balances: {
          USDT: parseFloat(newUserData.initialBalance) || 0
        },
        totalDeposited: 0,
        totalWithdrawn: 0,
        isAdmin: false,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // إضافة المستخدم الجديد إلى القائمة
      const newUser: User = {
        id: uid,
        email: newUserData.email,
        displayName: newUserData.displayName,
        referralCode,
        membershipLevel: parseInt(newUserData.membershipLevel.toString()),
        balances: {
          USDT: parseFloat(newUserData.initialBalance) || 0
        },
        totalDeposited: 0,
        totalWithdrawn: 0,
        isAdmin: false,
        isBlocked: false,
        createdAt: new Date()
      };

      setUsers([newUser, ...users]);
      setFilteredUsers([newUser, ...filteredUsers]);

      // إغلاق النافذة
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error('Error adding new user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // تنفيذ ترقية العضوية
  const executeUpgradeMembership = async () => {
    if (!selectedUser) {
      return;
    }

    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);

      // الحصول على بيانات المستخدم الحالية
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      const userData = userDoc.data();
      const currentLevel = userData.membershipLevel || 0;

      console.log(`ترقية مستوى عضوية المستخدم ${selectedUser.id}. المستوى الحالي: ${currentLevel}, المستوى الجديد: ${selectedMembershipLevel}`);

      // تحديث مستوى عضوية المستخدم
      await updateDoc(userRef, {
        membershipLevel: selectedMembershipLevel,
        updatedAt: serverTimestamp()
      });

      console.log(`تم تحديث مستوى عضوية المستخدم. المستوى الجديد: ${selectedMembershipLevel}`);

      // إضافة سجل لترقية العضوية
      await addDoc(collection(db, 'membershipUpgrades'), {
        userId: selectedUser.id,
        oldLevel: currentLevel,
        newLevel: selectedMembershipLevel,
        oldLevelName: getMembershipLevelName(currentLevel),
        newLevelName: getMembershipLevelName(selectedMembershipLevel),
        upgradedBy: currentUser?.uid,
        timestamp: serverTimestamp()
      });

      console.log('تم إضافة سجل ترقية العضوية بنجاح');

      // تحديث القائمة
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, membershipLevel: selectedMembershipLevel }
            : u
        )
      );

      // إغلاق النافذة
      setIsUpgradeMembershipModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error upgrading membership:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <p className="text-foreground-muted">عرض وإدارة جميع المستخدمين المسجلين في المنصة.</p>
      </div>

      {/* قسم الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <FaUsers className="text-primary text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي الرصيد</p>
              <p className="text-2xl font-bold">{stats.totalBalance.toFixed(2)} USDT</p>
            </div>
            <div className="bg-success/10 p-3 rounded-full">
              <FaWallet className="text-success text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي الإيداعات</p>
              <p className="text-2xl font-bold">{stats.totalDeposited.toFixed(2)} USDT</p>
            </div>
            <div className="bg-info/10 p-3 rounded-full">
              <FaExchangeAlt className="text-info text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground-muted text-sm">إجمالي السحوبات</p>
              <p className="text-2xl font-bold">{stats.totalWithdrawn.toFixed(2)} USDT</p>
            </div>
            <div className="bg-warning/10 p-3 rounded-full">
              <FaExchangeAlt className="text-warning text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* قسم البحث والفلترة */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FaSearch className="text-foreground-muted" />
          </div>
          <input
            type="text"
            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full md:w-80 p-3 pr-10"
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="bg-info text-white py-2 px-4 rounded-lg flex items-center justify-center"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FaFilter className="ml-2" />
            {showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'الفلاتر المتقدمة'}
          </button>

          <button
            className="bg-success text-white py-2 px-4 rounded-lg flex items-center justify-center"
            onClick={exportUsersToCSV}
            disabled={isExporting || filteredUsers.length === 0}
          >
            {isExporting ? <FaSpinner className="animate-spin ml-2" /> : <FaDownload className="ml-2" />}
            تصدير البيانات
          </button>

          <button
            className="bg-primary text-white py-2 px-4 rounded-lg flex items-center justify-center"
            onClick={handleOpenAddUserModal}
          >
            <FaUserPlus className="ml-2" />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* الفلاتر المتقدمة */}
      {showAdvancedFilters && (
        <div className="bg-background-light p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-medium mb-4">الفلاتر المتقدمة</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm font-medium">مستوى العضوية</label>
              <select
                className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value === '' ? '' : parseInt(e.target.value))}
              >
                <option value="">الكل</option>
                <option value="0">Iseix Basic</option>
                <option value="1">Iseix Silver</option>
                <option value="2">Iseix Gold</option>
                <option value="3">Iseix Platinum</option>
                <option value="4">Iseix Diamond</option>
                <option value="5">Iseix Elite</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">الحالة</label>
              <select
                className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="blocked">محظور</option>
                <option value="admin">مشرف</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">نطاق الرصيد</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                  placeholder="الحد الأدنى"
                  value={balanceFilter.min}
                  onChange={(e) => setBalanceFilter({ ...balanceFilter, min: e.target.value })}
                />
                <input
                  type="number"
                  className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                  placeholder="الحد الأقصى"
                  value={balanceFilter.max}
                  onChange={(e) => setBalanceFilter({ ...balanceFilter, max: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">تاريخ التسجيل</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                />
                <input
                  type="date"
                  className="bg-background-lighter border border-background-lighter text-foreground rounded-lg block w-full p-2.5"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
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
              onClick={applyAdvancedFilters}
            >
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      )}

      <div className="bg-background-light rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">المستخدم</th>
                <th className="py-3 px-4 text-center">رمز الإحالة</th>
                <th className="py-3 px-4 text-center">مستوى العضوية</th>
                <th className="py-3 px-4 text-center">الرصيد (USDT)</th>
                <th className="py-3 px-4 text-center">الإيداعات</th>
                <th className="py-3 px-4 text-center">السحوبات</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">
                    لا يوجد مستخدمين مطابقين للبحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ml-3">
                          <FaUsers className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-xs text-foreground-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{user.referralCode}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {getMembershipLevelName(user.membershipLevel)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{user.balances.USDT.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-success">{user.totalDeposited.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-error">{user.totalWithdrawn.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {user.isAdmin ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                          مشرف
                        </span>
                      ) : user.isBlocked ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-error/20 text-error">
                          محظور
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <button
                          className="p-1 text-primary hover:bg-primary/10 rounded"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserDetailsModalOpen(true);
                          }}
                          title="عرض التفاصيل"
                        >
                          <FaUser />
                        </button>
                        <button
                          className="p-1 text-success hover:bg-success/10 rounded"
                          onClick={() => handleAddBalance(user)}
                          title="إضافة رصيد"
                        >
                          <FaMoneyBillWave />
                        </button>
                        <button
                          className="p-1 text-info hover:bg-info/10 rounded"
                          onClick={() => handleUpgradeMembership(user)}
                          title="ترقية العضوية"
                        >
                          <FaCrown />
                        </button>
                        <button
                          className="p-1 text-warning hover:bg-warning/10 rounded"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsSendNotificationModalOpen(true);
                          }}
                          title="إرسال إشعار"
                        >
                          <FaBell />
                        </button>
                        <button
                          className={`p-1 ${
                            user.isBlocked
                              ? 'text-success hover:bg-success/10'
                              : 'text-error hover:bg-error/10'
                          } rounded`}
                          onClick={() => handleToggleBlock(user)}
                          title={user.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                        >
                          {user.isBlocked ? <FaCheck /> : <FaBan />}
                        </button>
                        <button
                          className={`p-1 ${
                            user.isAdmin
                              ? 'text-warning hover:bg-warning/10'
                              : 'text-info hover:bg-info/10'
                          } rounded`}
                          onClick={() => handleToggleAdmin(user)}
                          title={user.isAdmin ? 'إلغاء صلاحيات المشرف' : 'منح صلاحيات المشرف'}
                        >
                          {user.isAdmin ? <FaBan /> : <FaCheck />}
                        </button>
                        <button
                          className="p-1 text-error hover:bg-error/10 rounded"
                          onClick={() => handleDeleteUser(user)}
                          title="حذف"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة رصيد */}
      <div className={`modal ${isAddBalanceModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">إضافة رصيد</h3>

          {selectedUser && (
            <div>
              <p className="mb-4">
                إضافة رصيد للمستخدم: <span className="font-bold">{selectedUser.displayName}</span>
              </p>

              <div className="mb-4">
                <label className="block mb-2 font-medium">المبلغ (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل المبلغ"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                />
              </div>

              <div className="bg-info/10 p-4 rounded-lg mb-4">
                <p className="text-info font-medium">معلومات هامة</p>
                <p className="text-sm">
                  سيتم إضافة هذا المبلغ إلى رصيد المستخدم الحالي. الرصيد الحالي: {selectedUser.balances.USDT.toFixed(2)} USDT
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors"
                  onClick={executeAddBalance}
                  disabled={isProcessing || !balanceAmount || isNaN(parseFloat(balanceAmount)) || parseFloat(balanceAmount) <= 0}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    'إضافة الرصيد'
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => setIsAddBalanceModalOpen(false)}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة ترقية العضوية */}
      <div className={`modal ${isUpgradeMembershipModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">ترقية مستوى العضوية</h3>

          {selectedUser && (
            <div>
              <p className="mb-4">
                ترقية مستوى عضوية المستخدم: <span className="font-bold">{selectedUser.displayName}</span>
              </p>

              <div className="mb-4">
                <label className="block mb-2 font-medium">مستوى العضوية</label>
                <select
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={selectedMembershipLevel}
                  onChange={(e) => setSelectedMembershipLevel(parseInt(e.target.value))}
                >
                  <option value={0}>Iseix Basic</option>
                  <option value={1}>Iseix Silver</option>
                  <option value={2}>Iseix Gold</option>
                  <option value={3}>Iseix Platinum</option>
                  <option value={4}>Iseix Diamond</option>
                  <option value={5}>Iseix Elite</option>
                </select>
              </div>

              <div className="bg-info/10 p-4 rounded-lg mb-4">
                <p className="text-info font-medium">معلومات هامة</p>
                <p className="text-sm">
                  المستوى الحالي: {getMembershipLevelName(selectedUser.membershipLevel)}
                </p>
                <p className="text-sm mt-2">
                  المستوى الجديد: {getMembershipLevelName(selectedMembershipLevel)}
                </p>
                <p className="text-sm mt-2">
                  سيتم تغيير مستوى عضوية المستخدم، مما قد يؤثر على معدلات الربح والمزايا الأخرى.
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  onClick={executeUpgradeMembership}
                  disabled={isProcessing || selectedMembershipLevel === selectedUser.membershipLevel}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    'تحديث مستوى العضوية'
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => setIsUpgradeMembershipModalOpen(false)}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة تعديل المستخدم */}
      <div className={`modal ${isEditModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">تعديل بيانات المستخدم</h3>

          {selectedUser && (
            <div>
              <p className="mb-4">
                تعديل بيانات المستخدم: <span className="font-bold">{selectedUser.displayName}</span>
              </p>

              <div className="bg-warning/10 p-4 rounded-lg mb-4">
                <p className="text-warning font-medium">تنبيه</p>
                <p className="text-sm">
                  هذه الوظيفة غير متاحة حالياً. يرجى استخدام وظائف إضافة الرصيد وترقية العضوية بدلاً من ذلك.
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة حذف المستخدم */}
      <div className={`modal ${isDeleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">حذف المستخدم</h3>

          {selectedUser && (
            <div>
              <p className="mb-4">
                هل أنت متأكد من حذف المستخدم: <span className="font-bold">{selectedUser.displayName}</span>؟
              </p>

              <div className="bg-error/10 p-4 rounded-lg mb-4">
                <p className="text-error font-medium">تحذير</p>
                <p className="text-sm">
                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات المستخدم بشكل نهائي.
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors"
                  onClick={executeDeleteUser}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري الحذف...
                    </span>
                  ) : (
                    'تأكيد الحذف'
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة إضافة مستخدم جديد */}
      <div className={`modal ${isAddUserModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">إضافة مستخدم جديد</h3>

          <div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                <FaEnvelope className="inline ml-1" /> البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل البريد الإلكتروني"
                value={newUserData.email}
                onChange={handleNewUserDataChange}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                <FaUser className="inline ml-1" /> اسم المستخدم
              </label>
              <input
                type="text"
                name="displayName"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل اسم المستخدم"
                value={newUserData.displayName}
                onChange={handleNewUserDataChange}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                <FaLock className="inline ml-1" /> كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل كلمة المرور"
                value={newUserData.password}
                onChange={handleNewUserDataChange}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                <FaCrown className="inline ml-1" /> مستوى العضوية
              </label>
              <select
                name="membershipLevel"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                value={newUserData.membershipLevel}
                onChange={handleNewUserDataChange}
              >
                <option value={0}>Iseix Basic</option>
                <option value={1}>Iseix Silver</option>
                <option value={2}>Iseix Gold</option>
                <option value={3}>Iseix Platinum</option>
                <option value={4}>Iseix Diamond</option>
                <option value={5}>Iseix Elite</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                <FaCoins className="inline ml-1" /> الرصيد الأولي (USDT)
              </label>
              <input
                type="number"
                name="initialBalance"
                step="0.01"
                min="0"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل الرصيد الأولي"
                value={newUserData.initialBalance}
                onChange={handleNewUserDataChange}
              />
            </div>

            <div className="bg-info/10 p-4 rounded-lg mb-4">
              <p className="text-info font-medium">معلومات هامة</p>
              <p className="text-sm">
                سيتم إنشاء حساب جديد بالبيانات المدخلة. تأكد من صحة البريد الإلكتروني وكلمة المرور.
              </p>
            </div>

            <div className="modal-action">
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                onClick={executeAddUser}
                disabled={isProcessing || !newUserData.email || !newUserData.displayName || !newUserData.password}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري الإنشاء...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaUserPlus className="ml-2" />
                    إنشاء المستخدم
                  </span>
                )}
              </button>

              <button
                className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                onClick={() => setIsAddUserModalOpen(false)}
                disabled={isProcessing}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة إرسال إشعار */}
      <div className={`modal ${isSendNotificationModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">إرسال إشعار</h3>

          {selectedUser && (
            <div>
              <p className="mb-4">
                إرسال إشعار للمستخدم: <span className="font-bold">{selectedUser.displayName}</span>
              </p>

              <div className="mb-4">
                <label className="block mb-2 font-medium">نوع الإشعار</label>
                <select
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={notificationData.type}
                  onChange={(e) => setNotificationData({ ...notificationData, type: e.target.value })}
                >
                  <option value="info">معلومات</option>
                  <option value="success">نجاح</option>
                  <option value="warning">تحذير</option>
                  <option value="error">خطأ</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">عنوان الإشعار</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل عنوان الإشعار"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">نص الإشعار</label>
                <textarea
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل نص الإشعار"
                  rows={4}
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-action">
                <button
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  onClick={sendNotification}
                  disabled={isProcessing || !notificationData.title || !notificationData.message}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري الإرسال...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaBell className="ml-2" />
                      إرسال الإشعار
                    </span>
                  )}
                </button>

                <button
                  className="px-4 py-2 bg-background-lighter text-foreground rounded-lg hover:bg-background-light transition-colors"
                  onClick={() => setIsSendNotificationModalOpen(false)}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة تفاصيل المستخدم */}
      <div className={`modal ${isUserDetailsModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <h3 className="font-bold text-lg mb-4">تفاصيل المستخدم</h3>

          {selectedUser && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* معلومات المستخدم الأساسية */}
                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-bold mb-3 text-primary">المعلومات الأساسية</h4>

                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center ml-4">
                      <FaUser className="text-primary text-2xl" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{selectedUser.displayName}</p>
                      <p className="text-foreground-muted">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                      <p className="font-mono text-xs break-all">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">رمز الإحالة</p>
                      <p className="font-mono">{selectedUser.referralCode}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">مستوى العضوية</p>
                      <p>
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {getMembershipLevelName(selectedUser.membershipLevel)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">الحالة</p>
                      <p>
                        {selectedUser.isAdmin ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                            مشرف
                          </span>
                        ) : selectedUser.isBlocked ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-error/20 text-error">
                            محظور
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">
                            نشط
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground-muted text-sm">تاريخ التسجيل</p>
                      <p>{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* معلومات مالية */}
                <div className="bg-background-lighter p-4 rounded-lg">
                  <h4 className="font-bold mb-3 text-primary">المعلومات المالية</h4>

                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="bg-background-light p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground-muted text-sm">الرصيد الحالي</p>
                          <p className="text-xl font-bold">{selectedUser.balances.USDT.toFixed(2)} USDT</p>
                        </div>
                        <div className="bg-success/10 p-2 rounded-full">
                          <FaWallet className="text-success" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background-light p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground-muted text-sm">إجمالي الإيداعات</p>
                            <p className="font-bold">{selectedUser.totalDeposited.toFixed(2)} USDT</p>
                          </div>
                          <div className="bg-info/10 p-2 rounded-full">
                            <FaExchangeAlt className="text-info" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-background-light p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground-muted text-sm">إجمالي السحوبات</p>
                            <p className="font-bold">{selectedUser.totalWithdrawn.toFixed(2)} USDT</p>
                          </div>
                          <div className="bg-warning/10 p-2 rounded-full">
                            <FaExchangeAlt className="text-warning" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-background-light">
                    <h5 className="font-medium mb-2">الإجراءات السريعة</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-3 py-1.5 bg-success text-white rounded-lg text-xs flex items-center"
                        onClick={() => {
                          setIsUserDetailsModalOpen(false);
                          handleAddBalance(selectedUser);
                        }}
                      >
                        <FaMoneyBillWave className="ml-1" />
                        إضافة رصيد
                      </button>

                      <button
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs flex items-center"
                        onClick={() => {
                          setIsUserDetailsModalOpen(false);
                          handleUpgradeMembership(selectedUser);
                        }}
                      >
                        <FaCrown className="ml-1" />
                        ترقية العضوية
                      </button>

                      <button
                        className="px-3 py-1.5 bg-warning text-white rounded-lg text-xs flex items-center"
                        onClick={() => {
                          setIsUserDetailsModalOpen(false);
                          setIsSendNotificationModalOpen(true);
                        }}
                      >
                        <FaBell className="ml-1" />
                        إرسال إشعار
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-action">
            <button
              className="px-4 py-2 bg-background-dark text-white rounded-lg hover:bg-background-darker transition-colors"
              onClick={() => setIsUserDetailsModalOpen(false)}
            >
              إغلاق
            </button>
          </div>
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
