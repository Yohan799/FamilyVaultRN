import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAppLock } from '@/contexts/AppLockContext';
import { colors } from '@/theme';
import { Home, Lock, Settings, Vault } from 'lucide-react-native';

// Dynamic import - SplashScreen not available in Expo Go
let SplashScreen: any = null;
try {
    SplashScreen = require('react-native-splash-screen').default;
} catch (e) {
    console.warn('[RootNavigator] react-native-splash-screen not available');
}

// Import screens
import { AppLockScreen } from '@/screens/auth/AppLockScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { VaultHomeScreen } from '@/screens/vault/VaultHomeScreen';
import { CategoryViewScreen } from '@/screens/vault/CategoryViewScreen';
import { SubcategoryViewScreen } from '@/screens/vault/SubcategoryViewScreen';
import { NestedFolderViewScreen } from '@/screens/vault/NestedFolderViewScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '@/screens/settings/ChangePasswordScreen';
import { TwoFactorSetupScreen } from '@/screens/settings/TwoFactorSetupScreen';
import { AppLockSetupScreen } from '@/screens/settings/AppLockSetupScreen';
import { ActiveSessionsScreen } from '@/screens/settings/ActiveSessionsScreen';
import { EmailPreferencesScreen } from '@/screens/settings/EmailPreferencesScreen';
import { HelpCenterScreen } from '@/screens/settings/HelpCenterScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { PasswordResetOTPScreen } from '@/screens/auth/PasswordResetOTPScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { NomineeCenterScreen } from '@/screens/nominees/NomineeCenterScreen';
import { InactivityTriggersScreen } from '@/screens/settings/InactivityTriggersScreen';
import { TimeCapsuleScreen } from '@/screens/timecapsule/TimeCapsuleScreen';
import { SetupPINScreen } from '@/screens/settings/SetupPINScreen';
import { CustomizeQuickActionsScreen } from '@/screens/settings/CustomizeQuickActionsScreen';
import { EmergencyAccessScreen } from '@/screens/emergency/EmergencyAccessScreen';
import { VerifyNomineeScreen } from '@/screens/nominees/VerifyNomineeScreen';
import { SignupOTPScreen } from '@/screens/auth/SignupOTPScreen';

// Type definitions
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Onboarding: undefined;
    SignIn: undefined;
    SignUp: undefined;
    SignupOTP: { email: string; name: string; password: string };
    ForgotPassword: undefined;
    PasswordResetOTP: { email: string };
    ResetPassword: { email: string; resetToken: string };
};

export type MainStackParamList = {
    MainTabs: undefined;
    Profile: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
    TwoFactorSetup: undefined;
    AppLockSetup: undefined;
    ActiveSessions: undefined;
    EmailPreferences: undefined;
    HelpCenter: undefined;
    Notifications: undefined;
    NomineeCenter: undefined;
    InactivityTriggers: undefined;
    TimeCapsule: undefined;
    SetupPIN: undefined;
    CustomizeQuickActions: undefined;
    EmergencyAccess: undefined;
    VerifyNominee: { token: string };
};

export type MainTabParamList = {
    Home: undefined;
    Vault: undefined;
    Settings: undefined;
};

export type VaultStackParamList = {
    VaultHome: undefined;
    CategoryView: { categoryId: string };
    SubcategoryView: { categoryId: string; subcategoryId: string };
    NestedFolderView: { categoryId: string; subcategoryId: string; folderId: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const VaultStack = createNativeStackNavigator<VaultStackParamList>();

// Auth Navigator
const AuthNavigator = () => {
    // Check if onboarding has been seen
    const [initialRoute, setInitialRoute] = React.useState<keyof AuthStackParamList | null>(null);

    React.useEffect(() => {
        const checkOnboarding = async () => {
            const { storageHelpers } = require('@/lib/storage');
            const hasSeen = storageHelpers.getHasSeenOnboarding();
            setInitialRoute(hasSeen ? 'SignIn' : 'Onboarding');
        };
        checkOnboarding();
    }, []);

    if (!initialRoute) return null; // Or a loading spinner if needed

    return (
        <AuthStack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
            <AuthStack.Screen name="SignIn" component={SignInScreen} />
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
            <AuthStack.Screen name="SignupOTP" component={SignupOTPScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <AuthStack.Screen name="PasswordResetOTP" component={PasswordResetOTPScreen} />
            <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
    );
};

// Vault Navigator
const VaultNavigator = () => {
    return (
        <VaultStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <VaultStack.Screen
                name="VaultHome"
                component={VaultHomeScreen}
            />
            <VaultStack.Screen
                name="CategoryView"
                component={CategoryViewScreen}
            />
            <VaultStack.Screen
                name="SubcategoryView"
                component={SubcategoryViewScreen}
            />
            <VaultStack.Screen
                name="NestedFolderView"
                component={NestedFolderViewScreen}
            />
        </VaultStack.Navigator>
    );
};

// Main Tab Navigator
const MainTabNavigator = () => {
    return (
        <MainTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <MainTab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Home color={color} size={size} />
                    ),
                }}
            />
            <MainTab.Screen
                name="Vault"
                component={VaultNavigator}
                options={{
                    tabBarLabel: 'Vault',
                    tabBarIcon: ({ color, size }) => (
                        <Vault color={color} size={size} />
                    ),
                }}
            />
            <MainTab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Settings color={color} size={size} />
                    ),
                }}
            />
        </MainTab.Navigator>
    );
};

// Main Stack Navigator (tabs + additional screens)
const MainNavigator = () => {
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
            <MainStack.Screen name="Profile" component={ProfileScreen} />
            <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
            <MainStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <MainStack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} />
            <MainStack.Screen name="AppLockSetup" component={AppLockSetupScreen} />
            <MainStack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
            <MainStack.Screen name="EmailPreferences" component={EmailPreferencesScreen} />
            <MainStack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <MainStack.Screen name="Notifications" component={NotificationsScreen} />
            <MainStack.Screen name="NomineeCenter" component={NomineeCenterScreen} />
            <MainStack.Screen name="InactivityTriggers" component={InactivityTriggersScreen} />
            <MainStack.Screen name="TimeCapsule" component={TimeCapsuleScreen} />
            <MainStack.Screen name="SetupPIN" component={SetupPINScreen} />
            <MainStack.Screen name="CustomizeQuickActions" component={CustomizeQuickActionsScreen} />
            <MainStack.Screen name="EmergencyAccess" component={EmergencyAccessScreen} />
            <MainStack.Screen name="VerifyNominee" component={VerifyNomineeScreen} />
        </MainStack.Navigator>
    );
};

// Root Navigator
export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { isLocked } = useAppLock();

    useEffect(() => {
        if (!isLoading) {
            // Hide splash screen when auth is initialized
            SplashScreen?.hide();
        }
    }, [isLoading]);

    if (isLoading) {
        // Keep showing native splash screen
        return null;
    }

    if (isLocked && isAuthenticated) {
        return <AppLockScreen />;
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <RootStack.Screen name="Main" component={MainNavigator} />
                ) : (
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

