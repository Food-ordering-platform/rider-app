import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

// Import the hook directly
import { useVerifyOtp } from "../services/auth/auth.queries";

export default function OtpVerificationScreen({ route, navigation }: any) {
  const { email } = route.params || {};
  const [code, setCode] = useState("");
  
  const { mutateAsync: verifyOtpMutation, isPending } = useVerifyOtp();

  const handleVerify = async () => {
    if (code.length < 6) return Alert.alert("Error", "Please enter a valid 6-digit code");

    try {
      // 1. Call the API
      const response = await verifyOtpMutation({ email, code });

      // 2. Route to Login on Success
      if (response.success) {
        Alert.alert(
          "Verification Successful!", 
          "Your account is verified. Please log in to continue."
        );
        navigation.navigate('Login'); 
      }
    } catch (error: any) {
       // Error is safely handled by the mutation's onError block
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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