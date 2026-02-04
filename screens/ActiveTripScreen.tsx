import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, 
  Linking, Platform, StatusBar, ActivityIndicator, SafeAreaView, Image 
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useGetActiveOrder, useConfirmPickup, useConfirmDelivery } from "../services/rider/rider.queries";
import { COLORS, SHADOWS, SPACING } from "../constants/theme";

const { width, height } = Dimensions.get("window");

export default function ActiveTripScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // --- 1. HOOKS ---
  const { data: order, isLoading, refetch } = useGetActiveOrder();
  const [riderLocation, setRiderLocation] = useState<any>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { mutate: confirmPickup, isPending: loadingPickup } = useConfirmPickup();
  const { mutate: confirmDelivery, isPending: loadingDelivery } = useConfirmDelivery();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Live Location Tracking
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (location) => setRiderLocation(location.coords)
      );
    })();
    return () => { if(subscription) subscription.remove(); };
  }, []);

  // --- 2. LOADING STATE ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Locating Active Trip...</Text>
      </View>
    );
  }

  // --- 3. EMPTY STATE (No Active Order) ---
  if (!order) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
            <MaterialIcons name="delivery-dining" size={80} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>You&apos;re Online & Ready</Text>
        <Text style={styles.emptySub}>
          You currently have no active deliveries. Head to the dashboard to accept a new order.
        </Text>
        <TouchableOpacity 
          style={styles.goHomeBtn}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.goHomeText}>Find New Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- 4. ACTIVE ORDER LOGIC ---
  const isPickingUp = order.status === "RIDER_ACCEPTED";
  
  // Theme Colors based on Stage
  const STAGE_COLOR = isPickingUp ? '#F59E0B' : '#10B981'; // Amber (Pickup) vs Emerald (Delivery)
  const BTN_COLOR = isPickingUp ? COLORS.primary : '#10B981';

  // Target Details
  const target = isPickingUp ? order.restaurant : order.customer;
  const targetCoords = isPickingUp 
    ? { lat: order.restaurant.latitude, lng: order.restaurant.longitude, title: order.restaurant.name }
    : { lat: order.deliveryLatitude, lng: order.deliveryLongitude, title: order.customer.name };

  // Handlers
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

  const makeCall = (phone?: string | null) => {
    if (!phone) return;
    let phoneUrl = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.openURL(phoneUrl);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- MAP BACKGROUND --- */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: targetCoords.lat || 6.5244,
          longitude: targetCoords.lng || 3.3792,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false} // We use our own button
      >
        <Marker 
            coordinate={{ latitude: targetCoords.lat, longitude: targetCoords.lng }} 
            title={targetCoords.title} 
        >
            <View style={[styles.customMarker, { borderColor: STAGE_COLOR }]}>
                <MaterialIcons name={isPickingUp ? "storefront" : "person"} size={20} color="white" />
            </View>
        </Marker>

        {riderLocation && (
          <Polyline 
            coordinates={[
              { latitude: riderLocation.latitude, longitude: riderLocation.longitude },
              { latitude: targetCoords.lat, longitude: targetCoords.lng }
            ]} 
            strokeColor={STAGE_COLOR} 
            strokeWidth={4} 
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* --- FLOATING HEADER --- */}
      <View style={[styles.topCard, { top: insets.top + 10 }]}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: STAGE_COLOR }]} />
          <View>
            <Text style={styles.statusTitle}>{isPickingUp ? "Picking Up" : "Delivering"}</Text>
            <Text style={styles.statusSub}>Order #{order.reference}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.navBtn} onPress={openMap}>
          <Ionicons name="navigate-circle" size={28} color={STAGE_COLOR} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM SHEET --- */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        {/* 1. Contact Info Card */}
        <View style={styles.contactCard}>
            <View style={[styles.iconBox, { backgroundColor: isPickingUp ? '#FFF7ED' : '#ECFDF5' }]}>
                <MaterialIcons 
                    name={isPickingUp ? "store" : "person"} 
                    size={28} 
                    color={STAGE_COLOR} 
                />
            </View>
            
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.targetLabel}>{isPickingUp ? "Restaurant" : "Customer"}</Text>
                <Text style={styles.targetName} numberOfLines={1}>{target.name}</Text>
                <Text style={styles.targetAddress} numberOfLines={1}>
                    {isPickingUp ? order.restaurant.address : order.deliveryAddress}
                </Text>
            </View>

            <TouchableOpacity 
                style={[styles.callBtn, { backgroundColor: STAGE_COLOR }]}
                onPress={() => makeCall(target.phone)}
            >
                <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
        </View>

        {/* 2. Order Summary */}
        <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Items</Text>
            <Text style={styles.summaryText}>
                {order.items.map((i: any) => `${i.quantity}x ${i.menuItemName}`).join(" • ")}
            </Text>
        </View>

        {/* 3. Action Slider Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: BTN_COLOR }]}
          onPress={handleMainAction}
          disabled={loadingPickup}
        >
          {loadingPickup ? (
              <ActivityIndicator color="white" />
          ) : (
            <View style={styles.actionContent}>
                <Text style={styles.actionBtnText}>
                    {isPickingUp ? "Confirm Pickup" : "Confirm Delivery"}
                </Text>
                <View style={styles.actionIconBox}>
                    <Ionicons name="chevron-forward" size={24} color={BTN_COLOR} />
                </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- OTP MODAL --- */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
                <MaterialCommunityIcons name="shield-check" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Security Check</Text>
            <Text style={styles.modalSub}>
                Ask the customer for the 4-digit confirmation code to complete this delivery.
            </Text>
            
            <TextInput 
              style={styles.otpInput}
              placeholder="• • • •"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              maxLength={4}
              value={otpCode}
              onChangeText={setOtpCode}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setOtpModalVisible(false)} 
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmBtn, { opacity: loadingDelivery ? 0.7 : 1 }]} 
                onPress={submitDelivery}
                disabled={loadingDelivery}
              >
                {loadingDelivery ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 },
  
  // Loading & Empty States
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 16 },
  emptyIconContainer: { width: 140, height: 140, backgroundColor: '#FEF2F2', borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  goHomeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, elevation: 4 },
  goHomeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Map
  map: { width: '100%', height: height * 0.60 }, // Map takes 60%
  customMarker: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white', elevation: 5 },

  // Floating Header
  topCard: { 
    position: 'absolute', width: '92%', alignSelf: 'center', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10
  },
  statusPill: { 
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 16, flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12,
    ...SHADOWS.medium 
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusTitle: { fontWeight: '800', fontSize: 14, color: '#111827', letterSpacing: 0.5 },
  statusSub: { fontSize: 12, color: '#6B7280' },
  navBtn: { 
    backgroundColor: 'white', width: 50, height: 50, borderRadius: 25, 
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium 
  },

  // Bottom Sheet
  bottomSheet: { 
    position: 'absolute', bottom: 0, width: '100%', height: height * 0.45, 
    backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, 
    padding: 24, ...SHADOWS.medium,
    shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1 
  },
  handle: { width: 48, height: 5, backgroundColor: '#E5E7EB', borderRadius: 10, alignSelf: 'center', marginBottom: 24 },

  // Contact Card
  contactCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  targetName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
  targetAddress: { fontSize: 14, color: '#6B7280' },
  callBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 },

  // Summary
  orderSummary: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' },
  summaryText: { fontSize: 15, color: '#374151', fontWeight: '500', lineHeight: 22 },

  // Action Button
  actionBtn: { height: 60, borderRadius: 16, justifyContent: 'center', overflow: 'hidden', elevation: 4 },
  actionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
  actionIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  otpInput: { 
    fontSize: 36, letterSpacing: 10, fontWeight: '800', color: '#111827',
    borderBottomWidth: 2, borderColor: '#E5E7EB', width: '80%', textAlign: 'center', 
    marginBottom: 32, paddingBottom: 8 
  },
  modalActions: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '700', color: '#4B5563' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: 'white' }
});