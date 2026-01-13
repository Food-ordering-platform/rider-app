import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";

import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../context/socketContext";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatchOrder } from "../types/dispatch.types";

export const useDashboardLogic = () => {
  const navigation = useNavigation<any>();
  const { socket } = useSocket();
  
  // 1. API Data
  const { data, isLoading, refetch, isRefetching } = useDispatcherDashboard();
  const acceptOrderMutation = useAcceptOrder();

  // 2. Local State
  const [activeTab, setActiveTab] = useState<'requests' | 'active'>('requests');

  // NEW: Keep track of app state to prevent double-refetches
  const appState = useRef(AppState.currentState);

  // 3. Filter Logic
  // Requests: Orders with NO tracking ID (Not mine yet)
  const requests = data?.activeOrders.filter(o => !o.trackingId) || [];
  
  // Active: Orders WITH tracking ID (Mine) and NOT delivered
  const activeTrips = data?.activeOrders.filter(o => o.trackingId && o.status !== 'DELIVERED') || [];
  
  const stats = data?.stats || { totalJobs: 0, hoursOnline: 0, rating: 0 };
  const partnerName = data?.partnerName || "Partner";
  const pendingBalance = data?.pendingBalance || 0;

  // 4. Real-time Updates (Socket)
  useEffect(() => {
    if (!socket) return;
    socket.emit("join_room", "dispatchers");
    
    const handleUpdate = () => {
      console.log("🔔 New Update Received -> Refreshing Dashboard");
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

  // ---------------------------------------------------------
  // ✅ NEW: LIFECYCLE LISTENER IMPLEMENTATION
  // ---------------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // If app was in background/inactive and is now ACTIVE
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('⚡️ App has come to the foreground! Refreshing data...');
        refetch(); // <--- This forces the screen to update instantly
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refetch]);

  // 5. Refresh on Screen Focus
  useFocusEffect(useCallback(() => { refetch(); }, []));

  // 6. Actions
  const handleAccept = (id: string) => {
    acceptOrderMutation.mutate({ orderId: id }, {
      onSuccess: () => {
        setActiveTab('active');
        refetch();
      }
    });
  };

  const handleShare = async (order: DispatchOrder) => {
    if (!order.trackingId) {
      Alert.alert("Pending", "Tracking ID generating... pull to refresh.");
      return;
    }
    
    // Ensure this matches your actual frontend URL
    const webLink = `https://choweazy.vercel.app/ride/${order.trackingId}`;
    
    const msg = `🚴 *New Delivery Task*\n\n📍 *Pickup:* ${order.vendor.name}\n📍 *Drop:* ${order.customer.name}\n\n💰 *Pay:* ₦${order.deliveryFee}\n\n👇 *Click to Start Trip:*\n${webLink}`;
    
    try {
      await Clipboard.setStringAsync(msg);
      Alert.alert("Copied!", "Order details copied to clipboard.");
    } catch (err: any) {
      Alert.alert(err, "Error, Could not copy to clipboard");
    }
  };

  const navigateToProfile = () => navigation.navigate("Profile");

  return {
    isLoading,
    isRefetching,
    isAccepting: acceptOrderMutation.isPending,
    requests,
    activeTrips,
    stats,
    partnerName,
    pendingBalance,
    activeTab,
    refetch,
    setActiveTab,
    handleAccept,
    handleShare,
    navigateToProfile
  };
};