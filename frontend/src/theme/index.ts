// Theme configuration for React Native
// Mirrors the TailwindCSS design system from the original app

export const colors = {
    // Core colors
    primary: '#3366FF',           // hsl(220, 100%, 60%)
    primaryForeground: '#FFFFFF',
    primaryLight: '#E8F0FE',      // Light blue accent for primary backgrounds
    background: '#F5F3FF',        // hsl(250, 100%, 97%)
    foreground: '#1A1625',        // hsl(250, 15%, 15%)

    // Card & Surface
    card: '#FFFFFF',
    cardForeground: '#1A1625',

    // Secondary
    secondary: '#EBE8F5',         // hsl(250, 60%, 95%)
    secondaryForeground: '#1A1625',

    // Muted
    muted: '#EDE9F5',             // hsl(250, 40%, 96%)
    mutedForeground: '#6B5E7A',   // hsl(250, 10%, 50%)

    // Accent
    accent: '#E8F0FE',            // hsl(220, 80%, 95%)
    accentForeground: '#3366FF',

    // Destructive
    destructive: '#EF4444',       // hsl(0, 84.2%, 60.2%)
    destructiveForeground: '#FFFFFF',

    // Border & Input
    border: '#D4CDE6',            // hsl(250, 30%, 90%)
    input: '#E8E3F0',             // hsl(250, 30%, 94%)
    ring: '#3366FF',

    // Vault specific
    vaultBlue: '#3366FF',
    vaultBlueLight: '#E8F0FE',
    vaultBlueDark: '#1A4FFF',
    vaultBg: '#F5F3FF',

    // Semantic colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Transparent
    transparent: 'transparent',
    white: '#FFFFFF',
    black: '#000000',
} as const;

export const spacing = {
    0: 0,
    px: 1,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    // Named aliases for convenience
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
} as const;

export const radius = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
} as const;

export const fontSize = {
    xs: { size: 12, lineHeight: 16 },
    sm: { size: 14, lineHeight: 20 },
    base: { size: 16, lineHeight: 24 },
    md: { size: 16, lineHeight: 24 }, // Alias for base
    lg: { size: 18, lineHeight: 28 },
    xl: { size: 20, lineHeight: 28 },
    '2xl': { size: 24, lineHeight: 32 },
    '3xl': { size: 30, lineHeight: 36 },
    '4xl': { size: 36, lineHeight: 40 },
} as const;

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
} as const;

export const theme = {
    colors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    shadows,
} as const;

export type Theme = typeof theme;
export type Colors = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
