import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatcherService } from './dispatch';
import { Alert } from 'react-native';
import { 
  AcceptOrderPayload, 
  AcceptOrderResponse, 
  DispatcherDashboardData 
} from '../../types/dispatch.types';

export const useDispatcherDashboard = () => {
  return useQuery<DispatcherDashboardData>({
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
};