// types/rider.types.ts

export type RiderOrderStatus = 
  | 'READY_FOR_PICKUP' 
  | 'RIDER_ACCEPTED' 
  | 'OUT_FOR_DELIVERY' // Updated to match Backend Enum
  | 'DELIVERED'
  | 'CANCELLED';

export interface RiderRestaurant {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  phone: string; // <--- Add this
}

export interface RiderCustomer {
  name: string;
  address: string;
  phone?: string | null; // <--- Add this (User phone might be optional in schema)
}

export interface RiderOrderItem {
  quantity: number;
  menuItemName: string;
}

export interface RiderOrder {
  id: string;
  reference: string;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  restaurant: RiderRestaurant;
  customer: RiderCustomer;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  items: RiderOrderItem[];
  status?: RiderOrderStatus;
  deliveryCode?: string; // Optional, might not be sent to rider until needed
}

export interface RiderTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string;
  date: string;
  reference: string;
}

export interface RiderEarningsResponse {
  availableBalance: number;
  pendingBalance: number; // <--- ADD THIS
  totalEarnings: number;
  withdrawn: number;
  transactions: RiderTransaction[];
}


export interface PayoutRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
}

