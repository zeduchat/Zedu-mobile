import React, { forwardRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Clipboard } from 'react-native';
import EmojiPicker, { EmojiType } from 'rn-emoji-keyboard';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { normalize } from '@/utils/normalize';
import { PostRequest, DeleteRequest } from '@/utils/requests';
import { useNavigation } from '@react-navigation/native';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { ShowNotify } from '@/components/ui/toast';
import { buildMessageShareLink, getPlainMessageText } from '@/utils/message-text';
import { ThreadChatType } from '@/utils/thread-message';
import { ForwardMessageModal } from '@/components/layout/chat/forward-message-modal';
import { buildForwardSourceContext } from '@/utils/forward-message';

const DEFAULT_EMOJIS = ['👍', '😂', '🙏', '✅', '😭', '❤️', '👏'];

export const MessageAction = forwardRef<AppBottomSheetRef, {
    item: any;
    onClose: () => void;
    handleEdit: () => void;
    threadChatType?: ThreadChatType;
}>(({ item, onClose, handleEdit, threadChatType = 'dm' }, ref) => {
    const [isEmojiTrayOpen, setIsEmojiTrayOpen] = useState(false);
    const [mode, setMode] = useState<'actions' | 'delete'>('actions');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isForwardOpen, setIsForwardOpen] = useState(false);
    const [forwardItem, setForwardItem] = useState<any>(null);
    const navigation = useNavigation();
    const { state, dispatch } = useDataContext()

    const handleEmoji = async (emoji: string) => {
        const payload = {
            thread_id: item?.thread_id,
            type: "thread",
            reaction: emoji,
        };

        await PostRequest(`/reactions/${item.channels_id || item.channel_id}`, payload);

        if (ref && "current" in ref) {
            ref.current?.close();
        }
        onClose();
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            // Updated to match your web implementation endpoint structure
            const { error } = await DeleteRequest(
                `/threads/${item?.thread_id}/channels/${item?.channels_id || item?.channel_id}`
            );

            // https://api.zedu.chat/api/v1/channels/019bd825-1c64-7e75-9b2d-47ca8cc8d6cd/messages/019fd75b-da45-7ac7-a84b-9b641761d113
            // https://api.zedu.chat/api/v1/channels/019d1627-4438-75d6-90f0-ab55140a9b9f/messages/019fd77d-3465-7af9-9e27-42f8feea67d6
            dispatch({
                type: ACTIONS.CHANNEL_CALLBACK,
                payload: !state?.channelCallback,
            });
            dispatch({
                type: ACTIONS.CALLBACK,
                payload: !state?.callback,
            });

            if (!error) {
                if (ref && "current" in ref) {
                    ref.current?.close();
                }
                onClose();
            }
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const ActionItem = ({ label, icon, isDestructive, handleClick, isLoading }: any) => (
        <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={handleClick}
            disabled={isLoading}
        >
            <View style={[styles.iconWrapper, isDestructive && { backgroundColor: '#FFF1F0' }]}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                    <Image source={icon} style={[styles.icon, isDestructive && { tintColor: '#FF3B30' }]} />
                )}
            </View>
            <AppText size={15} style={[styles.label, isDestructive && { color: '#FF3B30' }]}>
                {label}
            </AppText>
        </TouchableOpacity>
    );

    const closeSheet = () => {
        if (ref && 'current' in ref) {
            ref.current?.close();
        }
        onClose();
    };

    const handleCopyMessage = async () => {
        const text = getPlainMessageText(item?.message || '');

        if (!text) {
            ShowNotify('Error', 'Nothing to copy');
            return;
        }

        try {
            Clipboard.setString(text);
            ShowNotify('Success', 'Message copied to clipboard');
            closeSheet();
        } catch {
            ShowNotify('Error', 'Failed to copy message');
        }
    };

    const handleCopyMessageLink = async () => {
        const channelId = item?.channels_id || item?.channel_id;
        const threadId = item?.thread_id;

        if (!channelId || !threadId) {
            ShowNotify('Error', 'Unable to copy link for this message');
            return;
        }

        const link =
            item?.message_url ||
            item?.message_link ||
            buildMessageShareLink({
                threadId,
                channelId,
                orgSlug: state?.orgData?.name,
                context: 'dm',
            });

        try {
            Clipboard.setString(link);
            ShowNotify('Success', 'Message link copied to clipboard');
            closeSheet();
        } catch {
            ShowNotify('Error', 'Failed to copy message link');
        }
    };

    // handle reply
    const handleThread = () => {
        dispatch({ type: ACTIONS.SELECTED_MSG, payload: item })
        dispatch({ type: ACTIONS.REPLY_CHAT, payload: { data: item.preview_reply, page: 1 } })

        if (threadChatType === 'channel') {
            navigation.navigate('ChannelStack', {
                screen: 'ChannelThread',
                params: {
                    thread_id: item?.thread_id,
                    channel_id: item?.channels_id || item?.channel_id,
                },
            });
        } else if (threadChatType === 'group_dm') {
            navigation.navigate('ChatStack', {
                screen: 'GroupChatThreadScreen',
                params: {
                    thread_id: item?.thread_id,
                    channel_id: item?.channels_id || item?.channel_id,
                },
            });
        } else {
            navigation.navigate('ChatStack', {
                screen: 'ChatThreadScreen',
                params: {
                    thread_id: item?.thread_id,
                    channel_id: item?.channels_id || item?.channel_id,
                    chatType: threadChatType,
                },
            });
        }

        setTimeout(() => {
            if (ref && "current" in ref) {
                ref.current?.close();
            }
        }, 500)
    }

    const handleForward = () => {
        if (!item) return;

        setForwardItem({ ...item });
        setIsForwardOpen(true);

        if (ref && 'current' in ref) {
            ref.current?.close();
        }
    };

    const handleForwardClose = () => {
        setIsForwardOpen(false);
        setForwardItem(null);
        onClose();
    };


    return (
        <>
            <ForwardMessageModal
                visible={isForwardOpen}
                item={forwardItem}
                sourceContext={forwardItem ? buildForwardSourceContext(forwardItem, threadChatType, state) : undefined}
                threadChatType={threadChatType}
                onClose={handleForwardClose}
            />

            <AppBottomSheet
                ref={ref}
                snapPoints={mode === 'delete' ? ['40%'] : ['65%']}
                paddingBottom={normalize(110)}
                onClose={() => {
                    setMode('actions');
                    if (!isForwardOpen) {
                        onClose();
                    }
                }}
            >
                {mode === 'actions' ? (
                    <>
                        <View style={styles.pinnedHeader}>
                            <Image source={{ uri: item?.avatar_url ? item?.avatar_url : item?.default_avatar_url }} style={styles.avatar} />

                            <View style={styles.textContainer}>
                                <AppText variant="medium" size={14}>{item?.username}</AppText>
                                <AppText size={13} style={{ color: '#667781', marginTop: 2 }}>{item?.message?.replace(/<[^>]*>?/gm, '') || "Media"}</AppText>
                            </View>
                        </View>

                        <View style={styles.reactionContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reactionScroll}>
                                {DEFAULT_EMOJIS.map((emoji) => (
                                    <TouchableOpacity key={emoji} onPress={() => handleEmoji(emoji)}>
                                        <AppText size={20}>{emoji}</AppText>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={styles.plusBtn} onPress={() => setIsEmojiTrayOpen(true)}>
                                    <Image source={require('@/assets/icons/emoji.png')} style={styles.inputIcon} />
                                </TouchableOpacity>
                            </ScrollView>
                        </View>

                        <ScrollView bounces={false}>
                            <ActionItem label="Reply" icon={require('@/assets/icons/reply.png')} handleClick={handleThread} />
                            {item?.user_id === state?.user?.user_id &&
                                <ActionItem label="Edit Message" icon={require('@/assets/icons/edit-message.png')} handleClick={handleEdit} />
                            }
                            {/* <ActionItem label="Forward" icon={require('@/assets/icons/forward.png')} handleClick={handleForward} /> */}
                            <ActionItem label="Copy Message" icon={require('@/assets/icons/copy.png')} handleClick={handleCopyMessage} />
                            <ActionItem label="Copy link to Message" icon={require('@/assets/icons/link.png')} handleClick={handleCopyMessageLink} />
                            {item?.user_id === state?.user?.user_id &&
                                <ActionItem
                                    label="Delete"
                                    icon={require('@/assets/icons/delete.png')}
                                    isDestructive
                                    handleClick={() => setMode('delete')}
                                />
                            }
                        </ScrollView>
                    </>
                ) : (
                    <View style={styles.deleteConfirmContainer}>
                        <AppText variant="medium" size={16} style={styles.deleteTitle}>Delete Message?</AppText>
                        <View style={{ marginTop: 15 }}>
                            <ActionItem
                                label="Delete for everyone"
                                icon={require('@/assets/icons/delete.png')}
                                isDestructive
                                handleClick={handleDelete}
                                isLoading={deleteLoading}
                            />
                            <ActionItem
                                label="Cancel"
                                icon={require('@/assets/icons/emoji.png')}
                                handleClick={() => setMode('actions')}
                            />
                        </View>
                    </View>
                )}
            </AppBottomSheet>

            <EmojiPicker
                onEmojiSelected={(emoji: EmojiType) => handleEmoji(emoji.emoji)}
                open={isEmojiTrayOpen}
                onClose={() => setIsEmojiTrayOpen(false)}
                enableRecentlyUsed
                categoryPosition="bottom"
                enableSearchBar
                disableSafeArea={true}
                allowMultipleSelections
                emojiSize={25}
                defaultHeight={600}
            />
        </>
    );
});

const styles = StyleSheet.create({
    pinnedHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 0.5, borderColor: Colors.border },
    textContainer: { flex: 1 },
    reactionContainer: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#F0F2F5' },
    reactionScroll: { flex: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20 },
    iconWrapper: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    icon: { width: 20, height: 20, tintColor: '#111B21' },
    label: { color: '#111B21' },
    inputIcon: { width: 24, height: 24, tintColor: '#54656F' },
    deleteConfirmContainer: { paddingVertical: 10 },
    deleteTitle: { paddingHorizontal: 20, color: '#111B21' },
});