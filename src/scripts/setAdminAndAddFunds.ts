import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

// معرف المستخدم الذي سيتم تعيينه كمدير
const ADMIN_USER_ID = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';

// المبلغ الذي سيتم إضافته
const AMOUNT_TO_ADD = 100000;

/**
 * تعيين المستخدم كمدير وإضافة رصيد
 */
export const setAdminAndAddFunds = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // التحقق من وجود المستخدم
    const userRef = doc(db, 'users', ADMIN_USER_ID);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // تحديث بيانات المستخدم الموجود
      await updateDoc(userRef, {
        isAdmin: true,
        isOwner: true,
        [`balances.USDT`]: increment(AMOUNT_TO_ADD),
        totalDeposited: increment(AMOUNT_TO_ADD),
        updatedAt: serverTimestamp()
      });
      
      console.log(`تم تحديث المستخدم ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT`);
      return { 
        success: true, 
        message: `تم تحديث المستخدم ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT` 
      };
    } else {
      // إنشاء وثيقة مستخدم جديدة
      const userData = {
        uid: ADMIN_USER_ID,
        email: 'admin@iseix.com', // يمكن تغييره لاحقًا
        displayName: 'مدير المنصة',
        isAdmin: true,
        isOwner: true,
        balances: {
          USDT: AMOUNT_TO_ADD
        },
        totalInvested: 0,
        totalProfit: 0,
        totalDeposited: AMOUNT_TO_ADD,
        totalWithdrawn: 0,
        totalReferrals: 0,
        totalReferralEarnings: 0,
        referralCode: generateReferralCode(),
        referredBy: null,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, userData);
      
      console.log(`تم إنشاء مستخدم جديد ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT`);
      return { 
        success: true, 
        message: `تم إنشاء مستخدم جديد ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT` 
      };
    }
  } catch (error) {
    console.error('Error setting admin and adding funds:', error);
    return { 
      success: false, 
      message: `حدث خطأ أثناء تعيين المستخدم كمدير وإضافة الرصيد: ${error}` 
    };
  }
};

/**
 * إنشاء رمز إحالة عشوائي
 */
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// تنفيذ الوظيفة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  setAdminAndAddFunds()
    .then(result => {
      console.log(result.message);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
