import api from "../axios"; 
import { 
  AcceptOrderPayload, 
  AcceptOrderResponse, 
  DashboardData, 
  WalletData,
  WithdrawalResponse
} from "../../types/dispatch.types";

export const dispatcherService = {
 getWallet: async (): Promise<WalletData> => {
    const response = await api.get<{ success: boolean; data: WalletData }>(
      "/dispatch/wallet"
    );
    return response.data.data;
  },

  // [NEW] Request Payout
  requestWithdrawal: async (payload: { amount: number; bankDetails: any }): Promise<WithdrawalResponse> => {
    const response = await api.post<WithdrawalResponse>(
      "/dispatch/wallet/withdraw",
      payload
    );
    return response.data;
  },
  // 1. Get Dashboard
  // Backend Route: /api/dispatch/dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get("/dispatch/dashboard");
    return response.data.data;
  },

  // 2. Accept Order
  // Backend Route: /api/dispatch/rider/accept
  acceptOrder: async (payload: AcceptOrderPayload): Promise<AcceptOrderResponse> => {
    const response = await api.post("/dispatch/accept", payload);
    return response.data;
  }
  
};