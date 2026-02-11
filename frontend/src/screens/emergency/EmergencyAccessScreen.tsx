import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Shield,
    Mail,
    Key,
    FileText,
    Download,
    Eye,
    LogOut,
    X,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Document {
    id: string;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    file_url: string;
    uploaded_at: string;
}

interface AccessControl {
    access_level: string;
    resource_id: string;
}

type Step = 'email' | 'otp' | 'documents';

export const EmergencyAccessScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const [step, setStep] = useState<Step>('email');
    const [nomineeEmail, setNomineeEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string>('');

    const handleCancel = () => {
        setStep('email');
        setNomineeEmail('');
        setOtpCode('');
        setDocuments([]);
        setAccessControls([]);
        setUserId('');
        navigation.goBack();
    };

    const handleBackToEmail = () => {
        setStep('email');
        setOtpCode('');
    };

    const handleEmailSubmit = async () => {
        if (!nomineeEmail) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            // Check if nominee exists and is verified
            const { data: nominee, error: nomineeError } = await supabase
                .from('nominees')
                .select('id, user_id, status')
                .eq('email', nomineeEmail)
                .eq('status', 'verified')
                .is('deleted_at', null)
                .single();

            if (nomineeError || !nominee) {
                Alert.alert('Error', 'Email not found or not verified as a nominee');
                setLoading(false);
                return;
            }

            // Check if emergency access is granted
            const { data: trigger, error: triggerError } = await supabase
                .from('inactivity_triggers')
                .select('emergency_access_granted')
                .eq('user_id', nominee.user_id)
                .eq('is_active', true)
                .single();

            if (triggerError || !trigger || !trigger.emergency_access_granted) {
                Alert.alert('Access Denied', 'Emergency access has not been granted for this account yet');
                setLoading(false);
                return;
            }

            // Send OTP
            const { error: otpError } = await supabase.functions.invoke('send-emergency-otp', {
                body: { nomineeEmail },
            });

            if (otpError) {
                console.error('Error sending OTP:', otpError);
                Alert.alert('Error', 'Failed to send OTP. Please try again.');
                setLoading(false);
                return;
            }

            setUserId(nominee.user_id);
            setStep('otp');
            Alert.alert('OTP Sent', 'A verification code has been sent to your email');
        } catch (error: any) {
            console.error('Error:', error);
            Alert.alert('Error', error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPVerify = async () => {
        if (!otpCode || otpCode.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            // Verify OTP
            const { data: otpRecord, error: otpError } = await supabase
                .from('otp_verifications')
                .select('*')
                .eq('nominee_email', nomineeEmail)
                .eq('otp_code', otpCode)
                .is('verified_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (otpError || !otpRecord) {
                Alert.alert('Error', 'Invalid or expired OTP');
                setLoading(false);
                return;
            }

            // Mark OTP as verified
            await supabase
                .from('otp_verifications')
                .update({ verified_at: new Date().toISOString() })
                .eq('id', otpRecord.id);

            // Get nominee's access controls
            const { data: nominee } = await supabase
                .from('nominees')
                .select('id')
                .eq('email', nomineeEmail)
                .single();

            if (!nominee) {
                Alert.alert('Error', 'Nominee not found');
                setLoading(false);
                return;
            }

            const { data: controls } = await supabase
                .from('access_controls')
                .select('access_level, resource_id, resource_type')
                .eq('nominee_id', nominee.id);

            // Get documents this nominee has access to
            const documentIds = controls
                ?.filter((c: any) => c.resource_type === 'document')
                .map((c: any) => c.resource_id) || [];

            if (documentIds.length === 0) {
                Alert.alert('Info', 'No documents have been shared with you');
                setStep('documents');
                setLoading(false);
                return;
            }

            const { data: docs, error: docsError } = await supabase
                .from('documents')
                .select('*')
                .in('id', documentIds)
                .is('deleted_at', null);

            if (docsError) {
                console.error('Error fetching documents:', docsError);
                Alert.alert('Error', 'Failed to load documents');
                setLoading(false);
                return;
            }

            setDocuments(docs || []);
            setAccessControls(controls || []);
            setStep('documents');
            Alert.alert('Success', 'Access verified successfully');
        } catch (error: any) {
            console.error('Error:', error);
            Alert.alert('Error', error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const canDownload = (documentId: string) => {
        const control = accessControls.find((c) => c.resource_id === documentId);
        return control?.access_level === 'download' || control?.access_level === 'view';
    };

    const handleViewDocument = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.file_url, 3600);

            if (error) throw error;

            Linking.openURL(data.signedUrl);
        } catch (error) {
            console.error('Error viewing document:', error);
            Alert.alert('Error', 'Failed to open document');
        }
    };

    const handleDownloadDocument = async (doc: Document) => {
        if (!canDownload(doc.id)) {
            Alert.alert('Error', "You don't have download permission for this document");
            return;
        }

        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.file_url, 3600);

            if (error) throw error;

            Linking.openURL(data.signedUrl);
            Alert.alert('Success', 'Document download started');
        } catch (error) {
            console.error('Error downloading document:', error);
            Alert.alert('Error', 'Failed to download document');
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (bytes === null) return 'Unknown size';
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Render Email Step
    const renderEmailStep = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Mail size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Enter Your Email</Text>
            </View>
            <Text style={styles.cardDescription}>
                We'll verify if you have emergency access and send you an OTP
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nominee Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={nomineeEmail}
                    onChangeText={setNomineeEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleEmailSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <Text style={styles.primaryButtonText}>Continue</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} onPress={handleCancel}>
                    <X size={16} color={colors.foreground} />
                    <Text style={styles.outlineButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render OTP Step
    const renderOTPStep = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Key size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Enter OTP Code</Text>
            </View>
            <Text style={styles.cardDescription}>
                We sent a 6-digit code to {nomineeEmail}
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OTP Code</Text>
                <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={colors.mutedForeground}
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleOTPVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <Text style={styles.primaryButtonText}>Verify OTP</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} onPress={handleBackToEmail}>
                    <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render Documents Step
    const renderDocumentsStep = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <FileText size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Shared Documents</Text>
            </View>
            <Text style={styles.cardDescription}>
                Documents you have emergency access to
            </Text>

            {documents.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No documents have been shared with you</Text>
                    <TouchableOpacity style={styles.outlineButton} onPress={handleCancel}>
                        <LogOut size={16} color={colors.foreground} />
                        <Text style={styles.outlineButtonText}>Exit Portal</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.documentsList}>
                    {documents.map((doc) => (
                        <View key={doc.id} style={styles.documentItem}>
                            <View style={styles.documentInfo}>
                                <FileText size={20} color={colors.mutedForeground} />
                                <View style={styles.documentDetails}>
                                    <Text style={styles.documentName} numberOfLines={1}>
                                        {doc.file_name}
                                    </Text>
                                    <Text style={styles.documentMeta}>
                                        {formatFileSize(doc.file_size)} • {formatDate(doc.uploaded_at)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.documentActions}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => handleViewDocument(doc)}
                                >
                                    <Eye size={18} color={colors.foreground} />
                                </TouchableOpacity>
                                {canDownload(doc.id) && (
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleDownloadDocument(doc)}
                                    >
                                        <Download size={18} color={colors.foreground} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    <View style={styles.exitSection}>
                        <TouchableOpacity style={styles.exitButton} onPress={handleCancel}>
                            <LogOut size={16} color={colors.foreground} />
                            <Text style={styles.exitButtonText}>Exit Portal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={handleCancel}>
                        <ArrowLeft color={colors.foreground} size={20} />
                    </Pressable>
                </View>

                {/* Icon and Title */}
                <View style={styles.iconSection}>
                    <View style={styles.iconCircle}>
                        <Shield size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Emergency Access Portal</Text>
                    <Text style={styles.subtitle}>
                        Verify your identity to access shared documents
                    </Text>
                </View>

                {/* Steps */}
                {step === 'email' && renderEmailStep()}
                {step === 'otp' && renderOTPStep()}
                {step === 'documents' && renderDocumentsStep()}

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>About Emergency Access</Text>
                    <Text style={styles.infoText}>
                        This portal is activated when a Family Vault user has been inactive for an
                        extended period. Only verified nominees with explicitly granted permissions
                        can access shared documents.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing[4],
        paddingBottom: spacing[10],
    },
    header: {
        marginBottom: spacing[4],
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSection: {
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    title: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing[4],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    cardTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    cardDescription: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginBottom: spacing[4],
    },
    inputGroup: {
        marginBottom: spacing[4],
    },
    inputLabel: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: fontSize.md.size,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    otpInput: {
        textAlign: 'center',
        fontSize: fontSize.xl.size,
        letterSpacing: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    primaryButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
    },
    outlineButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing[6],
        gap: spacing[4],
    },
    emptyText: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
    },
    documentsList: {
        gap: spacing[3],
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        flex: 1,
    },
    documentDetails: {
        flex: 1,
    },
    documentName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    documentMeta: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    documentActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exitSection: {
        marginTop: spacing[4],
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    exitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingVertical: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
    },
    exitButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    infoBox: {
        backgroundColor: colors.muted,
        borderRadius: radius.xl,
        padding: spacing[4],
    },
    infoTitle: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    infoText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
});
