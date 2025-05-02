'use client';

import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export default function FirestoreBlockedWarning() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // التحقق مما إذا كان الاتصال بـ Firestore محظورًا
    const checkFirestoreConnection = () => {
      // استخدام صورة اختبار من Firestore
      const testImage = new Image();

      // تعيين وقت انتهاء للتحميل
      const timeout = setTimeout(() => {
        // إذا لم يتم تحميل الصورة خلال 3 ثوانٍ، فقد يكون Firestore محظورًا
        setIsBlocked(true);
      }, 3000);

      // إذا تم تحميل الصورة بنجاح، فإن Firestore غير محظور
      testImage.onload = () => {
        clearTimeout(timeout);
        setIsBlocked(false);
      };

      // إذا فشل تحميل الصورة، فقد يكون Firestore محظورًا
      testImage.onerror = () => {
        clearTimeout(timeout);
        setIsBlocked(true);
      };

      // محاولة تحميل صورة من Firestore
      testImage.src = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
    };

    // التحقق من حالة الاتصال عند تحميل المكون
    checkFirestoreConnection();

    // تنظيف عند إزالة المكون
    return () => {
      // لا شيء للتنظيف هنا
    };
  }, []);

  // إذا لم يكن هناك حظر أو تم تجاهل التحذير، لا تعرض شيئًا
  if (!isBlocked || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-warning/10 border border-warning rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start">
        <div className="p-2 rounded-full bg-warning/20 text-warning ml-3">
          <FaExclamationTriangle />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold">تحذير: قد يكون الاتصال بقاعدة البيانات محظورًا</h3>
            <button
              className="text-foreground-muted hover:text-foreground"
              onClick={() => setIsDismissed(true)}
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-sm mt-2">
            يبدو أن هناك مانع إعلانات أو امتداد متصفح يمنع الاتصال بـ Firestore. قد يؤدي ذلك إلى عدم عمل بعض ميزات المنصة بشكل صحيح.
          </p>
          <div className="mt-3 text-sm bg-background-dark/20 p-2 rounded-md">
            <p className="flex items-start">
              <FaInfoCircle className="mt-1 ml-2 text-info" />
              <span>
                للحل، يرجى تعطيل مانع الإعلانات أو إضافة استثناء للموقع في إعدادات مانع الإعلانات.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
