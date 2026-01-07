import api from "../axios"; 
import { 
  AcceptOrderPayload, 
  AcceptOrderResponse, 
  DispatcherDashboardData 
} from "../../types/dispatch.types";

export const dispatcherService = {
  // 1. Get Dashboard (Stats + Available Orders)
  getDashboard: async (): Promise<DispatcherDashboardData> => {
    // Updated endpoint to match "dispatcher" terminology
    const response = await api.get("/logistics/dispatcher/dashboard");
    return response.data.data;
  },

  // 2. Accept Order (Claim it so you can share the link)
  acceptOrder: async (payload: AcceptOrderPayload): Promise<AcceptOrderResponse> => {
    const response = await api.post("/logistics/dispatcher/accept", payload);
    return response.data;
  }
};