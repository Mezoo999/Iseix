'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChartLine, FaInfoCircle, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowRight } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInvestments, calculateInvestmentProfit, cancelInvestment, UserInvestment } from '@/services/investment';

export default function MyInvestmentsPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  // جلب استثمارات المستخدم
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        if (!currentUser) return;
        
        const userInvestments = await getUserInvestments(currentUser.uid);
        setInvestments(userInvestments);
        
        // حساب الأرباح لجميع الاستثمارات النشطة
        for (const investment of userInvestments) {
          if (investment.status === 'active' && investment.id) {
            await calculateInvestmentProfit(investment.id);
          }
        }
        
        // إعادة جلب الاستثمارات بعد حساب الأرباح
        const updatedInvestments = await getUserInvestments(currentUser.uid);
        setInvestments(updatedInvestments);
      } catch (err) {
        console.error('Error fetching investments:', err);
        setError('حدث خطأ أثناء جلب الاستثمارات');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchInvestments();
    }
  }, [currentUser]);
  
  // إلغاء استثمار
  const handleCancelInvestment = async (investmentId: string) => {
    if (!currentUser) return;
    
    if (!confirm('هل أنت متأكد من إلغاء هذا الاستثمار؟ سيتم خصم رسوم الإلغاء (5%).')) {
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      await cancelInvestment(investmentId);
      
      setSuccess('تم إلغاء الاستثمار بنجاح');
      
      // إعادة جلب الاستثمارات
      const updatedInvestments = await getUserInvestments(currentUser.uid);
      setInvestments(updatedInvestments);
    } catch (err) {
      console.error('Error cancelling investment:', err);
      setError('حدث خطأ أثناء إلغاء الاستثمار');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // حساب نسبة التقدم
  const calculateProgress = (investment: UserInvestment) => {
    if (!investment.startDate || !investment.endDate) return 0;
    
    const startDate = investment.startDate.toDate();
    const endDate = investment.endDate.toDate();
    const now = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    let progress = (elapsed / totalDuration) * 100;
    
    // التأكد من أن التقدم بين 0 و 100
    progress = Math.max(0, Math.min(100, progress));
    
    return progress;
  };
  
  // تنسيق التاريخ
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-EG');
  };
  
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
          
          {success && (
            <motion.div
              className="bg-success/20 text-success p-4 rounded-lg mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <FaCheckCircle className="inline ml-2" />
              {success}
            </motion.div>
          )}
          
          {investments.length === 0 ? (
            <motion.div
              className="glass-effect p-8 rounded-xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FaInfoCircle className="text-4xl mx-auto mb-4 text-foreground-muted" />
              <h2 className="text-xl font-bold mb-2">لا توجد استثمارات حالية</h2>
              <p className="text-foreground-muted mb-6">
                لم تقم بإنشاء أي استثمارات بعد. ابدأ الاستثمار الآن للحصول على عوائد مجزية.
              </p>
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/investment/plans')}
              >
                استكشف خطط الاستثمار
                <FaArrowRight className="mr-2" />
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {investments.map((investment, index) => (
                <motion.div
                  key={investment.id}
                  className="glass-effect p-6 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="p-3 rounded-full bg-primary/10 mr-4">
                        <FaChartLine className="text-primary text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{investment.planName}</h3>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2
                            ${investment.status === 'active' ? 'bg-success/20 text-success' : 
                              investment.status === 'completed' ? 'bg-info/20 text-info' : 
                              'bg-error/20 text-error'}`}
                          >
                            {investment.status === 'active' ? (
                              <><FaCheckCircle className="ml-1" /> نشط</>
                            ) : investment.status === 'completed' ? (
                              <><FaCheckCircle className="ml-1" /> مكتمل</>
                            ) : (
                              <><FaTimesCircle className="ml-1" /> ملغي</>
                            )}
                          </span>
                          <span className="text-foreground-muted text-sm">
                            تاريخ البدء: {formatDate(investment.startDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-2xl font-bold">
                        {investment.amount.toFixed(2)} {investment.currency}
                      </div>
                      <div className="text-success">
                        +{investment.currentReturn.toFixed(2)} {investment.currency} (الربح الحالي)
                      </div>
                    </div>
                  </div>
                  
                  {investment.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-foreground-muted">التقدم</span>
                        <span className="text-sm">{Math.min(100, Math.round(calculateProgress(investment)))}%</span>
                      </div>
                      <div className="w-full bg-background-light rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, calculateProgress(investment))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-foreground-muted text-sm">المبلغ المستثمر</div>
                      <div className="font-bold">{investment.amount.toFixed(2)} {investment.currency}</div>
                    </div>
                    <div>
                      <div className="text-foreground-muted text-sm">العائد اليومي</div>
                      <div className="font-bold text-success">{investment.dailyReturnRate}%</div>
                    </div>
                    <div>
                      <div className="text-foreground-muted text-sm">إجمالي العائد</div>
                      <div className="font-bold text-success">{investment.returnRate}%</div>
                    </div>
                    <div>
                      <div className="text-foreground-muted text-sm">تاريخ الانتهاء</div>
                      <div className="font-bold">{formatDate(investment.endDate)}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-foreground-muted text-sm">العائد المتوقع</div>
                      <div className="font-bold text-success">{investment.totalReturn.toFixed(2)} {investment.currency}</div>
                    </div>
                    
                    {investment.status === 'active' && (
                      <motion.button
                        className="btn btn-outline btn-sm text-error border-error hover:bg-error hover:text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCancelInvestment(investment.id!)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <FaSpinner className="animate-spin ml-1" />
                            جاري الإلغاء...
                          </span>
                        ) : (
                          'إلغاء الاستثمار'
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {investments.length > 0 && (
            <div className="mt-8 text-center">
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/investment/plans')}
              >
                إنشاء استثمار جديد
                <FaArrowRight className="mr-2" />
              </motion.button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}
