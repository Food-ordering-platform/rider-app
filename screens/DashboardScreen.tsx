import React, { useCallback, useState } from "react";
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
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { useTheme } from "../context/themeContext";
import { useDispatcherDashboard, useAcceptOrder } from "../services/dispatch/dispatch.queries";
import { DispatchOrder } from "../types/dispatch.types";

// Base URL for the shareable link (Update this to your actual deployed frontend URL)
const WEB_LINK_BASE = "https://choweazy.com/ride"; 

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  
  const { data, isLoading, refetch, isRefetching } = useDispatcherDashboard();
  const { mutate: acceptOrder, isPending: isAccepting } = useAcceptOrder();

  const handleAccept = (orderId: string) => {
    acceptOrder({ orderId }, {
        onSuccess: () => {
            refetch(); // Refresh to get the tracking ID
            Alert.alert("Success", "Job Accepted! Now share the link with a rider.");
        }
    });
  };

  const handleShareLink = async (trackingId: string) => {
    const url = `${WEB_LINK_BASE}/${trackingId}`;
    try {
        await Share.share({
            message: `📦 New Delivery Job!\n\nPick up at Vendor and deliver to Customer.\n\nClick here to start: ${url}`,
        });
    } catch (error) {
        Alert.alert("Error", "Could not share link");
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
        <View>
            <Text style={[styles.greeting, { color: colors.textLight }]}>Hello,</Text>
            <Text style={[styles.partnerName, { color: colors.text }]}>
                {data?.partnerName || user?.name || "Dispatcher"}
            </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={logout}>
             <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
        {/* Wallet Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>₦{(data?.availableBalance || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.iconCircle}>
                <Ionicons name="wallet" size={24} color={colors.primary} />
            </View>
        </View>

        {/* Row for Pending & Active */}
        <View style={styles.statsRow}>
            {/* Pending Balance */}
            <View style={[styles.statBox, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Pending (On Road)</Text>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                    ₦{(data?.pendingBalance || 0).toLocaleString()}
                </Text>
            </View>

            {/* Active Jobs Count */}
            <View style={[styles.statBox, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Active Deliveries</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{data?.stats.activeJobs || 0}</Text>
            </View>
        </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: DispatchOrder }) => {
    // Determine Card State
    const isAssignedToMe = item.trackingId !== null;
    const isClaimedByRider = !!item.riderName;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
        
        {/* Header: ID & Fee */}
        <View style={styles.cardHeader}>
            <View style={styles.idRow}>
                <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                    <MaterialCommunityIcons name="bike" size={20} color="#8B5CF6" />
                </View>
                <Text style={[styles.orderId, { color: colors.text }]}>#{item.id.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={styles.priceTag}>
                <Text style={styles.priceText}>₦{item.deliveryFee}</Text>
            </View>
        </View>

        {/* Locations */}
        <View style={styles.locationContainer}>
            {/* Vendor */}
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.locText}>
                    <Text style={[styles.locTitle, { color: colors.text }]}>{item.vendor.name}</Text>
                    <Text numberOfLines={1} style={[styles.locAddress, { color: colors.textLight }]}>{item.vendor.address}</Text>
                </View>
            </View>
            
            {/* Vertical Line */}
            <View style={styles.verticalLine} />

            {/* Customer */}
            <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View style={styles.locText}>
                    <Text style={[styles.locTitle, { color: colors.text }]}>{item.customer.name}</Text>
                    <Text numberOfLines={1} style={[styles.locAddress, { color: colors.textLight }]}>{item.customer.address}</Text>
                </View>
            </View>
        </View>

        {/* 🚀 RIDER IDENTITY SECTION (New) */}
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
            <View style={[styles.riderInfoBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <Text style={[styles.riderName, { color: '#B45309', marginLeft: 8, fontSize: 13 }]}>
                    Waiting for rider to click link...
                </Text>
            </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
            {!isAssignedToMe ? (
                // 1. New Job -> Accept It
                <TouchableOpacity 
                    style={[styles.mainBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAccept(item.id)}
                    disabled={isAccepting}
                >
                    <Text style={styles.mainBtnText}>Accept Job</Text>
                </TouchableOpacity>
            ) : (
                // 2. Accepted -> Share Link (Even if claimed, you might need to reshare)
                <TouchableOpacity 
                    style={[styles.mainBtn, { backgroundColor: '#10B981' }]}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
            ListHeaderComponent={
                <>
                    {renderHeader()}
                    {renderStats()}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Orders</Text>
                </>
            }
            data={data?.activeOrders || []}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={{color: colors.textLight}}>No active jobs right now.</Text>
                </View>
            }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '500' },
  partnerName: { fontSize: 24, fontWeight: '800' },
  profileBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },

  // Stats
  statsContainer: { marginBottom: 30 },
  balanceCard: { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 4, shadowColor: '#7B1E3A', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: '800' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, elevation: 1 },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800' },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  // Card
  card: { borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 16, fontWeight: '800' },
  priceTag: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceText: { color: '#059669', fontWeight: '800', fontSize: 14 },

  // Locations
  locationContainer: { marginBottom: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locText: { flex: 1 },
  locTitle: { fontSize: 14, fontWeight: '700' },
  locAddress: { fontSize: 12 },
  verticalLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 2 },

  // Rider Info Box
  riderInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  riderAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  riderLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  riderName: { fontSize: 14, color: '#1F2937', fontWeight: '700' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },

  // Actions
  actionRow: { flexDirection: 'row' },
  mainBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  emptyContainer: { alignItems: 'center', padding: 40 }
});