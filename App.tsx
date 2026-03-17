import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform,  View } from "react-native";
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
import { tokenStorage } from "./utils/storage";
import { COLORS } from "./constants/theme";
import { PWAInstallBanner } from "./components/PWAInstallBanner";


// Screens
import SplashScreen from "./screens/SplashScreen"; //  Added Splash Screen
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

// --- 1. BOTTOM TABS ---
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
          minHeight: Platform.select({ ios: 85, android: 70, default: 60 }), 
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === 'android' ? 10 : 0, 
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

// --- 2. MAIN NAVIGATION ---
const NavigationContent = React.memo(function NavigationContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  usePushNotification(); 
  
  // 🟢 State to track if this is a fresh install
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has seen onboarding
    tokenStorage.getItem('hasSeenOnboarding').then(val => {
        // If val is null/undefined, it IS their first launch
        setIsFirstLaunch(!val);
    });
  }, []);

  // Show a blank view while securely fetching from tokenStorage
  if (isLoading || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
            {/* 🟢 1. Inject Splash Screen and pass the flag */}
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen} 
              initialParams={{ isFirstLaunch }} 
            />
            
            {/* 🟢 2. Only mount Onboarding if it is actually their first launch */}
            {isFirstLaunch && (
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
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="transparent" translucent />
        <AuthProvider>
            <NavigationContent />
            <PWAInstallBanner />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}