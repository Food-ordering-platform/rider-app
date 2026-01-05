import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";

export default function LoginScreen() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please enter email and password");
    
    setLoading(true);
    try {
      // NOTE: Ensure your authContext login function expects { email, password }
      await login({ email, password });
      // Navigation is handled by App.tsx automatically when isAuthenticated becomes true
    } catch (error: any) {
      Alert.alert("Login Failed", error?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          
          {/* LOGO AREA */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="bicycle" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>ChowEazy</Text>
            <Text style={styles.roleLabel}>Dispatcher Portal</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="partner@company.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input} 
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Need to become a partner? </Text>
            <TouchableOpacity>
               <Text style={styles.linkText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  
  logoSection: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  roleLabel: { fontSize: 16, color: '#6B7280', marginTop: 5 },

  form: { gap: 20 },
  inputGroup: { marginBottom: 5 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase' },
  input: { height: 56, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  
  forgotText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  
  loginBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 5 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#6B7280' },
  linkText: { color: COLORS.primary, fontWeight: '700' }
});