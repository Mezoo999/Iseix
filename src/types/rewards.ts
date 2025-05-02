// أنواع المكافآت
export enum RewardType {
  REGISTRATION = 'registration', // مكافأة التسجيل
  LUCKY_WHEEL = 'lucky_wheel',   // مكافأة عجلة الحظ
}

// حالة المكافأة
export enum RewardStatus {
  PENDING = 'pending',   // قيد الانتظار
  CLAIMED = 'claimed',   // تم المطالبة بها
  EXPIRED = 'expired',   // منتهية الصلاحية
}

// واجهة المكافأة
export interface Reward {
  id: string;
  userId: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
  createdAt: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  withdrawable: boolean; // هل يمكن سحب المكافأة
}

// واجهة إعدادات عجلة الحظ
export interface LuckyWheelSettings {
  isEnabled: boolean;           // هل العجلة متاحة حاليًا
  nextAvailableDate?: Date;     // تاريخ الإتاحة التالي
  prizes: LuckyWheelPrize[];    // الجوائز المتاحة
  lastUpdated: Date;            // آخر تحديث للإعدادات
}

// واجهة جائزة عجلة الحظ
export interface LuckyWheelPrize {
  id: string;
  amount: number;
  probability: number;  // احتمالية الفوز (0-100)
  color: string;        // لون القطاع في العجلة
}

// واجهة سجل استخدام عجلة الحظ للمستخدم
export interface UserLuckyWheelHistory {
  userId: string;
  lastSpinDate?: Date;  // تاريخ آخر استخدام للعجلة
  nextAvailableDate?: Date; // تاريخ الإتاحة التالي للمستخدم
  spinCount: number;    // عدد مرات استخدام العجلة
}
