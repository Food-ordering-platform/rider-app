import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/authContext";
import {
  useGetAvailableOrders,
  useGetHistory,
  useAcceptOrder,
  useGetActiveOrder,
  useUpdateStatus, // 🟢 IMPORTED THIS
} from "../services/rider/rider.queries";
import { RiderOrder } from "../types/rider.types";
import { COLORS, SHADOWS } from "../constants/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect } from "@react-navigation/native";

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Assuming user object has 'isOnline' from DB

  // --- STATE ---
  // Initialize from user profile if available, default to false (safe)
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? false); 
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // --- QUERIES & MUTATIONS ---
  const { data: activeOrder, refetch: refetchActive } = useGetActiveOrder();
  
  const {
    data: availableOrders,
    isLoading: loadingNew,
    refetch: refetchNew,
  } = useGetAvailableOrders();

  const {
    data: historyOrders,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useGetHistory();

  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();
  
  // 🟢 NEW: Status Mutation
  const { mutate: updateStatus, isPending: isToggling } = useUpdateStatus();

  // --- SYNC STATE ---
  // If the user profile updates in the background, sync the switch
  useEffect(() => {
    if (user?.isOnline !== undefined) {
      setIsOnline(user.isOnline);
    }
  }, [user?.isOnline]);

  // --- HANDLERS ---

  // 🟢 Handle Online/Offline Toggle
  const handleStatusChange = (value: boolean) => {
    // 1. Optimistic Update (Update UI immediately)
    setIsOnline(value);

    // 2. Call API
    updateStatus(value, {
      onError: () => {
        // 3. Revert if API fails
        setIsOnline(!value);
      },
    });
  };

  // Refresh Logic
  const onRefresh = useCallback(() => {
    refetchActive();
    if (activeTab === "new") refetchNew();
    else refetchHistory();
  }, [activeTab, refetchActive, refetchNew, refetchHistory]);

  // Auto-refresh when screen appears
  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  // --- RENDERERS ---

  const renderHeader = () => {
    const isBusy = !!activeOrder;
    // If you have an active order, you are "working" regardless of the switch
    const displayStatus = isBusy ? "On Delivery" : isOnline ? "Available" : "Offline";
    const isActiveColor = isBusy || isOnline;

    return (
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textLight }]}>
            {displayStatus}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Hello, {user?.name?.split(" ")[0] || "Rider"}
          </Text>
        </View>

        {/* Status Indicator & Switch */}
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isActiveColor ? COLORS.primary : colors.border },
            ]}
          >
            <View style={styles.statusDot} />
          </View>
          
          <Switch
            value={isOnline}
            onValueChange={handleStatusChange} // 🟢 Connected to handler
            trackColor={{ false: colors.border, true: `${COLORS.primary}40` }}
            thumbColor={isOnline ? COLORS.primary : colors.textLight}
            disabled={isBusy || isToggling} // Disable if on a trip or loading
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === "new" && [
            styles.activeTabBtn,
            { backgroundColor: colors.background },
          ],
        ]}
        onPress={() => setActiveTab("new")}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textLight },
            activeTab === "new" && [
              styles.activeTabText,
              { color: colors.text },
            ],
          ]}
        >
          Available
        </Text>
        {availableOrders && availableOrders.length > 0 && (
          <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.badgeText}>{availableOrders.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === "history" && [
            styles.activeTabBtn,
            { backgroundColor: colors.background },
          ],
        ]}
        onPress={() => setActiveTab("history")}
      >
        <Text
          style={[
            styles.tabText,
            { color: colors.textLight },
            activeTab === "history" && [
              styles.activeTabText,
              { color: colors.text },
            ],
          ]}
        >
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewOrder = ({ item }: { item: RiderOrder }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Restaurant Header */}
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri: item.restaurant.imageUrl || "https://via.placeholder.com/100",
          }}
          style={styles.restImg}
        />
        <View style={styles.restInfo}>
          <Text
            style={[styles.restName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.restaurant.name}
          </Text>
          <Text
            style={[styles.restAddr, { color: colors.textLight }]}
            numberOfLines={1}
          >
            {item.restaurant.address}
          </Text>
        </View>
      </View>

      {/* Delivery Fee */}
      <View
        style={[styles.feeContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.feeLabel, { color: colors.textLight }]}>
          Delivery Fee
        </Text>
        <Text style={[styles.feeAmount, { color: COLORS.primary }]}>
          ₦{item.deliveryFee}
        </Text>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View
            style={[styles.routeDot, { backgroundColor: colors.textLight }]}
          />
          <View style={styles.routeTextContainer}>
            <Text style={[styles.routeLabel, { color: colors.textLight }]}>
              Pickup
            </Text>
            <Text
              style={[styles.routeAddress, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.restaurant.address}
            </Text>
          </View>
        </View>

        <View style={[styles.routeLine, { backgroundColor: colors.border }]} />

        <View style={styles.routePoint}>
          <View
            style={[styles.routeDot, { backgroundColor: COLORS.primary }]}
          />
          <View style={styles.routeTextContainer}>
            <Text style={[styles.routeLabel, { color: colors.textLight }]}>
              Dropoff
            </Text>
            <Text
              style={[styles.routeAddress, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.deliveryAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Accept Button */}
      <TouchableOpacity
        style={[styles.acceptBtn, { backgroundColor: COLORS.primary }]}
        onPress={() => acceptOrder(item.id)}
        disabled={isAccepting}
        activeOpacity={0.8}
      >
        {isAccepting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>Accept Order</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderHistory = ({ item }: { item: RiderOrder }) => {
    const itemsText =
      item.items && item.items.length > 0
        ? item.items.map((i) => `${i.quantity}x ${i.menuItemName}`).join(", ")
        : "Order completed";

    return (
      <View
        style={[
          styles.historyCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Header */}
        <View style={styles.historyHeader}>
          <View style={styles.historyHeaderLeft}>
            <Text style={[styles.historyDate, { color: colors.textLight }]}>
              {format(new Date(item.createdAt), "MMM d, h:mm a")}
            </Text>
            <Text style={[styles.historyRef, { color: colors.textLight }]}>
              #{item.reference}
            </Text>
          </View>
          <View
            style={[
              styles.completedBadge,
              { backgroundColor: `${COLORS.primary}15` },
            ]}
          >
            <View
              style={[styles.completedDot, { backgroundColor: COLORS.primary }]}
            />
            <Text style={[styles.completedText, { color: COLORS.primary }]}>
              Completed
            </Text>
          </View>
        </View>

        {/* Restaurant & Items */}
        <View style={styles.historyMain}>
          <Image
            source={{
              uri:
                item.restaurant.imageUrl || "https://via.placeholder.com/100",
            }}
            style={styles.historyImg}
          />
          <View style={styles.historyInfo}>
            <Text
              style={[styles.historyName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.restaurant.name}
            </Text>
            <Text
              style={[styles.historyItems, { color: colors.textLight }]}
              numberOfLines={1}
            >
              {itemsText}
            </Text>
          </View>
          <Text style={[styles.historyEarnings, { color: COLORS.primary }]}>
            +₦{item.deliveryFee}
          </Text>
        </View>

        {/* Mini Route */}
        <View
          style={[styles.miniRoute, { backgroundColor: colors.background }]}
        >
          <View style={styles.miniRoutePoint}>
            <View
              style={[styles.miniDot, { backgroundColor: colors.textLight }]}
            />
            <Text
              style={[styles.miniText, { color: colors.textLight }]}
              numberOfLines={1}
            >
              {item.restaurant.address}
            </Text>
          </View>
          <View style={styles.miniArrow}>
            <Ionicons name="arrow-down" size={12} color={colors.textLight} />
          </View>
          <View style={styles.miniRoutePoint}>
            <View
              style={[styles.miniDot, { backgroundColor: COLORS.primary }]}
            />
            <Text
              style={[styles.miniText, { color: colors.textLight }]}
              numberOfLines={1}
            >
              {item.deliveryAddress}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // --- OFFLINE STATE ---
  if (!isOnline && !activeOrder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.offlineContainer}>
          <View
            style={[styles.offlineIcon, { backgroundColor: colors.surface }]}
          >
            <MaterialIcons
              name="cloud-off"
              size={48}
              color={colors.textLight}
            />
          </View>
          <Text style={[styles.offlineTitle, { color: colors.text }]}>
            You&apos;re Offline
          </Text>
          <Text style={[styles.offlineSubtitle, { color: colors.textLight }]}>
            Turn on to start receiving delivery requests
          </Text>
          
          <TouchableOpacity
            style={[
              styles.goOnlineBtn, 
              { backgroundColor: COLORS.primary, opacity: isToggling ? 0.7 : 1 }
            ]}
            onPress={() => handleStatusChange(true)} // 🟢 Use new handler
            activeOpacity={0.8}
            disabled={isToggling}
          >
            {isToggling ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Go Online</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {renderHeader()}
      {renderTabs()}

      <FlatList
        data={activeTab === "new" ? availableOrders : historyOrders}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === "new" ? renderNewOrder : renderHistory}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={activeTab === "new" ? loadingNew : loadingHistory}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.surface }]}
            >
              <MaterialIcons
                name={activeTab === "new" ? "delivery-dining" : "history"}
                size={48}
                color={colors.textLight}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              {activeTab === "new"
                ? "No delivery requests available"
                : "No completed deliveries yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  activeTabBtn: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  activeTabText: {
    fontWeight: "700",
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  // New Order Card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  restImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  restInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  restAddr: {
    fontSize: 13,
    lineHeight: 18,
  },
  feeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  feeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  routeLine: {
    width: 2,
    height: 20,
    marginLeft: 4,
    marginVertical: 4,
  },
  acceptBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.3,
  },

  // History Card
  historyCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyHeaderLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  historyRef: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  historyMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  historyImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyName: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  historyItems: {
    fontSize: 12,
    lineHeight: 16,
  },
  historyEarnings: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: -0.3,
    marginLeft: 8,
  },
  miniRoute: {
    padding: 10,
    borderRadius: 10,
  },
  miniRoutePoint: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  miniText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  miniArrow: {
    marginLeft: 1,
    marginVertical: 2,
  },

  // List
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // Offline State
  offlineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  offlineIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  offlineSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  goOnlineBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
});