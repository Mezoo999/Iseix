// سكريبت لإعادة إنشاء وثيقة المستخدم
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود ملف مفتاح حساب الخدمة

// تهيئة Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// معرف المستخدم - تأكد من استخدام المعرف الصحيح
const userId = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';

// إعادة إنشاء وثيقة المستخدم
const userRef = db.collection('users').doc(userId);

// إنشاء وثيقة مستخدم جديدة
userRef.set({
  uid: userId,
  email: 'moatazmohamed8090@gmail.com',
  displayName: 'مدير المنصة',
  isAdmin: true,
  isOwner: true,
  balances: {
    USDT: 1000000
  },
  totalInvested: 0,
  totalProfit: 0,
  totalDeposited: 100000,
  totalWithdrawn: 0,
  totalReferrals: 0,
  totalReferralEarnings: 0,
  referralCode: 'moataz1999',
  referredBy: null,
  emailVerified: true,
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now()
}, { merge: false }) // استخدام merge: false لاستبدال الوثيقة بالكامل
.then(() => {
  console.log(`تم إعادة إنشاء وثيقة المستخدم ${userId} بنجاح`);
})
.catch((error) => {
  console.error('حدث خطأ:', error);
});
