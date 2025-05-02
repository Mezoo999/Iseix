'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaSpinner, FaCoins, FaLock, FaTrophy, FaStar, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { canUserSpinLuckyWheel, spinLuckyWheel, getLuckyWheelSettings, getUserLuckyWheelHistory } from '@/services/rewards';
import { LuckyWheelPrize } from '@/types/rewards';
import { formatDate } from '@/services/users';
import confetti from 'canvas-confetti';

export default function LuckyWheel() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<LuckyWheelPrize | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showRewardBubble, setShowRewardBubble] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // جلب إعدادات العجلة وسجل المستخدم
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);

        // جلب إعدادات العجلة
        const settings = await getLuckyWheelSettings();
        setPrizes(settings.prizes);
        setIsEnabled(settings.isEnabled);

        // جلب سجل المستخدم
        const userHistory = await getUserLuckyWheelHistory(currentUser.uid);

        // التحقق من إمكانية اللف
        const canUserSpin = await canUserSpinLuckyWheel(currentUser.uid);
        setCanSpin(canUserSpin);

        // تعيين تاريخ الإتاحة التالي
        if (userHistory.nextAvailableDate) {
          setNextAvailableDate(userHistory.nextAvailableDate);
        }
      } catch (error) {
        console.error('Error fetching lucky wheel data:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات عجلة الحظ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // تشغيل تأثير الاحتفال
  const triggerConfetti = () => {
    if (typeof window !== 'undefined' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // تشغيل تأثير الاحتفال
      confetti({
        particleCount: 150,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight
        },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#32CD32', '#1E90FF'],
        zIndex: 1000,
      });
    }
  };

  // لف العجلة
  const handleSpin = async () => {
    if (!currentUser || isSpinning || !canSpin || !isEnabled) return;

    try {
      setIsSpinning(true);

      // لف العجلة والحصول على جائزة
      const result = await spinLuckyWheel(currentUser.uid);

      if (result.success && result.reward) {
        // تحديد الجائزة المختارة
        const prize = prizes.find(p => p.amount === result.reward?.amount) || prizes[0];
        setSelectedPrize(prize);

        // حساب زاوية الدوران
        const prizeIndex = prizes.findIndex(p => p.amount === prize.amount);
        const segmentAngle = 360 / prizes.length;
        const targetRotation = 1800 + (prizeIndex * segmentAngle);

        // تعيين الدوران
        setRotation(targetRotation);

        // تحديث حالة اللف
        setCanSpin(false);

        // تحديث تاريخ الإتاحة التالي
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 7);
        setNextAvailableDate(nextDate);

        // عرض رسالة الفقاعة وتشغيل تأثير الاحتفال بعد انتهاء الدوران
        setTimeout(() => {
          setShowRewardBubble(true); // عرض رسالة الفقاعة
          triggerConfetti();

          // إخفاء رسالة الفقاعة بعد 5 ثوانٍ
          setTimeout(() => {
            setShowRewardBubble(false);
          }, 5000);
        }, 5000);
      } else {
        toast.error('حدث خطأ أثناء لف العجلة');
        setIsSpinning(false);
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
      toast.error('حدث خطأ أثناء لف العجلة');
      setIsSpinning(false);
    }
  };

  // إعادة تعيين العجلة بعد انتهاء الدوران
  const handleAnimationComplete = () => {
    setTimeout(() => {
      setIsSpinning(false);
    }, 1000);
  };

  // إذا كانت العجلة غير متاحة
  if (!isEnabled && !isLoading) {
    return (
      <div className="card card-primary p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <FaLock className="text-4xl text-foreground-muted mb-4" />
          <h3 className="text-xl font-bold mb-2">عجلة الحظ غير متاحة حاليًا</h3>
          <p className="text-foreground-muted">
            عجلة الحظ غير متاحة حاليًا. يرجى المحاولة لاحقًا.
          </p>
        </div>
      </div>
    );
  }

  // تحديد أيقونة لكل جائزة
  const getPrizeIcon = (amount: number) => {
    if (amount >= 2) return <FaTrophy className="text-yellow-500" />;
    if (amount >= 1.5) return <FaStar className="text-yellow-400" />;
    if (amount >= 1) return <FaCoins className="text-yellow-300" />;
    return <FaMoneyBillWave className="text-green-400" />;
  };

  // تحديد لون متدرج لكل جائزة
  const getPrizeGradient = (color: string): string => {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'from-blue-500 to-blue-700', // أزرق
      '#10B981': 'from-green-500 to-green-700', // أخضر
      '#F59E0B': 'from-yellow-500 to-yellow-700', // أصفر
      '#EF4444': 'from-red-500 to-red-700', // أحمر
      '#8B5CF6': 'from-purple-500 to-purple-700', // بنفسجي
      '#EC4899': 'from-pink-500 to-pink-700', // وردي
    };

    // إرجاع اللون المتدرج المناسب أو لون افتراضي
    return colorMap[color] || 'from-gray-500 to-gray-700';
  };

  return (
    <div className="card card-primary p-6 relative" ref={containerRef}>
      {/* رسالة الفقاعة */}
      <AnimatePresence>
        {showRewardBubble && selectedPrize && (
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-r from-success to-success-dark p-4 rounded-lg shadow-xl text-white flex items-center gap-3 min-w-[250px]">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
              <div>
                <p className="font-bold text-lg">تمت إضافة المكافأة!</p>
                <p className="text-sm">
                  <span className="font-bold">{selectedPrize.amount} USDT</span> أضيفت إلى رصيدك
                </p>
              </div>
            </div>
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-success-dark mx-auto"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 text-gradient">عجلة الحظ</h3>
        <p className="text-foreground-muted">
          لف العجلة واحصل على مكافأة عشوائية! المكافآت غير قابلة للسحب ولكن يمكن استثمارها.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="text-4xl animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* العجلة ثلاثية الأبعاد */}
          <div className="relative w-80 h-80 mb-8 perspective-1000">
            {/* الإطار الخارجي للعجلة */}
            <div className="absolute inset-0 rounded-full border-8 border-primary/30 shadow-lg transform-gpu -rotate-x-12 z-0"></div>

            {/* مؤشر العجلة */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-20">
              <div className="w-10 h-10 bg-gradient-to-b from-primary to-primary-dark shadow-xl rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg"></div>
              </div>
            </div>

            {/* العجلة الدوارة ثلاثية الأبعاد */}
            <motion.div
              ref={wheelRef}
              className="w-full h-full rounded-full overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.4)] transform-gpu -rotate-x-12 preserve-3d"
              style={{
                backgroundImage: `conic-gradient(${prizes.map((prize, index) =>
                  `${prize.color} ${index * (360 / prizes.length)}deg ${(index + 1) * (360 / prizes.length)}deg`
                ).join(', ')})`,
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
              }}
              animate={{
                rotate: rotation,
                boxShadow: isSpinning
                  ? ["0 10px 25px rgba(0,0,0,0.3)", "0 15px 35px rgba(0,0,0,0.5)", "0 10px 25px rgba(0,0,0,0.3)"]
                  : "0 10px 25px rgba(0,0,0,0.3)"
              }}
              transition={{
                rotate: { duration: 5, ease: "easeOut" },
                boxShadow: { duration: 5, repeat: 0 }
              }}
              onAnimationComplete={handleAnimationComplete}
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
            </motion.div>

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

          {/* زر اللف */}
          <motion.button
            className={`btn ${canSpin && isEnabled ? 'btn-primary' : 'btn-disabled'} flex items-center gap-2 px-8 py-3 text-lg shadow-lg`}
            onClick={handleSpin}
            disabled={!canSpin || isSpinning || !isEnabled}
            whileHover={canSpin && isEnabled ? { scale: 1.05 } : {}}
            whileTap={canSpin && isEnabled ? { scale: 0.95 } : {}}
          >
            {isSpinning ? (
              <>
                <FaSpinner className="animate-spin" />
                جاري اللف...
              </>
            ) : (
              <>
                <FaCoins className="text-yellow-300" />
                {canSpin ? 'لف العجلة' : 'غير متاح حاليًا'}
              </>
            )}
          </motion.button>

          {/* معلومات الإتاحة التالية */}
          {!canSpin && nextAvailableDate && (
            <div className="mt-4 p-3 bg-background-light/30 rounded-lg text-center">
              <p className="text-sm text-foreground-muted">
                ستتمكن من لف العجلة مرة أخرى في:
                <span className="font-bold text-primary mr-1">{formatDate(nextAvailableDate)}</span>
              </p>
            </div>
          )}

          {/* معلومات الجائزة */}
          {selectedPrize && !isSpinning && (
            <motion.div
              className="mt-6 p-6 bg-gradient-to-r from-success/20 to-primary/20 rounded-lg text-center shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-success/30 flex items-center justify-center">
                  {getPrizeIcon(selectedPrize.amount)}
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2">مبروك!</h4>
              <p className="text-success font-bold text-2xl mb-2">
                لقد ربحت {selectedPrize.amount} USDT
              </p>
              <p className="text-sm text-foreground-muted">
                تمت إضافة المكافأة إلى رصيدك. المكافأة غير قابلة للسحب ولكن يمكن استثمارها.
              </p>
            </motion.div>
          )}

          {/* قائمة الجوائز المحتملة */}
          <div className="mt-8 w-full">
            <h4 className="text-lg font-bold mb-3 text-center">الجوائز المحتملة</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {prizes.map((prize) => (
                <div
                  key={prize.id}
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: `${prize.color}30` }}
                >
                  <div className="flex justify-center mb-2">
                    {getPrizeIcon(prize.amount)}
                  </div>
                  <p className="font-bold">{prize.amount} USDT</p>
                  <p className="text-xs text-foreground-muted">احتمالية: {prize.probability}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
