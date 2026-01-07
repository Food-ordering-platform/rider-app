export interface DispatcherStats {
  completed: number;
  revenue: number;
  active: number;
}

export interface DispatcherOrderRequest {
  id: string;
  vendor: string;
  vendorAddress: string;
  customerAddress: string;
  amount: number;
  time: string;
  status: string;
  // Added these so the Dispatcher can see them after accepting
  trackingId?: string; 
  deliveryCode?: string;
}

export interface DispatcherDashboardData {
  stats: DispatcherStats;
  requests: DispatcherOrderRequest[];
}

export interface AcceptOrderPayload {
  orderId: string;
}

export interface AcceptOrderResponse {
  success: boolean;
  message: string;
  data: any;
}