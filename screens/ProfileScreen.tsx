import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";

export default function ProfileScreen() {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  };

  const MenuItem = ({ icon, label, color = '#374151', isDestructive = false, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: isDestructive ? '#FEE2E2' : '#F3F4F6' }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? COLORS.danger : '#4B5563'} />
      </View>
      <Text style={[styles.menuLabel, { color: isDestructive ? COLORS.danger : color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* HEADER PROFILE */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>SL</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Sefute Logistics"}</Text>
          <Text style={styles.email}>{user?.email || "admin@sefute.com"}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VERIFIED PARTNER</Text>
          </View>
        </View>

        {/* BUSINESS INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
               <Ionicons name="call-outline" size={18} color="gray" />
               <Text style={styles.infoText}>+234 801 234 5678</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
               <Ionicons name="location-outline" size={18} color="gray" />
               <Text style={styles.infoText}>Warri, Delta State</Text>
            </View>
          </View>
        </View>

        {/* MENU */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            <MenuItem icon="notifications-outline" label="Push Notifications" />
            <MenuItem icon="lock-closed-outline" label="Change Password" />
            <MenuItem icon="document-text-outline" label="Terms & Agreements" />
            <MenuItem icon="headset-outline" label="Support" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.2 (Build 14)</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#FCE7F3' },
  avatarText: { fontSize: 28, fontWeight: '700', color: 'white' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#15803D', fontSize: 10, fontWeight: '800' },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },
  
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  menuContainer: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

  logoutBtn: { backgroundColor: '#FEE2E2', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 16 },
  
  version: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 20 }
});