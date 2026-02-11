import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';

import { GoogleLogo } from '@/components/ui/GoogleLogo';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export const SignInScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { signIn, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignIn = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            Alert.alert(
                'Sign In Failed',
                error.message || 'Please check your credentials and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error: any) {
            // Error already logged/handled in context, but we can show alert if needed
            if (error.message !== 'Google Sign-In in progress' && error.message !== 'User cancelled Google Sign-In') {
                Alert.alert('Google Sign-In Failed', error.message);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* White Card Container */}
                    <View style={styles.card}>
                        {/* Title */}
                        <Text style={styles.screenTitle}>Sign In</Text>

                        {/* Icon Header */}
                        <View style={styles.iconHeader}>
                            <View style={styles.iconContainer}>
                                <Shield color="#3B82F6" size={32} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.tagline}>Secure Your Family's Legacy</Text>
                        </View>

                        {/* Email Input */}
                        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                            <Mail color="#9B8FB0" size={20} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Email"
                                placeholderTextColor="#9B8FB0"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Password Input */}
                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                            <Lock color="#9B8FB0" size={20} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Password"
                                placeholderTextColor="#9B8FB0"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff color="#9B8FB0" size={20} />
                                ) : (
                                    <Eye color="#9B8FB0" size={20} />
                                )}
                            </Pressable>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                        {/* Forgot Password */}
                        <Pressable
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </Pressable>

                        {/* Sign In Button */}
                        <Pressable
                            onPress={handleSignIn}
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            disabled={isLoading}
                        >
                            <Text style={styles.signInButtonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Button */}
                        <Pressable
                            onPress={handleGoogleSignIn}
                            style={styles.googleButton}
                        >
                            <GoogleLogo />
                            <Text style={styles.googleButtonText}>Sign in with Google</Text>
                        </Pressable>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('SignUp')}>
                                <Text style={styles.createAccountLink}>Create Account</Text>
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
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[6],
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[6],
        ...shadows.md,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    tagline: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3F7',
        borderRadius: radius.lg,
        paddingHorizontal: spacing[4],
        marginBottom: spacing[3],
        minHeight: 52,
    },
    inputError: {
        borderWidth: 1,
        borderColor: colors.destructive,
    },
    textInput: {
        flex: 1,
        marginLeft: spacing[3],
        fontSize: fontSize.base.size,
        color: colors.foreground,
        paddingVertical: spacing[3.5],
    },
    errorText: {
        fontSize: fontSize.xs.size,
        color: colors.destructive,
        marginTop: -spacing[2],
        marginBottom: spacing[2],
        marginLeft: spacing[1],
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing[4],
    },
    forgotPasswordText: {
        fontSize: fontSize.sm.size,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    signInButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    signInButtonText: {
        color: colors.white,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E3F0',
    },
    dividerText: {
        paddingHorizontal: spacing[4],
        fontSize: fontSize.sm.size,
        color: '#9B8FB0',
        fontWeight: fontWeight.medium,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#E8E3F0',
        borderRadius: radius.lg,
        paddingVertical: spacing[3],
        marginBottom: spacing[5],
        gap: spacing[2],
    },
    googleButtonText: {
        fontSize: fontSize.base.size,
        color: colors.foreground,
        fontWeight: fontWeight.medium,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
    },
    createAccountLink: {
        fontSize: fontSize.sm.size,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
});
