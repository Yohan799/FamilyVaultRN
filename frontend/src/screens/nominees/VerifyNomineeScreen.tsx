import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type VerifyNomineeRouteProp = RouteProp<MainStackParamList, 'VerifyNominee'>;

type VerificationStatus = 'verifying' | 'success' | 'error';

export const VerifyNomineeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<VerifyNomineeRouteProp>();

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = route.params?.token;

        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification link');
            return;
        }

        verifyToken(token);
    }, [route.params]);

    const verifyToken = async (token: string) => {
        try {
            // Fetch the verification token
            const { data: tokenData, error: tokenError } = await supabase
                .from('verification_tokens')
                .select('*, nominees(*)')
                .eq('token', token)
                .is('used_at', null)
                .single();

            if (tokenError || !tokenData) {
                throw new Error('Invalid or expired verification link');
            }

            // Check if token is expired
            const expiresAt = new Date(tokenData.expires_at);
            if (expiresAt < new Date()) {
                throw new Error('This verification link has expired');
            }

            // Mark token as used
            const { error: updateTokenError } = await supabase
                .from('verification_tokens')
                .update({ used_at: new Date().toISOString() })
                .eq('id', tokenData.id);

            if (updateTokenError) {
                throw new Error('Verification failed. Please try again.');
            }

            // Update nominee status to verified
            const { error: nomineeError } = await supabase
                .from('nominees')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                })
                .eq('id', tokenData.nominee_id);

            if (nomineeError) {
                throw new Error('Failed to verify nominee status');
            }

            setStatus('success');
            setMessage(`You have been verified as a nominee for ${tokenData.nominees?.full_name || 'the user'}'s Family Vault.`);

            Alert.alert(
                'Verification Successful!',
                'You have been verified as a trusted nominee.',
            );
        } catch (error: any) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Verification failed. Please try again.');
        }
    };

    const handleClose = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.card}>
                    {status === 'verifying' && (
                        <>
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                                style={styles.icon}
                            />
                            <Text style={styles.title}>Verifying...</Text>
                            <Text style={styles.description}>
                                Please wait while we verify your nominee status
                            </Text>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <View style={styles.successIcon}>
                                <CheckCircle2 size={64} color="#16A34A" />
                            </View>
                            <Text style={[styles.title, styles.successTitle]}>
                                Verification Successful!
                            </Text>
                            <Text style={styles.description}>{message}</Text>
                            <Text style={styles.subDescription}>
                                You will now receive notifications about your nominee responsibilities and will have access when needed.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleClose}
                            >
                                <Text style={styles.primaryButtonText}>Close</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <View style={styles.errorIcon}>
                                <XCircle size={64} color={colors.destructive} />
                            </View>
                            <Text style={[styles.title, styles.errorTitle]}>
                                Verification Failed
                            </Text>
                            <Text style={styles.description}>{message}</Text>
                            <TouchableOpacity
                                style={styles.outlineButton}
                                onPress={handleClose}
                            >
                                <Text style={styles.outlineButtonText}>Close</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[6],
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    icon: {
        marginBottom: spacing[4],
    },
    successIcon: {
        marginBottom: spacing[4],
    },
    errorIcon: {
        marginBottom: spacing[4],
    },
    title: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    successTitle: {
        color: '#16A34A',
    },
    errorTitle: {
        color: colors.destructive,
    },
    description: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[2],
        paddingHorizontal: spacing[2],
    },
    subDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[6],
        paddingHorizontal: spacing[2],
    },
    primaryButton: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    outlineButton: {
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    outlineButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
});
