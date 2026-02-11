/**
 * Push Notification Service
 * Handles FCM token registration, permissions, and notification handling
 */

// Dynamic import - Firebase messaging not available in Expo Go
let messaging: any = null;
try {
    messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
    console.warn('[Push] @react-native-firebase/messaging not available');
}
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

let isInitialized = false;

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!messaging) return false;
    try {
        if (Platform.OS === 'android') {
            // Android 13+ requires explicit permission
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('[Push] Android notification permission denied');
                    return false;
                }
            }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('[Push] Permission status:', authStatus, 'enabled:', enabled);
        return enabled;
    } catch (error) {
        console.error('[Push] Error requesting permission:', error);
        return false;
    }
}

/**
 * Get the FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
    if (!messaging) return null;
    try {
        const token = await messaging().getToken();
        console.log('[Push] FCM Token:', token?.substring(0, 20) + '...');
        return token;
    } catch (error) {
        console.error('[Push] Error getting FCM token:', error);
        return null;
    }
}

/**
 * Register the device token with the backend
 */
export async function registerDeviceToken(userId: string): Promise<boolean> {
    try {
        const token = await getFCMToken();
        if (!token) {
            console.error('[Push] No FCM token available');
            return false;
        }

        // Register/update token using upsert - this handles duplicates via onConflict
        const { error } = await supabase
            .from('device_tokens')
            .upsert({
                user_id: userId,
                token: token,
                platform: Platform.OS,
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'token'
            });

        if (error) {
            console.error('[Push] Error registering token:', error);
            return false;
        }

        console.log('[Push] Device token registered successfully');
        return true;
    } catch (error) {
        console.error('[Push] Error registering device token:', error);
        return false;
    }
}

/**
 * Unregister device token (call on logout)
 */
export async function unregisterDeviceToken(): Promise<void> {
    try {
        const token = await getFCMToken();
        if (token) {
            await supabase
                .from('device_tokens')
                .delete()
                .eq('token', token);
            console.log('[Push] Device token unregistered');
        }
    } catch (error) {
        console.error('[Push] Error unregistering token:', error);
    }
}

/**
 * Handle foreground notification
 */
function handleForegroundNotification(remoteMessage: any) {
    console.log('[Push] Foreground notification:', remoteMessage);

    const { notification, data } = remoteMessage;
    if (notification) {
        Alert.alert(
            notification.title || 'Notification',
            notification.body || '',
            [{ text: 'OK' }]
        );
    }
}

/**
 * Handle notification when app is opened from background
 */
function handleNotificationOpen(remoteMessage: any) {
    console.log('[Push] Notification opened app:', remoteMessage);
    // Navigate to relevant screen based on data
    const { data } = remoteMessage;
    if (data?.type === 'otp') {
        // Could navigate to OTP verification screen
        console.log('[Push] OTP notification opened');
    }
}

/**
 * Initialize push notifications
 * Call this when user is authenticated
 */
export async function initializePushNotifications(userId: string): Promise<void> {
    if (isInitialized) {
        console.log('[Push] Already initialized');
        return;
    }

    try {
        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.log('[Push] No permission, skipping initialization');
            return;
        }

        // Register token with backend
        await registerDeviceToken(userId);

        // Listen for foreground messages
        const unsubscribeForeground = messaging().onMessage(handleForegroundNotification);

        // Listen for when app is opened from notification
        messaging().onNotificationOpenedApp(handleNotificationOpen);

        // Check if app was opened from notification when closed
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
            handleNotificationOpen(initialNotification);
        }

        // Listen for token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
            console.log('[Push] Token refreshed');
            await registerDeviceToken(userId);
        });

        isInitialized = true;
        console.log('[Push] Push notifications initialized successfully');
    } catch (error) {
        console.error('[Push] Error initializing push notifications:', error);
    }
}

/**
 * Check if push notifications are enabled for this device
 */
export async function arePushNotificationsEnabled(): Promise<boolean> {
    if (!messaging) return false;
    try {
        const authStatus = await messaging().hasPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    } catch (error) {
        console.error('[Push] Error checking permission:', error);
        return false;
    }
}
