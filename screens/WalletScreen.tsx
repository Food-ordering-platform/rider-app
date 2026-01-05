import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

// MOCK TRANSACTIONS
const TRANSACTIONS = [
  { id: '1', type: 'CREDIT', amount: 1500, desc: 'Order #ORD-9921', date: 'Today, 2:30 PM' },
  { id: '2', type: 'CREDIT', amount: 1200, desc: 'Order #ORD-8811', date: 'Today, 1:15 PM' },
  { id: '3', type: 'DEBIT', amount: 45000, desc: 'Weekly Payout', date: 'Yesterday' },
  { id: '4', type: 'CREDIT', amount: 2000, desc: 'Order #ORD-7766', date: 'Yesterday' },
];

export default function WalletScreen() {
  const [balance, setBalance] = useState(45200);
  const [modalVisible, setModalVisible] = useState(false);

  const handleWithdraw = () => {
    Alert.alert(
      "Confirm Withdrawal", 
      `Withdraw ₦${balance.toLocaleString()} to your linked bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            setModalVisible(false);
            Alert.alert("Success", "Funds will arrive in 24 hours.");
          }
        }
      ]
    );
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.txnRow}>
      <View style={[styles.iconBox, { backgroundColor: item.type === 'CREDIT' ? '#DCFCE7' : '#FEE2E2' }]}>
        <Ionicons 
          name={item.type === 'CREDIT' ? "arrow-down" : "arrow-up"} 
          size={18} 
          color={item.type === 'CREDIT' ? COLORS.success : COLORS.danger} 
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txnDesc}>{item.desc}</Text>
        <Text style={styles.txnDate}>{item.date}</Text>
      </View>
      <Text style={[styles.txnAmount, { color: item.type === 'CREDIT' ? COLORS.success : 'black' }]}>
        {item.type === 'CREDIT' ? '+' : '-'}₦{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.cardLabel}>Available Balance</Text>
            <Text style={styles.cardBalance}>₦{balance.toLocaleString()}</Text>
          </View>
          <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.8)" />
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.accountText}>**** **** 8922</Text>
          <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
             <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
        {/* Decor */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      {/* HISTORY */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <FlatList
          data={TRANSACTIONS}
          keyExtractor={item => item.id}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  
  card: {
    backgroundColor: COLORS.primary,
    height: 180,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  cardBalance: { color: 'white', fontSize: 36, fontWeight: '800' },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  accountText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', letterSpacing: 2 },
  withdrawBtn: { backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  withdrawText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  circle1: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },

  historySection: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#374151' },
  
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnDesc: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  txnDate: { fontSize: 12, color: '#9CA3AF' },
  txnAmount: { fontSize: 15, fontWeight: '700' }
});