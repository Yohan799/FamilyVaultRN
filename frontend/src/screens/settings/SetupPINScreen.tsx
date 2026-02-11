import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Lock,
    Delete,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { checkBiometricAvailability } from '@/lib/safeLocalAuth';
import { initializeBiometricLock } from '@/services/appLockService';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const SetupPINScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const currentPin = step === 'create' ? pin : confirmPin;

    const handleNumberPress = (num: string) => {
        if (currentPin.length < 6) {
            if (step === 'create') {
                setPin(prev => prev + num);
            } else {
                setConfirmPin(prev => prev + num);
            }
        }
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
    };

    const handleContinue = () => {
        if (pin.length === 6) {
            setStep('confirm');
        }
    };

    const handleConfirm = async () => {
        if (!user) return;

        if (confirmPin.length === 6) {
            if (pin === confirmPin) {
                setIsLoading(true);
                try {
                    // Save PIN logic here (already handled by savePin service in a real app, 
                    // but here we might need to call the service if it wasn't already)
                    // Assuming the previous implementation was a placeholder, we should really call savePin here
                    // But looking at the file, it just waits 500ms. I should probably call savePin.

                    // Let's fix the saving logic to be real
                    const { savePin } = require('@/services/appLockService');
                    await savePin(user.id, pin);

                    // Check for biometrics
                    const bioStatus = await checkBiometricAvailability();

                    if (bioStatus.isAvailable && bioStatus.biometryType) {
                        Alert.alert(
                            'Enable Biometrics',
                            `Would you like to use ${bioStatus.biometryType} to unlock the app?`,
                            [
                                {
                                    text: 'No, thanks',
                                    style: 'cancel',
                                    onPress: () => {
                                        Alert.alert('PIN Lock Enabled', 'Lock screen will show when you open the app');
                                        navigation.goBack();
                                    }
                                },
                                {
                                    text: 'Enable',
                                    onPress: async () => {
                                        try {
                                            await initializeBiometricLock(user.id);
                                            Alert.alert('Success', 'PIN and Biometric lock enabled');
                                            navigation.goBack();
                                        } catch (err) {
                                            Alert.alert('Error', 'Failed to enable biometrics');
                                            navigation.goBack();
                                        }
                                    }
                                }
                            ]
                        );
                    } else {
                        Alert.alert('PIN Lock Enabled', 'Lock screen will show when you open the app');
                        navigation.goBack();
                    }
                } catch (error: any) {
                    console.error('Error saving PIN:', error);
                    Alert.alert('Failed to Save PIN', error.message || 'An error occurred');
                } finally {
                    setIsLoading(false);
                }
            } else {
                Alert.alert("PINs Don't Match", 'Please try again');
                setConfirmPin('');
            }
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('create');
            setConfirmPin('');
        } else {
            navigation.goBack();
        }
    };

    // Render PIN dots
    const renderPinDots = () => {
        return (
            <View style={styles.pinDotsContainer}>
                {[...Array(6)].map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.pinDot,
                            idx < currentPin.length ? styles.pinDotFilled : styles.pinDotEmpty,
                        ]}
                    />
                ))}
            </View>
        );
    };

    // Render number pad
    const renderNumberPad = () => {
        const numbers = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
        ];

        return (
            <View style={styles.numberPad}>
                {numbers.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map((num, colIndex) => {
                            if (num === '') {
                                return <View key={colIndex} style={styles.numberButtonPlaceholder} />;
                            }

                            if (num === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={styles.numberButton}
                                        onPress={handleDelete}
                                        disabled={isLoading}
                                    >
                                        <Delete size={24} color={colors.foreground} />
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={styles.numberButton}
                                    onPress={() => handleNumberPress(num)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.numberText}>{num}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={handleBack}>
                        <ArrowLeft color={colors.foreground} size={20} />
                    </Pressable>
                    <Text style={styles.headerTitle}>
                        {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
                    </Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Lock Icon */}
                <View style={styles.lockIconContainer}>
                    <View style={styles.lockIcon}>
                        <Lock size={32} color={colors.primary} />
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionTitle}>
                        {step === 'create' ? 'Create a 6-digit PIN' : 'Confirm your PIN'}
                    </Text>
                    <Text style={styles.instructionSubtitle}>
                        {step === 'create'
                            ? "Enter a PIN you'll remember"
                            : 'Enter the same PIN again to confirm'}
                    </Text>
                </View>

                {/* PIN Dots */}
                {renderPinDots()}

                {/* Number Pad */}
                <View style={styles.numberPadContainer}>
                    {renderNumberPad()}
                </View>

                {/* Continue/Confirm Button */}
                <View style={styles.buttonContainer}>
                    {step === 'create' && pin.length === 6 && (
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                    )}

                    {step === 'confirm' && confirmPin.length === 6 && (
                        <TouchableOpacity
                            style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.primaryForeground} />
                            ) : (
                                <Text style={styles.continueButtonText}>Confirm PIN</Text>
                            )}
                        </TouchableOpacity>
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
        paddingHorizontal: spacing[4],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    lockIconContainer: {
        alignItems: 'center',
        paddingTop: spacing[4],
    },
    lockIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructions: {
        alignItems: 'center',
        marginTop: spacing[4],
    },
    instructionTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    instructionSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    pinDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[3],
        paddingVertical: spacing[5],
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    pinDotFilled: {
        backgroundColor: colors.primary,
    },
    pinDotEmpty: {
        backgroundColor: colors.muted,
    },
    numberPadContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing[4],
    },
    numberPad: {
        gap: spacing[4],
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[5],
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberButtonPlaceholder: {
        width: 72,
        height: 72,
    },
    numberText: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    buttonContainer: {
        paddingBottom: spacing[4],
    },
    continueButton: {
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    continueButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
