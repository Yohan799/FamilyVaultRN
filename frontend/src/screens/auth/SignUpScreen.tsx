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
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Shield, Eye, EyeOff, Mail, User, Lock, Check, X } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const TERMS_CONTENT = `Terms of Service

Last updated: February 2025

1. Acceptance of Terms
By accessing and using Family Vault, you accept and agree to be bound by the terms and conditions of this agreement.

2. Description of Service
Family Vault is a secure document storage and family legacy planning application. We provide cloud-based storage for your important documents, photos, and digital assets.

3. User Responsibilities
- You are responsible for maintaining the confidentiality of your account credentials
- You agree to provide accurate and complete information
- You are responsible for all activities that occur under your account

4. Privacy and Security
- We use industry-standard encryption to protect your data
- Your documents are stored securely and only accessible by you and your designated nominees
- We do not sell or share your personal data with third parties

5. Nominee System
- You may designate trusted individuals as nominees
- Nominees can access your vault under conditions you specify
- You are responsible for choosing appropriate nominees

6. Limitation of Liability
Family Vault is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our service.

7. Changes to Terms
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.

8. Contact
For questions about these terms, contact us at tech@unphuc.com.`;

const PRIVACY_CONTENT = `Privacy Policy

Last updated: February 2025

1. Information We Collect
- Account information (email, name, phone number)
- Documents and files you upload
- Usage data and analytics
- Device information for notifications

2. How We Use Your Information
- To provide and maintain the service
- To send you important notifications
- To improve our service
- To communicate with you about your account

3. Data Storage and Security
- Your data is encrypted at rest and in transit
- We use secure cloud infrastructure
- Regular security audits are performed
- Two-factor authentication is available

4. Data Sharing
We do not sell your personal data. We may share data only:
- With your explicit consent
- With your designated nominees
- When required by law

5. Your Rights
You have the right to:
- Access your personal data
- Delete your account and data
- Export your data
- Opt out of marketing communications

6. Cookies and Tracking
We use essential cookies for authentication. No third-party advertising cookies are used.

7. Children's Privacy
Our service is not intended for children under 13. We do not knowingly collect data from children.

8. Changes to This Policy
We will notify you of significant changes to this policy via email or in-app notification.

9. Contact Us
For privacy inquiries: tech@unphuc.com`;

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!acceptedTerms) {
            newErrors.terms = 'You must accept the Terms of Service and Privacy Policy';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Use Supabase's built-in OTP (uses Supabase's email server - no external SMTP needed)
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                    shouldCreateUser: true,
                    data: {
                        full_name: fullName,
                        pending_password: password, // We'll set password after verification
                    }
                }
            });

            if (error) throw error;

            // Navigate to OTP verification screen
            navigation.navigate('SignupOTP', {
                email: email.toLowerCase(),
                name: fullName,
                password
            });
        } catch (error: any) {
            Alert.alert(
                'Sign Up Failed',
                error.message || 'Please try again later.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        Alert.alert('Coming Soon', 'Google Sign-Up will be available shortly.');
    };

    const LegalModal = ({ visible, onClose, title, content }: {
        visible: boolean;
        onClose: () => void;
        title: string;
        content: string;
    }) => (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <X color={colors.foreground} size={24} />
                    </Pressable>
                </View>
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalText}>{content}</Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                    <Pressable onPress={onClose} style={styles.modalButton}>
                        <Text style={styles.modalButtonText}>I understand</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );

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
                        <Text style={styles.screenTitle}>Sign Up</Text>

                        {/* Icon Header */}
                        <View style={styles.iconHeader}>
                            <View style={styles.iconContainer}>
                                <Shield color="#3B82F6" size={32} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.tagline}>Create Your Family Vault</Text>
                        </View>

                        {/* Name Input */}
                        <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                            <User color="#9B8FB0" size={20} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Name"
                                placeholderTextColor="#9B8FB0"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>
                        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

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

                        {/* Confirm Password Input */}
                        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                            <Lock color="#9B8FB0" size={20} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Confirm Password"
                                placeholderTextColor="#9B8FB0"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                            />
                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? (
                                    <EyeOff color="#9B8FB0" size={20} />
                                ) : (
                                    <Eye color="#9B8FB0" size={20} />
                                )}
                            </Pressable>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                        {/* Terms and Privacy Checkbox */}
                        <View style={styles.termsContainer}>
                            <Pressable
                                style={[
                                    styles.checkbox,
                                    acceptedTerms && styles.checkboxChecked,
                                    errors.terms && styles.checkboxError,
                                ]}
                                onPress={() => setAcceptedTerms(!acceptedTerms)}
                            >
                                {acceptedTerms && <Check color={colors.white} size={14} strokeWidth={3} />}
                            </Pressable>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                                    Terms of Service
                                </Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>
                                    Privacy Policy
                                </Text>
                            </Text>
                        </View>
                        {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

                        {/* Sign Up Button */}
                        <Pressable
                            onPress={handleSignUp}
                            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                            disabled={isLoading}
                        >
                            <Text style={styles.signUpButtonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
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
                            onPress={handleGoogleSignUp}
                            style={styles.googleButton}
                        >
                            <GoogleLogo />
                            <Text style={styles.googleButtonText}>Sign up with Google</Text>
                        </Pressable>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('SignIn')}>
                                <Text style={styles.signInLink}>Sign In</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Legal Modals */}
            <LegalModal
                visible={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title="Terms of Service"
                content={TERMS_CONTENT}
            />
            <LegalModal
                visible={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                title="Privacy Policy"
                content={PRIVACY_CONTENT}
            />
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
        marginBottom: spacing[3],
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing[3],
        gap: spacing[3],
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: '#D1C8E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkboxError: {
        borderColor: colors.destructive,
    },
    termsText: {
        flex: 1,
        fontSize: fontSize.sm.size,
        color: '#7D7490',
        lineHeight: 20,
    },
    termsLink: {
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    signUpButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginTop: spacing[1],
        marginBottom: spacing[4],
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    signUpButtonText: {
        color: colors.white,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
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
        marginBottom: spacing[4],
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
    signInLink: {
        fontSize: fontSize.sm.size,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: colors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: '#E8E3F0',
    },
    modalTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    closeButton: {
        padding: spacing[2],
    },
    modalContent: {
        flex: 1,
        padding: spacing[4],
    },
    modalText: {
        fontSize: fontSize.sm.size,
        color: colors.foreground,
        lineHeight: 22,
    },
    modalFooter: {
        padding: spacing[4],
        borderTopWidth: 1,
        borderTopColor: '#E8E3F0',
    },
    modalButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    modalButtonText: {
        color: colors.white,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
    },
});
