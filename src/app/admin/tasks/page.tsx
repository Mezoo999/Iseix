'use client';

import { useState, useEffect } from 'react';
import { FaTasks, FaEdit, FaSave, FaTimes, FaSpinner, FaUsers, FaChartLine, FaCoins, FaCheck } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { MembershipLevel, MEMBERSHIP_LEVEL_NAMES, PROFIT_RATES, DAILY_TASKS_COUNT } from '@/services/dailyTasks';

interface TaskData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  completionsToday: number;
  totalCompletions: number;
  isEditing: boolean;
}

interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completionsToday: number;
  totalCompletions: number;
  totalProfit: number;
}

export default function AdminTasks() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    activeTasks: 0,
    completionsToday: 0,
    totalCompletions: 0,
    totalProfit: 0
  });

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إدارة المهام');
        loadTasks();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);

      // جلب بيانات المهام
      const tasksQuery = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );

      const tasksSnapshot = await getDocs(tasksQuery);

      const tasksData: TaskData[] = [];
      let activeTasks = 0;
      let completionsToday = 0;
      let totalCompletions = 0;
      let totalProfit = 0;

      tasksSnapshot.forEach((doc) => {
        const data = doc.data();
        const task = {
          id: doc.id,
          name: data.name || 'مهمة بدون اسم',
          description: data.description || '',
          isActive: data.isActive || false,
          completionsToday: data.completionsToday || 0,
          totalCompletions: data.totalCompletions || 0,
          isEditing: false
        };

        tasksData.push(task);

        if (task.isActive) {
          activeTasks++;
        }

        completionsToday += task.completionsToday;
        totalCompletions += task.totalCompletions;

        // حساب تقريبي للأرباح (يمكن تعديله حسب الحاجة)
        totalProfit += task.totalCompletions * 0.03 * 10; // افتراض متوسط 3% ربح على 10 USDT
      });

      setTasks(tasksData);
      setStats({
        totalTasks: tasksData.length,
        activeTasks,
        completionsToday,
        totalCompletions,
        totalProfit
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, isEditing: true } : task
      )
    );
  };

  const handleCancel = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, isEditing: false } : task
      )
    );
  };

  const handleChange = (taskId: string, field: string, value: any) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  const handleSave = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setIsSaving(true);
    try {
      // تحديث المهمة في قاعدة البيانات
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        name: task.name,
        description: task.description,
        isActive: task.isActive,
        updatedAt: new Date()
      });

      // تحديث الواجهة
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, isEditing: false } : t
        )
      );

      // تحديث الإحصائيات
      let activeTasks = 0;
      tasks.forEach((t) => {
        if (t.id === taskId ? task.isActive : t.isActive) {
          activeTasks++;
        }
      });

      setStats({
        ...stats,
        activeTasks
      });
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setIsSaving(true);
    try {
      // تحديث حالة المهمة في قاعدة البيانات
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        isActive: !task.isActive,
        updatedAt: new Date()
      });

      // تحديث الواجهة
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, isActive: !t.isActive } : t
        )
      );

      // تحديث الإحصائيات
      setStats({
        ...stats,
        activeTasks: task.isActive ? stats.activeTasks - 1 : stats.activeTasks + 1
      });
    } catch (error) {
      console.error('Error toggling task status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetDailyCompletions = async () => {
    setIsSaving(true);
    try {
      // إعادة تعيين عدد الإكمالات اليومية لجميع المهام
      const batch = db.batch();

      tasks.forEach((task) => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.update(taskRef, {
          completionsToday: 0,
          updatedAt: new Date()
        });
      });

      await batch.commit();

      // تحديث الواجهة
      setTasks(
        tasks.map((task) => ({
          ...task,
          completionsToday: 0
        }))
      );

      // تحديث الإحصائيات
      setStats({
        ...stats,
        completionsToday: 0
      });
    } catch (error) {
      console.error('Error resetting daily completions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة المهام</h1>
        <p className="text-foreground-muted">إدارة المهام اليومية ومعدلات الربح.</p>
      </div>
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-primary/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary ml-2">
              <FaTasks />
            </div>
            <h3 className="font-bold">إجمالي المهام</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalTasks}</p>
          <p className="text-sm text-foreground-muted">{stats.activeTasks} مهمة نشطة</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-success/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-success/10 text-success ml-2">
              <FaCheck />
            </div>
            <h3 className="font-bold">إكمالات اليوم</h3>
          </div>
          <p className="text-2xl font-bold">{stats.completionsToday}</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-info/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-info/10 text-info ml-2">
              <FaChartLine />
            </div>
            <h3 className="font-bold">إجمالي الإكمالات</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalCompletions}</p>
        </div>

        <div className="bg-background-light p-4 rounded-xl shadow-sm border border-warning/10">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-full bg-warning/10 text-warning ml-2">
              <FaCoins />
            </div>
            <h3 className="font-bold">إجمالي الأرباح</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalProfit.toFixed(2)} USDT</p>
        </div>
      </div>

      {/* معدلات الربح حسب المستوى */}
      <div className="bg-background-light p-6 rounded-xl shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4">معدلات الربح حسب المستوى</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">المستوى</th>
                <th className="py-3 px-4 text-center">معدل الربح</th>
                <th className="py-3 px-4 text-center">عدد المهام اليومية</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(MEMBERSHIP_LEVEL_NAMES).map((level, index) => {
                const levelKey = String(index);
                const profitRate = PROFIT_RATES[levelKey] || { min: 0, max: 0 };
                const tasksCount = DAILY_TASKS_COUNT[levelKey] || 0;

                return (
                  <tr key={level} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      <div className="font-medium">{MEMBERSHIP_LEVEL_NAMES[levelKey]}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {profitRate.min}% - {profitRate.max}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                        {tasksCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex justify-end mb-6">
        <button
          className="btn btn-warning flex items-center gap-2"
          onClick={resetDailyCompletions}
          disabled={isSaving}
        >
          {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          إعادة تعيين إكمالات اليوم
        </button>
      </div>

      {/* جدول المهام */}
      <div className="bg-background-light rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-background-lighter">
          <h3 className="font-bold">المهام اليومية</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark text-white">
              <tr>
                <th className="py-3 px-4 text-right">اسم المهمة</th>
                <th className="py-3 px-4 text-right">الوصف</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">إكمالات اليوم</th>
                <th className="py-3 px-4 text-center">إجمالي الإكمالات</th>
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
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    لا توجد مهام
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-background-lighter hover:bg-background-lighter/20">
                    <td className="py-3 px-4">
                      {task.isEditing ? (
                        <input
                          type="text"
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={task.name}
                          onChange={(e) => handleChange(task.id, 'name', e.target.value)}
                        />
                      ) : (
                        <div className="font-medium">{task.name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {task.isEditing ? (
                        <textarea
                          className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-2"
                          value={task.description}
                          onChange={(e) => handleChange(task.id, 'description', e.target.value)}
                        />
                      ) : (
                        <div className="truncate max-w-xs">{task.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          task.isActive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                        }`}
                      >
                        {task.isActive ? 'نشطة' : 'غير نشطة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {task.completionsToday}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {task.totalCompletions}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {task.isEditing ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            className="p-1 text-success hover:bg-success/10 rounded"
                            onClick={() => handleSave(task.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                          </button>
                          <button
                            className="p-1 text-error hover:bg-error/10 rounded"
                            onClick={() => handleCancel(task.id)}
                            disabled={isSaving}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                            onClick={() => handleEdit(task.id)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`p-1 ${
                              task.isActive
                                ? 'text-error hover:bg-error/10'
                                : 'text-success hover:bg-success/10'
                            } rounded`}
                            onClick={() => toggleTaskStatus(task.id)}
                          >
                            {task.isActive ? <FaTimes /> : <FaCheck />}
                          </button>
                        </div>
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
          يتم إعادة تعيين إكمالات المهام اليومية تلقائياً كل 24 ساعة. يمكنك أيضاً إعادة تعيينها يدوياً باستخدام زر "إعادة تعيين إكمالات اليوم".
        </p>
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
