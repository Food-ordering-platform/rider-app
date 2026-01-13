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
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/authContext";
import { useNavigation } from "@react-navigation/native";
// 1. Import your schema and type
import { signupSchema, SignupFormData } from "../utils/schema";

export default function SignupScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<any>();

  // 2. Use the inferred Type for your state
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  // 3. Create a state to hold validation errors
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // Helper to update field and clear error simultaneously
  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field if the user starts typing again
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async () => {
    // 4. Run Zod Validation
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      // Map Zod errors to our state object
      const formattedErrors: any = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          formattedErrors[err.path[0]] = err.message;
        }
      });
      setErrors(formattedErrors);
      // Optional: Shake animation or vibration here
      return;
    }

    // Validation Passed
    setLoading(true);
    try {
      // 5. Use 'result.data' which is the sanitized, typed data
      const response = await register({
        ...result.data,
        role: "DISPATCHER",
        terms: true,
      });

      Alert.alert("Success", "Account created! Please Verify OTP.");
      navigation.navigate("OtpVerification", {
        token: response.token,
        email: result.data.email,
      });
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error?.response?.data?.message || "Could not create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
            {/* COMPANY NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="e.g. Sefute Logistics"
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="partner@company.com"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
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
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* ADDRESS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Office Address</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="12 Airport Road, Warri"
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
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
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
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

  headerSection: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 5 },

  form: { gap: 15 },
  inputGroup: { marginBottom: 5 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
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
  }, // Red border for error

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  }, // Error message style

  registerBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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
});
