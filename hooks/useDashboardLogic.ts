// hooks/useDashboardLogic.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useSocket } from '../context/socketContext';
import { RiderService } from '../services/dispatch/dispatch';
import { RiderOrder } from '../types/dispatch.types';

export const useDashboardLogic = () => {
  const { socket, isOnline } = useSocket();
  
  const [incomingOrders, setIncomingOrders] = useState<RiderOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Socket Listeners (Real-time Feed)
  useEffect(() => {
    if (!socket) return;

    // Listen for new orders broadcasted by Backend
    const handleNewOrder = (payload: any) => {
      console.log("🔔 New Order Inbound:", payload);
      // Backend sends: { type: "NEW_ORDER", order: { ... } }
      const newOrder = payload.order;

      setIncomingOrders((prev) => {
        // Avoid duplicates
        if (prev.find(o => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    };

    // Listen if another rider takes an order
    const handleOrderTaken = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) => prev.filter(o => o.id !== orderId));
    };

    socket.on('new_delivery_available', handleNewOrder);
    socket.on('order_taken', handleOrderTaken);

    return () => {
      socket.off('new_delivery_available', handleNewOrder);
      socket.off('order_taken', handleOrderTaken);
    };
  }, [socket]);

  // 2. Accept Order Action
  const acceptOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const order = await RiderService.acceptOrder(orderId);
      
      // Success: Set as active and remove from list
      setActiveOrder(order);
      setIncomingOrders((prev) => prev.filter((o) => o.id !== orderId));
      
      Alert.alert("Success", "You have accepted the delivery! 🚀");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Too Late", "This order has already been taken.");
      // Remove it from the list since it's gone
      setIncomingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setLoading(false);
    }
  };

  // 3. Complete Order Action
  const completeOrder = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      await RiderService.completeOrder(activeOrder.id);
      setActiveOrder(null);
      Alert.alert("Great Job!", "Delivery completed. Wallet credited. 💰");
    } catch (error) {
      Alert.alert("Error", "Could not complete order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    isOnline,
    incomingOrders,
    activeOrder,
    acceptOrder,
    completeOrder,
    loading
  };
};