// سكريبت لإنشاء وثيقة المستخدم مباشرة في المتصفح
// قم بنسخ هذا الكود وتنفيذه في وحدة تحكم المتصفح (Console)

async function createUserDocument() {
  try {
    console.log("بدء عملية إنشاء وثيقة المستخدم...");
    
    // التحقق من وجود Firebase
    if (typeof firebase === 'undefined') {
      console.error("Firebase غير معرف. تأكد من أنك على صفحة التطبيق.");
      return;
    }
    
    // الحصول على المستخدم الحالي
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error("لم يتم العثور على مستخدم مسجل الدخول. يرجى تسجيل الدخول أولاً.");
      return;
    }
    
    console.log("المستخدم الحالي:", currentUser.uid);
    
    // إنشاء وثيقة المستخدم في Firestore
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // بيانات المستخدم
    const userData = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName || 'مستخدم Iseix',
      photoURL: currentUser.photoURL,
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
      referralCode: 'ADMIN' + Math.floor(Math.random() * 1000),
      referredBy: null,
      emailVerified: currentUser.emailVerified || true,
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    };
    
    // إنشاء الوثيقة
    await userRef.set(userData);
    
    console.log("تم إنشاء وثيقة المستخدم بنجاح!");
    console.log("يرجى تحديث الصفحة (F5) لرؤية التغييرات.");
    
    // تحديث الصفحة بعد 3 ثوانٍ
    console.log("سيتم تحديث الصفحة تلقائيًا بعد 3 ثوانٍ...");
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error("حدث خطأ أثناء إنشاء وثيقة المستخدم:", error);
  }
}

// تنفيذ الدالة
createUserDocument();
