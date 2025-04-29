/**
 * ملف تكوين لتمكين/تعطيل ميزات معينة في التطبيق
 * يمكن استخدامه لتشخيص المشاكل وتحسين الأداء
 */

const features = {
  // الخلفية المتحركة
  animatedBackground: true,
  
  // الإشعارات الذكية
  smartNotifications: true,
  
  // تأثيرات الحركة
  animations: true,
  
  // تتبع المستخدم
  userTracking: true,
  
  // تحميل البيانات في الخلفية
  backgroundDataLoading: true,
  
  // تحسينات الأداء
  performance: {
    // تقليل عدد الجسيمات في الخلفية المتحركة
    reduceParticles: false,
    
    // تقليل معدل تحديث الرسوم المتحركة
    reduceAnimationFrameRate: false,
    
    // تعطيل الرسوم المتحركة على الأجهزة المحمولة
    disableAnimationsOnMobile: true,
    
    // تعطيل الخلفية المتحركة على الأجهزة المحمولة
    disableBackgroundOnMobile: true
  }
};

export default features;
