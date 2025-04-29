import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';

// واجهة الإحالة
export interface Referral {
  id?: string;
  referrerId: string;
  referredId: string;
  referredEmail: string;
  status: 'pending' | 'active' | 'completed';
  commission: number;
  currency: string;
  level?: number; // مستوى الإحالة (1 = مباشر، 2 = المستوى الثاني، 3 = المستوى الثالث)
  createdAt?: any;
  updatedAt?: any;
}

import { MembershipLevel } from './dailyTasks';

// معدلات العمولة لكل مستوى عضوية ومستوى إحالة
export const REFERRAL_COMMISSION_RATES = {
  [MembershipLevel.BASIC]: {
    LEVEL_1: 0.03, // 3% للمستوى الأول (الإحالة المباشرة)
    LEVEL_2: 0.00, // 0% للمستوى الثاني
    LEVEL_3: 0.00, // 0% للمستوى الثالث
    LEVEL_4: 0.00, // 0% للمستوى الرابع
    LEVEL_5: 0.00, // 0% للمستوى الخامس
    LEVEL_6: 0.00  // 0% للمستوى السادس
  },
  [MembershipLevel.SILVER]: {
    LEVEL_1: 0.04, // 4% للمستوى الأول
    LEVEL_2: 0.01, // 1% للمستوى الثاني
    LEVEL_3: 0.00, // 0% للمستوى الثالث
    LEVEL_4: 0.00, // 0% للمستوى الرابع
    LEVEL_5: 0.00, // 0% للمستوى الخامس
    LEVEL_6: 0.00  // 0% للمستوى السادس
  },
  [MembershipLevel.GOLD]: {
    LEVEL_1: 0.05, // 5% للمستوى الأول
    LEVEL_2: 0.02, // 2% للمستوى الثاني
    LEVEL_3: 0.01, // 1% للمستوى الثالث
    LEVEL_4: 0.00, // 0% للمستوى الرابع
    LEVEL_5: 0.00, // 0% للمستوى الخامس
    LEVEL_6: 0.00  // 0% للمستوى السادس
  },
  [MembershipLevel.PLATINUM]: {
    LEVEL_1: 0.06, // 6% للمستوى الأول
    LEVEL_2: 0.03, // 3% للمستوى الثاني
    LEVEL_3: 0.015, // 1.5% للمستوى الثالث
    LEVEL_4: 0.005, // 0.5% للمستوى الرابع
    LEVEL_5: 0.00, // 0% للمستوى الخامس
    LEVEL_6: 0.00  // 0% للمستوى السادس
  },
  [MembershipLevel.DIAMOND]: {
    LEVEL_1: 0.07, // 7% للمستوى الأول
    LEVEL_2: 0.035, // 3.5% للمستوى الثاني
    LEVEL_3: 0.02, // 2% للمستوى الثالث
    LEVEL_4: 0.01, // 1% للمستوى الرابع
    LEVEL_5: 0.005, // 0.5% للمستوى الخامس
    LEVEL_6: 0.00  // 0% للمستوى السادس
  },
  [MembershipLevel.ELITE]: {
    LEVEL_1: 0.08, // 8% للمستوى الأول
    LEVEL_2: 0.04, // 4% للمستوى الثاني
    LEVEL_3: 0.025, // 2.5% للمستوى الثالث
    LEVEL_4: 0.015, // 1.5% للمستوى الرابع
    LEVEL_5: 0.01, // 1% للمستوى الخامس
    LEVEL_6: 0.005 // 0.5% للمستوى السادس
  }
};

// متطلبات الإحالات النشطة لكل مستوى عضوية
export const MEMBERSHIP_REFERRAL_REQUIREMENTS = {
  [MembershipLevel.BASIC]: 0,   // لا يتطلب إحالات
  [MembershipLevel.SILVER]: 3,  // يتطلب 3 إحالات نشطة
  [MembershipLevel.GOLD]: 10,   // يتطلب 10 إحالات نشطة
  [MembershipLevel.PLATINUM]: 20, // يتطلب 20 إحالة نشطة
  [MembershipLevel.DIAMOND]: 35, // يتطلب 35 إحالة نشطة
  [MembershipLevel.ELITE]: 50   // يتطلب 50 إحالة نشطة
};

// واجهة إحصائيات الإحالة
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalCommission: number;
  currency: string;
  level1Referrals?: number; // عدد الإحالات المباشرة (المستوى الأول)
  level2Referrals?: number; // عدد إحالات المستوى الثاني
  level3Referrals?: number; // عدد إحالات المستوى الثالث
  level4Referrals?: number; // عدد إحالات المستوى الرابع
  level5Referrals?: number; // عدد إحالات المستوى الخامس
  level6Referrals?: number; // عدد إحالات المستوى السادس
}

// إنشاء رمز إحالة فريد
export const generateReferralCode = (uid: string): string => {
  // إنشاء رمز إحالة من معرف المستخدم + أحرف عشوائية
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${randomChars}${uid.substring(0, 4)}`;
};

// الحصول على رمز الإحالة للمستخدم
export const getUserReferralCode = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists() && userDoc.data().referralCode) {
      return userDoc.data().referralCode;
    }

    // إنشاء رمز إحالة جديد إذا لم يكن موجودًا
    const referralCode = generateReferralCode(userId);

    await updateDoc(doc(db, 'users', userId), {
      referralCode,
      updatedAt: serverTimestamp(),
    });

    return referralCode;
  } catch (error) {
    console.error('Error getting user referral code:', error);
    throw error;
  }
};

// الحصول على معرف المستخدم من رمز الإحالة
export const getUserIdFromReferralCode = async (referralCode: string): Promise<string | null> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('referralCode', '==', referralCode)
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return null;
    }

    return usersSnapshot.docs[0].id;
  } catch (error) {
    console.error('Error getting user ID from referral code:', error);
    throw error;
  }
};

// إنشاء إحالة جديدة
export const createReferral = async (
  referrerId: string,
  referredId: string,
  referredEmail: string
): Promise<string> => {
  try {
    // التحقق من عدم وجود إحالة سابقة
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', referredId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    if (!referralsSnapshot.empty) {
      throw new Error('User already has a referrer');
    }

    // إنشاء إحالة مباشرة (المستوى الأول)
    const referralData: Omit<Referral, 'id'> = {
      referrerId,
      referredId,
      referredEmail,
      status: 'pending',
      commission: 0,
      currency: 'USDT',
      level: 1, // المستوى الأول (مباشر)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const referralRef = await addDoc(collection(db, 'referrals'), referralData);

    // تحديث عدد الإحالات للمستخدم المحيل
    const userRef = doc(db, 'users', referrerId);
    await updateDoc(userRef, {
      totalReferrals: increment(1),
      updatedAt: serverTimestamp(),
    });

    // البحث عن المحيل الخاص بالمستخدم المحيل (للمستوى الثاني)
    const level2ReferrerQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', referrerId)
    );

    const level2ReferrerSnapshot = await getDocs(level2ReferrerQuery);

    if (!level2ReferrerSnapshot.empty) {
      const level2Referrer = level2ReferrerSnapshot.docs[0].data();

      // إنشاء إحالة المستوى الثاني
      const level2ReferralData: Omit<Referral, 'id'> = {
        referrerId: level2Referrer.referrerId,
        referredId,
        referredEmail,
        status: 'pending',
        commission: 0,
        currency: 'USDT',
        level: 2, // المستوى الثاني
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'referrals'), level2ReferralData);

      // البحث عن المحيل الخاص بمحيل المستوى الثاني (للمستوى الثالث)
      const level3ReferrerQuery = query(
        collection(db, 'referrals'),
        where('referredId', '==', level2Referrer.referrerId)
      );

      const level3ReferrerSnapshot = await getDocs(level3ReferrerQuery);

      if (!level3ReferrerSnapshot.empty) {
        const level3Referrer = level3ReferrerSnapshot.docs[0].data();

        // إنشاء إحالة المستوى الثالث
        const level3ReferralData: Omit<Referral, 'id'> = {
          referrerId: level3Referrer.referrerId,
          referredId,
          referredEmail,
          status: 'pending',
          commission: 0,
          currency: 'USDT',
          level: 3, // المستوى الثالث
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'referrals'), level3ReferralData);

        // البحث عن المحيل الخاص بمحيل المستوى الثالث (للمستوى الرابع)
        const level4ReferrerQuery = query(
          collection(db, 'referrals'),
          where('referredId', '==', level3Referrer.referrerId)
        );

        const level4ReferrerSnapshot = await getDocs(level4ReferrerQuery);

        if (!level4ReferrerSnapshot.empty) {
          const level4Referrer = level4ReferrerSnapshot.docs[0].data();

          // إنشاء إحالة المستوى الرابع
          const level4ReferralData: Omit<Referral, 'id'> = {
            referrerId: level4Referrer.referrerId,
            referredId,
            referredEmail,
            status: 'pending',
            commission: 0,
            currency: 'USDT',
            level: 4, // المستوى الرابع
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await addDoc(collection(db, 'referrals'), level4ReferralData);

          // البحث عن المحيل الخاص بمحيل المستوى الرابع (للمستوى الخامس)
          const level5ReferrerQuery = query(
            collection(db, 'referrals'),
            where('referredId', '==', level4Referrer.referrerId)
          );

          const level5ReferrerSnapshot = await getDocs(level5ReferrerQuery);

          if (!level5ReferrerSnapshot.empty) {
            const level5Referrer = level5ReferrerSnapshot.docs[0].data();

            // إنشاء إحالة المستوى الخامس
            const level5ReferralData: Omit<Referral, 'id'> = {
              referrerId: level5Referrer.referrerId,
              referredId,
              referredEmail,
              status: 'pending',
              commission: 0,
              currency: 'USDT',
              level: 5, // المستوى الخامس
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'referrals'), level5ReferralData);

            // البحث عن المحيل الخاص بمحيل المستوى الخامس (للمستوى السادس)
            const level6ReferrerQuery = query(
              collection(db, 'referrals'),
              where('referredId', '==', level5Referrer.referrerId)
            );

            const level6ReferrerSnapshot = await getDocs(level6ReferrerQuery);

            if (!level6ReferrerSnapshot.empty) {
              const level6Referrer = level6ReferrerSnapshot.docs[0].data();

              // إنشاء إحالة المستوى السادس
              const level6ReferralData: Omit<Referral, 'id'> = {
                referrerId: level6Referrer.referrerId,
                referredId,
                referredEmail,
                status: 'pending',
                commission: 0,
                currency: 'USDT',
                level: 6, // المستوى السادس
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              await addDoc(collection(db, 'referrals'), level6ReferralData);
            }
          }
        }
      }
    }

    return referralRef.id;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

// تحديث حالة الإحالة
export const updateReferralStatus = async (
  referralId: string,
  status: 'pending' | 'active' | 'completed'
): Promise<void> => {
  try {
    const referralRef = doc(db, 'referrals', referralId);

    await updateDoc(referralRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating referral status:', error);
    throw error;
  }
};

// إضافة عمولة للإحالة
export const addReferralCommission = async (
  referredId: string,
  depositAmount: number,
  currency: string = 'USDT'
): Promise<void> => {
  try {
    // البحث عن جميع الإحالات المرتبطة بالمستخدم المحال
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', referredId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    if (referralsSnapshot.empty) {
      // لا توجد إحالات لهذا المستخدم
      return;
    }

    // معالجة كل إحالة حسب مستواها
    for (const referralDoc of referralsSnapshot.docs) {
      const referral = referralDoc.data() as Referral;
      const level = referral.level || 1;

      // الحصول على بيانات المستخدم المحيل لمعرفة مستوى عضويته
      const referrerRef = doc(db, 'users', referral.referrerId);
      const referrerDoc = await getDoc(referrerRef);

      if (!referrerDoc.exists()) {
        console.error(`Referrer user ${referral.referrerId} not found`);
        continue;
      }

      const referrerData = referrerDoc.data();
      const membershipLevel = referrerData.membershipLevel || MembershipLevel.BASIC;

      // تحديد معدل العمولة بناءً على مستوى العضوية ومستوى الإحالة
      let commissionRate = 0;
      switch (level) {
        case 1:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_1;
          break;
        case 2:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_2;
          break;
        case 3:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_3;
          break;
        case 4:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_4;
          break;
        case 5:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_5;
          break;
        case 6:
          commissionRate = REFERRAL_COMMISSION_RATES[membershipLevel].LEVEL_6;
          break;
        default:
          commissionRate = 0;
      }

      // حساب مبلغ العمولة
      const commissionAmount = depositAmount * commissionRate;

      if (commissionAmount <= 0) {
        continue;
      }

      // تحديث عمولة الإحالة
      await updateDoc(doc(db, 'referrals', referralDoc.id), {
        commission: increment(commissionAmount),
        currency,
        status: 'active',
        updatedAt: serverTimestamp(),
      });

      // إضافة العمولة إلى رصيد المستخدم المحيل
      await updateDoc(referrerRef, {
        [`balances.${currency}`]: increment(commissionAmount),
        totalReferralEarnings: increment(commissionAmount),
        updatedAt: serverTimestamp(),
      });

      // إنشاء معاملة عمولة
      await createTransaction({
        userId: referral.referrerId,
        type: 'referral',
        amount: commissionAmount,
        currency,
        status: 'completed',
        description: `عمولة إحالة ${level === 1 ? 'مباشرة' : level === 2 ? 'المستوى الثاني' : 'المستوى الثالث'} (${(commissionRate * 100).toFixed(1)}%)`,
        metadata: {
          referralId: referralDoc.id,
          referredId: referral.referredId,
          level,
          depositAmount,
          membershipLevel
        },
      });

      // تحديث مستوى العضوية تلقائيًا بعد إضافة العمولة
      await autoUpdateMembershipLevel(referral.referrerId);
    }
  } catch (error) {
    console.error('Error adding referral commission:', error);
    throw error;
  }
};

// الحصول على إحالات المستخدم
export const getUserReferrals = async (userId: string): Promise<Referral[]> => {
  try {
    // استخدام استعلام بسيط أولاً بدون ترتيب
    // هذا سيعمل دائمًا بدون الحاجة إلى فهرس مركب
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    // ثم نقوم بترتيب النتائج في الذاكرة
    const referrals = referralsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Referral[];

    // ترتيب النتائج حسب تاريخ الإنشاء تنازليًا
    return referrals.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error getting user referrals:', error);
    throw error;
  }
};

// الحصول على عدد المروجين النشطين للمستخدم (الإحالات المباشرة النشطة)
export const getActivePromotersCount = async (userId: string): Promise<number> => {
  try {
    // استعلام للحصول على الإحالات المباشرة فقط (بدون تصفية حسب الحالة والمستوى)
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    // تصفية النتائج في الذاكرة
    const activePromoters = referralsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return (data.level === 1 || !data.level) && data.status === 'active';
    });

    return activePromoters.length;
  } catch (error) {
    console.error('Error getting active promoters count:', error);
    return 0;
  }
};

/**
 * تحديد مستوى العضوية المناسب بناءً على عدد الإحالات النشطة
 */
export const determineAppropriateLevel = (activePromotersCount: number): MembershipLevel => {
  if (activePromotersCount >= MEMBERSHIP_REFERRAL_REQUIREMENTS[MembershipLevel.ELITE]) {
    return MembershipLevel.ELITE;
  } else if (activePromotersCount >= MEMBERSHIP_REFERRAL_REQUIREMENTS[MembershipLevel.DIAMOND]) {
    return MembershipLevel.DIAMOND;
  } else if (activePromotersCount >= MEMBERSHIP_REFERRAL_REQUIREMENTS[MembershipLevel.PLATINUM]) {
    return MembershipLevel.PLATINUM;
  } else if (activePromotersCount >= MEMBERSHIP_REFERRAL_REQUIREMENTS[MembershipLevel.GOLD]) {
    return MembershipLevel.GOLD;
  } else if (activePromotersCount >= MEMBERSHIP_REFERRAL_REQUIREMENTS[MembershipLevel.SILVER]) {
    return MembershipLevel.SILVER;
  } else {
    return MembershipLevel.BASIC;
  }
};

/**
 * ترقية مستوى العضوية تلقائيًا بناءً على عدد الإحالات النشطة
 */
export const autoUpdateMembershipLevel = async (userId: string): Promise<{
  success: boolean;
  oldLevel?: MembershipLevel;
  newLevel?: MembershipLevel;
  message?: string
}> => {
  try {
    // الحصول على بيانات المستخدم
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, message: 'لم يتم العثور على المستخدم' };
    }

    const userData = userDoc.data();
    const currentLevel = userData.membershipLevel || MembershipLevel.BASIC;

    // الحصول على عدد الإحالات النشطة
    const activePromotersCount = await getActivePromotersCount(userId);

    // تحديد المستوى المناسب بناءً على عدد الإحالات
    const appropriateLevel = determineAppropriateLevel(activePromotersCount);

    // إذا كان المستوى الحالي هو نفس المستوى المناسب، لا داعي للتحديث
    if (currentLevel === appropriateLevel) {
      return {
        success: true,
        oldLevel: currentLevel,
        newLevel: appropriateLevel,
        message: 'المستوى الحالي مناسب لعدد الإحالات النشطة'
      };
    }

    // تحديث مستوى العضوية
    await updateDoc(userRef, {
      membershipLevel: appropriateLevel,
      updatedAt: serverTimestamp()
    });

    // إضافة سجل للترقية
    await addDoc(collection(db, 'membershipUpgrades'), {
      userId,
      oldLevel: currentLevel,
      newLevel: appropriateLevel,
      reason: 'auto_referral_update',
      activePromotersCount,
      timestamp: serverTimestamp()
    });

    return {
      success: true,
      oldLevel: currentLevel,
      newLevel: appropriateLevel,
      message: appropriateLevel > currentLevel
        ? `تمت ترقية المستوى من ${currentLevel} إلى ${appropriateLevel} بناءً على ${activePromotersCount} إحالة نشطة`
        : `تم تخفيض المستوى من ${currentLevel} إلى ${appropriateLevel} بناءً على ${activePromotersCount} إحالة نشطة`
    };
  } catch (error) {
    console.error('Error auto-updating membership level:', error);
    return { success: false, message: 'حدث خطأ أثناء تحديث مستوى العضوية' };
  }
};

// الحصول على إحصائيات الإحالة للمستخدم
export const getUserReferralStats = async (userId: string): Promise<ReferralStats> => {
  try {
    // الحصول على جميع إحالات المستخدم
    const referrals = await getUserReferrals(userId);

    // حساب الإحصائيات
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((referral) => referral.status === 'active').length;
    const pendingReferrals = referrals.filter((referral) => referral.status === 'pending').length;

    // حساب إحصائيات المستويات
    const level1Referrals = referrals.filter((referral) => referral.level === 1 || !referral.level).length;
    const level2Referrals = referrals.filter((referral) => referral.level === 2).length;
    const level3Referrals = referrals.filter((referral) => referral.level === 3).length;
    const level4Referrals = referrals.filter((referral) => referral.level === 4).length;
    const level5Referrals = referrals.filter((referral) => referral.level === 5).length;
    const level6Referrals = referrals.filter((referral) => referral.level === 6).length;

    // حساب إجمالي العمولة
    const totalCommission = referrals.reduce((total, referral) => total + referral.commission, 0);

    // العملة الافتراضية
    const currency = referrals.length > 0 ? referrals[0].currency : 'USDT';

    return {
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      totalCommission,
      currency,
      level1Referrals,
      level2Referrals,
      level3Referrals,
      level4Referrals,
      level5Referrals,
      level6Referrals
    };
  } catch (error) {
    console.error('Error getting user referral stats:', error);
    throw error;
  }
};

/**
 * الحصول على معدلات العمولة لمستوى عضوية معين
 */
export const getReferralRatesForLevel = (membershipLevel: MembershipLevel) => {
  const rates = REFERRAL_COMMISSION_RATES[membershipLevel];
  return {
    level1Rate: (rates.LEVEL_1 * 100).toFixed(1) + '%',
    level2Rate: (rates.LEVEL_2 * 100).toFixed(1) + '%',
    level3Rate: (rates.LEVEL_3 * 100).toFixed(1) + '%',
    level4Rate: (rates.LEVEL_4 * 100).toFixed(1) + '%',
    level5Rate: (rates.LEVEL_5 * 100).toFixed(1) + '%',
    level6Rate: (rates.LEVEL_6 * 100).toFixed(1) + '%'
  };
};

/**
 * الحصول على متطلبات الترقية للمستوى التالي
 */
export const getNextLevelRequirements = (currentLevel: MembershipLevel) => {
  let nextLevel: MembershipLevel;

  switch (currentLevel) {
    case MembershipLevel.BASIC:
      nextLevel = MembershipLevel.SILVER;
      break;
    case MembershipLevel.SILVER:
      nextLevel = MembershipLevel.GOLD;
      break;
    case MembershipLevel.GOLD:
      nextLevel = MembershipLevel.PLATINUM;
      break;
    case MembershipLevel.PLATINUM:
      nextLevel = MembershipLevel.DIAMOND;
      break;
    case MembershipLevel.DIAMOND:
      nextLevel = MembershipLevel.ELITE;
      break;
    default:
      return null; // المستوى الأعلى، لا يوجد مستوى تالي
  }

  return {
    nextLevel,
    requiredPromoters: MEMBERSHIP_REFERRAL_REQUIREMENTS[nextLevel]
  };
};

/**
 * تحديث مستويات العضوية لجميع المستخدمين بناءً على عدد الإحالات النشطة
 * يمكن استخدام هذه الوظيفة في وظيفة مجدولة تعمل مرة يوميًا
 */
export const updateAllUsersMembershipLevels = async (): Promise<{
  total: number;
  updated: number;
  errors: number;
  details: Array<{ userId: string; oldLevel: string; newLevel: string; success: boolean }>
}> => {
  try {
    const results = {
      total: 0,
      updated: 0,
      errors: 0,
      details: [] as Array<{ userId: string; oldLevel: string; newLevel: string; success: boolean }>
    };

    // الحصول على جميع المستخدمين
    const usersSnapshot = await getDocs(collection(db, 'users'));
    results.total = usersSnapshot.size;

    // تحديث مستوى العضوية لكل مستخدم
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      try {
        const result = await autoUpdateMembershipLevel(userId);

        results.details.push({
          userId,
          oldLevel: result.oldLevel || 'unknown',
          newLevel: result.newLevel || 'unknown',
          success: result.success
        });

        if (result.success && result.oldLevel !== result.newLevel) {
          results.updated++;
        }
      } catch (error) {
        console.error(`Error updating membership level for user ${userId}:`, error);
        results.errors++;
        results.details.push({
          userId,
          oldLevel: 'unknown',
          newLevel: 'unknown',
          success: false
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error updating all users membership levels:', error);
    throw error;
  }
};
