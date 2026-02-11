import { 
    checkBiometricAvailability as safeCheckBiometricAvailability, 
    authenticateBiometric as safeAuthenticateBiometric,
    BiometricStatus
} from '@/lib/safeLocalAuth';
import { storageHelpers } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type { BiometricStatus };

/**
 * Check if biometric authentication is available on the device
 */
export const checkBiometricAvailability = async (): Promise<BiometricStatus> => {
    return safeCheckBiometricAvailability();
};

/**
 * Authenticate using biometrics
 */
export const authenticateBiometric = async (
    promptMessage: string = 'Authenticate to access Family Vault'
): Promise<{ success: boolean; error?: string }> => {
    return safeAuthenticateBiometric(promptMessage);
};

/**
 * Enable biometric authentication for the user
 */
export const enableBiometric = async (userId: string): Promise<boolean> => {
    try {
        // First verify biometric works
        const authResult = await authenticateBiometric('Verify your identity to enable biometric login');

        if (!authResult.success) {
            return false;
        }

        // Save to local storage
        storageHelpers.setBoolean(BIOMETRIC_ENABLED_KEY, true);

        // Update user profile
        const { error } = await supabase
            .from('profiles')
            .update({
                biometric_enabled: true,
                app_lock_type: 'biometric'
            })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error enabling biometric:', error);
        return false;
    }
};

/**
 * Disable biometric authentication for the user
 */
export const disableBiometric = async (userId: string): Promise<boolean> => {
    try {
        storageHelpers.setBoolean(BIOMETRIC_ENABLED_KEY, false);

        const { error } = await supabase
            .from('profiles')
            .update({ biometric_enabled: false })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error disabling biometric:', error);
        return false;
    }
};

/**
 * Check if biometric is enabled locally
 */
export const isBiometricEnabled = (): boolean => {
    return storageHelpers.getBoolean(BIOMETRIC_ENABLED_KEY) || false;
};

/**
 * Get a user-friendly name for the biometry type
 */
export const getBiometryTypeName = (type: 'fingerprint' | 'facial' | 'iris' | null): string => {
    switch (type) {
        case 'fingerprint':
            return 'Fingerprint';
        case 'facial':
            return 'Face ID';
        case 'iris':
            return 'Iris';
        default:
            return 'Biometric';
    }
};
