// services/rider/rider.service.ts
import api from "../axios";
import {
  RiderEarningsResponse,
  RiderOrder,
  PayoutRequest,
  Bank,
} from "../../types/rider.types";

export const riderService = {
  /**
   * Fetches the pool of orders ready for pickup.
   */
  getAvailableOrders: async (): Promise<RiderOrder[]> => {
    const response = await api.get<{ success: boolean; data: RiderOrder[] }>(
      "/rider/orders/available",
    );
    return response.data.data;
  },

  getActiveOrder: async (): Promise<RiderOrder | null> => {
    const response = await api.get<{
      success: boolean;
      data: RiderOrder | null;
    }>("/rider/orders/active");
    return response.data.data;
  },

  /**
   * Accepts an order, assigning it to the current rider.
   */
  acceptOrder: async (orderId: string): Promise<RiderOrder> => {
    const response = await api.patch<{ success: boolean; data: RiderOrder }>(
      `/rider/orders/${orderId}/accept`,
    );
    return response.data.data;
  },

  /**
   * Rejects (unassigns) an order, returning it to the pool.
   */
  rejectOrder: async (
    orderId: string,
    reason?: string,
  ): Promise<RiderOrder> => {
    const response = await api.patch<{ success: boolean; data: RiderOrder }>(
      `/rider/orders/${orderId}/reject`,
      { reason },
    );
    return response.data.data;
  },

  /**
   * Confirms pickup from restaurant (Status -> OUT_FOR_DELIVERY)
   */
  confirmPickup: async (orderId: string): Promise<RiderOrder> => {
    const response = await api.patch<{ success: boolean; data: RiderOrder }>(
      `/rider/orders/${orderId}/pickup`,
    );
    return response.data.data;
  },

  /**
   * Confirms delivery to customer using OTP (Status -> DELIVERED)
   */
  confirmDelivery: async (
    orderId: string,
    code: string,
  ): Promise<RiderOrder> => {
    const response = await api.patch<{ success: boolean; data: RiderOrder }>(
      `/rider/orders/${orderId}/deliver`,
      { code },
    );
    return response.data.data;
  },

  /**
   * Fetches wallet balance and transaction history.
   */
  getEarnings: async (): Promise<RiderEarningsResponse> => {
    const response = await api.get<{
      success: boolean;
      data: RiderEarningsResponse;
    }>("/rider/earnings");
    return response.data.data;
  },

  /**
   * Requests a payout from the wallet.
   */
  requestPayout: async (payload: PayoutRequest): Promise<any> => {
    // Payload should be: { amount: 1000, bankCode: "058", accountNumber: "1234567890" }
    const response = await api.post("/rider/payout", payload);
    return response.data;
  },

  getBanks: async (): Promise<Bank[]> => {
    // Note: We are calling the payment endpoint we just created
    const response = await api.get<{ success: boolean; data: Bank[] }>(
      "/payment/banks",
    );
    return response.data.data;
  },

  // Add this to your frontend rider.service.ts
  getHistory: async (): Promise<RiderOrder[]> => {
    const response = await api.get<{ success: boolean; data: RiderOrder[] }>(
      "/rider/history",
    );
    return response.data.data;
  },

  updateStatus: async (isOnline: boolean): Promise<any> => {
    const response = await api.patch("/rider/status", { isOnline });
    return response.data.data;
  },
};
