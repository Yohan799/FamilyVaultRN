import React from 'react';
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
import {
    User,
    KeyRound,
    Mail,
    Shield,
    Lock,
    Smartphone,
    Bell,
    HelpCircle,
    LogOut,
    Trash2,
    ChevronRight,
    Database,
    Clock,
    AlertTriangle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { MainStackParamList, MainTabParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList & MainTabParamList>;

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { signOut, profile } = useAuth();

    // Mock state for notifications toggle
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            // Navigation to auth flow is handled automatically by RootNavigator
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is irreversible. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { } }
            ]
        );
    };

    const displayName = profile?.full_name || 'User';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <Pressable
                    style={styles.profileCard}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileInitials}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileEmail}>{profile?.email}</Text>
                    </View>
                    <ChevronRight color={colors.mutedForeground} size={20} />
                </Pressable>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={<KeyRound color={colors.primary} size={20} />}
                            title="Change Password"
                            onPress={() => navigation.navigate('ChangePassword')}
                        />
                        <SettingItem
                            icon={<Mail color={colors.primary} size={20} />}
                            title="Email Preferences"
                            onPress={() => navigation.navigate('EmailPreferences')}
                        />
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={<Shield color={colors.primary} size={20} />}
                            title="Two-Factor Auth"
                            onPress={() => navigation.navigate('TwoFactorSetup')}
                        />
                        <SettingItem
                            icon={<Lock color={colors.primary} size={20} />}
                            title="App Lock"
                            onPress={() => navigation.navigate('SetupPIN')}
                        />
                        <SettingItem
                            icon={<Smartphone color={colors.primary} size={20} />}
                            title="Active Sessions"
                            onPress={() => navigation.navigate('ActiveSessions')}
                        />
                    </View>
                </View>

                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Settings</Text>
                    <View style={styles.sectionContent}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingIconContainer}>
                                <Bell color={colors.primary} size={20} />
                            </View>
                            <Text style={styles.settingTitle}>Push Notifications</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Emergency Access */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={<AlertTriangle color={colors.primary} size={20} />}
                            title="Emergency Access Portal"
                            onPress={() => navigation.navigate('EmergencyAccess')}
                        />
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={<HelpCircle color={colors.primary} size={20} />}
                            title="Help Center"
                            onPress={() => navigation.navigate('HelpCenter')}
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, styles.lastSection]}>
                    <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Danger Zone</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={<LogOut color={colors.destructive} size={20} />}
                            title="Sign Out"
                            titleColor={colors.destructive}
                            iconColor={colors.destructive}
                            onPress={handleSignOut}
                            hideChevron
                        />
                        <SettingItem
                            icon={<Trash2 color={colors.destructive} size={20} />}
                            title="Delete Account"
                            titleColor={colors.destructive}
                            iconColor={colors.destructive}
                            onPress={handleDeleteAccount}
                            hideChevron
                        />
                    </View>
                </View>

                <Text style={styles.versionText}>Version 1.0.0 (Build 124)</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    value?: string;
    onPress: () => void;
    titleColor?: string;
    iconColor?: string;
    hideChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    value,
    onPress,
    titleColor = colors.foreground,
    iconColor,
    hideChevron = false
}) => {
    // If specific iconColor is provided, we might need to clone/modify element, 
    // but usually the caller passes the icon with correct color.
    // Simplifying here assuming icon is passed correctly.

    return (
        <>
            <Pressable
                style={styles.settingItem}
                onPress={onPress}
            >
                <View style={[styles.settingIconContainer, iconColor ? { backgroundColor: iconColor + '15' } : null]}>
                    {icon}
                </View>
                <Text style={[styles.settingTitle, { color: titleColor }]}>{title}</Text>
                {value && <Text style={styles.settingValue}>{value}</Text>}
                {!hideChevron && <ChevronRight color={colors.mutedForeground} size={18} />}
            </Pressable>
            <View style={styles.divider} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
        backgroundColor: colors.background,
    },
    headerTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    scrollContent: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[8],
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: spacing[4],
        borderRadius: radius['2xl'],
        marginBottom: spacing[6],
        ...shadows.sm,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    profileInitials: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    section: {
        marginBottom: spacing[6],
    },
    lastSection: {
        marginBottom: spacing[4],
    },
    sectionTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.mutedForeground,
        marginBottom: spacing[2],
        marginLeft: spacing[2],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        overflow: 'hidden',
        ...shadows.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
    },
    settingIconContainer: {
        width: 36,
        height: 36,
        borderRadius: radius.lg,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    settingTitle: {
        flex: 1,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    settingValue: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginRight: spacing[2],
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 68, // Icon width + margins
    },
    versionText: {
        textAlign: 'center',
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: spacing[2],
        marginBottom: spacing[4],
    },
});
