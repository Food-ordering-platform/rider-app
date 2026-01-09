import React, { useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useRiderWallet, useRequestWithdrawal } from "../services/dispatch/dispatch.queries";

export default function WalletScreen() {
  const { data: wallet, isLoading, refetch } = useRiderWallet();
  const { mutate: withdraw, isPending: isWithdrawing } = useRequestWithdrawal();

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");

  const openWithdrawModal = () => {
    if (!wallet || wallet.availableBalance <= 0) return Alert.alert("Error", "Insufficient balance");
    setModalVisible(true);
  };

  const handleConfirmWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount < 1000) return Alert.alert("Error", "Minimum withdrawal is ₦1,000");
    if (withdrawAmount > (wallet?.availableBalance || 0)) return Alert.alert("Error", "Insufficient funds");
    if (!accountNumber || !accountName || !bankName) return Alert.alert("Error", "Please fill all bank details");

    withdraw({
      amount: withdrawAmount,
      bankDetails: { bankName, accountNumber, accountName }
    }, {
      onSuccess: () => {
        setModalVisible(false);
        setAmount(""); setAccountNumber(""); setAccountName(""); setBankName("");
        Alert.alert("Success", "Withdrawal request submitted.");
      },
      onError: (err: any) => Alert.alert("Error", err.response?.data?.message || "Failed")
    });
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT';
    
    // ✅ SAFER DATE FORMATTING
    const dateObj = item.createdAt ? new Date(item.createdAt) : new Date();
    const dateString = dateObj.toLocaleDateString(); 
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.txnRow}>
        <View style={[styles.iconBox, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons name={isCredit ? "arrow-down" : "arrow-up"} size={18} color={isCredit ? COLORS.success : COLORS.danger} />
        </View>
        <View style={{ flex: 1 }}>
          {/* ✅ Uses 'description' to match backend */}
          <Text style={styles.txnDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txnDate}>{dateString} • {timeString}</Text>
        </View>
        <Text style={[styles.txnAmount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? '+' : '-'}₦{item.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  if (isLoading) return <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /></View>;

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
            <Text style={styles.cardBalance}>₦{wallet?.availableBalance?.toLocaleString() || "0.00"}</Text>
          </View>
          <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.8)" />
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.accountText}>**** **** 8922</Text>
          <TouchableOpacity style={[styles.withdrawBtn, (wallet?.availableBalance || 0) <= 0 && {opacity: 0.6}]} onPress={openWithdrawModal} disabled={(wallet?.availableBalance || 0) <= 0}>
             <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      {/* HISTORY */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <FlatList
          data={wallet?.transactions || []} // ✅ Access transactions from wallet object
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary}/>}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>

      {/* MODAL (Keep as is) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Amount (₦)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={amount} onChangeText={setAmount} />
            <Text style={styles.label}>Bank Name</Text>
            <TextInput style={styles.input} placeholder="e.g. GTBank" value={bankName} onChangeText={setBankName} />
            <Text style={styles.label}>Account Number</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="0123456789" value={accountNumber} onChangeText={setAccountNumber} maxLength={10} />
            <Text style={styles.label}>Account Name</Text>
            <TextInput style={styles.input} placeholder="Account Holder Name" value={accountName} onChangeText={setAccountName} />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: COLORS.primary, height: 180, borderRadius: 24, padding: 24, justifyContent: 'space-between', marginBottom: 30, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  cardBalance: { color: 'white', fontSize: 36, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' },
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
  txnAmount: { fontSize: 15, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});