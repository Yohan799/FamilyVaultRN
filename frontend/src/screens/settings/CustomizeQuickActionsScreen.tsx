import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Plus,
    GripVertical,
    Trash2,
    Shield,
    Users,
    Bell,
    Clock,
    Timer,
    UserPlus,
    Vault,
    X,
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    is_enabled: boolean;
    is_custom: boolean;
    sort_order: number;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
    Vault,
    UserPlus,
    Shield,
    Timer,
    Plus,
    Users,
    Bell,
    Clock,
};

// Default actions for initialization
const DEFAULT_ACTIONS: QuickAction[] = [
    { id: '1', title: 'Open Vault', subtitle: 'Access your secure vault', icon: 'Vault', sort_order: 0, is_enabled: true, is_custom: false },
    { id: '2', title: 'Add Nominee', subtitle: 'Add a trusted contact', icon: 'UserPlus', sort_order: 1, is_enabled: true, is_custom: false },
    { id: '3', title: '2FA Setup', subtitle: 'Enable two-factor auth', icon: 'Shield', sort_order: 2, is_enabled: true, is_custom: false },
    { id: '4', title: 'Inactivity Timer', subtitle: 'Set inactivity alerts', icon: 'Timer', sort_order: 3, is_enabled: true, is_custom: false },
];

const STORAGE_KEY = '@quick_actions';

export const CustomizeQuickActionsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [actions, setActions] = useState<QuickAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newActionTitle, setNewActionTitle] = useState('');
    const [newActionSubtitle, setNewActionSubtitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Load actions from AsyncStorage
    const loadActions = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
            if (stored) {
                setActions(JSON.parse(stored));
            } else {
                // Initialize with defaults
                setActions(DEFAULT_ACTIONS);
                await AsyncStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(DEFAULT_ACTIONS));
            }
        } catch (error: any) {
            console.error('Error loading actions:', error);
            setActions(DEFAULT_ACTIONS);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Save actions to AsyncStorage
    const saveActions = async (newActions: QuickAction[]) => {
        try {
            await AsyncStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(newActions));
        } catch (error) {
            console.error('Error saving actions:', error);
        }
    };

    useEffect(() => {
        loadActions();
    }, [loadActions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadActions();
        setRefreshing(false);
    }, [loadActions]);

    // Toggle action enabled state
    const handleToggle = async (id: string) => {
        const updatedActions = actions.map(a =>
            a.id === id ? { ...a, is_enabled: !a.is_enabled } : a
        );
        setActions(updatedActions);
        await saveActions(updatedActions);

        const action = actions.find(a => a.id === id);
        if (action) {
            Alert.alert(
                'Action Updated',
                `${action.title} ${!action.is_enabled ? 'enabled' : 'disabled'}`
            );
        }
    };

    // Delete custom action
    const handleDelete = async (id: string) => {
        const action = actions.find(a => a.id === id);
        if (!action || !action.is_custom) return;

        const updatedActions = actions.filter(a => a.id !== id);
        setActions(updatedActions);
        await saveActions(updatedActions);

        Alert.alert('Action Removed', `${action.title} has been deleted`);
    };

    // Add new custom action
    const handleAddNew = async () => {
        if (!newActionTitle.trim()) {
            Alert.alert('Title Required', 'Please enter a title for the action');
            return;
        }

        setIsAdding(true);
        try {
            const maxOrder = Math.max(...actions.map(a => a.sort_order), -1);
            const newAction: QuickAction = {
                id: Date.now().toString(),
                title: newActionTitle.trim(),
                subtitle: newActionSubtitle.trim() || 'Custom action',
                icon: 'Plus',
                is_enabled: true,
                is_custom: true,
                sort_order: maxOrder + 1,
            };

            const updatedActions = [...actions, newAction];
            setActions(updatedActions);
            await saveActions(updatedActions);

            setNewActionTitle('');
            setNewActionSubtitle('');
            setShowAddDialog(false);

            Alert.alert('Action Added', 'Your new action has been created');
        } catch (error: any) {
            console.error('Error adding action:', error);
            Alert.alert('Error', error.message || 'Failed to add action');
        } finally {
            setIsAdding(false);
        }
    };

    // Save and navigate back
    const handleSave = () => {
        Alert.alert('Changes Saved', 'Your quick actions have been updated');
        navigation.goBack();
    };

    // Get icon component
    const getIconComponent = (iconName: string) => {
        return ICON_MAP[iconName] || Plus;
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
                    <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ArrowLeft color={colors.primaryForeground} size={20} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Quick Actions</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.description}>
                        Customize which actions appear on your dashboard
                    </Text>

                    {/* Actions List */}
                    <View style={styles.actionsList}>
                        {actions.map(action => {
                            const IconComponent = getIconComponent(action.icon);
                            return (
                                <View key={action.id} style={styles.actionCard}>
                                    <GripVertical size={20} color={colors.mutedForeground} />
                                    <View style={styles.actionIcon}>
                                        <IconComponent size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.actionInfo}>
                                        <Text style={styles.actionTitle}>{action.title}</Text>
                                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                                    </View>
                                    <View style={styles.actionControls}>
                                        <Switch
                                            value={action.is_enabled}
                                            onValueChange={() => handleToggle(action.id)}
                                            trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                                            thumbColor={action.is_enabled ? colors.primary : colors.mutedForeground}
                                        />
                                        {action.is_custom && (
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDelete(action.id)}
                                            >
                                                <Trash2 size={20} color="#DC2626" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Add Action Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowAddDialog(true)}
                    >
                        <Plus size={20} color={colors.foreground} />
                        <Text style={styles.addButtonText}>Add Custom Action</Text>
                    </TouchableOpacity>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Add Action Modal */}
            <Modal visible={showAddDialog} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Action</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAddDialog(false);
                                    setNewActionTitle('');
                                    setNewActionSubtitle('');
                                }}
                            >
                                <X size={24} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Action Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter action title"
                                placeholderTextColor={colors.mutedForeground}
                                value={newActionTitle}
                                onChangeText={setNewActionTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Subtitle (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter action subtitle"
                                placeholderTextColor={colors.mutedForeground}
                                value={newActionSubtitle}
                                onChangeText={setNewActionSubtitle}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalAddBtn, isAdding && styles.buttonDisabled]}
                                onPress={handleAddNew}
                                disabled={isAdding}
                            >
                                {isAdding ? (
                                    <ActivityIndicator color={colors.primaryForeground} />
                                ) : (
                                    <Text style={styles.modalAddText}>Add Action</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setShowAddDialog(false);
                                    setNewActionTitle('');
                                    setNewActionSubtitle('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
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
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: `${colors.primaryForeground}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.primaryForeground,
    },
    content: {
        padding: spacing[4],
    },
    description: {
        fontSize: fontSize.md.size,
        color: colors.mutedForeground,
        marginBottom: spacing[4],
    },
    actionsList: {
        gap: spacing[3],
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        gap: spacing[3],
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    actionSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    actionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    deleteButton: {
        padding: spacing[2],
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.border,
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        marginTop: spacing[4],
    },
    addButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginTop: spacing[4],
    },
    saveButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        width: '100%',
        maxWidth: 340,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4],
    },
    modalTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
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
    modalButtons: {
        gap: spacing[2],
        marginTop: spacing[2],
    },
    modalAddBtn: {
        paddingVertical: spacing[3],
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        alignItems: 'center',
    },
    modalAddText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
    modalCancelBtn: {
        paddingVertical: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
});
