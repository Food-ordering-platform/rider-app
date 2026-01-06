import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<any>();
  
  const [formData, setFormData] = useState({
    name: "", // This will be the Company Name
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      return Alert.alert("Error", "Please fill in all required fields");
    }
    
    setLoading(true);
    try {
      // We pass the data to your existing Auth Context
      await register({
        ...formData,
        address:formData.address || "Warri",
        role: "DISPATCHER",
        terms:true // Important: Flag them as a Dispatcher
      });
      // Context will auto-redirect if successful, or you can navigate to Login
      Alert.alert("Success", "Account created! Please log in.");
      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert("Registration Failed", error?.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Partner Application</Text>
            <Text style={styles.subtitle}>Join ChowEazy as a Logistics Partner</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Sefute Logistics"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="partner@company.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input} 
                placeholder="08012345678"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Office Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="12 Airport Road, Warri"
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Create a secure password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.registerBtn} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
               <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { padding: 30, paddingBottom: 50 },
  backBtn: { marginBottom: 20 },
  
  headerSection: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 5 },

  form: { gap: 15 },
  inputGroup: { marginBottom: 5 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase' },
  input: { height: 50, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  
  registerBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 5 },
  registerBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#6B7280' },
  linkText: { color: COLORS.primary, fontWeight: '700' }
});