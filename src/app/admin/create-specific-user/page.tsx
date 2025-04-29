'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaUserPlus } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function CreateSpecificUserPage() {
  const router = useRouter();
  
  const [userId, setUserId] = useState('PAeCtT8GNoYwRTiLM1CjYL59a3J3'); // معرف المستخدم الخاص بك
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);
  
  // التحقق من وجود وثيقة المستخدم
  const checkUserDoc = async () => {
    if (!userId) {
      setError('يرجى إدخال معرف المستخدم');
      return;
    }
    
    setIsChecking(true);
    setError('');
    setUserExists(null);
    
    try {
      console.log('التحقق من وثيقة المستخدم...');
      console.log('معرف المستخدم:', userId);
      
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      const exists = userDocSnap.exists();
      console.log('هل وثيقة المستخدم موجودة؟', exists);
      
      setUserExists(exists);
      
      if (exists) {
        setSuccess('وثيقة المستخدم موجودة بالفعل');
      }
    } catch (error: any) {
      console.error('Error checking user document:', error);
      setError(`حدث خطأ أثناء التحقق من وثيقة المستخدم: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  // إنشاء وثيقة المستخدم
  const createUserDoc = async () => {
    if (!userId) {
      setError('يرجى إدخال معرف المستخدم');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('بدء عملية إنشاء وثيقة المستخدم...');
      console.log('معرف المستخدم:', userId);
      
      // إنشاء وثيقة المستخدم
      const userRef = doc(db, 'users', userId);
      
      // بيانات المستخدم الافتراضية
      const userData = {
        uid: userId,
        email: 'user@example.com', // يمكن تحديثه لاحقًا
        displayName: 'مستخدم Iseix',
        photoURL: null,
        isAdmin: true,
        isOwner: true,
        balances: {
          USDT: 0
        },
        totalInvested: 0,
        totalProfit: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalReferrals: 0,
        totalReferralEarnings: 0,
        referralCode: generateReferralCode(),
        referredBy: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // إنشاء الوثيقة
      await setDoc(userRef, userData);
      
      console.log('تم إنشاء وثيقة المستخدم بنجاح');
      
      setSuccess('تم إنشاء وثيقة المستخدم بنجاح! يمكنك الآن تعيين نفسك كمالك للمنصة.');
      setUserExists(true);
      
      // الانتقال إلى صفحة تعيين المالك بعد ثوانٍ قليلة
      setTimeout(() => {
        router.push('/admin/make-me-owner');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating user document:', error);
      setError(`حدث خطأ أثناء إنشاء وثيقة المستخدم: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // إنشاء رمز إحالة عشوائي
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">إنشاء وثيقة مستخدم محدد</h1>
          
          {error && (
            <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
              <FaExclamationTriangle className="inline ml-2" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-success/20 text-success p-4 rounded-lg mb-6">
              <FaCheckCircle className="inline ml-2" />
              {success}
            </div>
          )}
          
          <div className="glass-effect p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">معلومات المستخدم</h2>
            
            <div className="mb-6">
              <label className="block mb-2 font-medium">معرف المستخدم</label>
              <input
                type="text"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 font-mono"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-foreground-muted mt-1">معرف المستخدم الخاص بك: PAeCtT8GNoYwRTiLM1CjYL59a3J3</p>
            </div>
            
            <div className="flex gap-4 mb-6">
              <button
                className="btn btn-outline"
                onClick={checkUserDoc}
                disabled={isChecking || !userId}
              >
                {isChecking ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري التحقق...
                  </span>
                ) : (
                  <span>التحقق من وجود الوثيقة</span>
                )}
              </button>
              
              <button
                className="btn btn-primary"
                onClick={createUserDoc}
                disabled={isLoading || !userId || userExists === true}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaUserPlus className="ml-2" />
                    إنشاء وثيقة المستخدم
                  </span>
                )}
              </button>
            </div>
            
            {userExists !== null && (
              <div className={`p-4 rounded-lg ${userExists ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                <p className="font-medium">
                  {userExists ? (
                    <span className="flex items-center">
                      <FaCheckCircle className="ml-2" />
                      وثيقة المستخدم موجودة بالفعل
                    </span>
                  ) : (
                    <span>وثيقة المستخدم غير موجودة</span>
                  )}
                </p>
                
                {userExists && (
                  <div className="mt-4">
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push('/admin/make-me-owner')}
                    >
                      الذهاب إلى صفحة تعيين المالك
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-info/10 p-4 rounded-lg mb-6">
            <p className="font-medium text-info mb-2">معلومات هامة</p>
            <ul className="list-disc list-inside text-sm">
              <li>تستخدم هذه الصفحة لإنشاء وثيقة مستخدم محدد في قاعدة البيانات.</li>
              <li>تم تعيين معرف المستخدم الخاص بك تلقائيًا (PAeCtT8GNoYwRTiLM1CjYL59a3J3).</li>
              <li>بعد إنشاء وثيقة المستخدم، يمكنك الانتقال إلى صفحة تعيين المالك.</li>
              <li>استخدم هذه الصفحة مرة واحدة فقط عند إعداد المنصة لأول مرة.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
