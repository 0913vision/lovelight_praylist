/**
 * Centralized color configuration for the app
 * All hex color codes are managed here for consistency and maintainability
 */

// Base color palette - actual color values are defined here
const palette = {
  // Primary theme colors
  primary: {
    light: '#4b5563',      // gray-600 - primary color for light mode
    dark: '#fcd34d',       // amber-300 - primary color for dark mode
  },

  // Grayscale colors
  white: '#ffffff',
  black: '#000000',
  gray: {
    400: '#9ca3af',
    500: '#6b7280',
    800: '#1f2937',
  },
  neutral: {
    200: '#e5e5e5',
    300: '#d4d4d4',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    900: '#171717',
  },

  // Status colors
  red: {
    500: '#ef4444',
    600: '#dc2626',
  },
} as const;

// Semantic colors - references to base palette
export const Colors = {
  // Primary theme colors
  primary: palette.primary,

  // Background colors
  background: {
    light: palette.white,
    dark: palette.neutral[900],
  },

  // Text colors
  text: {
    primary: {
      light: palette.black,
      dark: palette.white,
    },
    placeholder: {
      light: palette.gray[500],
      dark: palette.gray[400],
    },
  },

  // Border colors
  border: {
    light: palette.gray[400],
    dark: palette.neutral[600],
  },

  // Status colors
  status: {
    error: {
      light: palette.red[600],
      dark: palette.red[500],
    },
    disabled: {
      light: palette.gray[400],
      dark: palette.neutral[500],
    },
  },

  // Progress/loading colors (references primary)
  progress: {
    foreground: palette.primary,
    background: {
      light: palette.neutral[200],
      dark: palette.neutral[700],
    },
  },

  // Icon colors
  icon: {
    primary: {
      light: palette.gray[500],
      dark: palette.gray[400],
    },
  },

  // Button colors (references primary)
  button: {
    background: palette.primary,
    text: {
      light: palette.white,
      dark: palette.gray[800],
    },
    update: {
      light: palette.neutral[300],
      dark: palette.primary.dark,
    },
  },
} as const;

/**
 * Helper function to get color based on theme
 * @param colorPath - Path to the color object (e.g., Colors.primary)
 * @param isDark - Whether dark mode is active
 * @returns Appropriate color for the current theme
 */
export const getThemeColor = (
  colorPath: { light: string; dark: string },
  isDark: boolean
): string => {
  return isDark ? colorPath.dark : colorPath.light;
};
