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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { updateUserBalance } from './users';
import { createTransaction } from './transactions';

// واجهة طلب الإيداع
export interface DepositRequest {
  id?: string;
  userId: string;
  amount: number;
  txId: string;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  proofImageUrl?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

// إنشاء طلب إيداع جديد
export const createDepositRequest = async (
  userId: string,
  amount: number,
  txId: string,
  platform: string,
  proofImage?: File
): Promise<string> => {
  try {
    let proofImageUrl = '';

    // رفع صورة الإثبات إذا كانت موجودة
    if (proofImage) {
      const storageRef = ref(storage, `deposit_proofs/${userId}/${Date.now()}_${proofImage.name}`);
      await uploadBytes(storageRef, proofImage);
      proofImageUrl = await getDownloadURL(storageRef);
    }

    // إنشاء طلب الإيداع في Firestore
    const depositRequest: DepositRequest = {
      userId,
      amount,
      txId,
      platform,
      status: 'pending',
      proofImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'deposit_requests'), depositRequest);

    return docRef.id;
  } catch (error) {
    console.error('Error creating deposit request:', error);
    throw error;
  }
};

// الحصول على طلبات الإيداع للمستخدم
export const getUserDepositRequests = async (userId: string): Promise<DepositRequest[]> => {
  try {
    const q = query(
      collection(db, 'deposit_requests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const depositRequests: DepositRequest[] = [];

    querySnapshot.forEach((doc) => {
      depositRequests.push({
        id: doc.id,
        ...doc.data()
      } as DepositRequest);
    });

    // ترتيب النتائج في الذاكرة بدلاً من استخدام Firestore
    return depositRequests.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt?.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt?.toMillis() : 0;
      return timeB - timeA; // ترتيب تنازلي (الأحدث أولاً)
    });
  } catch (error) {
    console.error('Error getting user deposit requests:', error);
    throw error;
  }
};

// الحصول على جميع طلبات الإيداع (للمسؤولين)
export const getAllDepositRequests = async (status?: 'pending' | 'approved' | 'rejected'): Promise<DepositRequest[]> => {
  try {
    let q;

    // استعلام مع ترتيب حسب تاريخ الإنشاء (تنازلي)
    if (status) {
      q = query(
        collection(db, 'deposit_requests'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'deposit_requests'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const depositRequests: DepositRequest[] = [];

    querySnapshot.forEach((doc) => {
      depositRequests.push({
        id: doc.id,
        ...doc.data()
      } as DepositRequest);
    });

    // ترتيب النتائج في الذاكرة بدلاً من استخدام Firestore
    return depositRequests.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt?.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt?.toMillis() : 0;
      return timeB - timeA; // ترتيب تنازلي (الأحدث أولاً)
    });
  } catch (error) {
    console.error('Error getting all deposit requests:', error);
    throw error;
  }
};

// الموافقة على طلب إيداع
export const approveDepositRequest = async (
  requestId: string,
  adminId: string,
  notes?: string
): Promise<void> => {
  try {
    // الحصول على طلب الإيداع
    const requestRef = doc(db, 'deposit_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Deposit request not found');
    }

    const requestData = requestSnap.data() as DepositRequest;

    // التحقق من أن الطلب في حالة معلقة
    if (requestData.status !== 'pending') {
      throw new Error('Deposit request is not in pending status');
    }

    // تحديث حالة الطلب
    await updateDoc(requestRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      notes: notes || 'تمت الموافقة على الطلب',
      updatedAt: serverTimestamp()
    });

    // تحديث رصيد المستخدم باستخدام دالة updateUserBalance
    console.log(`[deposits.ts] تحديث رصيد المستخدم ${requestData.userId} بمبلغ ${requestData.amount} USDT`);
    await updateUserBalance(
      requestData.userId,
      requestData.amount,
      'USDT',
      'deposit'
    );

    // إنشاء معاملة إيداع باستخدام دالة createTransaction
    console.log(`[deposits.ts] إنشاء معاملة إيداع للمستخدم ${requestData.userId}`);
    await createTransaction({
      userId: requestData.userId,
      type: 'deposit',
      amount: requestData.amount,
      currency: 'USDT',
      status: 'completed',
      description: `إيداع ${requestData.amount} USDT`,
      metadata: {
        depositRequestId: requestId,
        txId: requestData.txId,
        platform: requestData.platform,
        approvedBy: adminId
      }
    });
  } catch (error) {
    console.error('Error approving deposit request:', error);
    throw error;
  }
};

// رفض طلب إيداع
export const rejectDepositRequest = async (
  requestId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'deposit_requests', requestId);

    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      notes: reason,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting deposit request:', error);
    throw error;
  }
};
