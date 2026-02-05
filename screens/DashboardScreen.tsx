import React, { useState, useCallback } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, 
  ActivityIndicator, StatusBar, Switch
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/authContext";
import { useGetAvailableOrders, useGetHistory, useAcceptOrder, useGetActiveOrder } from "../services/rider/rider.queries";
import { RiderOrder } from "../types/rider.types";
import { COLORS, SHADOWS } from "../constants/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect } from "@react-navigation/native";

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [isOnline, setIsOnline] = useState(true);

  // Queries
  const { data: activeOrder, refetch: refetchActive } = useGetActiveOrder();
  const { data: availableOrders, isLoading: loadingNew, refetch: refetchNew } = useGetAvailableOrders();
  const { data: historyOrders, isLoading: loadingHistory, refetch: refetchHistory } = useGetHistory();
  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();

  // Refresh Logic
  const onRefresh = useCallback(() => {
    refetchActive();
    if (activeTab === 'new') refetchNew();
    else refetchHistory();
  }, [activeTab, refetchActive, refetchNew, refetchHistory]);

  // Auto-refresh when screen appears
  useFocusEffect(
    useCallback(() => {
        onRefresh();
    }, [onRefresh])
  );

  // --- HEADER SECTION ---
  const renderHeader = () => {
    const isBusy = !!activeOrder;
    const statusColor = isBusy ? '#F59E0B' : (isOnline ? '#10B981' : '#9CA3AF');
    const statusText = isBusy ? 'On Delivery' : (isOnline ? 'You are Online' : 'You are Offline');

    return (
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
        <View>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
           </View>
           <Text style={[styles.title, { color: colors.text }]}>Hello, {user?.name?.split(' ')[0]}</Text>
        </View>
        
        {/* Toggle Switch */}
        <View style={styles.switchWrapper}>
            <Switch
                value={isOnline || isBusy}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor={'white'}
                disabled={isBusy} 
            />
        </View>
      </View>
    );
  };

  // --- TAB SECTION ---
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'new' && styles.activeTabBtn]} 
        onPress={() => setActiveTab('new')}
      >
        <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Requests</Text>
        {availableOrders?.length ? (
            <View style={styles.badge}><Text style={styles.badgeText}>{availableOrders.length}</Text></View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]} 
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
      </TouchableOpacity>
    </View>
  );

  // --- 1. NEW ORDER CARD (Original Enhanced) ---
  const renderNewOrder = ({ item }: { item: RiderOrder }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.restaurant.imageUrl || "https://via.placeholder.com/100" }} style={styles.restImg} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.restName, { color: colors.text }]}>{item.restaurant.name}</Text>
          <Text style={styles.restAddr} numberOfLines={1}>{item.restaurant.address}</Text>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
           <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
           <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
             {item.restaurant.address}
           </Text>
        </View>
        <View style={styles.connectorLine} />
        <View style={styles.routeRow}>
           <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
           <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
             {item.deliveryAddress}
           </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.acceptBtn} 
        onPress={() => acceptOrder(item.id)}
        disabled={isAccepting}
      >
        {isAccepting ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Accept Order</Text>}
      </TouchableOpacity>
    </View>
  );

  // --- 2. HISTORY CARD (Pro Version) ---
  const renderHistory = ({ item }: { item: RiderOrder }) => {
    // Check if items exist (backend must return them)
    const itemsText = item.items && item.items.length > 0 
        ? item.items.map(i => `${i.quantity}x ${i.menuItemName}`).join(", ") 
        : "Order details";
    
    return (
      <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
        
        {/* Header: Date | ID | Status */}
        <View style={styles.historyHeader}>
            <View>
                <Text style={[styles.historyDate, { color: colors.textLight }]}>
                    {format(new Date(item.createdAt), "MMM d, h:mm a")}
                </Text>
                <Text style={styles.historyRef}>#{item.reference}</Text>
            </View>
            <View style={styles.successBadge}>
                <Ionicons name="checkmark-done" size={12} color="#10B981" />
                <Text style={styles.successText}>Delivered</Text>
            </View>
        </View>
        
        <View style={styles.historyDivider} />

        {/* Main: Restaurant & Earnings */}
        <View style={styles.historyMain}>
            <Image 
                source={{ uri: item.restaurant.imageUrl || "https://via.placeholder.com/100" }} 
                style={styles.historyImg} 
            />
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={[styles.historyName, { color: colors.text }]}>{item.restaurant.name}</Text>
                <Text style={[styles.historyItems, { color: colors.textLight }]} numberOfLines={1}>
                    {itemsText}
                </Text>
            </View>
            <Text style={styles.historyPrice}>+₦{item.deliveryFee}</Text>
        </View>

        {/* Footer: Mini Route Visualization */}
        <View style={styles.historyFooter}>
             <View style={styles.miniRouteRow}>
                <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.miniAddress} numberOfLines={1}>{item.restaurant.address}</Text>
             </View>
             <View style={styles.miniConnector} />
             <View style={styles.miniRouteRow}>
                <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.miniAddress} numberOfLines={1}>{item.deliveryAddress}</Text>
             </View>
        </View>

      </View>
    );
  };

  // --- OFFLINE STATE ---
  if (!isOnline && !activeOrder) {
      return (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
              {renderHeader()}
              <View style={styles.offlineBox}>
                  <View style={styles.offlineIconBox}>
                    <MaterialIcons name="cloud-off" size={60} color="#9CA3AF" />
                  </View>
                  <Text style={[styles.offlineTitle, { color: colors.text }]}>You are Offline</Text>
                  <Text style={styles.offlineSub}>Go online to start receiving orders.</Text>
                  <TouchableOpacity style={styles.goOnlineBtn} onPress={() => setIsOnline(true)}>
                      <Text style={styles.btnText}>Go Online</Text>
                  </TouchableOpacity>
              </View>
          </View>
      )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {renderHeader()}
      {renderTabs()}
      
      <FlatList 
        data={activeTab === 'new' ? availableOrders : historyOrders}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'new' ? renderNewOrder : renderHistory}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={activeTab === 'new' ? loadingNew : loadingHistory} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
             <MaterialIcons name={activeTab === 'new' ? "delivery-dining" : "history"} size={60} color="#E5E7EB" />
             <Text style={{ color: colors.textLight, marginTop: 10 }}>
                {activeTab === 'new' ? "No new requests nearby." : "No completed orders yet."}
             </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800' },
  switchWrapper: { transform: [{ scale: 0.9 }] },

  // Tabs
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  activeTabBtn: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: COLORS.primary },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // New Order Card
  card: { borderRadius: 20, padding: 16, marginBottom: 16, ...SHADOWS.medium },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  restImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#eee' },
  restName: { fontWeight: 'bold', fontSize: 16 },
  restAddr: { fontSize: 12, color: '#6B7280' },
  priceBadge: { marginLeft: 'auto', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  priceText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  routeContainer: { marginLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  routeAddress: { fontSize: 14, fontWeight: '500' },
  connectorLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: -2 },
  acceptBtn: { backgroundColor: COLORS.primary, marginTop: 16, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // --- HISTORY CARD STYLES (NEW) ---
  historyCard: { padding: 16, borderRadius: 18, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: '#F3F4F6' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 12, fontWeight: '500' },
  historyRef: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
  successBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  successText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  historyDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  historyMain: { flexDirection: 'row', alignItems: 'center' },
  historyImg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eee' },
  historyName: { fontWeight: '700', fontSize: 15 },
  historyItems: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  historyPrice: { fontWeight: '800', fontSize: 15, color: COLORS.primary },
  
  // Mini Route Visualization
  historyFooter: { marginTop: 12, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
  miniRouteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  miniDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  miniAddress: { fontSize: 11, color: '#6B7280', flex: 1 },
  miniConnector: { width: 1, height: 10, backgroundColor: '#D1D5DB', marginLeft: 2.5, marginVertical: 2 },

  // Empty & Offline States
  emptyBox: { alignItems: 'center', marginTop: 60 },
  offlineBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  offlineIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  offlineTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 0 },
  offlineSub: { color: '#6B7280', marginBottom: 30, marginTop: 8 },
  goOnlineBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
});