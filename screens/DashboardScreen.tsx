import React, { useState } from "react";
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

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  
  const { data, refetch, isRefetching } = useDispatcherDashboard();
  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();
  
  // Local state to track which order is being accepted (for loading spinner)
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

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
        {/* Wallet Card */}
        <View style={styles.balanceCard}>
            <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>₦{(data?.availableBalance || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.iconCircle}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
            </View>
        </View>

        {/* Row for Pending & Active */}
        <View style={styles.statsRow}>
            {/* Pending Balance */}
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pending (On Road)</Text>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>
                    ₦{(data?.pendingBalance || 0).toLocaleString()}
                </Text>
            </View>

            {/* Active Jobs Count */}
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Active Deliveries</Text>
                <Text style={styles.statValue}>{data?.stats.activeJobs || 0}</Text>
            </View>
        </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: DispatchOrder }) => {
    const isAssignedToMe = item.trackingId !== null;
    const isClaimedByRider = !!item.riderName;

    // Use reference if available, otherwise slice ID
    const displayId = item.reference ? item.reference.slice(0, 6).toUpperCase() : item.id.slice(-6).toUpperCase();

    return (
      <View style={styles.card}>
        
        {/* Header: ID & Fee */}
        <View style={styles.cardHeader}>
            <View style={styles.idRow}>
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="bike" size={20} color={COLORS.primary} />
                </View>
                <View>
                    <Text style={styles.orderId}>#{displayId}</Text>
                    {/* Time Ago Implementation */}
                    <Text style={styles.timeAgo}>{getTimeAgo(item.postedAt)}</Text>
                </View>
            </View>
            <View style={styles.priceTag}>
                <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
            </View>
        </View>

        {/* Locations */}
        <View style={styles.locationContainer}>
            {/* Vendor */}
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
                <View style={styles.locText}>
                    <Text style={styles.locTitle}>{item.vendor.name}</Text>
                    <Text numberOfLines={1} style={styles.locAddress}>{item.vendor.address}</Text>
                </View>
            </View>
            
            {/* Vertical Line */}
            <View style={styles.verticalLine} />

            {/* Customer */}
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                <View style={styles.locText}>
                    <Text style={styles.locTitle}>{item.customer.name}</Text>
                    <Text numberOfLines={1} style={styles.locAddress}>{item.customer.address}</Text>
                </View>
            </View>
        </View>

        {/* Rider Info */}
        {isClaimedByRider ? (
            <View style={styles.riderInfoBox}>
                <View style={styles.riderAvatar}>
                    <Ionicons name="person" size={16} color="#4B5563" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.riderLabel}>Delivery Rider</Text>
                    <Text style={styles.riderName}>{item.riderName}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.callBtn} 
                    onPress={() => Linking.openURL(`tel:${item.riderPhone}`)}
                >
                    <Ionicons name="call" size={18} color="white" />
                </TouchableOpacity>
            </View>
        ) : isAssignedToMe ? (
            <View style={[styles.riderInfoBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                <Text style={[styles.riderName, { color: '#B45309', marginLeft: 8, fontSize: 13 }]}>
                    Waiting for rider to click link...
                </Text>
            </View>
        ) : null}

        {/* Action Buttons */}
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
                    <Text style={styles.sectionTitle}>Active Orders</Text>
                </>
            }
            data={data?.activeOrders || []}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="moped" size={48} color={COLORS.textLight} />
                    <Text style={{color: COLORS.textLight, marginTop: 10}}>No active jobs right now.</Text>
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
  
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  partnerName: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  profileBtn: { padding: 8, backgroundColor: 'white', borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },

  // Stats
  statsContainer: { marginBottom: 30 },
  balanceCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, shadowColor: COLORS.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: '800' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

  // Card
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  timeAgo: { fontSize: 12, color: COLORS.textLight },
  priceTag: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceText: { color: COLORS.success, fontWeight: '800', fontSize: 14 },

  // Locations
  locationContainer: { marginBottom: 16, padding: 12, backgroundColor: COLORS.background, borderRadius: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locText: { flex: 1 },
  locTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  locAddress: { fontSize: 12, color: COLORS.textLight },
  verticalLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 4 },

  // Rider Info Box
  riderInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  riderAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  riderLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
  riderName: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },

  // Actions
  actionRow: { flexDirection: 'row' },
  mainBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  emptyContainer: { alignItems: 'center', padding: 40, opacity: 0.7 }
});