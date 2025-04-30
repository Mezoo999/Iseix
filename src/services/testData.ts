import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * إنشاء معاملات سحب اختبارية للمستخدم
 * @param userId معرف المستخدم
 * @param count عدد المعاملات المراد إنشاؤها
 */
export const createTestWithdrawalTransactions = async (
  userId: string,
  count: number = 3
): Promise<string[]> => {
  try {
    console.log(`إنشاء ${count} معاملة سحب اختبارية للمستخدم: ${userId}`);
    
    const transactionIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // إنشاء مبلغ عشوائي بين 10 و 100
      const amount = Math.floor(Math.random() * 90) + 10;
      
      // إنشاء معاملة سحب
      const transactionData = {
        userId,
        type: 'withdrawal',
        amount,
        currency: 'USDT',
        status: 'pending',
        description: `طلب سحب ${amount} USDT على شبكة TRC20 إلى العنوان TRX${Math.random().toString(36).substring(2, 10)}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          network: 'TRC20',
          address: `TRX${Math.random().toString(36).substring(2, 10)}`
        }
      };
      
      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
      console.log(`تم إنشاء معاملة سحب اختبارية بنجاح. المعرف: ${transactionRef.id}`);
      
      transactionIds.push(transactionRef.id);
    }
    
    return transactionIds;
  } catch (error) {
    console.error('Error creating test withdrawal transactions:', error);
    throw error;
  }
};
