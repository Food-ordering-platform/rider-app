import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riderService } from "./rider.services";
import Toast from "react-native-toast-message";


// --- Queries ---
export const useGetAvailableOrders = () => {
  return useQuery({
    queryKey: ["rider-available-orders"],
    queryFn: riderService.getAvailableOrders,
    refetchInterval: 10000,
  });
};

export const useGetActiveOrder = () => {
  return useQuery({
    queryKey: ["rider-active-order"],
    queryFn: riderService.getActiveOrder,
    // Provide a retry logic or stale time if needed
  });
};

export const useGetRiderEarnings = () => {
  return useQuery({
    queryKey: ["rider-earnings"],
    queryFn: riderService.getEarnings,
  });
};

// --- Mutations ---
export const useAcceptOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => riderService.acceptOrder(orderId),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Order Accepted!",
        text2: "You are now assigned.",
      });
      // Invalidate both lists so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["rider-available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] });
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message,
      }),
  });
};

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => riderService.confirmPickup(orderId),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Pickup Confirmed",
        text2: "Start heading to the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] });
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message,
      }),
  });
};

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      riderService.confirmDelivery(orderId, code),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Delivery Complete!",
        text2: "Earnings credited to wallet.",
      });
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] }); // Will become null
      queryClient.invalidateQueries({ queryKey: ["rider-earnings"] }); // Update balance
    },
    onError: (err: any) =>
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: err.response?.data?.message || "Invalid Code",
      }),
  });
};

export const useGetBanks = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: riderService.getBanks,
    staleTime: 1000 * 60 * 60 * 24, // Cache banks for 24h
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 🟢 FIX: Accept the full object here
    mutationFn: (data: { amount: number; bankCode: string; accountNumber: string }) => 
      riderService.requestPayout(data),
      
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Payout processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["rider-earnings"] });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Payout failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    },
  });
}

export const useGetHistory = () => {
  return useQuery({
    queryKey: ["rider-history"],
    queryFn: riderService.getHistory,
  });
};

// services/rider/rider.queries.ts

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (isOnline: boolean) => riderService.updateStatus(isOnline),
    onSuccess: (data) => {
      // 1. Refresh the authenticated user profile so isOnline stays in sync
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      
      Toast.show({
        type: "success",
        text1: data.isOnline ? "You are Online 🟢" : "You are Offline 🔴",
        text2: data.isOnline ? "Ready to receive orders" : "You won't receive orders",
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Failed to update status",
        text2: err.response?.data?.message,
      });
    },
  });
};