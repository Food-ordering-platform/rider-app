import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
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

const { width, height } = Dimensions.get('window');

export default function ActiveTripScreen() {
  const { data, refetch, isRefetching } = useDispatcherDashboard();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // 👈 Toggle State

  const activeTrips = useMemo(() => {
    return data?.activeOrders.filter(o => o.status === 'OUT_FOR_DELIVERY') || [];
  }, [data]);

  // --- ACTIONS ---
  const handleCall = (phone?: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleOpenRoute = (vendor: any, customer: any) => {
    if (vendor.latitude && vendor.longitude && customer.latitude && customer.longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${vendor.latitude},${vendor.longitude}&destination=${customer.latitude},${customer.longitude}`;
        Linking.openURL(url);
    }
  };

  // --- RENDERERS ---
  const renderActiveTrip = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.riderRow}>
            <View style={styles.avatar}>
                <Ionicons name="bicycle" size={20} color="white" />
            </View>
            <View>
                <Text style={styles.riderLabel}>Rider</Text>
                <Text style={styles.riderName}>{item.riderName || "Unknown Rider"}</Text>
            </View>
        </View>
        <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                onPress={() => handleOpenRoute(item.vendor, item.customer)}
            >
                <Ionicons name="map" size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.actionBtn, !item.riderPhone && { backgroundColor: '#F3F4F6' }]}
                onPress={() => handleCall(item.riderPhone)}
                disabled={!item.riderPhone}
            >
                <Ionicons name="call" size={18} color={item.riderPhone ? COLORS.success : "#9CA3AF"} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Progress & Details (Same as before) */}
      <View style={styles.progressContainer}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
      </View>
      <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Picked Up</Text>
          <Text style={styles.progressText}>Delivering...</Text>
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
          <Text style={styles.timeText}>Active for {getTimeAgo(item.postedAt)}</Text>
          <Text style={styles.refText}>#{item.reference?.slice(0, 6).toUpperCase()}</Text>
      </View>
    </View>
  );

  // --- MAP VIEW COMPONENT ---
  const renderMapView = () => {
    // Default region (e.g., Lagos/Abuja fallback or calculate from trips)
    // For MVP, if no trips, we fallback to a default location (e.g. Lagos)
    const initialRegion = activeTrips.length > 0 && activeTrips[0].vendor.latitude ? {
        latitude: activeTrips[0].vendor.latitude,
        longitude: activeTrips[0].vendor.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : {
        latitude: 6.5244, // Default Lagos
        longitude: 3.3792,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView 
            style={styles.map} 
            provider={PROVIDER_DEFAULT} // Use Google on Android, Apple on iOS
            initialRegion={initialRegion}
            showsUserLocation={true} 
        >
            {activeTrips.map((trip: any) => {
                if(!trip.vendor.latitude || !trip.customer.latitude) return null;
                
                return (
                    <React.Fragment key={trip.id}>
                        {/* 1. Vendor Marker */}
                        <Marker 
                            coordinate={{ latitude: trip.vendor.latitude, longitude: trip.vendor.longitude }}
                            title={`Pick: ${trip.vendor.name}`}
                            pinColor="orange"
                        />
                        
                        {/* 2. Customer Marker */}
                        <Marker 
                            coordinate={{ latitude: trip.customer.latitude, longitude: trip.customer.longitude }}
                            title={`Drop: ${trip.customer.name}`}
                            description={`Rider: ${trip.riderName}`}
                            pinColor={COLORS.primary}
                        />

                        {/* 3. Connecting Line (The "Route") */}
                        <Polyline 
                            coordinates={[
                                { latitude: trip.vendor.latitude, longitude: trip.vendor.longitude },
                                { latitude: trip.customer.latitude, longitude: trip.customer.longitude }
                            ]}
                            strokeColor={COLORS.primary}
                            strokeWidth={3}
                            lineDashPattern={[5,5]} // Dashed line implies "in transit"
                        />
                    </React.Fragment>
                )
            })}
        </MapView>
        
        {/* Floating Legend */}
        <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: 'orange'}]} />
                <Text style={styles.legendText}>Vendor</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: COLORS.primary}]} />
                <Text style={styles.legendText}>Customer</Text>
            </View>
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
                {activeTrips.length} {activeTrips.length === 1 ? 'Rider' : 'Riders'} on the move
            </Text>
        </View>
        
        {/* 🔘 TOGGLE BUTTON */}
        <View style={styles.toggleContainer}>
            <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} 
                onPress={() => setViewMode('list')}
            >
                <Ionicons name="list" size={20} color={viewMode === 'list' ? COLORS.primary : COLORS.textLight} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]} 
                onPress={() => setViewMode('map')}
            >
                <Ionicons name="map" size={20} color={viewMode === 'map' ? COLORS.primary : COLORS.textLight} />
            </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
          <FlatList
            data={activeTrips}
            renderItem={renderActiveTrip}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="map-marker-off" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No active trips right now.</Text>
                    <Text style={styles.emptySub}>Riders will appear here when they pick up an order.</Text>
                </View>
            }
          />
      ) : (
          renderMapView()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  
  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  toggleBtn: { padding: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },

  listContent: { padding: 20, paddingTop: 0 },

  // Card Styles (Kept same as before)
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  riderLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
  riderName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 10 },
  progressDotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' },
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
  emptySub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  // Map Styles
  mapContainer: { flex: 1, overflow: 'hidden', marginHorizontal: 20, marginBottom: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  map: { width: '100%', height: '100%' },
  mapLegend: { position: 'absolute', top: 20, right: 20, backgroundColor: 'white', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, fontWeight: '600', color: COLORS.text }
});