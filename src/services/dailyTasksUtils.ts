import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';
import { MembershipLevel, PROFIT_RATES } from './dailyTasks';

/**
 * الحصول على المهام المتاحة للمستخدم
 * @param userId معرف المستخدم
 */
export const getAvailableTasks = async (userId: string) => {
  try {
    // الحصول على بيانات المستخدم
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const membershipLevel = userData.membershipLevel || MembershipLevel.BASIC;
    
    // الحصول على جميع المهام النشطة
    const tasksQuery = query(
      collection(db, 'dailyTasks'),
      where('isActive', '==', true)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    const allTasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // الحصول على حالة المهام للمستخدم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statusQuery = query(
      collection(db, 'userTaskStatus'),
      where('userId', '==', userId)
    );
    
    const statusSnapshot = await getDocs(statusQuery);
    const taskStatus = {};
    
    statusSnapshot.forEach(doc => {
      const data = doc.data();
      taskStatus[data.taskId] = data;
    });
    
    // تصفية المهام المتاحة
    const availableTasks = allTasks.filter(task => {
      const status = taskStatus[task.id];
      
      // إذا لم تكن هناك حالة، فالمهمة متاحة
      if (!status) {
        return true;
      }
      
      // إذا كانت المهمة مكتملة، تحقق من وقت إعادة التعيين
      if (status.isCompleted) {
        const nextAvailable = status.nextAvailableAt?.toDate();
        const now = new Date();
        
        // إذا كان وقت إعادة التعيين قد مر، فالمهمة متاحة
        return nextAvailable && nextAvailable <= now;
      }
      
      return true;
    });
    
    // تحديد عدد المهام المتاحة بناءً على مستوى العضوية
    const maxTasks = membershipLevel === MembershipLevel.BASIC ? 3 : 5;
    
    return {
      tasks: availableTasks.slice(0, maxTasks),
      membershipLevel,
      maxTasks
    };
  } catch (error) {
    console.error('Error getting available tasks:', error);
    throw error;
  }
};

/**
 * إكمال مهمة وإضافة المكافأة
 * @param userId معرف المستخدم
 * @param taskId معرف المهمة
 */
export const completeTaskWithReward = async (userId: string, taskId: string): Promise<{ success: boolean; reward?: number; error?: string }> => {
  try {
    // الحصول على المهمة
    const taskDoc = await getDoc(doc(db, 'dailyTasks', taskId));
    
    if (!taskDoc.exists()) {
      return { success: false, error: 'Task not found' };
    }
    
    const task = taskDoc.data();
    
    // الحصول على بيانات المستخدم
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const membershipLevel = userData.membershipLevel || MembershipLevel.BASIC;
    const userBalance = userData.balances?.USDT || 0;
    
    // التحقق من حالة المهمة للمستخدم
    const statusQuery = query(
      collection(db, 'userTaskStatus'),
      where('userId', '==', userId),
      where('taskId', '==', taskId)
    );
    
    const statusSnapshot = await getDocs(statusQuery);
    
    // التحقق مما إذا كانت المهمة مكتملة بالفعل اليوم
    if (!statusSnapshot.empty) {
      const statusDoc = statusSnapshot.docs[0];
      const status = statusDoc.data();
      
      if (status.isCompleted) {
        // المهمة مكتملة بالفعل
        const nextAvailable = status.nextAvailableAt?.toDate();
        const now = new Date();
        
        if (nextAvailable && nextAvailable > now) {
          return { success: false, error: 'Task already completed today' };
        }
      }
    }
    
    // حساب المكافأة بناءً على مستوى العضوية
    const profitRate = PROFIT_RATES[membershipLevel];
    const rewardAmount = userBalance * (profitRate / 100);
    
    // استخدام writeBatch لضمان اتساق البيانات
    const batch = writeBatch(db);
    
    // تحديث حالة المهمة
    if (!statusSnapshot.empty) {
      const statusDoc = statusSnapshot.docs[0];
      batch.update(doc(db, 'userTaskStatus', statusDoc.id), {
        isCompleted: true,
        completedAt: serverTimestamp(),
        nextAvailableAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // بعد 24 ساعة
      });
    } else {
      const newStatusRef = doc(collection(db, 'userTaskStatus'));
      batch.set(newStatusRef, {
        userId,
        taskId,
        isCompleted: true,
        completedAt: serverTimestamp(),
        nextAvailableAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // بعد 24 ساعة
      });
    }
    
    // إضافة المكافأة إلى رصيد المستخدم
    batch.update(doc(db, 'users', userId), {
      'balances.USDT': increment(rewardAmount),
      totalProfit: increment(rewardAmount),
      updatedAt: serverTimestamp()
    });
    
    // تنفيذ جميع العمليات
    await batch.commit();
    
    // تسجيل المكافأة
    await addDoc(collection(db, 'taskRewards'), {
      userId,
      taskId,
      amount: rewardAmount,
      currency: 'USDT',
      timestamp: serverTimestamp()
    });
    
    // إنشاء معاملة للمكافأة
    await createTransaction({
      userId,
      type: 'task',
      amount: rewardAmount,
      currency: 'USDT',
      status: 'completed',
      description: `مكافأة مهمة: ${task.title}`,
      metadata: {
        taskId,
        taskTitle: task.title,
        profitRate
      }
    });
    
    return { success: true, reward: rewardAmount };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: 'Error completing task' };
  }
};

/**
 * الحصول على بيانات المهام اليومية للمستخدم
 * @param userId معرف المستخدم
 */
export const getUserDailyTasksData = async (userId: string) => {
  try {
    // الحصول على بيانات المستخدم
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const membershipLevel = userData.membershipLevel || MembershipLevel.BASIC;
    
    // الحصول على حالة المهام للمستخدم
    const statusQuery = query(
      collection(db, 'userTaskStatus'),
      where('userId', '==', userId)
    );
    
    const statusSnapshot = await getDocs(statusQuery);
    const taskStatus = {};
    
    statusSnapshot.forEach(doc => {
      const data = doc.data();
      taskStatus[data.taskId] = data;
    });
    
    // الحصول على مكافآت المهام لليوم الحالي
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const rewardsQuery = query(
      collection(db, 'taskRewards'),
      where('userId', '==', userId)
    );
    
    const rewardsSnapshot = await getDocs(rewardsQuery);
    let totalReward = 0;
    let completedTasks = 0;
    
    rewardsSnapshot.forEach(doc => {
      const data = doc.data();
      const rewardDate = data.timestamp?.toDate();
      
      if (rewardDate && rewardDate >= today) {
        totalReward += data.amount;
        completedTasks++;
      }
    });
    
    // تحديد عدد المهام المتاحة بناءً على مستوى العضوية
    const totalTasks = membershipLevel === MembershipLevel.BASIC ? 3 : 5;
    const remainingTasks = Math.max(0, totalTasks - completedTasks);
    
    return {
      totalTasks,
      completedTasks,
      remainingTasks,
      totalReward,
      membershipLevel
    };
  } catch (error) {
    console.error('Error getting user daily tasks data:', error);
    throw error;
  }
};
