import {
  collection,
  addDoc,
  updateDoc,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateUserBalance } from './users';

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
    console.log(`إنشاء معاملة جديدة للمستخدم: ${transaction.userId}, النوع: ${transaction.type}, المبلغ: ${transaction.amount} ${transaction.currency}`);

    const transactionData = {
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
    console.log(`تم إنشاء المعاملة بنجاح. المعرف: ${transactionRef.id}`);

    // تحديث رصيد المستخدم إذا كانت المعاملة مكتملة
    if (transaction.status === 'completed') {
      console.log(`المعاملة مكتملة، جاري تحديث رصيد المستخدم: ${transaction.userId}`);
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

// الحصول على معاملة بواسطة المعرف
export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    console.log(`جلب المعاملة بالمعرف: ${transactionId}`);
    const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));

    if (transactionDoc.exists()) {
      console.log(`تم العثور على المعاملة: ${transactionId}`);
      return { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;
    } else {
      console.log(`لم يتم العثور على المعاملة: ${transactionId}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting transaction by ID:', error);
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
    console.log(`تحديث حالة المعاملة: ${transactionId} إلى: ${status}`);
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    const transaction = { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;
    const oldStatus = transaction.status;

    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (txId) {
      updateData.txId = txId;
    }

    await updateDoc(transactionRef, updateData);
    console.log(`تم تحديث حالة المعاملة من ${oldStatus} إلى ${status}`);

    // تحديث رصيد المستخدم إذا تم تغيير الحالة إلى مكتملة
    if (status === 'completed' && oldStatus !== 'completed') {
      console.log(`تغيير الحالة إلى مكتملة، جاري تحديث رصيد المستخدم: ${transaction.userId}`);
      await updateUserBalance(
        transaction.userId,
        transaction.amount,
        transaction.currency,
        transaction.type
      );
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
    console.log(`جلب معاملات المستخدم: ${userId}, النوع: ${type || 'الكل'}, الحد: ${limit_count}`);

    let q;

    if (type) {
      console.log(`إنشاء استعلام مع فلتر النوع: ${type}`);
      q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    } else {
      console.log('إنشاء استعلام بدون فلتر النوع');
      q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    }

    const transactionsSnapshot = await getDocs(q);
    console.log(`تم العثور على ${transactionsSnapshot.size} معاملة`);

    return transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

// الحصول على جميع المعاملات (للمسؤولين)
export const getAllTransactions = async (
  status?: TransactionStatus,
  type?: TransactionType,
  limit_count: number = 100
): Promise<Transaction[]> => {
  try {
    console.log(`جلب جميع المعاملات، الحالة: ${status || 'الكل'}, النوع: ${type || 'الكل'}, الحد: ${limit_count}`);

    let q;

    if (status && type) {
      q = query(
        collection(db, 'transactions'),
        where('status', '==', status),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    } else if (status) {
      q = query(
        collection(db, 'transactions'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    } else if (type) {
      q = query(
        collection(db, 'transactions'),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    } else {
      q = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
    }

    const transactionsSnapshot = await getDocs(q);
    console.log(`تم العثور على ${transactionsSnapshot.size} معاملة`);

    return transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error getting all transactions:', error);
    throw error;
  }
};

// تنسيق التاريخ
export const formatTransactionDate = (timestamp: any): string => {
  if (!timestamp) return '';

  try {
    const date = timestamp instanceof Timestamp ?
      timestamp.toDate() :
      (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));

    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting transaction date:', error);
    return '';
  }
};
