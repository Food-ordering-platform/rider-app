import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
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

// Initialize web-specific features
if (Platform.OS === "web") {
  import("./web-init");
}

// Screens
import ActiveTripsScreen from "./screens/ActiveTripScreen";
import DashboardScreen from "./screens/DashboardScreen";
import LoginScreen from "./screens/LoginScreen";
import OrderDetailsScreen from "./screens/OrderDetailsScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SignupScreen from "./screens/SignupScreen";
import WalletScreen from "./screens/WalletScreen";

console.log("🔥 App.tsx loaded");

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// --- 1. THE NEW "SPLASH" LOADING SCREEN ---
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      {/* You can use your app logo here */}
      <Image
        source={require("./assets/rider_logo.png")} // Make sure this path exists or use a text
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

// --- BOTTOM TABS (Unchanged) ---
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
          height: 85 + insets.bottom, // 👈 dynamic height
          paddingBottom: insets.bottom + 6, // 👈 prevents overlap
          paddingTop: 6,
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
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

// --- MAIN NAVIGATION ---
const NavigationContent = React.memo(function NavigationContent() {
  // 2. Destructure `isLoading` from your Auth Context
  const { isAuthenticated, isLoading } = useAuth();

  // 3. SHOW LOADING SCREEN WHILE CHECKING SESSION
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        // Save navigation state to prevent loss on tab switch
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
