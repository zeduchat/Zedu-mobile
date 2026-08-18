import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppButton } from '@/components/ui/button';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { clearAllData } from '@/utils/helper';
import { SafeAreaView } from 'react-native-safe-area-context';

const DELETE_REASONS = [
    "I'm using a different app",
    "Privacy concerns",
    "Too many notifications",
    "Technical issues / Bugs",
    "I don't find it useful anymore",
    "Other"
];

const DeleteAccountScreen: React.FC = ({ navigation }:any) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [otherReason, setOtherReason] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const {dispatch} = useDataContext()
    const [loading, setLoading] = useState(false)

    const isFormValid = useMemo(() => {
        if (!selectedReason) return false;
        if (selectedReason === 'Other' && otherReason.trim().length < 5) return false;
        return true;
    }, [selectedReason, otherReason]);

    const handleInitialSubmit = useCallback(() => {
        if (isFormValid) {
            setShowConfirmModal(true);
        }
    }, [isFormValid]);


      const logout = async () => {
            try {
                setLoading(true);
                await clearAllData();
    
                // Dispatch everything at once to prevent partial state UI renders
                dispatch({ type: ACTIONS.TOKEN, payload: null });
                dispatch({ type: ACTIONS.USER, payload: null });
                dispatch({ type: ACTIONS.ORG_DATA, payload: null });
                dispatch({ type: ACTIONS.DMS, payload: [] });
                dispatch({ type: ACTIONS.DMS_CHAT, payload: {data:[], page:1} });
    
            } catch (e) {
                console.error("Logout error", e);
            } finally {
                setLoading(false);
            }
        };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.warningIconContainer}>
                            <MaterialCommunityIcons name="alert-octagon" size={35} color="#EF4444" />
                        </View>
                        <AppText variant="bold" size={24} style={styles.title}>
                            Delete Account
                        </AppText>
                        <AppText style={styles.subtitle}>
                            This will permanently delete your account data and all associated information.
                        </AppText>
                    </View>

                    <View style={styles.section}>
                        <AppText variant="semiBold" size={16} style={styles.label}>
                            Reason for leaving
                        </AppText>
                        {DELETE_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                activeOpacity={0.7}
                                onPress={() => setSelectedReason(reason)}
                                style={[
                                    styles.reasonItem,
                                    selectedReason === reason && styles.reasonItemActive
                                ]}
                            >
                                <AppText
                                    style={[
                                        styles.reasonText,
                                        selectedReason === reason && styles.reasonTextActive
                                    ]}
                                >
                                    {reason}
                                </AppText>
                                <MaterialCommunityIcons
                                    name={selectedReason === reason ? "radiobox-marked" : "radiobox-blank"}
                                    size={24}
                                    color={selectedReason === reason ? Colors.primary : '#D1D5DB'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {selectedReason === 'Other' && (
                        <View style={styles.inputSection}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Please tell us more..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                value={otherReason}
                                onChangeText={setOtherReason}
                                textAlignVertical="top"
                            />
                        </View>
                    )}

                    <View style={styles.footer}>
                        <AppButton
                            title="Continue to Delete"
                            onPress={handleInitialSubmit}
                            disabled={!isFormValid}
                            variant="danger"
                        />

                        <AppButton
                            title="Go Back"
                            onPress={() => navigation.goBack()}
                            disabled={!isFormValid}
                            variant="secondary"
                            style={{ marginTop: normalize(12) }}
                        />

                        <AppText size={15} style={styles.disclaimer}>
                            By proceeding, you understand that this process is irreversible.
                        </AppText>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showConfirmModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <TouchableOpacity
                            style={styles.closeModal}
                            onPress={() => setShowConfirmModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>

                        <View style={styles.heartContainer}>
                            <Ionicons name="heart" size={45} color="#F43F5E" />
                        </View>

                        <AppText variant="bold" size={20} style={styles.modalTitle}>
                            We'll miss you!
                        </AppText>

                        <AppText style={styles.modalText}>
                            Your journey with us meant a lot. If you ever change your mind, we'll be here to welcome you back.
                        </AppText>

                        <View style={styles.modalActions}>
                            <AppButton
                                title="Delete Permanently"
                                onPress={logout}
                                loading={isDeleting}
                                style={styles.finalDeleteBtn}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                style={styles.keepAccountBtn}
                            >
                                <AppText variant="semiBold" style={{ color: Colors.primary }}>
                                    I've changed my mind
                                </AppText>
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
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        padding: normalize(20),
    },
    header: {
        alignItems: 'center',
        marginBottom: normalize(32),
        marginTop: normalize(20),
    },
    warningIconContainer: {
        width: normalize(70),
        height: normalize(70),
        borderRadius: normalize(35),
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(16),
    },
    title: {
        color: '#111827',
        marginBottom: normalize(8),
    },
    subtitle: {
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: normalize(20),
        paddingHorizontal: normalize(15),
    },
    section: {
        marginBottom: normalize(20),
    },
    label: {
        marginBottom: normalize(16),
        color: '#374151',
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: normalize(18),
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(15),
        marginBottom: normalize(12),
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    reasonItemActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F5F3FF',
    },
    reasonText: {
        fontSize: normalize(15),
        color: '#4B5563',
    },
    reasonTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    inputSection: {
        marginBottom: normalize(20),
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(15),
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        padding: normalize(15),
        fontSize: normalize(15),
        color: '#111827',
        minHeight: normalize(120),
    },
    footer: {
        marginTop: normalize(10),
    },
    deleteBtn: {
        backgroundColor: '#EF4444',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: normalize(12),
        color: '#9CA3AF',
        marginTop: normalize(20),
        lineHeight: normalize(18),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: normalize(25),
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(25),
        padding: normalize(25),
        width: '100%',
        alignItems: 'center',
    },
    closeModal: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    heartContainer: {
        width: normalize(90),
        height: normalize(90),
        borderRadius: normalize(45),
        backgroundColor: '#FFF1F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    modalTitle: {
        marginBottom: normalize(12),
        color: '#111827',
    },
    modalText: {
        textAlign: 'center',
        color: '#4B5563',
        lineHeight: normalize(24),
        marginBottom: normalize(35),
    },
    modalActions: {
        width: '100%',
    },
    finalDeleteBtn: {
        backgroundColor: '#111827',
        marginBottom: normalize(10),
    },
    keepAccountBtn: {
        height: normalize(56),
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DeleteAccountScreen;