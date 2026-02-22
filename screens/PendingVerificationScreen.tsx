import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/authContext';
import { Ionicons } from '@expo/vector-icons';

export default function PendingVerificationScreen() {
  const { refreshUser, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="hourglass-outline" size={80} color={COLORS.primary} />
      </View>
      
      <Text style={styles.title}>Verification Pending</Text>
      <Text style={styles.sub}>
        Your account is currently under review. Our team checks documents manually to ensure safety. This usually takes 24-48 hours.
      </Text>

      <TouchableOpacity style={styles.btn} onPress={refreshUser}>
        <Text style={styles.btnText}>Check Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { width: 150, height: 150, backgroundColor: '#FFF7ED', borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  sub: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  btn: { backgroundColor: COLORS.primary, width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { padding: 16 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
});