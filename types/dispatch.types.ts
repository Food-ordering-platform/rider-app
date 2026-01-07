export interface DispatcherStats {
  totalJobs: number;
  hoursOnline: number;
  rating: number;
}

export interface DispatcherOrder {
  id: string;
  status: string;
  deliveryFee: number;
  trackingId: string | null;
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

export interface DispatcherDashboardData {
  partnerName: string;
  availableBalance: number;
  pendingBalance: number;
  stats: DispatcherStats;
  activeOrders: DispatcherOrder[]; // Renamed from 'requests' to match backend
}

export interface AcceptOrderPayload {
  orderId: string;
}

export interface AcceptOrderResponse {
  success: boolean;
  message: string;
  data: any;
}