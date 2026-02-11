import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '@/services/profileService';
import { Image } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile, updateProfile } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.full_name || '',
                phone: profile.phone || '',
            });
        }
    }, [profile]);

    const displayName = formData.fullName || 'User';
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let avatarUrl = profile?.avatar_url;

            if (selectedImage) {
                if (!profile?.id) throw new Error('User ID not found');
                avatarUrl = await uploadAvatar(profile.id, selectedImage);
            }

            await updateProfile({
                full_name: formData.fullName,
                phone: formData.phone,
                avatar_url: avatarUrl,
            });
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color={colors.foreground} size={24} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <Pressable style={styles.avatarContainer} onPress={pickImage}>
                        {selectedImage || profile?.avatar_url ? (
                            <Image
                                source={{ uri: selectedImage || profile?.avatar_url }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>{initials}</Text>
                        )}
                        <View style={styles.cameraButton}>
                            <Camera color={colors.foreground} size={16} />
                        </View>
                    </Pressable>
                    <Text style={styles.changePhotoText}>Tap to change photo</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Form */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.fullName}
                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.mutedForeground}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <Pressable
                        style={styles.emailButton}
                        onPress={() => navigation.navigate('EmailPreferences')}
                    >
                        <View>
                            <Text style={styles.emailValue}>{profile?.email}</Text>
                            <Text style={styles.emailHint}>Tap to manage email addresses</Text>
                        </View>
                    </Pressable>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={(text) => {
                            const value = text.replace(/[^0-9]/g, '').slice(0, 10);
                            setFormData({ ...formData, phone: value });
                        }}
                        placeholder="Enter phone number"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>

                {/* Save Button */}
                <Pressable
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: fontSize.xl.size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    avatarSection: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: fontSize['3xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.primaryForeground,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePhotoText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
    },
    emailButton: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    emailValue: {
        fontSize: fontSize.md.size,
        color: colors.foreground,
        marginBottom: 2,
    },
    emailHint: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
});
