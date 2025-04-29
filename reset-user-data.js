// سكريبت لإعادة تعيين بيانات المستخدم في Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود ملف مفتاح حساب الخدمة

// تهيئة Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// معرف المستخدم - تأكد من استخدام المعرف الصحيح
const userId = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';

// حذف وثيقة المستخدم الحالية وإعادة إنشائها
async function resetUserData() {
  try {
    console.log(`بدء عملية إعادة تعيين بيانات المستخدم ${userId}...`);
    
    // التحقق من وجود المستخدم
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('تم العثور على وثيقة المستخدم، جاري حذفها...');
      await userRef.delete();
      console.log('تم حذف وثيقة المستخدم بنجاح.');
    }
    
    // إنشاء وثيقة مستخدم جديدة
    console.log('جاري إنشاء وثيقة مستخدم جديدة...');
    await userRef.set({
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
    });
    
    console.log('تم إنشاء وثيقة المستخدم بنجاح.');
    console.log('تم إعادة تعيين بيانات المستخدم بنجاح.');
  } catch (error) {
    console.error('حدث خطأ أثناء إعادة تعيين بيانات المستخدم:', error);
  }
}

// تنفيذ الدالة
resetUserData();
