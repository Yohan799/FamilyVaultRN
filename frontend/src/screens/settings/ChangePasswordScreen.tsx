import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ChangePasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSave = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (formData.newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            // Verify current password
            if (user?.email) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: formData.currentPassword,
                });

                if (signInError) {
                    Alert.alert('Error', 'Current password is incorrect');
                    setIsLoading(false);
                    return;
                }
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword,
            });

            if (error) throw error;

            Alert.alert('Success', 'Password updated successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
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
                <Text style={styles.headerTitle}>Change Password</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={formData.currentPassword}
                            onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                            placeholder="Enter current password"
                            placeholderTextColor={colors.mutedForeground}
                            secureTextEntry={!showCurrentPassword}
                        />
                        <Pressable
                            style={styles.eyeButton}
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? (
                                <EyeOff color={colors.mutedForeground} size={20} />
                            ) : (
                                <Eye color={colors.mutedForeground} size={20} />
                            )}
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={formData.newPassword}
                            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.mutedForeground}
                            secureTextEntry={!showNewPassword}
                        />
                        <Pressable
                            style={styles.eyeButton}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? (
                                <EyeOff color={colors.mutedForeground} size={20} />
                            ) : (
                                <Eye color={colors.mutedForeground} size={20} />
                            )}
                        </Pressable>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={formData.confirmPassword}
                            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.mutedForeground}
                            secureTextEntry={!showConfirmPassword}
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
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        Password must be at least 8 characters with 1 uppercase letter and 1 number.
                    </Text>
                </View>

                {/* Save Button */}
                <Pressable
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </Text>
                </Pressable>
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
    content: {
        flex: 1,
        padding: spacing.md,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    eyeButton: {
        padding: spacing.md,
    },
    infoBox: {
        backgroundColor: colors.primaryLight,
        borderRadius: radius.xl,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    infoText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    saveButton: {
        backgroundColor: colors.primaryLight,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primary,
    },
});
