'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaSpinner, FaSave, FaPlus, FaTrash, FaCoins, FaToggleOn, FaToggleOff,
  FaTrophy, FaStar, FaMoneyBillWave, FaGift, FaCheck, FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { getLuckyWheelSettings, updateLuckyWheelSettings } from '@/services/rewards';
import { LuckyWheelSettings, LuckyWheelPrize } from '@/types/rewards';

export default function LuckyWheelSettingsPage() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<LuckyWheelSettings | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>([]);
  const [nextAvailableDate, setNextAvailableDate] = useState<string>('');

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!loading && (!currentUser || !userData?.isAdmin)) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // جلب إعدادات العجلة
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const luckyWheelSettings = await getLuckyWheelSettings();
        setSettings(luckyWheelSettings);
        setIsEnabled(luckyWheelSettings.isEnabled);
        setPrizes([...luckyWheelSettings.prizes]);

        if (luckyWheelSettings.nextAvailableDate) {
          const dateString = luckyWheelSettings.nextAvailableDate.toISOString().split('T')[0];
          setNextAvailableDate(dateString);
        } else {
          // تعيين التاريخ الافتراضي (اليوم)
          const today = new Date().toISOString().split('T')[0];
          setNextAvailableDate(today);
        }
      } catch (error) {
        console.error('Error fetching lucky wheel settings:', error);
        toast.error('حدث خطأ أثناء جلب إعدادات عجلة الحظ');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && userData?.isAdmin) {
      fetchSettings();
    }
  }, [currentUser, userData]);

  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    if (!currentUser || !userData?.isAdmin) return;

    try {
      setIsSaving(true);

      // التحقق من صحة الإعدادات
      if (prizes.length === 0) {
        toast.error('يجب إضافة جائزة واحدة على الأقل');
        return;
      }

      // التحقق من مجموع الاحتمالات
      const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
      if (totalProbability !== 100) {
        toast.error('يجب أن يكون مجموع احتمالات الجوائز 100%');
        return;
      }

      // إعداد البيانات للحفظ
      const updatedSettings: Partial<LuckyWheelSettings> = {
        isEnabled,
        prizes,
      };

      // إضافة تاريخ الإتاحة التالي إذا كان محددًا
      if (nextAvailableDate) {
        updatedSettings.nextAvailableDate = new Date(nextAvailableDate);
      }

      // حفظ الإعدادات
      const success = await updateLuckyWheelSettings(updatedSettings);

      if (success) {
        toast.success('تم حفظ إعدادات عجلة الحظ بنجاح');
      } else {
        toast.error('حدث خطأ أثناء حفظ إعدادات عجلة الحظ');
      }
    } catch (error) {
      console.error('Error saving lucky wheel settings:', error);
      toast.error('حدث خطأ أثناء حفظ إعدادات عجلة الحظ');
    } finally {
      setIsSaving(false);
    }
  };

  // إضافة جائزة جديدة
  const handleAddPrize = () => {
    const newPrize: LuckyWheelPrize = {
      id: `prize_${Date.now()}`,
      amount: 0.5,
      probability: 25,
      color: getRandomColor(),
    };

    setPrizes([...prizes, newPrize]);
  };

  // حذف جائزة
  const handleRemovePrize = (id: string) => {
    setPrizes(prizes.filter(prize => prize.id !== id));
  };

  // تحديث قيمة جائزة
  const handlePrizeChange = (id: string, field: keyof LuckyWheelPrize, value: any) => {
    setPrizes(prizes.map(prize => {
      if (prize.id === id) {
        return { ...prize, [field]: field === 'probability' || field === 'amount' ? parseFloat(value) : value };
      }
      return prize;
    }));
  };

  // الحصول على لون عشوائي
  const getRandomColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // تحديد أيقونة لكل جائزة
  const getPrizeIcon = (amount: number) => {
    if (amount >= 2) return <FaTrophy className="text-yellow-500" />;
    if (amount >= 1.5) return <FaStar className="text-yellow-400" />;
    if (amount >= 1) return <FaCoins className="text-yellow-300" />;
    return <FaMoneyBillWave className="text-green-400" />;
  };

  // تبديل حالة التفعيل
  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="text-4xl animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!currentUser || !userData?.isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gradient">إدارة عجلة الحظ</h1>
            <p className="text-foreground-muted mt-2">
              قم بتخصيص إعدادات عجلة الحظ والجوائز المتاحة للمستخدمين
            </p>
          </div>
          <motion.button
            className="btn btn-primary flex items-center gap-2 px-6"
            onClick={handleSaveSettings}
            disabled={isSaving}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaving ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSave />
            )}
            حفظ الإعدادات
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* إعدادات العجلة */}
          <div className="card card-primary p-6">
            <h2 className="text-xl font-bold mb-4">الإعدادات العامة</h2>

            <div className="mb-6 p-4 bg-primary/10 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-lg">تفعيل عجلة الحظ</span>
                  <p className="text-sm text-foreground-muted mt-1">
                    {isEnabled ? 'عجلة الحظ متاحة للمستخدمين' : 'عجلة الحظ غير متاحة حاليًا'}
                  </p>
                </div>
                <motion.button
                  type="button"
                  className={`text-3xl ${isEnabled ? 'text-success' : 'text-foreground-muted'}`}
                  onClick={toggleEnabled}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isEnabled ? <FaToggleOn /> : <FaToggleOff />}
                </motion.button>
              </label>
            </div>

            <div className="mb-4">
              <label className="block font-bold mb-2">تاريخ الإتاحة التالي</label>
              <div className="relative">
                <input
                  type="date"
                  className="form-input w-full"
                  value={nextAvailableDate}
                  onChange={(e) => setNextAvailableDate(e.target.value)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-primary/10 flex items-center justify-center rounded-r-none rounded-l-md">
                  <FaCalendarAlt className="text-primary" />
                </div>
              </div>
              <p className="text-sm text-foreground-muted mt-1">
                تاريخ إتاحة العجلة للمستخدمين (إذا كانت مفعلة)
              </p>
            </div>

            <div className="mt-6 p-4 bg-info/10 rounded-lg">
              <h3 className="font-bold mb-2 flex items-center">
                <FaInfoCircle className="text-info ml-2" />
                معلومات هامة
              </h3>
              <p className="text-sm text-foreground-muted">
                المكافآت من عجلة الحظ تضاف تلقائيًا إلى رصيد المستخدم بعد لف العجلة، ولا تحتاج إلى موافقة المشرف.
                المكافآت غير قابلة للسحب ولكن يمكن استخدامها للاستثمار في المنصة.
              </p>
            </div>
          </div>

          {/* معاينة العجلة */}
          <div className="card card-primary p-6">
            <h2 className="text-xl font-bold mb-4">معاينة العجلة ثلاثية الأبعاد</h2>

            <div className="relative w-full h-72 rounded-full overflow-hidden mb-4 perspective-1000">
              {/* الإطار الخارجي للعجلة */}
              <div className="absolute inset-0 rounded-full border-8 border-primary/30 shadow-lg transform-gpu -rotate-x-12 z-0"></div>

              {/* مؤشر العجلة */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-20">
                <div className="w-10 h-10 bg-gradient-to-b from-primary to-primary-dark shadow-xl rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg"></div>
                </div>
              </div>

              {/* العجلة الدوارة ثلاثية الأبعاد */}
              <div
                className="w-full h-full rounded-full overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.4)] transform-gpu -rotate-x-12 preserve-3d"
                style={{
                  backgroundImage: `conic-gradient(${prizes.map((prize, index) =>
                    `${prize.color} ${index * (360 / prizes.length)}deg ${(index + 1) * (360 / prizes.length)}deg`
                  ).join(', ')})`,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                }}
              >
                {/* أقسام العجلة */}
                {prizes.map((prize, index) => {
                  const angle = (index * 360) / prizes.length;
                  return (
                    <div
                      key={prize.id}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle + 180 / prizes.length}deg) translateY(-85px)`,
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-2xl drop-shadow-glow">
                          {getPrizeIcon(prize.amount)}
                        </div>
                        <span className="text-lg mt-1 font-bold drop-shadow-md">{prize.amount} USDT</span>
                      </div>
                    </div>
                  );
                })}

                {/* مركز العجلة - تأثير ثلاثي الأبعاد */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center z-10 wheel-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <FaGift className="text-white text-2xl drop-shadow-glow" />
                  </div>
                </div>

                {/* حلقات داخلية للتزيين مع تأثير ثلاثي الأبعاد */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border-2 border-white/30 wheel-ring-outer"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border-2 border-white/20 wheel-ring-inner"></div>

                {/* تأثير انعكاس الضوء */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent wheel-reflection"></div>
              </div>

              {/* ظل العجلة على السطح */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-black/20 rounded-full blur-md z-0"></div>
            </div>

            {/* إضافة CSS للتأثيرات ثلاثية الأبعاد */}
            <style jsx>{`
              .perspective-1000 {
                perspective: 1000px;
              }
              .preserve-3d {
                transform-style: preserve-3d;
              }
              .drop-shadow-glow {
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
              }
              .wheel-center {
                transform: translate(-50%, -50%) translateZ(10px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
              }
              .wheel-ring-outer {
                transform: translate(-50%, -50%) translateZ(5px);
              }
              .wheel-ring-inner {
                transform: translate(-50%, -50%) translateZ(3px);
              }
              .wheel-reflection {
                background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent 70%);
              }
            `}</style>

            <div className="mt-4 p-4 bg-info/10 rounded-lg">
              <p className="text-sm text-foreground-muted text-center">
                معاينة شكل العجلة ثلاثية الأبعاد كما ستظهر للمستخدمين. يمكنك تعديل الألوان والجوائز من خلال الجدول أدناه.
              </p>
            </div>
          </div>
        </div>

        {/* إدارة الجوائز */}
        <div className="card card-primary p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">الجوائز</h2>
            <motion.button
              className="btn btn-sm btn-primary flex items-center gap-2"
              onClick={handleAddPrize}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus />
              إضافة جائزة
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-lighter">
                  <th className="py-2 px-4 text-right">الأيقونة</th>
                  <th className="py-2 px-4 text-right">المبلغ (USDT)</th>
                  <th className="py-2 px-4 text-right">الاحتمالية (%)</th>
                  <th className="py-2 px-4 text-right">اللون</th>
                  <th className="py-2 px-4 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((prize) => (
                  <motion.tr
                    key={prize.id}
                    className="border-b border-background-lighter"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="py-2 px-4 text-center">
                      <div className="flex justify-center">
                        {getPrizeIcon(prize.amount)}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="relative">
                        <input
                          type="number"
                          className="form-input w-full pr-10"
                          value={prize.amount}
                          onChange={(e) => handlePrizeChange(prize.id, 'amount', e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-foreground-muted">
                          USDT
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="relative">
                        <input
                          type="number"
                          className="form-input w-full pr-8"
                          value={prize.probability}
                          onChange={(e) => handlePrizeChange(prize.id, 'probability', e.target.value)}
                          min="1"
                          max="100"
                        />
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-foreground-muted">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="form-input w-12 h-10"
                          value={prize.color}
                          onChange={(e) => handlePrizeChange(prize.id, 'color', e.target.value)}
                        />
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: prize.color }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <motion.button
                        className="btn btn-sm btn-error flex items-center gap-2"
                        onClick={() => handleRemovePrize(prize.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTrash />
                        حذف
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-2 px-4"></td>
                  <td className="py-2 px-4 font-bold">المجموع</td>
                  <td className="py-2 px-4 font-bold">
                    <div className="flex items-center">
                      {prizes.reduce((sum, prize) => sum + prize.probability, 0)}%
                      {prizes.reduce((sum, prize) => sum + prize.probability, 0) === 100 ? (
                        <FaCheck className="text-success mr-2" />
                      ) : (
                        <span className="text-error mr-2">(يجب أن يكون 100%)</span>
                      )}
                    </div>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 p-4 bg-background-light/30 rounded-lg">
            <h3 className="font-bold mb-2">ملاحظات:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground-muted">
              <li>يجب أن يكون مجموع احتمالات الجوائز 100%.</li>
              <li>المكافآت تضاف تلقائيًا إلى رصيد المستخدم بعد لف العجلة.</li>
              <li>المكافآت غير قابلة للسحب ولكن يمكن استخدامها للاستثمار.</li>
              <li>يمكن للمستخدم لف العجلة مرة واحدة كل أسبوع.</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
