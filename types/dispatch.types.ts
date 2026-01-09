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
  };
  customer: {
    name: string;
    address: string;
    phone: string;
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