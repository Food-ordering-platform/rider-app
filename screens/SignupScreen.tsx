import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";
import { useNavigation } from "@react-navigation/native";
import { signupSchema, SignupFormData } from "../utils/schema";
import { toast } from '../components/ui/Toast';

export default function SignupScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<any>();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    terms: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this specific field when the user modifies it
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async () => {
    // 1. Run Zod Validation
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      // 2. Map Zod errors to our state object
      const formattedErrors: any = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          formattedErrors[err.path[0]] = err.message;
        }
      });
      
      setErrors(formattedErrors);
      
      // Show a toast specifically if they forgot the terms, since it's at the bottom
      if (formattedErrors.terms) {
        toast.error("Terms Required", formattedErrors.terms);
      }
      return;
    }

    setLoading(true);
    try {
      // 🟢 THE FIX: Send result.data directly! It already contains `terms: true`
      await register({
        ...result.data, 
        role: "RIDER" as const, 
      });
      
      toast.success("Success!! Account created! Please verify your email.");
      navigation.navigate('VerifyOtp', { email: result.data.email });

    } catch (error: any) {
      // Safely parse array-based backend errors (like the Zod one you just saw)
      let msg = "Registration failed";
      const serverError = error.response?.data?.error || error.response?.data?.message;
      
      if (typeof serverError === 'string') {
        try {
          const parsed = JSON.parse(serverError);
          if (Array.isArray(parsed) && parsed[0]?.message) {
             msg = parsed[0].message;
          } else {
             msg = serverError;
          }
        } catch(e) {
          msg = serverError;
        }
      } else if (serverError) {
        msg = serverError;
      } else if (error.message) {
        msg = error.message;
      }

      toast.error("Registration Failed", serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Partner Application</Text>
            <Text style={styles.subtitle}>
              Join ChowEazy as a Logistics Partner
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            {/* NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="John Doe"
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
              />
              <Text style={styles.errorText}>{errors.name || " "}</Text>
            </View>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="johnDoe@gmail.com"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.errorText}>{errors.email || " "}</Text>
            </View>

            {/* PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="08012345678"
                value={formData.phone}
                onChangeText={(text) => handleChange("phone", text)}
                keyboardType="phone-pad"
              />
              <Text style={styles.errorText}>{errors.phone || " "}</Text>
            </View>

            {/* ADDRESS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="12 Airport Road, Warri"
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
              />
              <Text style={styles.errorText}>{errors.address || " "}</Text>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Create a secure password"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry
              />
              <Text style={styles.errorText}>{errors.password || " "}</Text>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                onPress={() => handleChange("terms", !formData.terms)}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={formData.terms ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={errors.terms ? "#EF4444" : (COLORS.primary || '#000')} 
                />
                <Text style={[styles.termsText, errors.terms && { color: "#EF4444" }]}>
                  I agree to the Terms and Conditions
                </Text>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "white" },
  content: { padding: 30, paddingBottom: 50 },
  backBtn: { marginBottom: 20 },

  headerSection: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 5 },

  form: { marginTop: 10 },
  inputGroup: { marginBottom: 0 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
    backgroundColor: "#FEF2F2",
  },

  // The text always renders with a minimum height, so the layout never jumps!
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    minHeight: 18, 
    marginBottom: 5,
  },

  registerBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  registerBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#6B7280" },
  linkText: { color: COLORS.primary, fontWeight: "700" },
  
  termsContainer: {
    marginBottom: 10,
    marginTop: -5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
});