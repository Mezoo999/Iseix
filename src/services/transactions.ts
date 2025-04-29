import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// أنواع المعاملات
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'referral';

// حالات المعاملات
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// واجهة المعاملة
export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  txId?: string;
  createdAt: any;
  updatedAt: any;
  metadata?: Record<string, any>;
}

// إنشاء معاملة جديدة
export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const transactionData = {
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
    
    // تحديث رصيد المستخدم إذا كانت المعاملة مكتملة
    if (transaction.status === 'completed') {
      await updateUserBalance(
        transaction.userId,
        transaction.amount,
        transaction.currency,
        transaction.type
      );
    }
    
    return transactionRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// تحديث حالة المعاملة
export const updateTransactionStatus = async (
  transactionId: string,
  status: TransactionStatus,
  txId?: string
): Promise<void> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (txId) {
      updateData.txId = txId;
    }
    
    await updateDoc(transactionRef, updateData);
    
    // الحصول على بيانات المعاملة
    const transactionDoc = await getDocs(query(
      collection(db, 'transactions'),
      where('__name__', '==', transactionId),
      limit(1)
    ));
    
    if (!transactionDoc.empty) {
      const transaction = {
        id: transactionDoc.docs[0].id,
        ...transactionDoc.docs[0].data(),
      } as Transaction;
      
      // تحديث رصيد المستخدم إذا تم تغيير الحالة إلى مكتملة
      if (status === 'completed' && transaction.status !== 'completed') {
        await updateUserBalance(
          transaction.userId,
          transaction.amount,
          transaction.currency,
          transaction.type
        );
      }
    }
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// الحصول على معاملات المستخدم
export const getUserTransactions = async (
  userId: string,
  type?: TransactionType,
  limit_count: number = 10
): Promise<Transaction[]> => {
  try {
    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );
    
    if (type) {
      q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    }
    
    const transactionsSnapshot = await getDocs(q);
    
    return transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

// تحديث رصيد المستخدم
const updateUserBalance = async (
  userId: string,
  amount: number,
  currency: string,
  type: TransactionType
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // تحديد ما إذا كان يجب إضافة أو طرح المبلغ
    let amountChange = amount;
    
    if (type === 'withdrawal') {
      amountChange = -amount;
    }
    
    // تحديث الرصيد
    await updateDoc(userRef, {
      [`balances.${currency}`]: increment(amountChange),
      updatedAt: serverTimestamp(),
    });
    
    // تحديث الإحصائيات الأخرى حسب نوع المعاملة
    if (type === 'deposit') {
      await updateDoc(userRef, {
        totalDeposited: increment(amount),
      });
    } else if (type === 'withdrawal') {
      await updateDoc(userRef, {
        totalWithdrawn: increment(amount),
      });
    } else if (type === 'investment') {
      await updateDoc(userRef, {
        totalInvested: increment(amount),
      });
    } else if (type === 'profit') {
      await updateDoc(userRef, {
        totalProfit: increment(amount),
      });
    } else if (type === 'referral') {
      await updateDoc(userRef, {
        totalReferralEarnings: increment(amount),
      });
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
};
