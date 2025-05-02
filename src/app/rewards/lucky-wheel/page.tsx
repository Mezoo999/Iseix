'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaGift, FaCoins, FaMoneyBillWave, FaClock, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import LuckyWheel from '@/components/rewards/LuckyWheel';
import { getUserRewards } from '@/services/rewards';
import { Reward } from '@/types/rewards';
import { formatDate } from '@/services/users';

export default function LuckyWheelPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب مكافآت المستخدم
  useEffect(() => {
    const fetchRewards = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const userRewards = await getUserRewards(currentUser.uid);
        setRewards(userRewards.filter(reward => reward.type === 'lucky_wheel'));
      } catch (error) {
        console.error('Error fetching user rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchRewards();
    }
  }, [currentUser]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="text-4xl animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gradient">عجلة الحظ</h1>
        <p className="text-foreground-muted max-w-2xl mx-auto">
          جرب حظك واحصل على مكافآت عشوائية! لف العجلة مرة واحدة كل أسبوع واحصل على مكافأة فورية تضاف إلى رصيدك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* عجلة الحظ */}
        <div className="md:col-span-1">
          <LuckyWheel />
        </div>

        {/* سجل المكافآت */}
        <div className="md:col-span-1">
          <div className="card card-primary p-6">
            <h2 className="text-xl font-bold mb-4">سجل المكافآت</h2>

            {rewards.length === 0 ? (
              <div className="text-center py-8">
                <FaGift className="text-4xl text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">
                  لم تحصل على أي مكافآت من عجلة الحظ بعد. جرب حظك الآن!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-background-lighter">
                      <th className="py-2 px-4 text-right">التاريخ</th>
                      <th className="py-2 px-4 text-right">المبلغ</th>
                      <th className="py-2 px-4 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map((reward) => (
                      <tr key={reward.id} className="border-b border-background-lighter hover:bg-background-light/20 transition-colors">
                        <td className="py-3 px-4">
                          {formatDate(reward.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-success mr-2">{reward.amount}</span>
                            <span className="text-sm text-foreground-muted">USDT</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span>
                            <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">
                              تم الإضافة للرصيد
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 p-5 bg-gradient-to-br from-background-light/30 to-background-light/10 rounded-lg border border-background-light/20 shadow-inner">
              <h3 className="font-bold mb-3 flex items-center text-lg">
                <FaInfoCircle className="text-primary mr-2" />
                معلومات المكافآت
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="mt-1 mr-2 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FaCoins className="text-primary text-xs" />
                  </div>
                  <span>المكافآت تضاف تلقائياً إلى رصيدك فور الفوز بها.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <FaMoneyBillWave className="text-warning text-xs" />
                  </div>
                  <span>المكافآت من عجلة الحظ غير قابلة للسحب ولكن يمكن استخدامها للاستثمار.</span>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-2 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <FaClock className="text-success text-xs" />
                  </div>
                  <span>يمكنك لف العجلة مرة واحدة كل أسبوع للحصول على مكافأة جديدة.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
