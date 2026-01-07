import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Platform, Linking } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useSocket } from "../context/socketContext";

interface ActiveRider {
  orderId: string;
  riderName?: string;
  latitude: number;
  longitude: number;
  status: 'MOVING' | 'IDLE';
  lastUpdated: number;
}

export default function ActiveTripsScreen() {
  const { socket } = useSocket();
  const mapRef = useRef<MapView>(null);
  const [activeRiders, setActiveRiders] = useState<Record<string, ActiveRider>>({});

  // 1. Listen for Rider Movement
  useEffect(() => {
    if (!socket) return;

    socket.on("rider-moved", (data: any) => {
      console.log("🚀 Map Update:", data);
      
      setActiveRiders((prev) => ({
        ...prev,
        [data.orderId]: {
          orderId: data.orderId,
          riderName: `Order #${data.orderId.slice(-4)}`,
          latitude: data.lat,
          longitude: data.lng,
          status: 'MOVING',
          lastUpdated: Date.now()
        }
      }));
    });

    return () => {
      socket.off("rider-moved");
    };
  }, [socket]);

  // 2. Helper to Open Google Maps App (Free Navigation)
  const openExternalMap = (lat: number, lng: number) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}Rider@${latLng}`,
      android: `${scheme}${latLng}(Rider)`
    });
    if (url) Linking.openURL(url);
  };

  const renderRiderCard = ({ item }: { item: ActiveRider }) => (
    <TouchableOpacity 
        style={styles.card}
        onPress={() => {
            mapRef.current?.animateToRegion({
                latitude: item.latitude,
                longitude: item.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            });
        }}
    >
        <View style={styles.iconBox}>
            <Ionicons name="bicycle" size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.riderName}>{item.riderName}</Text>
            <Text style={styles.status}>Active Now • {new Date(item.lastUpdated).toLocaleTimeString()}</Text>
        </View>
        <TouchableOpacity onPress={() => openExternalMap(item.latitude, item.longitude)}>
             <Ionicons name="navigate-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 5.5544, // Warri Center
          longitude: 5.7932,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
      >
        {Object.values(activeRiders).map((rider) => (
          <Marker
            key={rider.orderId}
            coordinate={{ latitude: rider.latitude, longitude: rider.longitude }}
            title={rider.riderName}
          >
            <View style={styles.markerContainer}>
                <View style={styles.markerCircle}>
                    <Ionicons name="bicycle" size={14} color="white" />
                </View>
                <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="none">
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Live Dispatch Map</Text>
            <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
            </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet}>
        <Text style={styles.listTitle}>Active Riders ({Object.keys(activeRiders).length})</Text>
        <FlatList
            data={Object.values(activeRiders)}
            keyExtractor={item => item.orderId}
            renderItem={renderRiderCard}
            ListEmptyComponent={<Text style={styles.emptyText}>No active riders moving yet.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.95)', padding: 15, borderRadius: 15, marginTop: 10,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FECACA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'red', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '800', color: 'red' },

  markerContainer: { alignItems: 'center' },
  markerCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  markerArrow: { width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: COLORS.primary, transform: [{ rotate: '180deg' }], marginTop: -2 },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', height: '35%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  listTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, color: '#374151' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  riderName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  status: { fontSize: 12, color: '#6B7280' },
});