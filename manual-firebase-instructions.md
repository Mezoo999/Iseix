# تعليمات تعديل بيانات المستخدم يدويًا في Firebase

إذا كنت تواجه مشكلة في تنفيذ الكود، يمكنك تعديل بيانات المستخدم يدويًا من خلال واجهة Firebase. إليك الخطوات:

## الخطوة 1: الوصول إلى Firebase Console

1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك من القائمة

## الخطوة 2: الوصول إلى Firestore Database

1. من القائمة الجانبية، انقر على "Firestore Database"
2. انقر على تبويب "Data"

## الخطوة 3: البحث عن وثيقة المستخدم

1. ابحث عن مجموعة "users" في قائمة المجموعات
2. انقر على مجموعة "users" لعرض الوثائق
3. ابحث عن وثيقة المستخدم بمعرف `PAeCtT8GNoYwRTiLM1CjYL59a3J3`
   - إذا لم تجد الوثيقة، انقر على "Add document" لإنشاء وثيقة جديدة
   - أدخل `PAeCtT8GNoYwRTiLM1CjYL59a3J3` كمعرف للوثيقة

## الخطوة 4: تعديل بيانات المستخدم

إذا كانت الوثيقة موجودة، انقر عليها لفتحها ثم:

1. قم بتعديل الحقول التالية:
   - `isAdmin`: قم بتعيينه إلى `true` (نوع boolean)
   - `isOwner`: قم بتعيينه إلى `true` (نوع boolean)
   - `balances.USDT`: قم بتعيينه إلى `100000` (نوع number)
   - `totalDeposited`: قم بتعيينه إلى `100000` (نوع number)

إذا كنت تنشئ وثيقة جديدة، أضف الحقول التالية:

```
uid: "PAeCtT8GNoYwRTiLM1CjYL59a3J3" (نوع string)
email: "admin@iseix.com" (نوع string)
displayName: "مدير المنصة" (نوع string)
isAdmin: true (نوع boolean)
isOwner: true (نوع boolean)
balances: {
  USDT: 100000 (نوع number)
}
totalInvested: 0 (نوع number)
totalProfit: 0 (نوع number)
totalDeposited: 100000 (نوع number)
totalWithdrawn: 0 (نوع number)
totalReferrals: 0 (نوع number)
totalReferralEarnings: 0 (نوع number)
referralCode: "ABCD1234" (نوع string - يمكنك إدخال أي رمز من 8 أحرف)
referredBy: null
emailVerified: true (نوع boolean)
createdAt: (اختر نوع timestamp واترك القيمة الافتراضية)
updatedAt: (اختر نوع timestamp واترك القيمة الافتراضية)
```

## الخطوة 5: حفظ التغييرات

1. انقر على زر "Update" أو "Save" لحفظ التغييرات
2. تحقق من أن البيانات قد تم تحديثها بنجاح

## الخطوة 6: تسجيل الخروج وإعادة تسجيل الدخول

بعد تعديل البيانات، قم بتسجيل الخروج من التطبيق وإعادة تسجيل الدخول لتحديث البيانات في الجلسة الحالية.
