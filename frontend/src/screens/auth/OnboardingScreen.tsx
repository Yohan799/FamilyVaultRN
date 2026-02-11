import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, FileText, Share2, ChevronRight } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';
import { AuthStackParamList } from '@/navigation/RootNavigator';
import { storageHelpers } from '@/lib/storage';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const BLUE_COLOR = '#3B82F6';
const BLUE_BG = 'rgba(59, 130, 246, 0.15)';

const onboardingSteps = [
    {
        icon: Lock,
        title: "Secure Your Family's\nLegacy",
        description: 'Keep important documents safe and ensure your family has access when they need it most.',
    },
    {
        icon: FileText,
        title: 'Store Important\nDocuments',
        description: 'Safely store wills, insurance policies, and other critical family documents in one secure place.',
    },
    {
        icon: Share2,
        title: 'Share When Needed',
        description: 'Grant trusted family members access to critical information during emergencies.',
    },
];

export const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            storageHelpers.setHasSeenOnboarding(true);
            navigation.navigate('SignUp');
        }
    };

    const handleSkip = () => {
        storageHelpers.setHasSeenOnboarding(true);
        navigation.navigate('SignIn');
    };

    const renderIcon = () => {
        const step = onboardingSteps[currentStep];
        const Icon = step.icon;
        return (
            <View style={styles.iconWrapper}>
                <View style={[styles.iconCircleOuter, { backgroundColor: BLUE_BG }]}>
                    <View style={[styles.iconCircleInner, { backgroundColor: BLUE_BG }]}>
                        <Icon color={BLUE_COLOR} size={36} strokeWidth={2} />
                    </View>
                </View>
            </View>
        );
    };

    const isLastStep = currentStep === onboardingSteps.length - 1;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Skip */}
            <View style={styles.header}>
                <Pressable onPress={handleSkip} hitSlop={12}>
                    <Text style={styles.skipText}>Skip</Text>
                </Pressable>
            </View>

            <View style={styles.content}>
                {/* White Card Container */}
                <View style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        {renderIcon()}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {onboardingSteps[currentStep].title}
                    </Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {onboardingSteps[currentStep].description}
                    </Text>

                    {/* Next/Get Started Button */}
                    <Pressable
                        onPress={handleNext}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.buttonText}>
                            {isLastStep ? 'Get Started' : 'Next'}
                        </Text>
                        {!isLastStep && (
                            <ChevronRight color={colors.white} size={20} />
                        )}
                    </Pressable>

                    {/* Pagination Dots */}
                    <View style={styles.dotsContainer}>
                        {onboardingSteps.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentStep && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>
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
        justifyContent: 'flex-end',
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
    },
    skipText: {
        fontSize: fontSize.base.size,
        color: '#9B8FB0', // Muted purple-gray like reference
        fontWeight: fontWeight.normal,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[12],
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[6],
        paddingTop: spacing[10],
        paddingBottom: spacing[8],
        alignItems: 'center',
        ...shadows.md,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleInner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[4],
        lineHeight: 30,
    },
    description: {
        fontSize: fontSize.base.size,
        color: '#7D7490', // Gray text like reference
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing[2],
        marginBottom: spacing[8],
    },
    primaryButton: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingVertical: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        marginBottom: spacing[6],
    },
    buttonText: {
        color: colors.white,
        fontSize: fontSize.base.size,
        fontWeight: fontWeight.semibold,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing[2],
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D4CDE6', // Light gray dots
    },
    activeDot: {
        width: 24,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
});
