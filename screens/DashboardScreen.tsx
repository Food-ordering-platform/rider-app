import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Linking,
  Share,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatchOrder } from "../types/dispatch.types";
import { getTimeAgo } from "../hooks/useGetTime";
import { COLORS } from "@/constants/theme";

const WEB_LINK_BASE = "https://choweazy.com/ride"; 

type TabType = "ACTIVE" | "DELIVERED";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { data, refetch, isRefetching } = useDispatcherDashboard();
  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();
  
  const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // 🔍 Filter Logic
  const filteredOrders = useMemo(() => {
    if (!data?.activeOrders) return [];
    return data.activeOrders.filter(order => {
        if (activeTab === "ACTIVE") {
            return order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY';
        }
        return order.status === 'DELIVERED';
    });
  }, [data, activeTab]);

  const handleAccept = (orderId: string) => {
    setLoadingOrderId(orderId);
    acceptOrder({ orderId }, {
        onSuccess: () => {
            setLoadingOrderId(null);
            refetch(); 
            Alert.alert("Success", "Job Accepted! Now share the link with a rider.");
        },
        onError: () => {
            setLoadingOrderId(null);
            Alert.alert("Error", "Failed to accept job.");
        }
    });
  };

  const handleShareLink = async (trackingId: string) => {
    const url = `${WEB_LINK_BASE}/${trackingId}`;
    try {
        await Share.share({
            message: `📦 New Delivery Job!\n\nPick up at Vendor and deliver to Customer.\n\nClick here to start: ${url}`,
        });
    } catch (error: any) {
        Alert.alert("Error", "Could not share link");
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
        <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.partnerName}>
                {data?.partnerName || user?.name || "Dispatcher"}
            </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={logout}>
             <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
        <View style={styles.balanceCard}>
            <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>₦{(data?.availableBalance || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.iconCircle}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
            </View>
        </View>

        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pending (On Road)</Text>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>
                    ₦{(data?.pendingBalance || 0).toLocaleString()}
                </Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Active Deliveries</Text>
                <Text style={styles.statValue}>{data?.stats.activeJobs || 0}</Text>
            </View>
        </View>
    </View>
  );

  // 🆕 TABS COMPONENT
  const renderTabs = () => (
    <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === "ACTIVE" && styles.activeTab]}
            onPress={() => setActiveTab("ACTIVE")}
        >
            <Text style={[styles.tabText, activeTab === "ACTIVE" && styles.activeTabText]}>Active Orders</Text>
            {/* Show badge count for active items */}
            {data?.stats.activeJobs ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data.stats.activeJobs}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.tab, activeTab === "DELIVERED" && styles.activeTab]}
            onPress={() => setActiveTab("DELIVERED")}
        >
            <Text style={[styles.tabText, activeTab === "DELIVERED" && styles.activeTabText]}>Delivered</Text>
        </TouchableOpacity>
    </View>
  );

  const renderOrderItem = ({ item }: { item: DispatchOrder }) => {
    const isAssignedToMe = item.trackingId !== null;
    const isClaimedByRider = !!item.riderName;
    const isDelivered = item.status === 'DELIVERED';

    const displayId = item.reference ? item.reference.slice(0, 6).toUpperCase() : item.id.slice(-6).toUpperCase();

    return (
      <View style={[styles.card, isDelivered && { opacity: 0.8 }]}>
        
        {/* Header */}
        <View style={styles.cardHeader}>
            <View style={styles.idRow}>
                <View style={[styles.iconBox, isDelivered && { backgroundColor: '#ECFDF5' }]}>
                    <MaterialCommunityIcons 
                        name={isDelivered ? "check-circle" : "bike"} 
                        size={20} 
                        color={isDelivered ? COLORS.success : COLORS.primary} 
                    />
                </View>
                <View>
                    <Text style={styles.orderId}>#{displayId}</Text>
                    <Text style={styles.timeAgo}>
                        {isDelivered ? "Delivered" : "Posted"} {getTimeAgo(item.postedAt)}
                    </Text>
                </View>
            </View>
            <View style={styles.priceTag}>
                <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
            </View>
        </View>

        {/* Locations */}
        <View style={styles.locationContainer}>
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: isDelivered ? '#D1D5DB' : COLORS.warning }]} />
                <View style={styles.locText}>
                    <Text style={styles.locTitle}>{item.vendor.name}</Text>
                    <Text numberOfLines={1} style={styles.locAddress}>{item.vendor.address}</Text>
                </View>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: isDelivered ? COLORS.success : COLORS.primary }]} />
                <View style={styles.locText}>
                    <Text style={styles.locTitle}>{item.customer.name}</Text>
                    <Text numberOfLines={1} style={styles.locAddress}>{item.customer.address}</Text>
                </View>
            </View>
        </View>

        {/* Rider Info (Show only if active or if admin wants to see history) */}
        {isClaimedByRider ? (
            <View style={styles.riderInfoBox}>
                <View style={styles.riderAvatar}>
                    <Ionicons name="person" size={16} color="#4B5563" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.riderLabel}>Completed By</Text>
                    <Text style={styles.riderName}>{item.riderName}</Text>
                </View>
                {/* Only show call button if active */}
                {!isDelivered && (
                    <TouchableOpacity 
                        style={styles.callBtn} 
                        onPress={() => Linking.openURL(`tel:${item.riderPhone}`)}
                    >
                        <Ionicons name="call" size={18} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        ) : isAssignedToMe && !isDelivered ? (
            <View style={[styles.riderInfoBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                <Text style={[styles.riderName, { color: '#B45309', marginLeft: 8, fontSize: 13 }]}>
                    Waiting for rider to click link...
                </Text>
            </View>
        ) : null}

        {/* Action Buttons (Only for Active Orders) */}
        {!isDelivered && (
            <View style={styles.actionRow}>
                {!isAssignedToMe ? (
                    <TouchableOpacity 
                        style={[styles.mainBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => handleAccept(item.id)}
                        disabled={isAccepting}
                    >
                        {loadingOrderId === item.id ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.mainBtnText}>Accept Job</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.mainBtn, { backgroundColor: COLORS.success }]}
                        onPress={() => handleShareLink(item.trackingId!)}
                    >
                        <Ionicons name="share-social" size={18} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.mainBtnText}>
                            {isClaimedByRider ? "Reshare Link" : "Share with Rider"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
            ListHeaderComponent={
                <>
                    {renderHeader()}
                    {renderStats()}
                    {renderTabs()} 
                </>
            }
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name={activeTab === 'ACTIVE' ? "moped" : "history"} size={48} color={COLORS.textLight} />
                    <Text style={{color: COLORS.textLight, marginTop: 10}}>
                        {activeTab === 'ACTIVE' ? "No active jobs right now." : "No delivered history yet."}
                    </Text>
                </View>
            }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  partnerName: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  profileBtn: { padding: 8, backgroundColor: 'white', borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },

  statsContainer: { marginBottom: 20 },
  balanceCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, shadowColor: COLORS.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: '800' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  activeTabText: { color: COLORS.primary, fontWeight: '700' },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },

  // Card
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  timeAgo: { fontSize: 12, color: COLORS.textLight },
  priceTag: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceText: { color: COLORS.success, fontWeight: '800', fontSize: 14 },

  locationContainer: { marginBottom: 16, padding: 12, backgroundColor: COLORS.background, borderRadius: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locText: { flex: 1 },
  locTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  locAddress: { fontSize: 12, color: COLORS.textLight },
  verticalLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 4 },

  riderInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  riderAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  riderLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
  riderName: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },

  actionRow: { flexDirection: 'row' },
  mainBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  emptyContainer: { alignItems: 'center', padding: 40, opacity: 0.7 }
});