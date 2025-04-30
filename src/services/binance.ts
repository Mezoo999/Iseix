import axios from 'axios';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { validateWithdrawalAmount, getAvailableProfitsForWithdrawal, hasPendingWithdrawals } from './profitManagement';
import { createWithdrawalRequest as createWithdrawalRequestFromService } from './withdrawals';
import { hasEnoughBalance } from './users';

// تكوين Binance API
const BINANCE_API_URL = 'https://api.binance.com';
const BINANCE_TEST_API_URL = 'https://testnet.binance.vision'; // للاختبار

// استخدم عنوان API الاختباري في بيئة التطوير
const API_URL = process.env.NODE_ENV === 'production' ? BINANCE_API_URL : BINANCE_TEST_API_URL;

// الحصول على أسعار العملات
export const getCryptoPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  try {
    const response = await axios.get(`${API_URL}/api/v3/ticker/price`);
    const prices = response.data;

    // تحويل البيانات إلى كائن يحتوي على أسعار العملات المطلوبة فقط
    const result: Record<string, number> = {};
    for (const price of prices) {
      if (symbols.includes(price.symbol)) {
        result[price.symbol] = parseFloat(price.price);
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    throw error;
  }
};

// عناوين الإيداع الثابتة (عناوين محفظتك الخاصة)
const FIXED_DEPOSIT_ADDRESSES = {
  USDT: {
    BEP20: { address: '0x1234567890abcdef1234567890abcdef12345678', tag: null },
    ERC20: { address: '0xabcdef1234567890abcdef1234567890abcdef12', tag: null },
    TRC20: { address: 'TGLqj4jpoas8m5KdQSquUzRejt5UV4bCX6', tag: null } // عنوان USDT على شبكة TRX
  },
  BTC: {
    BTC: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', tag: null }
  },
  ETH: {
    ERC20: { address: '0x9876543210abcdef9876543210abcdef98765432', tag: null }
  },
  BNB: {
    BEP20: { address: '0xfedcba9876543210fedcba9876543210fedcba98', tag: null }
  },
  XRP: {
    XRP: { address: 'rPWstFzYxVSuHNYxPQyxdhc6EKQdQmkAEE', tag: '123456' }
  }
};

// إنشاء عنوان إيداع
export const generateDepositAddress = async (
  userId: string,
  coin: string,
  network: string
): Promise<{ address: string; tag?: string }> => {
  try {
    let address = '';
    let tag = null;

    // استخدام العناوين الثابتة (عناوين محفظتك الخاصة)
    if (FIXED_DEPOSIT_ADDRESSES[coin] && FIXED_DEPOSIT_ADDRESSES[coin][network]) {
      address = FIXED_DEPOSIT_ADDRESSES[coin][network].address;
      tag = FIXED_DEPOSIT_ADDRESSES[coin][network].tag;
    } else {
      // إذا لم يكن هناك عنوان ثابت للعملة/الشبكة المطلوبة، استخدم عنوانًا وهميًا
      address = `${coin.toLowerCase()}_address_${Math.random().toString(36).substring(2, 10)}`;
      if (['XRP', 'XLM', 'EOS'].includes(coin)) {
        tag = Math.floor(Math.random() * 1000000).toString();
      }

      console.warn(`No fixed address found for ${coin} on ${network}. Using a placeholder address.`);
    }

    // حفظ العنوان في Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`depositAddresses.${coin}.${network}`]: {
        address,
        tag,
        createdAt: serverTimestamp(),
        isFixedAddress: true // علامة تشير إلى أن هذا عنوان ثابت
      },
    });

    return { address, tag: tag || undefined };
  } catch (error) {
    console.error('Error generating deposit address:', error);
    throw error;
  }
};

// إنشاء طلب سحب

export const createWithdrawalRequest = async (
  userId: string,
  amount: number,
  coin: string,
  network: string,
  address: string,
  addressTag?: string
): Promise<string> => {
  try {
    console.log(`[binance.ts] إنشاء طلب سحب جديد: userId=${userId}, amount=${amount}, coin=${coin}, network=${network}, address=${address}`);

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

    // التحقق من وجود طلبات سحب معلقة
    const hasPending = await hasPendingWithdrawals(userId);
    if (hasPending) {
      console.log(`[binance.ts] المستخدم ${userId} لديه طلب سحب معلق بالفعل`);
      throw new Error(`لديك طلب سحب معلق بالفعل. يرجى الانتظار حتى تتم معالجته قبل إنشاء طلب جديد.`);
    }

    // التحقق من المكافآت المتاحة للسحب
    const availableProfits = await getAvailableProfitsForWithdrawal(userId, coin);
    console.log(`[binance.ts] المكافآت المتاحة للسحب للمستخدم ${userId}: ${availableProfits} ${coin}`);

    if (amount > availableProfits) {
      console.log(`[binance.ts] المبلغ المطلوب (${amount}) أكبر من المكافآت المتاحة (${availableProfits})`);
      throw new Error(`يمكنك فقط سحب المكافآت. المكافآت المتاحة للسحب: ${availableProfits.toFixed(2)} ${coin}`);
    }

    // استدعاء خدمة السحب الرئيسية من withdrawals.ts
    console.log(`[binance.ts] استدعاء خدمة السحب الرئيسية`);
    return await createWithdrawalRequestFromService(
      userId,
      amount,
      coin,
      network,
      address,
      addressTag
    );
  } catch (error) {
    console.error('[binance.ts] Error creating withdrawal request:', error);
    throw error;
  }
};

// التحقق من حالة الإيداع
export const checkDepositStatus = async (
  txId: string
): Promise<{ status: 'pending' | 'completed' | 'failed'; amount?: number }> => {
  try {
    // في بيئة الإنتاج، سنستخدم Binance API للتحقق من حالة الإيداع
    // في بيئة التطوير، سنحاكي العملية

    if (process.env.NODE_ENV === 'production') {
      // استدعاء Binance API (يتطلب مفاتيح API)
      // هذا مثال فقط، يجب استبداله بالتنفيذ الفعلي
      /*
      const response = await axios.get(
        `${API_URL}/sapi/v1/capital/deposit/hisrec`,
        {
          params: {
            txId,
            timestamp: Date.now(),
            // يجب إضافة التوقيع هنا
          },
          headers: {
            'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
          },
        }
      );

      if (response.data.length > 0) {
        const deposit = response.data[0];
        return {
          status: deposit.status === 1 ? 'completed' : deposit.status === 0 ? 'pending' : 'failed',
          amount: parseFloat(deposit.amount),
        };
      }
      */

      // محاكاة حالة الإيداع
      const random = Math.random();
      if (random < 0.7) {
        return { status: 'completed', amount: Math.random() * 1000 };
      } else if (random < 0.9) {
        return { status: 'pending' };
      } else {
        return { status: 'failed' };
      }
    } else {
      // محاكاة حالة الإيداع في بيئة التطوير
      const random = Math.random();
      if (random < 0.7) {
        return { status: 'completed', amount: Math.random() * 1000 };
      } else if (random < 0.9) {
        return { status: 'pending' };
      } else {
        return { status: 'failed' };
      }
    }
  } catch (error) {
    console.error('Error checking deposit status:', error);
    throw error;
  }
};

// التحقق من حالة السحب
export const checkWithdrawalStatus = async (
  txId: string
): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed' }> => {
  try {
    // في بيئة الإنتاج، سنستخدم Binance API للتحقق من حالة السحب
    // في بيئة التطوير، سنحاكي العملية

    if (process.env.NODE_ENV === 'production') {
      // استدعاء Binance API (يتطلب مفاتيح API)
      // هذا مثال فقط، يجب استبداله بالتنفيذ الفعلي
      /*
      const response = await axios.get(
        `${API_URL}/sapi/v1/capital/withdraw/history`,
        {
          params: {
            txId,
            timestamp: Date.now(),
            // يجب إضافة التوقيع هنا
          },
          headers: {
            'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
          },
        }
      );

      if (response.data.length > 0) {
        const withdrawal = response.data[0];
        let status: 'pending' | 'processing' | 'completed' | 'failed';

        switch (withdrawal.status) {
          case 0: // Email Sent
          case 1: // Cancelled
            status = 'failed';
            break;
          case 2: // Awaiting Approval
          case 3: // Rejected
            status = 'pending';
            break;
          case 4: // Processing
            status = 'processing';
            break;
          case 5: // Failure
            status = 'failed';
            break;
          case 6: // Completed
            status = 'completed';
            break;
          default:
            status = 'pending';
        }

        return { status };
      }
      */

      // محاكاة حالة السحب
      const random = Math.random();
      if (random < 0.6) {
        return { status: 'completed' };
      } else if (random < 0.8) {
        return { status: 'processing' };
      } else if (random < 0.9) {
        return { status: 'pending' };
      } else {
        return { status: 'failed' };
      }
    } else {
      // محاكاة حالة السحب في بيئة التطوير
      const random = Math.random();
      if (random < 0.6) {
        return { status: 'completed' };
      } else if (random < 0.8) {
        return { status: 'processing' };
      } else if (random < 0.9) {
        return { status: 'pending' };
      } else {
        return { status: 'failed' };
      }
    }
  } catch (error) {
    console.error('Error checking withdrawal status:', error);
    throw error;
  }
};
