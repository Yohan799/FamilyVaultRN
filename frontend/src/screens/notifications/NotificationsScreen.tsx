import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Bell, RefreshCw, CheckCheck, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'security':
            return '🔐';
        case 'document':
            return '📄';
        case 'nominee':
            return '👥';
        case 'otp':
            return '🔑';
        default:
            return '🔔';
    }
};

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const loadNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, title, body, type, is_read, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Notifications] Error loading:', error);
                return;
            }

            setNotifications(data || []);
        } catch (err) {
            console.error('[Notifications] Exception:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );

        // Persist to database
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        // Persist to database
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
    };

    const handleDelete = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // Persist to database
        await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color={colors.primaryForeground} size={24} />
                    </Pressable>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Pressable style={styles.headerButton} onPress={loadNotifications}>
                        <RefreshCw color={colors.primaryForeground} size={20} />
                    </Pressable>
                    {unreadCount > 0 && (
                        <Pressable style={styles.headerButton} onPress={handleMarkAllAsRead}>
                            <CheckCheck color={colors.primaryForeground} size={20} />
                        </Pressable>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.spinner} />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Bell color={colors.mutedForeground} size={48} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptyDescription}>
                            You'll see security alerts and updates here
                        </Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <Pressable
                            key={notification.id}
                            style={[
                                styles.notificationCard,
                                !notification.is_read && styles.notificationUnread,
                            ]}
                            onPress={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationIcon}>
                                    {getNotificationIcon(notification.type)}
                                </Text>
                                <View style={styles.notificationText}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.is_read && styles.notificationTitleUnread,
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        <Pressable
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(notification.id)}
                                        >
                                            <Trash2 color={colors.mutedForeground} size={16} />
                                        </Pressable>
                                    </View>
                                    <Text style={styles.notificationBody} numberOfLines={2}>
                                        {notification.body}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))
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
        justifyContent: 'space-between',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.primaryForeground,
    },
    headerSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.primaryForeground,
        opacity: 0.8,
    },
    headerRight: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    loadingContainer: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.xl,
        alignItems: 'center',
    },
    spinner: {
        width: 32,
        height: 32,
        borderWidth: 4,
        borderColor: colors.primary,
        borderTopColor: 'transparent',
        borderRadius: 16,
        marginBottom: spacing.md,
    },
    loadingText: {
        color: colors.mutedForeground,
    },
    emptyState: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.mutedForeground,
        marginTop: spacing.md,
    },
    emptyDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    notificationCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    notificationUnread: {
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    notificationContent: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    notificationIcon: {
        fontSize: 24,
    },
    notificationText: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    notificationTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.mutedForeground,
        flex: 1,
    },
    notificationTitleUnread: {
        color: colors.foreground,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    notificationBody: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing.xs,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: spacing.sm,
    },
});
