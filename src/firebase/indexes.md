# فهارس Firebase المطلوبة

هذا الملف يحتوي على قائمة بالفهارس المركبة المطلوبة في Firebase Firestore لتشغيل التطبيق بشكل صحيح.

## فهارس المجموعات

### مجموعة `referrals`

1. فهرس مركب للاستعلام عن الإحالات حسب المحيل وتاريخ الإنشاء:
   - الحقول: `referrerId` (تصاعدي), `createdAt` (تنازلي)
   - الرابط: https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVmZXJyYWxzL2luZGV4ZXMvXxABGg4KCnJlZmVycmVySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC

2. فهرس مركب للاستعلام عن الإحالات حسب المحال إليه ومستوى الإحالة:
   - الحقول: `referredId` (تصاعدي), `level` (تصاعدي)
   - الرابط: https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVmZXJyYWxzL2luZGV4ZXMvXxABGg0KCXJlZmVycmVkSWQQARoKCgZsZXZlbBABGgwKCF9fbmFtZV9fEAI

### مجموعة `userTaskStatus`

1. فهرس مركب للاستعلام عن حالة المهام حسب المستخدم والمهمة:
   - الحقول: `userId` (تصاعدي), `taskId` (تصاعدي)
   - الرابط: https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdXNlclRhc2tTdGF0dXMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCgoGdGFza0lkEAEaDAoIX19uYW1lX18QAg

### مجموعة `transactions`

1. فهرس مركب للاستعلام عن المعاملات حسب المستخدم والنوع والتاريخ:
   - الحقول: `userId` (تصاعدي), `type` (تصاعدي), `timestamp` (تنازلي)
   - الرابط: https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdHJhbnNhY3Rpb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGggKBHR5cGUQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC

## كيفية إنشاء الفهارس

1. انقر على الروابط المذكورة أعلاه لإنشاء الفهارس المطلوبة.
2. قم بتسجيل الدخول إلى حساب Firebase الخاص بك.
3. انقر على زر "إنشاء الفهرس" (Create Index).
4. انتظر حتى يتم إنشاء الفهرس (قد يستغرق هذا بضع دقائق).

## ملاحظات

- يجب إنشاء هذه الفهارس قبل نشر التطبيق في بيئة الإنتاج.
- إذا واجهت خطأ "The query requires an index"، فهذا يعني أنك بحاجة إلى إنشاء فهرس جديد. انقر على الرابط المقدم في رسالة الخطأ لإنشاء الفهرس المطلوب.
