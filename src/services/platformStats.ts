import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

// واجهة إحصائيات المنصة
export interface PlatformStats {
  activeUsers: number;
  managedInvestments: number;
  countries: number;
  uptime: number;
  lastUpdated: Date;
}

// الإحصائيات الافتراضية
const defaultStats: PlatformStats = {
  activeUsers: 5000,
  managedInvestments: 2,
  countries: 15,
  uptime: 99.9,
  lastUpdated: new Date()
};

/**
 * الحصول على إحصائيات المنصة
 * @returns وعد يحتوي على إحصائيات المنصة
 */
export const getPlatformStats = async (): Promise<PlatformStats> => {
  try {
    const statsRef = doc(db, 'settings', 'platformStats');
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        activeUsers: data.activeUsers || defaultStats.activeUsers,
        managedInvestments: data.managedInvestments || defaultStats.managedInvestments,
        countries: data.countries || defaultStats.countries,
        uptime: data.uptime || defaultStats.uptime,
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : new Date()
      };
    } else {
      // إذا لم تكن الإحصائيات موجودة، قم بإنشائها باستخدام القيم الافتراضية
      await setDoc(statsRef, {
        ...defaultStats,
        lastUpdated: new Date()
      });
      return defaultStats;
    }
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المنصة:', error);
    return defaultStats;
  }
};

/**
 * تحديث إحصائيات المنصة
 * @param stats الإحصائيات الجديدة
 * @returns وعد يشير إلى نجاح العملية
 */
export const updatePlatformStats = async (stats: Partial<PlatformStats>): Promise<boolean> => {
  try {
    const statsRef = doc(db, 'settings', 'platformStats');
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      // تحديث الإحصائيات الموجودة
      await updateDoc(statsRef, {
        ...stats,
        lastUpdated: new Date()
      });
    } else {
      // إنشاء إحصائيات جديدة
      await setDoc(statsRef, {
        ...defaultStats,
        ...stats,
        lastUpdated: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('خطأ في تحديث إحصائيات المنصة:', error);
    return false;
  }
};

/**
 * الاستماع للتغييرات في إحصائيات المنصة
 * @param callback دالة يتم استدعاؤها عند تغيير الإحصائيات
 * @returns دالة لإلغاء الاستماع
 */
export const listenToPlatformStats = (
  callback: (stats: PlatformStats) => void
): (() => void) => {
  const statsRef = doc(db, 'settings', 'platformStats');

  // إنشاء مستمع للتغييرات
  const unsubscribe = onSnapshot(
    statsRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const stats: PlatformStats = {
          activeUsers: data.activeUsers || defaultStats.activeUsers,
          managedInvestments: data.managedInvestments || defaultStats.managedInvestments,
          countries: data.countries || defaultStats.countries,
          uptime: data.uptime || defaultStats.uptime,
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : new Date()
        };
        callback(stats);
      } else {
        // إذا لم تكن الإحصائيات موجودة، استخدم القيم الافتراضية
        callback(defaultStats);

        // إنشاء الإحصائيات الافتراضية في قاعدة البيانات
        setDoc(statsRef, {
          ...defaultStats,
          lastUpdated: new Date()
        }).catch(error => {
          console.error('خطأ في إنشاء إحصائيات المنصة الافتراضية:', error);
        });
      }
    },
    (error) => {
      console.error('خطأ في الاستماع لتغييرات إحصائيات المنصة:', error);
      // في حالة الخطأ، استخدم القيم الافتراضية
      callback(defaultStats);
    }
  );

  // إرجاع دالة لإلغاء الاستماع
  return unsubscribe;
};
