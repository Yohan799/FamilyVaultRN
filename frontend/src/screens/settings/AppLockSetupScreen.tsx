import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Fingerprint, KeyRound } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { updateLockType, saveLocalLockPreference, clearLocalLockPreferences } from '@/services/appLockService';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const AppLockSetupScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);

    useEffect(() => {
        if (profile?.app_lock_type) {
            setBiometricEnabled(profile.app_lock_type === 'biometric');
            setPinEnabled(profile.app_lock_type === 'pin');
        }
    }, [profile]);

    const handleBiometricToggle = async (enabled: boolean) => {
        if (!user) return;

        if (enabled) {
            setIsLoading(true);
            try {
                await updateLockType(user.id, 'biometric');
                await saveLocalLockPreference('biometric');
                setBiometricEnabled(true);
                setPinEnabled(false);
                await refreshProfile?.();
                Alert.alert('Success', 'Biometric lock enabled');
            } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to enable biometric lock');
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(true);
            try {
                await updateLockType(user.id, null);
                await clearLocalLockPreferences();
                setBiometricEnabled(false);
                await refreshProfile?.();
                Alert.alert('Success', 'Biometric lock disabled');
            } catch (error: any) {
                Alert.alert('Error', error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePinToggle = async (enabled: boolean) => {
        if (!user) return;

        if (enabled) {
            // TODO: Navigate to PIN setup screen
            Alert.alert('Coming Soon', 'PIN setup will be available in a future update');
        } else {
            setIsLoading(true);
            try {
                await updateLockType(user.id, null);
                await clearLocalLockPreferences();
                setPinEnabled(false);
                await refreshProfile?.();
                Alert.alert('Success', 'PIN lock disabled');
            } catch (error: any) {
                Alert.alert('Error', error.message);
            } finally {
                setIsLoading(false);
            }
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
                    <Text style={styles.headerTitle}>App Lock</Text>
                    <Text style={styles.headerSubtitle}>Protect your app</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Biometric Lock */}
                <View style={styles.lockOption}>
                    <View style={styles.lockOptionLeft}>
                        <View style={styles.iconContainer}>
                            <Fingerprint color={colors.primary} size={24} />
                        </View>
                        <View style={styles.lockOptionContent}>
                            <Text style={styles.lockOptionTitle}>Biometric Lock</Text>
                            <Text style={styles.lockOptionDescription}>
                                Use fingerprint or face recognition
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={biometricEnabled}
                        onValueChange={handleBiometricToggle}
                        disabled={isLoading}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                    />
                </View>

                {/* PIN Lock */}
                <View style={styles.lockOption}>
                    <View style={styles.lockOptionLeft}>
                        <View style={styles.iconContainer}>
                            <KeyRound color={colors.primary} size={24} />
                        </View>
                        <View style={styles.lockOptionContent}>
                            <Text style={styles.lockOptionTitle}>PIN Lock</Text>
                            <Text style={styles.lockOptionDescription}>
                                Set a 6-digit PIN code
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={pinEnabled}
                        onValueChange={handlePinToggle}
                        disabled={isLoading}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                    />
                </View>

                {/* Info Box */}
                {(biometricEnabled || pinEnabled) && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            App lock is active. You'll need to authenticate each time you open the app.
                        </Text>
                    </View>
                )}
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
    lockOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    lockOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    lockOptionContent: {
        flex: 1,
    },
    lockOptionTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: 2,
    },
    lockOptionDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    infoBox: {
        backgroundColor: colors.primaryLight,
        borderRadius: radius.xl,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    infoText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.primary,
    },
});
