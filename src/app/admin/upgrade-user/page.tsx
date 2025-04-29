'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { FaUserShield, FaUserCheck, FaExclamationTriangle, FaCheckCircle, FaArrowUp } from 'react-icons/fa';
import { MEMBERSHIP_LEVEL_NAMES } from '@/services/dailyTasks';

export default function UpgradeUserPage() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [userId, setUserId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (!userData?.isOwner) {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

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
    setCurrentLevel(0);
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserFound(true);
        setUserName(userData.displayName || userData.email || 'مستخدم بدون اسم');
        setCurrentLevel(userData.membershipLevel || 0);
        setNewLevel(userData.membershipLevel || 0);
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
  
  // ترقية مستوى المستخدم
  const upgradeUser = async (e) => {
    e.preventDefault();
    
    if (!userFound) {
      setError('يرجى التحقق من وجود المستخدم أولاً');
      return;
    }
    
    if (newLevel === currentLevel) {
      setError('يرجى اختيار مستوى مختلف عن المستوى الحالي');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setError('');
    
    try {
      // تحديث مستوى المستخدم في قاعدة البيانات
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        membershipLevel: newLevel,
        updatedAt: serverTimestamp(),
      });
      
      setMessage(`تم ترقية المستخدم ${userName} من ${MEMBERSHIP_LEVEL_NAMES[currentLevel]} إلى ${MEMBERSHIP_LEVEL_NAMES[newLevel]} بنجاح`);
      setCurrentLevel(newLevel);
    } catch (error) {
      console.error('Error upgrading user:', error);
      setError('حدث خطأ أثناء ترقية المستخدم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ترقية مستوى المستخدم</h1>
        <p className="text-foreground-muted">ترقية مستوى العضوية للمستخدمين في المنصة.</p>
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
            <FaUserShield className="text-xl" />
          </div>
          <h2 className="text-xl font-bold">ترقية مستوى المستخدم</h2>
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
                <p className="text-sm">المستوى الحالي: {MEMBERSHIP_LEVEL_NAMES[currentLevel]}</p>
              </div>
            </div>
          )}
        </div>
        
        {userFound && (
          <form onSubmit={upgradeUser}>
            <div className="mb-6">
              <label htmlFor="newLevel" className="block mb-2 font-medium">
                المستوى الجديد
              </label>
              <select
                id="newLevel"
                className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                value={newLevel}
                onChange={(e) => setNewLevel(Number(e.target.value))}
              >
                {Object.keys(MEMBERSHIP_LEVEL_NAMES).map((level) => (
                  <option key={level} value={level}>
                    {MEMBERSHIP_LEVEL_NAMES[level]}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center justify-center"
              disabled={isLoading || newLevel === currentLevel}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري ترقية المستخدم...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaArrowUp className="ml-2" />
                  ترقية المستخدم
                </span>
              )}
            </button>
          </form>
        )}
        
        <div className="mt-6 p-4 bg-info/10 text-info rounded-lg">
          <p className="font-medium">ملاحظات هامة:</p>
          <ul className="text-sm list-disc mr-5 mt-2 space-y-1">
            <li>ترقية المستوى تؤثر على معدل الربح اليومي للمستخدم.</li>
            <li>يمكن للمستخدم الاستفادة من المزايا الجديدة فور الترقية.</li>
            <li>تأكد من اختيار المستوى المناسب للمستخدم.</li>
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
