import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Vault,
    Users,
    Shield,
    Clock,
    Sparkles,
    Check
} from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius, shadows } from '@/theme';

interface FeatureTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const BLUE_COLOR = '#3B82F6';
const BLUE_BG = 'rgba(59, 130, 246, 0.15)';

const TOUR_STEPS = [
    {
        title: "Welcome to Family Vault!",
        description: "Your secure digital legacy platform. Keep your important documents safe and ensure they reach your loved ones when it matters most.",
        icon: Sparkles,
    },
    {
        title: "Digital Vault",
        description: "Store documents securely. Everything encrypted and organized in one place.",
        icon: Vault,
    },
    {
        title: "Nominee Center",
        description: "Select trusted individuals who can access your documents. Verify their identity and control exactly what each person can see or download.",
        icon: Users,
    },
    {
        title: "Inactivity Triggers",
        description: "Set up automatic check-ins to monitor your activity. If you become inactive, your documents will be securely shared with your nominees.",
        icon: Shield,
    },
    {
        title: "Time Capsule",
        description: "Create messages and memories to be delivered at a future date. Leave behind words of wisdom, love letters, or important instructions.",
        icon: Clock,
    },
    {
        title: "You're All Set!",
        description: "Start securing your legacy today. Upload your first document, add a nominee, or create a time capsule. We're here to help every step of the way.",
        icon: Check,
    },
];

export const FeatureTour: React.FC<FeatureTourProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Reset step when reopening
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentTourStep = TOUR_STEPS[currentStep];
    const Icon = currentTourStep.icon;
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.backdrop} />

                <View style={styles.card}>
                    {/* Header with gradient-like background */}
                    <View style={styles.header}>
                        <Pressable
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={12}
                        >
                            <X size={20} color={colors.mutedForeground} />
                        </Pressable>

                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            {TOUR_STEPS.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.progressBar,
                                        {
                                            backgroundColor: index <= currentStep
                                                ? colors.primary
                                                : colors.border
                                        }
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Icon */}
                        <View style={styles.iconWrapper}>
                            <View style={[styles.iconCircleOuter, { backgroundColor: BLUE_BG }]}>
                                <View style={[styles.iconCircleInner, { backgroundColor: BLUE_BG }]}>
                                    <Icon size={32} color={BLUE_COLOR} strokeWidth={2} />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.stepCounter}>
                            Step {currentStep + 1} of {TOUR_STEPS.length}
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{currentTourStep.title}</Text>
                        <Text style={styles.description}>{currentTourStep.description}</Text>

                        {/* Navigation Buttons */}
                        <View style={styles.buttonRow}>
                            {currentStep > 0 && (
                                <Pressable
                                    style={styles.backButton}
                                    onPress={handlePrevious}
                                >
                                    <ChevronLeft size={16} color={colors.foreground} />
                                    <Text style={styles.backButtonText}>Previous</Text>
                                </Pressable>
                            )}

                            <Pressable
                                style={styles.nextButton}
                                onPress={handleNext}
                            >
                                <Text style={styles.nextButtonText}>
                                    {isLastStep ? 'Get Started' : 'Next'}
                                </Text>
                                {isLastStep ? (
                                    <Check size={16} color={colors.white} />
                                ) : (
                                    <ChevronRight size={16} color={colors.white} />
                                )}
                            </Pressable>
                        </View>

                        {/* Skip Button */}
                        {!isLastStep && (
                            <Pressable onPress={onClose} style={styles.skipButton}>
                                <Text style={styles.skipButtonText}>Skip Tour</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing[4],
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius['2xl'],
        overflow: 'hidden',
        ...shadows.lg,
    },
    header: {
        backgroundColor: '#F3F0F8', // Light primary tint
        padding: spacing[6],
        paddingBottom: spacing[8],
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        zIndex: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: spacing[6],
        width: '100%',
    },
    progressBar: {
        height: 4,
        flex: 1,
        borderRadius: 2,
    },
    iconWrapper: {
        marginBottom: spacing[4],
    },
    iconCircleOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCounter: {
        fontSize: fontSize.xs.size,
        color: colors.mutedForeground,
        fontWeight: fontWeight.medium,
    },
    content: {
        padding: spacing[6],
        alignItems: 'center',
    },
    title: {
        fontSize: fontSize['2xl'].size,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    description: {
        fontSize: fontSize.base.size,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing[6],
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing[3],
        width: '100%',
        marginBottom: spacing[3],
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        height: 48,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    backButtonText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        height: 48,
        borderRadius: radius.xl,
        backgroundColor: colors.primary,
    },
    nextButtonText: {
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.semibold,
        color: colors.white,
    },
    skipButton: {
        padding: spacing[2],
    },
    skipButtonText: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
    },
});
