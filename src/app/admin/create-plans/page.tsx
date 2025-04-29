'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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

export default function CreatePlansPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // إنشاء خطط الاستثمار
  const createInvestmentPlans = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // التحقق من وجود خطط استثمار
      const plansQuery = query(collection(db, 'investmentPlans'), where('isActive', '==', true));
      const plansSnapshot = await getDocs(plansQuery);
      
      if (!plansSnapshot.empty) {
        setMessage('خطط الاستثمار موجودة بالفعل');
        setIsLoading(false);
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
      
      setMessage('تم إنشاء خطط الاستثمار بنجاح');
    } catch (error) {
      console.error('Error creating investment plans:', error);
      setError('حدث خطأ أثناء إنشاء خطط الاستثمار');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">إنشاء خطط الاستثمار الافتراضية</h1>
          
          {message && (
            <div className="bg-success/20 text-success p-4 rounded-lg mb-6">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">خطط الاستثمار الافتراضية</h2>
            
            <div className="space-y-4 mb-6">
              {defaultPlans.map((plan, index) => (
                <div key={index} className="bg-background-light p-4 rounded-lg">
                  <h3 className="font-bold">{plan.name}</h3>
                  <p className="text-foreground-muted">{plan.description}</p>
                  <div className="mt-2">
                    <span className="text-sm">العائد اليومي: {plan.dailyReturnRate}%</span>
                    <span className="text-sm mx-4">إجمالي العائد: {plan.returnRate}%</span>
                    <span className="text-sm">المدة: {plan.duration} يوم</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              className="btn btn-primary"
              onClick={createInvestmentPlans}
              disabled={isLoading}
            >
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء خطط الاستثمار'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
