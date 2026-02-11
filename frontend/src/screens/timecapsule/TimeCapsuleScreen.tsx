import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Clock,
    Send,
    Edit2,
    Trash2,
    Plus,
    Info,
    Calendar,
    Camera,
    X,
    Paperclip,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface TimeCapsule {
    id: string;
    title: string;
    message: string;
    release_date: string;
    recipient_email: string;
    phone: string | null;
    status: string;
    attachment_url: string | null;
    created_at: string;
}

export const TimeCapsuleScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; capsule: TimeCapsule | null }>({
        show: false,
        capsule: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        releaseDate: '',
        recipientEmail: '',
        phone: '',
    });

    // Load capsules
    const loadCapsules = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('time_capsules')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Map data with default status to satisfy TypeScript
            const mappedData: TimeCapsule[] = (data || []).map(item => ({
                ...item,
                status: item.status || 'scheduled',
                message: item.message || '',
            }));
            setCapsules(mappedData);
        } catch (error: any) {
            console.error('Error loading capsules:', error);
            Alert.alert('Error', error.message || 'Failed to load time capsules');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadCapsules();
    }, [loadCapsules]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadCapsules();
        setRefreshing(false);
    }, [loadCapsules]);

    // Stats
    const scheduledCount = capsules.filter(c => c.status === 'scheduled').length;
    const releasedCount = capsules.filter(c => c.status === 'released').length;

    // Validate Gmail
    const validateGmail = (email: string) => {
        return email.toLowerCase().endsWith('@gmail.com');
    };

    // Validate phone
    const validatePhone = (phone: string) => {
        return /^\d{10}$/.test(phone);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get tomorrow's date as min date
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Handle create/edit
    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.releaseDate || !formData.recipientEmail.trim()) {
            Alert.alert('Error', 'Title, release date, and recipient email are required');
            return;
        }

        // Validate future date
        const selectedDate = new Date(formData.releaseDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            Alert.alert('Error', 'Release date must be in the future');
            return;
        }

        if (!validateGmail(formData.recipientEmail)) {
            Alert.alert('Error', 'Only Gmail addresses are allowed');
            return;
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            Alert.alert('Error', 'Phone must be exactly 10 digits');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Please sign in');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                // Update existing
                const { error } = await supabase
                    .from('time_capsules')
                    .update({
                        title: formData.title.trim(),
                        message: formData.message.trim(),
                        release_date: formData.releaseDate,
                        recipient_email: formData.recipientEmail.trim().toLowerCase(),
                        phone: formData.phone || null,
                    })
                    .eq('id', editingId)
                    .eq('user_id', user.id);

                if (error) throw error;

                // Optimistic update
                setCapsules(prev =>
                    prev.map(c =>
                        c.id === editingId
                            ? {
                                ...c,
                                title: formData.title.trim(),
                                message: formData.message.trim(),
                                release_date: formData.releaseDate,
                                recipient_email: formData.recipientEmail.trim().toLowerCase(),
                                phone: formData.phone || null,
                            }
                            : c
                    )
                );

                Alert.alert('Success', 'Time capsule updated');
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('time_capsules')
                    .insert({
                        user_id: user.id,
                        title: formData.title.trim(),
                        message: formData.message.trim(),
                        release_date: formData.releaseDate,
                        recipient_email: formData.recipientEmail.trim().toLowerCase(),
                        phone: formData.phone || null,
                        status: 'scheduled',
                    })
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    const newCapsule: TimeCapsule = {
                        ...data,
                        status: data.status || 'scheduled',
                        message: data.message || '',
                    };
                    setCapsules(prev => [newCapsule, ...prev]);
                }

                Alert.alert('Success', 'Time capsule created');
            }

            resetForm();
        } catch (error: any) {
            console.error('Error saving capsule:', error);
            Alert.alert('Error', error.message || 'Failed to save time capsule');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit
    const handleEdit = (capsule: TimeCapsule) => {
        setFormData({
            title: capsule.title,
            message: capsule.message || '',
            releaseDate: capsule.release_date,
            recipientEmail: capsule.recipient_email,
            phone: capsule.phone || '',
        });
        setEditingId(capsule.id);
        setShowCreateForm(true);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteDialog.capsule || !user) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('time_capsules')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', deleteDialog.capsule.id)
                .eq('user_id', user.id);

            if (error) throw error;

            setCapsules(prev => prev.filter(c => c.id !== deleteDialog.capsule?.id));
            Alert.alert('Success', 'Time capsule deleted');
            setDeleteDialog({ show: false, capsule: null });
        } catch (error: any) {
            console.error('Error deleting capsule:', error);
            Alert.alert('Error', error.message || 'Failed to delete time capsule');
        } finally {
            setIsDeleting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ title: '', message: '', releaseDate: '', recipientEmail: '', phone: '' });
        setEditingId(null);
        setShowCreateForm(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ArrowLeft color={colors.foreground} size={20} />
                        </Pressable>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Time Capsule</Text>
                            <Text style={styles.headerSubtitle}>Schedule messages for the future</Text>
                        </View>
                        <View style={{ width: 36 }} />
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#2563EB' }]}>{scheduledCount}</Text>
                            <Text style={styles.statLabel}>Scheduled</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#16A34A' }]}>{releasedCount}</Text>
                            <Text style={styles.statLabel}>Released</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Create Form */}
                    {showCreateForm && (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>
                                {editingId ? '✏️ Edit Time Capsule' : '+ Create New'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Title *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter a title for your capsule"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.title}
                                    onChangeText={text => setFormData({ ...formData, title: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Message</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Write your message..."
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.message}
                                    onChangeText={text => setFormData({ ...formData, message: text })}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Release Date *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.releaseDate}
                                    onChangeText={text => setFormData({ ...formData, releaseDate: text })}
                                />
                                <Text style={styles.inputHint}>Must be a future date (e.g., 2025-12-31)</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Recipient Email * (Gmail only)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="example@gmail.com"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.recipientEmail}
                                    onChangeText={text => setFormData({ ...formData, recipientEmail: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="9876543210"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.phone}
                                    onChangeText={text => {
                                        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                                        setFormData({ ...formData, phone: cleaned });
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                                <Text style={styles.inputHint}>10 digits only</Text>
                            </View>

                            <View style={styles.formButtons}>
                                <TouchableOpacity
                                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    <Send size={18} color={colors.primaryForeground} />
                                    <Text style={styles.submitButtonText}>
                                        {isSubmitting
                                            ? 'Saving...'
                                            : editingId
                                                ? 'Update Capsule'
                                                : 'Create Capsule'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Capsules List */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Your Time Capsules</Text>
                            {capsules.length > 0 && !showCreateForm && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setShowCreateForm(true)}
                                >
                                    <Plus size={16} color={colors.primaryForeground} />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {capsules.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Clock size={48} color={colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No Time Capsules Yet</Text>
                                <Text style={styles.emptyText}>
                                    Create your first time capsule to send messages to the future
                                </Text>
                                {!showCreateForm && (
                                    <TouchableOpacity
                                        style={styles.emptyButton}
                                        onPress={() => setShowCreateForm(true)}
                                    >
                                        <Text style={styles.emptyButtonText}>+ Create Time Capsule</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.capsulesList}>
                                {capsules.map(capsule => (
                                    <View
                                        key={capsule.id}
                                        style={[
                                            styles.capsuleCard,
                                            {
                                                borderLeftColor:
                                                    capsule.status === 'released' ? '#16A34A' : '#2563EB',
                                            },
                                        ]}
                                    >
                                        {/* Header: Status + Actions */}
                                        <View style={styles.capsuleHeader}>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    capsule.status === 'released'
                                                        ? styles.releasedBadge
                                                        : styles.scheduledBadge,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        capsule.status === 'released'
                                                            ? styles.releasedText
                                                            : styles.scheduledText,
                                                    ]}
                                                >
                                                    {capsule.status === 'released' ? '✓ Released' : '⏳ Scheduled'}
                                                </Text>
                                            </View>

                                            {capsule.status !== 'released' && (
                                                <View style={styles.capsuleActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => handleEdit(capsule)}
                                                    >
                                                        <Edit2 size={18} color="#2563EB" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() =>
                                                            setDeleteDialog({ show: true, capsule })
                                                        }
                                                    >
                                                        <Trash2 size={18} color="#DC2626" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>

                                        {/* Title + Attachment */}
                                        <View style={styles.capsuleTitleRow}>
                                            <Text style={styles.capsuleTitle}>{capsule.title}</Text>
                                            {capsule.attachment_url && (
                                                <View style={styles.attachmentBadge}>
                                                    <Paperclip size={12} color="#6B7280" />
                                                    <Text style={styles.attachmentText}>Attachment</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Message Preview */}
                                        {capsule.message && (
                                            <View style={styles.messagePreview}>
                                                <Text style={styles.messageText} numberOfLines={2}>
                                                    "{capsule.message}"
                                                </Text>
                                            </View>
                                        )}

                                        {/* Details */}
                                        <View style={styles.capsuleDetails}>
                                            <View style={styles.detailRow}>
                                                <Clock size={16} color={colors.mutedForeground} />
                                                <Text style={styles.detailText}>
                                                    {capsule.status === 'released' ? 'Released: ' : 'Releases: '}
                                                    {formatDate(capsule.release_date)}
                                                </Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Send size={16} color={colors.mutedForeground} />
                                                <Text style={styles.detailText} numberOfLines={1}>
                                                    {capsule.recipient_email}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoIcon}>
                            <Info size={18} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>About Time Capsules</Text>
                            <Text style={styles.infoText}>
                                Time capsules are automatically delivered to recipients on the scheduled
                                release date via email. They're stored securely and can include
                                attachments.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteDialog.show} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteContent}>
                        <Text style={styles.deleteTitle}>Delete Time Capsule?</Text>
                        <Text style={styles.deleteText}>
                            Are you sure you want to delete "{deleteDialog.capsule?.title}"? This action
                            cannot be undone.
                        </Text>
                        <View style={styles.deleteButtons}>
                            <TouchableOpacity
                                style={styles.deleteCancelBtn}
                                onPress={() => setDeleteDialog({ show: false, capsule: null })}
                            >
                                <Text style={styles.deleteCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteConfirmBtn, isDeleting && styles.buttonDisabled]}
                                onPress={handleDelete}
                                disabled={isDeleting}
                            >
                                <Text style={styles.deleteConfirmText}>
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing[6],
    },
    header: {
        backgroundColor: `${colors.primary}20`,
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[4],
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    headerSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing[3],
        marginTop: spacing[3],
    },
    statCard: {
        flex: 1,
        backgroundColor: `${colors.card}80`,
        borderRadius: radius.xl,
        padding: spacing[3],
        alignItems: 'center',
    },
    statValue: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
    },
    statLabel: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    content: {
        padding: spacing[4],
    },
    formCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    formTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[4],
    },
    inputGroup: {
        marginBottom: spacing[3],
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
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputHint: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    formButtons: {
        flexDirection: 'column',
        gap: spacing[2],
        marginTop: spacing[3],
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
    },
    submitButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    section: {
        marginTop: spacing[2],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    sectionTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        backgroundColor: colors.primary,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radius.xl,
    },
    addButtonText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.primaryForeground,
    },
    emptyState: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[6],
        alignItems: 'center',
    },
    emptyIcon: {
        width: 96,
        height: 96,
        backgroundColor: `${colors.primary}10`,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    emptyTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    emptyText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    emptyButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        borderRadius: radius.xl,
    },
    emptyButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    capsulesList: {
        gap: spacing[3],
    },
    capsuleCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        borderLeftWidth: 4,
    },
    capsuleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    statusBadge: {
        paddingHorizontal: spacing[2],
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    scheduledBadge: {
        backgroundColor: '#DBEAFE',
    },
    releasedBadge: {
        backgroundColor: '#DCFCE7',
    },
    statusText: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
    },
    scheduledText: {
        color: '#2563EB',
    },
    releasedText: {
        color: '#16A34A',
    },
    capsuleActions: {
        flexDirection: 'row',
        gap: spacing[1],
    },
    actionButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    capsuleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    capsuleTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        flex: 1,
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    attachmentText: {
        fontSize: fontSize.xs.size,
        color: '#6B7280',
    },
    messagePreview: {
        backgroundColor: `${colors.muted}30`,
        borderRadius: radius.lg,
        padding: spacing[2],
        marginBottom: spacing[3],
    },
    messageText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        fontStyle: 'italic',
    },
    capsuleDetails: {
        gap: spacing[1],
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    detailText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: `${colors.primary}05`,
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        gap: spacing[3],
        marginTop: spacing[4],
    },
    infoIcon: {
        width: 32,
        height: 32,
        backgroundColor: `${colors.primary}20`,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    infoText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    deleteContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        width: '100%',
        maxWidth: 340,
    },
    deleteTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    deleteText: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        marginBottom: spacing[4],
    },
    deleteButtons: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    deleteCancelBtn: {
        flex: 1,
        paddingVertical: spacing[3],
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
    },
    deleteCancelText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    deleteConfirmBtn: {
        flex: 1,
        paddingVertical: spacing[3],
        alignItems: 'center',
        backgroundColor: '#DC2626',
        borderRadius: radius.lg,
    },
    deleteConfirmText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: '#FFFFFF',
    },
});
