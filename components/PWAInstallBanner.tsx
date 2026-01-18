import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Modal,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInstallPrompt } from '../hooks/useInstallPrompts';
import { COLORS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 500;

export const PWAInstallBanner = () => {
  const { isInstallable, triggerInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // 1. Check if already installed
    const nav = window.navigator as any;
    const isApp = window.matchMedia('(display-mode: standalone)').matches || (nav.standalone === true);
    setIsStandalone(isApp);
    if (isApp) return;

    // 2. Check Device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = 
      userAgent.includes('iphone') || 
      userAgent.includes('ipad') || 
      userAgent.includes('ipod');
    setIsIOS(isIosDevice);

    // 3. Auto-Show Logic
    if (isIosDevice) {
       setTimeout(() => setIsVisible(true), 3000);
    }
  }, []);

  useEffect(() => {
    if (isInstallable && !isStandalone) {
      setTimeout(() => setIsVisible(true), 3000);
    }
  }, [isInstallable, isStandalone]);

  if (!isVisible) return null;

  const handleInstall = async () => {
    if (!isIOS) {
       await triggerInstall();
       setIsVisible(false);
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Install Rider App</Text>
            <Text style={styles.description}>
              {isIOS 
                ? "Install our app for better performance and battery life." 
                : "Add ChowEazy Rider to your home screen for quick access."}
            </Text>
          </View>

          <View style={styles.content}>
            {isIOS ? (
              <View style={styles.iosSteps}>
                 <View style={styles.stepRow}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="share-outline" size={22} color="#0284c7" />
                    </View>
                    <View>
                      <Text style={styles.stepTitle}>1. Tap the Share button</Text>
                      <Text style={styles.stepDesc}>Look for the share icon in your browser.</Text>
                    </View>
                 </View>
                 <View style={styles.stepRow}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="add-circle-outline" size={22} color="#000" />
                    </View>
                    <View>
                      <Text style={styles.stepTitle}>2. Select &quot;Add to Home Screen&quot;</Text>
                      <Text style={styles.stepDesc}>Scroll down to find this option.</Text>
                    </View>
                 </View>
              </View>
            ) : (
              <View style={styles.androidAction}>
                 <View style={styles.appIconContainer}>
                    <Image 
                      source={require('../assets/images/icon.png')} 
                      style={styles.appIcon} 
                    />
                 </View>
                 <TouchableOpacity 
                    style={styles.primaryBtn}
                    onPress={handleInstall}
                 >
                    <Text style={styles.primaryBtnText}>Install App Now</Text>
                 </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.secondaryBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center', 
  },
  sheet: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: MAX_WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...SHADOWS.medium,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  content: { marginBottom: 24 },
  iosSteps: { gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 },
  stepIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  stepDesc: { fontSize: 13, color: '#6B7280' },
  androidAction: { alignItems: 'center', gap: 16 },
  appIconContainer: { marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  appIcon: { width: 80, height: 80, borderRadius: 20 },
  primaryBtn: { width: '100%', height: 50, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 0 },
  secondaryBtn: { width: '100%', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  secondaryBtnText: { color: '#374151', fontSize: 15, fontWeight: '500' },
});