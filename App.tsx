import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { COLORS } from "./constants/theme";
import { AuthProvider, useAuth } from "./context/authContext";
import { SocketProvider } from "./context/socketContext";
// Screens
import ActiveTripsScreen from "./screens/ActiveTripScreen";
import DashboardScreen from "./screens/DashboardScreen";
import LoginScreen from "./screens/LoginScreen";
import OrderDetailsScreen from "./screens/OrderDetailsScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SignupScreen from "./screens/SignupScreen";
import WalletScreen from "./screens/EarningScreen";

console.log("🔥 App.tsx loaded");

// Initialize web-specific features
if (Platform.OS === "web") {
  import("./web-init");
}
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// --- 1. LOADING SCREEN ---
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require("./assets/rider_logo.png")}
        style={{
          width: 100,
          height: 100,
          marginBottom: 20,
          resizeMode: "contain",
        }}
      />
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// --- 2. BOTTOM TABS (Clean - No Badges, just PWA Fixes) ---
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
          
          // PWA Layout Fix:
          height: Platform.select({
            web: undefined, // Let it grow naturally on web
            default: 60 + insets.bottom, // Fixed height on native
          }),
          paddingBottom: Platform.select({
            web: 20, 
            default: insets.bottom + 6,
          }),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === 'web' ? 5 : 0, 
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Active"
        component={ActiveTripsScreen}
        options={{
          tabBarLabel: "On Road",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bicycle" : "bicycle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "business" : "business-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- 3. MAIN NAVIGATION (With Lifecycle Listener) ---
const NavigationContent = React.memo(function NavigationContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Hooks for Lifecycle Listener
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);

  // --- LIFECYCLE LISTENER IMPLEMENTATION ---
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Check if app has come from background to active (foreground)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // console.log("⚡ App has come to the foreground! Refetching data...");
        // This triggers a refresh of all data hooks (Dashboard, Active Trips, etc.)
        queryClient.invalidateQueries();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (Platform.OS === "web") {
          try {
            sessionStorage.setItem("NAVIGATION_STATE", JSON.stringify(state));
          } catch (e) {
            // Ignore errors
          }
        }
      }}
    >
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={DispatcherTabs} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignupScreen} />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default function App() {
  console.log("🚀 App component rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
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
});