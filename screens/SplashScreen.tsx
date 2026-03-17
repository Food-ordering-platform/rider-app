import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme'; 

export default function SplashScreen({ navigation, route }: any) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  // Get the flag passed from App.tsx
  const { isFirstLaunch } = route.params;

  useEffect(() => {
    // 1. Play the logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Navigate based on First Launch status after 3 seconds
    const timer = setTimeout(() => {
      if (isFirstLaunch) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View 
        style={{ 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <View style={styles.logoMask}>
          <Image 
            source={require('../assets/rider_logo.png')} 
            style={styles.logo}
            resizeMode="cover" 
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary, // Uses the Rider app's primary color
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMask: {
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: 'white', // Changed to white to make the rider logo pop
    overflow: 'hidden', 
    elevation: 15, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});