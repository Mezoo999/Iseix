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
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';
import { REFERRAL_COMMISSION_RATES, MembershipLevel } from './referral';

/**
 * إنشاء إحالات متعددة المستويات عند تسجيل مستخدم جديد
 * @param referrerId معرف المستخدم المحيل
 * @param referredId معرف المستخدم المحال
 * @param referredEmail بريد المستخدم المحال
 */
export const createMultiLevelReferrals = async (
  referrerId: string,
  referredId: string,
  referredEmail: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // إنشاء إحالة المستوى الأول (مباشرة)
    const level1ReferralRef = doc(collection(db, 'referrals'));
    batch.set(level1ReferralRef, {
      referrerId,
      referredId,
      referredEmail,
      status: 'pending',
      commission: 0,
      currency: 'USDT',
      level: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // تحديث عدد الإحالات للمستخدم المحيل
    const userRef = doc(db, 'users', referrerId);
    batch.update(userRef, {
      totalReferrals: increment(1),
      level1Referrals: increment(1),
      updatedAt: serverTimestamp()
    });

    // البحث عن المحيل الخاص بالمستخدم المحيل (للمستوى الثاني)
    const level2ReferrerQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', referrerId),
      where('level', '==', 1)
    );

    const level2ReferrerSnapshot = await getDocs(level2ReferrerQuery);

    if (!level2ReferrerSnapshot.empty) {
      const level2Referrer = level2ReferrerSnapshot.docs[0].data();
      const level2ReferrerId = level2Referrer.referrerId;

      // إنشاء إحالة المستوى الثاني
      const level2ReferralRef = doc(collection(db, 'referrals'));
      batch.set(level2ReferralRef, {
        referrerId: level2ReferrerId,
        referredId,
        referredEmail,
        status: 'pending',
        commission: 0,
        currency: 'USDT',
        level: 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // تحديث عدد إحالات المستوى الثاني للمستخدم المحيل
      const level2UserRef = doc(db, 'users', level2ReferrerId);
      batch.update(level2UserRef, {
        level2Referrals: increment(1),
        updatedAt: serverTimestamp()
      });

      // البحث عن المحيل الخاص بمحيل المستوى الثاني (للمستوى الثالث)
      const level3ReferrerQuery = query(
        collection(db, 'referrals'),
        where('referredId', '==', level2ReferrerId),
        where('level', '==', 1)
      );

      const level3ReferrerSnapshot = await getDocs(level3ReferrerQuery);

      if (!level3ReferrerSnapshot.empty) {
        const level3Referrer = level3ReferrerSnapshot.docs[0].data();
        const level3ReferrerId = level3Referrer.referrerId;

        // إنشاء إحالة المستوى الثالث
        const level3ReferralRef = doc(collection(db, 'referrals'));
        batch.set(level3ReferralRef, {
          referrerId: level3ReferrerId,
          referredId,
          referredEmail,
          status: 'pending',
          commission: 0,
          currency: 'USDT',
          level: 3,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // تحديث عدد إحالات المستوى الثالث للمستخدم المحيل
        const level3UserRef = doc(db, 'users', level3ReferrerId);
        batch.update(level3UserRef, {
          level3Referrals: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    }

    // تنفيذ جميع العمليات
    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error creating multi-level referrals:', error);
    return false;
  }
};

/**
 * إضافة عمولات الإحالة متعددة المستويات عند الإيداع
 * @param userId معرف المستخدم الذي قام بالإيداع
 * @param depositAmount مبلغ الإيداع
 * @param currency العملة
 */
export const addMultiLevelReferralCommissions = async (
  userId: string,
  depositAmount: number,
  currency: string = 'USDT'
): Promise<boolean> => {
  try {
    // البحث عن جميع الإحالات المرتبطة بالمستخدم
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', userId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    if (referralsSnapshot.empty) {
      // لا توجد إحالات لهذا المستخدم
      return true;
    }

    const batch = writeBatch(db);
    const transactions = [];

    // معالجة كل إحالة حسب مستواها
    for (const referralDoc of referralsSnapshot.docs) {
      const referral = referralDoc.data();
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
      batch.update(doc(db, 'referrals', referralDoc.id), {
        commission: increment(commissionAmount),
        status: 'active',
        updatedAt: serverTimestamp()
      });

      // إضافة العمولة إلى رصيد المستخدم المحيل
      batch.update(doc(db, 'users', referral.referrerId), {
        [`balances.${currency}`]: increment(commissionAmount),
        totalReferralEarnings: increment(commissionAmount),
        updatedAt: serverTimestamp()
      });

      // إنشاء معاملة عمولة
      const transactionData = {
        userId: referral.referrerId,
        type: 'referral',
        amount: commissionAmount,
        currency,
        status: 'completed',
        description: `عمولة إحالة ${
          level === 1 ? 'مباشرة' :
          level === 2 ? 'المستوى الثاني' :
          level === 3 ? 'المستوى الثالث' :
          level === 4 ? 'المستوى الرابع' :
          level === 5 ? 'المستوى الخامس' :
          'المستوى السادس'
        } (${(commissionRate * 100).toFixed(1)}%)`,
        metadata: {
          referralId: referralDoc.id,
          referredId: referral.referredId,
          level,
          depositAmount,
          membershipLevel
        },
        timestamp: Timestamp.now()
      };

      transactions.push(transactionData);
    }

    // تنفيذ جميع تحديثات الدفعة
    await batch.commit();

    // إنشاء معاملات العمولة
    for (const transaction of transactions) {
      await createTransaction(transaction);
    }

    return true;
  } catch (error) {
    console.error('Error adding multi-level referral commissions:', error);
    return false;
  }
};

/**
 * تحديث حالة الإحالات عند تفعيل حساب المستخدم
 * @param userId معرف المستخدم الذي تم تفعيل حسابه
 */
export const updateReferralStatusOnActivation = async (userId: string): Promise<boolean> => {
  try {
    // البحث عن جميع الإحالات المرتبطة بالمستخدم
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referredId', '==', userId)
    );

    const referralsSnapshot = await getDocs(referralsQuery);

    if (referralsSnapshot.empty) {
      // لا توجد إحالات لهذا المستخدم
      return true;
    }

    const batch = writeBatch(db);

    // تحديث حالة كل إحالة
    for (const referralDoc of referralsSnapshot.docs) {
      batch.update(doc(db, 'referrals', referralDoc.id), {
        status: 'active',
        updatedAt: serverTimestamp()
      });
    }

    // تنفيذ جميع التحديثات
    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error updating referral status on activation:', error);
    return false;
  }
};
