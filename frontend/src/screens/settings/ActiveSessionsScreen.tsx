import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Smartphone, Monitor, Tablet, MapPin, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { fetchSessions, endSession, endAllOtherSessions, type UserSession } from '@/services/sessionService';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ActiveSessionsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadSessions();
        }
    }, [user]);

    const loadSessions = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const data = await fetchSessions(user.id);
            setSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Error', 'Failed to load sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndSession = async (sessionId: string, deviceName: string) => {
        try {
            await endSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            Alert.alert('Success', `${deviceName} has been logged out`);
        } catch (error) {
            Alert.alert('Error', 'Failed to end session');
        }
    };

    const handleEndAllOtherSessions = async () => {
        if (!user) return;

        const currentSession = sessions.find(s => s.is_current);
        if (!currentSession) return;

        Alert.alert(
            'End All Other Sessions',
            'Are you sure you want to log out of all other devices?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await endAllOtherSessions(user.id, currentSession.id);
                            setSessions(sessions.filter(s => s.is_current));
                            Alert.alert('Success', 'All other sessions have been ended');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to end sessions');
                        }
                    },
                },
            ]
        );
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone color={colors.primary} size={20} />;
            case 'tablet':
                return <Tablet color={colors.primary} size={20} />;
            default:
                return <Monitor color={colors.primary} size={20} />;
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
                <Text style={styles.headerTitle}>Active Sessions</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Manage your logged in devices and sessions.
                </Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading sessions...</Text>
                    </View>
                ) : sessions.length > 0 ? (
                    <>
                        {sessions.map((session) => (
                            <View key={session.id} style={styles.sessionCard}>
                                <View style={styles.sessionHeader}>
                                    <View style={styles.deviceIconContainer}>
                                        {getDeviceIcon(session.device_type)}
                                    </View>
                                    <View style={styles.sessionInfo}>
                                        <View style={styles.sessionTitleRow}>
                                            <Text style={styles.deviceName}>{session.device_name}</Text>
                                            {session.is_current && (
                                                <View style={styles.currentBadge}>
                                                    <Text style={styles.currentBadgeText}>Current</Text>
                                                </View>
                                            )}
                                        </View>
                                        {session.location && (
                                            <View style={styles.sessionDetail}>
                                                <MapPin color={colors.mutedForeground} size={12} />
                                                <Text style={styles.sessionDetailText}>{session.location}</Text>
                                            </View>
                                        )}
                                        <View style={styles.sessionDetail}>
                                            <Clock color={colors.mutedForeground} size={12} />
                                            <Text style={styles.sessionDetailText}>
                                                {format(new Date(session.last_active_at), 'PPp')}
                                            </Text>
                                        </View>
                                        {!session.is_current && (
                                            <Pressable
                                                style={styles.endSessionButton}
                                                onPress={() => handleEndSession(session.id, session.device_name)}
                                            >
                                                <Text style={styles.endSessionButtonText}>End Session</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Smartphone color={colors.mutedForeground} size={28} />
                        </View>
                        <Text style={styles.emptyTitle}>No Other Sessions</Text>
                        <Text style={styles.emptyDescription}>
                            You're only logged in on this device.
                        </Text>
                    </View>
                )}

                {sessions.length > 1 && sessions.some(s => !s.is_current) && (
                    <Pressable
                        style={styles.endAllButton}
                        onPress={handleEndAllOtherSessions}
                    >
                        <Text style={styles.endAllButtonText}>End All Other Sessions</Text>
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
    subtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginBottom: spacing.lg,
    },
    loadingContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        color: colors.mutedForeground,
    },
    sessionCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    deviceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    deviceName: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    currentBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    currentBadgeText: {
        fontSize: fontSize.xs.size,
        color: '#22c55e',
        fontWeight: fontWeight.medium,
    },
    sessionDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 2,
    },
    sessionDetailText: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
    },
    endSessionButton: {
        backgroundColor: colors.destructive,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
    },
    endSessionButtonText: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
        color: colors.destructiveForeground,
    },
    emptyState: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 56,
        height: 56,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.xs,
    },
    emptyDescription: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    endAllButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    endAllButtonText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
});
