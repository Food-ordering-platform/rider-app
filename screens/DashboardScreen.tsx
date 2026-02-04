import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, ActivityIndicator, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/authContext";
import { useGetAvailableOrders, useGetActiveOrder, useAcceptOrder } from "../services/rider/rider.queries";
import { RiderOrder } from "../types/rider.types";
import { COLORS, SHADOWS, SPACING } from "../constants/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";


export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // 1. Check for Active Order
  const { data: activeOrder, isLoading: isLoadingActive, refetch: refetchActive } = useGetActiveOrder();
  
  // 2. Fetch Available Pool
  const { data: availableOrders, isLoading: isLoadingPool, refetch: refetchPool, isRefetching } = useGetAvailableOrders();

  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();

  // --- OTHERWISE, SHOW ORDER POOL ---
  
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
      <View>
        <Text style={[styles.greeting, { color: colors.textLight }]}>Ready to work?</Text>
        <Text style={[styles.title, { color: colors.text }]}>Hello, {user?.name}</Text>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.onlineDot} />
        <Text style={styles.statusText}>Online</Text>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: RiderOrder }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardTop}>
        <Image source={{ uri: item.restaurant.imageUrl || "https://via.placeholder.com/100" }} style={styles.restImg} />
        <View style={styles.restInfo}>
          <Text style={[styles.restName, { color: colors.text }]}>{item.restaurant.name}</Text>
          <Text style={[styles.restAddr, { color: colors.textLight }]} numberOfLines={1}>{item.restaurant.address}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
        </View>
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      
      <View style={styles.routeRow}>
        <Ionicons name="location" size={18} color={COLORS.primary} />
        <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>{item.deliveryAddress}</Text>
        <Text style={[styles.distanceText, { color: colors.textLight }]}>• ~4.5km</Text>
      </View>

      <TouchableOpacity 
        style={styles.acceptBtn} 
        onPress={() => acceptOrder(item.id)}
        disabled={isAccepting}
      >
        {isAccepting ? <ActivityIndicator color="white" /> : <Text style={styles.acceptText}>Accept Delivery</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {renderHeader()}
      
      <FlatList 
        data={availableOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={{ padding: SPACING.m, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetchPool(); refetchActive(); }} />}
        ListHeaderComponent={<Text style={[styles.sectionTitle, { color: colors.text }]}>Available Nearby ({availableOrders?.length || 0})</Text>}
        ListEmptyComponent={
          !isLoadingPool ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="bike-fast" size={60} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>No orders available right now.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginRight: 6 },
  statusText: { color: '#16A34A', fontWeight: 'bold', fontSize: 12 },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.small },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  restImg: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#eee' },
  restInfo: { flex: 1, marginLeft: 12 },
  restName: { fontWeight: 'bold', fontSize: 16 },
  restAddr: { fontSize: 12 },
  priceTag: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priceText: { color: 'white', fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeText: { marginLeft: 8, flex: 1, fontSize: 14 },
  distanceText: { fontSize: 12 },
  acceptBtn: { backgroundColor: COLORS.primary, marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  acceptText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10 },
});