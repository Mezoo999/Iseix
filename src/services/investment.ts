import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';

// واجهة خطة الاستثمار
export interface InvestmentPlan {
  id?: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  duration: number; // بالأيام
  returnRate: number; // نسبة العائد الإجمالي
  dailyReturnRate: number; // نسبة العائد اليومي
  isActive: boolean;
  features: string[];
  createdAt?: any;
  updatedAt?: any;
}

// واجهة استثمار المستخدم
export interface UserInvestment {
  id?: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  startDate: any;
  endDate: any;
  duration: number;
  returnRate: number;
  dailyReturnRate: number;
  totalReturn: number;
  currentReturn: number;
  status: 'active' | 'completed' | 'cancelled';
  lastProfitDate?: any;
  createdAt?: any;
  updatedAt?: any;
}

// الحصول على جميع خطط الاستثمار
export const getInvestmentPlans = async (): Promise<InvestmentPlan[]> => {
  try {
    const plansQuery = query(
      collection(db, 'investmentPlans'),
      where('isActive', '==', true),
      orderBy('minAmount', 'asc')
    );
    
    const plansSnapshot = await getDocs(plansQuery);
    
    return plansSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentPlan[];
  } catch (error) {
    console.error('Error getting investment plans:', error);
    throw error;
  }
};

// الحصول على خطة استثمار محددة
export const getInvestmentPlan = async (planId: string): Promise<InvestmentPlan | null> => {
  try {
    const planDoc = await getDoc(doc(db, 'investmentPlans', planId));
    
    if (planDoc.exists()) {
      return {
        id: planDoc.id,
        ...planDoc.data(),
      } as InvestmentPlan;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting investment plan:', error);
    throw error;
  }
};

// إنشاء استثمار جديد
export const createInvestment = async (
  userId: string,
  planId: string,
  amount: number,
  currency: string = 'USDT'
): Promise<string> => {
  try {
    // الحصول على خطة الاستثمار
    const plan = await getInvestmentPlan(planId);
    if (!plan) throw new Error('Investment plan not found');
    
    // التحقق من المبلغ
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      throw new Error(`Investment amount must be between ${plan.minAmount} and ${plan.maxAmount}`);
    }
    
    // حساب تاريخ البدء والانتهاء
    const startDate = Timestamp.now();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);
    
    // حساب العائد الإجمالي
    const totalReturn = amount * (1 + plan.returnRate / 100);
    
    // إنشاء استثمار جديد
    const investmentData: Omit<UserInvestment, 'id'> = {
      userId,
      planId,
      planName: plan.name,
      amount,
      currency,
      startDate,
      endDate: Timestamp.fromDate(endDate),
      duration: plan.duration,
      returnRate: plan.returnRate,
      dailyReturnRate: plan.dailyReturnRate,
      totalReturn,
      currentReturn: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // إضافة الاستثمار إلى Firestore
    const investmentRef = await addDoc(collection(db, 'investments'), investmentData);
    
    // إنشاء معاملة استثمار
    await createTransaction({
      userId,
      type: 'investment',
      amount,
      currency,
      status: 'completed',
      description: `استثمار في خطة ${plan.name}`,
      metadata: {
        planId,
        investmentId: investmentRef.id,
      },
    });
    
    // تحديث رصيد المستخدم
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`balances.${currency}`]: increment(-amount),
      totalInvested: increment(amount),
      updatedAt: serverTimestamp(),
    });
    
    return investmentRef.id;
  } catch (error) {
    console.error('Error creating investment:', error);
    throw error;
  }
};

// الحصول على استثمارات المستخدم
export const getUserInvestments = async (userId: string): Promise<UserInvestment[]> => {
  try {
    const investmentsQuery = query(
      collection(db, 'investments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const investmentsSnapshot = await getDocs(investmentsQuery);
    
    return investmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserInvestment[];
  } catch (error) {
    console.error('Error getting user investments:', error);
    throw error;
  }
};

// حساب أرباح الاستثمار
export const calculateInvestmentProfit = async (investmentId: string): Promise<number> => {
  try {
    // الحصول على الاستثمار
    const investmentDoc = await getDoc(doc(db, 'investments', investmentId));
    
    if (!investmentDoc.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentDoc.data() as UserInvestment;
    
    // التحقق من حالة الاستثمار
    if (investment.status !== 'active') {
      return 0;
    }
    
    // الحصول على تاريخ آخر حساب للأرباح
    const lastProfitDate = investment.lastProfitDate 
      ? investment.lastProfitDate.toDate() 
      : investment.startDate.toDate();
    
    // حساب عدد الأيام منذ آخر حساب للأرباح
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastProfitDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // إذا لم يمر يوم كامل، لا يوجد ربح جديد
    if (diffDays === 0) {
      return 0;
    }
    
    // حساب الربح اليومي
    const dailyProfit = investment.amount * (investment.dailyReturnRate / 100);
    
    // حساب الربح الإجمالي
    const profit = dailyProfit * diffDays;
    
    // تحديث الاستثمار
    await updateDoc(doc(db, 'investments', investmentId), {
      currentReturn: increment(profit),
      lastProfitDate: Timestamp.now(),
      updatedAt: serverTimestamp(),
    });
    
    // إذا انتهت مدة الاستثمار، قم بتحديث حالته
    const endDate = investment.endDate.toDate();
    if (now >= endDate) {
      await updateDoc(doc(db, 'investments', investmentId), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      
      // إضافة الربح والمبلغ الأصلي إلى رصيد المستخدم
      const userRef = doc(db, 'users', investment.userId);
      await updateDoc(userRef, {
        [`balances.${investment.currency}`]: increment(investment.totalReturn),
        totalProfit: increment(investment.totalReturn - investment.amount),
        updatedAt: serverTimestamp(),
      });
      
      // إنشاء معاملة ربح
      await createTransaction({
        userId: investment.userId,
        type: 'profit',
        amount: investment.totalReturn - investment.amount,
        currency: investment.currency,
        status: 'completed',
        description: `ربح من خطة ${investment.planName}`,
        metadata: {
          planId: investment.planId,
          investmentId,
        },
      });
    }
    
    return profit;
  } catch (error) {
    console.error('Error calculating investment profit:', error);
    throw error;
  }
};

// إلغاء استثمار
export const cancelInvestment = async (investmentId: string): Promise<void> => {
  try {
    // الحصول على الاستثمار
    const investmentDoc = await getDoc(doc(db, 'investments', investmentId));
    
    if (!investmentDoc.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentDoc.data() as UserInvestment;
    
    // التحقق من حالة الاستثمار
    if (investment.status !== 'active') {
      throw new Error('Investment is not active');
    }
    
    // حساب المبلغ المسترد (المبلغ الأصلي - رسوم الإلغاء)
    const cancellationFee = investment.amount * 0.05; // 5% رسوم إلغاء
    const refundAmount = investment.amount - cancellationFee;
    
    // تحديث حالة الاستثمار
    await updateDoc(doc(db, 'investments', investmentId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    
    // إعادة المبلغ المسترد إلى رصيد المستخدم
    const userRef = doc(db, 'users', investment.userId);
    await updateDoc(userRef, {
      [`balances.${investment.currency}`]: increment(refundAmount),
      updatedAt: serverTimestamp(),
    });
    
    // إنشاء معاملة استرداد
    await createTransaction({
      userId: investment.userId,
      type: 'withdrawal',
      amount: refundAmount,
      currency: investment.currency,
      status: 'completed',
      description: `استرداد من خطة ${investment.planName} (مع خصم رسوم الإلغاء)`,
      metadata: {
        planId: investment.planId,
        investmentId,
        cancellationFee,
      },
    });
  } catch (error) {
    console.error('Error cancelling investment:', error);
    throw error;
  }
};
