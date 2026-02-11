import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { vaultCategories, Category, Subcategory } from '@/data/vaultCategories';
import {
    syncDefaultCategories,
    loadCategoriesOptimized,
    loadSubcategoriesOptimized,
    getAllUserDocuments,
    getAllUserSubcategories,
    uploadDocument
} from '@/services/vaultService';
import { Folder } from 'lucide-react-native';

// Query keys for cache management
export const vaultKeys = {
    all: ['vault'] as const,
    categories: (userId: string) => [...vaultKeys.all, 'categories', userId] as const,
    subcategories: (userId: string, categoryId: string) =>
        [...vaultKeys.all, 'subcategories', userId, categoryId] as const,
    documents: (userId: string) => [...vaultKeys.all, 'documents', userId] as const,
    allSubcategories: (userId: string) => [...vaultKeys.all, 'allSubcategories', userId] as const,
    subcategoryView: (userId: string, categoryId: string, subcategoryId: string) =>
        [...vaultKeys.all, 'subcategoryView', userId, categoryId, subcategoryId] as const,
};

// Type for processed subcategory with UI-ready data
export interface ProcessedSubcategory {
    id: string;
    name: string;
    icon: any;
    documentCount: number;
    isCustom: boolean;
}

interface VaultData {
    categories: Category[];
    customCategories: any[];
    documentCounts: Map<string, number>;
    totalDocuments: number;
}

export const useVaultData = () => {
    const { user } = useAuth();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery<VaultData>({
        queryKey: ['vaultData', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Sync default categories if needed
            await syncDefaultCategories(user.id);

            // Load categories and document counts in parallel
            const { categories: customCategories, docCountMap } = await loadCategoriesOptimized(user.id);

            // Merge default and custom categories
            const allCategories = [
                ...vaultCategories.map(cat => ({
                    ...cat,
                    documentCount: docCountMap.get(cat.id) || 0,
                })),
                ...customCategories.map(cat => ({
                    ...cat,
                    isCustom: true,
                    documentCount: docCountMap.get(cat.id) || 0,
                    subcategories: [],
                })),
            ];

            // Calculate total
            let totalDocs = 0;
            docCountMap.forEach(count => {
                totalDocs += count;
            });

            return {
                categories: allCategories,
                customCategories,
                documentCounts: docCountMap,
                totalDocuments: totalDocs,
            };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    return {
        categories: data?.categories || vaultCategories,
        customCategories: data?.customCategories || [],
        documentCounts: data?.documentCounts || new Map(),
        totalDocuments: data?.totalDocuments || 0,
        isLoading,
        error,
        refetch,
    };
};

// Hook for fetching documents
export const useVaultDocuments = (options?: { categoryId?: string; subcategoryId?: string }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['vaultDocuments', user?.id, options?.categoryId, options?.subcategoryId],
        queryFn: async () => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            let query = supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('uploaded_at', { ascending: false });

            if (options?.categoryId) {
                query = query.eq('category_id', options.categoryId);
            }

            if (options?.subcategoryId) {
                query = query.eq('subcategory_id', options.subcategoryId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60, // 1 minute
    });
};

/**
 * Hook to fetch subcategories for a specific category (for CategoryView)
 */
export const useSubcategories = (
    userId: string | undefined,
    categoryId: string | undefined
) => {
    return useQuery({
        queryKey: vaultKeys.subcategories(userId || '', categoryId || ''),
        queryFn: async (): Promise<{
            subcategories: ProcessedSubcategory[];
            totalDocCount: number;
        }> => {
            if (!userId || !categoryId) {
                return { subcategories: [], totalDocCount: 0 };
            }

            // Check if this is a default category
            const defaultCategory = vaultCategories.find(cat => cat.id === categoryId);

            // Load subcategories with counts
            const { subcategories: customSubs, docCountMap, totalDocCount } =
                await loadSubcategoriesOptimized(userId, categoryId);

            // Start with hardcoded subcategories if default category
            let baseSubcategories: ProcessedSubcategory[] = defaultCategory
                ? defaultCategory.subcategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    icon: sub.icon,
                    documentCount: docCountMap.get(sub.id) || 0,
                    isCustom: false,
                }))
                : [];

            // Add custom subcategories
            const customSubsWithCounts: ProcessedSubcategory[] = customSubs.map((sub: any) => ({
                id: sub.id,
                name: sub.name,
                icon: Folder,
                documentCount: docCountMap.get(sub.id) || 0,
                isCustom: true,
            }));

            return {
                subcategories: [...baseSubcategories, ...customSubsWithCounts],
                totalDocCount,
            };
        },
        enabled: !!userId && !!categoryId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch subcategory view data (documents and folders for SubcategoryView)
 */
export const useSubcategoryViewData = (
    userId: string | undefined,
    categoryId: string | undefined,
    subcategoryId: string | undefined,
    folderId?: string | null
) => {
    return useQuery({
        queryKey: vaultKeys.subcategoryView(userId || '', categoryId || '', subcategoryId || ''),
        queryFn: async () => {
            if (!userId || !categoryId || !subcategoryId) {
                return { folders: [], documents: [] };
            }

            // Build folders query
            let foldersQuery = supabase
                .from('folders')
                .select('*')
                .eq('subcategory_id', subcategoryId)
                .eq('user_id', userId)
                .is('deleted_at', null);

            // For root level, parent_folder_id should be null
            if (!folderId) {
                foldersQuery = foldersQuery.is('parent_folder_id', null);
            } else {
                foldersQuery = foldersQuery.eq('parent_folder_id', folderId);
            }

            // Build documents query
            let docsQuery = supabase
                .from('documents')
                .select('*')
                .eq('subcategory_id', subcategoryId)
                .eq('user_id', userId)
                .is('deleted_at', null)
                .order('uploaded_at', { ascending: false });

            // For root level, folder_id should be null
            if (!folderId) {
                docsQuery = docsQuery.is('folder_id', null);
            } else {
                docsQuery = docsQuery.eq('folder_id', folderId);
            }

            const [foldersResult, docsResult] = await Promise.all([
                foldersQuery,
                docsQuery
            ]);

            const folders = (foldersResult.data || []).map(folder => ({
                id: folder.id,
                name: folder.name,
                documentCount: 0,
                isCustom: true
            }));

            const documents = (docsResult.data || []).map(doc => ({
                id: doc.id,
                name: doc.file_name || 'Untitled',
                size: formatFileSize(doc.file_size || 0),
                date: new Date(doc.uploaded_at).toLocaleDateString(),
                fileType: doc.file_type || 'unknown',
                storagePath: (doc as any).storage_path || '',
            }));

            return { folders, documents };
        },
        enabled: !!userId && !!categoryId && !!subcategoryId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Hook to invalidate vault caches (useful after mutations like adding/deleting categories)
 */
export const useInvalidateVault = () => {
    const queryClient = useQueryClient();

    return {
        invalidateCategories: (userId: string) =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.categories(userId) }),
        invalidateSubcategories: (userId: string, categoryId: string) =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.subcategories(userId, categoryId) }),
        invalidateSubcategoryView: (userId: string, categoryId: string, subcategoryId: string) =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.subcategoryView(userId, categoryId, subcategoryId) }),
        invalidateAll: () =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.all }),
    };
};

/**
 * Hook to upload a document
 */
export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (params: {
            file: any;
            categoryId?: string;
            subcategoryId?: string;
            folderId?: string
        }) => {
            if (!user?.id) throw new Error('User not authenticated');
            return uploadDocument(
                params.file,
                user.id,
                params.categoryId,
                params.subcategoryId,
                params.folderId
            );
        },
        onSuccess: (_, variables) => {
            if (user?.id) {
                if (variables.subcategoryId) {
                    queryClient.invalidateQueries({
                        queryKey: vaultKeys.subcategoryView(user.id, variables.categoryId || '', variables.subcategoryId)
                    });
                    if (variables.categoryId) {
                        queryClient.invalidateQueries({
                            queryKey: vaultKeys.subcategories(user.id, variables.categoryId)
                        });
                    }
                }
                queryClient.invalidateQueries({ queryKey: vaultKeys.documents(user.id) });
            }
        },
    });
};
