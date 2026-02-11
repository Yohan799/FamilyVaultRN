/**
 * Safe wrapper for expo-local-authentication
 * Handles cases where the module might not be properly initialized
 */

let LocalAuthentication: typeof import('expo-local-authentication') | null = null;

// Lazy load and cache the module
const getLocalAuthentication = async () => {
    if (LocalAuthentication) {
        return LocalAuthentication;
    }

    try {
        LocalAuthentication = await import('expo-local-authentication');
        return LocalAuthentication;
    } catch (error) {
        console.warn('expo-local-authentication not available:', error);
        return null;
    }
};

export interface AuthenticationResult {
    success: boolean;
    error?: string;
    warning?: string;
}

export interface BiometricStatus {
    isAvailable: boolean;
    isEnrolled: boolean;
    biometryType: 'fingerprint' | 'facial' | 'iris' | null;
}

/**
 * Check if biometric authentication is available on the device
 */
export const checkBiometricAvailability = async (): Promise<BiometricStatus> => {
    try {
        const auth = await getLocalAuthentication();
        
        if (!auth) {
            return {
                isAvailable: false,
                isEnrolled: false,
                biometryType: null,
            };
        }

        const compatible = await auth.hasHardwareAsync();
        const enrolled = await auth.isEnrolledAsync();
        const types = await auth.supportedAuthenticationTypesAsync();

        let biometryType: 'fingerprint' | 'facial' | 'iris' | null = null;

        if (types.includes(auth.AuthenticationType.FACIAL_RECOGNITION)) {
            biometryType = 'facial';
        } else if (types.includes(auth.AuthenticationType.FINGERPRINT)) {
            biometryType = 'fingerprint';
        } else if (types.includes(auth.AuthenticationType.IRIS)) {
            biometryType = 'iris';
        }

        return {
            isAvailable: compatible,
            isEnrolled: enrolled,
            biometryType,
        };
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return {
            isAvailable: false,
            isEnrolled: false,
            biometryType: null,
        };
    }
};

/**
 * Authenticate using biometrics
 */
export const authenticateBiometric = async (
    promptMessage: string = 'Authenticate to access Family Vault'
): Promise<AuthenticationResult> => {
    try {
        const auth = await getLocalAuthentication();
        
        if (!auth) {
            return {
                success: false,
                error: 'Biometric authentication is not available on this device',
            };
        }

        const result = await auth.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use PIN instead',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (result.success) {
            return { success: true };
        }

        return {
            success: false,
            error: result.error || 'Authentication failed',
        };
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return {
            success: false,
            error: 'An error occurred during authentication',
        };
    }
};

/**
 * Check if local authentication module is available
 */
export const isLocalAuthAvailable = async (): Promise<boolean> => {
    try {
        const auth = await getLocalAuthentication();
        return auth !== null;
    } catch {
        return false;
    }
};
