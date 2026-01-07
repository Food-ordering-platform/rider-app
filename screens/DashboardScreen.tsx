import React from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  RefreshControl, StatusBar, ActivityIndicator, Image, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useDashboardLogic } from "../hooks/useDashboardLogic"; // Import the hook
import { DispatcherOrder } from "../types/dispatch.types";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  // 👇 All logic is hidden inside this one line
  const {
    isLoading, isRefetching, isAccepting,
    requests, activeTrips, stats, activeTab,
    partnerName, pendingBalance,
    refetch, setActiveTab, handleAccept, handleShare, navigateToProfile
  } = useDashboardLogic();

  // --- UI Components (Pure Rendering) ---

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
        <Text style={styles.greeting}>Hello, {partnerName.split(' ')[0]}</Text>
      </View>
      <TouchableOpacity style={styles.profileBtn} onPress={navigateToProfile}>
        <Image 
            source={{ uri: `https://ui-avatars.com/api/?name=${partnerName}&background=FF6B00&color=fff` }}
            style={styles.avatar} 
        />
        <View style={styles.onlineDot} />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsRow}>
      {/* 1. Pending Pay */}
      <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
        <View style={styles.statIconBox}>
            <Ionicons name="wallet" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.statLabel}>Pending Pay</Text>
        <Text style={styles.statValue}>₦{pendingBalance.toLocaleString()}</Text>
      </View>

      {/* 2. Active Riders */}
      <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
        <View style={styles.statIconBox}>
            <Ionicons name="bicycle" size={18} color="#10B981" />
        </View>
        <Text style={styles.statLabel}>Active Riders</Text>
        <Text style={styles.statValue}>{activeTrips.length}</Text>
      </View>

      {/* 3. Completed */}
      <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
        <View style={styles.statIconBox}>
            <Ionicons name="checkmark-done" size={18} color="#3B82F6" />
        </View>
        <Text style={styles.statLabel}>Completed</Text>
        <Text style={styles.statValue}>{stats.totalJobs}</Text>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
        onPress={() => setActiveTab('requests')}
      >
        <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
          New Requests {requests.length > 0 && <View style={styles.badge} />}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
        onPress={() => setActiveTab('active')}
      >
        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
          Active Fleet ({activeTrips.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCard = ({ item }: { item: DispatcherOrder }) => {
    const isRequest = !item.trackingId;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: isRequest ? '#FFF7ED' : '#ECFDF5' }]}>
                    <Text style={[styles.statusText, { color: isRequest ? '#C2410C' : '#047857' }]}>
                        {isRequest ? "PENDING ACCEPTANCE" : "IN PROGRESS"}
                    </Text>
                </View>
                <Text style={styles.feeText}>₦{item.deliveryFee.toLocaleString()}</Text>
            </View>
        </View>

        <View style={styles.content}>
            <View style={styles.locationItem}>
                <Ionicons name="storefront" size={16} color="#9CA3AF" style={{marginTop:2}} />
                <View style={{marginLeft: 10, flex:1}}>
                    <Text style={styles.locLabel}>Pickup From</Text>
                    <Text style={styles.locAddress}>{item.vendor.name}</Text>
                    <Text style={styles.locSub}>{item.vendor.address}</Text>
                </View>
            </View>

            <View style={styles.connector} />

            <View style={styles.locationItem}>
                <Ionicons name="location" size={16} color={COLORS.primary} style={{marginTop:2}} />
                <View style={{marginLeft: 10, flex:1}}>
                    <Text style={styles.locLabel}>Deliver To</Text>
                    <Text style={styles.locAddress}>{item.customer.name}</Text>
                    <Text style={styles.locSub}>{item.customer.address}</Text>
                </View>
            </View>
        </View>

        <View style={styles.footer}>
            {isRequest ? (
                <TouchableOpacity 
                    style={styles.btnPrimary}
                    onPress={() => handleAccept(item.id)}
                >
                    <Text style={styles.btnText}>Accept Order</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity 
                    style={styles.btnWhatsapp}
                    onPress={() => handleShare(item)}
                >
                    <FontAwesome5 name="whatsapp" size={18} color="white" />
                    <Text style={styles.btnText}>Share Link with Rider</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={60} color="#E5E7EB" />
        <Text style={styles.emptyTitle}>
            {activeTab === 'requests' ? "No Pending Requests" : "No Active Deliveries"}
        </Text>
        <Text style={styles.emptySub}>
            {activeTab === 'requests' 
             ? "Wait for vendors to assign orders to you." 
             : "You have no riders on the road right now."}
        </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {isAccepting && (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <FlatList
        ListHeaderComponent={
            <View style={{padding: 20, paddingBottom: 10}}>
                {renderHeader()}
                {renderStats()}
                {renderTabs()}
            </View>
        }
        data={activeTab === 'requests' ? requests : activeTrips}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={isLoading ? <ActivityIndicator style={{marginTop: 50}} color={COLORS.primary}/> : null}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary}/>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  date: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#111827' },
  profileBtn: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'white' },
  onlineDot: { width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 6, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#F9FAFB' },

  // Stats Grid
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: (width - 50) / 3, padding: 12, borderRadius: 16, alignItems: 'flex-start', height: 100, justifyContent: 'space-between' },
  statIconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600', marginTop: 8 },
  statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontWeight: '600', color: '#6B7280', fontSize: 13 },
  activeTabText: { color: '#111827', fontWeight: '700' },
  badge: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginLeft: 6 },

  // Cards
  card: { backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  feeText: { fontSize: 16, fontWeight: '800', color: '#111827' },

  content: { marginBottom: 16 },
  locationItem: { flexDirection: 'row', alignItems: 'flex-start' },
  locLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
  locAddress: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginVertical: 2 },
  locSub: { fontSize: 12, color: '#6B7280' },
  connector: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginLeft: 8, marginVertical: 4 },

  // Footer Buttons
  footer: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  btnPrimary: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  btnWhatsapp: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 14, marginHorizontal: 8 },

  // Utils
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 250, marginTop: 4 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 50, alignItems: 'center', justifyContent: 'center' }
});