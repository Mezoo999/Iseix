# تعليمات نشر منصة Iseix

## الخيار الأول: النشر على Vercel (الموصى به)

### الخطوات:

1. قم بإنشاء حساب على [Vercel](https://vercel.com) إذا لم يكن لديك حساب بالفعل.

2. قم بتثبيت Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. قم بتسجيل الدخول:
   ```bash
   vercel login
   ```

4. قم بنشر المشروع:
   ```bash
   vercel
   ```
   أو
   ```bash
   npm run deploy:vercel
   ```

5. اتبع التعليمات على الشاشة لإكمال عملية النشر.

6. بعد الانتهاء، ستحصل على رابط للموقع المنشور (مثل `https://iseix.vercel.app`).

### مزايا النشر على Vercel:
- يدعم Next.js بشكل ممتاز
- يوفر نطاقات فرعية مجانية
- يدعم النشر التلقائي من GitHub
- يوفر شهادات SSL مجانية
- يوفر تحليلات أساسية للموقع

## الخيار الثاني: النشر على Firebase Hosting

### الخطوات:

1. قم ببناء المشروع:
   ```bash
   npm run build
   ```
   
   هذا سينشئ مجلد `out` يحتوي على موقع ثابت.

2. قم بنشر الموقع على Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
   أو
   ```bash
   npm run deploy:firebase
   ```

3. بعد الانتهاء، ستحصل على رابط للموقع المنشور (مثل `https://iseix-15880.web.app`).

## إعداد فهارس Firebase

قبل النشر، تأكد من إنشاء جميع فهارس Firebase المطلوبة:

1. فهارس مجموعة `referrals`:
   - [فهرس referrerId + createdAt](https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVmZXJyYWxzL2luZGV4ZXMvXxABGg4KCnJlZmVycmVySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)
   - [فهرس referredId + level](https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVmZXJyYWxzL2luZGV4ZXMvXxABGg0KCXJlZmVycmVkSWQQARoKCgZsZXZlbBABGgwKCF9fbmFtZV9fEAI)

2. فهرس مجموعة `userTaskStatus`:
   - [فهرس userId + taskId](https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdXNlclRhc2tTdGF0dXMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCgoGdGFza0lkEAEaDAoIX19uYW1lX18QAg)

3. فهرس مجموعة `transactions`:
   - [فهرس userId + type + timestamp](https://console.firebase.google.com/v1/r/project/iseix-15880/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9pc2VpeC0xNTg4MC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdHJhbnNhY3Rpb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGggKBHR5cGUQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC)

## بعد النشر

1. قم بإعداد حساب المشرف:
   - قم بتسجيل الدخول إلى المنصة باستخدام حساب البريد الإلكتروني الذي تريد جعله مشرفًا.
   - انتقل إلى صفحة `/admin/make-me-owner` لتعيين الحساب كمالك للمنصة.

2. قم بتحديث مستويات العضوية:
   - انتقل إلى صفحة `/admin/update-membership` لتحديث مستويات العضوية لجميع المستخدمين.

3. قم بإعداد المحتوى الأولي:
   - قم بإنشاء بعض المستخدمين التجريبيين (اختياري).
   - قم بإعداد أي محتوى افتراضي مطلوب للمنصة.

## ملاحظات هامة

- تأكد من إنشاء جميع فهارس Firebase المطلوبة قبل النشر.
- تأكد من تكوين متغيرات البيئة بشكل صحيح في ملف `.env.production`.
- إذا واجهت أي مشاكل في النشر، تحقق من سجلات الخطأ وتأكد من أن جميع التبعيات مثبتة بشكل صحيح.
- لاحظ أن بعض الميزات مثل Firebase Functions غير متاحة في الخطة المجانية من Firebase. لذلك تم تعديل المشروع لاستخدام Vercel Serverless Functions بدلاً من ذلك.
