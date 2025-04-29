'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChartLine, FaCheck, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InvestmentBenefits from '@/components/investment/InvestmentBenefits';
import { useAuth } from '@/contexts/AuthContext';
import { getInvestmentPlans, InvestmentPlan } from '@/services/investment';

export default function InvestmentPlansPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب خطط الاستثمار
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const investmentPlans = await getInvestmentPlans();
        setPlans(investmentPlans);
      } catch (err) {
        console.error('Error fetching investment plans:', err);
        setError('حدث خطأ أثناء جلب خطط الاستثمار');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchPlans();
    }
  }, [currentUser]);

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser) {
    return null;
  }

  // إذا لم تكن هناك خطط استثمار
  if (plans.length === 0 && !isLoading) {
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
                اختر خطة الاستثمار المناسبة لك
              </motion.p>
            </div>

            {error ? (
              <motion.div
                className="bg-error/20 text-error p-4 rounded-lg mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <FaInfoCircle className="inline ml-2" />
                {error}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <FaInfoCircle className="text-4xl mx-auto mb-4 text-foreground-muted" />
                <h2 className="text-xl font-bold mb-2">لا توجد خطط استثمار متاحة حاليًا</h2>
                <p className="text-foreground-muted mb-6">
                  يرجى المحاولة مرة أخرى لاحقًا أو التواصل مع فريق الدعم
                </p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
              اختر خطة الاستثمار المناسبة لك
            </motion.p>
          </div>

          {error && (
            <motion.div
              className="bg-error/20 text-error p-4 rounded-lg mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <FaInfoCircle className="inline ml-2" />
              {error}
            </motion.div>
          )}

          {/* مميزات الاستثمار */}
          <InvestmentBenefits />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className="glass-effect p-6 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-full bg-primary/10 mr-4">
                    <FaChartLine className="text-primary text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-foreground-muted">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground-muted">العائد اليومي</span>
                    <span className="font-bold text-success">{plan.dailyReturnRate}%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground-muted">إجمالي العائد</span>
                    <span className="font-bold text-success">{plan.returnRate}%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground-muted">المدة</span>
                    <span className="font-bold">{plan.duration} يوم</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground-muted">الحد الأدنى</span>
                    <span className="font-bold">${plan.minAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">الحد الأقصى</span>
                    <span className="font-bold">${plan.maxAmount}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold mb-2">المميزات</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <FaCheck className="text-success mt-1 ml-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium transition-colors hover:bg-primary-dark flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/investment/invest?planId=${plan.id}`)}
                >
                  استثمر الآن
                  <FaArrowRight className="mr-2" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
