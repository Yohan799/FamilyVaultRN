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
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Search,
    Plus,
    Folder,
    FileText,
    X,
    AlertTriangle,
    ArrowLeft,
    Upload,
    MoreVertical,
    Eye,
    Download,
    Trash2,
    Home,
    Building2,
    Mountain,
    Factory,
    Key,
    ScrollText,
    ClipboardList,
    Briefcase,
    Pill,
    TestTube,
    Hospital,
    Syringe,
    GraduationCap,
    Award,
    IdCard,
    FileCheck,
    Shield,
    User,
    Car,
    Building,
    Plane,
    Landmark,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubcategoryViewData, useInvalidateVault } from '@/hooks/useVaultData';
import { vaultCategories } from '@/data/vaultCategories';
import { supabase } from '@/lib/supabase';
import { VaultStackParamList } from '@/navigation/RootNavigator';
import { UploadModal } from '@/components/vault/UploadModal';
import { useUploadDocument } from '@/hooks/useVaultData';
import { getFolderStyle } from '@/utils/folderIconMapping';

type SubcategoryViewScreenRouteProp = RouteProp<VaultStackParamList, 'SubcategoryView'>;
type SubcategoryViewScreenNavigationProp = NativeStackNavigationProp<VaultStackParamList, 'SubcategoryView'>;

interface DocumentItem {
    id: string;
    name: string;
    size: string;
    date: string;
    fileType: string;
    storagePath?: string;
}

interface FolderItem {
    id: string;
    name: string;
    documentCount: number;
    isCustom: boolean;
}

export const SubcategoryViewScreen: React.FC = () => {
    const navigation = useNavigation<SubcategoryViewScreenNavigationProp>();
    const route = useRoute<SubcategoryViewScreenRouteProp>();
    const { categoryId, subcategoryId } = route.params;
    const { user } = useAuth();

    // State variables
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [documentActionMenu, setDocumentActionMenu] = useState<{ show: boolean; document: DocumentItem | null }>({
        show: false,
        document: null,
    });
    const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();

    const handleUpload = (file: any) => {
        uploadDoc({
            file,
            categoryId,
            subcategoryId,
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

    // ... existing renders


    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: any; type: 'folder' | 'document' }>({
        show: false,
        item: null,
        type: 'folder',
    });
    const [subcategoryName, setSubcategoryName] = useState('');

    const userId = user?.id;

    // Fetch folders and documents
    const { data: viewData, isLoading, refetch } = useSubcategoryViewData(
        userId,
        categoryId,
        subcategoryId
    );
    const { invalidateSubcategoryView } = useInvalidateVault();

    const folders = (viewData?.folders ?? []) as FolderItem[];
    const documents = (viewData?.documents ?? []) as DocumentItem[];

    // Icon mapping
    const IconMap: { [key: string]: any } = {
        Home,
        Building2,
        Mountain,
        Factory,
        Key,
        FileText,
        ScrollText,
        ClipboardList,
        Briefcase,
        Pill,
        TestTube,
        Hospital,
        Syringe,
        GraduationCap,
        Award,
        IdCard,
        FileCheck,
        Shield,
        User,
        Car,
        Building,
        Plane,
        Landmark,
    };

    // Get subcategory info
    const { category, subcategory } = useMemo(() => {
        const defaultCategory = vaultCategories.find(cat => cat.id === categoryId);
        let cat: any = null;
        let sub: any = null;

        if (defaultCategory) {
            cat = { id: defaultCategory.id, name: defaultCategory.name, isCustom: false };
            const defaultSub = defaultCategory.subcategories.find(s => s.id === subcategoryId);
            if (defaultSub) {
                // Resolve icon from name
                const IconComponent = defaultSub.icon?.name ? IconMap[defaultSub.icon.name] : Folder;
                sub = { id: defaultSub.id, name: defaultSub.name, icon: IconComponent, isCustom: false };
            }
        }

        if (!cat) {
            cat = { id: categoryId, name: 'Category', isCustom: true };
        }
        if (!sub) {
            sub = { id: subcategoryId, name: subcategoryName || 'Subcategory', icon: Folder, isCustom: true };
        }

        return { category: cat, subcategory: sub };
    }, [categoryId, subcategoryId, subcategoryName]);

    // Fetch custom subcategory name if needed
    useEffect(() => {
        if (subcategory.isCustom && userId && subcategoryId) {
            supabase
                .from('subcategories')
                .select('name')
                .eq('id', subcategoryId)
                .eq('user_id', userId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setSubcategoryName(data.name);
                    }
                });
        }
    }, [subcategory.isCustom, userId, subcategoryId]);

    // Filtered items
    const filteredFolders = useMemo(() => {
        if (!searchQuery.trim()) return folders;
        const query = searchQuery.toLowerCase().trim();
        return folders.filter(f => f.name.toLowerCase().includes(query));
    }, [folders, searchQuery]);

    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const query = searchQuery.toLowerCase().trim();
        return documents.filter(d => d.name.toLowerCase().includes(query));
    }, [documents, searchQuery]);

    // Handle add folder
    const handleAddFolder = useCallback(async () => {
        if (!folderName.trim() || !userId || !categoryId || !subcategoryId) return;

        const sanitizedName = folderName.trim();
        if (sanitizedName.length < 2 || sanitizedName.length > 50) {
            Alert.alert('Validation Error', 'Name must be between 2 and 50 characters');
            return;
        }

        const isDuplicate = folders.some(
            f => f.name.toLowerCase() === sanitizedName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert('Error', 'Folder already exists');
            return;
        }

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('folders')
                .insert({
                    name: sanitizedName,
                    category_id: categoryId,
                    subcategory_id: subcategoryId,
                    user_id: userId,
                });

            if (error) throw error;

            invalidateSubcategoryView(userId, categoryId, subcategoryId);
            setFolderName('');
            setShowAddFolderDialog(false);
            Alert.alert('Success', `${sanitizedName} has been added`);
        } catch (error: any) {
            console.error('Error adding folder:', error);
            Alert.alert('Error', 'Failed to create folder');
        } finally {
            setIsAdding(false);
        }
    }, [folderName, userId, categoryId, subcategoryId, folders, invalidateSubcategoryView]);

    // Handle delete folder
    const handleDeleteFolder = useCallback((folder: FolderItem) => {
        setDeleteConfirm({ show: true, item: folder, type: 'folder' });
    }, []);

    // Handle delete document
    const handleDeleteDocument = useCallback((doc: DocumentItem) => {
        setDeleteConfirm({ show: true, item: doc, type: 'document' });
    }, []);

    const handleViewDocument = useCallback((doc: DocumentItem) => {
        // TODO: Implement document viewing
        Alert.alert('View Document', `Opening ${doc.name}...`);
        setDocumentActionMenu({ show: false, document: null });
    }, []);

    const handleDownloadDocument = useCallback(async (doc: DocumentItem) => {
        try {
            // TODO: Implement document download from Supabase storage
            Alert.alert('Download', `Downloading ${doc.name}...`);
            setDocumentActionMenu({ show: false, document: null });
        } catch (error) {
            Alert.alert('Error', 'Failed to download document');
        }
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteConfirm.item || !userId) return;

        try {
            if (deleteConfirm.type === 'folder') {
                const { error } = await supabase
                    .from('folders')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', deleteConfirm.item.id)
                    .eq('user_id', userId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('documents')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', deleteConfirm.item.id)
                    .eq('user_id', userId);

                if (error) throw error;
            }

            invalidateSubcategoryView(userId!, categoryId, subcategoryId);
            Alert.alert('Success', `${deleteConfirm.item.name} has been deleted`);
            setDeleteConfirm({ show: false, item: null, type: 'folder' });
        } catch (error: any) {
            console.error('Error deleting:', error);
            Alert.alert('Error', 'Failed to delete');
        }
    }, [deleteConfirm, userId, categoryId, subcategoryId, invalidateSubcategoryView]);

    const SubcategoryIcon = subcategory.icon || Folder;
    const hasNoSearchResults = searchQuery && filteredFolders.length === 0 && filteredDocuments.length === 0;

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
                            <SubcategoryIcon size={24} color={colors.foreground} />
                            <Text style={styles.headerTitle}>
                                {subcategory.isCustom && subcategoryName
                                    ? subcategoryName
                                    : subcategory.name}
                            </Text>
                        </View>
                        <Text style={styles.documentCount}>
                            {documents.length} Documents
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search folders & documents..."
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
                {hasNoSearchResults ? (
                    <View style={styles.emptyState}>
                        <FileText size={64} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No results found</Text>
                        <Text style={styles.emptySubtitle}>Try a different search term</Text>
                    </View>
                ) : (
                    <>
                        {/* Folders Section */}
                        {(filteredFolders.length > 0 || !searchQuery) && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Folders</Text>
                                <View style={styles.grid}>
                                    {filteredFolders.map((folder) => {
                                        const folderStyle = getFolderStyle(folder.name);
                                        const FolderIcon = folderStyle.icon;

                                        return (
                                            <TouchableOpacity
                                                key={folder.id}
                                                style={styles.folderCard}
                                                onPress={() =>
                                                    navigation.navigate('NestedFolderView', {
                                                        categoryId,
                                                        subcategoryId,
                                                        folderId: folder.id,
                                                    })
                                                }
                                                onLongPress={() => handleDeleteFolder(folder)}
                                            >
                                                <View style={styles.iconWrapper}>
                                                    <FolderIcon size={32} color={folderStyle.iconColor} strokeWidth={1.5} />
                                                </View>
                                                <Text style={styles.folderName} numberOfLines={2}>
                                                    {folder.name}
                                                </Text>
                                                <Text style={styles.folderDocs}>
                                                    {folder.documentCount || 0} Documents
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* Add Folder Button */}
                                    {!searchQuery && (
                                        <TouchableOpacity
                                            style={styles.addCard}
                                            onPress={() => setShowAddFolderDialog(true)}
                                        >
                                            <View style={styles.iconWrapper}>
                                                <Plus size={32} color={colors.primary} strokeWidth={1.5} />
                                            </View>
                                            <Text style={styles.addText}>Add Folder</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Documents Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Documents</Text>
                                <TouchableOpacity style={styles.uploadButton} onPress={() => setShowUploadModal(true)}>
                                    <Upload size={16} color={colors.primaryForeground} />
                                    <Text style={styles.uploadButtonText}>Upload</Text>
                                </TouchableOpacity>
                            </View>

                            {filteredDocuments.length === 0 && !searchQuery ? (
                                <View style={styles.noDocsCard}>
                                    <FileText size={48} color={colors.mutedForeground} />
                                    <Text style={styles.noDocsText}>No documents yet</Text>
                                    <TouchableOpacity style={styles.uploadOutlineButton} onPress={() => setShowUploadModal(true)}>
                                        <Upload size={16} color={colors.foreground} />
                                        <Text style={styles.uploadOutlineText}>Upload Document</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.documentsList}>
                                    {filteredDocuments.map((doc) => (
                                        <View key={doc.id} style={styles.documentCard}>
                                            <View style={styles.docInfo}>
                                                <View style={styles.docIcon}>
                                                    <FileText size={20} color={colors.primary} />
                                                </View>
                                                <View style={styles.docDetails}>
                                                    <Text style={styles.docName} numberOfLines={1}>
                                                        {doc.name}
                                                    </Text>
                                                    <Text style={styles.docMeta}>
                                                        {doc.size} • {doc.date}
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.docMenuButton}
                                                onPress={() => setDocumentActionMenu({ show: true, document: doc })}
                                            >
                                                <MoreVertical size={20} color={colors.mutedForeground} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                        <View style={{ height: spacing.xl }} />
                    </>
                )}
            </ScrollView>

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

            {/* Add Folder Modal */}
            <Modal
                visible={showAddFolderDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddFolderDialog(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowAddFolderDialog(false)}
                        >
                            <X size={24} color={colors.mutedForeground} />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Add Folder</Text>

                        <Text style={styles.inputLabel}>Folder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter folder name"
                            placeholderTextColor={colors.mutedForeground}
                            value={folderName}
                            onChangeText={setFolderName}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddFolderDialog(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createButton, isAdding && styles.buttonDisabled]}
                                onPress={handleAddFolder}
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
                onRequestClose={() => setDeleteConfirm({ show: false, item: null, type: 'folder' })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.deleteHeader}>
                            <View style={styles.warningIcon}>
                                <AlertTriangle size={24} color="#DC2626" />
                            </View>
                            <Text style={styles.modalTitle}>
                                Delete {deleteConfirm.type === 'folder' ? 'Folder' : 'Document'}
                            </Text>
                        </View>

                        <Text style={styles.deleteText}>
                            Are you sure you want to delete{' '}
                            <Text style={styles.deleteName}>{deleteConfirm.item?.name}</Text>?
                        </Text>

                        <View style={styles.dangerBox}>
                            <Text style={styles.dangerText}>This action cannot be undone</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteConfirm({ show: false, item: null, type: 'folder' })}
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
            {/* Document Action Menu Modal */}
            <Modal
                visible={documentActionMenu.show}
                transparent
                animationType="fade"
                onRequestClose={() => setDocumentActionMenu({ show: false, document: null })}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setDocumentActionMenu({ show: false, document: null })}
                >
                    <View style={styles.actionMenuContent}>
                        <View style={styles.actionMenuHeader}>
                            <Text style={styles.actionMenuTitle} numberOfLines={1}>
                                {documentActionMenu.document?.name}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => documentActionMenu.document && handleViewDocument(documentActionMenu.document)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Eye size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.actionText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => documentActionMenu.document && handleDownloadDocument(documentActionMenu.document)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
                                <Download size={20} color="#10B981" />
                            </View>
                            <Text style={styles.actionText}>Download</Text>
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => {
                                const doc = documentActionMenu.document;
                                setDocumentActionMenu({ show: false, document: null });
                                if (doc) handleDeleteDocument(doc);
                            }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#EF444415' }]}>
                                <Trash2 size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
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
    section: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    folderCard: {
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
    folderName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    folderDocs: {
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
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        gap: spacing.xs,
    },
    uploadButtonText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.primaryForeground,
    },
    noDocsCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.xl,
        alignItems: 'center',
    },
    noDocsText: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    uploadOutlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
    },
    uploadOutlineText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    documentsList: {
        gap: spacing.sm,
    },
    documentCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    docInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    docIcon: {
        width: 40,
        height: 40,
        backgroundColor: `${colors.primary}15`,
        borderRadius: radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    docDetails: {
        flex: 1,
    },
    docName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    docMeta: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    docMenuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: '#FEE2E2',
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
    dangerBox: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    dangerText: {
        fontSize: fontSize.sm.size,
        color: '#DC2626',
    },
    deleteButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: radius.lg,
        backgroundColor: '#EF4444',
    },
    deleteButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: '#FFFFFF',
    },
    actionMenuContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        width: '100%',
        maxWidth: 320,
        ...shadows.lg,
    },
    actionMenuHeader: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    actionMenuTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        textAlign: 'center',
    },
    actionMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: fontSize.md.size,
        color: colors.foreground,
        fontWeight: fontWeight.medium,
    },
    actionDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
});

export default SubcategoryViewScreen;
