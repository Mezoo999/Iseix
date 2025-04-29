// هذا الملف يستخدم Firebase Admin SDK
// يمكنك تنفيذه على الخادم أو باستخدام Cloud Functions

const admin = require('firebase-admin');
// قم بتهيئة Firebase Admin SDK باستخدام ملف الاعتماد الخاص بك
// admin.initializeApp({
//   credential: admin.credential.cert(require('./path-to-service-account.json'))
// });

const db = admin.firestore();

// تعيين المستخدم كمدير وإضافة رصيد
const userId = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';
const amountToAdd = 100000;

// التحقق من وجود المستخدم
const userRef = db.collection('users').doc(userId);
userRef.get()
  .then((doc) => {
    if (doc.exists) {
      // تحديث بيانات المستخدم الموجود
      return userRef.update({
        isAdmin: true,
        isOwner: true,
        'balances.USDT': amountToAdd,
        totalDeposited: amountToAdd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // إنشاء وثيقة مستخدم جديدة
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      return userRef.set({
        uid: userId,
        email: 'admin@iseix.com',
        displayName: 'مدير المنصة',
        isAdmin: true,
        isOwner: true,
        balances: {
          USDT: amountToAdd
        },
        totalInvested: 0,
        totalProfit: 0,
        totalDeposited: amountToAdd,
        totalWithdrawn: 0,
        totalReferrals: 0,
        totalReferralEarnings: 0,
        referralCode: generateReferralCode(),
        referredBy: null,
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  })
  .then(() => {
    console.log(`تم تعيين المستخدم ${userId} كمدير وإضافة ${amountToAdd} USDT بنجاح`);
  })
  .catch((error) => {
    console.error('حدث خطأ:', error);
  });
