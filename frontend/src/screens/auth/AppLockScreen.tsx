import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Fingerprint } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { useAppLock } from '@/contexts/AppLockContext';
import { verifyPinLocally } from '@/services/appLockService';

export const AppLockScreen: React.FC = () => {
    const { lockType, unlock, unlockWithPin } = useAppLock();
    const [pin, setPin] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    useEffect(() => {
        if (lockType === 'biometric') {
            handleBiometricUnlock();
        }
    }, [lockType]);

    const handleBiometricUnlock = async () => {
        setIsUnlocking(true);
        const success = await unlock();
        setIsUnlocking(false);
        if (!success && lockType === 'biometric') {
            // If biometric failed or cancelled, we stay on this screen.
            // User can tap button to retry.
        }
    };

    const handlePinSubmit = async (enteredPin: string) => {
        if (enteredPin.length < 6) return;

        setIsUnlocking(true);
        try {
            const isValid = await verifyPinLocally(enteredPin);
            if (isValid) {
                await unlockWithPin();
            } else {
                Alert.alert('Incorrect PIN', 'Please try again.');
                setPin('');
            }
        } catch (e) {
            Alert.alert('Error', 'An error occurred while verifying PIN.');
        } finally {
            setIsUnlocking(false);
        }
    };

    // Numpad Component with proper row-based layout
    const Numpad = () => {
        const numbers = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
        ];

        return (
            <View style={styles.numpadContainer}>
                {numbers.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numpadRow}>
                        {row.map((num, colIndex) => {
                            if (num === '') {
                                return <View key={colIndex} style={styles.numpadButtonPlaceholder} />;
                            }

                            if (num === 'delete') {
                                return (
                                    <Pressable
                                        key={colIndex}
                                        style={({ pressed }) => [
                                            styles.numpadButton,
                                            pressed && styles.numpadButtonPressed
                                        ]}
                                        onPress={() => setPin(pin.slice(0, -1))}
                                    >
                                        <Text style={styles.numpadKey}>⌫</Text>
                                    </Pressable>
                                );
                            }

                            return (
                                <Pressable
                                    key={colIndex}
                                    style={({ pressed }) => [
                                        styles.numpadButton,
                                        pressed && styles.numpadButtonPressed
                                    ]}
                                    onPress={() => {
                                        if (pin.length < 6) {
                                            const newPin = pin + num;
                                            setPin(newPin);
                                            if (newPin.length === 6) {
                                                handlePinSubmit(newPin);
                                            }
                                        }
                                    }}
                                >
                                    <Text style={styles.numpadKey}>{num}</Text>
                                </Pressable>
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
                <View style={styles.iconContainer}>
                    <Lock color={colors.primary} size={48} />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                    {lockType === 'biometric'
                        ? 'Unlock with your fingerprint or face ID'
                        : 'Enter your PIN to continue'}
                </Text>

                {lockType === 'pin' && (
                    <View style={styles.pinContainer}>
                        <View style={styles.dotsContainer}>
                            {[...Array(6)].map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i < pin.length && styles.dotFilled
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {lockType === 'biometric' && (
                    <Pressable
                        style={styles.biometricButton}
                        onPress={handleBiometricUnlock}
                    >
                        <Fingerprint color={colors.white} size={24} />
                        <Text style={styles.biometricButtonText}>Unlock</Text>
                    </Pressable>
                )}
            </View>

            {lockType === 'pin' && (
                <View style={styles.numpadSection}>
                    <Numpad />
                </View>
            )}
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
        paddingHorizontal: spacing[6],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
    },
    title: {
        fontSize: 24,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: fontSize.base.size,
        color: '#7D7490',
        textAlign: 'center',
        marginBottom: spacing[8],
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        borderRadius: radius.full,
        gap: spacing[2],
    },
    biometricButtonText: {
        color: colors.white,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.medium,
    },
    pinContainer: {
        marginBottom: spacing[8],
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: spacing[4],
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    dotFilled: {
        backgroundColor: colors.primary,
    },
    numpadSection: {
        paddingBottom: spacing[8],
        paddingHorizontal: spacing[6],
    },
    numpadContainer: {
        gap: spacing[4],
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[5],
    },
    numpadButton: {
        width: 72,
        height: 72,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    numpadButtonPressed: {
        backgroundColor: colors.accent,
        borderColor: colors.primary,
    },
    numpadButtonPlaceholder: {
        width: 72,
        height: 72,
    },
    numpadKey: {
        fontSize: 28,
        color: colors.foreground,
        fontWeight: '600',
    },
});
