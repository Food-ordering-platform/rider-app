import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  // ✅ FIX: Allow both Light AND Dark theme types
  colors: typeof THEME.light | typeof THEME.dark; 
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

// Initialize with a dummy default to satisfy TypeScript before the provider loads
const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  colors: THEME.light,
  isDark: false,
  setMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load saved preference on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('app.theme');
        if (saved) setModeState(saved as ThemeMode);
      } catch (e) {
        console.log('Failed to load theme');
      }
    };
    loadTheme();
  }, []);

  // Save preference when it changes
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('app.theme', newMode);
    } catch (e) {
      console.log('Failed to save theme');
    }
  };

  // Determine actual active theme
  const activeMode = mode === 'system' ? (systemScheme || 'light') : mode;
  
  // ✅ This logic now works because the interface allows both types
  const colors = activeMode === 'dark' ? THEME.dark : THEME.light;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark: activeMode === 'dark', setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook for easy access
export const useTheme = () => useContext(ThemeContext)