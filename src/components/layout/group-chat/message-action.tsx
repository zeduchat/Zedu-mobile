import React, { forwardRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import EmojiPicker from 'rn-emoji-keyboard';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '@/utils/normalize';
import { DeleteRequest, PostRequest } from '@/utils/requests';
import { ChatItem } from '@/types/chats';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';


const DEFAULT_EMOJIS = ['👍', '😂', '🙏', '✅', '😭', '❤️', '👏'];

export const MessageAction = forwardRef<AppBottomSheetRef, { item: any, onClose: () => void }>(({ item, onClose }, ref) => {
    const [isEmojiTrayOpen, setIsEmojiTrayOpen] = useState(false);
    const navigation = useNavigation();
    const [mode, setMode] = useState<'actions' | 'delete'>('actions');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { state, dispatch } = useDataContext()
    const { user } = state


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

    // navigate to thread
    const handleThread = () => {
        dispatch({ type: ACTIONS.SELECTED_MSG, payload: item })
        dispatch({ type: ACTIONS.REPLY_CHAT, payload: { data: item.preview_reply, page: 1 } })
         navigation.navigate("ChatStack", { screen: "GroupChatThreadScreen", params: { thread_id: item?.thread_id, channel_id: item?.channels_id } })

        setTimeout(() => {
            if (ref && "current" in ref) {
                ref.current?.close();
            }
        }, 500)
    }

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

    // 

    return (
        <>
            <AppBottomSheet
                ref={ref}
                snapPoints={mode === 'delete' ? ['40%'] : ['65%']}
                paddingBottom={normalize(110)}
                onClose={() => {
                    setMode('actions');
                    onClose();
                }}
            >
                {mode === 'actions' ? (
                    <>
                        <View style={styles.pinnedHeader}>
                            {item?.avatar_url ?
                                <Image source={{ uri: item?.avatar_url }} style={styles.avatar} />
                                :
                                <Image source={{ uri: item?.default_avatar_url }} style={styles.avatar} />
                            }
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
                            <ActionItem label="Forward" icon={require('@/assets/icons/forward.png')} />
                            <ActionItem label="Copy Message" icon={require('@/assets/icons/copy.png')} />
                            <ActionItem label="Copy link to Message" icon={require('@/assets/icons/link.png')} />
                            {item?.user_id === user?.user_id &&
                                <ActionItem
                                    label="Delete"
                                    icon={require('@/assets/icons/delete.png')}
                                    isDestructive
                                    handleClick={() => setMode('delete')}
                                />}
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
                onEmojiSelected={() => {}}
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
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
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