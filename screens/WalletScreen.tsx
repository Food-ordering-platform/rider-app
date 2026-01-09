import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  RefreshControl 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme"; //
import { useRiderWallet, useRequestWithdrawal } from "../services/dispatch/dispatch.queries"; // Assumes hooks are created here

export default function WalletScreen() {
  // 1. Fetch Wallet Data (Partner Balance & History)
  const { data: wallet, isLoading, refetch } = useRiderWallet();
  
  // 2. Withdrawal Mutation
  const { mutate: withdraw, isPending: isWithdrawing } = useRequestWithdrawal();

  const handleWithdraw = () => {
    // Validation
    if (!wallet || wallet.balance <= 0) {
      return Alert.alert("Insufficient Balance", "You have no available funds to withdraw.");
    }

    Alert.alert(
      "Confirm Withdrawal", 
      `Withdraw ₦${wallet.balance.toLocaleString()} to your linked bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            withdraw(wallet.balance, {
              onSuccess: () => {
                Alert.alert("Success", "Withdrawal request submitted successfully.");
              },
              onError: (err: any) => {
                const message = err.response?.data?.message || "Failed to process withdrawal.";
                Alert.alert("Error", message);
              }
            });
          }
        }
      ]
    );
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT';
    
    // Format Date: "Jan 9, 2:30 PM"
    const dateObj = new Date(item.date);
    const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.txnRow}>
        <View style={[styles.iconBox, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons 
            name={isCredit ? "arrow-down" : "arrow-up"} 
            size={18} 
            color={isCredit ? COLORS.success : COLORS.danger} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txnDesc} numberOfLines={1}>
            {item.desc || (isCredit ? "Delivery Earnings" : "Withdrawal")}
          </Text>
          <Text style={styles.txnDate}>{dateString} • {timeString}</Text>
        </View>
        <Text style={[styles.txnAmount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? '+' : '-'}₦{item.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.cardLabel}>Logistics Balance</Text>
            <Text style={styles.cardBalance}>
              ₦{wallet?.balance?.toLocaleString() || "0.00"}
            </Text>
          </View>
          <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.8)" />
        </View>
        
        <View style={styles.cardBottom}>
          <Text style={styles.accountText}>**** **** 8922</Text>
          <TouchableOpacity 
            style={[
              styles.withdrawBtn, 
              (isWithdrawing || (wallet?.balance || 0) <= 0) && styles.disabledBtn
            ]} 
            onPress={handleWithdraw}
            disabled={isWithdrawing || (wallet?.balance || 0) <= 0}
          >
             {isWithdrawing ? (
               <ActivityIndicator size="small" color={COLORS.primary} />
             ) : (
               <Text style={styles.withdrawText}>Withdraw</Text>
             )}
          </TouchableOpacity>
        </View>
        
        {/* Decorative Circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      {/* HISTORY LIST */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <FlatList
          data={wallet?.transactions || []}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refetch} 
              tintColor={COLORS.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  
  card: {
    backgroundColor: COLORS.primary, // Using Wine Color
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
  
  withdrawBtn: { 
    backgroundColor: 'white', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    minWidth: 100, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledBtn: { opacity: 0.6 },
  withdrawText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  circle1: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },

  historySection: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#374151' },
  
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnDesc: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  txnDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14 }
});