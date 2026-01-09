export interface DispatcherStats {
  totalJobs: number;
  hoursOnline: number;
  rating: number;
}

export interface DispatchOrder {
  id: string;
  status: 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  deliveryFee: number;
  trackingId: string | null;
  reference?:string,
  postedAt:string
  
  // 🚀 New Identity Fields
  riderName?: string | null;
  riderPhone?: string | null;
  
  vendor: {
    name: string;
    address: string;
    phone: string;
    latitude:number
    longitude:number
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    deliveryLatitude:number
    deliveryLongitude:number
  };
}

export interface DashboardData {
  partnerName: string;
  availableBalance: number;
  pendingBalance: number; // 🚀 New Balance Field
  stats: {
    totalJobs: number;
    activeJobs: number;
  };
  activeOrders: DispatchOrder[];
}
export interface AcceptOrderPayload {
  orderId: string;
}

export interface AcceptOrderResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  description: string; // e.g., "Withdrawal to GTBank"
  reference?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string; // ISO date string
}

export interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface PayoutRequest {
  restaurantId: string;
  amount: number;
  bankDetails: BankDetails;
}

export interface WithdrawalResponse {
  success: true;
  transaction: Transaction;
}