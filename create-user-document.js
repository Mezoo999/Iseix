// سكريبت لإنشاء وثيقة المستخدم
// قم بتنفيذ هذا السكريبت باستخدام Node.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود ملف مفتاح حساب الخدمة

// تهيئة Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// معرف المستخدم - تأكد من استخدام المعرف الصحيح للمستخدم الحالي
const userId = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3'; // قم بتغيير هذا إلى معرف المستخدم الخاص بك

// إنشاء وثيقة المستخدم
async function createUserDocument() {
  try {
    console.log(`بدء عملية إنشاء وثيقة المستخدم ${userId}...`);
    
    // التحقق من وجود المستخدم
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('وثيقة المستخدم موجودة بالفعل، جاري تحديثها...');
      
      // تحديث وثيقة المستخدم
      await userRef.update({
        isAdmin: true,
        isOwner: true,
        'balances.USDT': 1000000,
        totalDeposited: 100000,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('تم تحديث وثيقة المستخدم بنجاح.');
    } else {
      console.log('وثيقة المستخدم غير موجودة، جاري إنشاؤها...');
      
      // إنشاء رمز إحالة
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      // إنشاء وثيقة المستخدم
      await userRef.set({
        uid: userId,
        email: 'moatazmohamed8090@gmail.com', // قم بتغيير هذا إلى بريدك الإلكتروني
        displayName: 'مدير المنصة',
        photoURL: null,
        isAdmin: true,
        isOwner: true,
        balances: {
          USDT: 1000000,
          BTC: 0,
          ETH: 0,
          BNB: 0
        },
        totalInvested: 0,
        totalProfit: 0,
        totalDeposited: 100000,
        totalWithdrawn: 0,
        totalReferrals: 0,
        totalReferralEarnings: 0,
        referralCode: generateReferralCode(),
        referredBy: null,
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('تم إنشاء وثيقة المستخدم بنجاح.');
    }
    
    console.log('تمت العملية بنجاح.');
  } catch (error) {
    console.error('حدث خطأ أثناء إنشاء وثيقة المستخدم:', error);
  }
}

// تنفيذ الدالة
createUserDocument();
