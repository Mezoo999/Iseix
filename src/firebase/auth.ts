import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';
import { getUserIdFromReferralCode, createReferral, autoUpdateMembershipLevel } from '@/services/referral';
import { createOrUpdateUserData, updateUserProfile, updateUserPassword, generateReferralCode } from '@/services/users';

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
      console.log(`[auth.ts] التحقق من رمز الإحالة: ${referralCode}`);
      referrerId = await getUserIdFromReferralCode(referralCode);
      console.log(`[auth.ts] نتيجة التحقق من رمز الإحالة: ${referrerId ? 'تم العثور على المستخدم المحيل' : 'لم يتم العثور على المستخدم المحيل'}`);
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
    await createOrUpdateUserData(user.uid, {
      uid: user.uid,
      email,
      displayName,
      isAdmin: false, // المستخدم الجديد ليس مشرفًا
      isOwner: false, // المستخدم الجديد ليس مالكًا
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
      emailVerified: false,
      membershipLevel: 0
    });

    // إنشاء إحالة إذا كان هناك رمز إحالة صالح
    if (referrerId) {
      try {
        console.log(`[auth.ts] إنشاء إحالة للمستخدم الجديد: ${user.uid} بواسطة المحيل: ${referrerId}`);
        await createReferral(referrerId, user.uid, email);
        console.log(`[auth.ts] تم إنشاء الإحالة بنجاح`);

        // تحديث مستوى العضوية للمستخدم المحيل تلقائيًا
        try {
          console.log(`[auth.ts] تحديث مستوى العضوية للمستخدم المحيل: ${referrerId}`);
          await autoUpdateMembershipLevel(referrerId);
          console.log(`[auth.ts] تم تحديث مستوى العضوية للمستخدم المحيل بنجاح`);
        } catch (membershipError) {
          console.error('[auth.ts] Error updating referrer membership level:', membershipError);
          // لا نريد إيقاف عملية التسجيل إذا فشل تحديث مستوى العضوية
        }
      } catch (referralError) {
        console.error('[auth.ts] Error creating referral:', referralError);
        // لا نريد إيقاف عملية التسجيل إذا فشل إنشاء الإحالة
      }
    } else if (referralCode) {
      console.log(`[auth.ts] لم يتم العثور على مستخدم محيل برمز الإحالة: ${referralCode}`);
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
export { updateUserProfile } from '@/services/users';

// تحديث كلمة مرور المستخدم
export { updateUserPassword } from '@/services/users';
