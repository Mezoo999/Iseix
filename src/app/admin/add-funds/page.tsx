'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from '@/services/transactions';
import { FaMoneyBillWave, FaUserCheck, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function AddFundsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [coin, setCoin] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userFound, setUserFound] = useState(false);
  const [userName, setUserName] = useState('');

  // التحقق من وجود المستخدم
  const checkUser = async () => {
    if (!userId) {
      setError('يرجى إدخال معرف المستخدم');
      return;
    }

    setIsChecking(true);
    setError('');
    setUserFound(false);
    setUserName('');

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserFound(true);
        setUserName(userData.displayName || userData.email || 'مستخدم بدون اسم');
        setError('');
      } else {
        setError('لم يتم العثور على المستخدم. يرجى التأكد من معرف المستخدم');
        setUserFound(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('حدث خطأ أثناء التحقق من المستخدم');
      setUserFound(false);
    } finally {
      setIsChecking(false);
    }
  };

  // إضافة أموال للمستخدم
  const addFunds = async (e) => {
    e.preventDefault();

    if (!userId || !amount || parseFloat(amount) <= 0) {
      setError('يرجى إدخال معرف المستخدم والمبلغ بشكل صحيح');
      return;
    }

    if (!userFound) {
      setError('يرجى التحقق من وجود المستخدم أولاً');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const amountValue = parseFloat(amount);
      const timestamp = serverTimestamp();

      // تحديث رصيد المستخدم
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`balances.${coin}`]: increment(amountValue),
        totalDeposited: increment(amountValue),
        updatedAt: timestamp,
      });

      // إنشاء معاملة إيداع
      await createTransaction({
        userId,
        type: 'deposit',
        amount: amountValue,
        currency: coin,
        status: 'completed',
        description: `إضافة رصيد بواسطة المشرف: ${amountValue} ${coin}`,
        createdAt: new Date(),
        metadata: {
          isAdminDeposit: true,
          userName: userName
        }
      });

      setMessage(`تم إضافة ${amountValue} ${coin} إلى حساب المستخدم ${userName} (${userId}) بنجاح`);
      setAmount('');
    } catch (error) {
      console.error('Error adding funds:', error);
      setError('حدث خطأ أثناء إضافة الأموال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إضافة رصيد للمستخدمين</h1>
        <p className="text-foreground-muted">إضافة رصيد لحسابات المستخدمين وتسجيل المعاملات</p>
      </div>

          {message && (
        <div className="bg-success/20 text-success p-4 rounded-lg mb-6 flex items-center">
          <FaCheckCircle className="ml-2 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-error/20 text-error p-4 rounded-lg mb-6 flex items-center">
          <FaExclamationTriangle className="ml-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-background-light p-6 rounded-xl shadow-sm border border-primary/10 hover:border-primary/30 transition-colors">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary/10 text-primary ml-3">
            <FaMoneyBillWave className="text-xl" />
          </div>
          <h2 className="text-xl font-bold">إضافة رصيد لحساب مستخدم</h2>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="userId" className="block mb-2 font-medium">
                معرف المستخدم
              </label>
              <input
                type="text"
                id="userId"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل معرف المستخدم"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              onClick={checkUser}
              disabled={isChecking || !userId}
            >
              {isChecking ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري التحقق...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaUserCheck className="ml-2" />
                  التحقق من المستخدم
                </span>
              )}
            </button>
          </div>

          {userFound && (
            <div className="mt-4 p-4 bg-success/10 text-success rounded-lg flex items-center">
              <FaCheckCircle className="ml-2 flex-shrink-0" />
              <div>
                <p className="font-medium">تم العثور على المستخدم</p>
                <p className="text-sm">الاسم: {userName}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={addFunds}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="coin" className="block mb-2 font-medium">
                العملة
              </label>
              <select
                id="coin"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                disabled={!userFound}
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="BNB">BNB (Binance Coin)</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block mb-2 font-medium">
                المبلغ
              </label>
              <input
                type="number"
                id="amount"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                placeholder="أدخل المبلغ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step={coin === 'BTC' ? '0.00000001' : '0.01'}
                required
                disabled={!userFound}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
            disabled={isLoading || !userFound}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري إضافة الرصيد...
              </span>
            ) : (
              <span className="flex items-center">
                <FaMoneyBillWave className="ml-2" />
                إضافة الرصيد
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-info/10 text-info rounded-lg">
          <p className="font-medium">ملاحظات هامة:</p>
          <ul className="text-sm list-disc mr-5 mt-2 space-y-1">
            <li>تأكد من إدخال معرف المستخدم الصحيح قبل إضافة الرصيد.</li>
            <li>سيتم تسجيل جميع المعاملات في سجل المعاملات.</li>
            <li>يمكن للمستخدم استخدام الرصيد المضاف فورًا.</li>
          </ul>
        </div>
          </div>

          {/* زر العودة إلى لوحة المشرف */}
          <div className="mt-8">
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              onClick={() => router.push('/admin')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              العودة إلى لوحة المشرف
            </button>
          </div>
        </div>
  );
}
