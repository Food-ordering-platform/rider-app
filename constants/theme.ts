// constants/theme.ts

// 1. The "Ingredients" (Raw Colors)
const PALETTE = {
  redPrimary: "#7b1e3a",
  redDark: "#5a1228",
  redLight: "#a63f5b", // Lighter red for Dark Mode
  amber: "#FFC107",
  green: "#059669",
  redDanger: "#DC2626",
  
  // Neutrals
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F4F6F8", // Your old background
  gray200: "#E5E7EB", // Your old border
  gray300: "#D1D5DB",
  gray700: "#374151",
  gray800: "#1F2937", // Your old text
  gray900: "#111827",
  black: "#000000",
};

// 2. The "Menu" (Light vs Dark Definitions)
export const THEME = {
  light: {
    primary: PALETTE.redPrimary,
    primaryDark: PALETTE.redDark,
    secondary: PALETTE.amber,
    background: PALETTE.gray100, // Matches your old background
    surface: PALETTE.white,      // Matches your old surface
    text: PALETTE.gray900,       // Matches your old text
    textLight: "#6B7280",        // Matches your old textLight
    success: PALETTE.green,
    danger: PALETTE.redDanger,
    border: PALETTE.gray200,
    white: PALETTE.white,
    error:PALETTE.redDanger,
    
    // Status Bar Props (Optional helper)
    statusBar: 'dark-content' as const,
  },
  dark: {
    primary: PALETTE.redLight,   // Lighter red shows better on black
    primaryDark: PALETTE.redPrimary,
    secondary: PALETTE.amber,
    background: PALETTE.gray900, // Dark background
    surface: PALETTE.gray800,    // Dark cards
    text: PALETTE.gray50,        // White text
    textLight: PALETTE.gray300,  // Light gray text
    success: "#34D399",          // Brighter green for dark mode
    danger: "#F87171",           // Brighter red for dark mode
    border: PALETTE.gray700,
    white: PALETTE.white,        // White is always white
    
    // Status Bar Props
    statusBar: 'light-content' as const,
  },
};

// 3. Backward Compatibility (The Safety Net)
// This ensures 'import { COLORS } from ...' still works!
export const COLORS = THEME.light;

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};