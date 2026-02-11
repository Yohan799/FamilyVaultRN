import React, { useState, useRef } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type RoutePropType = RouteProp<AuthStackParamList, 'PasswordResetOTP'>;

export const PasswordResetOTPScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RoutePropType>();
    const email = route.params?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

    // Redirect if no email
    if (!email) {
        navigation.navigate('ForgotPassword');
        return null;
    }

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pastedOtp = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedOtp.forEach((char, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);
            const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5);
            inputRefs.current[lastFilledIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
                body: { email, otp: otpString },
            });

            if (error || !data?.success) {
                throw new Error(data?.error || 'Invalid or expired code');
            }

            Alert.alert('Verified', 'You can now set a new password');
            navigation.navigate('ResetPassword', {
                email,
                resetToken: data.resetToken,
            });
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message || 'Invalid or expired code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const { error } = await supabase.functions.invoke('send-password-reset-otp', {
                body: { email },
            });

            if (error) throw error;

            Alert.alert('Code Sent', 'A new code has been sent to your email');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    const isOtpComplete = otp.every(digit => digit !== '');

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
                            <Text style={styles.backText}>Back</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Enter OTP</Text>

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Shield color="#3B82F6" size={40} strokeWidth={2.5} />
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            We've sent a verification code to
                        </Text>
                        <Text style={styles.email}>{email}</Text>

                        {/* OTP Inputs */}
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref: TextInput | null) => {
                                        inputRefs.current[index] = ref;
                                    }}
                                    style={[
                                        styles.otpInput,
                                        digit && styles.otpInputFilled,
                                    ]}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={({ nativeEvent }) =>
                                        handleKeyPress(nativeEvent.key, index)
                                    }
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {/* Verify Button */}
                        <Pressable
                            style={[
                                styles.submitButton,
                                (!isOtpComplete || isLoading) && styles.buttonDisabled,
                            ]}
                            onPress={handleVerify}
                            disabled={!isOtpComplete || isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </Text>
                        </Pressable>

                        {/* Resend Link */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive a code? </Text>
                            <Pressable onPress={handleResend} disabled={isResending}>
                                <Text style={[styles.resendLink, isResending && styles.resendDisabled]}>
                                    {isResending ? 'Sending...' : 'Resend'}
                                </Text>
                            </Pressable>
                        </View>
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
        padding: spacing[4],
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[4],
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
        fontSize: fontSize['3xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing[4],
        // Blue glow effect
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
    },
    description: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[1],
    },
    email: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[2],
        marginBottom: spacing[6],
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: radius.xl,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.input,
        textAlign: 'center',
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    otpInputFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.accent,
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    resendLink: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.primary,
    },
    resendDisabled: {
        opacity: 0.5,
    },
});
