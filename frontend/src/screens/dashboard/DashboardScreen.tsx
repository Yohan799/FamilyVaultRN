import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Switch,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    FileText,
    Users,
    Clock,
    Bell,
    ChevronRight,
    Shield,
    UserPlus,
    Vault,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { updateInactivityTrigger } from '@/services/dashboardService';
import { colors, spacing, fontSize, fontWeight, shadows, radius } from '@/theme';
import { MainTabParamList, MainStackParamList } from '@/navigation/RootNavigator';
import { FeatureTour } from '@/components/FeatureTour';
import { storageHelpers } from '@/lib/storage';
import Svg, { Circle } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<MainTabParamList & MainStackParamList>;

// Circular Progress Component
interface CircularProgressProps {
    progress: number; // 0-100
    size: number;
    strokeWidth: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size, strokeWidth }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <Text style={styles.scoreValue}>{progress}</Text>
        </View>
    );
};

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, profile } = useAuth();
    const { stats, readinessScore, isLoading, refetch } = useDashboardData();
    const [triggerUpdating, setTriggerUpdating] = useState(false);
    const [showTour, setShowTour] = useState(false);

    React.useEffect(() => {
        // Check if tour should be shown
        const hasSeenTour = storageHelpers.getHasSeenFeatureTour();
        if (!hasSeenTour) {
            // Small delay to ensure smooth entry after login
            setTimeout(() => setShowTour(true), 500);
        }
    }, []);

    const handleTourClose = () => {
        setShowTour(false);
        storageHelpers.setHasSeenFeatureTour(true);
    };

    const firstName = profile?.full_name?.split(' ')[0] || 'User';

    const handleTriggerToggle = async (value: boolean) => {
        if (!user?.id || triggerUpdating) return;

        setTriggerUpdating(true);
        try {
            await updateInactivityTrigger(user.id, value);
            await refetch();
        } catch (error) {
            console.error('Error updating trigger:', error);
        } finally {
            setTriggerUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeLabel}>Welcome,</Text>
                    <Text style={styles.userName}>{firstName}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Bell color={colors.foreground} size={22} />
                    </Pressable>
                    <Pressable
                        style={styles.avatar}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.avatarText}>
                            {firstName.charAt(0).toUpperCase()}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Main Content - ScrollView for smaller screens */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Security Score Card - Centered */}
                <View style={styles.securityScoreCard}>
                    <CircularProgress progress={readinessScore} size={80} strokeWidth={6} />
                    <Text style={styles.securityScoreLabel}>Security Score</Text>
                </View>

                {/* Stats Grid 2x2 */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <FileText color={colors.primary} size={22} strokeWidth={1.5} />
                            <Text style={styles.statLabel}>{stats.documents} Docs</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Users color={colors.primary} size={22} strokeWidth={1.5} />
                            <Text style={styles.statLabel}>{stats.nominees} Nominees</Text>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Clock color={colors.primary} size={22} strokeWidth={1.5} />
                            <Text style={styles.statLabel}>{stats.timeCapsules} Capsules</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.triggerLabel}>Trigger</Text>
                            <Switch
                                value={stats.inactivityTriggerActive}
                                onValueChange={handleTriggerToggle}
                                trackColor={{ false: '#D4CDE6', true: colors.primary }}
                                thumbColor={colors.white}
                                style={styles.triggerSwitch}
                                disabled={triggerUpdating}
                            />
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                {/* Digital Vault */}
                <Pressable
                    style={styles.actionItem}
                    onPress={() => navigation.navigate('Vault')}
                >
                    <View style={styles.actionIconContainer}>
                        <Vault color={colors.primary} size={20} strokeWidth={1.5} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Digital Vault</Text>
                        <Text style={styles.actionSubtitle}>Manage your secure documents</Text>
                    </View>
                    <ChevronRight color="#9B8FB0" size={18} />
                </Pressable>

                {/* Nominee Center */}
                <Pressable style={styles.actionItem} onPress={() => navigation.navigate('NomineeCenter')}>
                    <View style={styles.actionIconContainer}>
                        <UserPlus color={colors.primary} size={20} strokeWidth={1.5} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Nominee Center</Text>
                        <Text style={styles.actionSubtitle}>Manage trusted contacts</Text>
                    </View>
                    <ChevronRight color="#9B8FB0" size={18} />
                </Pressable>

                {/* Inactivity Trigger */}
                <Pressable style={styles.actionItem} onPress={() => navigation.navigate('InactivityTriggers')}>
                    <View style={styles.actionIconContainer}>
                        <Shield color={colors.primary} size={20} strokeWidth={1.5} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Inactivity Trigger</Text>
                        <Text style={styles.actionSubtitle}>Set up emergency access</Text>
                    </View>
                    <ChevronRight color="#9B8FB0" size={18} />
                </Pressable>

                {/* Time Capsule */}
                <Pressable style={styles.actionItem} onPress={() => navigation.navigate('TimeCapsule')}>
                    <View style={styles.actionIconContainer}>
                        <Clock color={colors.primary} size={20} strokeWidth={1.5} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Time Capsule</Text>
                        <Text style={styles.actionSubtitle}>Schedule future messages</Text>
                    </View>
                    <ChevronRight color="#9B8FB0" size={18} />
                </Pressable>
            </ScrollView>

            <FeatureTour isOpen={showTour} onClose={handleTourClose} />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[3],
    },
    welcomeLabel: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
    },
    userName: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    iconButton: {
        padding: spacing[1],
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[4],
    },
    scrollContent: {
        paddingBottom: spacing[4],
    },
    securityScoreCard: {
        backgroundColor: '#E8F0FE',
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    securityScoreLabel: {
        fontSize: fontSize.sm.size,
        color: colors.foreground,
        marginTop: spacing[2],
        fontWeight: fontWeight.medium,
    },
    statsGrid: {
        marginBottom: spacing[3],
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing[3],
        marginBottom: spacing[3],
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    statLabel: {
        fontSize: fontSize.xs.size,
        color: colors.foreground,
        marginTop: spacing[1],
        fontWeight: fontWeight.medium,
    },
    triggerLabel: {
        fontSize: fontSize.xs.size,
        color: colors.foreground,
        fontWeight: fontWeight.medium,
    },
    triggerSwitch: {
        marginTop: spacing[1],
        transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
    },
    sectionTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[2],
        ...shadows.sm,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    actionSubtitle: {
        fontSize: fontSize.xs.size,
        color: '#7D7490',
        marginTop: 2,
    },
});
