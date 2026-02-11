import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile } = useAuth();

    const displayName = profile?.full_name || 'User';
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const memberSince = profile?.created_at
        ? format(new Date(profile.created_at), 'MMMM dd, yyyy')
        : 'Unknown';

    const dateOfBirth = profile?.date_of_birth
        ? format(new Date(profile.date_of_birth), 'MMMM dd, yyyy')
        : 'Not set';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color={colors.foreground} size={24} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Text style={styles.email}>{profile?.email || ''}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Details Card */}
                <View style={styles.card}>
                    <ProfileRow
                        icon={<User color={colors.primary} size={20} />}
                        label="Full Name"
                        value={displayName}
                    />
                    <View style={styles.divider} />
                    <ProfileRow
                        icon={<Mail color={colors.primary} size={20} />}
                        label="Email"
                        value={profile?.email || 'Not set'}
                    />
                    <View style={styles.divider} />
                    <ProfileRow
                        icon={<Phone color={colors.primary} size={20} />}
                        label="Phone"
                        value={profile?.phone || 'Not set'}
                    />
                    <View style={styles.divider} />
                    <ProfileRow
                        icon={<Calendar color={colors.primary} size={20} />}
                        label="Member Since"
                        value={memberSince}
                    />
                    <View style={styles.divider} />
                    <ProfileRow
                        icon={<Calendar color={colors.primary} size={20} />}
                        label="Date of Birth"
                        value={dateOfBirth}
                    />
                </View>

                {/* Edit Profile Button */}
                <Pressable
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Edit color={colors.primaryForeground} size={20} />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

interface ProfileRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const ProfileRow: React.FC<ProfileRowProps> = ({ icon, label, value }) => (
    <View style={styles.row}>
        <View style={styles.rowIconContainer}>{icon}</View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
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
    avatarSection: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        fontSize: fontSize['3xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.primaryForeground,
    },
    displayName: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing.xs,
    },
    email: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    rowIconContainer: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginBottom: 2,
    },
    rowValue: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    editButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
});
