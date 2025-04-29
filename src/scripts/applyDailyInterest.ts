import { db } from '@/firebase/config';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';

// معدل الفائدة اليومي (بين 2.5% و 4.5%)
const MIN_DAILY_RATE = 0.025;
const MAX_DAILY_RATE = 0.045;

/**
 * حساب معدل الفائدة اليومي للمستخدم
 * يمكن تخصيص هذه الدالة لتعطي معدلات مختلفة حسب مبلغ الإيداع أو مستوى المستخدم
 */
const calculateDailyInterestRate = (userId: string, depositAmount: number): number => {
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
 * تطبيق الفائدة اليومية على جميع المستخدمين
 * هذه الدالة يمكن تشغيلها كوظيفة سحابية مجدولة (Cloud Function) كل 24 ساعة
 */
export const applyDailyInterestToAllUsers = async () => {
  try {
    // الحصول على جميع المستخدمين
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Processing daily interest for ${usersSnapshot.size} users`);
    
    // تطبيق الفائدة على كل مستخدم
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const balances = userData.balances || {};
      
      // حساب الفائدة لكل عملة
      for (const [currency, balance] of Object.entries(balances)) {
        if (typeof balance === 'number' && balance > 0) {
          // حساب معدل الفائدة اليومي
          const dailyRate = calculateDailyInterestRate(userId, balance as number);
          
          // حساب الفائدة اليومية
          const dailyInterest = (balance as number) * dailyRate;
          
          console.log(`User ${userId}: Adding ${dailyInterest.toFixed(8)} ${currency} interest (rate: ${(dailyRate * 100).toFixed(2)}%)`);
          
          // تحديث الرصيد
          await updateDoc(doc(db, 'users', userId), {
            [`balances.${currency}`]: increment(dailyInterest),
            totalProfit: increment(dailyInterest)
          });
          
          // إضافة سجل للفائدة
          await addInterestRecord(userId, currency, dailyInterest, dailyRate);
        }
      }
    }
    
    console.log('Daily interest applied successfully to all users');
    return { success: true, message: 'Daily interest applied successfully to all users' };
  } catch (error) {
    console.error('Error applying daily interest:', error);
    return { success: false, message: 'Error applying daily interest', error };
  }
};

// يمكن استدعاء هذه الدالة من Cloud Function
// export const applyDailyInterest = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
//   return applyDailyInterestToAllUsers();
// });
