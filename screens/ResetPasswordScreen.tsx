import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { authService } from '../services/auth/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { token, email } = route.params; // Token from previous screen
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Verify OTP, 2 = Set Password
  const [resetToken, setResetToken] = useState('');

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await authService.verifyResetOtp({ token, code });
      setResetToken(res.resetToken); // Get the authorized reset token
      setStep(2);
    } catch (error: any) {
      Alert.alert("Error", "Invalid Code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await authService.resetPassword({
        token: resetToken,
        newPassword,
        confirmPassword: newPassword
      });
      Alert.alert("Success", "Password reset successfully!");
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{step === 1 ? "Enter Code" : "New Password"}</Text>
      <Text style={styles.sub}>{step === 1 ? `We sent a code to ${email}` : "Create a secure password"}</Text>

      {step === 1 ? (
        <TextInput 
          style={styles.input}
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
      ) : (
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{marginRight: 10}}/>
            <TextInput 
            style={{flex: 1}}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            />
        </View>
      )}

      <TouchableOpacity 
        style={styles.btn} 
        onPress={step === 1 ? handleVerifyOtp : handleReset} 
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{step === 1 ? "Verify" : "Reset Password"}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  sub: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 24, letterSpacing: 8, marginBottom: 24, height: 60 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24, height: 56 },
  btn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});