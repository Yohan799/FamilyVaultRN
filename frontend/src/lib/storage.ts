// Dynamic import to avoid crash in Expo Go (MMKV uses JSI require() at import time)
let createMMKV: any = null;
try {
    const mmkvModule = require('react-native-mmkv');
    createMMKV = mmkvModule.createMMKV;
} catch (e) {
    console.warn('[Storage] react-native-mmkv not available, using in-memory fallback');
}

type MMKV = {
    getString: (key: string) => string | undefined;
    set: (key: string, value: string | number | boolean) => void;
    getNumber: (key: string) => number | undefined;
    getBoolean: (key: string) => boolean | undefined;
    remove: (key: string) => void;
    clearAll: () => void;
};

// Lazy singleton instances - only created when first accessed
let _storage: MMKV | null = null;
let _authStorage: MMKV | null = null;
let _initializationError: Error | null = null;
let _nativeModuleChecked = false;
let _isNativeModuleAvailable = false;

// In-memory fallback storage for when native module isn't available
const memoryStorage: Map<string, string> = new Map();

/**
 * Check if MMKV native module is available
 * This helps detect issues like remote debugging or missing native module linking
 */
const checkNativeModuleAvailable = (): boolean => {
    if (_nativeModuleChecked) {
        return _isNativeModuleAvailable;
    }

    _nativeModuleChecked = true;

    if (!createMMKV) {
        _isNativeModuleAvailable = false;
        return false;
    }

    try {
        // Try to create an MMKV instance - if the native module isn't available, this will throw
        const testInstance = createMMKV({ id: 'mmkv-availability-test' });
        // Clean up test instance
        testInstance.clearAll();
        _isNativeModuleAvailable = true;
        return true;
    } catch (error) {
        console.warn('[Storage] MMKV native module not available:', error);
        _isNativeModuleAvailable = false;
        return false;
    }
};

/**
 * Initialize MMKV storage lazily
 * Returns null if native module is not available (e.g., during remote debugging)
 */
const initializeStorage = (): MMKV | null => {
    if (_storage) return _storage;
    if (_initializationError) return null;

    try {
        if (!checkNativeModuleAvailable()) {
            _initializationError = new Error('MMKV native module not available');
            console.warn('[Storage] Using in-memory fallback storage');
            return null;
        }

        _storage = createMMKV({
            id: 'family-vault-storage',
        });
        console.log('[Storage] MMKV storage initialized successfully');
        return _storage;
    } catch (error) {
        _initializationError = error as Error;
        console.error('[Storage] Failed to initialize MMKV storage:', error);
        return null;
    }
};

/**
 * Initialize auth storage lazily
 */
const initializeAuthStorage = (): MMKV | null => {
    if (_authStorage) return _authStorage;
    if (_initializationError) return null;

    try {
        if (!checkNativeModuleAvailable()) {
            _initializationError = new Error('MMKV native module not available');
            console.warn('[Storage] Using in-memory fallback for auth storage');
            return null;
        }

        _authStorage = createMMKV({
            id: 'family-vault-auth',
        });
        console.log('[Storage] MMKV auth storage initialized successfully');
        return _authStorage;
    } catch (error) {
        _initializationError = error as Error;
        console.error('[Storage] Failed to initialize MMKV auth storage:', error);
        return null;
    }
};

/**
 * Get the general storage instance (lazy initialization)
 */
export const getStorage = (): MMKV | null => {
    return initializeStorage();
};

/**
 * Get the auth storage instance (lazy initialization)
 */
export const getAuthStorage = (): MMKV | null => {
    return initializeAuthStorage();
};

/**
 * Check if storage is ready and available
 */
export const isStorageReady = (): boolean => {
    return getStorage() !== null;
};

/**
 * Storage adapter for Supabase auth
 * Uses MMKV if available, falls back to in-memory storage
 */
export const supabaseStorageAdapter = {
    getItem: (key: string): string | null => {
        try {
            const authStore = getAuthStorage();
            if (authStore) {
                const value = authStore.getString(key);
                return value ?? null;
            }
            // Fallback to memory storage
            return memoryStorage.get(key) ?? null;
        } catch (error) {
            console.error('[Storage] Error getting item:', key, error);
            return memoryStorage.get(key) ?? null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            const authStore = getAuthStorage();
            if (authStore) {
                authStore.set(key, value);
            }
            // Always set in memory as backup
            memoryStorage.set(key, value);
        } catch (error) {
            console.error('[Storage] Error setting item:', key, error);
            memoryStorage.set(key, value);
        }
    },
    removeItem: (key: string): void => {
        try {
            const authStore = getAuthStorage();
            if (authStore) {
                authStore.remove(key);
            }
            memoryStorage.delete(key);
        } catch (error) {
            console.error('[Storage] Error removing item:', key, error);
            memoryStorage.delete(key);
        }
    },
};

/**
 * Generic storage helpers with lazy initialization and error handling
 */
export const storageHelpers = {
    getString: (key: string): string | null => {
        try {
            const store = getStorage();
            if (store) {
                return store.getString(key) ?? null;
            }
            return memoryStorage.get(key) ?? null;
        } catch (error) {
            console.error('[Storage] Error getting string:', key, error);
            return null;
        }
    },
    setString: (key: string, value: string): void => {
        try {
            const store = getStorage();
            if (store) {
                store.set(key, value);
            }
            memoryStorage.set(key, value);
        } catch (error) {
            console.error('[Storage] Error setting string:', key, error);
        }
    },
    getNumber: (key: string): number | null => {
        try {
            const store = getStorage();
            if (store) {
                const value = store.getNumber(key);
                return value !== undefined ? value : null;
            }
            const memValue = memoryStorage.get(key);
            return memValue ? parseFloat(memValue) : null;
        } catch (error) {
            console.error('[Storage] Error getting number:', key, error);
            return null;
        }
    },
    setNumber: (key: string, value: number): void => {
        try {
            const store = getStorage();
            if (store) {
                store.set(key, value);
            }
            memoryStorage.set(key, value.toString());
        } catch (error) {
            console.error('[Storage] Error setting number:', key, error);
        }
    },
    getBoolean: (key: string): boolean | null => {
        try {
            const store = getStorage();
            if (store) {
                const value = store.getBoolean(key);
                return value !== undefined ? value : null;
            }
            const memValue = memoryStorage.get(key);
            return memValue ? memValue === 'true' : null;
        } catch (error) {
            console.error('[Storage] Error getting boolean:', key, error);
            return null;
        }
    },
    setBoolean: (key: string, value: boolean): void => {
        try {
            const store = getStorage();
            if (store) {
                store.set(key, value);
            }
            memoryStorage.set(key, value.toString());
        } catch (error) {
            console.error('[Storage] Error setting boolean:', key, error);
        }
    },
    getObject: <T>(key: string): T | null => {
        try {
            const store = getStorage();
            const valueStr = store ? store.getString(key) : memoryStorage.get(key);
            if (!valueStr) return null;
            return JSON.parse(valueStr) as T;
        } catch (error) {
            console.error('[Storage] Error getting object:', key, error);
            return null;
        }
    },
    setObject: <T>(key: string, value: T): void => {
        try {
            const jsonStr = JSON.stringify(value);
            const store = getStorage();
            if (store) {
                store.set(key, jsonStr);
            }
            memoryStorage.set(key, jsonStr);
        } catch (error) {
            console.error('[Storage] Error setting object:', key, error);
        }
    },
    delete: (key: string): void => {
        try {
            const store = getStorage();
            if (store) {
                store.remove(key);
            }
            memoryStorage.delete(key);
        } catch (error) {
            console.error('[Storage] Error deleting key:', key, error);
        }
    },
    clearAll: (): void => {
        try {
            const store = getStorage();
            if (store) {
                store.clearAll();
            }
            memoryStorage.clear();
        } catch (error) {
            console.error('[Storage] Error clearing storage:', error);
        }
    },
    // Onboarding Persistence
    getHasSeenOnboarding: (): boolean => {
        return storageHelpers.getBoolean('HAS_SEEN_ONBOARDING') ?? false;
    },
    setHasSeenOnboarding: (value: boolean): void => {
        storageHelpers.setBoolean('HAS_SEEN_ONBOARDING', value);
    },
    // Feature Tour Persistence
    getHasSeenFeatureTour: (): boolean => {
        return storageHelpers.getBoolean('HAS_SEEN_FEATURE_TOUR') ?? false;
    },
    setHasSeenFeatureTour: (value: boolean): void => {
        storageHelpers.setBoolean('HAS_SEEN_FEATURE_TOUR', value);
    },
};
