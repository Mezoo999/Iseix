'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaInfoCircle, FaSpinner, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { useAlert } from '@/contexts/AlertContext';

interface WithdrawFormProps {
  balance: number;
  currency: string;
  onSubmit: (amount: number, address: string, method: string) => Promise<void>;
  isProcessing?: boolean;
}

export default function WithdrawForm({
  balance,
  currency,
  onSubmit,
  isProcessing = false
}: WithdrawFormProps) {
  const { showAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('');
  const [step, setStep] = useState(1);

  const networks = [
    { id: 'usdt_trc20', name: 'USDT TRC20', icon: '🟢', fee: '1 USDT' },
    { id: 'usdt_erc20', name: 'USDT ERC20', icon: '🔵', fee: '10-20 USDT' },
    { id: 'btc', name: 'Bitcoin', icon: '🟡', fee: '0.0005 BTC' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address || !method) {
      showAlert('error', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > balance) {
      showAlert('error', 'المبلغ المطلوب أكبر من الرصيد المتاح');
      return;
    }

    if (amountNum < 20) {
      showAlert('error', 'الحد الأدنى للسحب هو 20 USDT');
      return;
    }

    try {
      await onSubmit(amountNum, address, method);
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        {/* شريط التقدم */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10" />
          {[1, 2, 3].map((stepNumber) => (
            <motion.div
              key={stepNumber}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: step === stepNumber ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
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
            <div className="space-y-4 mb-6">
              {networks.map((net) => (
                <button
                  key={net.id}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    method === net.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-primary/50'
                  }`}
                  onClick={() => setMethod(net.id)}
                >
                  <div className="flex items-center">
                    <div className="text-2xl ml-3">{net.icon}</div>
                    <div>
                      <div className="font-medium">{net.name}</div>
                      <div className="text-sm text-gray-400">رسوم الشبكة: {net.fee}</div>
                    </div>
                  </div>
                  {method === net.id && (
                    <FaArrowRight className="text-primary" />
                  )}
                </button>
              ))}
            </div>

            <button
              className="w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              onClick={() => method && setStep(2)}
              disabled={!method}
            >
              التالي
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-bold mb-6">تفاصيل السحب</h3>

            <div className="bg-blue-500/10 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <FaWallet className="text-primary ml-2" />
                <div>
                  <div className="font-medium">الرصيد المتاح</div>
                  <div className="text-2xl font-bold mt-1">{balance.toFixed(2)} {currency}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">المبلغ ({currency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary"
                placeholder="أدخل المبلغ..."
                min="20"
                step="0.01"
              />
              <p className="text-sm text-gray-400 mt-1">الحد الأدنى للسحب: 20 {currency}</p>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                onClick={() => setStep(1)}
              >
                رجوع
              </button>
              <button
                className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                onClick={() => amount && parseFloat(amount) >= 20 && parseFloat(amount) <= balance && setStep(3)}
                disabled={!amount || parseFloat(amount) < 20 || parseFloat(amount) > balance}
              >
                التالي
              </button>
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

            <div className="mb-6">
              <label className="block mb-2 font-medium">عنوان المحفظة</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary"
                placeholder={`أدخل عنوان ${method === 'btc' ? 'Bitcoin' : 'USDT'} الخاص بك...`}
              />
              <p className="text-sm text-gray-400 mt-1">تأكد من صحة العنوان قبل التأكيد</p>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4 mb-6">
              <h4 className="font-medium mb-3">ملخص السحب</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">المبلغ</span>
                  <span className="font-medium">{parseFloat(amount).toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">الشبكة</span>
                  <span className="font-medium">
                    {networks.find(n => n.id === method)?.name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">رسوم الشبكة</span>
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
            </div>

            <div className="flex gap-4 mb-6">
              <button
                className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                onClick={() => setStep(2)}
              >
                رجوع
              </button>
              <button
                className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isProcessing || !address}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    <span>جارٍ المعالجة...</span>
                  </div>
                ) : (
                  'تأكيد السحب'
                )}
              </button>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4">
              <div className="flex items-start">
                <FaShieldAlt className="text-primary ml-2 mt-1" />
                <div>
                  <h4 className="font-medium mb-2">تنبيهات أمنية</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li>• تأكد من صحة عنوان المحفظة قبل التأكيد</li>
                    <li>• لا يمكن التراجع عن عملية السحب بعد تأكيدها</li>
                    <li>• قد تستغرق معالجة السحب من 24 إلى 48 ساعة</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
