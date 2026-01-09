import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatcherService } from './dispatch';
import { Alert } from 'react-native';
import { 
  AcceptOrderPayload, 
  AcceptOrderResponse, 
  DashboardData 
} from '../../types/dispatch.types';

export const useDispatcherDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dispatcherDashboard'],
    queryFn: dispatcherService.getDashboard,
    refetchOnWindowFocus: true, 
  });
};

export const useAcceptOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<AcceptOrderResponse, Error, AcceptOrderPayload>({
    mutationFn: dispatcherService.acceptOrder,
    onSuccess: () => {
      // Refresh dashboard to show the updated status or move order to "Accepted" list
      queryClient.invalidateQueries({ queryKey: ['dispatcherDashboard'] });
      Alert.alert("Success", "Order Accepted! You can now share the link.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Failed to accept order";
      Alert.alert("Error", msg);
    }
  });
};export const useRiderWallet = () => {
  return useQuery({
    queryKey: ["rider-wallet"],
    queryFn: dispatcherService.getWallet,
    // Refetch every minute to keep balance fresh
    refetchInterval: 60000, 
  });
};

// [NEW] Hook to Request Withdrawal
export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; bankDetails: any }) => 
      dispatcherService.requestWithdrawal(data),
    onSuccess: () => {
      // Refresh wallet data immediately after successful withdrawal request
      queryClient.invalidateQueries({ queryKey: ["rider-wallet"] });
    },
  });
};