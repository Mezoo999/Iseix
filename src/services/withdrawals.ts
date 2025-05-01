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
  limit,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createTransaction } from './transactions';
import { getUserData, updateUserBalance } from './users';

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

/**
 * إنشاء طلب سحب جديد (النظام الموحد)
 * @param userId معرف المستخدم
 * @param amount المبلغ
 * @param coin العملة
 * @param network الشبكة
 * @param address عنوان المحفظة
 * @param addressTag علامة العنوان (اختياري)
 * @returns معرف طلب السحب (معرف المعاملة)
 */
export const createWithdrawalRequest = async (
  userId: string,
  amount: number,
  coin: string,
  network: string,
  address: string,
  addressTag?: string
): Promise<string> => {
  // التحقق من صحة المعلمات
  if (!userId) throw new Error('معرف المستخدم مطلوب');
  if (!amount || amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  if (!coin) throw new Error('العملة مطلوبة');
  if (!network) throw new Error('الشبكة مطلوبة');
  if (!address) throw new Error('عنوان المحفظة مطلوب');

  // التحقق من الحد الأدنى للسحب
  if (amount < 20) {
    throw new Error(`الحد الأدنى للسحب هو 20 ${coin}`);
  }

  console.log(`[UNIFIED-WITHDRAWAL] بدء عملية سحب جديدة: userId=${userId}, amount=${amount}, coin=${coin}, network=${network}`);

  try {
    // 1. التحقق من عدم وجود طلبات سحب معلقة (خارج المعاملة)
    // استخدام الدالة المحسنة للتحقق من وجود طلبات سحب معلقة
    console.log(`[UNIFIED-WITHDRAWAL] التحقق من وجود طلبات سحب معلقة للمستخدم: ${userId} قبل إنشاء طلب جديد`);
    const hasPending = await hasPendingWithdrawals(userId);

    if (hasPending) {
      console.log(`[UNIFIED-WITHDRAWAL] المستخدم ${userId} لديه طلبات سحب معلقة، لا يمكن إنشاء طلب جديد`);
      throw new Error('لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.');
    }

    console.log(`[UNIFIED-WITHDRAWAL] لا يوجد طلبات سحب معلقة للمستخدم: ${userId}، يمكن المتابعة بإنشاء طلب جديد`);


    // استخدام المعاملات لضمان اتساق البيانات
    return await runTransaction(db, async (transaction) => {
      // 2. الحصول على بيانات المستخدم للتحقق من الرصيد والأرباح
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        console.log(`[UNIFIED-WITHDRAWAL] لم يتم العثور على بيانات المستخدم: ${userId}`);
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      const userData = userDoc.data();
      const currentBalance = (userData.balances && userData.balances[coin]) || 0;
      const totalProfit = userData.totalProfit || 0;
      const totalWithdrawn = userData.totalWithdrawn || 0;

      // 3. حساب الأرباح المتاحة للسحب
      const availableProfits = Math.max(0, totalProfit - totalWithdrawn);

      console.log(`[UNIFIED-WITHDRAWAL] الرصيد الحالي: ${currentBalance}, الأرباح المتاحة: ${availableProfits}, المبلغ المطلوب: ${amount}`);

      // 4. التحقق من أن المبلغ المطلوب سحبه لا يتجاوز الأرباح المتاحة
      if (amount > availableProfits) {
        console.log(`[UNIFIED-WITHDRAWAL] المبلغ المطلوب (${amount}) أكبر من الأرباح المتاحة (${availableProfits})`);
        throw new Error(`يمكنك فقط سحب الأرباح. الأرباح المتاحة للسحب: ${availableProfits.toFixed(2)} ${coin}`);
      }

      // 5. التحقق من أن المبلغ المطلوب سحبه لا يتجاوز الرصيد المتاح
      if (amount > currentBalance) {
        console.log(`[UNIFIED-WITHDRAWAL] المبلغ المطلوب (${amount}) أكبر من الرصيد المتاح (${currentBalance})`);
        throw new Error(`رصيد غير كافٍ لإجراء عملية السحب. الرصيد المتاح: ${currentBalance.toFixed(2)} ${coin}`);
      }

      // 6. إنشاء معرف للمعاملة الجديدة
      const transactionRef = doc(collection(db, 'transactions'));

      // 7. تحديث رصيد المستخدم
      transaction.update(userRef, {
        [`balances.${coin}`]: currentBalance - amount,
        totalWithdrawn: totalWithdrawn + amount,
        updatedAt: serverTimestamp()
      });

      // 8. إنشاء معاملة سحب (النظام الموحد)
      const withdrawalData = {
        userId,
        type: 'withdrawal',
        amount,
        currency: coin,
        status: 'pending',
        description: `طلب سحب ${amount} ${coin} على شبكة ${network}`,
        metadata: {
          isWithdrawalRequest: true,  // علامة لتمييز طلبات السحب
          address,
          network,
          addressTag: addressTag || null,
          reviewStatus: 'pending',  // حالة المراجعة
          reviewedBy: null,
          reviewedAt: null,
          notes: null
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.set(transactionRef, withdrawalData);

      console.log(`[UNIFIED-WITHDRAWAL] تم إنشاء طلب السحب بنجاح: ${transactionRef.id}`);

      return transactionRef.id;
    });
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] خطأ في إنشاء طلب السحب:', error);
    throw error;
  }
};

// الحصول على طلب سحب بواسطة المعرف
export const getWithdrawalRequestById = async (requestId: string): Promise<WithdrawalRequest | null> => {
  try {
    console.log(`جلب طلب السحب بالمعرف: ${requestId}`);
    const requestDoc = await getDoc(doc(db, 'withdrawals', requestId));

    if (requestDoc.exists()) {
      console.log(`تم العثور على طلب السحب: ${requestId}`);
      return { id: requestDoc.id, ...requestDoc.data() } as WithdrawalRequest;
    } else {
      console.log(`لم يتم العثور على طلب السحب: ${requestId}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting withdrawal request by ID:', error);
    throw error;
  }
};

// الحصول على جميع طلبات السحب (للمسؤولين) - النظام الموحد
export const getAllWithdrawalRequests = async (status?: 'pending' | 'approved' | 'rejected' | 'processing'): Promise<any[]> => {
  try {
    console.log('[UNIFIED-WITHDRAWAL] جاري جلب طلبات السحب...');
    console.log('[UNIFIED-WITHDRAWAL] الحالة المطلوبة:', status || 'الكل');

    // استخدام مجموعة transactions بدلاً من withdrawals
    const transactionsCollection = collection(db, 'transactions');
    console.log('[UNIFIED-WITHDRAWAL] مرجع المجموعة:', transactionsCollection.path);

    let q;

    try {
      // إنشاء الاستعلام الأساسي للمعاملات من نوع سحب
      let baseQuery = query(
        transactionsCollection,
        where('type', '==', 'withdrawal')
      );

      // إضافة فلتر الحالة إذا تم تحديده
      if (status) {
        console.log(`[UNIFIED-WITHDRAWAL] إنشاء استعلام مع فلتر الحالة: ${status}`);
        baseQuery = query(
          transactionsCollection,
          where('type', '==', 'withdrawal'),
          where('status', '==', status)
        );
      }

      // إضافة الترتيب حسب تاريخ الإنشاء
      q = query(
        baseQuery,
        orderBy('createdAt', 'desc')
      );

      console.log('[UNIFIED-WITHDRAWAL] تم إنشاء الاستعلام بنجاح');
    } catch (queryError) {
      console.error('[UNIFIED-WITHDRAWAL] خطأ في إنشاء الاستعلام:', queryError);

      // محاولة استعلام بدون ترتيب في حالة عدم وجود فهرس
      console.log('[UNIFIED-WITHDRAWAL] محاولة استعلام بدون ترتيب...');
      try {
        if (status) {
          q = query(
            transactionsCollection,
            where('type', '==', 'withdrawal'),
            where('status', '==', status)
          );
        } else {
          q = query(
            transactionsCollection,
            where('type', '==', 'withdrawal')
          );
        }
        console.log('[UNIFIED-WITHDRAWAL] تم إنشاء الاستعلام البديل بنجاح');
      } catch (fallbackError) {
        console.error('[UNIFIED-WITHDRAWAL] خطأ في إنشاء الاستعلام البديل:', fallbackError);
        throw fallbackError;
      }
    }

    console.log('[UNIFIED-WITHDRAWAL] جاري تنفيذ الاستعلام...');
    const querySnapshot = await getDocs(q);
    console.log('[UNIFIED-WITHDRAWAL] تم تنفيذ الاستعلام بنجاح');

    const withdrawalRequests: any[] = [];

    console.log(`[UNIFIED-WITHDRAWAL] تم العثور على ${querySnapshot.size} طلب سحب`);

    // تحويل المعاملات إلى تنسيق طلبات السحب
    querySnapshot.forEach((doc) => {
      console.log(`[UNIFIED-WITHDRAWAL] معرف المستند: ${doc.id}`);
      const data = doc.data();

      // التحقق من صحة البيانات
      if (!data.userId || !data.amount) {
        console.warn(`[UNIFIED-WITHDRAWAL] تم تخطي مستند غير صالح: ${doc.id}`);
        return;
      }

      // تحويل المعاملة إلى تنسيق طلب سحب
      withdrawalRequests.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        coin: data.currency,
        network: data.metadata?.network || 'Unknown',
        address: data.metadata?.address || 'Unknown',
        status: data.status,
        txId: data.txId,
        notes: data.metadata?.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        reviewedBy: data.metadata?.reviewedBy,
        reviewedAt: data.metadata?.reviewedAt,
        // إضافة البيانات الأصلية للمعاملة
        originalTransaction: data
      });
    });

    console.log(`[UNIFIED-WITHDRAWAL] تم تحويل ${withdrawalRequests.length} مستند إلى كائنات`);

    // ترتيب النتائج يدويًا حسب تاريخ الإنشاء (من الأحدث إلى الأقدم)
    const sortedRequests = withdrawalRequests.sort((a, b) => {
      try {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      } catch (sortError) {
        console.error('[UNIFIED-WITHDRAWAL] خطأ في ترتيب الطلبات:', sortError);
        return 0; // الحفاظ على الترتيب الأصلي في حالة حدوث خطأ
      }
    });

    console.log(`[UNIFIED-WITHDRAWAL] تم ترتيب ${sortedRequests.length} طلب سحب`);

    return sortedRequests;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error getting all withdrawal requests:', error);
    console.error('[UNIFIED-WITHDRAWAL] تفاصيل الخطأ:', error instanceof Error ? error.message : String(error));

    // إرجاع مصفوفة فارغة بدلاً من رمي الخطأ
    console.log('[UNIFIED-WITHDRAWAL] إرجاع مصفوفة فارغة بسبب حدوث خطأ');
    return [];
  }
};

// الحصول على طلبات السحب للمستخدم (النظام الموحد)
export const getUserWithdrawalRequests = async (userId: string, limitCount: number = 10): Promise<any[]> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] جلب طلبات السحب للمستخدم: ${userId}, الحد: ${limitCount}`);

    // استعلام مع ترتيب حسب تاريخ الإنشاء (تنازلي)
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'withdrawal'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    console.log(`[UNIFIED-WITHDRAWAL] تم العثور على ${querySnapshot.size} طلب سحب للمستخدم: ${userId}`);

    const withdrawalRequests: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      withdrawalRequests.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        coin: data.currency,
        network: data.metadata?.network || 'Unknown',
        address: data.metadata?.address || 'Unknown',
        status: data.status,
        txId: data.txId,
        notes: data.metadata?.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // إضافة البيانات الأصلية للمعاملة
        originalTransaction: data
      });
    });

    return withdrawalRequests;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error getting user withdrawal requests:', error);
    return [];
  }
};

/**
 * التحقق من وجود طلبات سحب معلقة للمستخدم (النظام الموحد)
 * @param userId معرف المستخدم
 * @returns true إذا كان هناك طلبات سحب معلقة، false إذا لم يكن
 */
export const hasPendingWithdrawals = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] التحقق من وجود طلبات سحب معلقة للمستخدم: ${userId}`);

    if (!userId) {
      console.error('[UNIFIED-WITHDRAWAL] معرف المستخدم غير صالح');
      return false;
    }

    // استخدام استعلام أكثر دقة للتأكد من عدم تفويت أي طلبات معلقة
    const pendingWithdrawalsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'withdrawal'),
      where('status', 'in', ['pending', 'processing'])
    );

    // تنفيذ الاستعلام والتحقق من النتائج
    const pendingWithdrawalsSnapshot = await getDocs(pendingWithdrawalsQuery);
    const hasPending = !pendingWithdrawalsSnapshot.empty;

    // طباعة معلومات مفصلة للتشخيص
    if (hasPending) {
      console.log(`[UNIFIED-WITHDRAWAL] تم العثور على ${pendingWithdrawalsSnapshot.size} طلب سحب معلق للمستخدم: ${userId}`);
      pendingWithdrawalsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`[UNIFIED-WITHDRAWAL] تفاصيل الطلب المعلق: ID=${doc.id}, المبلغ=${data.amount}, الحالة=${data.status}, تاريخ الإنشاء=${data.createdAt?.toDate?.() || 'غير معروف'}`);
      });
    } else {
      console.log(`[UNIFIED-WITHDRAWAL] لم يتم العثور على طلبات سحب معلقة للمستخدم: ${userId}`);
    }

    // تحقق إضافي من مجموعة withdrawals القديمة (للتوافق مع النظام القديم)
    if (!hasPending) {
      console.log(`[UNIFIED-WITHDRAWAL] التحقق من مجموعة withdrawals القديمة للمستخدم: ${userId}`);
      const oldPendingWithdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'processing'])
      );

      const oldPendingWithdrawalsSnapshot = await getDocs(oldPendingWithdrawalsQuery);
      const hasOldPending = !oldPendingWithdrawalsSnapshot.empty;

      if (hasOldPending) {
        console.log(`[UNIFIED-WITHDRAWAL] تم العثور على ${oldPendingWithdrawalsSnapshot.size} طلب سحب معلق في النظام القديم للمستخدم: ${userId}`);
        return true;
      }
    }

    console.log(`[UNIFIED-WITHDRAWAL] نتيجة التحقق النهائية: ${hasPending ? 'يوجد طلبات معلقة' : 'لا يوجد طلبات معلقة'}`);

    return hasPending;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error checking pending withdrawals:', error);
    // في حالة حدوث خطأ، نفترض وجود طلبات معلقة لمنع إنشاء طلبات متعددة
    console.log('[UNIFIED-WITHDRAWAL] حدث خطأ أثناء التحقق، نفترض وجود طلبات معلقة لمنع إنشاء طلبات متعددة');
    return true;
  }
};

// الحصول على طلبات السحب المعلقة للمستخدم (النظام الموحد)
export const getUserPendingWithdrawalRequests = async (userId: string): Promise<any[]> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] جلب طلبات السحب المعلقة للمستخدم: ${userId}`);

    if (!userId) {
      console.error('[UNIFIED-WITHDRAWAL] معرف المستخدم غير صالح');
      return [];
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'withdrawal'),
      where('status', 'in', ['pending', 'processing'])
    );

    console.log('[UNIFIED-WITHDRAWAL] تنفيذ استعلام طلبات السحب المعلقة');
    const querySnapshot = await getDocs(q);
    console.log(`[UNIFIED-WITHDRAWAL] تم العثور على ${querySnapshot.size} طلب سحب معلق للمستخدم: ${userId}`);

    const withdrawalRequests: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`[UNIFIED-WITHDRAWAL] طلب معلق: ${doc.id}, الحالة: ${data.status}, المبلغ: ${data.amount}`);

      withdrawalRequests.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        coin: data.currency,
        network: data.metadata?.network || 'Unknown',
        address: data.metadata?.address || 'Unknown',
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data
      });
    });

    return withdrawalRequests;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error getting user pending withdrawal requests:', error);
    // في حالة حدوث خطأ، نرجع مصفوفة فارغة بدلاً من رمي الخطأ
    console.log('[UNIFIED-WITHDRAWAL] حدث خطأ، نرجع مصفوفة فارغة');
    return [];
  }
};

/**
 * حساب الأرباح المتاحة للسحب (النظام الموحد)
 * @param userId معرف المستخدم
 * @param currency العملة
 * @returns الأرباح المتاحة للسحب
 */
export const getAvailableProfitsForWithdrawal = async (userId: string, currency: string = 'USDT'): Promise<number> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] حساب الأرباح المتاحة للسحب للمستخدم: ${userId}, العملة: ${currency}`);

    if (!userId) {
      console.error('[UNIFIED-WITHDRAWAL] معرف المستخدم غير صالح');
      return 0;
    }

    // الحصول على بيانات المستخدم
    const userData = await getUserData(userId);

    if (!userData) {
      console.error(`[UNIFIED-WITHDRAWAL] لم يتم العثور على بيانات المستخدم: ${userId}`);
      return 0;
    }

    const totalProfit = userData.totalProfit || 0;
    const totalWithdrawn = userData.totalWithdrawn || 0;

    // حساب الأرباح المتاحة للسحب
    const availableProfits = Math.max(0, totalProfit - totalWithdrawn);

    console.log(`[UNIFIED-WITHDRAWAL] الأرباح المتاحة للسحب: ${availableProfits} ${currency}`);

    return availableProfits;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error calculating available profits for withdrawal:', error);
    return 0;
  }
};

// الموافقة على طلب سحب (النظام الموحد)
export const approveWithdrawalRequest = async (
  transactionId: string,
  adminId: string,
  txId?: string,
  notes?: string
): Promise<void> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] الموافقة على طلب السحب: ${transactionId}, المسؤول: ${adminId}`);

    // إنشاء رقم معاملة إذا لم يتم توفيره
    const finalTxId = txId || `tx_${Math.random().toString(36).substring(2, 15)}`;

    // استخدام وظيفة تحديث حالة طلب السحب الموحدة
    await updateWithdrawalRequestStatus(
      transactionId,
      'approved',
      adminId,
      finalTxId,
      notes || 'تمت الموافقة على طلب السحب'
    );

    console.log(`[UNIFIED-WITHDRAWAL] تم الموافقة على طلب السحب بنجاح: ${transactionId}`);
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error approving withdrawal request:', error);
    throw error;
  }
};

// رفض طلب سحب (النظام الموحد)
export const rejectWithdrawalRequest = async (
  transactionId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] رفض طلب السحب: ${transactionId}, المسؤول: ${adminId}, السبب: ${reason}`);

    // استخدام وظيفة تحديث حالة طلب السحب الموحدة
    await updateWithdrawalRequestStatus(
      transactionId,
      'rejected',
      adminId,
      undefined,
      reason
    );

    console.log(`[UNIFIED-WITHDRAWAL] تم رفض طلب السحب بنجاح: ${transactionId}`);
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error rejecting withdrawal request:', error);
    throw error;
  }
};

/**
 * تحديث حالة طلب السحب (النظام الموحد)
 * @param transactionId معرف المعاملة (طلب السحب)
 * @param status الحالة الجديدة
 * @param adminId معرف المسؤول
 * @param txId معرف المعاملة (اختياري)
 * @param notes ملاحظات (اختياري)
 * @returns نجاح العملية
 */
export const updateWithdrawalRequestStatus = async (
  transactionId: string,
  status: 'pending' | 'approved' | 'rejected' | 'processing',
  adminId: string,
  txId?: string,
  notes?: string
): Promise<boolean> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] تحديث حالة طلب السحب: ${transactionId} إلى ${status}`);

    // التحقق من صحة المعلمات
    if (!transactionId) throw new Error('معرف طلب السحب مطلوب');
    if (!status) throw new Error('الحالة الجديدة مطلوبة');
    if (!adminId) throw new Error('معرف المسؤول مطلوب');

    // 1. الحصول على معاملة السحب (خارج المعاملة)
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      console.log(`[UNIFIED-WITHDRAWAL] لم يتم العثور على معاملة السحب: ${transactionId}`);
      throw new Error('لم يتم العثور على معاملة السحب');
    }

    const transactionData = transactionDoc.data();

    // التحقق من أن المعاملة هي طلب سحب
    if (transactionData.type !== 'withdrawal') {
      console.log(`[UNIFIED-WITHDRAWAL] المعاملة ليست طلب سحب: ${transactionId}`);
      throw new Error('المعاملة ليست طلب سحب');
    }

    const userId = transactionData.userId;
    const amount = transactionData.amount;
    const coin = transactionData.currency;
    const currentStatus = transactionData.status;

    console.log(`[UNIFIED-WITHDRAWAL] طلب السحب: userId=${userId}, amount=${amount}, coin=${coin}, currentStatus=${currentStatus}, newStatus=${status}`);

    // 2. التحقق من أن الحالة الحالية ليست هي نفس الحالة الجديدة
    if (currentStatus === status) {
      console.log(`[UNIFIED-WITHDRAWAL] الحالة الحالية هي نفس الحالة الجديدة: ${status}`);
      return true; // لا داعي للتحديث
    }

    // 3. إذا تم رفض الطلب، قم بإعادة المبلغ إلى رصيد المستخدم
    if (status === 'rejected' && (currentStatus === 'pending' || currentStatus === 'processing')) {
      // استخدام المعاملات لضمان اتساق البيانات
      await runTransaction(db, async (transaction) => {
        // قراءة بيانات المستخدم داخل المعاملة
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          console.log(`[UNIFIED-WITHDRAWAL] لم يتم العثور على المستخدم: ${userId}`);
          throw new Error('لم يتم العثور على المستخدم');
        }

        const userData = userDoc.data();
        const currentBalance = (userData.balances && userData.balances[coin]) || 0;
        const totalWithdrawn = userData.totalWithdrawn || 0;

        // قراءة بيانات المعاملة مرة أخرى للتأكد من أنها لم تتغير
        const transactionDocInTx = await transaction.get(transactionRef);
        if (!transactionDocInTx.exists()) {
          throw new Error('لم يتم العثور على معاملة السحب أثناء المعاملة');
        }

        const transactionDataInTx = transactionDocInTx.data();
        if (transactionDataInTx.status !== currentStatus) {
          throw new Error('تم تغيير حالة طلب السحب بالفعل');
        }

        // تحديث حالة معاملة السحب
        const updateData: any = {
          status,
          updatedAt: serverTimestamp(),
          'metadata.reviewStatus': status,
          'metadata.reviewedBy': adminId,
          'metadata.reviewedAt': serverTimestamp()
        };

        if (txId) {
          updateData.txId = txId;
        }

        if (notes) {
          updateData['metadata.notes'] = notes;
        }

        transaction.update(transactionRef, updateData);

        // تحديث رصيد المستخدم
        transaction.update(userRef, {
          [`balances.${coin}`]: currentBalance + amount,
          totalWithdrawn: Math.max(0, totalWithdrawn - amount),
          updatedAt: serverTimestamp()
        });

        console.log(`[UNIFIED-WITHDRAWAL] تم إعادة المبلغ إلى رصيد المستخدم: ${amount} ${coin}`);
      });
    } else {
      // إذا لم يكن هناك حاجة لإعادة المبلغ، فقط قم بتحديث حالة المعاملة
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        'metadata.reviewStatus': status,
        'metadata.reviewedBy': adminId,
        'metadata.reviewedAt': serverTimestamp()
      };

      if (txId) {
        updateData.txId = txId;
      }

      if (notes) {
        updateData['metadata.notes'] = notes;
      }

      await updateDoc(transactionRef, updateData);
    }

    console.log(`[UNIFIED-WITHDRAWAL] تم تحديث حالة طلب السحب بنجاح: ${transactionId} إلى ${status}`);

    return true;
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] خطأ في تحديث حالة طلب السحب:', error);
    throw error;
  }
};

// تحديث حالة طلب السحب إلى قيد المعالجة (النظام الموحد)
export const setWithdrawalRequestToProcessing = async (
  transactionId: string,
  adminId: string,
  notes?: string
): Promise<void> => {
  try {
    console.log(`[UNIFIED-WITHDRAWAL] تحديث حالة طلب السحب إلى قيد المعالجة: ${transactionId}, المسؤول: ${adminId}`);

    await updateWithdrawalRequestStatus(
      transactionId,
      'processing',
      adminId,
      undefined,
      notes || 'طلب السحب قيد المعالجة'
    );

    console.log(`[UNIFIED-WITHDRAWAL] تم تحديث حالة طلب السحب إلى: processing`);
  } catch (error) {
    console.error('[UNIFIED-WITHDRAWAL] Error setting withdrawal request to processing:', error);
    throw error;
  }
};

// تنسيق التاريخ
export const formatWithdrawalDate = (timestamp: any): string => {
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
    console.error('Error formatting withdrawal date:', error);
    return '';
  }
};
