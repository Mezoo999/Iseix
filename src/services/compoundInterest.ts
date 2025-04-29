import { db } from '@/firebase/config';
import { collection, doc, getDoc, updateDoc, setDoc, serverTimestamp, increment, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';

// معدل الفائدة اليومي (بين 2.5% و 4.5%)
const MIN_DAILY_RATE = 0.025;
const MAX_DAILY_RATE = 0.045;

// الحد الأدنى للإيداع
export const MIN_DEPOSIT_AMOUNT = 20;

// الحد الأدنى للسحب
export const MIN_WITHDRAWAL_AMOUNT = 3;

// رسوم السحب
export const WITHDRAWAL_FEE_SMALL = 2; // للمبالغ أقل من 40 دولار
export const WITHDRAWAL_FEE_THRESHOLD = 40;
export const WITHDRAWAL_FEE_PERCENTAGE = 0.05; // 5% للمبالغ أكبر من 40 دولار

// معدلات الإحالة
export const REFERRAL_RATE_LEVEL_1 = 0.05; // 5% للمستوى الأول
export const REFERRAL_RATE_LEVEL_2 = 0.01; // 1% للمستوى الثاني

/**
 * حساب معدل الفائدة اليومي للمستخدم
 * يمكن تخصيص هذه الدالة لتعطي معدلات مختلفة حسب مبلغ الإيداع أو مستوى المستخدم
 */
export const calculateDailyInterestRate = (userId: string, depositAmount: number): number => {
  // يمكن تعديل هذه المعادلة حسب احتياجاتك
  // مثال: زيادة المعدل للمبالغ الأكبر أو للمستخدمين النشطين
  
  // معادلة بسيطة تزيد المعدل مع زيادة المبلغ
  let rate = MIN_DAILY_RATE;
  
  if (depositAmount >= 100) {
    // زيادة المعدل تدريجيًا مع زيادة المبلغ
    const additionalRate = Math.min(
      (depositAmount - 100) / 10000 * (MAX_DAILY_RATE - MIN_DAILY_RATE),
      MAX_DAILY_RATE - MIN_DAILY_RATE
    );
    rate += additionalRate;
  }
  
  return rate;
};

/**
 * حساب الفائدة المركبة لفترة زمنية محددة
 */
export const calculateCompoundInterest = (
  principal: number,
  dailyRate: number,
  days: number
): number => {
  // صيغة الفائدة المركبة: P * (1 + r)^t
  return principal * Math.pow(1 + dailyRate, days);
};

/**
 * إضافة الفائدة اليومية إلى رصيد المستخدم
 */
export const applyDailyInterest = async (userId: string): Promise<boolean> => {
  try {
    // الحصول على بيانات المستخدم
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return false;
    }
    
    const userData = userDoc.data();
    const balances = userData.balances || {};
    
    // حساب الفائدة لكل عملة
    for (const [currency, balance] of Object.entries(balances)) {
      if (typeof balance === 'number' && balance > 0) {
        // حساب معدل الفائدة اليومي
        const dailyRate = calculateDailyInterestRate(userId, balance);
        
        // حساب الفائدة اليومية
        const dailyInterest = balance * dailyRate;
        
        // تحديث الرصيد
        await updateDoc(userRef, {
          [`balances.${currency}`]: increment(dailyInterest)
        });
        
        // إضافة سجل للفائدة
        await addInterestRecord(userId, currency, dailyInterest, dailyRate);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error applying daily interest:', error);
    return false;
  }
};

/**
 * إضافة سجل للفائدة المضافة
 */
const addInterestRecord = async (
  userId: string,
  currency: string,
  amount: number,
  rate: number
) => {
  try {
    const interestRef = collection(db, 'interestRecords');
    await setDoc(doc(interestRef), {
      userId,
      currency,
      amount,
      rate,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding interest record:', error);
  }
};

/**
 * الحصول على سجلات الفائدة للمستخدم
 */
export const getUserInterestRecords = async (userId: string) => {
  try {
    const interestQuery = query(
      collection(db, 'interestRecords'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(interestQuery);
    const records: any[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // ترتيب السجلات حسب التاريخ (الأحدث أولاً)
    return records.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting interest records:', error);
    return [];
  }
};

/**
 * حساب إجمالي الفائدة المكتسبة للمستخدم
 */
export const getTotalInterestEarned = async (userId: string): Promise<Record<string, number>> => {
  try {
    const records = await getUserInterestRecords(userId);
    
    // تجميع الفائدة حسب العملة
    const totalInterest: Record<string, number> = {};
    
    records.forEach((record) => {
      const { currency, amount } = record;
      if (!totalInterest[currency]) {
        totalInterest[currency] = 0;
      }
      totalInterest[currency] += amount;
    });
    
    return totalInterest;
  } catch (error) {
    console.error('Error calculating total interest:', error);
    return {};
  }
};

/**
 * توقع الأرباح المستقبلية بناءً على الرصيد الحالي
 */
export const predictFutureEarnings = async (
  userId: string,
  days: number = 30
): Promise<Record<string, number>> => {
  try {
    // الحصول على بيانات المستخدم
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return {};
    }
    
    const userData = userDoc.data();
    const balances = userData.balances || {};
    
    // حساب الأرباح المتوقعة لكل عملة
    const predictions: Record<string, number> = {};
    
    for (const [currency, balance] of Object.entries(balances)) {
      if (typeof balance === 'number' && balance > 0) {
        // حساب معدل الفائدة اليومي
        const dailyRate = calculateDailyInterestRate(userId, balance as number);
        
        // حساب الفائدة المركبة للفترة المحددة
        const futureValue = calculateCompoundInterest(balance as number, dailyRate, days);
        
        // حساب الربح المتوقع
        predictions[currency] = futureValue - (balance as number);
      }
    }
    
    return predictions;
  } catch (error) {
    console.error('Error predicting future earnings:', error);
    return {};
  }
};
