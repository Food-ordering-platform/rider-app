import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl, 
  StatusBar, 
  ActivityIndicator, 
  Share, 
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../context/socketContext";
// import { useAuth } from "../context/authContext";
// import { useQueryClient } from "@tanstack/react-query";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatcherOrder } from "../types/dispatch.types";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  // const { user } = useAuth();
  const { socket } = useSocket();

  // 1. API Hooks
  const { data, isLoading, refetch, isRefetching } = useDispatcherDashboard();
  const acceptOrderMutation = useAcceptOrder();

  const [isConnected, setIsConnected] = useState(false);

  // 2. Real-Time Socket Connection & Listeners
  useEffect(() => {
    if (!socket) return;
    setIsConnected(socket.connected);

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("🟢 Connected to Socket. Joining 'dispatchers' room...");
      socket.emit("join_room", "dispatchers");
    });

    socket.on("disconnect", () => setIsConnected(false));

    // 🔔 Listen for NEW orders from Vendors
    socket.on("new_dispatcher_request", (payload: any) => {
      console.log("🔔 New Order Received via Socket:", payload);
      // Trigger a silent refetch to get the latest data structure from backend
      refetch();
    });

    return () => {
      socket.off("new_dispatcher_request");
    };
  }, [socket, refetch]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  // 3. Handlers
  const handleAcceptOrder = (orderId: string) => {
    acceptOrderMutation.mutate({ orderId });
  };

  const handleShareLink = async (trackingId: string) => {
    if (!trackingId) {
      Alert.alert("Error", "No tracking link available for this order.");
      return;
    }
    try {
      await Share.share({
        message: `🚴 New Delivery Task!\n\nTap to view details & deliver:\nhttps://choweazy.com/rider-task/${trackingId}`,
      });
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  };

  // 4. Render Components
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
        <Text style={styles.greeting}>Hello, {data?.partnerName?.split(' ')[0] || "Dispatcher"}</Text>
        <Text style={styles.subGreeting}>Manage your fleet orders below.</Text>
      </View>
      <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const stats = data?.stats || { totalJobs: 0, hoursOnline: 0, rating: 0 };
    return (
      <View style={styles.statsContainer}>
        {/* Pending Balance / Revenue */}
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.statIconCircle}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>₦{(data?.pendingBalance || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending Pay</Text>
        </View>
        
        {/* Completed Jobs */}
        <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="checkmark" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{stats.totalJobs}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        {/* Active Orders Count */}
        <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="bicycle" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{data?.activeOrders?.length || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No Active Orders</Text>
        <Text style={styles.emptySubText}>Wait for vendors to assign orders to you.</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: DispatcherOrder }) => {
    // Check if order is ready to be shared (has trackingId)
    const canShare = !!item.trackingId;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
            <View style={styles.vendorInfo}>
                <View style={styles.vendorIcon}>
                    <Ionicons name="restaurant" size={14} color="white" />
                </View>
                <View>
                    <Text style={styles.vendorName}>{item.vendor.name}</Text>
                    <Text style={styles.orderTime}>{item.status.replace('_', ' ')}</Text>
                </View>
            </View>
            <View style={styles.amountBadge}>
                <Text style={styles.amountText}>₦{item.deliveryFee.toLocaleString()}</Text>
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
                <Text style={styles.addressText} numberOfLines={1}>{item.vendor.address}</Text>
                
                <View style={{ height: 12 }} />
                
                <Text style={styles.addressTitle}>Drop-off</Text>
                <Text style={styles.addressText} numberOfLines={1}>{item.customer.address}</Text>
            </View>
        </View>

        <View style={styles.actionFooter}>
            <Text style={[styles.statusText, { color: canShare ? '#10B981' : '#6B7280' }]}>
              {canShare ? "READY TO ASSIGN" : "PROCESSING"}
            </Text>

            {canShare ? (
               <TouchableOpacity 
                  style={[styles.assignBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleShareLink(item.trackingId!)}
               >
                  <Text style={styles.assignBtnText}>Share Link</Text>
                  <Ionicons name="share-social" size={16} color="white" />
               </TouchableOpacity>
            ) : (
               <TouchableOpacity 
                  style={styles.assignBtn}
                  onPress={() => handleAcceptOrder(item.id)}
               >
                  <Text style={styles.assignBtnText}>Accept Order</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
               </TouchableOpacity>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Loading Overlay for Acceptance */}
      {acceptOrderMutation.isPending && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{marginTop: 10, fontWeight: '600', color: COLORS.primary}}>Accepting Order...</Text>
        </View>
      )}

      <FlatList
        ListHeaderComponent={
          <View style={styles.paddingContainer}>
            {renderHeader()}
            {renderStats()}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                {isConnected && (
                  <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Live</Text>
                  </View>
                )}
            </View>
          </View>
        }
        data={data?.activeOrders || []} // ✅ Uses the correct field from backend
        keyExtractor={item => item.id}
        renderItem={renderOrderItem}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={isLoading ? <ActivityIndicator style={{marginTop: 50}} /> : null}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={COLORS.primary} 
          />
        }
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
  statNumber: { fontSize: 18, fontWeight: '800', color: 'white' }, // Adjusted font size slightly
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
  orderTime: { fontSize: 12, color: '#9CA3AF', textTransform: 'capitalize' },
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
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  assignBtnText: { color: 'white', fontWeight: '700', fontSize: 12, marginRight: 6 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 10 },
  emptySubText: { fontSize: 13, color: '#D1D5DB' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
});