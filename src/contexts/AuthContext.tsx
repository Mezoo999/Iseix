'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { logoutUser } from '@/firebase/auth';

// تعريف نوع بيانات المستخدم
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  isAdmin: boolean;
  isOwner?: boolean; // علامة خاصة لمالك المنصة
  balances?: {
    [currency: string]: number;
  };
  totalInvested: number;
  totalProfit: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalReferrals?: number;
  totalReferralEarnings?: number;
  referralCode: string;
  referredBy: string | null;
  emailVerified: boolean;
  membershipLevel?: string; // مستوى العضوية
  createdAt: any;
  updatedAt?: any;
}

// تعريف نوع سياق المصادقة
interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// إنشاء سياق المصادقة
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

// مزود سياق المصادقة
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة إنشاء رمز إحالة فريد
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // دالة إنشاء بيانات مستخدم افتراضية
  const createDefaultUserData = (user: User): UserData => {
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
      referralCode: generateReferralCode(),
      referredBy: null,
      emailVerified: user.emailVerified || true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (userDoc.exists()) {
            console.log('User document exists in Firestore');
            const firestoreData = userDoc.data() as UserData;
            setUserData(firestoreData);
            console.log('User data set from Firestore');
          } else {
            console.log('User document does not exist in Firestore, creating it...');

            // إنشاء بيانات مستخدم افتراضية
            const defaultUserData = createDefaultUserData(user);

            // إنشاء وثيقة المستخدم في Firestore
            try {
              await setDoc(doc(db, 'users', user.uid), defaultUserData);
              console.log('User document created successfully');
              setUserData(defaultUserData);
            } catch (createError) {
              console.error('Error creating user document:', createError);
              // استخدام البيانات الافتراضية على أي حال
              setUserData(defaultUserData);
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
              setUserData(defaultUserData);
            }
          } else {
            console.log('No cached data, creating default user data');
            // إنشاء بيانات مستخدم افتراضية
            const defaultUserData = {
              ...createDefaultUserData(user),
              createdAt: new Date(),
              updatedAt: new Date()
            };
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

  const value = {
    currentUser,
    userData,
    loading,
    logout,
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
