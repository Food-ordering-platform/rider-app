import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riderService } from "./rider.services";
import { toast } from "../../components/ui/Toast";

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
      toast.success("Order Accepted! You are now assigned.");
      // Invalidate both lists so the UI updates instantly
      queryClient.invalidateQueries({ queryKey: ["rider-available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] });
    },
    onError: (err: any) => toast.error("Failed to acccept order", err.response?.data?.message),
  });
};

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => riderService.confirmPickup(orderId),
    onSuccess: () => {
      toast.success("Success, Pick up confirmed! Start heading to customer!!");
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] });
    },
    onError: (err: any) => toast.error("Pickup Failed", err.response?.data?.message),
  });
};

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      riderService.confirmDelivery(orderId, code),
    onSuccess: () => {
      toast.success("Success, Delivery completed! Earnings credited to wallet");
      queryClient.invalidateQueries({ queryKey: ["rider-active-order"] }); // Will become null
      queryClient.invalidateQueries({ queryKey: ["rider-earnings"] }); // Update balance
    },
    onError: (err: any) => toast.error("Delivery failed",err.response?.data?.message),
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
    // 🟢 1. Define the input type to match your new nested structure
    mutationFn: (data: {
      amount: number;
      bankDetails: {
        bankCode: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
      };
    }) => riderService.requestPayout(data),

    onSuccess: () => {
      // 🟢 2. Show the toast
      toast.success(
        "success, Payout Requested, Admin will process your transfer",
      );

      // 🟢 3. Invalidate ALL relevant queries
      // This ensures the balance drops and the transaction list updates
      queryClient.invalidateQueries({ queryKey: ["rider-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["RiderTransactions"] });
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";

      toast.error("Payout failed", error.response?.data?.message);
    },
  });
};

export const useGetHistory = () => {
  return useQuery({
    queryKey: ["rider-history"],
    queryFn: riderService.getHistory,
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOnline: boolean) => riderService.updateStatus(isOnline),
    onSuccess: (data) => {
      // 1. Refresh the authenticated user profile so isOnline stays in sync
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      const isOnline = data.isOnline;
      toast.success(isOnline ? "You're Online 🟢" : "You're Offline 🔴", {
        description: isOnline
          ? "Ready to receive orders"
          : "You won't receive new orders",
      });
    },
    onError: (err: any) => {
      toast.error("Error", err.response?.data?.message);
    },
  });
};

export const useRiderTransactions = () => {
  return useQuery({
    queryKey: ["RiderTransactions"],
    queryFn: () => riderService.getTransactions(),
    select: (data) => data.data,
  });
};
