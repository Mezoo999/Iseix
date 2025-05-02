import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  Reward,
  RewardType,
  RewardStatus,
  LuckyWheelSettings,
  UserLuckyWheelHistory,
  LuckyWheelPrize,
} from '@/types/rewards';
import { updateUserBalance } from '@/services/userBalance';

// الإعدادات الافتراضية لعجلة الحظ
const defaultLuckyWheelSettings: LuckyWheelSettings = {
  isEnabled: false,
  prizes: [
    { id: '1', amount: 0.5, probability: 40, color: '#3B82F6' },
    { id: '2', amount: 1, probability: 30, color: '#10B981' },
    { id: '3', amount: 1.5, probability: 20, color: '#F59E0B' },
    { id: '4', amount: 2, probability: 10, color: '#EF4444' },
  ],
  lastUpdated: new Date(),
};

/**
 * الحصول على إعدادات عجلة الحظ
 */
export const getLuckyWheelSettings = async (): Promise<LuckyWheelSettings> => {
  try {
    const settingsRef = doc(db, 'settings', 'luckyWheel');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        isEnabled: data.isEnabled,
        nextAvailableDate: data.nextAvailableDate?.toDate(),
        prizes: data.prizes,
        lastUpdated: data.lastUpdated.toDate(),
      };
    } else {
      // إنشاء الإعدادات الافتراضية إذا لم تكن موجودة
      await setDoc(settingsRef, {
        ...defaultLuckyWheelSettings,
        lastUpdated: serverTimestamp(),
      });
      return defaultLuckyWheelSettings;
    }
  } catch (error) {
    console.error('خطأ في الحصول على إعدادات عجلة الحظ:', error);
    return defaultLuckyWheelSettings;
  }
};

/**
 * تحديث إعدادات عجلة الحظ
 */
export const updateLuckyWheelSettings = async (
  settings: Partial<LuckyWheelSettings>
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, 'settings', 'luckyWheel');
    await updateDoc(settingsRef, {
      ...settings,
      lastUpdated: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('خطأ في تحديث إعدادات عجلة الحظ:', error);
    return false;
  }
};

/**
 * الحصول على سجل استخدام عجلة الحظ للمستخدم
 */
export const getUserLuckyWheelHistory = async (
  userId: string
): Promise<UserLuckyWheelHistory> => {
  try {
    const historyRef = doc(db, 'users', userId, 'rewards', 'luckyWheelHistory');
    const historyDoc = await getDoc(historyRef);

    if (historyDoc.exists()) {
      const data = historyDoc.data();
      return {
        userId,
        lastSpinDate: data.lastSpinDate?.toDate(),
        nextAvailableDate: data.nextAvailableDate?.toDate(),
        spinCount: data.spinCount || 0,
      };
    } else {
      // إنشاء سجل جديد إذا لم يكن موجودًا
      const newHistory: UserLuckyWheelHistory = {
        userId,
        spinCount: 0,
      };
      await setDoc(historyRef, newHistory);
      return newHistory;
    }
  } catch (error) {
    console.error('خطأ في الحصول على سجل استخدام عجلة الحظ:', error);
    return { userId, spinCount: 0 };
  }
};

/**
 * التحقق مما إذا كان المستخدم يمكنه استخدام عجلة الحظ
 */
export const canUserSpinLuckyWheel = async (userId: string): Promise<boolean> => {
  try {
    // التحقق من إعدادات العجلة
    const settings = await getLuckyWheelSettings();
    if (!settings.isEnabled) {
      return false;
    }

    // التحقق من سجل المستخدم
    const userHistory = await getUserLuckyWheelHistory(userId);
    const now = new Date();

    // إذا كان هناك تاريخ للإتاحة التالية، تحقق منه
    if (userHistory.nextAvailableDate) {
      return now >= userHistory.nextAvailableDate;
    }

    return true;
  } catch (error) {
    console.error('خطأ في التحقق من إمكانية استخدام عجلة الحظ:', error);
    return false;
  }
};

/**
 * لف عجلة الحظ والحصول على جائزة
 */
export const spinLuckyWheel = async (userId: string): Promise<{ success: boolean; reward?: Reward }> => {
  try {
    // التحقق من إمكانية استخدام العجلة
    const canSpin = await canUserSpinLuckyWheel(userId);
    if (!canSpin) {
      return { success: false };
    }

    // الحصول على إعدادات العجلة
    const settings = await getLuckyWheelSettings();

    // اختيار جائزة عشوائية بناءً على الاحتمالية
    const prize = selectRandomPrize(settings.prizes);

    // إضافة المكافأة إلى رصيد المستخدم فوراً
    await updateUserBalance(userId, prize.amount, 'lucky_wheel_reward', false);

    // إنشاء مكافأة جديدة (مباشرة بحالة CLAIMED)
    const reward: Omit<Reward, 'id'> = {
      userId,
      type: RewardType.LUCKY_WHEEL,
      amount: prize.amount,
      status: RewardStatus.CLAIMED, // مباشرة بحالة تم الإضافة
      createdAt: new Date(),
      claimedAt: new Date(), // تعيين وقت الإضافة فوراً
      withdrawable: false, // غير قابلة للسحب
    };

    // إضافة المكافأة إلى قاعدة البيانات
    const rewardRef = await addDoc(collection(db, 'rewards'), {
      ...reward,
      createdAt: serverTimestamp(),
      claimedAt: serverTimestamp(),
    });

    // تحديث سجل استخدام العجلة للمستخدم
    const historyRef = doc(db, 'users', userId, 'rewards', 'luckyWheelHistory');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7); // الإتاحة التالية بعد أسبوع

    await updateDoc(historyRef, {
      lastSpinDate: serverTimestamp(),
      nextAvailableDate: Timestamp.fromDate(nextWeek),
      spinCount: (await getUserLuckyWheelHistory(userId)).spinCount + 1,
    });

    return {
      success: true,
      reward: {
        ...reward,
        id: rewardRef.id,
        status: RewardStatus.CLAIMED,
        claimedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('خطأ في لف عجلة الحظ:', error);
    return { success: false };
  }
};

/**
 * اختيار جائزة عشوائية بناءً على الاحتمالية
 */
const selectRandomPrize = (prizes: LuckyWheelPrize[]): LuckyWheelPrize => {
  // التحقق من صحة الاحتمالات
  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
  if (totalProbability !== 100) {
    console.warn('مجموع احتمالات الجوائز لا يساوي 100%، سيتم تعديل الاحتمالات');
  }

  // إنشاء مصفوفة تراكمية للاحتمالات
  const cumulativeProbabilities: number[] = [];
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    cumulativeProbabilities.push(cumulativeProbability);
  }

  // اختيار رقم عشوائي بين 0 و 100
  const randomNumber = Math.random() * 100;

  // اختيار الجائزة المناسبة
  for (let i = 0; i < cumulativeProbabilities.length; i++) {
    if (randomNumber <= cumulativeProbabilities[i]) {
      return prizes[i];
    }
  }

  // في حالة حدوث خطأ، إرجاع الجائزة الأولى
  return prizes[0];
};

/**
 * إضافة مكافأة التسجيل للمستخدم الجديد
 */
export const addRegistrationReward = async (userId: string): Promise<boolean> => {
  try {
    // التحقق مما إذا كان المستخدم قد حصل على مكافأة التسجيل من قبل
    const rewardsQuery = query(
      collection(db, 'rewards'),
      where('userId', '==', userId),
      where('type', '==', RewardType.REGISTRATION)
    );

    const rewardsSnapshot = await getDocs(rewardsQuery);
    if (!rewardsSnapshot.empty) {
      console.log('المستخدم حصل على مكافأة التسجيل من قبل');
      return false;
    }

    // إنشاء مكافأة التسجيل
    const reward: Omit<Reward, 'id'> = {
      userId,
      type: RewardType.REGISTRATION,
      amount: 2, // 2 USDT
      status: RewardStatus.PENDING,
      createdAt: new Date(),
      withdrawable: false, // غير قابلة للسحب
    };

    // إضافة المكافأة إلى قاعدة البيانات
    const rewardRef = await addDoc(collection(db, 'rewards'), {
      ...reward,
      createdAt: serverTimestamp(),
    });

    // إضافة المكافأة إلى رصيد المستخدم
    await updateUserBalance(userId, 2, 'registration_reward', false);

    // تحديث حالة المكافأة إلى "تم المطالبة بها"
    await updateDoc(doc(db, 'rewards', rewardRef.id), {
      status: RewardStatus.CLAIMED,
      claimedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('خطأ في إضافة مكافأة التسجيل:', error);
    return false;
  }
};

/**
 * الحصول على مكافآت المستخدم
 */
export const getUserRewards = async (userId: string): Promise<Reward[]> => {
  try {
    const rewardsQuery = query(
      collection(db, 'rewards'),
      where('userId', '==', userId)
    );

    const rewardsSnapshot = await getDocs(rewardsQuery);
    const rewards: Reward[] = [];

    rewardsSnapshot.forEach((doc) => {
      const data = doc.data();
      rewards.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt.toDate(),
        claimedAt: data.claimedAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        withdrawable: data.withdrawable,
      });
    });

    return rewards;
  } catch (error) {
    console.error('خطأ في الحصول على مكافآت المستخدم:', error);
    return [];
  }
};
