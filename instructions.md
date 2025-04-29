# تعليمات إصلاح مشكلة عدم ظهور بيانات المستخدم

## المشكلة
بيانات المستخدم موجودة في Firestore، لكنها لا تظهر في واجهة المنصة.

## الحل
اتبع الخطوات التالية بالترتيب:

### 1. مسح ذاكرة التخزين المؤقت (localStorage)
1. افتح المتصفح وانتقل إلى موقع المنصة
2. اضغط F12 لفتح أدوات المطور
3. انتقل إلى علامة التبويب "Console" أو "وحدة التحكم"
4. انسخ والصق الكود التالي ثم اضغط Enter:

```javascript
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
```

### 2. تسجيل الخروج وإعادة تسجيل الدخول
1. قم بتسجيل الخروج من المنصة
2. قم بإعادة تحميل الصفحة (F5)
3. قم بتسجيل الدخول مرة أخرى

### 3. إذا استمرت المشكلة، استخدم متصفح آخر
جرب استخدام متصفح مختلف تمامًا (مثل Firefox إذا كنت تستخدم Chrome، أو العكس).

### 4. إذا استمرت المشكلة، قم بتنفيذ سكريبت إعادة تعيين بيانات المستخدم
هذا يتطلب وصولًا إلى Firebase Admin SDK. اتبع الخطوات التالية:

1. تأكد من تثبيت Node.js على جهازك
2. قم بتنزيل ملف مفتاح حساب الخدمة من Firebase Console
3. ضع الملف في نفس المجلد الذي يحتوي على السكريبت
4. قم بتنفيذ السكريبت باستخدام الأمر:
   ```
   node reset-user-data.js
   ```

### 5. إذا استمرت المشكلة، تواصل مع مطور المنصة
قد تكون هناك مشكلة أعمق في كود التطبيق تتطلب تدخلًا من المطور.

## ملاحظات إضافية
- تأكد من أن معرف المستخدم (UID) المستخدم في السكريبت هو نفسه المعرف الخاص بك
- تأكد من أن البريد الإلكتروني المستخدم في السكريبت هو نفسه البريد الإلكتروني الخاص بك
