import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// خطط الاستثمار الافتراضية
const defaultPlans = [
  {
    name: 'الخطة الأساسية',
    description: 'خطة استثمارية مثالية للمبتدئين',
    minAmount: 100,
    maxAmount: 1000,
    duration: 30, // بالأيام
    returnRate: 15, // نسبة العائد الإجمالي
    dailyReturnRate: 0.5, // نسبة العائد اليومي
    isActive: true,
    features: [
      'عائد يومي 0.5%',
      'إجمالي العائد 15%',
      'مدة الاستثمار 30 يوم',
      'سحب الأرباح في أي وقت',
      'دعم فني على مدار الساعة',
    ],
  },
  {
    name: 'الخطة المتقدمة',
    description: 'خطة استثمارية للمستثمرين ذوي الخبرة',
    minAmount: 1000,
    maxAmount: 5000,
    duration: 60, // بالأيام
    returnRate: 36, // نسبة العائد الإجمالي
    dailyReturnRate: 0.6, // نسبة العائد اليومي
    isActive: true,
    features: [
      'عائد يومي 0.6%',
      'إجمالي العائد 36%',
      'مدة الاستثمار 60 يوم',
      'سحب الأرباح في أي وقت',
      'دعم فني على مدار الساعة',
      'تحليلات مفصلة للاستثمار',
    ],
  },
  {
    name: 'الخطة الاحترافية',
    description: 'خطة استثمارية للمستثمرين المحترفين',
    minAmount: 5000,
    maxAmount: 50000,
    duration: 90, // بالأيام
    returnRate: 63, // نسبة العائد الإجمالي
    dailyReturnRate: 0.7, // نسبة العائد اليومي
    isActive: true,
    features: [
      'عائد يومي 0.7%',
      'إجمالي العائد 63%',
      'مدة الاستثمار 90 يوم',
      'سحب الأرباح في أي وقت',
      'دعم فني على مدار الساعة',
      'تحليلات مفصلة للاستثمار',
      'مدير حساب شخصي',
      'أولوية في السحب',
    ],
  },
];

// إنشاء خطط الاستثمار
export const createInvestmentPlans = async () => {
  try {
    // التحقق من وجود خطط استثمار
    const plansQuery = query(collection(db, 'investmentPlans'), where('isActive', '==', true));
    const plansSnapshot = await getDocs(plansQuery);
    
    if (!plansSnapshot.empty) {
      console.log('Investment plans already exist');
      return;
    }
    
    // إنشاء خطط الاستثمار
    for (const plan of defaultPlans) {
      await addDoc(collection(db, 'investmentPlans'), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log('Investment plans created successfully');
  } catch (error) {
    console.error('Error creating investment plans:', error);
  }
};

// تنفيذ الدالة
createInvestmentPlans();
