import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";
import { loginSchema } from "../utils/schema";

export default function LoginScreen({ navigation } : any) {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const formattedErrors: any = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      const response = await login({ 
        email: result.data.email, 
        password: result.data.password 
      });

      if (response?.requireOtp && response?.token) {
        setLoading(false);
        navigation.navigate("OtpVerification", { 
          token: response.token, 
          email: result.data.email 
        });
        return;
      }
      // Success is handled by AuthContext auto-navigating
    } catch (error: any) {
      Alert.alert("Login Failed", error?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          
          {/* LOGO AREA */}
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="bicycle" size={48} color={COLORS.primary} />
            </View>
            <Text style={[styles.appName]}>Choweazy</Text>
            {/* 🟢 Replaced "Dispatcher Portal" with "Delivery Partner" */}
            <Text style={styles.roleLabel}>Delivery Partner</Text>
          </View>

          {/* FORM AREA */}
          <View style={styles.formContainer}>
            
            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={[styles.input, errors.email && styles.inputError]} 
                placeholder="partner@choweazy.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={[styles.input, errors.password && styles.inputError]} 
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              
              <TouchableOpacity 
                onPress={() => navigation.navigate("ForgotPassword")} 
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
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
            <Text style={styles.footerText}>New rider? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
               <Text style={styles.linkText}>Become a Partner</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  
  // Header
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { 
    width: 88, height: 88, borderRadius: 44, 
    backgroundColor: '#F0F9FF', // Very light blue to match Primary
    alignItems: 'center', justifyContent: 'center', marginBottom: 16 
  },
  appName: { fontSize: 30, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  roleLabel: { fontSize: 16, color: '#6B7280', marginTop: 4, fontWeight: '500' },

  // Form
  formContainer: { gap: 20 },
  inputWrapper: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { 
    height: 52, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', 
    borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#1F2937' 
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 10, padding: 4 },
  forgotText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  
  loginBtn: { 
    height: 56, backgroundColor: COLORS.primary, borderRadius: 14, 
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#6B7280', fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 }
});