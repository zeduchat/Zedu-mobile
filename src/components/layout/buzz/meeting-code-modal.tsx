import React from 'react';
import {
    StyleSheet,
    View,
    Modal,
    TouchableOpacity,
    Image,
    Pressable,
    Clipboard,
    Share,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import { ShowNotify } from '@/components/ui/toast';
import Toast from 'react-native-toast-message';
import {CLIENT_URL} from '@env';

interface Props {
    visible: boolean;
    onClose: () => void;
    link: string;
}

const MeetingLinkModal = ({ visible, onClose, link }: Props) => {
    

    const copyToClipboard = async () => {
        try {
            await Clipboard.setString(link);
            ShowNotify('Success', 'Meeting link copied to clipboard');
        } catch (error) {
            ShowNotify('Error', 'Failed to copy link');
        }
    };

    const handleShareInvite = async () => {
        try {
            await Share.share({
                message: `Join my meeting:`,
                title: 'Buzz Meeting Invite',
                url: link,
            });
        } catch (error) {
            ShowNotify('Error', 'Failed to share invite');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalCard}>
                    <AppText variant="bold" style={styles.title}>
                        Here’s the link to your meeting
                    </AppText>
                    
                    <AppText variant="regular" style={styles.description}>
                        Copy this link and send it to people that you want to meet with. 
                        Be sure that you save it so you can use it later, too.
                    </AppText>

                    <View style={styles.linkContainer}>
                        <AppText numberOfLines={1} style={styles.linkText}>
                            {link}
                        </AppText>
                        <TouchableOpacity onPress={copyToClipboard} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <Image 
                                source={require('@/assets/icons/share.png')} 
                                style={styles.copyIcon} 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite} activeOpacity={0.8}>
                        <Image 
                            source={require('@/assets/icons/share.png')} 
                            style={styles.shareIcon} 
                        />
                        <AppText variant="semiBold" style={styles.shareText}>
                            Share invite
                        </AppText>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: normalize(20),
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(24),
        paddingHorizontal: normalize(24),
        paddingVertical: normalize(32),
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: normalize(20),
        color: '#000000',
        textAlign: 'center',
        marginBottom: normalize(16),
    },
    description: {
        fontSize: normalize(15),
        color: '#000000',
        textAlign: 'center',
        lineHeight: normalize(22),
        marginBottom: normalize(24),
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: normalize(16),
        height: normalize(56),
        width: '100%',
        marginBottom: normalize(24),
    },
    linkText: {
        flex: 1,
        fontSize: normalize(15),
        color: '#374151',
        marginRight: normalize(12),
    },
    copyIcon: {
        width: normalize(22),
        height: normalize(22),
        tintColor: '#374151',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#6b46ff',
        borderRadius: normalize(12),
        height: normalize(52),
        width: normalize(160),
    },
    shareIcon: {
        width: normalize(18),
        height: normalize(18),
        tintColor: '#6b46ff',
        marginRight: normalize(8),
    },
    shareText: {
        color: '#6b46ff',
        fontSize: normalize(15),
    },
});

export default MeetingLinkModal;