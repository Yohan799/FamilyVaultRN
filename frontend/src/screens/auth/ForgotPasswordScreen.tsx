import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Shield, Mail } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.functions.invoke('send-password-reset-otp', {
                body: { email: email.toLowerCase() },
            });

            if (error) throw error;

            // Navigate to OTP screen with email
            navigation.navigate('PasswordResetOTP', { email: email.toLowerCase() });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.card}>
                        {/* Back Button */}
                        <View style={styles.backRow}>
                            <Pressable
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <ArrowLeft color={colors.foreground} size={20} />
                            </Pressable>
                            <Text style={styles.backText}>Sign In</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Forgot Password</Text>

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Shield color={colors.primary} size={40} strokeWidth={2.5} />
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            Enter your email address and we'll send you a code to reset your password.
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Mail color={colors.mutedForeground} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email address"
                                placeholderTextColor={colors.mutedForeground}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? 'Sending...' : 'Send Reset Code'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    title: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    description: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.input,
        borderRadius: radius['2xl'],
        marginBottom: spacing.lg,
    },
    inputIcon: {
        marginLeft: spacing.md,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
});
