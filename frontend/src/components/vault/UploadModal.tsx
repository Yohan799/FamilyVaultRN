import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Alert } from 'react-native';
import { Camera, FileUp, FolderUp, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

// Dynamic import - Document scanner not available in Expo Go
let DocumentScanner: any = null;
try {
    DocumentScanner = require('react-native-document-scanner-plugin').default;
} catch (e) {
    console.warn('[UploadModal] react-native-document-scanner-plugin not available');
}
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { GoogleLogo } from '@/components/ui/GoogleLogo';

interface UploadModalProps {
    visible: boolean;
    onClose: () => void;
    onUpload: (file: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ visible, onClose, onUpload }) => {

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types, or restrict to specific types
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                onUpload(result.assets[0]);
                onClose();
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleScanDocument = async () => {
        if (!DocumentScanner) {
            Alert.alert('Not Available', 'Document scanner is not available in Expo Go. Use a development build.');
            return;
        }
        try {
            const { scannedImages } = await DocumentScanner.scanDocument();

            if (scannedImages && scannedImages.length > 0) {
                // Handle scanned images - usually returns paths
                // Create a file object similar to DocumentPicker result
                const scannedFile = {
                    uri: scannedImages[0],
                    name: `Scanned_${new Date().getTime()}.jpg`,
                    type: 'image/jpeg', // Scans are usually images
                    size: 0, // Size might require file info check
                };
                onUpload(scannedFile);
                onClose();
            }
        } catch (error) {
            console.error('Error scanning document:', error);
            // Alert.alert('Error', 'Failed to scan document'); 
            // Scanner plugin might cancel or fail silently
        }
    };

    const handleGoogleDriveImport = async () => {
        // Integrating Google Drive usually means using the Drive API to list files
        // OR using the system picker which supports Drive.
        // For now, allow system picker but maybe we can differentiate later.
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                onUpload(result.assets[0]);
                onClose();
            }
        } catch (error) {
            console.error('Error picking from Drive:', error);
            Alert.alert('Error', 'Failed to import from Drive');
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Upload File</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X color={colors.foreground} size={24} />
                        </Pressable>
                    </View>

                    <Text style={styles.subtitle}>Choose how you want to add documents</Text>

                    <View style={styles.optionsContainer}>
                        <Pressable style={styles.optionButton} onPress={handleScanDocument}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E8F0FE' }]}>
                                <Camera color="#4285F4" size={32} />
                            </View>
                            <Text style={styles.optionLabel}>Scan Document</Text>
                            <Text style={styles.optionDescription}>Use camera to scan</Text>
                        </Pressable>

                        <Pressable style={styles.optionButton} onPress={handlePickDocument}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E6F4EA' }]}>
                                <FolderUp color="#34A853" size={32} />
                            </View>
                            <Text style={styles.optionLabel}>Upload File</Text>
                            <Text style={styles.optionDescription}>From device storage</Text>
                        </Pressable>

                        <Pressable style={styles.optionButton} onPress={handleGoogleDriveImport}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FEF7E0' }]}>
                                {/* <FileUp color="#EA4335" size={32} /> */}
                                <GoogleLogo size={32} />
                            </View>
                            <Text style={styles.optionLabel}>Google Drive</Text>
                            <Text style={styles.optionDescription}>Import from Drive</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        padding: spacing[6],
        paddingBottom: Platform.OS === 'ios' ? spacing[10] : spacing[6],
        ...shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    title: {
        fontSize: 20,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    closeButton: {
        padding: spacing[1],
    },
    subtitle: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
        marginBottom: spacing[6],
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing[4],
        gap: spacing[2],
    },
    optionButton: {
        flex: 1,
        alignItems: 'center',
        padding: spacing[3],
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
    },
    optionLabel: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing[1],
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: fontSize.xs.size,
        color: '#7D7490',
        textAlign: 'center',
    },
});
