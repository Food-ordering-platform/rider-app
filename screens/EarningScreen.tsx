import React, { useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/themeContext";
import { 
  useGetRiderEarnings, 
  useRequestPayout, 
  useGetBanks 
} from "../services/rider/rider.queries";
import { COLORS, SHADOWS, } from "../constants/theme";
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { format } from "date-fns";
import { Bank } from "../types/rider.types";

export default function EarningScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // --- DATA ---
  const { data: earnings,  refetch } = useGetRiderEarnings();
  const { data: banks = [], } = useGetBanks();
  const { mutate: requestPayout, isPending } = useRequestPayout();

  // Filter banks
  const filteredBanks = useMemo(() => {
    if (!searchQuery) return banks;
    return banks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [banks, searchQuery]);

  // --- HANDLERS ---
  const handleWithdraw = () => {
    setFormError(null);
    if(!amount || !accountNumber || !selectedBank) {
      setFormError("Please fill all fields.");
      return;
    }

    const withdrawAmount = Number(amount);
    const balance = earnings?.availableBalance || 0;

    if (withdrawAmount > balance) {
      setFormError(`Insufficient funds. Available: ₦${balance.toLocaleString()}`);
      return;
    }
    if (withdrawAmount < 100) {
      setFormError("Minimum withdrawal is ₦100.");
      return;
    }
    
    requestPayout({
      amount: withdrawAmount,
      bankCode: selectedBank.code,
      accountNumber: accountNumber
    }, {
      onSuccess: () => {
        setModalVisible(false);
        setAmount("");
        setFormError(null);
      },
      onError: (err: any) => {
        setFormError(err.response?.data?.message || "Payout failed");
      }
    });
  };

 const renderTransaction = ({ item }: any) => {
    const isCredit = item.type === 'CREDIT';
    // Check if it's a pending withdrawal
    const isPending = item.status === 'PENDING';

    let iconName = isCredit ? "arrow-bottom-left" : "arrow-top-right";
    let iconColor = isCredit ? '#10B981' : '#EF4444'; // Green vs Red
    let bgColor = isCredit ? '#ECFDF5' : '#FEF2F2';

    if (isPending && !isCredit) {
        iconColor = '#F59E0B'; // Orange for Pending Withdrawal
        bgColor = '#FFF7ED';
        iconName = "clock";
    }

    return (
      <View style={[styles.txnItem, { backgroundColor: colors.surface }]}>
        <View style={[styles.txnIcon, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={20} 
            color={iconColor} 
          />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[styles.txnTitle, { color: colors.text }]}>{item.description}</Text>
          <Text style={styles.txnDate}>
            {format(new Date(item.date), 'MMM d, h:mm a')} • {item.status}
          </Text>
        </View>
        <Text style={[styles.txnAmount, { color: iconColor }]}>
          {isCredit ? '+' : '-'}₦{item.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F9FAFB' }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* --- HEADER SECTION --- */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* --- 1. MAIN BALANCE CARD (Available) --- */}
        <View style={styles.mainCard}>
            <View>
                <Text style={styles.mainLabel}>Available Balance</Text>
                <Text style={styles.mainAmount}>
                    ₦{earnings?.availableBalance?.toLocaleString() || "0.00"}
                </Text>
            </View>
            <TouchableOpacity 
                style={styles.withdrawBtn} 
                onPress={() => { setFormError(null); setModalVisible(true); }}
            >
                <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
        </View>

        {/* --- 2. SECONDARY STATS (Pending & Total) --- */}
        <View style={styles.statsRow}>
            {/* Pending (Active Orders) */}
            <View style={[styles.statCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                <View style={styles.statHeader}>
                    <FontAwesome5 name="clock" size={14} color="#EA580C" />
                    <Text style={[styles.statLabel, { color: '#9A3412' }]}>Pending</Text>
                </View>
                <Text style={[styles.statValue, { color: '#EA580C' }]}>
                    ₦{earnings?.pendingBalance?.toLocaleString() || "0.00"}
                </Text>
                <Text style={styles.statSub}>Clears on delivery</Text>
            </View>

            {/* Total Earnings */}
            <View style={[styles.statCard, { backgroundColor: 'white', borderColor: '#E5E7EB' }]}>
                <View style={styles.statHeader}>
                    <FontAwesome5 name="wallet" size={14} color="#4B5563" />
                    <Text style={[styles.statLabel, { color: '#374151' }]}>Total Earned</Text>
                </View>
                <Text style={[styles.statValue, { color: '#1F2937' }]}>
                    ₦{earnings?.totalEarnings?.toLocaleString() || "0.00"}
                </Text>
                <Text style={styles.statSub}>Lifetime earnings</Text>
            </View>
        </View>

        {/* --- 3. TRANSACTION HISTORY --- */}
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <FlatList 
            data={earnings?.transactions || []}
            keyExtractor={item => item.id}
            renderItem={renderTransaction}
            scrollEnabled={false} // Let parent ScrollView handle it
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No transactions yet.</Text>
                </View>
            }
        />
      </ScrollView>

      {/* --- PAYOUT MODAL (Same as before but styled) --- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: 'white' }]}>
            
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Request Payout</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                   <View style={styles.closeBtn}>
                       <Ionicons name="close" size={20} color="#374151"/>
                   </View>
               </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput 
              style={styles.input} 
              placeholder={`Max: ₦${earnings?.availableBalance}`}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.inputLabel}>Bank Name</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowBankList(!showBankList)}>
              <Text style={{ color: selectedBank ? '#111827' : '#9CA3AF' }}>
                {selectedBank ? selectedBank.name : "Select Bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={{ position: 'absolute', right: 15, top: 15 }}/>
            </TouchableOpacity>

            {showBankList && (
              <View style={styles.bankDropdown}>
                 <TextInput 
                    style={styles.bankSearch}
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                 />
                 <ScrollView nestedScrollEnabled style={{ height: 150 }}>
                    {filteredBanks.map((bank) => (
                      <TouchableOpacity 
                        key={bank.code} 
                        style={styles.bankItem}
                        onPress={() => { setSelectedBank(bank); setShowBankList(false); }}
                      >
                        <Text style={{ color: '#374151' }}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
              </View>
            )}

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0123456789"
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
  headerContainer: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  refreshBtn: { padding: 8, backgroundColor: '#E5E7EB', borderRadius: 20 },

  // Main Card
  mainCard: { 
    marginHorizontal: 20, padding: 24, borderRadius: 24, backgroundColor: COLORS.primary, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, ...SHADOWS.medium
  },
  mainLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  mainAmount: { color: 'white', fontSize: 28, fontWeight: '800', marginTop: 4 },
  withdrawBtn: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  withdrawText: { color: COLORS.primary, fontWeight: '700' },

  // Stats Row
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  // Transactions
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginLeft: 20, marginBottom: 12 },
  txnItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 16 },
  txnIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  txnDate: { fontSize: 12, color: '#6B7280' },
  txnAmount: { fontSize: 16, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#9CA3AF' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 12 },
  
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, color: '#1F2937' },
  
  bankDropdown: { position: 'absolute', top: 200, left: 24, right: 24, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 10, elevation: 5, padding: 10 },
  bankSearch: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', padding: 8, marginBottom: 8 },
  bankItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },

  confirmBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  confirmText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '500', flex: 1 },
});