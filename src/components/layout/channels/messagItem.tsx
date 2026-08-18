
import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MediaViewer from '../chat/media-viewer';
import Video from 'react-native-video';
import moment from 'moment';
import { ChannelChat } from '@/types/channel';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';
import { useDataContext } from '@/store/useDataContext';
import FastImage from 'react-native-fast-image';
import { ShowNotify } from '@/components/ui/toast';
import { AudioMessagePlayer } from '../chat/audio-message-player';
import { parseMessageHtmlForRender } from '@/utils/message-text';
import { ForwardedMessageBlock } from '../chat/forwarded-message-block';
import { getForwardedMessageFromItem, hasForwardComment } from '@/utils/forward-message';
import { ChatFileAttachmentCard, ChatFilePreviewModal } from '../chat/chat-file-attachment';
import { isVoiceMessageMedia } from '@/utils/voice-message';
import { isVideoFile } from '@/utils/file-helpers';
import { parseChannelEventMessage } from '@/lib/channel-event-message';
import { ChannelEventMessageBlock } from './channel-event-message-block';
import { truncateUsernameForChannel } from '@/utils/truncate-username';

const { width } = Dimensions.get('window');

const MessageItem = ({ item, index, messages, onLongPress, isGroup, onMentionUser, editMsgId, onEdit }: any) => {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [filePreviewVisible, setFilePreviewVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const { state, dispatch } = useDataContext()
    const navigation = useNavigation();


    const forwardData = getForwardedMessageFromItem(item);
    const showForwardComment = hasForwardComment(item);
    const channelEventMessage = parseChannelEventMessage(item);

    const showDateHeader = index === messages.length - 1 ||
        moment(messages[index + 1].created_at).format('YYYY-MM-DD') !== moment(item.created_at).format('YYYY-MM-DD');

    const handleFilePress = (mediaItem: any) => {
        setSelectedFile(mediaItem);
        setFilePreviewVisible(true);
    };

    const handleMediaPress = (media: any) => {
        setSelectedMedia(media);
        setViewerVisible(true);
    };

    const handlePress = (item: ChannelChat) => {
        if (item?.type === "system") return
        onLongPress(item)
    }

    // handle reply
    const handleThread = () => {
        dispatch({ type: ACTIONS.SELECTED_MSG, payload: item })
        dispatch({ type: ACTIONS.REPLY_CHAT, payload: { data: item.preview_reply ?? [], page: 1 } })

        navigation.navigate("ChannelStack", { screen: "ChannelThread", params: { thread_id: item?.thread_id, channel_id: item?.channels_id } })
dispatch({ type: ACTIONS.LOAD_THREAD, payload: !state.loadThreadCallback });
    }



    const renderReplyParticipants = () => {
        const replies = Array.isArray(item?.messages) ? item.messages : [];
        const replyCount = item.message_count;
        if (replyCount === 0) return null;

        const visibleParticipants = replies.slice(0, 3);
        const remaining = replyCount - visibleParticipants.length;

        // Dynamic alignment for reply bar
        const replyBarStyle = [
            styles.slackThreadContainer,
            item.sent ? styles.replyBarSent : styles.replyBarReceived
        ];

        return (
            <>
                {visibleParticipants?.length !== 0 &&
                    <TouchableOpacity style={replyBarStyle} activeOpacity={0.8} onPress={handleThread}>
                        <View style={styles.participantStack}>
                            {visibleParticipants.map((reply: any, idx: number) => (
                                <Image
                                    key={reply.id || idx}
                                    source={{ uri: reply.avatar_url || item.default_avatar_url }}
                                    style={[styles.threadAvatar, { marginLeft: idx === 0 ? 0 : -8 }]}
                                />
                            ))}
                        </View>
                        <AppText variant="bold" size={12} style={styles.threadText}>
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </AppText>
                        {remaining > 0 && (
                            <AppText size={11} style={styles.threadCountExtra}>+{remaining}</AppText>
                        )}
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>}
            </>
        );
    };

    const renderMediaItem = (mediaItem: any) => {
        const type = mediaItem?.file_type?.toLowerCase();

        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(type);
        const isAudio = isVoiceMessageMedia(mediaItem);
        const isVideo = !isAudio && isVideoFile(mediaItem);
        const isFile = mediaItem && !isImage && !isVideo && !isAudio;

        if (isImage) {
            return (
                <TouchableOpacity
                    key={mediaItem.id}
                    activeOpacity={0.9}
                    onPress={() => handleMediaPress(mediaItem)}
                    style={styles.mediaContainer}
                >
                    <FastImage source={{ uri: mediaItem.file_link }} style={styles.mediaImage} />
                </TouchableOpacity>
            );
        }

        if (isVideo) {
            return (
                <TouchableOpacity
                    key={mediaItem.id}
                    activeOpacity={0.9}
                    onPress={() => handleMediaPress(mediaItem)}
                    style={styles.mediaContainer}
                >
                    <View style={styles.videoWrapper}>
                        <Video
                            source={{ uri: mediaItem.file_link }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                            paused={true}
                        />
                        <View style={styles.videoPlayOverlay}>
                            <View style={styles.playIconCircle}>
                                <Ionicons name="play" size={32} color="white" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        if (isFile) {
            return (
                <ChatFileAttachmentCard
                    key={mediaItem.id}
                    file={mediaItem}
                    widthRatio={0.65}
                    onPress={() => handleFilePress(mediaItem)}
                />
            );
        }

        if (isAudio) {
            return (
                <AudioMessagePlayer
                    key={mediaItem.id}
                    audioUrl={mediaItem.file_link}
                    media={mediaItem}
                    item={item}
                />
            );
        }

        return null;
    };

    const openMessageLink = async (url: string) => {
        if (!url) return;

        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

        try {
            const supported = await Linking.canOpenURL(href);
            if (supported) {
                await Linking.openURL(href);
            } else {
                ShowNotify('Error', "Don't know how to open this URL: " + href);
            }
        } catch {
            ShowNotify('Error', 'An error occurred while opening the link');
        }
    };

    const renderMessageContent = () => {
        const segments = parseMessageHtmlForRender(item.message || '');

        return (
            <AppText style={styles.messageText}>
                {segments.map((segment, index) => {
                    const key = `segment-${index}`;

                    if (segment.type === 'mention') {
                        return (
                            <AppText
                                key={key}
                                style={styles.mentionText}
                                onPress={() => segment.userId && onMentionUser?.(segment.userId)}
                            >
                                @{segment.label}
                            </AppText>
                        );
                    }

                    if (segment.type === 'link') {
                        return (
                            <AppText
                                key={key}
                                style={styles.linkText}
                                onPress={() => openMessageLink(segment.url)}
                            >
                                {segment.content}
                            </AppText>
                        );
                    }

                    if (segment.type === 'newline') {
                        return '\n';
                    }

                    return segment.content;
                })}
            </AppText>
        );
    };

    return (
        <View>
            {showDateHeader && (
                <View style={styles.dateHeader}>
                    <AppText style={styles.dateText}>
                        {moment(item.created_at).calendar(null, {
                            sameDay: '[Today]',
                            lastDay: '[Yesterday]',
                            lastWeek: 'MMMM D, YYYY',
                            sameElse: 'MMMM D, YYYY'
                        })}
                    </AppText>
                </View>
            )}

            <View style={[styles.rowContainer]}>

                <TouchableOpacity style={styles.groupAvatarContainer} onPress={() => onMentionUser(item.user_id)}>
                    <FastImage
                        source={{ uri: item.avatar_url ? item.avatar_url : item.default_avatar_url }}
                        style={styles.groupSenderAvatar}
                    />
                </TouchableOpacity>

                <View style={styles.messageColumn}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onLongPress={() => handlePress(item)}
                        // delayLongPress={200}
                        style={[
                            styles.messageWrapper,
                            isGroup && { maxWidth: '100%' },
                            editMsgId === item.thread_id && onEdit
                                ? { backgroundColor: Colors.lightYellow }
                                : undefined
                        ]}
                    >

                        <View>
                            <View style={styles.senderRow}>
                                <AppText
                                    size={13}
                                    variant="bold"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={[styles.senderNameLabel, { color: item.senderColor }]}
                                >
                                    {truncateUsernameForChannel(item.username)}
                                </AppText>
                                <AppText size={10} style={styles.timeText}>
                                    {moment(item.created_at).format("h:mm a")}
                                </AppText>
                            </View>

                            {!forwardData && item.media && item.media.length > 0 && (
                                <View style={styles.verticalMediaStack}>
                                    {item.media.map((m: any) => (
                                        <View key={m.id || m.url}>
                                            {renderMediaItem(m)}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {channelEventMessage ? (
                                <ChannelEventMessageBlock data={channelEventMessage} />
                            ) : forwardData
                                ? showForwardComment && renderMessageContent()
                                : item.message && item.message !== '<p></p>' && renderMessageContent()}

                            {forwardData ? (
                                <ForwardedMessageBlock data={forwardData} onMentionUser={onMentionUser} />
                            ) : null}

                            {item.edited && <AppText size={10} style={styles.timeText}>Edited</AppText>}


                            {item?.reactions?.length > 0 &&
                                <View style={styles.reactionContainer}>
                                    {item?.reactions?.map((reaction: any, rIdx: number) => (
                                        <TouchableOpacity
                                            key={rIdx}
                                            style={[
                                                styles.reactionBadge,
                                                reaction.userReacted && styles.reactionBadgeActive
                                            ]}
                                        >
                                            <AppText size={12}>{reaction.reaction}</AppText>
                                            <AppText
                                                size={11}
                                                style={[styles.reactionCount, reaction.userReacted && styles.reactionTextActive]}
                                            >
                                                {reaction.reaction_count}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            }


                            {item.message_count > 0 && renderReplyParticipants()}
                        </View>
                    </TouchableOpacity>
                </View>

                {viewerVisible && (
                    <MediaViewer
                        visible={viewerVisible}
                        onClose={() => setViewerVisible(false)}
                        media={selectedMedia}
                        username={item?.username}
                        fullName={item?.full_name}
                    />
                )}
                <ChatFilePreviewModal
                    visible={filePreviewVisible}
                    file={selectedFile}
                    onClose={() => {
                        setFilePreviewVisible(false);
                        setSelectedFile(null);
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    slackThreadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 18,
        paddingVertical: 4,
        paddingHorizontal: 10,
        // backgroundColor: '#F7F7F8',
        borderRadius: 16,
        minHeight: 36,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 1,
    },
    replyBarSent: {
        alignSelf: 'flex-end',
        marginRight: 8,
    },
    replyBarReceived: {
        alignSelf: 'flex-start',
        marginLeft: 8,
    },
    participantStack: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    threadAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#eee',
    },
    threadText: {
        color: '#444',
        fontWeight: '600',
        marginRight: 4,
    },
    threadCountExtra: {
        color: '#888',
        marginLeft: 2,
        fontWeight: '500',
    },
    rowContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 10, marginBottom: 20 },
    messageColumn: { flex: 1, minWidth: 0, paddingRight: 10 },
    groupAvatarContainer: { marginRight: 5 },
    groupSenderAvatar: { width: 35, height: 35, borderRadius: 50, borderWidth: 1, borderColor: Colors.border },
    senderNameLabel: { minWidth: 0, marginRight: 4 },
    senderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        paddingTop: 4,
        paddingBottom: 2,
    },
    timeText: { color: '#667781', flexShrink: 0 },
    messageWrapper: { maxWidth: '100%', marginTop: -3 },
    mediaContainer: { position: 'relative', borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10 },
    videoWrapper: { width: '100%', maxWidth: width * 0.75, height: 220, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
    verticalMediaStack: { flexDirection: 'column', gap: 4, marginBottom: 2, marginTop: 5, maxWidth: '100%', alignSelf: 'flex-start' },
    mediaImage: { width: '100%', maxWidth: width * 0.75, height: 220, borderRadius: 10 },
    videoPlayOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
    playIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
    videoDurationLabel: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    mediaTimeOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    mediaTimeText: { color: 'white' },
    receiptIconSmall: { width: 14, height: 14, marginLeft: 3, tintColor: '#53bdeb' },
    voiceContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.65, paddingVertical: 10, paddingHorizontal: 6 },
    playBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    playIcon: { color: '#8696A0' },
    waveformContainer: { flex: 1, height: 35, justifyContent: 'center', marginHorizontal: 8 },
    waveformLine: { height: 2, backgroundColor: '#B6B9BB', width: '100%', borderRadius: 1 },
    playbackThumb: { width: 10, height: 10, borderRadius: 5, position: 'absolute', left: '0%' },
    voiceDuration: { position: 'absolute', bottom: -2, left: 0, color: '#667781' },
    voiceAvatarContainer: { position: 'relative', width: 36, height: 36, marginLeft: 4 },
    voiceAvatar: { width: 36, height: 36, borderRadius: 18 },
    micBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
    miniMic: { width: 8, height: 8, tintColor: '#FFF' },
    complexFileWrapper: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: 10, width: width * 0.65, marginBottom: 4 },
    fileMainRow: { flexDirection: 'row', alignItems: 'center' },
    fileIconBox: { width: 42, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center', elevation: 1 },
    fileExtText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    fileInfo: { flex: 1, marginLeft: 12 },
    fileNameText: { fontSize: 14, color: '#111B21', fontWeight: '500' },
    fileMetaText: { color: '#667781', marginTop: 2 },
    messageText: { color: '#111B21', fontSize: 15, lineHeight: 21, paddingHorizontal: 8, paddingVertical: 4 },
    mentionText: { color: Colors.primary, fontSize: 15, lineHeight: 21 },
    linkText: { color: Colors.primary, fontSize: 15, lineHeight: 21, textDecorationLine: 'underline' },
    dateHeader: { alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginVertical: 15 },
    dateText: { color: '#54656F', fontSize: 12, fontWeight: '500' },

    // SLACK SPECIFIC STYLES
    reactionContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginTop: 4 },
    reactionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
    reactionBadgeActive: { backgroundColor: '#E8F5FE', borderColor: '#007AFF' },
    reactionCount: { marginLeft: 4, color: '#667781' },
    reactionTextActive: { color: '#007AFF', fontWeight: 'bold' },
});

export default MessageItem;