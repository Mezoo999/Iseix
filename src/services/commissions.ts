import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Commission {
  id: string;
  userId: string;
  referredId: string;
  referredName: string;
  referredEmail: string;
  amount: number;
  currency: string;
  level: number;
  type: 'deposit' | 'task' | 'withdrawal' | 'other';
  status: 'pending' | 'completed' | 'rejected';
  timestamp: Timestamp;
  description?: string;
}

/**
 * جلب سجل العمولات للمستخدم
 * @param userId معرف المستخدم
 * @param limitCount عدد النتائج المطلوبة
 * @returns قائمة بالعمولات
 */
export const getUserCommissions = async (userId: string, limitCount = 50): Promise<Commission[]> => {
  try {
    // البحث في مجموعة المعاملات عن العمولات
    const commissionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'referral_commission'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const commissionsSnapshot = await getDocs(commissionsQuery);
    const commissions: Commission[] = [];

    commissionsSnapshot.forEach(doc => {
      const data = doc.data();
      commissions.push({
        id: doc.id,
        userId: data.userId,
        referredId: data.metadata?.referredId || '',
        referredName: data.metadata?.referredName || 'مستخدم',
        referredEmail: data.metadata?.referredEmail || '',
        amount: data.amount || 0,
        currency: data.currency || 'USDT',
        level: data.metadata?.level || 1,
        type: data.metadata?.sourceType || 'other',
        status: data.status || 'completed',
        timestamp: data.createdAt,
        description: data.description || ''
      });
    });

    return commissions;
  } catch (error) {
    console.error('[commissions.ts] خطأ في جلب سجل العمولات:', error);
    throw error;
  }
};

/**
 * جلب إحصائيات العمولات الشهرية للمستخدم
 * @param userId معرف المستخدم
 * @param months عدد الأشهر المطلوبة
 * @returns قائمة بالإحصائيات الشهرية
 */
export const getMonthlyCommissionsStats = async (userId: string, months = 6): Promise<any[]> => {
  try {
    // الحصول على تاريخ بداية الفترة (قبل عدد الأشهر المحدد)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // البحث عن جميع العمولات في الفترة المحددة
    const commissionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'referral_commission'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );

    const commissionsSnapshot = await getDocs(commissionsQuery);
    
    // إنشاء مصفوفة للأشهر
    const monthlyStats: Record<string, { month: string, amount: number, count: number }> = {};
    
    // تهيئة الأشهر
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
      monthlyStats[monthKey] = { month: monthName, amount: 0, count: 0 };
    }

    // تجميع البيانات حسب الشهر
    commissionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && data.status === 'completed') {
        const date = data.createdAt.toDate();
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].amount += data.amount || 0;
          monthlyStats[monthKey].count += 1;
        }
      }
    });

    // تحويل البيانات إلى مصفوفة وترتيبها
    return Object.values(monthlyStats).reverse();
  } catch (error) {
    console.error('[commissions.ts] خطأ في جلب إحصائيات العمولات الشهرية:', error);
    return [];
  }
};

/**
 * جلب إحصائيات العمولات حسب المستوى
 * @param userId معرف المستخدم
 * @returns إحصائيات العمولات حسب المستوى
 */
export const getCommissionsByLevel = async (userId: string): Promise<any[]> => {
  try {
    // البحث عن جميع العمولات
    const commissionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'referral_commission'),
      where('status', '==', 'completed')
    );

    const commissionsSnapshot = await getDocs(commissionsQuery);
    
    // إنشاء مصفوفة للمستويات
    const levelStats: Record<number, { level: number, amount: number, count: number }> = {
      1: { level: 1, amount: 0, count: 0 },
      2: { level: 2, amount: 0, count: 0 },
      3: { level: 3, amount: 0, count: 0 },
      4: { level: 4, amount: 0, count: 0 },
      5: { level: 5, amount: 0, count: 0 },
      6: { level: 6, amount: 0, count: 0 }
    };

    // تجميع البيانات حسب المستوى
    commissionsSnapshot.forEach(doc => {
      const data = doc.data();
      const level = data.metadata?.level || 1;
      
      if (levelStats[level]) {
        levelStats[level].amount += data.amount || 0;
        levelStats[level].count += 1;
      }
    });

    // تحويل البيانات إلى مصفوفة
    return Object.values(levelStats);
  } catch (error) {
    console.error('[commissions.ts] خطأ في جلب إحصائيات العمولات حسب المستوى:', error);
    return [];
  }
};

/**
 * الحصول على اسم نوع العمولة
 * @param type نوع العمولة
 * @returns اسم نوع العمولة بالعربية
 */
export const getCommissionTypeLabel = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'إيداع';
    case 'task':
      return 'مهمة';
    case 'withdrawal':
      return 'سحب';
    default:
      return 'أخرى';
  }
};

/**
 * تنسيق التاريخ
 * @param timestamp الطابع الزمني
 * @returns التاريخ منسقًا
 */
export const formatCommissionDate = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'غير معروف';
  
  const date = timestamp.toDate();
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
