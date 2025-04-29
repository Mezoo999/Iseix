'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChartLine, FaInfoCircle, FaPlus, FaHistory } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ActiveInvestmentCard from '@/components/investment/ActiveInvestmentCard';
import InvestmentDetailsModal from '@/components/investment/InvestmentDetailsModal';
import { PageLoader, CircleLoader } from '@/components/ui/Loaders';
import ActionButton from '@/components/ui/ActionButton';
import { useAuth } from '@/contexts/AuthContext';
import { AlertProvider, useAlert } from '@/contexts/AlertContext';
import { getUserInvestments } from '@/services/investment';

export default function InvestmentsPage() {
  return (
    <AlertProvider>
      <InvestmentsContent />
    </AlertProvider>
  );
}

function InvestmentsContent() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [completedInvestments, setCompletedInvestments] = useState<any[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // تحميل الاستثمارات
  const loadInvestments = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const investments = await getUserInvestments(currentUser.uid);
      
      // فصل الاستثمارات النشطة عن المكتملة
      const active = investments.filter(inv => inv.status === 'active');
      const completed = investments.filter(inv => inv.status === 'completed');
      
      setActiveInvestments(active);
      setCompletedInvestments(completed);
    } catch (error) {
      console.error('Error loading investments:', error);
      showAlert('error', 'حدث خطأ أثناء تحميل الاستثمارات');
    } finally {
      setIsLoading(false);
    }
  };
  
  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    if (!loading && currentUser) {
      loadInvestments();
    }
  }, [loading, currentUser]);
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  // عرض تفاصيل الاستثمار
  const handleViewDetails = (id: string) => {
    const investment = [...activeInvestments, ...completedInvestments].find(inv => inv.id === id);
    if (investment) {
      setSelectedInvestment(investment);
      setIsModalOpen(true);
    }
  };
  
  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }
  
  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }
  
  // بيانات الاستثمار الافتراضية للعرض
  const dummyInvestments = [
    {
      id: '1',
      planName: 'خطة المبتدئين',
      amount: 500,
      currency: 'USDT',
      dailyProfitRate: 2.5,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // قبل 10 أيام
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // بعد 20 يومًا
      duration: 30,
      totalProfit: 375,
      accumulatedProfit: 125,
      status: 'active',
      profitHistory: [
        { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), amount: 12.5 },
        { date: new Date(), amount: 12.5 }
      ]
    },
    {
      id: '2',
      planName: 'خطة المحترفين',
      amount: 1000,
      currency: 'USDT',
      dailyProfitRate: 3.5,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // قبل 15 يومًا
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // بعد 45 يومًا
      duration: 60,
      totalProfit: 2100,
      accumulatedProfit: 525,
      status: 'active',
      profitHistory: [
        { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), amount: 35 },
        { date: new Date(), amount: 35 }
      ]
    }
  ];
  
  // استخدام البيانات الافتراضية إذا لم تكن هناك استثمارات
  const displayActiveInvestments = activeInvestments.length > 0 ? activeInvestments : dummyInvestments;
  const displayCompletedInvestments = completedInvestments.length > 0 ? completedInvestments : [];
  
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
              استثماراتي
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              إدارة استثماراتك ومتابعة أرباحك
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
              <p className="font-bold mb-1">معلومات الاستثمار</p>
              <p className="text-sm">
                يتم إضافة الأرباح اليومية تلقائيًا إلى رصيدك كل 24 ساعة من وقت الاستثمار.
                يمكنك متابعة تفاصيل استثماراتك وأرباحك من هذه الصفحة.
              </p>
            </div>
          </motion.div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">الاستثمارات النشطة</h2>
            <ActionButton
              variant="primary"
              onClick={() => router.push('/investment')}
              icon={<FaPlus />}
            >
              استثمار جديد
            </ActionButton>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <CircleLoader color="primary" size="md" />
            </div>
          ) : displayActiveInvestments.length === 0 ? (
            <motion.div
              className="bg-background-light rounded-xl p-12 text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <FaChartLine className="text-primary text-5xl mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">لا توجد استثمارات نشطة</h3>
              <p className="text-foreground-muted mb-6">
                ابدأ رحلتك الاستثمارية الآن واستفد من خططنا المتنوعة
              </p>
              <ActionButton
                variant="primary"
                onClick={() => router.push('/investment')}
              >
                استثمر الآن
              </ActionButton>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayActiveInvestments.map((investment, index) => (
                <ActiveInvestmentCard
                  key={investment.id}
                  id={investment.id}
                  planName={investment.planName}
                  amount={investment.amount}
                  currency={investment.currency}
                  dailyProfitRate={investment.dailyProfitRate}
                  startDate={new Date(investment.startDate)}
                  endDate={new Date(investment.endDate)}
                  totalProfit={investment.totalProfit}
                  accumulatedProfit={investment.accumulatedProfit}
                  status={investment.status}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
          
          {displayCompletedInvestments.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">الاستثمارات المكتملة</h2>
                <ActionButton
                  variant="secondary"
                  onClick={() => router.push('/transactions')}
                  icon={<FaHistory />}
                >
                  سجل المعاملات
                </ActionButton>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCompletedInvestments.map((investment, index) => (
                  <ActiveInvestmentCard
                    key={investment.id}
                    id={investment.id}
                    planName={investment.planName}
                    amount={investment.amount}
                    currency={investment.currency}
                    dailyProfitRate={investment.dailyProfitRate}
                    startDate={new Date(investment.startDate)}
                    endDate={new Date(investment.endDate)}
                    totalProfit={investment.totalProfit}
                    accumulatedProfit={investment.accumulatedProfit}
                    status={investment.status}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      
      <InvestmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        investment={selectedInvestment}
      />
      
      <Footer />
    </>
  );
}
