import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Star, Plus, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const EmailPreferencesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile, updateProfile } = useAuth();
    const [emails, setEmails] = useState<string[]>([]);
    const [primaryEmail, setPrimaryEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            const primary = profile.email || '';
            const additional = (profile.additional_emails as string[]) || [];
            setPrimaryEmail(primary);
            setEmails([primary, ...additional]);
            setIsLoading(false);
        }
    }, [profile]);

    const handleAddEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        if (emails.includes(newEmail)) {
            Alert.alert('Email Exists', 'This email is already added');
            return;
        }

        const newEmails = [...emails, newEmail];
        const additionalEmails = newEmails.filter(e => e !== primaryEmail);

        const { error } = await supabase
            .from('profiles')
            .update({ additional_emails: additionalEmails })
            .eq('id', profile?.id || '');

        if (error) {
            Alert.alert('Error', error.message);
            return;
        }

        setEmails(newEmails);
        setNewEmail('');
        setIsAdding(false);
        await updateProfile({ additional_emails: additionalEmails });
        Alert.alert('Success', `${newEmail} has been added`);
    };

    const handleDeleteEmail = async (index: number) => {
        const emailToDelete = emails[index];

        if (emails.length === 1) {
            Alert.alert('Cannot Delete', 'You must have at least one email address');
            return;
        }

        Alert.alert(
            'Delete Email',
            `Are you sure you want to remove ${emailToDelete}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const newEmails = emails.filter((_, i) => i !== index);
                        const additionalEmails = newEmails.filter(e => e !== primaryEmail);

                        const { error } = await supabase
                            .from('profiles')
                            .update({ additional_emails: additionalEmails })
                            .eq('id', profile?.id || '');

                        if (error) {
                            Alert.alert('Error', error.message);
                            return;
                        }

                        setEmails(newEmails);
                        await updateProfile({ additional_emails: additionalEmails });
                        Alert.alert('Success', 'Email removed');
                    },
                },
            ]
        );
    };

    const handleSetPrimary = async (email: string) => {
        if (email === primaryEmail) {
            return;
        }

        Alert.alert(
            'Set as Primary',
            `Make ${email} your primary email?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Set Primary',
                    onPress: async () => {
                        const newAdditionalEmails = emails.filter(e => e !== email && e !== primaryEmail);
                        newAdditionalEmails.push(primaryEmail);

                        const { error } = await supabase
                            .from('profiles')
                            .update({
                                email: email,
                                additional_emails: newAdditionalEmails,
                            })
                            .eq('id', profile?.id || '');

                        if (error) {
                            Alert.alert('Error', error.message);
                            return;
                        }

                        setPrimaryEmail(email);
                        setEmails([email, ...newAdditionalEmails]);
                        await updateProfile({ email, additional_emails: newAdditionalEmails });
                        Alert.alert('Success', `${email} is now your primary email`);
                    },
                },
            ]
        );
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
                <Text style={styles.headerTitle}>Email Preferences</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>
                    Manage your email addresses. Tap the star to set an email as primary.
                </Text>

                {/* Email List */}
                <View style={styles.emailList}>
                    {emails.map((email, index) => (
                        <View key={index} style={styles.emailRow}>
                            <Pressable
                                style={styles.starButton}
                                onPress={() => handleSetPrimary(email)}
                            >
                                <Star
                                    color={email === primaryEmail ? colors.primary : colors.mutedForeground}
                                    fill={email === primaryEmail ? colors.primary : 'transparent'}
                                    size={24}
                                />
                            </Pressable>
                            <View style={styles.emailInfo}>
                                <Text style={styles.emailText}>{email}</Text>
                                <Text style={styles.emailLabel}>
                                    {email === primaryEmail ? 'Primary email' : 'Secondary email'}
                                </Text>
                            </View>
                            <Pressable
                                style={styles.deleteButton}
                                onPress={() => handleDeleteEmail(index)}
                            >
                                <Trash2 color={colors.destructive} size={20} />
                            </Pressable>
                        </View>
                    ))}
                </View>

                {/* Add Email */}
                {isAdding ? (
                    <View style={styles.addEmailCard}>
                        <TextInput
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="Enter new email"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus
                        />
                        <View style={styles.addEmailButtons}>
                            <Pressable style={styles.addButton} onPress={handleAddEmail}>
                                <Text style={styles.addButtonText}>Add Email</Text>
                            </Pressable>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => {
                                    setIsAdding(false);
                                    setNewEmail('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable
                        style={styles.addNewButton}
                        onPress={() => setIsAdding(true)}
                    >
                        <Plus color={colors.foreground} size={20} />
                        <Text style={styles.addNewButtonText}>Add New Email</Text>
                    </Pressable>
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
    content: {
        flex: 1,
        padding: spacing.md,
    },
    description: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginBottom: spacing.lg,
    },
    emailList: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        overflow: 'hidden',
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    starButton: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    emailInfo: {
        flex: 1,
    },
    emailText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: 2,
    },
    emailLabel: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    addEmailCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.md,
        marginTop: spacing.lg,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    addEmailButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    addButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    addNewButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
});
