'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChartLine, FaInfoCircle, FaArrowLeft, FaSpinner, FaCheckCircle } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { getInvestmentPlan, createInvestment, InvestmentPlan } from '@/services/investment';

export default function InvestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, userData, loading } = useAuth();
  
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // الحصول على معرف الخطة من معلمات البحث
  const planId = searchParams?.get('planId');
  
  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);
  
  // جلب تفاصيل خطة الاستثمار
  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        setError('معرف الخطة غير صالح');
        setIsLoading(false);
        return;
      }
      
      try {
        const investmentPlan = await getInvestmentPlan(planId);
        if (!investmentPlan) {
          setError('خطة الاستثمار غير موجودة');
        } else {
          setPlan(investmentPlan);
          // تعيين المبلغ الافتراضي إلى الحد الأدنى للخطة
          setAmount(investmentPlan.minAmount.toString());
        }
      } catch (err) {
        console.error('Error fetching investment plan:', err);
        setError('حدث خطأ أثناء جلب تفاصيل خطة الاستثمار');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser && planId) {
      fetchPlan();
    }
  }, [currentUser, planId]);
  
  // معالج تغيير المبلغ
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
  };
  
  // معالج الاستثمار
  const handleInvest = async () => {
    if (!currentUser || !plan) return;
    
    // التحقق من صحة المبلغ
    const investAmount = parseFloat(amount);
    if (isNaN(investAmount) || investAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    // التحقق من الحد الأدنى والأقصى
    if (investAmount < plan.minAmount || investAmount > plan.maxAmount) {
      setError(`يجب أن يكون المبلغ بين ${plan.minAmount} و ${plan.maxAmount}`);
      return;
    }
    
    // التحقق من الرصيد
    const balance = userData?.balances?.[currency] || 0;
    if (investAmount > balance) {
      setError('الرصيد غير كافٍ');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      // إنشاء استثمار جديد
      await createInvestment(currentUser.uid, plan.id!, investAmount, currency);
      
      setSuccess('تم إنشاء الاستثمار بنجاح');
      
      // الانتقال إلى صفحة استثماراتي بعد 2 ثانية
      setTimeout(() => {
        router.push('/investment/my-investments');
      }, 2000);
    } catch (err) {
      console.error('Error creating investment:', err);
      setError('حدث خطأ أثناء إنشاء الاستثمار');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // حساب العائد المتوقع
  const calculateExpectedReturn = () => {
    if (!plan || !amount) return 0;
    
    const investAmount = parseFloat(amount);
    if (isNaN(investAmount)) return 0;
    
    return investAmount * (1 + plan.returnRate / 100);
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
  if (!currentUser || !userData) {
    return null;
  }
  
  // إذا كان هناك خطأ في جلب الخطة
  if (!plan && !isLoading) {
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
                استثمار جديد
              </motion.h1>
              <motion.p
                className="text-foreground-muted"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                استثمر في خطة استثمارية
              </motion.p>
            </div>
            
            <motion.div
              className="bg-error/20 text-error p-4 rounded-lg mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <FaInfoCircle className="inline ml-2" />
              {error || 'خطة الاستثمار غير موجودة'}
            </motion.div>
            
            <div className="text-center mt-8">
              <motion.button
                className="btn btn-outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/investment/plans')}
              >
                <FaArrowLeft className="ml-2" />
                العودة إلى خطط الاستثمار
              </motion.button>
            </div>
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
              استثمار جديد
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              استثمر في خطة {plan?.name}
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* تفاصيل الخطة */}
            <motion.div
              className="glass-effect p-6 rounded-xl md:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-primary/10 mr-4">
                  <FaChartLine className="text-primary text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan?.name}</h3>
                  <p className="text-foreground-muted">{plan?.description}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-foreground-muted">العائد اليومي</span>
                  <span className="font-bold text-success">{plan?.dailyReturnRate}%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground-muted">إجمالي العائد</span>
                  <span className="font-bold text-success">{plan?.returnRate}%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground-muted">المدة</span>
                  <span className="font-bold">{plan?.duration} يوم</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground-muted">الحد الأدنى</span>
                  <span className="font-bold">${plan?.minAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">الحد الأقصى</span>
                  <span className="font-bold">${plan?.maxAmount}</span>
                </div>
              </div>
            </motion.div>
            
            {/* نموذج الاستثمار */}
            <motion.div
              className="glass-effect p-6 rounded-xl md:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-6">تفاصيل الاستثمار</h3>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">عملة الاستثمار</label>
                <select
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="USDT">USDT (Tether)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="BNB">BNB (Binance Coin)</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-medium">مبلغ الاستثمار</label>
                <div className="relative">
                  <input
                    type="number"
                    className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                    placeholder="0.00"
                    min={plan?.minAmount}
                    max={plan?.maxAmount}
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isProcessing}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-foreground-muted">
                    {currency}
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-foreground-muted">
                    الحد الأدنى: {plan?.minAmount} {currency}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    الرصيد: {userData.balances?.[currency]?.toFixed(currency === 'BTC' ? 8 : 2) || '0.00'} {currency}
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="font-medium mb-2">ملخص الاستثمار</h4>
                <div className="bg-background-light p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>المبلغ المستثمر</span>
                    <span className="font-bold">{parseFloat(amount || '0').toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>نسبة العائد</span>
                    <span className="font-bold text-success">{plan?.returnRate}%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>المدة</span>
                    <span className="font-bold">{plan?.duration} يوم</span>
                  </div>
                  <div className="flex justify-between border-t border-background-lighter pt-2 mt-2">
                    <span>العائد المتوقع</span>
                    <span className="font-bold text-success">{calculateExpectedReturn().toFixed(2)} {currency}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <motion.button
                  className="btn btn-outline flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/investment/plans')}
                  disabled={isProcessing}
                >
                  <FaArrowLeft className="ml-2" />
                  العودة
                </motion.button>
                
                <motion.button
                  className="btn btn-primary flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInvest}
                  disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) < (plan?.minAmount || 0) || parseFloat(amount) > (plan?.maxAmount || 0) || parseFloat(amount) > (userData.balances?.[currency] || 0)}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin ml-2" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    'استثمر الآن'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
