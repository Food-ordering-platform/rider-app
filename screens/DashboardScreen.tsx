import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useNavigation } from "@react-navigation/native";

// Mock Data (Replace with API)
const NEW_REQUESTS = [
  { id: 'ORD-1122', vendor: 'Mama Tega', address: 'Warri Refinery', time: '5 mins ago' },
  { id: 'ORD-3344', vendor: 'KFC Effurun', address: 'Airport Road', time: '12 mins ago' },
];

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
        <Text style={styles.title}>Sefute Logistics</Text>
      </View>
      <View style={styles.bellBtn}>
        <Ionicons name="notifications-outline" size={24} color="black" />
        <View style={styles.badge} />
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
        <Ionicons name="bicycle" size={24} color="white" />
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Active Riders</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        <Text style={[styles.statNumber, { color: 'black' }]}>45</Text>
        <Text style={[styles.statLabel, { color: '#6B7280' }]}>Completed</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderStats()}
            <Text style={styles.sectionTitle}>Ready for Pickup (Pending)</Text>
          </>
        }
        data={NEW_REQUESTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{item.id}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <View style={styles.row}>
               <View style={styles.dot} />
               <Text style={styles.vendor}>{item.vendor}</Text>
            </View>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.actionRow}>
               <Text style={styles.actionText}>Tap to Assign Rider</Text>
               <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  date: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  bellBtn: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: 'red', borderRadius: 4 },
  
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, padding: 20, borderRadius: 20, justifyContent: 'center' },
  statNumber: { fontSize: 32, fontWeight: '800', color: 'white', marginVertical: 5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#374151' },
  
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontWeight: '700', fontSize: 16 },
  time: { fontSize: 12, color: '#6B7280' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4, marginRight: 8 },
  vendor: { fontSize: 15, fontWeight: '600' },
  address: { fontSize: 13, color: '#6B7280', marginLeft: 16, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  actionText: { fontSize: 12, fontWeight: '700', color: COLORS.primary }
});