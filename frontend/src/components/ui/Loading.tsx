import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, Text } from 'react-native';
import { colors, spacing, fontSize } from '@/theme';

interface LoadingProps {
    size?: 'small' | 'large';
    color?: string;
    fullScreen?: boolean;
    text?: string;
    style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'large',
    color = colors.primary,
    fullScreen = false,
    text,
    style,
}) => {
    const content = (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );

    if (fullScreen) {
        return <View style={styles.fullScreen}>{content}</View>;
    }

    return content;
};

interface SkeletonProps {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style,
}) => {
    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        />
    );
};

// Card skeleton for loading states
export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.cardSkeleton, style]}>
        <Skeleton height={24} width={120} style={{ marginBottom: spacing[2] }} />
        <Skeleton height={16} width={180} style={{ marginBottom: spacing[1] }} />
        <Skeleton height={16} width={80} />
    </View>
);

// List item skeleton
export const ListItemSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.listItemSkeleton, style]}>
        <View style={styles.listItemContent}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.listItemText}>
                <Skeleton height={16} width={140} style={{ marginBottom: spacing[1] }} />
                <Skeleton height={12} width={100} />
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
    },
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    text: {
        marginTop: spacing[2],
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    skeleton: {
        backgroundColor: colors.muted,
    },
    cardSkeleton: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing[4],
    },
    listItemSkeleton: {
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemText: {
        flex: 1,
        marginLeft: spacing[3],
    },
});
