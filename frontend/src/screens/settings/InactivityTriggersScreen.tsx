import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Shield,
    Clock,
    Mail,
    MessageSquare,
    Info,
    Minus,
    Plus,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface InactivitySettings {
    isActive: boolean;
    inactiveDays: number;
    customMessage: string;
    emailEnabled: boolean;
    smsEnabled: boolean;
}

export const InactivityTriggersScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [settings, setSettings] = useState<InactivitySettings>({
        isActive: false,
        inactiveDays: 7,
        customMessage: '',
        emailEnabled: true,
        smsEnabled: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [daysSinceActivity, setDaysSinceActivity] = useState(0);

    // Load settings
    const loadSettings = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('inactivity_triggers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading settings:', error);
                return;
            }

            if (data) {
                setSettings({
                    isActive: data.is_active ?? false,
                    inactiveDays: data.inactive_days_threshold ?? 7,
                    customMessage: data.custom_message ?? '',
                    emailEnabled: data.email_enabled ?? true,
                    smsEnabled: data.sms_enabled ?? false,
                });

                // Calculate days since activity
                if (data.last_activity_at) {
                    const lastActivity = new Date(data.last_activity_at);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    setDaysSinceActivity(diffDays);
                }
            }
        } catch (error) {
            console.error('Error in loadSettings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Handle save
    const handleSave = async () => {
        if (!user) {
            Alert.alert('Error', 'Please sign in');
            return;
        }

        if (settings.inactiveDays < 1 || settings.inactiveDays > 365) {
            Alert.alert('Error', 'Days threshold must be between 1 and 365');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.from('inactivity_triggers').upsert(
                {
                    user_id: user.id,
                    is_active: settings.isActive,
                    inactive_days_threshold: settings.inactiveDays,
                    custom_message: settings.customMessage || null,
                    email_enabled: settings.emailEnabled,
                    sms_enabled: settings.smsEnabled,
                    last_activity_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );

            if (error) throw error;

            Alert.alert('Success', 'Settings saved successfully');
            setDaysSinceActivity(0);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', error.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Update settings helper
    const updateSetting = <K extends keyof InactivitySettings>(key: K, value: InactivitySettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ArrowLeft color={colors.foreground} size={20} />
                        </Pressable>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Inactivity Triggers</Text>
                            <Text style={styles.headerSubtitle}>Configure account monitoring</Text>
                        </View>
                        <View style={{ width: 36 }} />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Status Card */}
                    <View style={styles.statusCard}>
                        <View style={styles.statusContent}>
                            <View style={styles.statusIcon}>
                                <Shield size={24} color={colors.primary} />
                            </View>
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusTitle}>
                                    Trigger Status: {settings.isActive ? 'Active' : 'Inactive'}
                                </Text>
                                <Text style={styles.statusText}>
                                    {settings.isActive
                                        ? `Your account is being monitored. Alert triggers after ${settings.inactiveDays} days of inactivity.`
                                        : 'Inactivity monitoring is currently disabled.'}
                                </Text>

                                {settings.isActive && (
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityText}>
                                            Last activity:{' '}
                                            {daysSinceActivity === 0
                                                ? 'Today'
                                                : `${daysSinceActivity} day${daysSinceActivity > 1 ? 's' : ''} ago`}
                                        </Text>
                                        {daysSinceActivity > 0 && (
                                            <Text style={styles.activityHint}>
                                                {daysSinceActivity >= settings.inactiveDays
                                                    ? 'Emergency access may be activated'
                                                    : `${settings.inactiveDays - daysSinceActivity} days until alert`}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Settings Card */}
                    <View style={styles.settingsCard}>
                        <Text style={styles.cardTitle}>Trigger Settings</Text>
                        <Text style={styles.cardDescription}>Configure how your account is monitored</Text>

                        {/* Enable Monitoring */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Enable Monitoring</Text>
                                <Text style={styles.settingHint}>Activate inactivity tracking</Text>
                            </View>
                            <Switch
                                value={settings.isActive}
                                onValueChange={value => updateSetting('isActive', value)}
                                trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                                thumbColor={settings.isActive ? colors.primary : '#f4f3f4'}
                            />
                        </View>

                        {/* Days Threshold */}
                        <View style={styles.settingGroup}>
                            <Text style={styles.settingLabel}>Inactive Days Threshold</Text>
                            <View style={styles.daysControl}>
                                <Pressable
                                    style={[
                                        styles.daysButton,
                                        (!settings.isActive || settings.inactiveDays <= 1) &&
                                        styles.daysButtonDisabled,
                                    ]}
                                    onPress={() => {
                                        if (settings.isActive && settings.inactiveDays > 1) {
                                            updateSetting('inactiveDays', settings.inactiveDays - 1);
                                        }
                                    }}
                                    disabled={!settings.isActive || settings.inactiveDays <= 1}
                                >
                                    <Minus size={18} color={colors.foreground} />
                                </Pressable>
                                <TextInput
                                    style={[styles.daysInput, !settings.isActive && styles.inputDisabled]}
                                    value={settings.inactiveDays.toString()}
                                    onChangeText={text => {
                                        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                                        if (!isNaN(num) && num <= 365) {
                                            updateSetting('inactiveDays', num);
                                        } else if (text === '') {
                                            updateSetting('inactiveDays', 0);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (settings.inactiveDays < 1) {
                                            updateSetting('inactiveDays', 1);
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    editable={settings.isActive}
                                />
                                <Pressable
                                    style={[
                                        styles.daysButton,
                                        (!settings.isActive || settings.inactiveDays >= 365) &&
                                        styles.daysButtonDisabled,
                                    ]}
                                    onPress={() => {
                                        if (settings.isActive && settings.inactiveDays < 365) {
                                            updateSetting('inactiveDays', settings.inactiveDays + 1);
                                        }
                                    }}
                                    disabled={!settings.isActive || settings.inactiveDays >= 365}
                                >
                                    <Plus size={18} color={colors.foreground} />
                                </Pressable>
                            </View>
                            <Text style={styles.settingHint}>
                                Number of days of inactivity before triggering an alert (1-365)
                            </Text>
                        </View>

                        {/* Custom Message */}
                        <View style={styles.settingGroup}>
                            <Text style={styles.settingLabel}>Custom Alert Message</Text>
                            <TextInput
                                style={[styles.textArea, !settings.isActive && styles.inputDisabled]}
                                placeholder="Enter a custom message for your nominees..."
                                placeholderTextColor={colors.mutedForeground}
                                value={settings.customMessage}
                                onChangeText={text => updateSetting('customMessage', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={settings.isActive}
                            />
                        </View>

                        {/* Notification Methods */}
                        <View style={styles.settingGroup}>
                            <Text style={styles.settingLabel}>Notification Methods</Text>

                            {/* Email */}
                            <View style={styles.notifyRow}>
                                <View style={styles.notifyInfo}>
                                    <Mail size={18} color={colors.mutedForeground} />
                                    <View>
                                        <Text style={styles.notifyLabel}>Email Notifications</Text>
                                        <Text style={styles.notifyHint}>Send alerts via email</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.emailEnabled}
                                    onValueChange={value => updateSetting('emailEnabled', value)}
                                    trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                                    thumbColor={settings.emailEnabled ? colors.primary : '#f4f3f4'}
                                    disabled={!settings.isActive}
                                />
                            </View>

                            {/* SMS */}
                            <View style={styles.notifyRow}>
                                <View style={styles.notifyInfo}>
                                    <MessageSquare size={18} color={colors.mutedForeground} />
                                    <View>
                                        <Text style={styles.notifyLabel}>SMS Notifications</Text>
                                        <Text style={styles.notifyHint}>Send alerts via SMS</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.smsEnabled}
                                    onValueChange={value => updateSetting('smsEnabled', value)}
                                    trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                                    thumbColor={settings.smsEnabled ? colors.primary : '#f4f3f4'}
                                    disabled={!settings.isActive}
                                />
                            </View>
                        </View>

                        {/* Save Button */}
                        <Pressable
                            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* How It Works Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Shield size={20} color={colors.primary} />
                            <Text style={styles.infoTitle}>How It Works</Text>
                        </View>

                        <View style={styles.stepList}>
                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>1</Text>
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Activity Tracking</Text>
                                    <Text style={styles.stepText}>
                                        We track your last login and activity in the app
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>2</Text>
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Inactivity Detection</Text>
                                    <Text style={styles.stepText}>
                                        If you're inactive for the set number of days, we send alerts
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>3</Text>
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Nominee Access</Text>
                                    <Text style={styles.stepText}>
                                        Your verified nominees can request emergency access
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Important Note */}
                    <View style={styles.noteCard}>
                        <Info size={20} color={colors.mutedForeground} />
                        <View style={styles.noteContent}>
                            <Text style={styles.noteTitle}>Important Note</Text>
                            <Text style={styles.noteText}>
                                This feature is designed to ensure your loved ones can access important
                                information if something happens to you. Make sure to add and verify
                                nominees in the Nominee Center.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing[6],
    },
    header: {
        backgroundColor: `${colors.primary}10`,
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
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
        padding: spacing[4],
        gap: spacing[4],
    },
    statusCard: {
        backgroundColor: `${colors.primary}05`,
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
        borderRadius: radius['2xl'],
        padding: spacing[4],
    },
    statusContent: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    statusText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    activityInfo: {
        marginTop: spacing[3],
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        padding: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    activityHint: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    settingsCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
    },
    cardTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    cardDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginBottom: spacing[4],
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingInfo: {
        flex: 1,
    },
    settingGroup: {
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingLabel: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    settingHint: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    daysControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginTop: spacing[2],
    },
    daysButton: {
        width: 40,
        height: 40,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    daysButtonDisabled: {
        opacity: 0.5,
    },
    daysInput: {
        flex: 1,
        height: 40,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        textAlign: 'center',
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    inputDisabled: {
        opacity: 0.5,
    },
    textArea: {
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3],
        fontSize: fontSize.md.size,
        color: colors.foreground,
        minHeight: 100,
        marginTop: spacing[2],
    },
    notifyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
    },
    notifyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        flex: 1,
    },
    notifyLabel: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    notifyHint: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginTop: spacing[4],
    },
    saveButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    infoTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    stepList: {
        gap: spacing[4],
    },
    step: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    stepText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: colors.muted,
        borderRadius: radius.lg,
        padding: spacing[4],
        gap: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
    },
    noteContent: {
        flex: 1,
    },
    noteTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    noteText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
});
