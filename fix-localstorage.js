// سكريبت لإصلاح مشكلة localStorage
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
  console.log("تم مسح بيانات المستخدم بنجاح. يرجى تحديث الصفحة وإعادة تسجيل الدخول.");
}

// تنفيذ الدالة
clearUserDataFromLocalStorage();
