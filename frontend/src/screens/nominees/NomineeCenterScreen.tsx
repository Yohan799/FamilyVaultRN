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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Users,
    Mail,
    Phone,
    CheckCircle,
    Clock,
    Edit2,
    Trash2,
    RefreshCw,
    Plus,
    X,
    User,
    ChevronDown,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Nominee {
    id: string;
    full_name: string;
    relation: string;
    email: string;
    phone: string | null;
    status: string;
    verified_at: string | null;
    avatar_url: string | null;
}

const RELATIONS = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' },
];

export const NomineeCenterScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [nominees, setNominees] = useState<Nominee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendingId, setResendingId] = useState<string | null>(null);

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; nominee: Nominee | null }>({
        show: false,
        nominee: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Relation picker state
    const [showRelationPicker, setShowRelationPicker] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        fullName: '',
        relation: '',
        email: '',
        phone: '',
    });

    // Load nominees
    const loadNominees = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('nominees')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Map data with default status to satisfy TypeScript
            const mappedData: Nominee[] = (data || []).map(item => ({
                ...item,
                status: item.status || 'pending',
                relation: item.relation || 'other',
            }));
            setNominees(mappedData);
        } catch (error: any) {
            console.error('Error loading nominees:', error);
            Alert.alert('Error', error.message || 'Failed to load nominees');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadNominees();
    }, [loadNominees]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNominees();
        setRefreshing(false);
    }, [loadNominees]);

    // Stats
    const totalNominees = nominees.length;
    const verifiedNominees = nominees.filter(n => n.status === 'verified').length;
    const pendingNominees = nominees.filter(n => n.status === 'pending').length;

    // Validate Gmail
    const validateGmail = (email: string) => {
        return email.toLowerCase().endsWith('@gmail.com');
    };

    // Validate phone (10 digits)
    const validatePhone = (phone: string) => {
        return /^\d{10}$/.test(phone);
    };

    // Handle add/edit nominee
    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.email.trim()) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }

        if (!validateGmail(formData.email)) {
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
                    .from('nominees')
                    .update({
                        full_name: formData.fullName.trim(),
                        relation: formData.relation || 'Other',
                        email: formData.email.trim().toLowerCase(),
                        phone: formData.phone || null,
                    })
                    .eq('id', editingId)
                    .eq('user_id', user.id);

                if (error) throw error;

                // Optimistic update
                setNominees(prev =>
                    prev.map(n =>
                        n.id === editingId
                            ? {
                                ...n,
                                full_name: formData.fullName.trim(),
                                relation: formData.relation || 'Other',
                                email: formData.email.trim().toLowerCase(),
                                phone: formData.phone || null,
                            }
                            : n
                    )
                );

                Alert.alert('Success', 'Nominee updated');
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('nominees')
                    .insert({
                        user_id: user.id,
                        full_name: formData.fullName.trim(),
                        relation: formData.relation || 'Other',
                        email: formData.email.trim().toLowerCase(),
                        phone: formData.phone || null,
                        status: 'pending',
                    })
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    const newNominee: Nominee = {
                        ...data,
                        status: data.status || 'pending',
                        relation: data.relation || 'other',
                    };
                    setNominees(prev => [newNominee, ...prev]);
                }

                Alert.alert('Success', 'Nominee added');
            }

            resetForm();
        } catch (error: any) {
            console.error('Error saving nominee:', error);
            Alert.alert('Error', error.message || 'Failed to save nominee');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle resend verification
    const handleResend = async (nominee: Nominee) => {
        if (!user) return;

        setResendingId(nominee.id);
        try {
            const { error } = await supabase.functions.invoke('send-nominee-verification', {
                body: {
                    nomineeId: nominee.id,
                    nomineeEmail: nominee.email,
                    nomineeName: nominee.full_name,
                    userId: user.id,
                },
            });

            if (error) throw error;

            Alert.alert('Success', `Verification link sent to ${nominee.email}`);
        } catch (error: any) {
            console.error('Error resending verification:', error);
            Alert.alert('Error', error.message || 'Failed to resend verification');
        } finally {
            setResendingId(null);
        }
    };

    // Handle edit
    const handleEdit = (nominee: Nominee) => {
        setFormData({
            fullName: nominee.full_name,
            relation: nominee.relation || '',
            email: nominee.email,
            phone: nominee.phone || '',
        });
        setEditingId(nominee.id);
        setShowAddForm(true);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteDialog.nominee || !user) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('soft_delete_nominee', {
                _nominee_id: deleteDialog.nominee.id,
                _user_id: user.id,
            });

            if (error) throw error;

            setNominees(prev => prev.filter(n => n.id !== deleteDialog.nominee?.id));
            Alert.alert('Success', 'Nominee deleted');
            setDeleteDialog({ show: false, nominee: null });
        } catch (error: any) {
            console.error('Error deleting nominee:', error);
            Alert.alert('Error', error.message || 'Failed to delete nominee');
        } finally {
            setIsDeleting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ fullName: '', relation: '', email: '', phone: '' });
        setEditingId(null);
        setShowAddForm(false);
    };

    // Get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
                            <Text style={styles.headerTitle}>Nominee Center</Text>
                            <Text style={styles.headerSubtitle}>Manage trusted contacts</Text>
                        </View>
                        <View style={{ width: 36 }} />
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{totalNominees}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#16A34A' }]}>{verifiedNominees}</Text>
                            <Text style={styles.statLabel}>Verified</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#EA580C' }]}>{pendingNominees}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Add Form */}
                    {showAddForm && (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>
                                {editingId ? '✏️ Edit Nominee' : '+ Add New Nominee'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.fullName}
                                    onChangeText={text => setFormData({ ...formData, fullName: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Relation</Text>
                                <Pressable
                                    style={styles.selectInput}
                                    onPress={() => setShowRelationPicker(true)}
                                >
                                    <Text
                                        style={[
                                            styles.selectText,
                                            !formData.relation && { color: colors.mutedForeground },
                                        ]}
                                    >
                                        {formData.relation
                                            ? RELATIONS.find(r => r.value === formData.relation)?.label
                                            : 'Select relation'}
                                    </Text>
                                    <ChevronDown size={20} color={colors.mutedForeground} />
                                </Pressable>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email * (Gmail only)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="example@gmail.com"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={formData.email}
                                    onChangeText={text => setFormData({ ...formData, email: text })}
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
                                    <Text style={styles.submitButtonText}>
                                        {isSubmitting
                                            ? 'Saving...'
                                            : editingId
                                                ? 'Update Nominee'
                                                : 'Add & Send Verification'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Nominees List */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Your Nominees</Text>
                            {nominees.length > 0 && !showAddForm && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setShowAddForm(true)}
                                >
                                    <Plus size={16} color={colors.primaryForeground} />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {nominees.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Users size={48} color={colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No Nominees Yet</Text>
                                <Text style={styles.emptyText}>
                                    Add trusted contacts who can access your vault in emergencies
                                </Text>
                                {!showAddForm && (
                                    <TouchableOpacity
                                        style={styles.emptyButton}
                                        onPress={() => setShowAddForm(true)}
                                    >
                                        <Text style={styles.emptyButtonText}>+ Add Nominee</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.nomineesList}>
                                {nominees.map(nominee => (
                                    <View key={nominee.id} style={styles.nomineeCard}>
                                        {/* Avatar */}
                                        <View style={styles.nomineeAvatar}>
                                            <Text style={styles.nomineeInitials}>
                                                {getInitials(nominee.full_name)}
                                            </Text>
                                        </View>

                                        {/* Info */}
                                        <View style={styles.nomineeInfo}>
                                            <View style={styles.nomineeNameRow}>
                                                <Text style={styles.nomineeName} numberOfLines={1}>
                                                    {nominee.full_name}
                                                </Text>
                                                {nominee.status === 'verified' ? (
                                                    <View style={styles.verifiedBadge}>
                                                        <CheckCircle size={12} color="#16A34A" />
                                                        <Text style={styles.verifiedText}>Verified</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.pendingBadge}>
                                                        <Clock size={12} color="#EA580C" />
                                                        <Text style={styles.pendingText}>Pending</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.nomineeEmail} numberOfLines={1}>
                                                {nominee.email}
                                            </Text>
                                            <Text style={styles.nomineeRelation}>
                                                {nominee.relation || 'Other'}
                                            </Text>
                                        </View>

                                        {/* Actions */}
                                        <View style={styles.nomineeActions}>
                                            {nominee.status === 'pending' && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleResend(nominee)}
                                                    disabled={resendingId === nominee.id}
                                                >
                                                    <RefreshCw
                                                        size={18}
                                                        color={colors.primary}
                                                        style={resendingId === nominee.id ? { opacity: 0.5 } : undefined}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => handleEdit(nominee)}
                                            >
                                                <Edit2 size={18} color={colors.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => setDeleteDialog({ show: true, nominee })}
                                            >
                                                <Trash2 size={18} color="#DC2626" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Relation Picker Modal */}
            <Modal visible={showRelationPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Relation</Text>
                        {RELATIONS.map(relation => (
                            <TouchableOpacity
                                key={relation.value}
                                style={[
                                    styles.pickerItem,
                                    formData.relation === relation.value && styles.pickerItemSelected,
                                ]}
                                onPress={() => {
                                    setFormData({ ...formData, relation: relation.value });
                                    setShowRelationPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        formData.relation === relation.value && styles.pickerItemTextSelected,
                                    ]}
                                >
                                    {relation.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.pickerCancel}
                            onPress={() => setShowRelationPicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteDialog.show} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteContent}>
                        <Text style={styles.deleteTitle}>Delete Nominee?</Text>
                        <Text style={styles.deleteText}>
                            Are you sure you want to remove {deleteDialog.nominee?.full_name} from your
                            nominees? This action cannot be undone.
                        </Text>
                        <View style={styles.deleteButtons}>
                            <TouchableOpacity
                                style={styles.deleteCancelBtn}
                                onPress={() => setDeleteDialog({ show: false, nominee: null })}
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
        gap: spacing[2],
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
        color: colors.foreground,
    },
    statLabel: {
        fontSize: fontSize.xs.size,
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
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectText: {
        fontSize: fontSize.md.size,
        color: colors.foreground,
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
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[3],
        alignItems: 'center',
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
    nomineesList: {
        gap: spacing[2],
    },
    nomineeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[3],
        gap: spacing[3],
    },
    nomineeAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nomineeInitials: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    nomineeInfo: {
        flex: 1,
        minWidth: 0,
    },
    nomineeNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        flexWrap: 'wrap',
    },
    nomineeName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    verifiedText: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
        color: '#16A34A',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFEDD5',
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    pendingText: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
        color: '#EA580C',
    },
    nomineeEmail: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    nomineeRelation: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    nomineeActions: {
        flexDirection: 'row',
        gap: spacing[1],
    },
    actionButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    pickerContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        width: '100%',
        maxWidth: 320,
    },
    pickerTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
        textAlign: 'center',
    },
    pickerItem: {
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: radius.lg,
    },
    pickerItemSelected: {
        backgroundColor: `${colors.primary}10`,
    },
    pickerItemText: {
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    pickerItemTextSelected: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
    pickerCancel: {
        marginTop: spacing[3],
        paddingVertical: spacing[3],
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    pickerCancelText: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
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
