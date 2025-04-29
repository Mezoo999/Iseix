import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { getUserIdFromReferralCode, createReferral, autoUpdateMembershipLevel } from '@/services/referral';

// تسجيل مستخدم جديد
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  referralCode?: string
): Promise<UserCredential> => {
  try {
    // التحقق من رمز الإحالة إذا كان موجودًا
    let referrerId = null;
    if (referralCode) {
      referrerId = await getUserIdFromReferralCode(referralCode);
    }

    // إنشاء المستخدم في Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // تحديث اسم العرض
    await updateProfile(user, { displayName });

    // إرسال بريد التحقق
    await sendEmailVerification(user);

    // إنشاء رمز إحالة فريد
    const newReferralCode = generateReferralCode(user.uid);

    // إنشاء وثيقة المستخدم في Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAdmin: false,
      balances: {
        USDT: 0,
      },
      totalInvested: 0,
      totalProfit: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalReferrals: 0,
      totalReferralEarnings: 0,
      referralCode: newReferralCode,
      referredBy: referrerId,
      emailVerified: false
    });

    // إنشاء إحالة إذا كان هناك رمز إحالة صالح
    if (referrerId) {
      await createReferral(referrerId, user.uid, email);

      // تحديث مستوى العضوية للمستخدم المحيل تلقائيًا
      try {
        await autoUpdateMembershipLevel(referrerId);
      } catch (membershipError) {
        console.error('Error updating referrer membership level:', membershipError);
        // لا نريد إيقاف عملية التسجيل إذا فشل تحديث مستوى العضوية
      }
    }

    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// تسجيل الدخول
export const loginUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    console.log('Attempting to login with email:', email);
    // تنظيف البريد الإلكتروني وكلمة المرور من المسافات الزائدة
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    // محاولة تسجيل الدخول
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    console.log('Login successful for user:', userCredential.user.uid);
    return userCredential;
  } catch (error: any) {
    console.error('Error logging in:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    // إعادة تعيين حالة المصادقة إذا كان هناك خطأ
    if (error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password') {
      // محاولة تسجيل الخروج لإعادة تعيين حالة المصادقة
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Error signing out after failed login:', signOutError);
      }
    }

    throw error;
  }
};

// تسجيل الخروج
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// إعادة تعيين كلمة المرور
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// تحديث الملف الشخصي للمستخدم
export const updateUserProfile = async (userData: {
  displayName?: string;
  phoneNumber?: string;
}): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // تحديث الاسم في Firebase Auth
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName });
    }

    // تحديث البيانات في Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
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
    if (!user || !user.email) throw new Error('User not authenticated');

    // إعادة المصادقة قبل تغيير كلمة المرور
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // تحديث كلمة المرور
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// إنشاء رمز إحالة فريد
const generateReferralCode = (uid: string): string => {
  // إنشاء رمز إحالة من معرف المستخدم + أحرف عشوائية
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${randomChars}${uid.substring(0, 4)}`;
};
