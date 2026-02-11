import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, shadows } from '@/theme';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      ...shadows.sm,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], minHeight: 36 },
      md: { paddingHorizontal: spacing[4], paddingVertical: spacing[2.5], minHeight: 44 },
      lg: { paddingHorizontal: spacing[6], paddingVertical: spacing[3], minHeight: 52 },
      icon: { width: 44, height: 44, padding: 0 },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.secondary },
      outline: { 
        backgroundColor: 'transparent', 
        borderWidth: 1, 
        borderColor: colors.border,
        ...{ shadowOpacity: 0 },
      },
      ghost: { 
        backgroundColor: 'transparent',
        ...{ shadowOpacity: 0 },
      },
      destructive: { backgroundColor: colors.destructive },
      link: { 
        backgroundColor: 'transparent',
        ...{ shadowOpacity: 0 },
      },
    };

    return {
      ...base,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(isDisabled && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: fontWeight.medium,
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: fontSize.sm.size },
      md: { fontSize: fontSize.base.size },
      lg: { fontSize: fontSize.lg.size },
      icon: { fontSize: fontSize.base.size },
    };

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      default: { color: colors.primaryForeground },
      secondary: { color: colors.secondaryForeground },
      outline: { color: colors.foreground },
      ghost: { color: colors.foreground },
      destructive: { color: colors.destructiveForeground },
      link: { color: colors.primary, textDecorationLine: 'underline' },
    };

    return {
      ...base,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' 
            ? colors.primaryForeground 
            : colors.primary}
        />
      ) : typeof children === 'string' ? (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
