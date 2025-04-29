// سكريبت لإصلاح مشكلة عدم ظهور بيانات المستخدم
// قم بنسخ هذا الكود وتنفيذه في وحدة تحكم المتصفح (Console)

// حذف جميع بيانات المستخدم المخزنة في localStorage
function clearUserDataFromLocalStorage() {
  console.log("بدء عملية مسح بيانات المستخدم من localStorage...");
  
  // البحث عن جميع المفاتيح التي تبدأ بـ userData_
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('userData_')) {
      keysToRemove.push(key);
    }
  }
  
  // حذف المفاتيح
  keysToRemove.forEach(key => {
    console.log(`حذف المفتاح: ${key}`);
    localStorage.removeItem(key);
  });
  
  // حذف المفتاح currentUserData إذا كان موجودًا
  if (localStorage.getItem('currentUserData')) {
    console.log("حذف المفتاح: currentUserData");
    localStorage.removeItem('currentUserData');
  }
  
  console.log(`تم حذف ${keysToRemove.length + (localStorage.getItem('currentUserData') ? 1 : 0)} مفتاح من localStorage`);
}

// حذف جميع ملفات تعريف الارتباط (cookies)
function clearAllCookies() {
  console.log("بدء عملية مسح ملفات تعريف الارتباط (cookies)...");
  
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
  
  console.log(`تم مسح ${cookies.length} ملف تعريف ارتباط`);
}

// مسح ذاكرة التخزين المؤقت للجلسة (sessionStorage)
function clearSessionStorage() {
  console.log("بدء عملية مسح ذاكرة التخزين المؤقت للجلسة (sessionStorage)...");
  
  const count = sessionStorage.length;
  sessionStorage.clear();
  
  console.log(`تم مسح ${count} عنصر من sessionStorage`);
}

// تسجيل الخروج من Firebase
function signOutFromFirebase() {
  console.log("محاولة تسجيل الخروج من Firebase...");
  
  try {
    // محاولة الوصول إلى كائن Firebase
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut()
        .then(() => {
          console.log("تم تسجيل الخروج من Firebase بنجاح");
        })
        .catch((error) => {
          console.error("حدث خطأ أثناء تسجيل الخروج من Firebase:", error);
        });
    } else {
      console.log("لم يتم العثور على كائن Firebase، تخطي تسجيل الخروج");
    }
  } catch (error) {
    console.error("حدث خطأ أثناء محاولة تسجيل الخروج:", error);
  }
}

// تنفيذ جميع الدوال
function fixUserDataIssue() {
  console.log("=== بدء عملية إصلاح مشكلة بيانات المستخدم ===");
  
  clearUserDataFromLocalStorage();
  clearAllCookies();
  clearSessionStorage();
  signOutFromFirebase();
  
  console.log("=== اكتملت عملية الإصلاح ===");
  console.log("يرجى تحديث الصفحة (F5) وإعادة تسجيل الدخول");
  
  // تحديث الصفحة بعد 3 ثوانٍ
  console.log("سيتم تحديث الصفحة تلقائيًا بعد 3 ثوانٍ...");
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// تنفيذ الدالة الرئيسية
fixUserDataIssue();
