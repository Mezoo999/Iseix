import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * حساب إجمالي المكافآت (الأرباح) للمستخدم
 * @param userId معرف المستخدم
 * @param currency العملة (اختياري)
 * @returns إجمالي المكافآت (الأرباح)
 */
export const getTotalProfits = async (userId: string, currency?: string): Promise<number> => {
  try {
    let totalRewards = 0;

    // 1. استعلام عن معاملات المكافآت والأرباح من مجموعة transactions
    let transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', 'in', ['profit', 'reward', 'referral_reward', 'task_reward'])
    );

    // إضافة تصفية حسب العملة إذا تم تحديدها
    if (currency) {
      transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', 'in', ['profit', 'reward', 'referral_reward', 'task_reward']),
        where('currency', '==', currency)
      );
    }

    const transactionsSnapshot = await getDocs(transactionsQuery);
    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      totalRewards += transaction.amount || 0;
    });

    // 2. استعلام عن مكافآت المهام من مجموعة taskRewards
    let taskRewardsQuery = query(
      collection(db, 'taskRewards'),
      where('userId', '==', userId)
    );

    // إضافة تصفية حسب العملة إذا تم تحديدها
    if (currency) {
      taskRewardsQuery = query(
        collection(db, 'taskRewards'),
        where('userId', '==', userId),
        where('currency', '==', currency)
      );
    }

    const taskRewardsSnapshot = await getDocs(taskRewardsQuery);
    taskRewardsSnapshot.forEach((doc) => {
      const reward = doc.data();
      totalRewards += reward.amount || 0;
    });

    // 3. استعلام عن مكافآت الإحالة من مجموعة referrals
    let referralRewardsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    );

    const referralRewardsSnapshot = await getDocs(referralRewardsQuery);
    referralRewardsSnapshot.forEach((doc) => {
      const referral = doc.data();
      if ((!currency || referral.currency === currency) && referral.commission) {
        totalRewards += referral.commission || 0;
      }
    });

    // 4. استعلام عن إجمالي الأرباح من بيانات المستخدم
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // إذا كان هناك حقل totalProfit في بيانات المستخدم، نستخدمه كقيمة احتياطية
      if (userData.totalProfit && totalRewards === 0) {
        totalRewards = userData.totalProfit;
      }
    }

    console.log(`إجمالي المكافآت للمستخدم ${userId}: ${totalRewards}`);
    return totalRewards;
  } catch (error) {
    console.error('Error calculating total rewards:', error);
    throw error;
  }
};

/**
 * حساب إجمالي الإيداعات للمستخدم
 * @param userId معرف المستخدم
 * @param currency العملة (اختياري)
 * @returns إجمالي الإيداعات
 */
export const getTotalDeposits = async (userId: string, currency?: string): Promise<number> => {
  try {
    // استعلام عن معاملات الإيداع المعتمدة
    let q = query(
      collection(db, 'deposit_requests'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );

    const querySnapshot = await getDocs(q);
    let totalDeposits = 0;

    querySnapshot.forEach((doc) => {
      const deposit = doc.data();
      // إذا تم تحديد العملة، تحقق من تطابقها
      if (!currency || deposit.coin === currency) {
        totalDeposits += deposit.amount || 0;
      }
    });

    return totalDeposits;
  } catch (error) {
    console.error('Error calculating total deposits:', error);
    throw error;
  }
};

/**
 * حساب إجمالي السحوبات للمستخدم
 * @param userId معرف المستخدم
 * @param currency العملة (اختياري)
 * @returns إجمالي السحوبات
 */
export const getTotalWithdrawals = async (userId: string, currency?: string): Promise<number> => {
  try {
    // استعلام عن معاملات السحب المعتمدة
    let q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );

    const querySnapshot = await getDocs(q);
    let totalWithdrawals = 0;

    querySnapshot.forEach((doc) => {
      const withdrawal = doc.data();
      // إذا تم تحديد العملة، تحقق من تطابقها
      if (!currency || withdrawal.coin === currency) {
        totalWithdrawals += withdrawal.amount || 0;
      }
    });

    return totalWithdrawals;
  } catch (error) {
    console.error('Error calculating total withdrawals:', error);
    throw error;
  }
};

/**
 * حساب الأرباح المتاحة للسحب (إجمالي المكافآت)
 * @param userId معرف المستخدم
 * @param currency العملة
 * @returns الأرباح المتاحة للسحب (إجمالي المكافآت)
 */
export const getAvailableProfitsForWithdrawal = async (userId: string, currency: string): Promise<number> => {
  try {
    console.log(`[getAvailableProfitsForWithdrawal] حساب المكافآت المتاحة للسحب للمستخدم ${userId} بالعملة ${currency}`);

    if (!userId) {
      console.error('[getAvailableProfitsForWithdrawal] معرف المستخدم غير صالح');
      return 0;
    }

    // الحصول على إجمالي المكافآت (الأرباح)
    const totalRewards = await getTotalProfits(userId, currency);
    console.log(`[getAvailableProfitsForWithdrawal] إجمالي المكافآت: ${totalRewards}`);

    // الحصول على إجمالي السحوبات
    const totalWithdrawals = await getTotalWithdrawals(userId, currency);
    console.log(`[getAvailableProfitsForWithdrawal] إجمالي السحوبات: ${totalWithdrawals}`);

    // الحصول على طلبات السحب المعلقة
    const pendingWithdrawals = await getPendingWithdrawalsTotal(userId, currency);
    console.log(`[getAvailableProfitsForWithdrawal] إجمالي طلبات السحب المعلقة: ${pendingWithdrawals}`);

    // الأرباح المتاحة = إجمالي المكافآت - (إجمالي السحوبات + طلبات السحب المعلقة)
    const availableProfits = Math.max(0, totalRewards - totalWithdrawals - pendingWithdrawals);
    console.log(`[getAvailableProfitsForWithdrawal] المكافآت المتاحة للسحب: ${availableProfits}`);

    return availableProfits;
  } catch (error) {
    console.error('[getAvailableProfitsForWithdrawal] Error calculating available profits for withdrawal:', error);
    // في حالة حدوث خطأ، نرجع 0 بدلاً من رمي الخطأ
    return 0;
  }
};

/**
 * حساب إجمالي طلبات السحب المعلقة
 * @param userId معرف المستخدم
 * @param currency العملة (اختياري)
 * @returns إجمالي طلبات السحب المعلقة
 */
export const getPendingWithdrawalsTotal = async (userId: string, currency?: string): Promise<number> => {
  try {
    console.log(`[getPendingWithdrawalsTotal] حساب إجمالي طلبات السحب المعلقة للمستخدم: ${userId}`);

    // استعلام عن طلبات السحب المعلقة أو قيد المعالجة
    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'processing'])
    );

    const querySnapshot = await getDocs(q);
    let pendingTotal = 0;

    querySnapshot.forEach((doc) => {
      const withdrawal = doc.data();
      // إذا تم تحديد العملة، تحقق من تطابقها
      if (!currency || withdrawal.coin === currency) {
        pendingTotal += withdrawal.amount || 0;
        console.log(`[getPendingWithdrawalsTotal] طلب معلق: ${doc.id}, المبلغ: ${withdrawal.amount}`);
      }
    });

    console.log(`[getPendingWithdrawalsTotal] إجمالي طلبات السحب المعلقة: ${pendingTotal}`);
    return pendingTotal;
  } catch (error) {
    console.error('[getPendingWithdrawalsTotal] Error calculating pending withdrawals total:', error);
    return 0;
  }
};

/**
 * التحقق من وجود طلبات سحب معلقة للمستخدم
 * @param userId معرف المستخدم
 * @returns true إذا كان هناك طلبات سحب معلقة، false إذا لم يكن
 */
export const hasPendingWithdrawals = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[hasPendingWithdrawals] التحقق من وجود طلبات سحب معلقة للمستخدم: ${userId}`);

    // استعلام عن طلبات السحب المعلقة أو قيد المعالجة
    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'processing'])
    );

    const querySnapshot = await getDocs(q);
    const hasPending = !querySnapshot.empty;

    console.log(`[hasPendingWithdrawals] نتيجة التحقق: ${hasPending ? 'يوجد طلبات معلقة' : 'لا يوجد طلبات معلقة'}`);

    if (hasPending) {
      // طباعة معلومات عن الطلبات المعلقة للتشخيص
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`[hasPendingWithdrawals] طلب معلق: ${doc.id}, الحالة: ${data.status}, المبلغ: ${data.amount}, تاريخ الإنشاء: ${data.createdAt?.toDate?.() || 'غير معروف'}`);
      });
    }

    return hasPending;
  } catch (error) {
    console.error('[hasPendingWithdrawals] Error checking pending withdrawals:', error);
    // في حالة حدوث خطأ، نفترض أنه لا توجد طلبات معلقة لتجنب منع المستخدم من السحب
    console.log('[hasPendingWithdrawals] حدث خطأ، نفترض أنه لا توجد طلبات معلقة');
    return false;
  }
};

/**
 * التحقق مما إذا كان المبلغ المطلوب سحبه ضمن الأرباح المتاحة
 * @param userId معرف المستخدم
 * @param amount المبلغ المطلوب سحبه
 * @param currency العملة
 * @returns كائن يحتوي على نتيجة التحقق ورسالة
 */
export const validateWithdrawalAmount = async (
  userId: string,
  amount: number,
  currency: string
): Promise<{ isValid: boolean; message: string }> => {
  try {
    // التحقق من وجود طلبات سحب معلقة
    const hasPending = await hasPendingWithdrawals(userId);
    if (hasPending) {
      return {
        isValid: false,
        message: 'لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.'
      };
    }

    // الحصول على الأرباح المتاحة للسحب
    const availableProfits = await getAvailableProfitsForWithdrawal(userId, currency);

    // التحقق من أن المبلغ المطلوب سحبه لا يتجاوز المكافآت المتاحة
    if (amount > availableProfits) {
      return {
        isValid: false,
        message: `يمكنك فقط سحب المكافآت. المكافآت المتاحة للسحب: ${availableProfits.toFixed(2)} ${currency}`
      };
    }

    // التحقق من الحد الأدنى للسحب
    if (amount < 20) {
      return {
        isValid: false,
        message: `الحد الأدنى للسحب هو 20 ${currency}`
      };
    }

    return {
      isValid: true,
      message: 'المبلغ صالح للسحب'
    };
  } catch (error) {
    console.error('Error validating withdrawal amount:', error);
    throw error;
  }
};
