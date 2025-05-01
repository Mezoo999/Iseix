'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { logoutUser } from '@/firebase/auth';
import { getUserData, createOrUpdateUserData, generateReferralCode, UserData } from '@/services/users';

// تعريف نوع سياق المصادقة
interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// إنشاء سياق المصادقة
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshUserData: async () => {},
});

// مزود سياق المصادقة
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة إنشاء بيانات مستخدم افتراضية
  const createDefaultUserData = (user: User): Partial<UserData> => {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'مستخدم Iseix',
      photoURL: user.photoURL,
      isAdmin: true,
      isOwner: true,
      balances: {
        USDT: 1000000,
        BTC: 0,
        ETH: 0,
        BNB: 0
      },
      totalInvested: 0,
      totalProfit: 0,
      totalDeposited: 100000,
      totalWithdrawn: 0,
      totalReferrals: 0,
      totalReferralEarnings: 0,
      referralCode: generateReferralCode(user.uid),
      referredBy: null,
      emailVerified: user.emailVerified || true,
      membershipLevel: 0
    };
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    // الاستماع لتغييرات حالة المصادقة
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setCurrentUser(user);

      if (user) {
        try {
          console.log('Fetching user data from Firestore for user:', user.uid);
          // جلب بيانات المستخدم من Firestore
          const userDataResult = await getUserData(user.uid);

          if (userDataResult) {
            console.log('User document exists in Firestore');
            setUserData(userDataResult);
            console.log('User data set from Firestore');
          } else {
            console.log('User document does not exist in Firestore, creating it...');

            // إنشاء بيانات مستخدم افتراضية
            const defaultUserData = createDefaultUserData(user);

            // إنشاء وثيقة المستخدم في Firestore
            try {
              await createOrUpdateUserData(user.uid, defaultUserData);
              console.log('User document created successfully');

              // جلب البيانات المحدثة بعد الإنشاء
              const updatedUserData = await getUserData(user.uid);
              setUserData(updatedUserData);
            } catch (createError) {
              console.error('Error creating user document:', createError);
              // استخدام البيانات الافتراضية على أي حال
              setUserData(defaultUserData as UserData);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);

          // في حالة حدوث خطأ (مثل عدم الاتصال)، استخدم البيانات المخزنة محليًا إذا كانت متوفرة
          console.log('Trying to use cached user data');
          const cachedUserData = localStorage.getItem(`userData_${user.uid}`);

          if (cachedUserData) {
            try {
              console.log('Found cached user data');
              setUserData(JSON.parse(cachedUserData) as UserData);
            } catch (parseError) {
              console.error('Error parsing cached user data:', parseError);
              // إنشاء بيانات مستخدم افتراضية
              const defaultUserData = createDefaultUserData(user);
              setUserData(defaultUserData as UserData);
            }
          } else {
            console.log('No cached data, creating default user data');
            // إنشاء بيانات مستخدم افتراضية
            const defaultUserData = createDefaultUserData(user) as UserData;
            setUserData(defaultUserData);
          }
        }
      } else {
        console.log('No user, clearing user data');
        setUserData(null);
        localStorage.removeItem('currentUserData');
      }

      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // تخزين بيانات المستخدم في التخزين المحلي عند تغييرها
  useEffect(() => {
    if (currentUser && userData) {
      try {
        // تحويل التواريخ إلى سلاسل نصية لتجنب أخطاء التحويل إلى JSON
        const userDataToCache = {
          ...userData,
          createdAt: userData.createdAt ? userData.createdAt.toString() : null,
          updatedAt: userData.updatedAt ? userData.updatedAt.toString() : null
        };

        localStorage.setItem(`userData_${currentUser.uid}`, JSON.stringify(userDataToCache));
      } catch (error) {
        console.error('Error caching user data:', error);
      }
    }
  }, [currentUser, userData]);

  // وظيفة تسجيل الخروج
  const logout = async () => {
    try {
      console.log('Logging out user');
      await logoutUser();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // وظيفة تحديث بيانات المستخدم
  const refreshUserData = async () => {
    if (!currentUser) {
      console.error('Cannot refresh user data: No user is logged in');
      return;
    }

    try {
      console.log('Refreshing user data for user:', currentUser.uid);
      const userDataResult = await getUserData(currentUser.uid);

      if (userDataResult) {
        console.log('User data refreshed successfully');
        setUserData(userDataResult);

        // تحديث البيانات في التخزين المحلي
        try {
          const userDataToCache = {
            ...userDataResult,
            createdAt: userDataResult.createdAt ? userDataResult.createdAt.toString() : null,
            updatedAt: userDataResult.updatedAt ? userDataResult.updatedAt.toString() : null
          };
          localStorage.setItem(`userData_${currentUser.uid}`, JSON.stringify(userDataToCache));
          localStorage.setItem('currentUserData', JSON.stringify(userDataToCache));
        } catch (cacheError) {
          console.error('Error caching refreshed user data:', cacheError);
        }
      } else {
        console.error('Failed to refresh user data: No data returned');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// هوك استخدام سياق المصادقة
export const useAuth = () => {
  return useContext(AuthContext);
};
