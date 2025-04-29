// سكريبت لإنشاء وثيقة المستخدم في المتصفح
// انسخ هذا الكود وقم بتنفيذه في وحدة تحكم المتصفح (Console)

// إنشاء زر في الصفحة
var btn = document.createElement('button');
btn.innerHTML = 'إنشاء وثيقة المستخدم';
btn.style = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:red;color:white;';
btn.onclick = function() {
  // الحصول على المستخدم الحالي
  var user = firebase.auth().currentUser;
  if (!user) {
    alert('لم يتم العثور على مستخدم مسجل الدخول. يرجى تسجيل الدخول أولاً.');
    return;
  }
  
  console.log("المستخدم الحالي:", user.uid);
  
  // إنشاء وثيقة المستخدم في Firestore
  var db = firebase.firestore();
  var userRef = db.collection('users').doc(user.uid);
  
  // بيانات المستخدم
  var userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'مستخدم Iseix',
    photoURL: user.photoURL,
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
    emailVerified: true,
    createdAt: firebase.firestore.Timestamp.now(),
    updatedAt: firebase.firestore.Timestamp.now()
  };
  
  // إنشاء الوثيقة
  userRef.set(userData)
    .then(function() {
      alert('تم إنشاء وثيقة المستخدم بنجاح!');
      window.location.reload();
    })
    .catch(function(error) {
      alert('حدث خطأ: ' + error);
    });
};

// إضافة الزر إلى الصفحة
document.body.appendChild(btn);
