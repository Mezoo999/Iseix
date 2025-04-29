'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaMoneyBillWave, FaPercentage, FaCalendarAlt, FaInfoCircle, FaCoins } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { predictFutureEarnings, getTotalInterestEarned } from '@/services/compoundInterest';

export default function AutoCompoundInterest() {
  const { currentUser } = useAuth();
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [totalInterest, setTotalInterest] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        // جلب إجمالي الفائدة المكتسبة
        const interestEarned = await getTotalInterestEarned(currentUser.uid);
        setTotalInterest(interestEarned);

        // توقع الأرباح المستقبلية
        const futureEarnings = await predictFutureEarnings(currentUser.uid, selectedDays);
        setPredictions(futureEarnings);
      } catch (error) {
        console.error('Error loading compound interest data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, selectedDays]);

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
  };

  return (
    <motion.div
      className="card card-primary mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-full bg-primary/20 ml-3">
          <FaChartLine className="text-primary text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold">الفائدة المركبة التلقائية</h2>
          <p className="text-foreground-muted">استثمر واحصل على فائدة يومية تتراكم تلقائيًا</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-primary/10 p-4 rounded-lg border border-primary/20"
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-primary/20 ml-3">
              <FaPercentage className="text-primary text-xl" />
            </div>
            <h3 className="font-bold">معدل الفائدة اليومي</h3>
          </div>
          <p className="text-foreground-muted mb-2">
            احصل على فائدة يومية تتراوح بين <span className="text-success font-bold">2.5%</span> و <span className="text-success font-bold">4.5%</span> على رصيدك
          </p>
          <p className="text-sm text-foreground-muted">
            يزداد معدل الفائدة مع زيادة مبلغ الاستثمار
          </p>
        </motion.div>

        <motion.div
          className="bg-success/10 p-4 rounded-lg border border-success/20"
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-success/20 ml-3">
              <FaMoneyBillWave className="text-success text-xl" />
            </div>
            <h3 className="font-bold">الفائدة المكتسبة</h3>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-12 bg-background-lighter rounded"></div>
          ) : Object.keys(totalInterest).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(totalInterest).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between">
                  <span>{currency}:</span>
                  <span className="font-bold text-success">+{amount.toFixed(currency === 'BTC' ? 8 : 2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">
              لم تكتسب أي فائدة بعد. قم بإيداع مبلغ للبدء.
            </p>
          )}
        </motion.div>

        <motion.div
          className="bg-info/10 p-4 rounded-lg border border-info/20"
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-info/20 ml-3">
              <FaCalendarAlt className="text-info text-xl" />
            </div>
            <h3 className="font-bold">الفائدة المركبة تعمل</h3>
          </div>
          <p className="text-foreground-muted mb-2">
            تضاف الفائدة يوميًا إلى رصيدك وتتراكم تلقائيًا
          </p>
          <p className="text-sm text-foreground-muted">
            كلما زادت مدة الاستثمار، كلما زادت الأرباح بشكل مضاعف
          </p>
        </motion.div>
      </div>

      <div className="bg-background-light/30 p-6 rounded-lg border border-primary/10 mb-6">
        <h3 className="font-bold mb-4 flex items-center">
          <FaInfoCircle className="ml-2 text-primary" />
          توقع الأرباح المستقبلية
        </h3>

        <div className="mb-6">
          <label className="form-label">اختر الفترة الزمنية:</label>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-md ${selectedDays === 7 ? 'bg-primary text-foreground-inverted shadow-sm' : 'bg-background-light text-foreground-muted hover:bg-background-lighter'}`}
              onClick={() => handleDaysChange(7)}
            >
              أسبوع
            </button>
            <button
              className={`px-4 py-2 rounded-md ${selectedDays === 30 ? 'bg-primary text-foreground-inverted shadow-sm' : 'bg-background-light text-foreground-muted hover:bg-background-lighter'}`}
              onClick={() => handleDaysChange(30)}
            >
              شهر
            </button>
            <button
              className={`px-4 py-2 rounded-md ${selectedDays === 90 ? 'bg-primary text-foreground-inverted shadow-sm' : 'bg-background-light text-foreground-muted hover:bg-background-lighter'}`}
              onClick={() => handleDaysChange(90)}
            >
              3 أشهر
            </button>
            <button
              className={`px-4 py-2 rounded-md ${selectedDays === 180 ? 'bg-primary text-foreground-inverted shadow-sm' : 'bg-background-light text-foreground-muted hover:bg-background-lighter'}`}
              onClick={() => handleDaysChange(180)}
            >
              6 أشهر
            </button>
            <button
              className={`px-4 py-2 rounded-md ${selectedDays === 365 ? 'bg-primary text-foreground-inverted shadow-sm' : 'bg-background-light text-foreground-muted hover:bg-background-lighter'}`}
              onClick={() => handleDaysChange(365)}
            >
              سنة
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-background-lighter rounded"></div>
            <div className="h-8 bg-background-lighter rounded"></div>
          </div>
        ) : Object.keys(predictions).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(predictions).map(([currency, amount]) => (
              <motion.div
                key={currency}
                className="bg-success/5 p-4 rounded-lg border border-success/10"
                whileHover={{ y: -3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium flex items-center">
                    <FaCoins className="ml-1 text-primary" />
                    العملة:
                  </span>
                  <span>{currency}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium flex items-center">
                    <FaChartLine className="ml-1 text-success" />
                    الأرباح المتوقعة خلال {selectedDays} يوم:
                  </span>
                  <span className="font-bold text-success">+{amount.toFixed(currency === 'BTC' ? 8 : 2)}</span>
                </div>
                <div className="text-xs text-foreground-muted text-center mt-2 bg-background-light/50 p-2 rounded">
                  * هذه التوقعات تقديرية وتعتمد على معدل الفائدة الحالي والرصيد الحالي
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-background-light/50 rounded-lg border border-background-lighter">
            <FaChartLine className="text-4xl mx-auto mb-4 text-foreground-muted opacity-50" />
            <p className="text-foreground-muted font-medium">
              قم بإيداع مبلغ في محفظتك لرؤية توقعات الأرباح المستقبلية
            </p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
        <h3 className="font-bold mb-3 flex items-center">
          <FaInfoCircle className="ml-2 text-primary" />
          كيف تعمل الفائدة المركبة؟
        </h3>
        <p className="text-foreground-muted mb-4">
          الفائدة المركبة هي قوة تنمية المال بشكل تلقائي. عندما تودع مبلغًا في منصتنا، تحصل على فائدة يومية تضاف إلى رصيدك الأصلي، وفي اليوم التالي تحصل على فائدة على المبلغ الأصلي والفائدة السابقة معًا، وهكذا تتراكم الأرباح بشكل متزايد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <motion.div
            className="bg-background-light/50 p-4 rounded-lg border border-primary/5"
            whileHover={{ y: -3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="font-bold text-lg mb-1 text-primary">اليوم 1</div>
            <div className="text-sm">
              <div>المبلغ: 1000$</div>
              <div>الفائدة: 30$</div>
              <div className="font-bold mt-1 text-success">الرصيد: 1030$</div>
            </div>
          </motion.div>
          <motion.div
            className="bg-background-light/50 p-4 rounded-lg border border-primary/5"
            whileHover={{ y: -3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="font-bold text-lg mb-1 text-primary">اليوم 30</div>
            <div className="text-sm">
              <div>المبلغ: 1030$</div>
              <div>الفائدة: 30.9$</div>
              <div className="font-bold mt-1 text-success">الرصيد: 1060.9$</div>
            </div>
          </motion.div>
          <motion.div
            className="bg-background-light/50 p-4 rounded-lg border border-primary/5"
            whileHover={{ y: -3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="font-bold text-lg mb-1 text-primary">اليوم 365</div>
            <div className="text-sm">
              <div>المبلغ الأصلي: 1000$</div>
              <div>الفائدة المتراكمة: 1478$</div>
              <div className="font-bold mt-1 text-success">الرصيد النهائي: 2478$</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
