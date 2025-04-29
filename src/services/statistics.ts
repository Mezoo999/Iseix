import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// واجهة الإحصائيات
export interface Statistics {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalTransactions: number;
  totalReferrals: number;
  totalProfit: number;
  depositsByDay: { label: string; value: number }[];
  withdrawalsByDay: { label: string; value: number }[];
  usersByMembership: { label: string; value: number }[];
  tasksByDay: { label: string; value: number }[];
  topReferrers: { label: string; value: number }[];
}

// الحصول على إحصائيات المنصة
export const getStatistics = async (): Promise<Statistics> => {
  try {
    // الحصول على إجمالي المستخدمين
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // الحصول على المستخدمين النشطين (تسجيل دخول في آخر 7 أيام)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        where('lastLoginAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      )
    );
    const activeUsers = activeUsersSnapshot.size;

    // الحصول على إجمالي الإيداعات
    const depositsSnapshot = await getDocs(
      query(
        collection(db, 'deposit_requests'),
        where('status', '==', 'approved')
      )
    );
    let totalDeposits = 0;
    depositsSnapshot.forEach((doc) => {
      totalDeposits += doc.data().amount || 0;
    });

    // الحصول على إجمالي السحوبات
    const withdrawalsSnapshot = await getDocs(
      query(
        collection(db, 'withdrawals'),
        where('status', '==', 'approved')
      )
    );
    let totalWithdrawals = 0;
    withdrawalsSnapshot.forEach((doc) => {
      totalWithdrawals += doc.data().amount || 0;
    });

    // الحصول على الإيداعات المعلقة
    const pendingDepositsSnapshot = await getDocs(
      query(
        collection(db, 'deposit_requests'),
        where('status', '==', 'pending')
      )
    );
    const pendingDeposits = pendingDepositsSnapshot.size;

    // الحصول على السحوبات المعلقة
    const pendingWithdrawalsSnapshot = await getDocs(
      query(
        collection(db, 'withdrawals'),
        where('status', '==', 'pending')
      )
    );
    const pendingWithdrawals = pendingWithdrawalsSnapshot.size;

    // الحصول على إجمالي المعاملات
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const totalTransactions = transactionsSnapshot.size;

    // الحصول على إجمالي الإحالات
    const referralsSnapshot = await getDocs(collection(db, 'referrals'));
    const totalReferrals = referralsSnapshot.size;

    // الحصول على إجمالي الأرباح
    const profitTransactionsSnapshot = await getDocs(
      query(
        collection(db, 'transactions'),
        where('type', '==', 'profit')
      )
    );
    let totalProfit = 0;
    profitTransactionsSnapshot.forEach((doc) => {
      totalProfit += doc.data().amount || 0;
    });

    // الحصول على الإيداعات حسب اليوم (آخر 7 أيام)
    const depositsByDay = await getTransactionsByDay('deposit_requests', 'approved');

    // الحصول على السحوبات حسب اليوم (آخر 7 أيام)
    const withdrawalsByDay = await getTransactionsByDay('withdrawals', 'approved');

    // الحصول على المستخدمين حسب مستوى العضوية
    const usersByMembership = await getUsersByMembership();

    // الحصول على المهام حسب اليوم (آخر 7 أيام)
    const tasksByDay = await getTasksByDay();

    // الحصول على أفضل المحيلين
    const topReferrers = await getTopReferrers();

    return {
      totalUsers,
      activeUsers,
      totalDeposits,
      totalWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      totalTransactions,
      totalReferrals,
      totalProfit,
      depositsByDay,
      withdrawalsByDay,
      usersByMembership,
      tasksByDay,
      topReferrers
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

// الحصول على المعاملات حسب اليوم (آخر 7 أيام)
const getTransactionsByDay = async (collectionName: string, status: string): Promise<{ label: string; value: number }[]> => {
  try {
    // إنشاء قاموس لتجميع المبالغ حسب التاريخ
    const dateAmounts: Record<string, number> = {};
    
    // تهيئة القاموس بأيام الأسبوع الماضي
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      dateAmounts[dateStr] = 0;
    }
    
    // الحصول على المعاملات المقبولة في آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const transactionsSnapshot = await getDocs(
      query(
        collection(db, collectionName),
        where('status', '==', status),
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      )
    );
    
    // تجميع المبالغ حسب التاريخ
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const dateStr = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        dateAmounts[dateStr] = (dateAmounts[dateStr] || 0) + (data.amount || 0);
      }
    });
    
    // تحويل القاموس إلى مصفوفة
    return Object.entries(dateAmounts).map(([label, value]) => ({ label, value }));
  } catch (error) {
    console.error(`Error getting ${collectionName} by day:`, error);
    return [];
  }
};

// الحصول على المستخدمين حسب مستوى العضوية
const getUsersByMembership = async (): Promise<{ label: string; value: number }[]> => {
  try {
    const membershipLevels = [
      { level: 0, label: 'Iseix Basic' },
      { level: 1, label: 'Iseix Silver' },
      { level: 2, label: 'Iseix Gold' },
      { level: 3, label: 'Iseix Platinum' },
      { level: 4, label: 'Iseix Diamond' },
      { level: 5, label: 'Iseix Elite' }
    ];
    
    const result: { label: string; value: number }[] = [];
    
    for (const membership of membershipLevels) {
      const usersSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          where('membershipLevel', '==', membership.level)
        )
      );
      
      result.push({
        label: membership.label,
        value: usersSnapshot.size
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error getting users by membership:', error);
    return [];
  }
};

// الحصول على المهام حسب اليوم (آخر 7 أيام)
const getTasksByDay = async (): Promise<{ label: string; value: number }[]> => {
  try {
    // إنشاء قاموس لتجميع المهام حسب التاريخ
    const dateTasks: Record<string, number> = {};
    
    // تهيئة القاموس بأيام الأسبوع الماضي
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'long' });
      dateTasks[dateStr] = 0;
    }
    
    // الحصول على المهام المكتملة في آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const tasksSnapshot = await getDocs(
      query(
        collection(db, 'tasks'),
        where('status', '==', 'completed'),
        where('completedAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      )
    );
    
    // تجميع المهام حسب التاريخ
    tasksSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.completedAt) {
        const date = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
        const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'long' });
        dateTasks[dateStr] = (dateTasks[dateStr] || 0) + 1;
      }
    });
    
    // تحويل القاموس إلى مصفوفة
    return Object.entries(dateTasks).map(([label, value]) => ({ label, value }));
  } catch (error) {
    console.error('Error getting tasks by day:', error);
    return [];
  }
};

// الحصول على أفضل المحيلين
const getTopReferrers = async (): Promise<{ label: string; value: number }[]> => {
  try {
    const usersSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        orderBy('referralCount', 'desc'),
        limit(5)
      )
    );
    
    const result: { label: string; value: number }[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      result.push({
        label: data.displayName || data.email || doc.id.substring(0, 8),
        value: data.referralCount || 0
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error getting top referrers:', error);
    return [];
  }
};
