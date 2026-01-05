import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";

// Orders that are OUT_FOR_DELIVERY
const ACTIVE_TRIPS = [
  { id: 'ORD-9921', status: 'OUT_FOR_DELIVERY', rider: 'Assigned (Link Shared)' },
  { id: 'ORD-9922', status: 'OUT_FOR_DELIVERY', rider: 'Assigned (Link Shared)' },
];

export default function ActiveTripsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Trips</Text>
      </View>
      <FlatList
        data={ACTIVE_TRIPS}
        keyExtractor={i => i.id}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
             <View style={styles.row}>
                <Text style={styles.id}>{item.id}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>ON ROAD</Text></View>
             </View>
             <Text style={styles.desc}>Delivery in progress...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 18, fontWeight: '700' },
  badge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#1E40AF', fontSize: 10, fontWeight: '800' },
  desc: { color: 'gray' }
});