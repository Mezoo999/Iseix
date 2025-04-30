import { db } from '@/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp, Timestamp, increment } from 'firebase/firestore';

// درجات الأعضاء
export enum MembershipLevel {
  BASIC = 'basic',      // Iseix Basic (GROK-0)
  SILVER = 'silver',    // Iseix Silver (GROK-1.0)
  GOLD = 'gold',        // Iseix Gold (GROK-2.0)
  PLATINUM = 'platinum', // Iseix Platinum (GROK-3.0)
  DIAMOND = 'diamond',   // Iseix Diamond (GROK-4.0)
  ELITE = 'elite'       // Iseix Elite (GROK-5.0)
}

// تحويل القيم الرقمية إلى قيم MembershipLevel
export const NUMERIC_TO_MEMBERSHIP_LEVEL = {
  0: MembershipLevel.BASIC,
  1: MembershipLevel.SILVER,
  2: MembershipLevel.GOLD,
  3: MembershipLevel.PLATINUM,
  4: MembershipLevel.DIAMOND,
  5: MembershipLevel.ELITE
};

// أسماء المستويات للعرض
export const MEMBERSHIP_LEVEL_NAMES = {
  [MembershipLevel.BASIC]: 'Iseix Basic',
  [MembershipLevel.SILVER]: 'Iseix Silver',
  [MembershipLevel.GOLD]: 'Iseix Gold',
  [MembershipLevel.PLATINUM]: 'Iseix Platinum',
  [MembershipLevel.DIAMOND]: 'Iseix Diamond',
  [MembershipLevel.ELITE]: 'Iseix Elite',
  // دعم القيم الرقمية
  '0': 'Iseix Basic',
  '1': 'Iseix Silver',
  '2': 'Iseix Gold',
  '3': 'Iseix Platinum',
  '4': 'Iseix Diamond',
  '5': 'Iseix Elite'
};

// معدلات الربح لكل درجة عضوية (نسبة مئوية)
export const PROFIT_RATES = {
  [MembershipLevel.BASIC]: { min: 2.76, max: 2.84 },     // 2.76% ~ 2.84% لكل مهمة للعضوية الأساسية
  [MembershipLevel.SILVER]: { min: 2.76, max: 2.84 },    // 2.76% ~ 2.84% لكل مهمة للعضوية الفضية
  [MembershipLevel.GOLD]: { min: 3.12, max: 3.20 },      // 3.12% ~ 3.20% لكل مهمة للعضوية الذهبية
  [MembershipLevel.PLATINUM]: { min: 3.48, max: 3.60 },  // 3.48% ~ 3.60% لكل مهمة للعضوية البلاتينية
  [MembershipLevel.DIAMOND]: { min: 3.90, max: 4.02 },   // 3.90% ~ 4.02% لكل مهمة للعضوية الماسية
  [MembershipLevel.ELITE]: { min: 4.95, max: 5.04 },     // 4.95% ~ 5.04% لكل مهمة للعضوية النخبة
  // دعم القيم الرقمية
  '0': { min: 2.76, max: 2.84 },
  '1': { min: 2.76, max: 2.84 },
  '2': { min: 3.12, max: 3.20 },
  '3': { min: 3.48, max: 3.60 },
  '4': { min: 3.90, max: 4.02 },
  '5': { min: 4.95, max: 5.04 }
};

// عدد المهام اليومية المتاحة لكل مستوى
export const DAILY_TASKS_COUNT = {
  [MembershipLevel.BASIC]: 3,      // 3 مهام يومية للعضوية الأساسية
  [MembershipLevel.SILVER]: 3,     // 3 مهام يومية للعضوية الفضية
  [MembershipLevel.GOLD]: 3,       // 3 مهام يومية للعضوية الذهبية
  [MembershipLevel.PLATINUM]: 3,   // 3 مهام يومية للعضوية البلاتينية
  [MembershipLevel.DIAMOND]: 3,    // 3 مهام يومية للعضوية الماسية
  [MembershipLevel.ELITE]: 3,      // 3 مهام يومية للعضوية النخبة
  // دعم القيم الرقمية
  '0': 3,
  '1': 3,
  '2': 3,
  '3': 3,
  '4': 3,
  '5': 3
};

// الحد الأدنى للمبلغ المطلوب لكل مستوى
export const MIN_UNLOCK_AMOUNT = {
  [MembershipLevel.BASIC]: 2,      // 2 USDT للعضوية الأساسية
  [MembershipLevel.SILVER]: 22,    // 22 USDT للعضوية الفضية
  [MembershipLevel.GOLD]: 30,      // 30 USDT للعضوية الذهبية
  [MembershipLevel.PLATINUM]: 50,  // 50 USDT للعضوية البلاتينية
  [MembershipLevel.DIAMOND]: 100,  // 100 USDT للعضوية الماسية
  [MembershipLevel.ELITE]: 500,    // 500 USDT للعضوية النخبة
  // دعم القيم الرقمية
  '0': 2,
  '1': 22,
  '2': 30,
  '3': 50,
  '4': 100,
  '5': 500
};

// عدد أيام المهام المتاحة لكل مستوى
export const QUANTIFIABLE_DAYS = {
  [MembershipLevel.BASIC]: 3,      // 3 أيام للعضوية الأساسية
  [MembershipLevel.SILVER]: 100,   // 100 يوم للعضوية الفضية
  [MembershipLevel.GOLD]: 100,     // 100 يوم للعضوية الذهبية
  [MembershipLevel.PLATINUM]: 180, // 180 يوم للعضوية البلاتينية
  [MembershipLevel.DIAMOND]: 180,  // 180 يوم للعضوية الماسية
  [MembershipLevel.ELITE]: 365,    // 365 يوم للعضوية النخبة
  // دعم القيم الرقمية
  '0': 3,
  '1': 100,
  '2': 100,
  '3': 180,
  '4': 180,
  '5': 365
};

// عدد المروجين المطلوبين لكل مستوى
export const REQUIRED_PROMOTERS = {
  [MembershipLevel.BASIC]: 0,      // لا يتطلب مروجين للعضوية الأساسية
  [MembershipLevel.SILVER]: 0,     // لا يتطلب مروجين للعضوية الفضية
  [MembershipLevel.GOLD]: 3,       // 3 مروجين للعضوية الذهبية
  [MembershipLevel.PLATINUM]: 10,  // 10 مروجين للعضوية البلاتينية
  [MembershipLevel.DIAMOND]: 20,   // 20 مروج للعضوية الماسية
  [MembershipLevel.ELITE]: 50,     // 50 مروج للعضوية النخبة
  // دعم القيم الرقمية
  '0': 0,
  '1': 0,
  '2': 3,
  '3': 10,
  '4': 20,
  '5': 50
};

// واجهة سجل المهام اليومية
export interface DailyTasksRecord {
  id?: string;
  userId: string;
  date: string; // بتنسيق YYYY-MM-DD
  totalTasks: number; // إجمالي عدد المهام المتاحة يوميًا
  completedTasks: number; // عدد المهام المكتملة
  remainingTasks: number; // عدد المهام المتبقية
  lastCompletedAt?: Timestamp; // وقت آخر مهمة مكتملة
  totalReward: number; // إجمالي المكافآت
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * الحصول على درجة العضوية للمستخدم
 */
export const getUserMembershipLevel = async (userId: string): Promise<MembershipLevel> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return MembershipLevel.BASIC;
    }

    const userData = userDoc.data();
    const membershipLevel = userData.membershipLevel;

    // إذا كان مستوى العضوية رقمياً، قم بتحويله إلى قيمة MembershipLevel
    if (typeof membershipLevel === 'number') {
      return NUMERIC_TO_MEMBERSHIP_LEVEL[membershipLevel] || MembershipLevel.BASIC;
    }

    // إذا كان مستوى العضوية نصياً، تأكد من أنه قيمة صالحة من MembershipLevel
    if (typeof membershipLevel === 'string' && Object.values(MembershipLevel).includes(membershipLevel)) {
      return membershipLevel as MembershipLevel;
    }

    return MembershipLevel.BASIC;
  } catch (error) {
    console.error('Error getting user membership level:', error);
    return MembershipLevel.BASIC;
  }
};

/**
 * إنشاء أو جلب سجل المهام اليومية للمستخدم
 */
export const getUserDailyTasksRecord = async (userId: string): Promise<DailyTasksRecord> => {
  try {
    // إنشاء تاريخ اليوم بتنسيق YYYY-MM-DD
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // التحقق مما إذا كان سجل المهام اليومية موجود بالفعل
    const tasksRef = collection(db, 'dailyTasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('date', '==', dateString)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // سجل المهام اليومية موجود بالفعل، إرجاع البيانات الموجودة
      const existingRecord = querySnapshot.docs[0].data() as DailyTasksRecord;
      existingRecord.id = querySnapshot.docs[0].id;
      return existingRecord;
    }

    // الحصول على درجة العضوية لتحديد عدد المهام المتاحة
    let membershipLevel;
    try {
      membershipLevel = await getUserMembershipLevel(userId);
    } catch (error) {
      console.error('Error getting user membership level:', error);
      membershipLevel = MembershipLevel.BASIC;
    }

    const tasksCount = DAILY_TASKS_COUNT[membershipLevel] || 2; // استخدام 2 كقيمة افتراضية

    // إنشاء سجل جديد للمهام اليومية
    const dailyTasksRecord: DailyTasksRecord = {
      userId,
      date: dateString,
      totalTasks: tasksCount,
      completedTasks: 0,
      remainingTasks: tasksCount,
      totalReward: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // حفظ السجل في قاعدة البيانات
    const docRef = doc(tasksRef);
    await setDoc(docRef, dailyTasksRecord);

    // إضافة معرف المستند
    dailyTasksRecord.id = docRef.id;

    return dailyTasksRecord;
  } catch (error) {
    console.error('Error getting daily tasks record:', error);
    throw error;
  }
};

/**
 * الحصول على المهام اليومية للمستخدم
 */
export const getUserDailyTasks = async (userId: string): Promise<DailyTasksRecord | null> => {
  try {
    return await getUserDailyTasksRecord(userId);
  } catch (error) {
    console.error('Error getting user daily tasks:', error);
    return null;
  }
};

/**
 * إكمال مهمة يومية
 */
export const completeTask = async (userId: string): Promise<{ success: boolean; reward?: number; remainingTasks?: number; error?: string }> => {
  try {
    // الحصول على سجل المهام اليومية
    const dailyTasks = await getUserDailyTasksRecord(userId);
    if (!dailyTasks || !dailyTasks.id) {
      return { success: false, error: 'لم يتم العثور على سجل المهام اليومية' };
    }

    // التحقق مما إذا كان هناك مهام متبقية
    if (dailyTasks.remainingTasks <= 0) {
      return { success: false, error: 'لقد أكملت جميع المهام اليومية المتاحة' };
    }

    // الحصول على بيانات المستخدم لحساب المكافأة
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'لم يتم العثور على المستخدم' };
    }

    // الحصول على درجة العضوية
    const membershipLevel = await getUserMembershipLevel(userId);

    const userData = userDoc.data();
    const balance = userData.balances?.USDT || 0;

    // التحقق من الحد الأدنى للمبلغ المطلوب للمستوى
    const minAmount = MIN_UNLOCK_AMOUNT[membershipLevel];
    if (balance < minAmount) {
      return {
        success: false,
        error: `يجب أن يكون رصيدك ${minAmount} USDT على الأقل لإكمال المهام في هذا المستوى`
      };
    }

    // حساب المكافأة (نسبة مئوية من الرصيد)
    const profitRateRange = PROFIT_RATES[membershipLevel] || { min: 2.76, max: 2.84 };
    // اختيار معدل ربح عشوائي بين الحد الأدنى والحد الأقصى
    const profitRate = profitRateRange.min + (Math.random() * (profitRateRange.max - profitRateRange.min));
    const reward = balance * (profitRate / 100);

    // تحديث سجل المهام اليومية
    const tasksRef = doc(db, 'dailyTasks', dailyTasks.id);
    await updateDoc(tasksRef, {
      completedTasks: increment(1),
      remainingTasks: increment(-1),
      totalReward: increment(reward),
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // إضافة المكافأة إلى رصيد المستخدم
    await updateDoc(userRef, {
      'balances.USDT': increment(reward),
      totalProfit: increment(reward)
    });

    // إضافة سجل للمكافأة
    await addTaskRewardRecord(userId, reward, profitRate);

    return {
      success: true,
      reward,
      remainingTasks: dailyTasks.remainingTasks - 1
    };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: 'حدث خطأ أثناء إكمال المهمة' };
  }
};

/**
 * إضافة سجل لمكافأة المهمة
 */
const addTaskRewardRecord = async (userId: string, amount: number, profitRate?: number) => {
  try {
    // التحقق من صحة البيانات قبل الإضافة
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid data for task reward record:', { userId, amount, profitRate });
      return;
    }

    const rewardsRef = collection(db, 'taskRewards');

    // إنشاء كائن البيانات مع التحقق من القيم
    const rewardData: any = {
      userId,
      amount,
      currency: 'USDT',
      timestamp: serverTimestamp()
    };

    // إضافة معدل الربح فقط إذا كان موجودًا وصحيحًا
    if (typeof profitRate === 'number' && !isNaN(profitRate)) {
      rewardData.profitRate = profitRate;
    }

    await setDoc(doc(rewardsRef), rewardData);
  } catch (error) {
    console.error('Error adding task reward record:', error);
  }
};

/**
 * الحصول على سجل مكافآت المهام للمستخدم
 */
export const getUserTaskRewards = async (userId: string) => {
  try {
    const rewardsQuery = query(
      collection(db, 'taskRewards'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(rewardsQuery);
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
    console.error('Error getting task rewards:', error);
    return [];
  }
};

// استيراد وظيفة الحصول على عدد المروجين النشطين من ملف referral.ts
import { getActivePromotersCount } from './referral';

/**
 * التحقق من أهلية المستخدم للترقية إلى مستوى معين
 */
export const checkMembershipUpgradeEligibility = async (
  userId: string,
  targetLevel: MembershipLevel
): Promise<{ eligible: boolean; reason?: string }> => {
  try {
    // الحصول على بيانات المستخدم
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { eligible: false, reason: 'لم يتم العثور على المستخدم' };
    }

    const userData = userDoc.data();
    const currentLevel = userData.membershipLevel || MembershipLevel.BASIC;
    const balance = userData.balances?.USDT || 0;

    // التحقق من أن المستوى المستهدف أعلى من المستوى الحالي
    if (targetLevel === currentLevel) {
      return { eligible: false, reason: 'أنت بالفعل في هذا المستوى' };
    }

    // التحقق من الحد الأدنى للمبلغ المطلوب
    const minAmount = MIN_UNLOCK_AMOUNT[targetLevel];
    if (balance < minAmount) {
      return {
        eligible: false,
        reason: `يجب أن يكون رصيدك ${minAmount} USDT على الأقل للترقية إلى هذا المستوى`
      };
    }

    // التحقق من عدد المروجين المطلوبين (للمستويات التي تتطلب مروجين)
    const requiredPromoters = REQUIRED_PROMOTERS[targetLevel];
    if (requiredPromoters > 0) {
      try {
        // الحصول على عدد المروجين (الإحالات المباشرة النشطة)
        const promotersCount = await getActivePromotersCount(userId);

        if (promotersCount < requiredPromoters) {
          return {
            eligible: false,
            reason: `تحتاج إلى ${requiredPromoters} مروج على الأقل للترقية إلى هذا المستوى (لديك حاليًا ${promotersCount})`
          };
        }
      } catch (err) {
        console.error('Error getting promoters count:', err);
        // في حالة حدوث خطأ، نفترض أن المستخدم مؤهل من حيث عدد المروجين
        // هذا لتجنب منع المستخدم من الترقية بسبب خطأ تقني
      }
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error checking membership upgrade eligibility:', error);
    return { eligible: false, reason: 'حدث خطأ أثناء التحقق من أهلية الترقية' };
  }
};

/**
 * ترقية درجة عضوية المستخدم
 */
export const upgradeMembershipLevel = async (
  userId: string,
  newLevel: MembershipLevel
): Promise<{ success: boolean; message?: string }> => {
  try {
    // التحقق من أهلية الترقية
    const eligibility = await checkMembershipUpgradeEligibility(userId, newLevel);
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reason };
    }

    // ترقية المستخدم
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      membershipLevel: newLevel,
      updatedAt: serverTimestamp()
    });

    // إضافة سجل للترقية
    await addMembershipUpgradeRecord(userId, newLevel);

    return { success: true, message: `تمت الترقية بنجاح إلى ${MEMBERSHIP_LEVEL_NAMES[newLevel]}` };
  } catch (error) {
    console.error('Error upgrading membership level:', error);
    return { success: false, message: 'حدث خطأ أثناء ترقية مستوى العضوية' };
  }
};

/**
 * إضافة سجل لترقية مستوى العضوية
 */
const addMembershipUpgradeRecord = async (userId: string, newLevel: MembershipLevel) => {
  try {
    const upgradesRef = collection(db, 'membershipUpgrades');
    await setDoc(doc(upgradesRef), {
      userId,
      newLevel,
      levelName: MEMBERSHIP_LEVEL_NAMES[newLevel],
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding membership upgrade record:', error);
  }
};
