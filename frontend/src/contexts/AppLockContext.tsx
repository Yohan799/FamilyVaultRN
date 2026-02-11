import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authenticateBiometric } from '@/lib/safeLocalAuth';
import { getLockState, lockApp, unlockApp as unlockAppService, checkAutoLock, getLocalLockPreference, getLocalPinHash, AppLockType, setLastActive } from '@/services/appLockService';
import { useAuth } from './AuthContext';

interface AppLockContextType {
    isLocked: boolean;
    lockType: AppLockType;
    unlock: () => Promise<boolean>;
    unlockWithPin: () => Promise<void>;
    lock: () => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export const AppLockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, profile } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [lockType, setLockType] = useState<AppLockType>(null);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    // Load initial lock state
    useEffect(() => {
        const loadState = async () => {
            const state = getLockState();
            const localType = await getLocalLockPreference();
            setLockType(localType);

            // If already locked in storage, sync state
            // OR if user is logged in, and we have a lock type, we might want to lock on startup?
            // Usually valid implementations lock on startup if a lock is configured.
            if (state.isLocked || (localType && user)) {
                setIsLocked(true);
                // Ensure storage reflects locked state immediately
                if (!state.isLocked && localType) {
                    lockApp(localType);
                }
            }
        };
        loadState();
    }, [user]);

    // Handle App State changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App returning to foreground
                if (user && profile?.auto_lock_minutes) {
                    const shouldLock = await checkAutoLock(user.id, profile.auto_lock_minutes);
                    if (shouldLock) {
                        setIsLocked(true);
                    }
                }
            } else if (nextAppState === 'background') {
                // App going to background - record timestamp
                setLastActive(Date.now());
            }
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [appState, user, profile, lockType]);


    const unlock = useCallback(async () => {
        try {
            const localType = await getLocalLockPreference();

            if (!localType) {
                setIsLocked(false);
                unlockAppService();
                return true;
            }

            if (localType === 'biometric') {
                const result = await authenticateBiometric('Unlock Family Vault');

                if (result.success) {
                    setIsLocked(false);
                    unlockAppService();
                    return true;
                }
            } else if (localType === 'pin') {
                // For 'pin' type, the UI handles the input verification and calls unlockWithPin
                // This method (unlock) is primarily for biometric triggering or automatic check
                return false;
            }

            return false;
        } catch (e) {
            console.error('Unlock failed', e);
            return false;
        }
    }, []);

    const unlockWithPin = useCallback(async () => {
        setIsLocked(false);
        unlockAppService();
    }, []);

    const lock = useCallback(() => {
        setIsLocked(true);
        lockApp(lockType);
    }, [lockType]);

    return (
        <AppLockContext.Provider value={{ isLocked, lockType, unlock, unlockWithPin, lock }}>
            {children}
        </AppLockContext.Provider>
    );
};

export const useAppLock = () => {
    const context = useContext(AppLockContext);
    if (context === undefined) {
        throw new Error('useAppLock must be used within an AppLockProvider');
    }
    return context;
};
