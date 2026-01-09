import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatcherDashboard } from "../services/dispatch/dispatch.queries";
import { getTimeAgo } from "../hooks/useGetTime";

const COLORS = { 
  primary: "#7B1E3A", 
  background: "#F9FAFB", 
  success: "#10B981", 
  text: "#1F2937",
  textLight: "#6B7280",
  white: "#FFFFFF",
  warning: "#F59E0B"
};

export default function ActiveTripScreen() {
  const { data, refetch, isRefetching } = useDispatcherDashboard();

  // Filter: Show orders that are "OUT_FOR_DELIVERY" OR "Assigned & READY_FOR_PICKUP"
  const activeTrips = useMemo(() => {
    return data?.activeOrders.filter(o => {
        const isMoving = o.status === 'OUT_FOR_DELIVERY';
        const isAssigned = o.status === 'READY_FOR_PICKUP' && o.riderName; // Rider is going to vendor
        return isMoving || isAssigned;
    }) || [];
  }, [data]);

  const handleCall = (phone?: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // Keep this helper: It opens the External Google Maps App (Navigation)
  // This is still useful for the Admin to check distances without "Tracking"
  const handleOpenRoute = (vendor: any, customer: any) => {
    if (vendor.latitude && vendor.longitude && customer.deliveryLatitude && customer.deliveryLongitude) {
        const url = `http://googleusercontent.com/maps.google.com/?saddr=${vendor.latitude},${vendor.longitude}&daddr=${customer.deliveryLatitude},${customer.deliveryLongitude}`;
        Linking.openURL(url);
    }
  };

  const renderActiveTrip = ({ item }: { item: any }) => {
    const isPickingUp = item.status === 'READY_FOR_PICKUP';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.riderRow}>
              <View style={[styles.avatar, isPickingUp && { backgroundColor: COLORS.warning }]}>
                  <Ionicons name="bicycle" size={20} color="white" />
              </View>
              <View>
                  <Text style={styles.riderLabel}>
                    {isPickingUp ? "Going to Vendor" : "Delivering"}
                  </Text>
                  <Text style={styles.riderName}>{item.riderName || "Unknown Rider"}</Text>
              </View>
          </View>
          <View style={{flexDirection: 'row', gap: 8}}>
              {/* External Map Button (Optional helper) */}
              <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                  onPress={() => handleOpenRoute(item.vendor, item.customer)}
              >
                  <Ionicons name="map" size={18} color="#2563EB" />
              </TouchableOpacity>

              {/* Call Button */}
              <TouchableOpacity 
                  style={[styles.actionBtn, !item.riderPhone && { backgroundColor: '#F3F4F6' }]}
                  onPress={() => handleCall(item.riderPhone)}
                  disabled={!item.riderPhone}
              >
                  <Ionicons name="call" size={18} color={item.riderPhone ? COLORS.success : "#9CA3AF"} />
              </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: COLORS.success }]} />
            <View style={[styles.progressLine, isPickingUp && { backgroundColor: '#E5E7EB' }]} />
            <View style={[styles.progressDot, isPickingUp && { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }, !isPickingUp && { backgroundColor: COLORS.success }]} />
        </View>
        <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Vendor</Text>
            <Text style={styles.progressText}>Customer</Text>
        </View>

        <View style={styles.detailsContainer}>
            <View style={styles.locationRow}>
                <Ionicons name="restaurant" size={14} color={COLORS.textLight} style={{marginTop:2}} />
                <Text style={styles.locationText} numberOfLines={1}>{item.vendor.address}</Text>
            </View>
            <View style={styles.locationConnector} />
            <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={COLORS.primary} style={{marginTop:2}} />
                <Text style={[styles.locationText, {fontWeight: '700'}]} numberOfLines={1}>{item.customer.address}</Text>
            </View>
        </View>

        <View style={styles.footerRow}>
            <Text style={styles.timeText}>Updated {getTimeAgo(item.postedAt)}</Text>
            <Text style={styles.refText}>#{item.reference?.slice(0, 6).toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>Live Fleet Tracking</Text>
            <Text style={styles.subtitle}>
                {activeTrips.length} {activeTrips.length === 1 ? 'Rider' : 'Riders'} active
            </Text>
        </View>
        <View style={styles.liveBadge}>
            <View style={styles.blink} />
            <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <FlatList
        data={activeTrips}
        renderItem={renderActiveTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No active trips right now.</Text>
                <Text style={styles.emptySub}>Riders will appear here when they accept a job.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  liveText: { color: '#EF4444', fontSize: 10, fontWeight: '800', marginLeft: 6 },
  blink: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },

  listContent: { padding: 20, paddingTop: 0 },

  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  riderLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
  riderName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 10 },
  progressDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.success, backgroundColor: 'white' },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.success, marginHorizontal: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 0 },
  progressText: { fontSize: 10, fontWeight: '600', color: COLORS.textLight },

  detailsContainer: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 12 },
  locationRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  locationText: { fontSize: 13, color: COLORS.text, flex: 1 },
  locationConnector: { width: 2, height: 10, backgroundColor: '#D1D5DB', marginLeft: 6, marginVertical: 2 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },
  refText: { fontSize: 12, fontWeight: '700', color: COLORS.textLight },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 }
});