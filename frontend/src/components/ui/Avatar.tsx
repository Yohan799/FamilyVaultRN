import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors, fontSize, fontWeight } from '@/theme';

interface AvatarProps {
    source?: { uri: string } | null;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    source,
    fallback,
    size = 'md',
    style,
}) => {
    const sizeStyles = {
        sm: { container: 32, text: fontSize.xs.size },
        md: { container: 40, text: fontSize.sm.size },
        lg: { container: 56, text: fontSize.lg.size },
        xl: { container: 80, text: fontSize['2xl'].size },
    };

    const dimensions = sizeStyles[size];
    const initials = fallback?.charAt(0).toUpperCase() || '?';

    const containerStyle: ViewStyle = {
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
    };

    if (source?.uri) {
        const imageStyle: ImageStyle = {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
        };
        return (
            <View style={[styles.container, containerStyle, style]}>
                <Image
                    source={source}
                    style={[styles.image, imageStyle]}
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, styles.fallbackContainer, containerStyle, style]}>
            <Text style={[styles.fallbackText, { fontSize: dimensions.text }]}>
                {initials}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    fallbackContainer: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fallbackText: {
        color: colors.white,
        fontWeight: fontWeight.semibold,
    },
});
