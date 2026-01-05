import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  
  // MOCK DATA (You would fetch this using params.orderId)
  const order = {
    id: "ORD-9921",
    trackingId: "task-abc-123", // The Magic ID
    earnings: 1500,
    vendor: { name: "Mama Tega Kitchen", phone: "08012345678", address: "14 Refinery Road, Warri" },
    customer: { name: "John Doe", phone: "09012345678", address: "Delta Mall, Effurun" },
    items: ["2x Jollof Rice", "1x Chicken"]
  };

  const handleShare = async () => {
    try {
      const url = `https://choweazy.com/ride/${order.trackingId}`;
      const message = `🚴 New Delivery Task!\n\nPickup: ${order.vendor.name}\nDropoff: ${order.customer.address}\n\nClick to Accept & Navigate:\n${url}`;
      
      await Share.share({ message });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Potential Earning</Text>
          <Text style={styles.earningsValue}>₦{order.earnings.toLocaleString()}</Text>
        </View>

        {/* Route Visualizer */}
        <View style={styles.routeContainer}>
          {/* Pickup */}
          <View style={styles.stop}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="restaurant" size={20} color="gray" />
            </View>
            <View>
              <Text style={styles.stopLabel}>PICKUP</Text>
              <Text style={styles.stopName}>{order.vendor.name}</Text>
              <Text style={styles.stopAddress}>{order.vendor.address}</Text>
            </View>
          </View>
          
          {/* Line */}
          <View style={styles.line} />

          {/* Dropoff */}
          <View style={styles.stop}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="location" size={20} color="white" />
            </View>
            <View>
              <Text style={[styles.stopLabel, { color: COLORS.primary }]}>DROPOFF</Text>
              <Text style={styles.stopName}>{order.customer.name}</Text>
              <Text style={styles.stopAddress}>{order.customer.address}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Manifest</Text>
          {order.items.map((item, i) => (
             <Text key={i} style={styles.itemRow}>• {item}</Text>
          ))}
        </View>

      </ScrollView>

      {/* FOOTER ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShare}>
          <FontAwesome name="whatsapp" size={24} color="white" />
          <Text style={styles.btnText}>Share Job with Rider</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  
  earningsCard: { backgroundColor: '#111827', borderRadius: 16, padding: 20, marginBottom: 25, alignItems: 'center' },
  earningsLabel: { color: 'gray', fontSize: 12, textTransform: 'uppercase', marginBottom: 5 },
  earningsValue: { color: 'white', fontSize: 32, fontWeight: '800' },

  routeContainer: { marginBottom: 30 },
  stop: { flexDirection: 'row', gap: 15, alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  stopLabel: { fontSize: 10, fontWeight: '800', color: 'gray', marginBottom: 2 },
  stopName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stopAddress: { fontSize: 14, color: '#6B7280', maxWidth: '80%' },
  line: { width: 2, height: 40, backgroundColor: '#E5E7EB', marginLeft: 19, marginVertical: 5 },

  section: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  itemRow: { fontSize: 15, marginBottom: 5, color: '#374151' },

  footer: { padding: 20, borderTopWidth: 1, borderColor: '#F3F4F6' },
  whatsappBtn: { backgroundColor: '#25D366', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});