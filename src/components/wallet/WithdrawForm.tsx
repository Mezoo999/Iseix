'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaInfoCircle, FaSpinner, FaArrowRight, FaShieldAlt, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { useAlert } from '@/contexts/AlertContext';
import { getAvailableProfitsForWithdrawal, hasPendingWithdrawals } from '@/services/withdrawals';

interface WithdrawFormProps {
  balance: number;
  currency: string;
  onSubmit: (amount: number, address: string, method: string) => Promise<void>;
  isProcessing?: boolean;
  initialAvailableProfits?: number;
  hasPendingWithdrawal?: boolean;
}

export default function WithdrawForm({
  balance,
  currency,
  onSubmit,
  isProcessing = false,
  initialAvailableProfits = 0,
  hasPendingWithdrawal: initialHasPendingWithdrawal = false
}: WithdrawFormProps) {
  const { showAlert, showModalAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('');
  const [step, setStep] = useState(1);
  const [availableProfits, setAvailableProfits] = useState(0);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // الحصول على الأرباح المتاحة للسحب وحالة طلبات السحب المعلقة
  useEffect(() => {
    // إذا تم تمرير قيمة أولية للمكافآت المتاحة، استخدمها
    if (initialAvailableProfits > 0) {
      setAvailableProfits(initialAvailableProfits);
      console.log('[WithdrawForm] استخدام المكافآت المتاحة المررة من الصفحة الأم:', initialAvailableProfits);
    }

    // إذا تم تمرير حالة طلبات السحب المعلقة، استخدمها
    if (initialHasPendingWithdrawal) {
      setHasPendingWithdrawal(initialHasPendingWithdrawal);
      console.log('[WithdrawForm] استخدام حالة طلبات السحب المعلقة المررة من الصفحة الأم:', initialHasPendingWithdrawal);
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // الحصول على معرف المستخدم من localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(userDataStr);
        const userId = userData.uid;

        // محاولة استخدام قيمة المكافآت المتاحة من localStorage إذا كانت متوفرة
        if (initialAvailableProfits <= 0 && userData.availableProfits > 0) {
          setAvailableProfits(userData.availableProfits);
          console.log('[WithdrawForm] استخدام المكافآت المتاحة من localStorage:', userData.availableProfits);
        }
        // الحصول على الأرباح المتاحة للسحب فقط إذا لم يتم تمرير قيمة أولية ولم تكن متوفرة في localStorage
        else if (initialAvailableProfits <= 0) {
          console.log('[WithdrawForm] جلب المكافآت المتاحة من الخدمة للمستخدم:', userId);
          const profits = await getAvailableProfitsForWithdrawal(userId, currency);
          setAvailableProfits(profits);
          console.log('[WithdrawForm] تم جلب المكافآت المتاحة من الخدمة:', profits);
        }

        // التحقق من وجود طلبات سحب معلقة فقط إذا لم يتم تمرير حالة طلبات السحب المعلقة
        if (!initialHasPendingWithdrawal) {
          console.log('[WithdrawForm] التحقق من وجود طلبات سحب معلقة للمستخدم:', userId);
          const hasPending = await hasPendingWithdrawals(userId);
          setHasPendingWithdrawal(hasPending);
          console.log('[WithdrawForm] نتيجة التحقق من وجود طلبات سحب معلقة:', hasPending);
        }
      } catch (error) {
        console.error('[WithdrawForm] Error fetching withdrawal data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currency, initialAvailableProfits, initialHasPendingWithdrawal]);

  const networks = [
    {
      id: 'usdt_trc20',
      name: 'USDT TRC20',
      icon: <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center"><FaWallet className="text-white" /></div>,
      fee: '1 USDT',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    {
      id: 'bnb_bep20',
      name: 'BNB BEP20',
      icon: <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center"><FaWallet className="text-white" /></div>,
      fee: '0.001 BNB',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // منع الضغط المتكرر على زر السحب
    if (isSubmitting) {
      console.log('[WithdrawForm] تم تجاهل الطلب لأن هناك طلب آخر قيد المعالجة');
      return;
    }

    if (!amount || !address || !method) {
      showModalAlert(
        'error',
        'حقول مطلوبة',
        'يرجى ملء جميع الحقول المطلوبة',
        'فهمت'
      );
      return;
    }

    // التأكد من أن المستخدم يريد بالفعل إجراء عملية السحب
    const confirmWithdrawal = window.confirm(`هل أنت متأكد من رغبتك في سحب ${amount} ${currency}؟ لا يمكن التراجع عن هذه العملية بعد تأكيدها.`);
    if (!confirmWithdrawal) {
      console.log('[WithdrawForm] تم إلغاء عملية السحب من قبل المستخدم');
      return;
    }

    const amountNum = parseFloat(amount);
    console.log(`[WithdrawForm] بدء عملية السحب: المبلغ=${amountNum}, العنوان=${address}, الطريقة=${method}`);

    // التحقق من وجود طلبات سحب معلقة
    if (hasPendingWithdrawal) {
      console.log('[WithdrawForm] تم رفض الطلب بسبب وجود طلب سحب معلق');
      showModalAlert(
        'error',
        'طلب سحب معلق',
        'لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.',
        'فهمت'
      );
      return;
    }

    // التحقق من أن المبلغ المطلوب سحبه لا يتجاوز المكافآت المتاحة
    if (amountNum > availableProfits) {
      console.log(`[WithdrawForm] تم رفض الطلب لأن المبلغ (${amountNum}) أكبر من المكافآت المتاحة (${availableProfits})`);
      showModalAlert(
        'error',
        'خطأ في المبلغ',
        `يمكنك فقط سحب المكافآت. المكافآت المتاحة للسحب: ${availableProfits.toFixed(2)} ${currency}`,
        'فهمت'
      );
      return;
    }

    if (amountNum > balance) {
      console.log(`[WithdrawForm] تم رفض الطلب لأن المبلغ (${amountNum}) أكبر من الرصيد المتاح (${balance})`);
      showModalAlert(
        'error',
        'خطأ في المبلغ',
        'المبلغ المطلوب أكبر من الرصيد المتاح',
        'فهمت'
      );
      return;
    }

    if (amountNum < 20) {
      console.log('[WithdrawForm] تم رفض الطلب لأن المبلغ أقل من الحد الأدنى');
      showModalAlert(
        'error',
        'خطأ في المبلغ',
        `الحد الأدنى للسحب هو 20 ${currency}`,
        'فهمت'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[WithdrawForm] جاري إرسال طلب السحب...');

      await onSubmit(amountNum, address, method);

      console.log('[WithdrawForm] تم إرسال طلب السحب بنجاح');

      // تحديث حالة طلبات السحب المعلقة
      setHasPendingWithdrawal(true);

      // تحديث الرصيد المتاح والمكافآت المتاحة
      // نقوم بتحديث الرصيد المتاح محلياً لتحسين تجربة المستخدم
      setAvailableProfits(prev => Math.max(0, prev - amountNum));

      // إعادة تعيين النموذج بعد النجاح
      setAmount('');
      setAddress('');
      setStep(1);

    } catch (error) {
      console.error('[WithdrawForm] Error submitting withdrawal:', error);
      // عرض رسالة الخطأ إذا كانت متاحة
      if (error instanceof Error) {
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          error.message,
          'فهمت'
        );
      } else {
        showModalAlert(
          'error',
          'خطأ في طلب السحب',
          'حدث خطأ أثناء إرسال طلب السحب',
          'فهمت'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-background-light/80 to-background-lighter/60 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-lg">
        {/* شريط التقدم */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-background-lighter -z-10" />
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-primary/30 -z-10" style={{ width: `${(step - 1) * 50}%` }} />

          {[1, 2, 3].map((stepNumber) => (
            <motion.div
              key={stepNumber}
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg text-sm sm:text-base ${
                step >= stepNumber
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
                  : 'bg-background-lighter text-foreground-muted'
              }`}
              initial={{ scale: 0.8 }}
              animate={{
                scale: step === stepNumber ? 1 : 0.9,
                y: step === stepNumber ? -3 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {stepNumber}
            </motion.div>
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-bold mb-6">اختر شبكة السحب</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {networks.map((net) => (
                <button
                  key={net.id}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                    method === net.id
                      ? `${net.color} text-white shadow-lg`
                      : 'border-white/10 hover:border-primary/50 bg-background-dark/30'
                  }`}
                  onClick={() => setMethod(net.id)}
                >
                  <div className="mb-3">{net.icon}</div>
                  <div className="font-medium text-sm sm:text-base">{net.name}</div>
                  <div className="text-xs mt-1">رسوم الشبكة: {net.fee}</div>
                </button>
              ))}
            </div>

            <motion.button
              className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 text-sm sm:text-base"
              onClick={() => method && setStep(2)}
              disabled={!method}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              التالي
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-bold mb-6">تفاصيل السحب</h3>

            {isLoading ? (
              <div className="bg-blue-500/10 rounded-xl p-4 mb-6 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="bg-blue-500/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <FaWallet className="text-primary ml-2" />
                    <div>
                      <div className="font-medium">الرصيد المتاح</div>
                      <div className="text-2xl font-bold mt-1">{balance.toFixed(2)} {currency}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <FaChartLine className="text-success ml-2" />
                    <div>
                      <div className="font-medium">المكافآت المتاحة للسحب</div>
                      <div className="text-2xl font-bold mt-1">{availableProfits.toFixed(2)} {currency}</div>
                      <div className="text-sm text-gray-400 mt-1">يمكنك فقط سحب المكافآت وليس مبلغ الإيداع الأصلي</div>
                    </div>
                  </div>
                </div>

                {hasPendingWithdrawal && (
                  <div className="bg-error/10 text-error p-4 rounded-lg mb-6">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="ml-2 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">لديك طلب سحب معلق</p>
                        <p className="text-sm">يرجى الانتظار حتى تتم معالجة طلب السحب الحالي قبل إنشاء طلب جديد.</p>
                        <button
                          className="mt-2 px-3 py-1 bg-error/20 hover:bg-error/30 text-error rounded-lg text-xs transition-colors"
                          onClick={() => {
                            showModalAlert(
                              'error',
                              'طلب سحب معلق',
                              'لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد. يمكنك مراجعة حالة طلب السحب في صفحة المعاملات.',
                              'فهمت'
                            );
                          }}
                        >
                          مزيد من المعلومات
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mb-6 sm:mb-8">
              <label className="block mb-2 font-medium text-sm sm:text-base">المبلغ ({currency})</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background-dark/50 border border-primary/20 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="أدخل المبلغ..."
                  min="20"
                  step="0.01"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted text-sm sm:text-base">
                  {currency}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-muted mt-2 flex items-center">
                <FaInfoCircle className="ml-1 text-primary" />
                الحد الأدنى للسحب: 20 {currency}
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <motion.button
                className="flex-1 py-2 sm:py-3 px-4 sm:px-6 bg-background-lighter text-foreground rounded-xl font-medium hover:bg-background-light transition-colors text-sm sm:text-base"
                onClick={() => setStep(1)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                رجوع
              </motion.button>
              <motion.button
                className="flex-1 py-2 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 text-sm sm:text-base"
                onClick={() => amount && parseFloat(amount) >= 20 && parseFloat(amount) <= balance && setStep(3)}
                disabled={!amount || parseFloat(amount) < 20 || parseFloat(amount) > balance}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                التالي
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-bold mb-6">تأكيد السحب</h3>

            <div className="mb-4 sm:mb-6">
              <label className="block mb-2 font-medium text-sm sm:text-base">عنوان المحفظة</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-background-dark/50 border border-primary/20 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={`أدخل عنوان ${method === 'btc' ? 'Bitcoin' : 'USDT'} الخاص بك...`}
              />
              <p className="text-xs sm:text-sm text-foreground-muted mt-2 flex items-center">
                <FaInfoCircle className="ml-1 text-primary" />
                تأكد من صحة العنوان قبل التأكيد
              </p>
            </div>

            <motion.div
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border border-primary/30 shadow-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h4 className="font-medium mb-3 text-sm sm:text-base">ملخص السحب</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-primary/10">
                  <span className="text-foreground-muted">المبلغ</span>
                  <span className="font-medium">{parseFloat(amount).toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary/10">
                  <span className="text-foreground-muted">المكافآت المتاحة للسحب</span>
                  <span className={`font-medium ${parseFloat(amount) > availableProfits ? 'text-error' : 'text-success'}`}>
                    {availableProfits.toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary/10">
                  <span className="text-foreground-muted">الشبكة</span>
                  <span className="font-medium">
                    {networks.find(n => n.id === method)?.name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary/10">
                  <span className="text-foreground-muted">رسوم الشبكة</span>
                  <span className="font-medium">
                    {networks.find(n => n.id === method)?.fee}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">المبلغ النهائي</span>
                  <span className="font-bold text-primary">
                    {parseFloat(amount).toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {parseFloat(amount) > availableProfits && (
                <div className="mt-3 bg-error/10 text-error p-2 rounded-lg text-xs">
                  <div className="flex items-start">
                    <FaInfoCircle className="ml-1 mt-0.5 flex-shrink-0" />
                    <div>
                      المبلغ المطلوب سحبه يتجاوز المكافآت المتاحة. يمكنك فقط سحب المكافآت وليس مبلغ الإيداع الأصلي.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <div className="flex gap-3 sm:gap-4 mb-6">
              <motion.button
                className="flex-1 py-2 sm:py-3 px-4 sm:px-6 bg-background-lighter text-foreground rounded-xl font-medium hover:bg-background-light transition-colors text-sm sm:text-base"
                onClick={() => setStep(2)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                رجوع
              </motion.button>
              <motion.button
                className="flex-1 py-2 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 text-sm sm:text-base"
                onClick={handleSubmit}
                disabled={isProcessing || isSubmitting || !address || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableProfits}
                title={parseFloat(amount) > availableProfits ? 'المبلغ المطلوب سحبه يتجاوز المكافآت المتاحة' : ''}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2 text-sm sm:text-base" />
                    <span className="text-sm sm:text-base">جارٍ المعالجة...</span>
                  </div>
                ) : parseFloat(amount) > availableProfits ? (
                  'المبلغ يتجاوز المكافآت المتاحة'
                ) : (
                  'تأكيد السحب'
                )}
              </motion.button>
            </div>

            <motion.div
              className="bg-gradient-to-br from-info/10 to-info/5 rounded-xl p-4 sm:p-5 border border-info/30 shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-info/20 flex items-center justify-center ml-2 sm:ml-3 mt-1">
                  <FaShieldAlt className="text-info text-sm sm:text-base" />
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">تنبيهات أمنية</h4>
                  <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-foreground-muted">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      يمكنك فقط سحب المكافآت وليس مبلغ الإيداع الأصلي
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      لا يمكن إنشاء طلب سحب جديد حتى تتم معالجة الطلب السابق
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      تأكد من صحة عنوان المحفظة قبل التأكيد
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      لا يمكن التراجع عن عملية السحب بعد تأكيدها
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      قد تستغرق معالجة السحب من 24 إلى 48 ساعة
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
