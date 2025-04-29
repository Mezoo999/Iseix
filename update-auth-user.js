// سكريبت لتحديث بيانات المستخدم في Firebase Authentication
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تأكد من وجود ملف مفتاح حساب الخدمة

// تهيئة Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// معرف المستخدم - تأكد من استخدام المعرف الصحيح
const userId = 'PAeCtT8GNoYwRTiLM1CjYL59a3J3';

// تحديث بيانات المستخدم في Firebase Authentication
async function updateAuthUser() {
  try {
    console.log(`بدء عملية تحديث بيانات المستخدم ${userId} في Firebase Authentication...`);
    
    // تحديث بيانات المستخدم
    await admin.auth().updateUser(userId, {
      displayName: 'مدير المنصة',
      email: 'moatazmohamed8090@gmail.com',
      emailVerified: true
    });
    
    console.log('تم تحديث بيانات المستخدم في Firebase Authentication بنجاح.');
  } catch (error) {
    console.error('حدث خطأ أثناء تحديث بيانات المستخدم في Firebase Authentication:', error);
  }
}

// تنفيذ الدالة
updateAuthUser();
