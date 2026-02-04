import React, { useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { 
  useGetRiderEarnings, 
  useRequestPayout, 
  useGetBanks // <--- Import this
} from "../services/rider/rider.queries";
import { COLORS, SHADOWS } from "../constants/theme";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Bank } from "../types/rider.types";

export default function EarningScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // For searching banks
  
  // ERROR STATE FOR MODAL
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: earnings, isLoading, refetch } = useGetRiderEarnings();
  const { data: banks = [], isLoading: loadingBanks } = useGetBanks(); // Fetch Banks
  
  const { mutate: requestPayout, isPending } = useRequestPayout();

  // Filter banks based on search
  const filteredBanks = useMemo(() => {
    if (!searchQuery) return banks;
    return banks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [banks, searchQuery]);

  const handleWithdraw = () => {
    setFormError(null); // Clear previous errors

    if(!amount || !accountNumber || !selectedBank) {
      setFormError("Please fill all fields.");
      return;
    }

    const withdrawAmount = Number(amount);
    const balance = earnings?.availableBalance || 0;

    // Frontend Check (Fast Feedback)
    if (withdrawAmount > balance) {
      setFormError(`Insufficient funds. You only have ₦${balance.toLocaleString()}`);
      return;
    }

    if (withdrawAmount < 100) {
      setFormError("Minimum withdrawal is ₦100.");
      return;
    }
    
    requestPayout({
      amount: withdrawAmount,
      bankCode: selectedBank.code,
      accountNumber:accountNumber
    }, {
      onSuccess: () => {
        setModalVisible(false);
        setAmount("");
        setAccountNumber("");
        setSelectedBank(null);
        setFormError(null);
      },
      onError: (error: any) => {
        // DISPLAY BACKEND ERROR IN MODAL
        const msg = error.response?.data?.message || "Payout failed. Please try again.";
        setFormError(msg);
      }
    });
  };

  const renderTransaction = ({ item }: any) => (
    <View style={[styles.txnCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.type === 'CREDIT' ? '#DCFCE7' : '#FEE2E2' }]}>
        <MaterialCommunityIcons 
          name={item.type === 'CREDIT' ? "arrow-down-left" : "arrow-up-right"} 
          size={20} 
          color={item.type === 'CREDIT' ? '#16A34A' : '#DC2626'} 
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.txnTitle, { color: colors.text }]}>{item.description || item.category}</Text>
        <Text style={{ fontSize: 12, color: colors.textLight }}>{format(new Date(item.date), 'MMM d, h:mm a')}</Text>
      </View>
      <Text style={[styles.txnAmount, { color: item.type === 'CREDIT' ? '#16A34A' : '#DC2626' }]}>
        {item.type === 'CREDIT' ? '+' : '-'}₦{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Wallet</Text>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceText}>₦{earnings?.availableBalance?.toLocaleString() || "0.00"}</Text>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => { setFormError(null); setModalVisible(true); }}>
          <Text style={styles.withdrawText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* TRANSACTIONS */}
      <Text style={[styles.sectionHeader, { color: colors.text }]}>Transaction History</Text>
      <FlatList 
        data={earnings?.transactions || []}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: colors.textLight }}>No transactions yet</Text>}
      />

      {/* PAYOUT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <Text style={[styles.modalTitle, { color: colors.text }]}>Withdraw Funds</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity>
            </View>

            {/* 🔴 ERROR MESSAGE BOX */}
            {formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            {/* Amount Input */}
            <Text style={[styles.label, { color: colors.textLight }]}>Amount</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
              placeholder={`Max: ₦${earnings?.availableBalance}`}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setFormError(null); // Clear error on type
              }}
            />

            {/* Bank Selection */}
            <Text style={[styles.label, { color: colors.textLight }]}>Bank Name</Text>
            <TouchableOpacity 
            
              style={[styles.input, { borderColor: colors.border, justifyContent: 'center' }]} 
              onPress={() => setShowBankList(!showBankList)}
            >
              <Text style={{ color: selectedBank ? colors.text : colors.textLight }}>
                {selectedBank ? selectedBank.name : "Select Bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textLight} style={{ position: 'absolute', right: 15 }}/>
            </TouchableOpacity>

            {/* Bank List Dropdown */}
            {showBankList && (
              <View style={[styles.bankListContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 {/* Search Bar for Banks */}
                 <TextInput 
                    style={[styles.bankSearch, { color: colors.text, borderBottomColor: colors.border }]}
                    placeholder="Search bank..."
                    placeholderTextColor={colors.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                 />
                 {loadingBanks ? (
                   <ActivityIndicator style={{ padding: 20 }} color={COLORS.primary} />
                 ) : (
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                    {filteredBanks.map((bank) => (
                      <TouchableOpacity 
                        key={bank.code} 
                        style={[styles.bankItem, { borderBottomColor: colors.border }]}
                        onPress={() => { setSelectedBank(bank); setShowBankList(false); }}
                      >
                        <Text style={{ color: colors.text }}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                 )}
              </View>
            )}

            {/* Account Number */}
            <Text style={[styles.label, { color: colors.textLight }]}>Account Number</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
              placeholder="0123456789" 
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              maxLength={10}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { opacity: isPending ? 0.7 : 1 }]} 
              onPress={handleWithdraw}
              disabled={isPending}
            >
              {isPending ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Confirm Payout</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  
  balanceCard: { margin: 16, padding: 24, backgroundColor: COLORS.primary, borderRadius: 20, ...SHADOWS.medium },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceText: { color: 'white', fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  withdrawBtn: { backgroundColor: 'white', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  withdrawText: { color: COLORS.primary, fontWeight: 'bold' },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', margin: 16 },
  txnCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontWeight: '600', fontSize: 14 },
  txnAmount: { fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { marginBottom: 6, fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16, height: 54 },
  
  bankListContainer: { 
    borderWidth: 1, borderRadius: 12, marginBottom: 16, overflow: 'hidden',
    position: 'absolute', top: 220, left: 24, right: 24, zIndex: 10, height: 200, shadowOpacity: 0.2, elevation: 5 
  },
  bankSearch: { padding: 10, borderBottomWidth: 1, fontSize: 14 },
  bankItem: { padding: 14, borderBottomWidth: 0.5 },

  confirmBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  confirmText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Error Box Styles
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', 
    padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#DC2626'
  },
  errorText: { color: '#DC2626', marginLeft: 8, fontSize: 14, fontWeight: '600', flex: 1 }
});