import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, ActivityIndicator, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { useSocket } from "../context/socketContext";
import { useAuth } from "../context/authContext";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatcherDashboardData, DispatcherOrderRequest } from "../types/dispatch.types";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // 1. React Query Hooks
  const { data, isLoading, refetch, isRefetching } = useDispatcherDashboard();
  const acceptOrderMutation = useAcceptOrder();

  const [isConnected, setIsConnected] = useState(false);

  // 2. Real-Time Socket Listeners
  useEffect(() => {
    if (!socket) return;
    setIsConnected(socket.connected);

    socket.on("connect", () => {
      setIsConnected(true);
      // Join the 'dispatchers' room to get alerts
      socket.emit("join_room", "dispatchers");
    });

    socket.on("disconnect", () => setIsConnected(false));

    // Handle New Order (Optimistic Update)
    socket.on("new_dispatcher_request", (payload: any) => {
      console.log("🔔 New Order for Dispatcher:", payload);
      
      const newOrder: DispatcherOrderRequest = {
        id: payload.orderId,
        vendor: payload.restaurantName,
        vendorAddress: payload.restaurantAddress || "Warri",
        customerAddress: payload.customerAddress,
        amount: payload.totalAmount, 
        time: "Just Now",
        status: payload.status
      };

      // Update Cache Immediately
      queryClient.setQueryData<DispatcherDashboardData>(['dispatcherDashboard'], (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          requests: [newOrder, ...oldData.requests]
        };
      });
    });

    return () => {
      socket.off("new_dispatcher_request");
    };
  }, [socket, queryClient]);

  const handleAcceptOrder = (orderId: string) => {
    acceptOrderMutation.mutate({ orderId });
  };

  const handleShareLink = async (trackingId: string) => {
    try {
      // Allow Dispatcher to share the Rider Link
      await Share.share({
        message: `New Delivery Task! 🛵\n\nClick to view details: https://choweazy.com/rider-task/${trackingId}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <View style={styles.dateRow}>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
            {isConnected ? (
                <View style={styles.connectedBadge}><Text style={styles.connectedText}>ONLINE</Text></View>
            ) : (
                <View style={[styles.connectedBadge, { backgroundColor: '#FECACA' }]}><Text style={[styles.connectedText, {color: 'red'}]}>OFFLINE</Text></View>
            )}
        </View>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || "Dispatcher"}</Text>
        <Text style={styles.subGreeting}>Manage your fleet and orders.</Text>
      </View>
      <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const stats = data?.stats || { completed: 0, revenue: 0, active: 0 };
    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.statIconCircle}>
              <Ionicons name="bicycle" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="checkmark" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="wallet" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>₦{stats.revenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No pending requests</Text>
        <Text style={styles.emptySubText}>New orders will appear here automatically</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      {acceptOrderMutation.isPending && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <FlatList
        ListHeaderComponent={
          <View style={styles.paddingContainer}>
            {renderHeader()}
            {renderStats()}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                </View>
            </View>
          </View>
        }
        data={data?.requests || []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.9}
            // Navigate to Details if needed
             onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <View style={styles.cardHeader}>
                <View style={styles.vendorInfo}>
                    <View style={styles.vendorIcon}>
                        <Ionicons name="restaurant" size={14} color="white" />
                    </View>
                    <View>
                        <Text style={styles.vendorName}>{item.vendor}</Text>
                        <Text style={styles.orderTime}>{item.time}</Text>
                    </View>
                </View>
                <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>₦{item.amount.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.locationRow}>
                <View style={styles.locationDots}>
                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                    <View style={styles.line} />
                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                </View>
                <View style={styles.locationText}>
                    <Text style={styles.addressTitle}>Pickup</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.vendorAddress}</Text>
                    <View style={{ height: 12 }} />
                    <Text style={styles.addressTitle}>Drop-off</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.customerAddress}</Text>
                </View>
            </View>

            <View style={styles.actionFooter}>
                <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                
                {/* LOGIC: If order has no trackingId (not accepted yet), show Accept.
                   If it has trackingId (already accepted), show Share.
                */}
                {!item.trackingId ? (
                   <TouchableOpacity 
                      style={styles.assignBtn}
                      onPress={() => handleAcceptOrder(item.id)}
                   >
                      <Text style={styles.assignBtnText}>Accept & Assign</Text>
                      <Ionicons name="arrow-forward" size={14} color="white" />
                   </TouchableOpacity>
                ) : (
                   <TouchableOpacity 
                      style={[styles.assignBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleShareLink(item.trackingId!)}
                   >
                      <Text style={styles.assignBtnText}>Share Link</Text>
                      <Ionicons name="share-social" size={14} color="white" />
                   </TouchableOpacity>
                )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={isLoading ? <ActivityIndicator style={{marginTop: 50}} /> : null}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  paddingContainer: { padding: 20 },
  header: { marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  date: { fontSize: 13, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginRight: 10 },
  connectedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  connectedText: { fontSize: 10, color: '#059669', fontWeight: '800' },
  greeting: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  profileBtn: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '31%', padding: 12, borderRadius: 16, alignItems: 'flex-start', minHeight: 110, justifyContent: 'space-between', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNumber: { fontSize: 22, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'red', marginRight: 5 },
  liveText: { fontSize: 12, color: 'red', fontWeight: '600' },

  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  vendorIcon: { width: 32, height: 32, backgroundColor: '#374151', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  vendorName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  orderTime: { fontSize: 12, color: '#9CA3AF' },
  amountBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  amountText: { fontWeight: '800', fontSize: 14, color: '#111827' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
  
  locationRow: { flexDirection: 'row' },
  locationDots: { alignItems: 'center', marginRight: 12, paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, height: 30, backgroundColor: '#E5E7EB', marginVertical: 4 },
  locationText: { flex: 1 },
  addressTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  addressText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  actionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  assignBtnText: { color: 'white', fontWeight: '700', fontSize: 12, marginRight: 6 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 10 },
  emptySubText: { fontSize: 13, color: '#D1D5DB' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
});