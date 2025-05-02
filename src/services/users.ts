import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import {
  User,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { db, auth } from '@/firebase/config';
import { createTransaction } from './transactions';

// واجهة بيانات المستخدم
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  isAdmin: boolean;
  isOwner?: boolean;
  balances?: {
    [currency: string]: number;
  };
  totalInvested: number;
  totalProfit: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalReferrals?: number;
  totalReferralEarnings?: number;
  referralCode: string;
  referredBy: string | null;
  emailVerified: boolean;
  membershipLevel?: number;
  createdAt: any;
  updatedAt?: any;
  isBlocked?: boolean;
}

// الحصول على بيانات مستخدم
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    console.log(`جاري جلب بيانات المستخدم: ${userId}`);
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      console.log(`تم العثور على بيانات المستخدم: ${userId}`);
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    } else {
      console.log(`لم يتم العثور على بيانات المستخدم: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// إنشاء أو تحديث بيانات مستخدم
export const createOrUpdateUserData = async (
  userId: string,
  userData: Partial<UserData>
): Promise<void> => {
  try {
    console.log(`جاري إنشاء/تحديث بيانات المستخدم: ${userId}`);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // تحديث البيانات الموجودة
      console.log(`تحديث بيانات المستخدم الموجود: ${userId}`);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } else {
      // إنشاء بيانات جديدة
      console.log(`إنشاء بيانات مستخدم جديد: ${userId}`);
      await setDoc(userRef, {
        uid: userId,
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user data:', error);
    throw error;
  }
};

// تحديث رصيد المستخدم
export const updateUserBalance = async (
  userId: string,
  amount: number,
  currency: string,
  type: 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'referral'
): Promise<void> => {
  try {
    console.log(`[users.ts] تحديث رصيد المستخدم: ${userId}, المبلغ: ${amount}, العملة: ${currency}, النوع: ${type}`);

    // التحقق من صحة المعلمات
    if (!userId) throw new Error('معرف المستخدم مطلوب');
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    if (!currency) throw new Error('العملة مطلوبة');

    const userRef = doc(db, 'users', userId);

    // الحصول على بيانات المستخدم الحالية للتحقق
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error(`لم يتم العثور على بيانات المستخدم: ${userId}`);
    }

    const userData = userDoc.data();
    const currentBalance = (userData.balances && userData.balances[currency]) || 0;

    console.log(`[users.ts] الرصيد الحالي للمستخدم ${userId}: ${currentBalance} ${currency}`);

    // تحديد ما إذا كان يجب إضافة أو طرح المبلغ
    let amountChange = amount;

    if (type === 'withdrawal') {
      amountChange = -amount;

      // التحقق من وجود رصيد كافٍ للسحب
      if (currentBalance < amount) {
        throw new Error(`رصيد غير كافٍ. الرصيد الحالي: ${currentBalance} ${currency}, المبلغ المطلوب: ${amount} ${currency}`);
      }
    }

    // تحديث الرصيد
    const updateData: Record<string, any> = {
      [`balances.${currency}`]: increment(amountChange),
      updatedAt: serverTimestamp()
    };

    // تحديث الإحصائيات الأخرى حسب نوع المعاملة
    if (type === 'deposit') {
      updateData.totalDeposited = increment(amount);
    } else if (type === 'withdrawal') {
      updateData.totalWithdrawn = increment(amount);
    } else if (type === 'investment') {
      updateData.totalInvested = increment(amount);
    } else if (type === 'profit') {
      updateData.totalProfit = increment(amount);
    } else if (type === 'referral') {
      updateData.totalReferralEarnings = increment(amount);
    }

    // تنفيذ التحديث
    await updateDoc(userRef, updateData);

    // التحقق من نجاح التحديث
    const updatedUserDoc = await getDoc(userRef);
    const updatedUserData = updatedUserDoc.data();
    const newBalance = (updatedUserData.balances && updatedUserData.balances[currency]) || 0;

    console.log(`[users.ts] تم تحديث رصيد المستخدم ${userId} بنجاح. الرصيد الجديد: ${newBalance} ${currency}`);

    // التحقق من صحة التحديث
    const expectedBalance = currentBalance + amountChange;
    if (Math.abs(newBalance - expectedBalance) > 0.001) {
      console.warn(`[users.ts] تحذير: الرصيد الجديد (${newBalance}) لا يتطابق مع الرصيد المتوقع (${expectedBalance})`);
    }
  } catch (error) {
    console.error('[users.ts] Error updating user balance:', error);
    throw error;
  }
};

// تحديث الملف الشخصي للمستخدم
export const updateUserProfile = async (
  userId: string,
  profileData: {
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    email?: string;
  }
): Promise<void> => {
  try {
    console.log(`تحديث الملف الشخصي للمستخدم: ${userId}`);
    const userRef = doc(db, 'users', userId);
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // تحديث البيانات في Firebase Auth
    const authUpdateData: Record<string, any> = {};

    if (profileData.displayName) {
      authUpdateData.displayName = profileData.displayName;
    }

    if (profileData.photoURL) {
      authUpdateData.photoURL = profileData.photoURL;
    }

    if (Object.keys(authUpdateData).length > 0) {
      await updateProfile(user, authUpdateData);
    }

    if (profileData.email && profileData.email !== user.email) {
      await updateEmail(user, profileData.email);
    }

    // تحديث البيانات في Firestore
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });

    console.log(`تم تحديث الملف الشخصي للمستخدم: ${userId} بنجاح`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// تحديث كلمة مرور المستخدم
export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // إعادة المصادقة قبل تغيير كلمة المرور
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // تحديث كلمة المرور
    await updatePassword(user, newPassword);
    console.log('تم تحديث كلمة المرور بنجاح');
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// الحصول على قائمة المستخدمين (للمسؤولين)
export const getAllUsers = async (limitCount: number = 100): Promise<UserData[]> => {
  try {
    console.log(`جاري جلب قائمة المستخدمين (الحد: ${limitCount})`);
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const usersSnapshot = await getDocs(usersQuery);
    const users: UserData[] = [];

    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserData);
    });

    console.log(`تم جلب ${users.length} مستخدم`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// البحث عن مستخدمين
export const searchUsers = async (
  searchTerm: string,
  field: 'email' | 'displayName' | 'referralCode' = 'email',
  limitCount: number = 10
): Promise<UserData[]> => {
  try {
    console.log(`البحث عن مستخدمين: ${searchTerm}, الحقل: ${field}`);
    // لا يمكن استخدام عوامل تشغيل مثل LIKE في Firestore
    // لذلك نقوم بجلب البيانات ثم تصفيتها

    const usersQuery = query(
      collection(db, 'users'),
      orderBy(field),
      limit(100) // نجلب عدد أكبر ثم نصفي
    );

    const usersSnapshot = await getDocs(usersQuery);
    const users: UserData[] = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as DocumentData;
      const fieldValue = String(userData[field] || '').toLowerCase();

      if (fieldValue.includes(searchTerm.toLowerCase())) {
        users.push({ id: doc.id, ...userData } as UserData);
      }
    });

    console.log(`تم العثور على ${users.length} مستخدم`);
    return users.slice(0, limitCount);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// حظر أو إلغاء حظر مستخدم
export const toggleUserBlock = async (
  userId: string,
  isBlocked: boolean
): Promise<void> => {
  try {
    console.log(`${isBlocked ? 'حظر' : 'إلغاء حظر'} المستخدم: ${userId}`);
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      isBlocked,
      updatedAt: serverTimestamp()
    });

    console.log(`تم ${isBlocked ? 'حظر' : 'إلغاء حظر'} المستخدم: ${userId} بنجاح`);
  } catch (error) {
    console.error('Error toggling user block status:', error);
    throw error;
  }
};

// تغيير مستوى عضوية المستخدم
export const updateUserMembershipLevel = async (
  userId: string,
  membershipLevel: number
): Promise<void> => {
  try {
    console.log(`تحديث مستوى عضوية المستخدم: ${userId} إلى المستوى: ${membershipLevel}`);
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      membershipLevel,
      updatedAt: serverTimestamp()
    });

    console.log(`تم تحديث مستوى عضوية المستخدم: ${userId} بنجاح`);
  } catch (error) {
    console.error('Error updating user membership level:', error);
    throw error;
  }
};

// إضافة رصيد للمستخدم (للمسؤولين)
export const addUserBalance = async (
  userId: string,
  amount: number,
  currency: string = 'USDT',
  description: string = 'إضافة رصيد بواسطة المسؤول'
): Promise<void> => {
  try {
    console.log(`إضافة رصيد للمستخدم: ${userId}, المبلغ: ${amount}, العملة: ${currency}`);

    // تحديث رصيد المستخدم
    await updateUserBalance(userId, amount, currency, 'deposit');

    // إنشاء معاملة
    await createTransaction({
      userId,
      type: 'deposit',
      amount,
      currency,
      status: 'completed',
      description,
      metadata: {
        isAdminDeposit: true
      },
      createdAt: serverTimestamp()
    });

    console.log(`تم إضافة رصيد للمستخدم: ${userId} بنجاح`);
  } catch (error) {
    console.error('Error adding user balance:', error);
    throw error;
  }
};

// التحقق من وجود رصيد كافٍ
export const hasEnoughBalance = async (
  userId: string,
  amount: number,
  currency: string = 'USDT'
): Promise<boolean> => {
  try {
    console.log(`[users.ts] التحقق من وجود رصيد كافٍ للمستخدم: ${userId}, المبلغ: ${amount}, العملة: ${currency}`);

    if (!userId) {
      console.error('[users.ts] معرف المستخدم غير صالح');
      return false;
    }

    if (amount <= 0) {
      console.error('[users.ts] المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }

    const userData = await getUserData(userId);

    if (!userData) {
      console.error(`[users.ts] لم يتم العثور على بيانات المستخدم: ${userId}`);
      return false;
    }

    if (!userData.balances) {
      console.error(`[users.ts] المستخدم ${userId} ليس لديه أرصدة محددة`);
      return false;
    }

    const balance = userData.balances[currency] || 0;
    console.log(`[users.ts] رصيد المستخدم ${userId}: ${balance} ${currency}, المبلغ المطلوب: ${amount} ${currency}`);

    const hasEnough = balance >= amount;
    console.log(`[users.ts] نتيجة التحقق من الرصيد: ${hasEnough ? 'كافٍ' : 'غير كافٍ'}`);

    return hasEnough;
  } catch (error) {
    console.error('[users.ts] Error checking user balance:', error);
    return false;
  }
};

// تنسيق التاريخ
export const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';

  try {
    const date = timestamp instanceof Timestamp ?
      timestamp.toDate() :
      (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));

    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// إنشاء رمز إحالة فريد
export const generateReferralCode = (userId?: string): string => {
  const prefix = 'ISEIX';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userPart = userId ? userId.substring(0, 4).toUpperCase() : '';

  const referralCode = `${prefix}${userPart}${randomPart}`;
  console.log(`[users.ts] تم إنشاء رمز إحالة جديد: ${referralCode} للمستخدم: ${userId || 'غير معروف'}`);
  return referralCode;
};
