'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaSearch, FaEdit, FaBan, FaCheck, FaTrash, FaUserPlus, FaMoneyBillWave, FaCrown, FaSpinner, FaEnvelope, FaUser, FaLock, FaCoins } from 'react-icons/fa';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit, addDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';

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
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
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
      const userRef = doc(db, 'users', selectedUser.id);

      // الحصول على بيانات المستخدم الحالية
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      const userData = userDoc.data();
      const currentBalance = userData.balances?.USDT || 0;

      console.log(`إضافة رصيد للمستخدم ${selectedUser.id}. الرصيد الحالي: ${currentBalance}, المبلغ المضاف: ${amount}`);

      // تحديث رصيد المستخدم
      await updateDoc(userRef, {
        'balances.USDT': currentBalance + amount,
        totalDeposited: (userData.totalDeposited || 0) + amount,
        updatedAt: serverTimestamp()
      });

      console.log(`تم تحديث رصيد المستخدم. الرصيد الجديد: ${currentBalance + amount}`);

      // إنشاء معاملة إيداع
      await addDoc(collection(db, 'transactions'), {
        userId: selectedUser.id,
        type: 'deposit',
        amount: amount,
        currency: 'USDT',
        status: 'completed',
        description: `إيداع من المشرف: ${amount} USDT`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          adminDeposit: true,
          adminId: currentUser?.uid
        }
      });

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

        <button
          className="bg-primary text-white py-2 px-4 rounded-lg flex items-center w-full md:w-auto justify-center"
          onClick={handleOpenAddUserModal}
        >
          <FaUserPlus className="ml-2" />
          إضافة مستخدم جديد
        </button>
      </div>

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
                          onClick={() => handleEditUser(user)}
                          title="تعديل"
                        >
                          <FaEdit />
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
