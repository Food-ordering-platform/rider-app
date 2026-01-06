import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store'; // Import this
import { COLORS } from "../constants/theme";

// Import the hook directly (like Vendor App)
import { useVerifyOtp } from "../services/auth/auth.queries";
import { useAuth } from "../context/authContext";

export default function OtpVerificationScreen({ route, navigation }: any) {
  const { token: tempToken, email } = route.params || {};
  const [code, setCode] = useState("");
  
  // 1. Use the hook directly
  const { mutateAsync: verifyOtpMutation, isPending } = useVerifyOtp();
  
  // 2. Only pull 'refreshUser' from context
  const { refreshUser } = useAuth();

  const handleVerify = async () => {
    if (code.length < 6) return Alert.alert("Error", "Please enter a valid 6-digit code");
    if (!tempToken) return Alert.alert("Error", "Session missing. Please login again.");

    try {
      // A. Call the API
      const response = await verifyOtpMutation({ 
        token: tempToken, 
        code: code,
        clientType: 'mobile' 
      });

      // B. Handle Success Manually (Like Vendor App)
      if (response.token) {
        // Save the token
        await SecureStore.setItemAsync('auth_token', response.token);
        
        // Update the Global State (Context)
        await refreshUser();
        
        // Navigation is automatic via App.tsx when 'user' becomes valid,
        // but you can safely log to console here.
        console.log("Verification Successful");
      }
    } catch (error: any) {
       // Error is handled by the mutation onError, but we catch to prevent crash
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to {email}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={styles.verifyBtn} 
            onPress={handleVerify}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Verify Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { flex: 1, padding: 30 },
  backBtn: { marginBottom: 20 },
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.primary, marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#6B7280" },
  inputContainer: { marginBottom: 30 },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 10,
    backgroundColor: "#F9FAFB",
    fontWeight: "bold",
  },
  verifyBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "bold" },
});