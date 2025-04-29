'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChartLine, FaInfoCircle } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InvestmentPlanCard from '@/components/investment/InvestmentPlanCard';
import { PageLoader } from '@/components/ui/Loaders';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { getInvestmentPlans, createInvestment } from '@/services/investment';

export default function InvestmentPlansPage() {
  return (
    <AlertProvider>
      <InvestmentPlansContent />
    </AlertProvider>
  );
}

function InvestmentPlansContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  
  // تحميل خطط الاستثمار
  const loadInvestmentPlans = async () => {
    setIsLoading(true);
    try {
      const investmentPlans = await getInvestmentPlans();
      setPlans(investmentPlans);
    } catch (error) {
      console.error('Error loading investment plans:', error);
      showAlert('error', 'حدث خطأ أثناء تحميل خطط الاستثمار');
    } finally {
      setIsLoading(false);
    }
  };
  
  // إنشاء استثمار جديد
  const handleInvest = async (planId: string, amount: number) => {
    if (!currentUser) {
      showAlert('warning', 'يرجى تسجيل الدخول للاستثمار');
      router.push('/login');
      return;
    }
    
    // التحقق من الرصيد
    const balance = userData?.balances?.USDT || 0;
    if (balance < amount) {
      showAlert('error', 'رصيدك غير كافٍ لهذا الاستثمار');
      return;
    }
    
    try {
      await createInvestment(currentUser.uid, planId, amount);
      showAlert('success', 'تم إنشاء الاستثمار بنجاح');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating investment:', error);
      showAlert('error', 'حدث خطأ أثناء إنشاء الاستثمار');
    }
  };
  
  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    if (!loading) {
      loadInvestmentPlans();
    }
  }, [loading]);
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isLoading) {
    return <PageLoader />;
  }
  
  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }
  
  // إذا لم تكن هناك خطط استثمار
  if (plans.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <FaChartLine className="text-primary text-5xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">لا توجد خطط استثمار متاحة حاليًا</h2>
              <p className="text-foreground-muted mb-6">يرجى المحاولة مرة أخرى لاحقًا</p>
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
              >
                العودة إلى لوحة التحكم
              </motion.button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // خطط الاستثمار الافتراضية إذا لم يتم تحميل الخطط من قاعدة البيانات
  const defaultPlans = [
    {
      id: 'plan1',
      name: 'خطة المبتدئين',
      description: 'خطة استثمارية مثالية للمبتدئين',
      minAmount: 100,
      maxAmount: 1000,
      dailyProfitRate: 2.5,
      duration: 30,
      features: [
        'سحب الأرباح يوميًا',
        'دعم فني على مدار الساعة',
        'إعادة استثمار تلقائي (اختياري)'
      ],
      isActive: true
    },
    {
      id: 'plan2',
      name: 'خطة المحترفين',
      description: 'خطة استثمارية للمستثمرين المحترفين',
      minAmount: 1000,
      maxAmount: 10000,
      dailyProfitRate: 3.5,
      duration: 60,
      features: [
        'سحب الأرباح يوميًا',
        'دعم فني على مدار الساعة',
        'إعادة استثمار تلقائي (اختياري)',
        'تحليلات متقدمة للاستثمار'
      ],
      isActive: true,
      isPopular: true
    },
    {
      id: 'plan3',
      name: 'خطة VIP',
      description: 'خطة استثمارية حصرية لكبار المستثمرين',
      minAmount: 10000,
      maxAmount: 100000,
      dailyProfitRate: 4.5,
      duration: 90,
      features: [
        'سحب الأرباح يوميًا',
        'دعم فني على مدار الساعة',
        'إعادة استثمار تلقائي (اختياري)',
        'تحليلات متقدمة للاستثمار',
        'مدير حساب شخصي',
        'أولوية السحب'
      ],
      isActive: true
    }
  ];
  
  // استخدام الخطط الافتراضية إذا لم يتم تحميل الخطط من قاعدة البيانات
  const displayPlans = plans.length > 0 ? plans : defaultPlans;
  
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <motion.h1
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              خطط الاستثمار
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              اختر خطة الاستثمار المناسبة لك وابدأ في تحقيق الأرباح
            </motion.p>
          </div>
          
          <motion.div
            className="bg-info/10 border border-info/30 text-info p-4 rounded-lg mb-8 flex items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FaInfoCircle className="mt-1 ml-3 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">معلومات هامة</p>
              <p className="text-sm">
                جميع الاستثمارات تخضع لشروط وأحكام المنصة. يرجى قراءة الشروط والأحكام قبل الاستثمار.
                الأرباح اليومية يتم إضافتها تلقائيًا إلى رصيدك كل 24 ساعة من وقت الاستثمار.
              </p>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayPlans.map((plan, index) => (
              <InvestmentPlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                minAmount={plan.minAmount}
                maxAmount={plan.maxAmount}
                dailyProfitRate={plan.dailyProfitRate}
                duration={plan.duration}
                features={plan.features}
                isPopular={plan.isPopular}
                onInvest={handleInvest}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
