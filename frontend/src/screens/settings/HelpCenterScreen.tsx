import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Phone, Mail, Send, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, radius } from '@/theme';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const faqs = [
    {
        question: 'How do I add a document?',
        answer: 'Navigate to the Vault tab, select or create a category, and tap the + button to upload a new document. You can upload images, PDFs, and other file types.',
    },
    {
        question: 'What is a nominee?',
        answer: 'A nominee is a trusted person you designate to receive access to your vault in case of emergencies or as specified by your inactivity triggers.',
    },
    {
        question: 'How do inactivity triggers work?',
        answer: 'Inactivity triggers automatically notify your nominees if you haven\'t accessed the app for a specified period. You can configure the duration and conditions in Settings.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes, all your data is encrypted using industry-standard encryption. We use end-to-end encryption for sensitive documents and multi-factor authentication for account security.',
    },
];

export const HelpCenterScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile } = useAuth();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
    });

    const handleCall = () => {
        Linking.openURL('tel:+1234567890');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@familyvault.com');
    };

    const handleSubmit = async () => {
        if (!formData.subject || !formData.message) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.functions.invoke('send-support-message', {
                body: {
                    name: profile?.full_name || 'User',
                    email: profile?.email,
                    subject: formData.subject,
                    message: formData.message,
                },
            });

            if (error) throw error;

            Alert.alert('Message Sent', 'We\'ll get back to you soon!');
            setFormData({ subject: '', message: '' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send message');
        } finally {
            setIsSubmitting(false);
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
                <Text style={styles.headerTitle}>Help & Support</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Contact */}
                <View style={styles.contactRow}>
                    <Pressable style={styles.contactCard} onPress={handleCall}>
                        <View style={[styles.contactIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                            <Phone color="#22c55e" size={24} />
                        </View>
                        <Text style={styles.contactLabel}>Call Us</Text>
                    </Pressable>
                    <Pressable style={styles.contactCard} onPress={handleEmail}>
                        <View style={[styles.contactIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Mail color="#3b82f6" size={24} />
                        </View>
                        <Text style={styles.contactLabel}>Email Us</Text>
                    </Pressable>
                </View>

                {/* FAQs */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <Pressable
                            key={index}
                            style={styles.faqItem}
                            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                {expandedFaq === index ? (
                                    <ChevronUp color={colors.mutedForeground} size={20} />
                                ) : (
                                    <ChevronDown color={colors.mutedForeground} size={20} />
                                )}
                            </View>
                            {expandedFaq === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </Pressable>
                    ))}
                </View>

                {/* Contact Form */}
                <Text style={styles.sectionTitle}>Send us a message</Text>
                <View style={styles.formCard}>
                    <TextInput
                        style={styles.input}
                        value={formData.subject}
                        onChangeText={(text) => setFormData({ ...formData, subject: text })}
                        placeholder="Subject"
                        placeholderTextColor={colors.mutedForeground}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.message}
                        onChangeText={(text) => setFormData({ ...formData, message: text })}
                        placeholder="Describe your issue..."
                        placeholderTextColor={colors.mutedForeground}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <Pressable
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Send color={colors.primaryForeground} size={18} />
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Text>
                    </Pressable>
                </View>
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
    content: {
        flex: 1,
        padding: spacing.md,
    },
    contactRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    contactCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.md,
        alignItems: 'center',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    contactLabel: {
        fontSize: fontSize.xs.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    sectionTitle: {
        fontSize: fontSize.lg.size,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    faqList: {
        marginBottom: spacing.lg,
    },
    faqItem: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: fontSize.sm.size,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
        paddingRight: spacing.sm,
    },
    faqAnswer: {
        fontSize: fontSize.sm.size,
        color: colors.mutedForeground,
        marginTop: spacing.md,
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing.lg,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md.size,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    textArea: {
        minHeight: 100,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: fontSize.md.size,
        fontWeight: fontWeight.semibold,
        color: colors.primaryForeground,
    },
});
