import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, shadows } from '@/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
    return <View style={[styles.card, style]}>{children}</View>;
};

export const CardHeader: React.FC<CardProps> = ({ children, style }) => {
    return <View style={[styles.cardHeader, style]}>{children}</View>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({
    children,
    style
}) => {
    return <Text style={[styles.cardTitle, style]}>{children}</Text>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({
    children,
    style
}) => {
    return <Text style={[styles.cardDescription, style]}>{children}</Text>;
};

export const CardContent: React.FC<CardProps> = ({ children, style }) => {
    return <View style={[styles.cardContent, style]}>{children}</View>;
};

export const CardFooter: React.FC<CardProps> = ({ children, style }) => {
    return <View style={[styles.cardFooter, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md,
    },
    cardHeader: {
        padding: spacing[4],
        paddingBottom: spacing[2],
    },
    cardTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.semibold,
        color: colors.cardForeground,
    },
    cardDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    cardContent: {
        padding: spacing[4],
        paddingTop: 0,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        paddingTop: 0,
    },
});
