import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

export const dynamic = 'force-static';

// معرف المستخدم الذي سيتم تعيينه كمدير
const ADMIN_USER_ID = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';

// المبلغ الذي سيتم إضافته
const AMOUNT_TO_ADD = 100000;

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

export async function GET() {
  try {
    // التحقق من وجود المستخدم
    const userRef = doc(db, 'users', ADMIN_USER_ID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // تحديث بيانات المستخدم الموجود
      await updateDoc(userRef, {
        isAdmin: true,
        isOwner: true,
        [`balances.USDT`]: AMOUNT_TO_ADD,
        totalDeposited: AMOUNT_TO_ADD,
        updatedAt: serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        message: `تم تحديث المستخدم ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT`
      });
    } else {
      // إنشاء وثيقة مستخدم جديدة
      const userData = {
        uid: ADMIN_USER_ID,
        email: 'admin@iseix.com',
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

      return NextResponse.json({
        success: true,
        message: `تم إنشاء مستخدم جديد ${ADMIN_USER_ID} كمدير وإضافة ${AMOUNT_TO_ADD} USDT`
      });
    }
  } catch (error: any) {
    console.error('Error setting admin and adding funds:', error);
    return NextResponse.json({
      success: false,
      message: `حدث خطأ أثناء تعيين المستخدم كمدير وإضافة الرصيد: ${error.message}`
    }, { status: 500 });
  }
}
