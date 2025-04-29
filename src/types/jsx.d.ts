// Declaración de tipos para elementos JSX
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Declaración de tipos para solicitudes de depósito
interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  txId: string;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: {
    toDate: () => Date;
  };
  proofUrl?: string;
}

// Declaración de tipos para transacciones
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'processing';

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'referral' | 'task' | 'investment' | 'profit';
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: {
    toDate: () => Date;
  };
  description?: string;
  metadata?: any;
}

// Declaración de tipos para datos de usuario
interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balances?: {
    USDT: number;
    [key: string]: number;
  };
  totalDeposited?: number;
  totalWithdrawn?: number;
  referralCode?: string;
  referredBy?: string;
  membershipLevel?: number;
  createdAt?: {
    toDate: () => Date;
  };
}
