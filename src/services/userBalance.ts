import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * تحديث رصيد المستخدم مع دعم الأرصدة غير القابلة للسحب
 * @param userId معرف المستخدم
 * @param amount المبلغ
 * @param source مصدر المبلغ (نوع المعاملة)
 * @param withdrawable هل المبلغ قابل للسحب
 * @returns وعد يشير إلى نجاح العملية
 */
export const updateUserBalance = async (
  userId: string,
  amount: number,
  source: string,
  withdrawable: boolean = true
): Promise<boolean> => {
  try {
    console.log(`[userBalance.ts] تحديث رصيد المستخدم: ${userId}, المبلغ: ${amount}, المصدر: ${source}, قابل للسحب: ${withdrawable}`);

    // التحقق من صحة المعلمات
    if (!userId) throw new Error('معرف المستخدم مطلوب');
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

    const userRef = doc(db, 'users', userId);

    // الحصول على بيانات المستخدم الحالية للتحقق
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error(`لم يتم العثور على بيانات المستخدم: ${userId}`);
    }

    const userData = userDoc.data();
    const currentBalance = (userData.balances && userData.balances.USDT) || 0;
    const currentWithdrawableBalance = (userData.withdrawableBalance) || 0;
    const currentNonWithdrawableBalance = (userData.nonWithdrawableBalance) || 0;

    console.log(`[userBalance.ts] الرصيد الحالي للمستخدم ${userId}:`);
    console.log(`- الرصيد الكلي: ${currentBalance} USDT`);
    console.log(`- الرصيد القابل للسحب: ${currentWithdrawableBalance} USDT`);
    console.log(`- الرصيد غير القابل للسحب: ${currentNonWithdrawableBalance} USDT`);

    // تحديث الرصيد
    const updateData: Record<string, any> = {
      'balances.USDT': increment(amount),
      updatedAt: serverTimestamp()
    };

    // تحديث الرصيد القابل للسحب أو غير القابل للسحب
    if (withdrawable) {
      updateData.withdrawableBalance = increment(amount);
    } else {
      updateData.nonWithdrawableBalance = increment(amount);
    }

    // تحديث الإحصائيات الأخرى حسب نوع المعاملة
    if (source === 'deposit') {
      updateData.totalDeposited = increment(amount);
    } else if (source === 'withdrawal') {
      // لا يمكن سحب المبالغ غير القابلة للسحب
      if (!withdrawable) {
        throw new Error('لا يمكن سحب المبالغ غير القابلة للسحب');
      }
      
      // التحقق من وجود رصيد كافٍ للسحب
      if (currentWithdrawableBalance < amount) {
        throw new Error(`رصيد غير كافٍ للسحب. الرصيد القابل للسحب: ${currentWithdrawableBalance} USDT, المبلغ المطلوب: ${amount} USDT`);
      }
      
      updateData.withdrawableBalance = increment(-amount);
      updateData['balances.USDT'] = increment(-amount);
      updateData.totalWithdrawn = increment(amount);
    } else if (source === 'investment') {
      updateData.totalInvested = increment(amount);
    } else if (source === 'profit') {
      updateData.totalProfit = increment(amount);
    } else if (source === 'referral') {
      updateData.totalReferralEarnings = increment(amount);
    } else if (source === 'lucky_wheel_reward' || source === 'registration_reward') {
      // لا شيء إضافي للتحديث
    }

    // تنفيذ التحديث
    await updateDoc(userRef, updateData);

    // التحقق من نجاح التحديث
    const updatedUserDoc = await getDoc(userRef);
    const updatedUserData = updatedUserDoc.data();
    const newBalance = (updatedUserData.balances && updatedUserData.balances.USDT) || 0;
    const newWithdrawableBalance = updatedUserData.withdrawableBalance || 0;
    const newNonWithdrawableBalance = updatedUserData.nonWithdrawableBalance || 0;

    console.log(`[userBalance.ts] تم تحديث رصيد المستخدم ${userId} بنجاح:`);
    console.log(`- الرصيد الجديد: ${newBalance} USDT`);
    console.log(`- الرصيد القابل للسحب: ${newWithdrawableBalance} USDT`);
    console.log(`- الرصيد غير القابل للسحب: ${newNonWithdrawableBalance} USDT`);

    return true;
  } catch (error) {
    console.error('[userBalance.ts] Error updating user balance:', error);
    throw error;
  }
};

/**
 * التحقق من وجود رصيد كافٍ للسحب
 * @param userId معرف المستخدم
 * @param amount المبلغ المطلوب سحبه
 * @returns وعد يشير إلى وجود رصيد كافٍ
 */
export const hasEnoughWithdrawableBalance = async (
  userId: string,
  amount: number
): Promise<boolean> => {
  try {
    console.log(`[userBalance.ts] التحقق من وجود رصيد كافٍ للسحب للمستخدم: ${userId}, المبلغ: ${amount}`);

    if (!userId) {
      console.error('[userBalance.ts] معرف المستخدم غير صالح');
      return false;
    }

    if (amount <= 0) {
      console.error('[userBalance.ts] المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error(`[userBalance.ts] لم يتم العثور على بيانات المستخدم: ${userId}`);
      return false;
    }

    const userData = userDoc.data();
    const withdrawableBalance = userData.withdrawableBalance || 0;

    console.log(`[userBalance.ts] الرصيد القابل للسحب للمستخدم ${userId}: ${withdrawableBalance} USDT, المبلغ المطلوب: ${amount} USDT`);

    const hasEnough = withdrawableBalance >= amount;
    console.log(`[userBalance.ts] نتيجة التحقق من الرصيد: ${hasEnough ? 'كافٍ' : 'غير كافٍ'}`);

    return hasEnough;
  } catch (error) {
    console.error('[userBalance.ts] Error checking withdrawable balance:', error);
    return false;
  }
};

/**
 * الحصول على معلومات رصيد المستخدم
 * @param userId معرف المستخدم
 * @returns وعد يحتوي على معلومات الرصيد
 */
export const getUserBalanceInfo = async (userId: string): Promise<{
  totalBalance: number;
  withdrawableBalance: number;
  nonWithdrawableBalance: number;
}> => {
  try {
    console.log(`[userBalance.ts] جلب معلومات رصيد المستخدم: ${userId}`);

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`لم يتم العثور على بيانات المستخدم: ${userId}`);
    }

    const userData = userDoc.data();
    const totalBalance = (userData.balances && userData.balances.USDT) || 0;
    const withdrawableBalance = userData.withdrawableBalance || 0;
    const nonWithdrawableBalance = userData.nonWithdrawableBalance || 0;

    return {
      totalBalance,
      withdrawableBalance,
      nonWithdrawableBalance
    };
  } catch (error) {
    console.error('[userBalance.ts] Error getting user balance info:', error);
    throw error;
  }
};
