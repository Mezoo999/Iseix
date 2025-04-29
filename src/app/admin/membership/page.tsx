'use client';

import { useState, useEffect } from 'react';
import { FaCrown, FaEdit, FaSave, FaTimes, FaSpinner, FaUsers, FaChartLine, FaCoins } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES, PROFIT_RATES, MIN_UNLOCK_AMOUNT, REQUIRED_PROMOTERS } from '@/services/dailyTasks';

interface MembershipLevelData {
  id: string;
  level: number;
  name: string;
  profitRateMin: number;
  profitRateMax: number;
  minUnlockAmount: number;
  requiredPromoters: number;
  usersCount: number;
  isEditing: boolean;
}

interface MembershipStats {
  totalUsers: number;
  levelDistribution: {
    [key: number]: number;
  };
}

export default function AdminMembership() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [membershipLevels, setMembershipLevels] = useState<MembershipLevelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<MembershipStats>({
    totalUsers: 0,
    levelDistribution: {}
  });

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إدارة العضويات');
        loadMembershipLevels();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadMembershipLevels = async () => {
    try {
      setIsLoading(true);
      
      // جلب بيانات المستخدمين لحساب عدد المستخدمين في كل مستوى
      const usersQuery = query(
        collection(db, 'users')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      const levelCounts: { [key: number]: number } = {};
      let totalUsers = 0;
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const level = userData.membershipLevel || 0;
        
        if (levelCounts[level]) {
          levelCounts[level]++;
        } else {
          levelCounts[level] = 1;
        }
        
        totalUsers++;
      });
      
      // إنشاء بيانات مستويات العضوية
      const levels: MembershipLevelData[] = [];
      
      // إضافة المستويات الستة
      for (let i = 0; i <= 5; i++) {
        const levelKey = String(i);
        const profitRate = PROFIT_RATES[levelKey] || { min: 0, max: 0 };
        
        levels.push({
          id: `level-${i}`,
          level: i,
          name: MEMBERSHIP_LEVEL_NAMES[levelKey] || `المستوى ${i}`,
          profitRateMin: profitRate.min,
          profitRateMax: profitRate.max,
          minUnlockAmount: MIN_UNLOCK_AMOUNT[levelKey] || 0,
          requiredPromoters: REQUIRED_PROMOTERS[levelKey] || 0,
          usersCount: levelCounts[i] || 0,
          isEditing: false
        });
      }
      
      setMembershipLevels(levels);
      setStats({
        totalUsers,
        levelDistribution: levelCounts
      });
    } catch (error) {
      console.error('Error loading membership levels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (levelId: string) => {
    setMembershipLevels(
      membershipLevels.map((level) =>
        level.id === levelId ? { ...level, isEditing: true } : level
      )
    );
  };

  const handleCancel = (levelId: string) => {
    setMembershipLevels(
      membershipLevels.map((level) =>
        level.id === levelId ? { ...level, isEditing: false } : level
      )
    );
  };

  const handleChange = (levelId: string, field: string, value: any) => {
    setMembershipLevels(
      membershipLevels.map((level) =>
        level.id === levelId ? { ...level, [field]: value } : level
      )
    );
  };

  const handleSave = async (levelId: string) => {
    const level = membershipLevels.find((l) => l.id === levelId);
    if (!level) return;
    
    setIsSaving(true);
    try {
      // هنا يمكن إضافة كود لحفظ التغييرات في قاعدة البيانات
      // على سبيل المثال، يمكن تحديث مستند في مجموعة "settings" أو "membershipLevels"
      
      // تحديث الواجهة
      setMembershipLevels(
        membershipLevels.map((l) =>
          l.id === levelId ? { ...l, isEditing: false } : l
        )
      );
    } catch (error) {
      console.error('Error saving membership level:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPercentage = (count: number) => {
    if (stats.totalUsers === 0) return 0;
    return Math.round((count / stats.totalUsers) * 100);
  };

  return (
    <AdminLayout
      title="إدارة العضويات"
      description="إدارة مستويات العضوية والمزايا."
    >
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-primary/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary ml-2">
              <FaUsers />
            </div>
            <h3 className="font-bold">إجمالي المستخدمين</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-success/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-success/10 text-success ml-2">
              <FaCrown />
            </div>
            <h3 className="font-bold">أعلى مستوى</h3>
          </div>
          <p className="text-2xl font-bold">Iseix Elite</p>
          <p className="text-sm">معدل الربح: 4.95% - 5.04%</p>
        </div>
        
        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-info/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-info/10 text-info ml-2">
              <FaCoins />
            </div>
            <h3 className="font-bold">الحد الأدنى للإستثمار</h3>
          </div>
          <p className="text-2xl font-bold">2 - 500 USDT</p>
          <p className="text-sm">حسب المستوى</p>
        </div>
      </div>

      {/* توزيع المستويات */}
      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4">توزيع المستويات</h3>
        
        <div className="space-y-4">
          {membershipLevels.map((level) => (
            <div key={level.id} className="flex items-center">
              <div className="w-32 font-medium">{level.name}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-background-lighter rounded-full h-4">
                  <div
                    className="bg-primary rounded-full h-4"
                    style={{ width: `${getPercentage(level.usersCount)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-24 text-right">
                <span className="font-medium">{level.usersCount}</span>
                <span className="text-foreground-muted ml-1">({getPercentage(level.usersCount)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* جدول مستويات العضوية */}
      <div className="bg-background-light rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-background-lighter">
          <h3 className="font-bold">مستويات العضوية</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">المستوى</th>
                <th className="py-3 px-4 text-center">معدل الربح</th>
                <th className="py-3 px-4 text-center">الحد الأدنى للإستثمار</th>
                <th className="py-3 px-4 text-center">المروجين المطلوبين</th>
                <th className="py-3 px-4 text-center">عدد المستخدمين</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
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
              ) : (
                membershipLevels.map((level) => (
                  <tr key={level.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      {level.isEditing ? (
                        <input
                          type="text"
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={level.name}
                          onChange={(e) => handleChange(level.id, 'name', e.target.value)}
                        />
                      ) : (
                        <div className="font-medium">{level.name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {level.isEditing ? (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-20 p-2"
                            value={level.profitRateMin}
                            onChange={(e) => handleChange(level.id, 'profitRateMin', parseFloat(e.target.value))}
                          />
                          <span>-</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-20 p-2"
                            value={level.profitRateMax}
                            onChange={(e) => handleChange(level.id, 'profitRateMax', parseFloat(e.target.value))}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span>{level.profitRateMin}% - {level.profitRateMax}%</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {level.isEditing ? (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-24 p-2"
                            value={level.minUnlockAmount}
                            onChange={(e) => handleChange(level.id, 'minUnlockAmount', parseInt(e.target.value))}
                          />
                          <span>USDT</span>
                        </div>
                      ) : (
                        <span>{level.minUnlockAmount} USDT</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {level.isEditing ? (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={level.requiredPromoters}
                          onChange={(e) => handleChange(level.id, 'requiredPromoters', parseInt(e.target.value))}
                        />
                      ) : (
                        <span>{level.requiredPromoters}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {level.usersCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {level.isEditing ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            className="p-1 text-success hover:bg-success/10 rounded"
                            onClick={() => handleSave(level.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                          </button>
                          <button
                            className="p-1 text-error hover:bg-error/10 rounded"
                            onClick={() => handleCancel(level.id)}
                            disabled={isSaving}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="p-1 text-primary hover:bg-primary/10 rounded"
                          onClick={() => handleEdit(level.id)}
                        >
                          <FaEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ملاحظة */}
      <div className="bg-info/10 p-4 rounded-lg mt-6">
        <p className="text-info font-medium">ملاحظة</p>
        <p className="text-sm">
          تعديل مستويات العضوية سيؤثر على معدلات الربح والمزايا لجميع المستخدمين. يرجى التأكد من صحة البيانات قبل الحفظ.
        </p>
      </div>
    </AdminLayout>
  );
}
