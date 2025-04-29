import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';

// واجهة طلب السحب
export interface WithdrawalRequest {
  id?: string;
  userId: string;
  coin: string;
  network: string;
  amount: number;
  address: string;
  addressTag?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  txId?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

// الحصول على جميع طلبات السحب (للمسؤولين)
export const getAllWithdrawalRequests = async (status?: 'pending' | 'approved' | 'rejected' | 'processing'): Promise<WithdrawalRequest[]> => {
  try {
    let q;

    // استعلام مع ترتيب حسب تاريخ الإنشاء (تنازلي)
    if (status) {
      q = query(
        collection(db, 'withdrawals'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'withdrawals'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const withdrawalRequests: WithdrawalRequest[] = [];

    querySnapshot.forEach((doc) => {
      withdrawalRequests.push({
        id: doc.id,
        ...doc.data()
      } as WithdrawalRequest);
    });

    // ترتيب النتائج يدويًا حسب تاريخ الإنشاء (من الأحدث إلى الأقدم)
    return withdrawalRequests.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error getting all withdrawal requests:', error);
    throw error;
  }
};

// الحصول على طلبات السحب للمستخدم
export const getUserWithdrawalRequests = async (userId: string): Promise<WithdrawalRequest[]> => {
  try {
    // استعلام مع ترتيب حسب تاريخ الإنشاء (تنازلي)
    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const withdrawalRequests: WithdrawalRequest[] = [];

    querySnapshot.forEach((doc) => {
      withdrawalRequests.push({
        id: doc.id,
        ...doc.data()
      } as WithdrawalRequest);
    });

    // ترتيب النتائج يدويًا حسب تاريخ الإنشاء (من الأحدث إلى الأقدم)
    return withdrawalRequests.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error getting user withdrawal requests:', error);
    throw error;
  }
};

// الموافقة على طلب سحب
export const approveWithdrawalRequest = async (
  requestId: string,
  adminId: string,
  txId?: string,
  notes?: string
): Promise<void> => {
  try {
    // الحصول على طلب السحب
    const requestRef = doc(db, 'withdrawals', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Withdrawal request not found');
    }

    const requestData = requestSnap.data() as WithdrawalRequest;

    // التحقق من أن الطلب في حالة معلقة
    if (requestData.status !== 'pending' && requestData.status !== 'processing') {
      throw new Error('Withdrawal request is not in pending or processing status');
    }

    // تحديث حالة الطلب
    await updateDoc(requestRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      txId: txId || requestData.txId || `tx_${Math.random().toString(36).substring(2, 15)}`,
      notes: notes || 'تمت الموافقة على طلب السحب',
      updatedAt: serverTimestamp()
    });

    // إنشاء معاملة سحب مكتملة
    await createTransaction({
      userId: requestData.userId,
      type: 'withdrawal',
      amount: requestData.amount,
      currency: requestData.coin,
      status: 'completed',
      description: `سحب ${requestData.amount} ${requestData.coin} على شبكة ${requestData.network}`,
      metadata: {
        withdrawalRequestId: requestId,
        address: requestData.address,
        network: requestData.network,
        txId: txId || requestData.txId || `tx_${Math.random().toString(36).substring(2, 15)}`
      },
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    throw error;
  }
};

// رفض طلب سحب
export const rejectWithdrawalRequest = async (
  requestId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    // الحصول على طلب السحب
    const requestRef = doc(db, 'withdrawals', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Withdrawal request not found');
    }

    const requestData = requestSnap.data() as WithdrawalRequest;

    // التحقق من أن الطلب في حالة معلقة
    if (requestData.status !== 'pending' && requestData.status !== 'processing') {
      throw new Error('Withdrawal request is not in pending or processing status');
    }

    // تحديث حالة الطلب
    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      notes: reason,
      updatedAt: serverTimestamp()
    });

    // إعادة المبلغ إلى رصيد المستخدم
    const userRef = doc(db, 'users', requestData.userId);
    await updateDoc(userRef, {
      [`balances.${requestData.coin}`]: increment(requestData.amount),
      totalWithdrawn: increment(-requestData.amount),
      updatedAt: serverTimestamp()
    });

    // إنشاء معاملة إعادة المبلغ
    await createTransaction({
      userId: requestData.userId,
      type: 'deposit',
      amount: requestData.amount,
      currency: requestData.coin,
      status: 'completed',
      description: `إعادة مبلغ السحب المرفوض ${requestData.amount} ${requestData.coin}`,
      metadata: {
        withdrawalRequestId: requestId,
        reason
      },
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting withdrawal request:', error);
    throw error;
  }
};
