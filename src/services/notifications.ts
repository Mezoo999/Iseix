import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  Timestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// أنواع الإشعارات
export type NotificationType = 'task' | 'referral' | 'reward' | 'membership' | 'system' | 'security';

// واجهة الإشعار
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Timestamp;
  metadata?: any;
  action?: {
    text: string;
    url: string;
  };
}

/**
 * إنشاء إشعار جديد
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: any,
  action?: { text: string; url: string }
): Promise<string> => {
  try {
    const notificationData = {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp(),
      metadata,
      action
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log(`[notifications.ts] تم إنشاء إشعار جديد بمعرف: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[notifications.ts] خطأ في إنشاء الإشعار:', error);
    throw error;
  }
};

/**
 * إنشاء إشعار للمسؤول
 */
export const createAdminNotification = async (
  title: string,
  message: string,
  type: NotificationType,
  metadata?: any
): Promise<string> => {
  try {
    // الحصول على قائمة المسؤولين
    const adminsQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', true)
    );

    const adminsSnapshot = await getDocs(adminsQuery);
    const adminIds: string[] = [];

    adminsSnapshot.forEach(doc => {
      adminIds.push(doc.id);
    });

    // إنشاء إشعار لكل مسؤول
    const notificationPromises = adminIds.map(adminId =>
      createNotification(
        adminId,
        title,
        message,
        type,
        metadata,
        { text: 'عرض التفاصيل', url: '/admin/notifications' }
      )
    );

    await Promise.all(notificationPromises);
    return 'تم إنشاء إشعارات للمسؤولين';
  } catch (error) {
    console.error('[notifications.ts] خطأ في إنشاء إشعار للمسؤول:', error);
    throw error;
  }
};

/**
 * الحصول على إشعارات المستخدم
 */
export const getUserNotifications = async (userId: string, limit = 20): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications: Notification[] = [];

    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.isRead,
        createdAt: data.createdAt,
        metadata: data.metadata,
        action: data.action
      });
    });

    return notifications;
  } catch (error) {
    console.error('[notifications.ts] خطأ في الحصول على إشعارات المستخدم:', error);
    throw error;
  }
};

/**
 * الحصول على إشعارات المستخدم بشكل دوري
 * بدلاً من استخدام onSnapshot، نستخدم استعلامًا عاديًا يتم تنفيذه بشكل دوري
 */
export const fetchUserNotificationsPolling = async (
  userId: string,
  limitCount = 20
): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications: Notification[] = [];

    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.isRead,
        createdAt: data.createdAt,
        metadata: data.metadata,
        action: data.action
      });
    });

    return notifications;
  } catch (error) {
    console.error('[notifications.ts] خطأ في جلب إشعارات المستخدم:', error);
    throw error;
  }
};

/**
 * تحديث حالة قراءة الإشعار
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
    console.log(`[notifications.ts] تم تحديث حالة قراءة الإشعار: ${notificationId}`);
  } catch (error) {
    console.error('[notifications.ts] خطأ في تحديث حالة قراءة الإشعار:', error);
    throw error;
  }
};

/**
 * تحديث حالة قراءة جميع إشعارات المستخدم
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);

    const updatePromises = notificationsSnapshot.docs.map(doc =>
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
    console.log(`[notifications.ts] تم تحديث حالة قراءة جميع إشعارات المستخدم: ${userId}`);
  } catch (error) {
    console.error('[notifications.ts] خطأ في تحديث حالة قراءة جميع الإشعارات:', error);
    throw error;
  }
};

/**
 * إنشاء إشعار مهمة جديدة
 */
export const createTaskNotification = async (
  userId: string,
  taskCount: number
): Promise<string> => {
  return createNotification(
    userId,
    'مهام جديدة متاحة',
    `لديك ${taskCount} مهام جديدة متاحة اليوم. أكملها للحصول على مكافآت.`,
    'task',
    { taskCount },
    { text: 'عرض المهام', url: '/tasks' }
  );
};

/**
 * إنشاء إشعار إحالة جديدة
 */
export const createReferralNotification = async (
  userId: string,
  referredUserId: string,
  referredUserName: string
): Promise<string> => {
  return createNotification(
    userId,
    'إحالة جديدة',
    `قام ${referredUserName} بالتسجيل باستخدام رابط الإحالة الخاص بك.`,
    'referral',
    { referredUserId },
    { text: 'عرض الإحالات', url: '/referrals' }
  );
};

/**
 * إنشاء إشعار مكافأة جديدة
 */
export const createRewardNotification = async (
  userId: string,
  amount: number,
  currency: string,
  source: string
): Promise<string> => {
  return createNotification(
    userId,
    'مكافأة جديدة',
    `حصلت على مكافأة قدرها ${amount} ${currency} من ${source}.`,
    'reward',
    { amount, currency, source },
    { text: 'عرض المحفظة', url: '/wallet' }
  );
};

/**
 * إنشاء إشعار ترقية مستوى العضوية
 */
export const createMembershipUpgradeNotification = async (
  userId: string,
  newLevel: string
): Promise<string> => {
  return createNotification(
    userId,
    'ترقية مستوى العضوية',
    `تهانينا! تمت ترقية مستوى عضويتك إلى ${newLevel}.`,
    'membership',
    { newLevel },
    { text: 'عرض المستوى', url: '/membership' }
  );
};

/**
 * إنشاء إشعار أمني
 */
export const createSecurityNotification = async (
  userId: string,
  title: string,
  message: string,
  metadata?: any
): Promise<string> => {
  return createNotification(
    userId,
    title,
    message,
    'security',
    metadata,
    { text: 'إعدادات الأمان', url: '/profile/security' }
  );
};

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    return notificationsSnapshot.size;
  } catch (error) {
    console.error('[notifications.ts] خطأ في الحصول على عدد الإشعارات غير المقروءة:', error);
    throw error;
  }
};
