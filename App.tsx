import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

// Hooks & Context
import { usePushNotification } from "./hooks/usePushNotification";
import { AuthProvider, useAuth } from "./context/authContext";
import { SocketProvider } from "./context/socketContext";
import { tokenStorage } from "./utils/storage";
import { COLORS } from "./constants/theme";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

// Screens
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import PendingVerificationScreen from "./screens/PendingVerificationScreen";

import DashboardScreen from "./screens/DashboardScreen";
import ActiveTripsScreen from "./screens/ActiveTripScreen";
import WalletScreen from "./screens/EarningScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderDetailsScreen from "./screens/OrderDetailsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// --- 1. LOADING SCREEN ---
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require("./assets/rider_logo.png")}
        style={styles.loadingLogo}
      />
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// --- 2. BOTTOM TABS ---
function DispatcherTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          // 🔴 FIX: Removed fixed 'height' which caused twitching when padding was added
          // height: Platform.select({ ios: 80, android: 70, default: 60 }), 
          minHeight: Platform.select({ ios: 85, android: 70, default: 60 }), // Allow growth
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === 'android' ? 10 : 0, // Add spacing for Android
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Active"
        component={ActiveTripsScreen}
        options={{
          tabBarLabel: "On Road",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bicycle" : "bicycle-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- 3. MAIN NAVIGATION ---
const NavigationContent = React.memo(function NavigationContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // 🟢 UNCOMMENT THIS LINE BELOW ONCE TO RESET ONBOARDING, THEN RE-COMMENT IT
    // tokenStorage.removeItem('hasSeenOnboarding');

    tokenStorage.getItem('hasSeenOnboarding').then(val => {
        setHasSeenOnboarding(!!val);
    });
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {/* 🔴 FIX: Removed StatusBar from here to prevent re-render twitching */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // --- AUTHENTICATED FLOW ---
          user?.isVerified ? (
             // VERIFIED -> DASHBOARD
             <>
               <Stack.Screen name="Main" component={DispatcherTabs} />
               <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
             </>
          ) : (
             // UNVERIFIED -> PENDING SCREEN
             <Stack.Screen name="PendingVerification" component={PendingVerificationScreen} />
          )
        ) : (
          // --- UNAUTHENTICATED FLOW ---
          <>
            {!hasSeenOnboarding && (
               <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default function App() {
  usePushNotification(); // Initialize Push Notifications

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* 🟢 FIX: Moved StatusBar here for stability */}
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <AuthProvider>
          <SocketProvider>
            <NavigationContent />
            <PWAInstallBanner />
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: "contain",
  }
});