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

  // عناوين المحافظ
  const walletAddresses = {
    trc20: "TRx7NkL8sJ7QgE9Y2P5Km3Gz8sdKf28Qwj",
    bep20: "0xc256b16170feab7468576dc7007610f54ec397dd"
  };

  // العملة المحددة
  const [selectedCurrency, setSelectedCurrency] = useState('trc20');

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
    if (!amount || !txId || !platform || !selectedCurrency) {
      showAlert('error', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // إضافة معلومات العملة المحددة إلى طلب الإيداع
      const currencyInfo = selectedCurrency === 'trc20' ? 'USDT-TRC20' : 'BNB-BEP20';
      await onSubmit(parseFloat(amount), txId, `${platform}_${selectedCurrency}`, proofFile || undefined);

      // إعادة تعيين النموذج بعد الإرسال الناجح
      setAmount('');
      setTxId('');
      setProofFile(null);
    } catch (error) {
      console.error('Error submitting deposit:', error);
    }
  };

  // منصات التداول
  const platforms = [
    {
      id: 'binance',
      name: 'Binance',
      icon: <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center mx-auto"><FaWallet className="text-white" /></div>,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      icon: <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mx-auto"><FaWallet className="text-white" /></div>,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      id: 'okx',
      name: 'OKX',
      icon: <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mx-auto"><FaWallet className="text-white" /></div>,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      id: 'other',
      name: 'منصة أخرى',
      icon: <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mx-auto"><FaWallet className="text-gray-700" /></div>,
      color: 'bg-gradient-to-r from-gray-400 to-gray-500'
    },
  ];

  // خيارات العملات
  const currencies = [
    {
      id: 'trc20',
      name: 'USDT-TRC20',
      network: 'Tron Network',
      icon: <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mx-auto"><FaWallet className="text-white text-xl" /></div>,
      address: walletAddresses.trc20,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    {
      id: 'bep20',
      name: 'BNB Smart Chain (BEP20)',
      network: 'Binance Smart Chain',
      icon: <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center mx-auto"><FaWallet className="text-white text-xl" /></div>,
      address: walletAddresses.bep20,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    },
  ];

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
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4 sm:mb-6 text-center">اختر عملة الإيداع</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {currencies.map((currency) => (
                <motion.button
                  key={currency.id}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                    selectedCurrency === currency.id
                      ? `${currency.color} text-white shadow-lg`
                      : 'border-white/10 hover:border-primary/50 bg-background-dark/30'
                  }`}
                  onClick={() => setSelectedCurrency(currency.id)}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-2 sm:mb-3">{currency.icon}</div>
                  <div className="font-medium text-sm sm:text-base">{currency.name}</div>
                  <div className="text-xs mt-1">{currency.network}</div>
                </motion.button>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-4 sm:mb-6 text-center">اختر منصة التداول</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {platforms.map((plt) => (
                <motion.button
                  key={plt.id}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                    platform === plt.id
                      ? `${plt.color} text-white shadow-lg`
                      : 'border-white/10 hover:border-primary/50 bg-background-dark/30'
                  }`}
                  onClick={() => setPlatform(plt.id)}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-2 sm:mb-3">{plt.icon}</div>
                  <div className="font-medium text-sm sm:text-base">{plt.name}</div>
                </motion.button>
              ))}
            </div>

            <motion.button
              className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 text-sm sm:text-base"
              onClick={() => platform && selectedCurrency && setStep(2)}
              disabled={!platform || !selectedCurrency}
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
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-6 text-center">تفاصيل الإيداع</h3>

            <motion.div
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border border-primary/30 shadow-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center ml-2 sm:ml-3">
                    <FaWallet className="text-primary text-sm sm:text-base" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">
                    {selectedCurrency === 'trc20' ? 'عنوان المحفظة (USDT-TRC20)' : 'عنوان المحفظة (BNB Smart Chain)'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleCopy(walletAddresses[selectedCurrency as keyof typeof walletAddresses])}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaCopy className="text-primary text-sm sm:text-base" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaQrcode className="text-primary text-sm sm:text-base" />
                  </motion.button>
                </div>
              </div>
              <div className="bg-background-dark/50 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm break-all border border-primary/20">
                {walletAddresses[selectedCurrency as keyof typeof walletAddresses]}
              </div>
              <div className="mt-3 text-xs text-foreground-muted flex items-center">
                <FaInfoCircle className="ml-1 text-primary" />
                {selectedCurrency === 'trc20'
                  ? 'تأكد من استخدام شبكة TRC20 للإيداع'
                  : 'تأكد من استخدام شبكة BEP20 (BSC) للإيداع'}
              </div>
            </motion.div>

            <div className="mb-6 sm:mb-8">
              <label className="block mb-2 font-medium text-sm sm:text-base">المبلغ {selectedCurrency === 'trc20' ? '(USDT)' : '(BNB)'}</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background-dark/50 border border-primary/20 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="أدخل المبلغ..."
                  min="10"
                  step="0.01"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted text-sm sm:text-base">
                  {selectedCurrency === 'trc20' ? 'USDT' : 'BNB'}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-foreground-muted mt-2 flex items-center">
                <FaInfoCircle className="ml-1 text-primary" />
                الحد الأدنى للإيداع: {selectedCurrency === 'trc20' ? '10 USDT' : '0.05 BNB'}
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
                onClick={() => {
                  const minAmount = selectedCurrency === 'trc20' ? 10 : 0.05;
                  if (amount && parseFloat(amount) >= minAmount) {
                    setStep(3);
                  }
                }}
                disabled={!amount || parseFloat(amount) < (selectedCurrency === 'trc20' ? 10 : 0.05)}
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
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-6 text-center">تأكيد الإيداع</h3>

            <div className="mb-4 sm:mb-6">
              <label className="block mb-2 font-medium text-sm sm:text-base">رقم المعاملة (TXID)</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="w-full bg-background-dark/50 border border-primary/20 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="أدخل رقم المعاملة..."
              />
              <p className="text-xs sm:text-sm text-foreground-muted mt-2 flex items-center">
                <FaInfoCircle className="ml-1 text-primary" />
                يمكنك الحصول على رقم المعاملة من منصة التداول
              </p>
            </div>

            <div className="mb-4 sm:mb-8">
              <label className="block mb-2 font-medium text-sm sm:text-base">إثبات الإيداع (اختياري)</label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proofFile"
                  accept="image/*,application/pdf"
                />
                <motion.label
                  htmlFor="proofFile"
                  className="flex items-center justify-center w-full p-3 sm:p-5 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/70 transition-colors bg-background-dark/30"
                  whileHover={{ y: -2, scale: 1.01 }}
                >
                  {proofFile ? (
                    <div className="flex items-center">
                      <FaUpload className="ml-2 text-primary text-sm sm:text-base" />
                      <span className="text-sm sm:text-base truncate max-w-[200px] sm:max-w-full">{proofFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-foreground-muted">
                      <FaUpload className="ml-2 text-primary text-sm sm:text-base" />
                      <span className="text-sm sm:text-base">اختر ملفاً أو اسحبه هنا</span>
                    </div>
                  )}
                </motion.label>
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                <FaInfoCircle className="ml-1 text-primary inline-block" />
                الحد الأقصى لحجم الملف: 5 ميجابايت
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
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
                disabled={isProcessing || !txId}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2 text-sm sm:text-base" />
                    <span className="text-sm sm:text-base">جارٍ المعالجة...</span>
                  </div>
                ) : (
                  'تأكيد الإيداع'
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
                  <FaInfoCircle className="text-info text-sm sm:text-base" />
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">ملاحظات مهمة</h4>
                  <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-foreground-muted">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      {selectedCurrency === 'trc20'
                        ? 'تأكد من استخدام شبكة TRC20 للإيداع'
                        : 'تأكد من استخدام شبكة BEP20 (BSC) للإيداع'}
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      سيتم تحديث رصيدك خلال 24 ساعة كحد أقصى
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      في حال وجود أي مشكلة، يرجى التواصل مع الدعم
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-info ml-2"></div>
                      {selectedCurrency === 'trc20'
                        ? 'الإيداع بعملة USDT فقط على شبكة TRC20'
                        : 'الإيداع بعملة BNB فقط على شبكة BEP20'}
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
