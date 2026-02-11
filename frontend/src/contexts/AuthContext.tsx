import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Dynamic import - Google Sign-in not available in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
    const gsModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = gsModule.GoogleSignin;
    statusCodes = gsModule.statusCodes;
} catch (e) {
    console.warn('[AuthContext] @react-native-google-signin/google-signin not available');
}
import { initializePushNotifications, unregisterDeviceToken } from '@/services/pushNotificationService';

// Profile interface matching Supabase profiles table
interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    profile_image_url: string | null;
    additional_emails: string[] | null;
    phone: string | null;
    date_of_birth: string | null;
    created_at: string;
    updated_at: string;
    last_login: string | null;
    email_verified: boolean | null;
    two_factor_enabled: boolean | null;
    biometric_enabled: boolean | null;
    app_lock_type: string | null;
    app_pin_hash: string | null;
    auto_lock_minutes: number | null;
    backup_frequency: string | null;
    push_notifications_enabled: boolean | null;
}
interface AuthContextType {
    user: SupabaseUser | null;
    profile: Profile | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: Error | null;
    signUp: (email: string, password: string, fullName: string) => Promise<{ userId: string }>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;
            if (!data) return;

            setProfile({
                ...data,
                additional_emails: Array.isArray(data.additional_emails)
                    ? (data.additional_emails as unknown as string[])
                    : null,
            });
        } catch (err) {
            console.error('[AuthContext] Error fetching profile:', err);
            setError(err as Error);
        }
    }, []);

    // Initialize auth state
    useEffect(() => {
        let isMounted = true;
        let subscription: { unsubscribe: () => void } | null = null;

        const initializeAuth = async () => {
            try {
                // Configure Google Sign-In
                if (GoogleSignin) {
                    GoogleSignin.configure({
                        scopes: ['https://www.googleapis.com/auth/drive.file'],
                        webClientId: '262930037585-pcnfpbrtfo5cmd6bp4sf2eq4g940tjp1.apps.googleusercontent.com',
                        offlineAccess: true,
                    });
                }

                // Set up auth state listener
                const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
                    async (event, currentSession) => {
                        if (!isMounted) return;

                        setSession(currentSession);
                        setUser(currentSession?.user ?? null);

                        if (currentSession?.user) {
                            // Defer Supabase calls to avoid blocking
                            setTimeout(() => {
                                if (isMounted) {
                                    fetchProfile(currentSession.user.id);
                                    // Initialize push notifications for authenticated user
                                    initializePushNotifications(currentSession.user.id);
                                }
                            }, 0);
                        } else {
                            setProfile(null);
                        }
                    }
                );

                subscription = authSubscription;

                // Check for existing session
                const { data: { session: existingSession } } = await supabase.auth.getSession();

                if (!isMounted) return;

                setSession(existingSession);
                setUser(existingSession?.user ?? null);

                if (existingSession?.user) {
                    await fetchProfile(existingSession.user.id);
                }

                setIsInitialized(true);
                setIsLoading(false);
            } catch (err) {
                console.error('[AuthContext] Initialization error:', err);
                if (isMounted) {
                    setError(err as Error);
                    setIsInitialized(true);
                    setIsLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [fetchProfile]);

    const signUp = useCallback(async (email: string, password: string, fullName: string) => {
        setError(null);
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Failed to create user');

        return { userId: data.user.id };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setError(null);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) throw signInError;

        if (data.user) {
            await supabase
                .from('profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.user.id);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!GoogleSignin) {
            Alert.alert('Not Available', 'Google Sign-In is not available in Expo Go. Use a development build.');
            return;
        }
        setError(null);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                if (data.user) {
                    // Check if profile exists, if not create one (though trigger usually handles this)
                    await supabase
                        .from('profiles')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', data.user.id);
                }
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                console.log('User cancelled Google Sign-In');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
                console.log('Google Sign-In in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                throw new Error('Google Play Services not available');
            } else {
                // some other error happened
                throw error;
            }
        }
    }, []);

    const signOut = useCallback(async () => {
        setError(null);
        try {
            // Unregister push notification token before signing out
            await unregisterDeviceToken();
        } catch (e) {
            console.error('Error unregistering push token:', e);
        }

        try {
            if (GoogleSignin) {
                await GoogleSignin.signOut(); // Ensure Google session is also cleared
            }
        } catch (e) {
            console.error('Error signing out of Google:', e);
        }

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        setUser(null);
        setProfile(null);
        setSession(null);
    }, []);

    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in');
        setError(null);

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (updateError) throw updateError;
        setProfile(prev => prev ? { ...prev, ...updates } : null);
    }, [user]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
    }, []);

    const updatePassword = useCallback(async (newPassword: string) => {
        setError(null);
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (updateError) throw updateError;
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isAuthenticated: !!user,
                isLoading,
                isInitialized,
                error,
                signUp,
                signIn,
                signInWithGoogle,
                signOut,
                updateProfile,
                refreshProfile,
                resetPassword,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

