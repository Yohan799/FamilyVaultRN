import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type RoutePropType = RouteProp<AuthStackParamList, 'ResetPassword'>;

// Password validation
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return { valid: errors.length === 0, errors };
};

export const ResetPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RoutePropType>();
    const email = route.params?.email || '';
    const resetToken = route.params?.resetToken || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if missing params
    useEffect(() => {
        if (!email || !resetToken) {
            navigation.navigate('ForgotPassword');
        }
    }, [email, resetToken, navigation]);

    const handleSubmit = async () => {
        // Validate passwords match
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.valid) {
            Alert.alert('Weak Password', `Password must have:\n• ${validation.errors.join('\n• ')}`);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
                body: {
                    email,
                    resetToken,
                    newPassword: password,
                },
            });

            if (error || !data?.success) {
                throw new Error(data?.error || 'Failed to reset password');
            }

            Alert.alert(
                'Password Reset',
                'Your password has been successfully reset. Please sign in with your new password.',
                [
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn'),
                    },
                ]
            );
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to reset password';
            Alert.alert(
                'Error',
                errorMessage.includes('token')
                    ? 'Your session has expired. Please request a new reset code.'
                    : errorMessage
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!email || !resetToken) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        {/* Title */}
                        <Text style={styles.title}>Reset Password</Text>

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Shield color={colors.primary} size={40} strokeWidth={2.5} />
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            Enter your new password below
                        </Text>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Lock color={colors.mutedForeground} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="New Password"
                                placeholderTextColor={colors.mutedForeground}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <Pressable
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff color={colors.mutedForeground} size={20} />
                                ) : (
                                    <Eye color={colors.mutedForeground} size={20} />
                                )}
                            </Pressable>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Lock color={colors.mutedForeground} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm New Password"
                                placeholderTextColor={colors.mutedForeground}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                            />
                            <Pressable
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff color={colors.mutedForeground} size={20} />
                                ) : (
                                    <Eye color={colors.mutedForeground} size={20} />
                                )}
                            </Pressable>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsBox}>
                            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                            <Text style={styles.requirementItem}>• At least 8 characters</Text>
                            <Text style={styles.requirementItem}>• One uppercase letter (A-Z)</Text>
                            <Text style={styles.requirementItem}>• One lowercase letter (a-z)</Text>
                            <Text style={styles.requirementItem}>• One number (0-9)</Text>
                            <Text style={styles.requirementItem}>• One special character (!@#$%...)</Text>
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </Text>
                        </Pressable>

                        {/* Sign In Link */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Remember your password? </Text>
                            <Pressable onPress={() => navigation.navigate('SignIn')}>
                                <Text style={styles.signInLink}>Sign In</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
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
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing[4],
    },
    description: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.input,
        borderRadius: radius['2xl'],
        marginBottom: spacing[3],
    },
    inputIcon: {
        marginLeft: spacing[4],
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[4],
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    eyeButton: {
        padding: spacing[4],
    },
    requirementsBox: {
        backgroundColor: colors.accent,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius['2xl'],
        padding: spacing[3],
        marginBottom: spacing[4],
    },
    requirementsTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    requirementItem: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginBottom: spacing[1],
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
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signInText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    signInLink: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.primary,
    },
});
