import api from "../axios"; 
import { 
  AcceptOrderPayload, 
  AcceptOrderResponse, 
  DispatcherDashboardData 
} from "../../types/dispatch.types";

export const dispatcherService = {
  // 1. Get Dashboard
  // Backend Route: /api/dispatch/dashboard
  getDashboard: async (): Promise<DispatcherDashboardData> => {
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