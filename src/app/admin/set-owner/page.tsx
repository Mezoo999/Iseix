'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaUser, FaCrown } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function SetOwnerPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();

  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // التحقق من صلاحيات المالك
  useEffect(() => {
    if (!loading && currentUser) {
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      }
    } else if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, loading, router]);

  // البحث عن مستخدم
  const searchUser = async () => {
    if (!userId && !userEmail) {
      setError('يرجى إدخال معرف المستخدم أو البريد الإلكتروني');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundUser(null);

    try {
      let userDoc;

      if (userId) {
        // البحث باستخدام معرف المستخدم
        userDoc = await getDoc(doc(db, 'users', userId));
      } else {
        // البحث باستخدام البريد الإلكتروني غير متاح مباشرة في Firestore
        // يمكن تنفيذ ذلك باستخدام Cloud Functions أو البحث في جميع المستخدمين
        setError('البحث باستخدام البريد الإلكتروني غير متاح حاليًا. يرجى استخدام معرف المستخدم.');
        setIsSearching(false);
        return;
      }

      if (userDoc.exists()) {
        setFoundUser({
          id: userDoc.id,
          ...userDoc.data()
        });
      } else {
        setError('لم يتم العثور على المستخدم');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      setError('حدث خطأ أثناء البحث عن المستخدم');
    } finally {
      setIsSearching(false);
    }
  };

  // تعيين المستخدم كمالك
  const setAsOwner = async () => {
    if (!foundUser) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', foundUser.id);

      await updateDoc(userRef, {
        isOwner: true,
        isAdmin: true // تعيين المستخدم كمسؤول أيضًا
      });

      setSuccess(`تم تعيين المستخدم ${foundUser.email || foundUser.id} كمالك للمنصة بنجاح`);
      setFoundUser({
        ...foundUser,
        isOwner: true,
        isAdmin: true
      });
    } catch (error) {
      console.error('Error setting user as owner:', error);
      setError('حدث خطأ أثناء تعيين المستخدم كمالك');
    } finally {
      setIsLoading(false);
    }
  };

  // إلغاء تعيين المستخدم كمالك
  const removeAsOwner = async () => {
    if (!foundUser) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', foundUser.id);

      await updateDoc(userRef, {
        isOwner: false
      });

      setSuccess(`تم إلغاء تعيين المستخدم ${foundUser.email || foundUser.id} كمالك للمنصة بنجاح`);
      setFoundUser({
        ...foundUser,
        isOwner: false
      });
    } catch (error) {
      console.error('Error removing user as owner:', error);
      setError('حدث خطأ أثناء إلغاء تعيين المستخدم كمالك');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !userData?.isOwner) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">تعيين مالك المنصة</h1>

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
            <h2 className="text-xl font-bold mb-4">البحث عن مستخدم</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 font-medium">معرف المستخدم</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل معرف المستخدم"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  placeholder="أدخل البريد الإلكتروني للمستخدم"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={true} // تعطيل البحث بالبريد الإلكتروني حاليًا
                />
                <p className="text-xs text-foreground-muted mt-1">البحث بالبريد الإلكتروني غير متاح حاليًا</p>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={searchUser}
              disabled={isSearching || (!userId && !userEmail)}
            >
              {isSearching ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin ml-2" />
                  جاري البحث...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaUser className="ml-2" />
                  بحث
                </span>
              )}
            </button>
          </div>

          {foundUser && (
            <div className="glass-effect p-6 rounded-xl mb-8">
              <h2 className="text-xl font-bold mb-4">معلومات المستخدم</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-foreground-muted text-sm">معرف المستخدم</p>
                  <p className="font-mono">{foundUser.id}</p>
                </div>

                <div>
                  <p className="text-foreground-muted text-sm">البريد الإلكتروني</p>
                  <p>{foundUser.email || 'غير متوفر'}</p>
                </div>

                <div>
                  <p className="text-foreground-muted text-sm">الاسم</p>
                  <p>{foundUser.displayName || 'غير متوفر'}</p>
                </div>

                <div>
                  <p className="text-foreground-muted text-sm">تاريخ التسجيل</p>
                  <p>
                    {foundUser.createdAt?.toDate
                      ? new Date(foundUser.createdAt.toDate()).toLocaleDateString('ar-SA')
                      : 'غير متوفر'}
                  </p>
                </div>

                <div>
                  <p className="text-foreground-muted text-sm">الصلاحيات</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {foundUser.isOwner && (
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center">
                        <FaCrown className="ml-1" />
                        مالك المنصة
                      </span>
                    )}

                    {foundUser.isAdmin && (
                      <span className="px-2 py-1 bg-info/20 text-info rounded-full text-xs">
                        مسؤول
                      </span>
                    )}

                    {!foundUser.isAdmin && !foundUser.isOwner && (
                      <span className="px-2 py-1 bg-background-lighter text-foreground-muted rounded-full text-xs">
                        مستخدم عادي
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {!foundUser.isOwner ? (
                  <button
                    className="btn btn-primary"
                    onClick={setAsOwner}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin ml-2" />
                        جاري المعالجة...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaCrown className="ml-2" />
                        تعيين كمالك للمنصة
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-error"
                    onClick={removeAsOwner}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin ml-2" />
                        جاري المعالجة...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaCrown className="ml-2" />
                        إلغاء تعيين كمالك
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-info/10 p-4 rounded-lg mb-6">
            <p className="font-medium text-info mb-2">معلومات هامة</p>
            <ul className="list-disc list-inside text-sm">
              <li>يمكن تعيين مستخدم واحد فقط كمالك للمنصة.</li>
              <li>مالك المنصة لديه صلاحيات كاملة للوصول إلى جميع الميزات الإدارية.</li>
              <li>يمكن لمالك المنصة فقط الوصول إلى صفحة إدارة طلبات الإيداع.</li>
              <li>تأكد من تعيين مستخدم موثوق به كمالك للمنصة.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
