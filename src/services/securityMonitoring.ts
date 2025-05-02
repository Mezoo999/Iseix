import {
  collection,
  addDoc,
  serverTimestamp,
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
import { createSecurityNotification, createAdminNotification } from './notifications';

// أنواع النشاط
export type ActivityType =
  | 'login'
  | 'login_failed'
  | 'password_change'
  | 'profile_update'
  | 'withdrawal_request'
  | 'deposit_request'
  | 'referral_signup'
  | 'task_complete';

// واجهة النشاط
export interface UserActivity {
  id?: string;
  userId: string;
  type: ActivityType;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  metadata?: any;
}

// واجهة الحدث الأمني
export interface SecurityEvent {
  id?: string;
  userId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Timestamp;
  description: string;
  relatedActivities: string[];
  metadata?: any;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}

/**
 * تسجيل نشاط المستخدم
 */
export const logUserActivity = async (
  userId: string,
  type: ActivityType,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string,
  geoLocation?: any
): Promise<string> => {
  try {
    // التحقق من القيم وإزالة القيم غير المحددة
    const activityData: any = {
      userId,
      type,
      timestamp: serverTimestamp() as Timestamp
    };

    // إضافة الحقول الاختيارية فقط إذا كانت محددة
    if (metadata !== undefined) activityData.metadata = metadata;
    if (ipAddress !== undefined && ipAddress !== null) activityData.ipAddress = ipAddress;
    if (userAgent !== undefined && userAgent !== null) activityData.userAgent = userAgent;
    if (geoLocation !== undefined && geoLocation !== null) activityData.geoLocation = geoLocation;

    const docRef = await addDoc(collection(db, 'userActivities'), activityData);
    console.log(`[securityMonitoring.ts] تم تسجيل نشاط جديد بمعرف: ${docRef.id}`);

    // فحص النشاط المشبوه
    await checkSuspiciousActivity(userId, type, activityData, docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في تسجيل نشاط المستخدم:', error);
    // في حالة الخطأ، نعيد محاولة تسجيل النشاط بدون الحقول الاختيارية
    try {
      const basicActivityData = {
        userId,
        type,
        timestamp: serverTimestamp() as Timestamp,
        metadata
      };

      const docRef = await addDoc(collection(db, 'userActivities'), basicActivityData);
      console.log(`[securityMonitoring.ts] تم تسجيل نشاط أساسي بمعرف: ${docRef.id}`);
      return docRef.id;
    } catch (fallbackError) {
      console.error('[securityMonitoring.ts] خطأ في تسجيل النشاط الأساسي:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * فحص النشاط المشبوه
 */
const checkSuspiciousActivity = async (
  userId: string,
  activityType: ActivityType,
  activityData: UserActivity,
  activityId: string
): Promise<void> => {
  try {
    // 1. فحص محاولات تسجيل الدخول الفاشلة المتعددة
    if (activityType === 'login_failed') {
      await checkMultipleFailedLogins(userId, activityId);
    }

    // 2. فحص تغيير الموقع الجغرافي
    if (activityData.geoLocation && (
      activityType === 'login' ||
      activityType === 'withdrawal_request' ||
      activityType === 'password_change'
    )) {
      await checkLocationChange(userId, activityData, activityId);
    }

    // 3. فحص طلبات السحب المتعددة في وقت قصير
    if (activityType === 'withdrawal_request') {
      await checkMultipleWithdrawals(userId, activityId);
    }

    // 4. فحص تغيير كلمة المرور
    if (activityType === 'password_change') {
      await createSecurityNotification(
        userId,
        'تغيير كلمة المرور',
        'تم تغيير كلمة المرور الخاصة بك. إذا لم تقم بهذا الإجراء، يرجى الاتصال بالدعم فورًا.',
        { activityId }
      );
    }
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في فحص النشاط المشبوه:', error);
  }
};

/**
 * فحص محاولات تسجيل الدخول الفاشلة المتعددة
 */
const checkMultipleFailedLogins = async (userId: string, activityId: string): Promise<void> => {
  try {
    // البحث عن محاولات تسجيل الدخول الفاشلة في آخر ساعة
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const failedLoginsQuery = query(
      collection(db, 'userActivities'),
      where('userId', '==', userId),
      where('type', '==', 'login_failed'),
      where('timestamp', '>=', Timestamp.fromDate(oneHourAgo)),
      orderBy('timestamp', 'desc')
    );

    const failedLoginsSnapshot = await getDocs(failedLoginsQuery);
    const failedLoginsCount = failedLoginsSnapshot.size;

    // إذا كان هناك أكثر من 3 محاولات فاشلة في آخر ساعة
    if (failedLoginsCount >= 3) {
      // إنشاء حدث أمني
      await createSecurityEvent(
        userId,
        'multiple_failed_logins',
        'high',
        `${failedLoginsCount} محاولات تسجيل دخول فاشلة في آخر ساعة`,
        [activityId],
        { failedLoginsCount }
      );

      // إرسال إشعار للمستخدم
      await createSecurityNotification(
        userId,
        'محاولات تسجيل دخول مشبوهة',
        `تم اكتشاف ${failedLoginsCount} محاولات تسجيل دخول فاشلة لحسابك في آخر ساعة. إذا لم تكن أنت، يرجى تغيير كلمة المرور فورًا.`,
        { failedLoginsCount }
      );

      // إرسال إشعار للمسؤول
      await createAdminNotification(
        'محاولات تسجيل دخول مشبوهة',
        `تم اكتشاف ${failedLoginsCount} محاولات تسجيل دخول فاشلة للمستخدم ${userId} في آخر ساعة.`,
        'security',
        { userId, failedLoginsCount }
      );
    }
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في فحص محاولات تسجيل الدخول الفاشلة:', error);
  }
};

/**
 * فحص تغيير الموقع الجغرافي
 */
const checkLocationChange = async (
  userId: string,
  currentActivity: UserActivity,
  activityId: string
): Promise<void> => {
  try {
    // البحث عن آخر نشاط للمستخدم من نفس النوع
    const lastActivityQuery = query(
      collection(db, 'userActivities'),
      where('userId', '==', userId),
      where('type', '==', currentActivity.type),
      orderBy('timestamp', 'desc'),
      limit(2) // الحصول على آخر نشاطين (بما في ذلك النشاط الحالي)
    );

    const lastActivitySnapshot = await getDocs(lastActivityQuery);

    // إذا كان هناك نشاط سابق
    if (lastActivitySnapshot.size > 1) {
      let previousActivity: UserActivity | null = null;

      lastActivitySnapshot.forEach(doc => {
        const data = doc.data() as UserActivity;
        // تجاهل النشاط الحالي
        if (doc.id !== activityId) {
          previousActivity = { ...data, id: doc.id };
        }
      });

      // إذا كان النشاط السابق يحتوي على معلومات الموقع
      if (previousActivity && previousActivity.geoLocation && currentActivity.geoLocation) {
        const prevGeo = previousActivity.geoLocation;
        const currGeo = currentActivity.geoLocation;

        // إذا كان البلد مختلف
        if (prevGeo.country && currGeo.country && prevGeo.country !== currGeo.country) {
          // إنشاء حدث أمني
          await createSecurityEvent(
            userId,
            'location_change',
            'medium',
            `تغيير الموقع الجغرافي من ${prevGeo.country} إلى ${currGeo.country}`,
            [activityId],
            { previousLocation: prevGeo, currentLocation: currGeo }
          );

          // إرسال إشعار للمستخدم
          await createSecurityNotification(
            userId,
            'تسجيل دخول من موقع جديد',
            `تم تسجيل دخول إلى حسابك من ${currGeo.country}. إذا لم تكن أنت، يرجى تغيير كلمة المرور فورًا.`,
            { previousLocation: prevGeo, currentLocation: currGeo }
          );
        }
      }
    }
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في فحص تغيير الموقع الجغرافي:', error);
  }
};

/**
 * فحص طلبات السحب المتعددة في وقت قصير
 */
const checkMultipleWithdrawals = async (userId: string, activityId: string): Promise<void> => {
  try {
    // البحث عن طلبات السحب في آخر 24 ساعة
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const withdrawalsQuery = query(
      collection(db, 'userActivities'),
      where('userId', '==', userId),
      where('type', '==', 'withdrawal_request'),
      where('timestamp', '>=', Timestamp.fromDate(oneDayAgo)),
      orderBy('timestamp', 'desc')
    );

    const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
    const withdrawalsCount = withdrawalsSnapshot.size;

    // إذا كان هناك أكثر من 3 طلبات سحب في آخر 24 ساعة
    if (withdrawalsCount >= 3) {
      // إنشاء حدث أمني
      await createSecurityEvent(
        userId,
        'multiple_withdrawals',
        'medium',
        `${withdrawalsCount} طلبات سحب في آخر 24 ساعة`,
        [activityId],
        { withdrawalsCount }
      );

      // إرسال إشعار للمسؤول
      await createAdminNotification(
        'طلبات سحب متعددة',
        `قام المستخدم ${userId} بإنشاء ${withdrawalsCount} طلبات سحب في آخر 24 ساعة.`,
        'security',
        { userId, withdrawalsCount }
      );
    }
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في فحص طلبات السحب المتعددة:', error);
  }
};

/**
 * إنشاء حدث أمني
 */
export const createSecurityEvent = async (
  userId: string,
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  relatedActivities: string[],
  metadata?: any
): Promise<string> => {
  try {
    const securityEventData: SecurityEvent = {
      userId,
      type,
      severity,
      timestamp: serverTimestamp() as Timestamp,
      description,
      relatedActivities,
      metadata,
      isResolved: false
    };

    const docRef = await addDoc(collection(db, 'securityEvents'), securityEventData);
    console.log(`[securityMonitoring.ts] تم إنشاء حدث أمني جديد بمعرف: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في إنشاء حدث أمني:', error);
    throw error;
  }
};

/**
 * الحصول على الأحداث الأمنية للمستخدم
 */
export const getUserSecurityEvents = async (userId: string): Promise<SecurityEvent[]> => {
  try {
    const securityEventsQuery = query(
      collection(db, 'securityEvents'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const securityEventsSnapshot = await getDocs(securityEventsQuery);
    const securityEvents: SecurityEvent[] = [];

    securityEventsSnapshot.forEach(doc => {
      const data = doc.data() as SecurityEvent;
      securityEvents.push({ ...data, id: doc.id });
    });

    return securityEvents;
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في الحصول على الأحداث الأمنية للمستخدم:', error);
    throw error;
  }
};

/**
 * الحصول على جميع الأحداث الأمنية
 */
export const getAllSecurityEvents = async (limitCount = 100): Promise<SecurityEvent[]> => {
  try {
    const securityEventsQuery = query(
      collection(db, 'securityEvents'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const securityEventsSnapshot = await getDocs(securityEventsQuery);
    const securityEvents: SecurityEvent[] = [];

    securityEventsSnapshot.forEach(doc => {
      const data = doc.data() as SecurityEvent;
      securityEvents.push({ ...data, id: doc.id });
    });

    return securityEvents;
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في الحصول على جميع الأحداث الأمنية:', error);
    throw error;
  }
};

/**
 * الحصول على معلومات المستخدم الأساسية
 */
export const getUserBasicInfo = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        displayName: userData.displayName || 'مستخدم',
        email: userData.email || '',
        membershipLevel: userData.membershipLevel || 0
      };
    }

    return null;
  } catch (error) {
    console.error('[securityMonitoring.ts] خطأ في الحصول على معلومات المستخدم:', error);
    throw error;
  }
};
