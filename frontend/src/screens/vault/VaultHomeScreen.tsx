import React, { useState, useCallback, useMemo } from 'react';
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
    Search,
    Plus,
    Home,
    Building2,
    GraduationCap,
    Shield,
    User,
    Briefcase,
    X,
    AlertTriangle,
    Folder,
} from 'lucide-react-native';
import { useVaultData, useInvalidateVault } from '@/hooks/useVaultData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { deleteCategoryWithCascade } from '@/services/vaultService';
import { colors, spacing, fontSize, fontWeight, shadows, radius } from '@/theme';
import { VaultStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<VaultStackParamList>;

// Icon mapping for category icons
const iconMap: Record<string, React.FC<{ color: string; size: number; strokeWidth: number }>> = {
    Home: Home,
    Briefcase: Briefcase,
    Building2: Building2,
    GraduationCap: GraduationCap,
    Shield: Shield,
    User: User,
};

interface CategoryItem {
    id: string;
    name: string;
    documentCount?: number;
    isCustom?: boolean;
    icon?: { name: string };
}

export const VaultHomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    const userId = user?.id;

    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Add Category Dialog State
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; category: CategoryItem | null }>({
        show: false,
        category: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const { categories, totalDocuments, isLoading, refetch } = useVaultData();
    const { invalidateCategories } = useInvalidateVault();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName] || Folder;
        return <IconComponent color={colors.primary} size={32} strokeWidth={1.5} />;
    };

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const query = searchQuery.toLowerCase().trim();
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(query)
        );
    }, [categories, searchQuery]);

    // Handle add category
    const handleAddCategory = useCallback(async () => {
        const sanitizedName = categoryName.trim();

        if (sanitizedName.length < 2 || sanitizedName.length > 50) {
            Alert.alert('Validation Error', 'Category name must be between 2 and 50 characters');
            return;
        }

        const isDuplicate = categories.some(
            cat => cat.name.toLowerCase() === sanitizedName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert('Error', 'Category already exists');
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('categories')
                .insert({
                    user_id: userId,
                    name: sanitizedName,
                    is_custom: true,
                    icon_bg_color: 'bg-yellow-100',
                });

            if (error) throw error;

            invalidateCategories(userId);
            setCategoryName('');
            setShowAddDialog(false);
            Alert.alert('Success', `${sanitizedName} has been added to your vault`);
        } catch (error: any) {
            console.error('Error adding category:', error);
            Alert.alert('Error', 'Failed to create category');
        } finally {
            setIsAdding(false);
        }
    }, [categoryName, categories, userId, invalidateCategories]);

    // Handle delete category
    const handleDeleteClick = useCallback((category: CategoryItem) => {
        if (!category.isCustom) {
            Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
            return;
        }
        setDeleteConfirm({ show: true, category });
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteConfirm.category || !userId) return;

        setIsDeleting(true);
        try {
            await deleteCategoryWithCascade(deleteConfirm.category.id, userId);
            invalidateCategories(userId);
            Alert.alert('Success', `${deleteConfirm.category.name} has been deleted`);
            setDeleteConfirm({ show: false, category: null });
        } catch (error: any) {
            console.error('Error deleting category:', error);
            Alert.alert('Error', 'Failed to delete category');
        } finally {
            setIsDeleting(false);
        }
    }, [deleteConfirm.category, userId, invalidateCategories]);

    if (isLoading && !refreshing) {
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>My Vault</Text>
                    <Text style={styles.subtitle}>{totalDocuments} Documents</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search color="#9B8FB0" size={20} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search documents, categories..."
                        placeholderTextColor="#9B8FB0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color="#9B8FB0" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Categories Grid */}
                <View style={styles.categoriesGrid}>
                    {filteredCategories.map((category) => (
                        <Pressable
                            key={category.id}
                            style={styles.categoryCard}
                            onPress={() => navigation.navigate('CategoryView', { categoryId: category.id })}
                            onLongPress={() => handleDeleteClick(category)}
                            delayLongPress={500}
                        >
                            <View style={styles.categoryIconWrapper}>
                                {getIcon(category.icon?.name || 'Home')}
                            </View>
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <Text style={styles.categoryCount}>
                                {category.documentCount || 0} Documents
                            </Text>
                        </Pressable>
                    ))}

                    {/* Add Category Button */}
                    {!searchQuery && (
                        <Pressable
                            style={styles.addCategoryCard}
                            onPress={() => setShowAddDialog(true)}
                        >
                            <Plus color={colors.primary} size={28} strokeWidth={1.5} />
                            <Text style={styles.addCategoryText}>Add Category</Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>

            {/* Add Category Modal */}
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

                        <Text style={styles.modalTitle}>Add Category</Text>

                        <Text style={styles.inputLabel}>Category Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter category name"
                            placeholderTextColor={colors.mutedForeground}
                            value={categoryName}
                            onChangeText={setCategoryName}
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
                                onPress={handleAddCategory}
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
                onRequestClose={() => setDeleteConfirm({ show: false, category: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.deleteHeader}>
                            <View style={styles.warningIcon}>
                                <AlertTriangle size={24} color="#2563EB" />
                            </View>
                            <Text style={styles.modalTitle}>Delete Category</Text>
                        </View>

                        <Text style={styles.deleteText}>
                            Are you sure you want to delete{' '}
                            <Text style={styles.deleteName}>
                                {deleteConfirm.category?.name}
                            </Text>
                            ?
                        </Text>

                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                {deleteConfirm.category?.documentCount || 0} documents will be deleted
                            </Text>
                            <Text style={styles.warningSubtext}>
                                This action cannot be undone
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteConfirm({ show: false, category: null })}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                                onPress={confirmDelete}
                                disabled={isDeleting}
                            >
                                <Text style={styles.deleteButtonText}>
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
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[8],
    },
    header: {
        alignItems: 'center',
        paddingVertical: spacing[5],
    },
    title: {
        fontSize: 28,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    subtitle: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: radius.xl,
        paddingHorizontal: spacing[4],
        height: 52,
        marginBottom: spacing[5],
        ...shadows.sm,
    },
    searchIcon: {
        marginRight: spacing[3],
    },
    searchInput: {
        flex: 1,
        fontSize: fontSize.base.size,
        color: colors.foreground,
        height: '100%',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        paddingVertical: spacing[6],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
        alignItems: 'center',
        ...shadows.sm,
    },
    categoryIconWrapper: {
        marginBottom: spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryName: {
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[1],
    },
    categoryCount: {
        fontSize: fontSize.sm.size,
        color: '#7D7490',
        textAlign: 'center',
    },
    addCategoryCard: {
        width: '48%',
        backgroundColor: 'transparent',
        borderRadius: radius['2xl'],
        paddingVertical: spacing[5],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        minHeight: 156,
    },
    addCategoryText: {
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginTop: spacing[2],
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        width: '100%',
        maxWidth: 400,
    },
    modalClose: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        zIndex: 1,
    },
    modalTitle: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing[4],
    },
    inputLabel: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    input: {
        height: 48,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        paddingHorizontal: spacing[4],
        fontSize: fontSize.md.size,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing[3],
        marginTop: spacing[4],
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
        gap: spacing[3],
        marginBottom: spacing[3],
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
        marginBottom: spacing[2],
    },
    deleteName: {
        fontWeight: fontWeight.semibold,
    },
    warningBox: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: radius.lg,
        padding: spacing[3],
        marginBottom: spacing[4],
    },
    warningText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: '#1E40AF',
    },
    warningSubtext: {
        fontSize: fontSize.xs.size,
        color: '#2563EB',
        marginTop: spacing[1],
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
