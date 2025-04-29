'use client';

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function UpdateUsersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatedCount, setUpdatedCount] = useState(0);

  // تحديث بيانات المستخدمين
  const updateUsers = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');
    setUpdatedCount(0);

    try {
      // الحصول على جميع المستخدمين
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      if (usersSnapshot.empty) {
        setMessage('لا يوجد مستخدمين للتحديث');
        setIsLoading(false);
        return;
      }
      
      let count = 0;
      
      // تحديث كل مستخدم
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const updates: any = {};
        
        // إضافة حقل balances إذا لم يكن موجودًا
        if (!userData.balances) {
          updates.balances = {
            USDT: userData.balance || 0
          };
        }
        
        // إضافة حقول إضافية إذا لم تكن موجودة
        if (userData.totalDeposited === undefined) {
          updates.totalDeposited = 0;
        }
        
        if (userData.totalWithdrawn === undefined) {
          updates.totalWithdrawn = 0;
        }
        
        if (userData.totalReferrals === undefined) {
          updates.totalReferrals = 0;
        }
        
        if (userData.totalReferralEarnings === undefined) {
          updates.totalReferralEarnings = 0;
        }
        
        if (userData.updatedAt === undefined) {
          updates.updatedAt = serverTimestamp();
        }
        
        // تحديث المستخدم إذا كانت هناك تحديثات
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', userDoc.id), updates);
          count++;
        }
      }
      
      setUpdatedCount(count);
      setMessage(`تم تحديث ${count} مستخدم بنجاح`);
    } catch (error) {
      console.error('Error updating users:', error);
      setError('حدث خطأ أثناء تحديث المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">تحديث بيانات المستخدمين</h1>
          
          {message && (
            <div className="bg-success/20 text-success p-4 rounded-lg mb-6">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-error/20 text-error p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">تحديث هيكل بيانات المستخدمين</h2>
            
            <p className="mb-6">
              سيقوم هذا السكريبت بتحديث بيانات المستخدمين الحاليين لتتوافق مع الهيكل الجديد.
              سيتم إضافة الحقول التالية إذا لم تكن موجودة:
            </p>
            
            <ul className="list-disc list-inside mb-6">
              <li>balances: لتخزين أرصدة العملات المختلفة</li>
              <li>totalDeposited: إجمالي المبالغ المودعة</li>
              <li>totalWithdrawn: إجمالي المبالغ المسحوبة</li>
              <li>totalReferrals: إجمالي عدد الإحالات</li>
              <li>totalReferralEarnings: إجمالي أرباح الإحالات</li>
              <li>updatedAt: تاريخ آخر تحديث</li>
            </ul>
            
            <div className="flex items-center">
              <button
                className="btn btn-primary"
                onClick={updateUsers}
                disabled={isLoading}
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث المستخدمين'}
              </button>
              
              {updatedCount > 0 && (
                <span className="mr-4 text-success">
                  تم تحديث {updatedCount} مستخدم
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
