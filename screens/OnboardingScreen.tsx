import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // 1. Import Icons
import { COLORS } from '../constants/theme';
import { tokenStorage } from '../utils/storage';

const { width, height } = Dimensions.get('window');

// 2. Use specific icons instead of the same image
const SLIDES = [
  {
    id: '1',
    title: 'Accept Delivery',
    description: 'Get notified of new orders nearby. Accept them instantly to start earning.',
    icon: 'bicycle-outline', // Rider/Delivery Icon
  },
  {
    id: '2',
    title: 'Track & Navigate',
    description: 'Real-time navigation to restaurants and customers with optimized routes.',
    icon: 'map-outline', // Navigation Icon
  },
  {
    id: '3',
    title: 'Earn & Withdraw',
    description: 'Track your earnings daily and withdraw to your bank account instantly.',
    icon: 'wallet-outline', // Financial Icon
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await tokenStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* 3. Render Icon inside a Circle Container */}
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleNext}>
          <Text style={styles.btnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 20 },
  
  // 4. New Professional Icon Styling
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100, // Makes it a perfect circle
    backgroundColor: '#FFF1F2', // Very light shade of your Wine color (adjust if needed)
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, lineHeight: 24 },
  footer: { padding: 24, paddingBottom: 50 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  activeDot: { backgroundColor: COLORS.primary, width: 24 }, // Elongated active dot for modern feel
  btn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});