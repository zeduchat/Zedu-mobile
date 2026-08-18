import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Modal,
    TouchableOpacity,
    Pressable,
    TextInput,
    Image,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import { ShowNotify } from '@/components/ui/toast';
import { Colors } from '@/theme/colors';
import { extractBuzzCodeFromInput } from '@/utils/buzz';

interface Props {
    visible: boolean;
    onClose: () => void;
    onJoin?: (code: string) => void;
}

const JoinWithCodeModal = ({ visible, onClose, onJoin }: Props) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        const extractedCode = extractBuzzCodeFromInput(code);

        if (!extractedCode) {
            ShowNotify('Error', 'Please enter a meeting code or link');
            return;
        }

        setIsLoading(true);
        try {
            onJoin?.(extractedCode);
            setCode('');
            onClose();
        } catch (error) {
            ShowNotify('Error', 'Failed to join meeting');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setCode('');
        onClose();
    };

    const handleClear = () => {
        setCode('');
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={styles.overlay} onPress={handleCancel}>
                <Pressable
                    style={styles.modalCard}
                    onPress={(e) => {
                        e.stopPropagation();
                        Keyboard.dismiss();
                    }}
                >
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={handleCancel}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Image
                            source={require('@/assets/icons/close.png')}
                            style={styles.closeIcon}
                        />
                    </TouchableOpacity>

                    {/* Title */}
                    <AppText variant="bold" style={styles.title}>
                        Join with a code
                    </AppText>

                    {/* Description */}
                    <AppText variant="regular" style={styles.description}>
                        Enter a code or link from an organizer to join a meeting
                    </AppText>

                    {/* Input Field */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Paste code or link"
                            placeholderTextColor="#999999"
                            value={code}
                            onChangeText={setCode}
                            editable={!isLoading}
                            multiline
                            numberOfLines={2}
                        />
                        {code.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClear}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Image
                                    source={require('@/assets/icons/close.png')}
                                    style={styles.clearIcon}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            activeOpacity={0.7}
                            disabled={isLoading}
                        >
                            <AppText variant="semiBold" style={styles.cancelButtonText}>
                                Cancel
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                !code.trim() && styles.joinButtonDisabled,
                            ]}
                            onPress={handleJoin}
                            activeOpacity={0.8}
                            disabled={!code.trim() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <AppText variant="semiBold" style={styles.joinButtonText}>
                                    Join
                                </AppText>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: normalize(20),
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(24),
        paddingHorizontal: normalize(24),
        paddingVertical: normalize(28),
        width: '100%',
        maxWidth: normalize(360),
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginBottom: normalize(8),
        padding: normalize(4),
    },
    closeIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: '#5f6368',
    },
    title: {
        fontSize: normalize(20),
        color: '#000000',
        marginBottom: normalize(12),
        textAlign: 'center',
    },
    description: {
        fontSize: normalize(14),
        color: '#5f6368',
        textAlign: 'center',
        lineHeight: normalize(20),
        marginBottom: normalize(28),
    },
    inputContainer: {
        position: 'relative',
        marginBottom: normalize(28),
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: normalize(12),
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(14),
        fontSize: normalize(15),
        color: '#000000',
        minHeight: normalize(56),
        maxHeight: normalize(100),
        fontFamily: 'Lato-Regular',
        textAlignVertical: 'top',
    },
    clearButton: {
        position: 'absolute',
        right: normalize(12),
        top: normalize(12),
        padding: normalize(4),
    },
    clearIcon: {
        width: normalize(18),
        height: normalize(18),
        tintColor: '#999999',
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: normalize(12),
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: normalize(12),
        height: normalize(48),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        color: Colors.primary,
        fontSize: normalize(15),
    },
    joinButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: normalize(12),
        height: normalize(48),
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinButtonDisabled: {
        backgroundColor: '#D1D5DB',
        opacity: 0.6,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: normalize(15),
    },
});

export default JoinWithCodeModal;
