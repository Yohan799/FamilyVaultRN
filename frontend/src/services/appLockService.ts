import { supabase } from '@/lib/supabase';
import { storageHelpers } from '@/lib/storage';
import * as Crypto from 'expo-crypto';

const LOCK_STATE_KEY = 'app_lock_state';
const LOCAL_LOCK_TYPE_KEY = 'app_lock_type_local';
const LOCAL_PIN_HASH_KEY = 'app_pin_hash_local';
const LAST_ACTIVE_KEY = 'app_last_active';

export type AppLockType = 'biometric' | 'pin' | 'password' | null;

export interface AppLockState {
    isLocked: boolean;
    lockType: AppLockType;
    timestamp: number;
}

// Get current lock state from storage
export const getLockState = (): AppLockState => {
    const state = storageHelpers.getObject<AppLockState>(LOCK_STATE_KEY);
    if (state) {
        return state;
    }
    return { isLocked: false, lockType: null, timestamp: 0 };
};

// Set lock state
export const setLockState = (state: AppLockState) => {
    storageHelpers.setObject(LOCK_STATE_KEY, state);
};

// Lock the app
export const lockApp = (lockType: AppLockType) => {
    setLockState({
        isLocked: true,
        lockType,
        timestamp: Date.now(),
    });
};

// Unlock the app
export const unlockApp = () => {
    setLockState({
        isLocked: false,
        lockType: null,
        timestamp: 0,
    });
};

// Save lock preference locally (for pre-login lock check)
export const saveLocalLockPreference = async (lockType: AppLockType) => {
    if (lockType) {
        storageHelpers.setString(LOCAL_LOCK_TYPE_KEY, lockType);
    } else {
        storageHelpers.delete(LOCAL_LOCK_TYPE_KEY);
    }
};

// Get local lock preference (for pre-login lock check)
export const getLocalLockPreference = async (): Promise<AppLockType> => {
    const value = storageHelpers.getString(LOCAL_LOCK_TYPE_KEY);
    return (value as AppLockType) || null;
};

// Save PIN hash locally (for pre-login PIN verification)
export const saveLocalPinHash = async (pinHash: string) => {
    storageHelpers.setString(LOCAL_PIN_HASH_KEY, pinHash);
};

// Get local PIN hash (for pre-login PIN verification)
export const getLocalPinHash = async (): Promise<string | null> => {
    return storageHelpers.getString(LOCAL_PIN_HASH_KEY);
};

// Clear local lock preferences (when disabling lock)
export const clearLocalLockPreferences = async () => {
    storageHelpers.delete(LOCAL_LOCK_TYPE_KEY);
    storageHelpers.delete(LOCAL_PIN_HASH_KEY);
};

// Verify PIN locally (without database - for pre-login)
export const verifyPinLocally = async (pin: string): Promise<boolean> => {
    const localPinHash = await getLocalPinHash();
    if (!localPinHash) return false;

    const enteredHash = await hashPin(pin);
    return localPinHash === enteredHash;
};

// Set last active timestamp
export const setLastActive = (timestamp: number) => {
    storageHelpers.setNumber(LAST_ACTIVE_KEY, timestamp);
};

// Get last active timestamp
export const getLastActive = (): number => {
    return storageHelpers.getNumber(LAST_ACTIVE_KEY) || 0;
};

// Check if app should be locked based on inactivity
export const checkAutoLock = async (userId: string, autoLockMinutes: number | null) => {
    if (!autoLockMinutes) return false;

    // If already locked, no need to check
    const state = getLockState();
    if (state.isLocked) return false;

    const lastActive = getLastActive();
    if (lastActive === 0) return false; // No record of activity

    const { data: profile } = await supabase
        .from('profiles')
        .select('app_lock_type')
        .eq('id', userId)
        .single();

    if (!profile?.app_lock_type) return false;

    const inactiveTime = Date.now() - lastActive;
    const lockThreshold = autoLockMinutes * 60 * 1000;

    if (inactiveTime > lockThreshold) {
        lockApp(profile.app_lock_type as AppLockType);
        return true;
    }

    return false;
};

// Verify PIN
export const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('app_pin_hash')
        .eq('id', userId)
        .single();

    if (!profile?.app_pin_hash) return false;

    const hashedPin = await hashPin(pin);
    return hashedPin === profile.app_pin_hash;
};

// Hash PIN using SHA-256
export const hashPin = async (pin: string): Promise<string> => {
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
    );
    return hash;
};

// Save PIN to database
export const savePin = async (userId: string, pin: string) => {
    const hashedPin = await hashPin(pin);

    // Also save locally for pre-login verification
    await saveLocalPinHash(hashedPin);
    await saveLocalLockPreference('pin');

    const { error } = await supabase
        .from('profiles')
        .update({ app_pin_hash: hashedPin, app_lock_type: 'pin' })
        .eq('id', userId);

    if (error) throw error;
};

// Update lock type
export const updateLockType = async (userId: string, lockType: AppLockType) => {
    await saveLocalLockPreference(lockType);

    const updates: { app_lock_type: string | null } = { app_lock_type: lockType };
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) throw error;
};

// Initialize biometric lock
export const initializeBiometricLock = async (userId: string) => {
    await saveLocalLockPreference('biometric');

    const { error } = await supabase
        .from('profiles')
        .update({ app_lock_type: 'biometric', biometric_enabled: true })
        .eq('id', userId);

    if (error) throw error;
};

// Disable app lock
export const disableAppLock = async (userId: string) => {
    await clearLocalLockPreferences();
    unlockApp();

    const { error } = await supabase
        .from('profiles')
        .update({
            app_lock_type: null,
            app_pin_hash: null,
            biometric_enabled: false
        })
        .eq('id', userId);

    if (error) throw error;
};
