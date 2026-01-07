import { useState, useEffect, useCallback } from "react";
import { Linking, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../context/socketContext";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatcherOrder } from "../types/dispatch.types";

export const useDashboardLogic = () => {
  const navigation = useNavigation<any>();
  const { socket } = useSocket();
  
  // 1. API State
  const { data, isLoading, refetch, isRefetching } = useDispatcherDashboard();
  const acceptOrderMutation = useAcceptOrder();

  // 2. Local UI State
  const [activeTab, setActiveTab] = useState<'requests' | 'active'>('requests');

  // 3. Derived Data (The "Brains")
  const requests = data?.activeOrders.filter(o => !o.trackingId) || [];
  const activeTrips = data?.activeOrders.filter(o => o.trackingId && o.status !== 'DELIVERED') || [];
  const stats = data?.stats || { totalJobs: 0, hoursOnline: 0, rating: 0 };
  const partnerName = data?.partnerName || "Partner";
  const pendingBalance = data?.pendingBalance || 0;

  // 4. Socket Logic (Real-time updates)
  useEffect(() => {
    if (!socket) return;
    socket.emit("join_room", "dispatchers");
    
    const handleUpdate = () => {
      console.log("🔔 Socket update received, refreshing...");
      refetch();
    };

    socket.on("new_dispatcher_request", handleUpdate);
    socket.on("order_delivered", handleUpdate);
    socket.on("order_updated", handleUpdate); 

    return () => { 
      socket.off("new_dispatcher_request"); 
      socket.off("order_delivered"); 
      socket.off("order_updated");
    };
  }, [socket, refetch]);

  // 5. Auto-refresh on focus
  useFocusEffect(useCallback(() => { refetch(); }, []));

  // 6. Action Handlers
  const handleAccept = (id: string) => {
    acceptOrderMutation.mutate({ orderId: id }, {
      onSuccess: () => setActiveTab('active')
    });
  };

  const handleShare = async (order: DispatcherOrder) => {
    if (!order.trackingId) {
      Alert.alert("Error", "Tracking ID missing. Please refresh.");
      return;
    }
    // Note: Update this URL to your actual Vercel/Railway frontend URL
    const webLink = `https://choweazy.vercel.app/ride/${order.trackingId}`;
    
    const msg = `🚴 *New Delivery Task!*\n\n📍 *Pickup:* ${order.vendor.name}\n📍 *Drop:* ${order.customer.name}\n\n💰 *Pay:* ₦${order.deliveryFee}\n\n👇 *Click to Start Trip:*\n${webLink}`;
    
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  const navigateToProfile = () => navigation.navigate("Profile");

  return {
    // Data
    isLoading,
    isRefetching,
    isAccepting: acceptOrderMutation.isPending,
    requests,
    activeTrips,
    stats,
    partnerName,
    pendingBalance,
    activeTab,
    
    // Actions
    refetch,
    setActiveTab,
    handleAccept,
    handleShare,
    navigateToProfile
  };
};