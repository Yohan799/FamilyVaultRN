import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Search,
    Plus,
    Folder,
    X,
    AlertTriangle,
    ArrowLeft,
    Upload,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubcategories, useInvalidateVault, ProcessedSubcategory, useUploadDocument } from '@/hooks/useVaultData';
import { vaultCategories } from '@/data/vaultCategories';
import { supabase } from '@/lib/supabase';
import { deleteSubcategoryWithCascade } from '@/services/vaultService';
import { VaultStackParamList } from '@/navigation/RootNavigator';
import { UploadModal } from '@/components/vault/UploadModal';

type CategoryViewScreenRouteProp = RouteProp<VaultStackParamList, 'CategoryView'>;
type CategoryViewScreenNavigationProp = NativeStackNavigationProp<VaultStackParamList, 'CategoryView'>;

// Icon mapping for subcategories
const getSubcategoryIcon = (iconName: string | undefined) => {
    // Default to Folder for now
    return Folder;
};

export const CategoryViewScreen: React.FC = () => {
    const navigation = useNavigation<CategoryViewScreenNavigationProp>();
    const route = useRoute<CategoryViewScreenRouteProp>();
    const { categoryId } = route.params;
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [subcategoryName, setSubcategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; subcategory: ProcessedSubcategory | null }>({
        show: false,
        subcategory: null,
    });
    const [customCategoryName, setCustomCategoryName] = useState('');

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();

    const handleUpload = (file: any) => {
        uploadDoc({
            file,
            categoryId,
            // No subcategory or folder for direct category uploads (if supported)
            // or maybe we shouldn't allow uploads here if there's no target?
            // Assuming requirement implies uploading to "root" of category or just general upload.
            // If subcategoryId is required by backend, this might fail.
            // But let's implementing it as requested.
        }, {
            onSuccess: () => {
                Alert.alert('Success', 'Document uploaded successfully');
            },
            onError: (error) => {
                Alert.alert('Error', 'Failed to upload document');
                console.error(error);
            }
        });
    };

    const userId = user?.id;

    // Fetch subcategories
    const { data: subcategoryData, isLoading, refetch } = useSubcategories(userId, categoryId);
    const { invalidateSubcategories } = useInvalidateVault();

    const subcategories = subcategoryData?.subcategories ?? [];
    const totalDocumentCount = subcategoryData?.totalDocCount ?? 0;

    // Get category info
    const category = useMemo(() => {
        const defaultCategory = vaultCategories.find(cat => cat.id === categoryId);
        if (defaultCategory) {
            return {
                id: defaultCategory.id,
                name: defaultCategory.name,
                icon: defaultCategory.icon,
                isCustom: false,
            };
        }
        return {
            id: categoryId,
            name: customCategoryName || 'Category',
            icon: Folder,
            isCustom: true,
        };
    }, [categoryId, customCategoryName]);

    // Fetch custom category name if needed
    useEffect(() => {
        if (category.isCustom && userId && categoryId) {
            supabase
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .eq('user_id', userId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setCustomCategoryName(data.name);
                    }
                });
        }
    }, [category.isCustom, userId, categoryId]);

    // Filtered subcategories
    const filteredSubcategories = useMemo(() => {
        if (!searchQuery.trim()) return subcategories;
        const query = searchQuery.toLowerCase().trim();
        return subcategories.filter(sub => sub.name.toLowerCase().includes(query));
    }, [subcategories, searchQuery]);

    // Handle add subcategory
    const handleAddSubcategory = useCallback(async () => {
        if (!subcategoryName.trim() || !userId || !categoryId) return;

        const sanitizedName = subcategoryName.trim();
        if (sanitizedName.length < 2 || sanitizedName.length > 50) {
            Alert.alert('Validation Error', 'Name must be between 2 and 50 characters');
            return;
        }

        const isDuplicate = subcategories.some(
            sub => sub.name.toLowerCase() === sanitizedName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert('Error', 'Subcategory already exists');
            return;
        }

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('subcategories')
                .insert({
                    user_id: userId,
                    category_id: categoryId,
                    name: sanitizedName,
                    is_custom: true,
                });

            if (error) throw error;

            invalidateSubcategories(userId, categoryId);
            setSubcategoryName('');
            setShowAddDialog(false);
            Alert.alert('Success', `${sanitizedName} has been added`);
        } catch (error: any) {
            console.error('Error adding subcategory:', error);
            Alert.alert('Error', 'Failed to create subcategory');
        } finally {
            setIsAdding(false);
        }
    }, [subcategoryName, userId, categoryId, subcategories, invalidateSubcategories]);

    // Handle delete subcategory
    const handleDeleteClick = useCallback((subcategory: ProcessedSubcategory) => {
        if (!subcategory.isCustom) {
            Alert.alert('Cannot delete', 'Default subcategories cannot be deleted');
            return;
        }
        setDeleteConfirm({ show: true, subcategory });
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteConfirm.subcategory || !userId || !categoryId) return;

        try {
            await deleteSubcategoryWithCascade(
                deleteConfirm.subcategory.id,
                categoryId,
                userId
            );

            invalidateSubcategories(userId, categoryId);
            Alert.alert('Success', `${deleteConfirm.subcategory.name} has been deleted`);
            setDeleteConfirm({ show: false, subcategory: null });
        } catch (error: any) {
            console.error('Error deleting subcategory:', error);
            Alert.alert('Error', 'Failed to delete subcategory');
        }
    }, [deleteConfirm.subcategory, userId, categoryId, invalidateSubcategories]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <View style={styles.titleRow}>
                            <Folder size={24} color={colors.foreground} />
                            <Text style={styles.headerTitle}>
                                {category.isCustom && customCategoryName
                                    ? customCategoryName
                                    : category.name}
                            </Text>
                        </View>
                        <Text style={styles.documentCount}>
                            {totalDocumentCount} Documents
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => setShowUploadModal(true)}
                    >
                        <Upload size={24} color={colors.foreground} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search subcategories..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Subcategory Grid */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                    />
                }
            >
                {filteredSubcategories.length === 0 && searchQuery ? (
                    <View style={styles.emptyState}>
                        <Folder size={64} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No results found</Text>
                        <Text style={styles.emptySubtitle}>Try a different search term</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredSubcategories.map((subcategory) => {
                            const SubIcon = getSubcategoryIcon(undefined);
                            return (
                                <TouchableOpacity
                                    key={subcategory.id}
                                    style={styles.subcategoryCard}
                                    onPress={() =>
                                        navigation.navigate('SubcategoryView', {
                                            categoryId,
                                            subcategoryId: subcategory.id,
                                        })
                                    }
                                    onLongPress={() => handleDeleteClick(subcategory)}
                                >
                                    <View style={styles.iconWrapper}>
                                        <SubIcon size={32} color={colors.primary} strokeWidth={1.5} />
                                    </View>
                                    <Text style={styles.subcategoryName} numberOfLines={2}>
                                        {subcategory.name}
                                    </Text>
                                    <Text style={styles.subcategoryDocs}>
                                        {subcategory.documentCount} Documents
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Add Subcategory Button */}
                        {!searchQuery && (
                            <TouchableOpacity
                                style={styles.addCard}
                                onPress={() => setShowAddDialog(true)}
                            >
                                <View style={styles.iconWrapper}>
                                    <Plus size={32} color={colors.primary} strokeWidth={1.5} />
                                </View>
                                <Text style={styles.addText}>Add Subcategory</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Add Subcategory Modal */}
            <Modal
                visible={showAddDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddDialog(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowAddDialog(false)}
                        >
                            <X size={24} color={colors.mutedForeground} />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Add Subcategory</Text>

                        <Text style={styles.inputLabel}>Subcategory Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter subcategory name"
                            placeholderTextColor={colors.mutedForeground}
                            value={subcategoryName}
                            onChangeText={setSubcategoryName}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddDialog(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createButton, isAdding && styles.buttonDisabled]}
                                onPress={handleAddSubcategory}
                                disabled={isAdding}
                            >
                                <Text style={styles.createButtonText}>
                                    {isAdding ? 'Creating...' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteConfirm.show}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteConfirm({ show: false, subcategory: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.deleteHeader}>
                            <View style={styles.warningIcon}>
                                <AlertTriangle size={24} color="#2563EB" />
                            </View>
                            <Text style={styles.modalTitle}>Delete Subcategory</Text>
                        </View>

                        <Text style={styles.deleteText}>
                            Are you sure you want to delete{' '}
                            <Text style={styles.deleteName}>
                                {deleteConfirm.subcategory?.name}
                            </Text>
                            ?
                        </Text>

                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                {deleteConfirm.subcategory?.documentCount || 0} documents will be deleted
                            </Text>
                            <Text style={styles.warningSubtext}>
                                This action cannot be undone
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteConfirm({ show: false, subcategory: null })}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Upload Modal */}
            <UploadModal
                visible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUpload}
            />

            {isUploading && (
                <View style={[styles.loadingContainer, { position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 999 }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.primary }}>Uploading...</Text>
                </View>
            )}
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    documentCount: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        height: 48,
        ...shadows.sm,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        paddingBottom: spacing.xl,
    },
    subcategoryCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        paddingVertical: spacing[6],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
        alignItems: 'center',
        ...shadows.sm,
    },
    iconWrapper: {
        marginBottom: spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
    },
    subcategoryName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subcategoryDocs: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    addCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        paddingVertical: spacing[6],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.primary,
    },
    addText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing['3xl'],
    },
    emptyTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
    },
    modalClose: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
    },
    modalTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    input: {
        height: 48,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    createButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: radius.lg,
        backgroundColor: colors.primary,
    },
    createButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.primaryForeground,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    deleteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    warningIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: {
        fontSize: fontSize.md.size,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    deleteName: {
        fontWeight: fontWeight.semibold,
    },
    warningBox: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    warningText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: '#1E40AF',
    },
    warningSubtext: {
        fontSize: fontSize.xs.size,
        color: '#2563EB',
        marginTop: spacing.xs,
    },
    deleteButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: radius.lg,
        backgroundColor: '#3B82F6',
    },
    deleteButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: '#FFFFFF',
    },
});

export default CategoryViewScreen;
