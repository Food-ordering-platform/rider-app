import React, { useState } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, 
  ActivityIndicator, StatusBar, Dimensions 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/authContext";
import { useGetAvailableOrders, useGetHistory, useAcceptOrder } from "../services/rider/rider.queries";
import { RiderOrder } from "../types/rider.types";
import { COLORS, SHADOWS} from "../constants/theme";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { format } from "date-fns";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const { data: availableOrders, isLoading: loadingNew, refetch: refetchNew } = useGetAvailableOrders();
  const { data: historyOrders, isLoading: loadingHistory, refetch: refetchHistory } = useGetHistory();
  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();

  // --- TAB COMPONENT ---
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'new' && styles.activeTabBtn]} 
        onPress={() => setActiveTab('new')}
      >
        <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Requests</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]} 
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
      </TouchableOpacity>
    </View>
  );

  // --- ENHANCED NEW ORDER CARD ---
  const renderNewOrder = ({ item }: { item: RiderOrder }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header: Restaurant */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.restaurant.imageUrl || "https://via.placeholder.com/100" }} style={styles.restImg} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.restName, { color: colors.text }]}>{item.restaurant.name}</Text>
          <View style={styles.footerRow}>
             <Ionicons name="star" size={14} color="#F59E0B" />
             <Text style={styles.ratingText}>4.8 (Very Good)</Text>
          </View>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Route Details */}
      <View style={styles.routeContainer}>
        {/* Pickup */}
        <View style={styles.routeRow}>
           <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
           <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pick Up</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
                {item.restaurant.address}
              </Text>
           </View>
        </View>
        
        {/* Connector Line */}
        <View style={styles.connectorLine} />

        {/* Dropoff */}
        <View style={styles.routeRow}>
           <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
           <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Drop Off</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
                {item.deliveryAddress}
              </Text>
           </View>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footerRow}>
         <View style={styles.metaBadge}>
            <FontAwesome5 name="shopping-bag" size={12} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>
                {item.items.reduce((acc, i) => acc + i.quantity, 0)} Items
            </Text>
         </View>
         <View style={styles.metaBadge}>
            <MaterialIcons name="trip-origin" size={14} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>~4.5 km</Text>
         </View>
      </View>

      {/* Button */}
      <TouchableOpacity 
        style={styles.acceptBtn} 
        onPress={() => acceptOrder(item.id)}
        disabled={isAccepting}
      >
        {isAccepting ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Accept Order</Text>}
      </TouchableOpacity>
    </View>
  );

  // --- HISTORY CARD ---
  const renderHistory = ({ item }: { item: RiderOrder }) => (
    <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.historyDate, { color: colors.textLight }]}>
                {format(new Date(item.createdAt), "MMM d, h:mm a")}
            </Text>
            <View style={styles.successBadge}>
                <Text style={styles.successText}>Completed</Text>
            </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={{ uri: item.restaurant.imageUrl || "" }} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#eee' }} />
            <View style={{ marginLeft: 12 }}>
                <Text style={[styles.historyName, { color: colors.text }]}>{item.restaurant.name}</Text>
                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ ₦{item.deliveryFee}</Text>
            </View>
        </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textLight }]}>Welcome back,</Text>
          <Text style={[styles.title, { color: colors.text }]}>{user?.name}</Text>
        </View>
        <Image source={require('../assets/rider_logo.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
      </View>

      {renderTabs()}

      <FlatList 
        data={activeTab === 'new' ? availableOrders : historyOrders}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'new' ? renderNewOrder : renderHistory}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
            <RefreshControl refreshing={activeTab === 'new' ? loadingNew : loadingHistory} onRefresh={activeTab === 'new' ? refetchNew : refetchHistory} />
        }
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
  header: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: COLORS.primary },

  // New Order Card
  card: { borderRadius: 20, padding: 16, marginBottom: 16, ...SHADOWS.medium },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  restImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#eee' },
  restName: { fontWeight: 'bold', fontSize: 16 },
  ratingText: { fontSize: 12, color: '#F59E0B', marginLeft: 4, fontWeight: '600' },
  priceBadge: { marginLeft: 'auto', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  priceText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  
  routeContainer: { marginLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  routeLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 'bold' },
  routeAddress: { fontSize: 14, fontWeight: '500' },
  connectorLine: { width: 2, height: 20, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: -4 },

  footerRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },

  acceptBtn: { backgroundColor: COLORS.primary, marginTop: 16, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // History Card
  historyCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary, ...SHADOWS.small },
  historyDate: { fontSize: 12 },
  successBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  successText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  historyName: { fontWeight: '700', fontSize: 15 },

  emptyBox: { alignItems: 'center', marginTop: 60 },
});