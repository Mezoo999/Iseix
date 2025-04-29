'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaCopy, FaQrcode, FaInfoCircle, FaUpload, FaSpinner } from 'react-icons/fa';
import { useAlert } from '@/contexts/AlertContext';

interface DepositFormProps {
  onSubmit: (amount: number, txId: string, platform: string, proofFile?: File) => Promise<void>;
  isProcessing?: boolean;
}

export default function DepositForm({ onSubmit, isProcessing = false }: DepositFormProps) {
  const { showAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [platform, setPlatform] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);

  const walletAddress = "TRx7NkL8sJ7QgE9Y2P5Km3Gz8sdKf28Qwj"; // عنوان المحفظة (مثال)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert('success', 'تم نسخ النص!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txId || !platform) {
      showAlert('error', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    try {
      await onSubmit(parseFloat(amount), txId, platform, proofFile || undefined);
    } catch (error) {
      console.error('Error submitting deposit:', error);
    }
  };

  const platforms = [
    { id: 'binance', name: 'Binance', icon: '🟡' },
    { id: 'kucoin', name: 'KuCoin', icon: '🟢' },
    { id: 'okx', name: 'OKX', icon: '🔵' },
    { id: 'other', name: 'منصة أخرى', icon: '⚪' },
  ];

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
            <h3 className="text-xl font-bold mb-6">اختر منصة التداول</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {platforms.map((plt) => (
                <button
                  key={plt.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    platform === plt.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-primary/50'
                  }`}
                  onClick={() => setPlatform(plt.id)}
                >
                  <div className="text-2xl mb-2">{plt.icon}</div>
                  <div className="font-medium">{plt.name}</div>
                </button>
              ))}
            </div>
            <button
              className="w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              onClick={() => platform && setStep(2)}
              disabled={!platform}
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
            <h3 className="text-xl font-bold mb-6">تفاصيل الإيداع</h3>
            
            <div className="bg-blue-500/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FaWallet className="text-primary ml-2" />
                  <span className="font-medium">عنوان المحفظة (USDT-TRC20)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(walletAddress)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <FaCopy />
                  </button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <FaQrcode />
                  </button>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 font-mono text-sm break-all">
                {walletAddress}
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">المبلغ (USDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary"
                placeholder="أدخل المبلغ..."
                min="10"
                step="0.01"
              />
              <p className="text-sm text-gray-400 mt-1">الحد الأدنى للإيداع: 10 USDT</p>
            </div>

            <button
              className="w-full py-3 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              onClick={() => amount && parseFloat(amount) >= 10 && setStep(3)}
              disabled={!amount || parseFloat(amount) < 10}
            >
              التالي
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="text-xl font-bold mb-6">تأكيد الإيداع</h3>

            <div className="mb-6">
              <label className="block mb-2 font-medium">رقم المعاملة (TXID)</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary"
                placeholder="أدخل رقم المعاملة..."
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">إثبات الإيداع (اختياري)</label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proofFile"
                  accept="image/*,application/pdf"
                />
                <label
                  htmlFor="proofFile"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {proofFile ? (
                    <div className="flex items-center">
                      <FaUpload className="ml-2" />
                      <span>{proofFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <FaUpload className="ml-2" />
                      <span>اختر ملفاً أو اسحبه هنا</span>
                    </div>
                  )}
                </label>
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
                disabled={isProcessing || !txId}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    <span>جارٍ المعالجة...</span>
                  </div>
                ) : (
                  'تأكيد الإيداع'
                )}
              </button>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-primary ml-2 mt-1" />
                <div>
                  <h4 className="font-medium mb-2">ملاحظات مهمة</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li>• تأكد من استخدام شبكة TRC20 للإيداع</li>
                    <li>• سيتم تحديث رصيدك خلال 24 ساعة كحد أقصى</li>
                    <li>• في حال وجود أي مشكلة، يرجى التواصل مع الدعم</li>
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
