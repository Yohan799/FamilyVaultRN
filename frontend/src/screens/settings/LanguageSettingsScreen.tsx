import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Globe, Check } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Available languages
const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const LanguageSettingsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedLanguage, setSelectedLanguage] = React.useState('en');

    const handleLanguageSelect = (langCode: string) => {
        if (langCode !== selectedLanguage) {
            setSelectedLanguage(langCode);
            Alert.alert('Language Changed', 'App language has been updated');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={colors.foreground} size={24} />
                </Pressable>
                <View>
                    <Text style={styles.headerTitle}>Language</Text>
                    <Text style={styles.headerSubtitle}>Choose your language</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {languages.map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                        <Pressable
                            key={lang.code}
                            style={[
                                styles.languageItem,
                                isSelected && styles.languageItemSelected,
                            ]}
                            onPress={() => handleLanguageSelect(lang.code)}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    isSelected && styles.iconContainerSelected,
                                ]}
                            >
                                <Globe color={isSelected ? colors.primaryForeground : colors.foreground} size={24} />
                            </View>
                            <View style={styles.languageInfo}>
                                <Text style={styles.languageName}>{lang.name}</Text>
                                <Text style={styles.languageNative}>{lang.nativeName}</Text>
                            </View>
                            {isSelected && (
                                <View style={styles.checkContainer}>
                                    <Text style={styles.currentText}>Current</Text>
                                    <View style={styles.checkIcon}>
                                        <Check color={colors.primaryForeground} size={16} />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomLeftRadius: radius['3xl'],
        borderBottomRightRadius: radius['3xl'],
        gap: spacing.md,
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
    headerSubtitle: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    languageItemSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    iconContainerSelected: {
        backgroundColor: colors.primary,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: 2,
    },
    languageNative: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
    checkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    currentText: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
        color: colors.primary,
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
