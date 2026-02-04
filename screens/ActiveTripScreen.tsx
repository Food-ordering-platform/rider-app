import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, 
  Linking, Platform, StatusBar, ActivityIndicator 
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useGetActiveOrder, useConfirmPickup, useConfirmDelivery } from "../services/rider/rider.queries";
import { COLORS, SHADOWS } from "../constants/theme";

const { width, height } = Dimensions.get("window");

export default function ActiveTripScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // --- 1. HOOKS (Must be at the top) ---
  
  // Data Fetching
  const { data: order, isLoading, refetch } = useGetActiveOrder();

  // Local State
  const [riderLocation, setRiderLocation] = useState<any>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Mutations
  const { mutate: confirmPickup, isPending: loadingPickup } = useConfirmPickup();
  const { mutate: confirmDelivery, isPending: loadingDelivery } = useConfirmDelivery();

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Get Live Location (Moved to top)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const location = await Location.getCurrentPositionAsync({});
      setRiderLocation(location.coords);
    })();
  }, []);

  // --- 2. EARLY RETURNS (Rendering Logic) ---

  // State: Loading
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // State: No Active Order
  if (!order) {
    return (
      <View style={[styles.center, { padding: 40 }]}>
        <Ionicons name="bicycle" size={100} color="#E5E7EB" style={{ marginBottom: 20 }} />
        <Text style={styles.emptyTitle}>No Active Delivery</Text>
        <Text style={styles.emptySub}>
          You are currently idle. Go to the Dashboard to find available orders nearby.
        </Text>
        <TouchableOpacity 
          style={styles.goHomeBtn}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.goHomeText}>Find Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- 3. ACTIVE ORDER LOGIC (Only runs if order exists) ---

  const isPickingUp = order.status === "RIDER_ACCEPTED";
  
  // Calculate coordinates safely now that we know order exists
  const targetCoords = isPickingUp 
    ? { lat: order.restaurant.latitude, lng: order.restaurant.longitude, title: order.restaurant.name }
    : { lat: order.deliveryLatitude, lng: order.deliveryLongitude, title: order.customer.name };

  const handleMainAction = () => {
    if (isPickingUp) {
      confirmPickup(order.id);
    } else {
      setOtpModalVisible(true);
    }
  };

  const submitDelivery = () => {
    if (otpCode.length < 4) return;
    confirmDelivery({ orderId: order.id, code: otpCode }, {
      onSuccess: () => setOtpModalVisible(false) 
    });
  };

  const openMap = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}${targetCoords.title}@${targetCoords.lat},${targetCoords.lng}`,
      android: `${scheme}${targetCoords.lat},${targetCoords.lng}(${targetCoords.title})`
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: targetCoords.lat || 6.5244,
          longitude: targetCoords.lng || 3.3792,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
      >
        <Marker coordinate={{ latitude: targetCoords.lat, longitude: targetCoords.lng }} title={targetCoords.title} pinColor={COLORS.primary} />
        {riderLocation && (
          <Polyline 
            coordinates={[
              { latitude: riderLocation.latitude, longitude: riderLocation.longitude },
              { latitude: targetCoords.lat, longitude: targetCoords.lng }
            ]} 
            strokeColor={COLORS.primary} 
            strokeWidth={3} 
          />
        )}
      </MapView>

      <View style={[styles.topCard, { top: insets.top + 10 }]}>
        <View style={styles.statusChip}>
          <View style={[styles.dot, { backgroundColor: isPickingUp ? '#F59E0B' : '#10B981' }]} />
          <Text style={styles.statusText}>{isPickingUp ? "Pickup in Progress" : "Delivery in Progress"}</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={openMap}>
          <Ionicons name="navigate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <MaterialIcons name={isPickingUp ? "storefront" : "person"} size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{isPickingUp ? "Restaurant" : "Customer"}</Text>
            <Text style={styles.bigText}>{targetCoords.title}</Text>
            <Text style={styles.subText} numberOfLines={1}>
              {isPickingUp ? order.restaurant.address : order.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.reference}</Text>
          <Text style={styles.items}>{order.items.map((i: any) => `${i.quantity}x ${i.menuItemName}`).join(", ")}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: isPickingUp ? COLORS.primary : '#10B981' }]}
          onPress={handleMainAction}
          disabled={loadingPickup}
        >
          <Text style={styles.actionBtnText}>
            {loadingPickup ? "Confirming..." : isPickingUp ? "Confirm Pickup" : "Complete Delivery"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Confirmation</Text>
            <Text style={styles.modalSub}>Enter the 4-digit code provided by the customer.</Text>
            
            <TextInput 
              style={styles.otpInput}
              placeholder="0 0 0 0"
              keyboardType="number-pad"
              maxLength={4}
              value={otpCode}
              onChangeText={setOtpCode}
              autoFocus
            />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { opacity: loadingDelivery ? 0.7 : 1 }]} 
                onPress={submitDelivery}
                disabled={loadingDelivery}
              >
                <Text style={styles.confirmText}>{loadingDelivery ? "Verifying..." : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  
  // Empty State
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', marginHorizontal: 40, marginBottom: 20 },
  goHomeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goHomeText: { color: 'white', fontWeight: 'bold' },

  // Map & UI
  map: { width: '100%', height: height * 0.65 },
  topCard: { position: 'absolute', width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusChip: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, flexDirection: 'row', alignItems: 'center', ...SHADOWS.medium },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontWeight: '700', fontSize: 12 },
  navBtn: { backgroundColor: 'white', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', height: height * 0.4, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, ...SHADOWS.medium },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  label: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase' },
  bigText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subText: { fontSize: 14, color: '#4B5563' },
  orderInfo: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 20 },
  orderId: { fontWeight: 'bold', marginBottom: 4 },
  items: { color: '#4B5563', fontSize: 13 },
  actionBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSub: { color: '#666', textAlign: 'center', marginBottom: 24 },
  otpInput: { fontSize: 32, letterSpacing: 8, fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#ddd', width: '80%', textAlign: 'center', marginBottom: 30, paddingBottom: 10 },
  btnRow: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
  confirmBtn: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 12 },
  confirmText: { color: 'white', fontWeight: 'bold' }
});