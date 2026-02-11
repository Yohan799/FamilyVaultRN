import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Shield, Mail } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const TwoFactorSetupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const is2FAEnabled = profile?.two_factor_enabled;

    const handleToggle2FA = async () => {
        setIsLoading(true);
        try {
            if (is2FAEnabled) {
                // Disable 2FA
                await updateProfile({ two_factor_enabled: false });
                Alert.alert('Success', 'Two-factor authentication disabled');
            } else {
                // Enable 2FA - send OTP
                const { error } = await supabase.functions.invoke('send-2fa-otp', {
                    body: {},
                });

                if (error) throw error;

                Alert.alert(
                    'Code Sent',
                    `We've sent a verification code to ${profile?.email}. Please check your inbox.`
                );
                // TODO: Navigate to verification screen
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update 2FA settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={colors.foreground} size={24} />
                </Pressable>
                <View>
                    <Text style={styles.headerTitle}>Two-Factor Auth</Text>
                    <Text style={styles.headerSubtitle}>Secure your account</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Card */}
                <View style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Shield color={colors.primary} size={40} />
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle}>Secure Your Account</Text>
                    <Text style={styles.cardDescription}>
                        Add an extra layer of security to protect your account.
                    </Text>

                    {/* Email Info */}
                    <View style={styles.emailBox}>
                        <Mail color={colors.primary} size={20} />
                        <View style={styles.emailContent}>
                            <Text style={styles.emailTitle}>Email Verification</Text>
                            <Text style={styles.emailDescription}>
                                We'll send a code to <Text style={styles.emailBold}>{profile?.email}</Text> each time you sign in.
                            </Text>
                        </View>
                    </View>

                    {/* How it works */}
                    <View style={styles.howItWorks}>
                        <Text style={styles.howItWorksTitle}>How it works</Text>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>Sign in with your email and password</Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>Enter the 6-digit code from your email</Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>Access your account securely</Text>
                        </View>
                    </View>

                    {/* Action Button */}
                    <Pressable
                        style={[
                            styles.actionButton,
                            is2FAEnabled && styles.disableButton,
                            isLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleToggle2FA}
                        disabled={isLoading}
                    >
                        <Text style={[styles.actionButtonText, is2FAEnabled && styles.disableButtonText]}>
                            {isLoading
                                ? is2FAEnabled
                                    ? 'Disabling...'
                                    : 'Sending Code...'
                                : is2FAEnabled
                                    ? 'Disable Two-Factor Auth'
                                    : 'Enable Two-Factor Auth'}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
        gap: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    headerSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    cardDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emailBox: {
        flexDirection: 'row',
        backgroundColor: colors.accent,
        borderRadius: radius.xl,
        padding: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    emailContent: {
        flex: 1,
    },
    emailTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: 2,
    },
    emailDescription: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
    },
    emailBold: {
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    howItWorks: {
        marginBottom: spacing.lg,
    },
    howItWorksTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.primary,
    },
    stepText: {
        flex: 1,
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    actionButton: {
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    disableButton: {
        backgroundColor: colors.destructive,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    actionButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    disableButtonText: {
        color: colors.destructiveForeground,
    },
});
