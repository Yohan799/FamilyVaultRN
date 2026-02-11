import React from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '@/theme';

export interface InputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    containerStyle,
    inputStyle,
    disabled,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const getInputContainerStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.muted,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: 'transparent',
            minHeight: 52,
            paddingHorizontal: spacing[4],
        };

        if (isFocused) {
            base.borderColor = colors.primary;
            base.backgroundColor = colors.white;
        }

        if (error) {
            base.borderColor = colors.destructive;
        }

        if (disabled) {
            base.opacity = 0.5;
            base.backgroundColor = colors.muted;
        }

        return base;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={getInputContainerStyle()}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <RNTextInput
                    style={[styles.input, inputStyle]}
                    placeholderTextColor={colors.mutedForeground}
                    editable={!disabled}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[3],
    },
    label: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing[1.5],
    },
    input: {
        flex: 1,
        fontSize: fontSize.base.size,
        color: colors.foreground,
        paddingVertical: spacing[3],
    },
    leftIcon: {
        marginRight: spacing[3],
    },
    rightIcon: {
        marginLeft: spacing[2],
    },
    error: {
        fontSize: fontSize.sm.size,
        color: colors.destructive,
        marginTop: spacing[1],
    },
    helperText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
});
