import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MediaViewer from './media-viewer';
import moment from 'moment';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { normalize } from '@/utils/normalize';
import { ACTIONS } from '@/store/types';
import { parseMessageHtmlForRender } from '@/utils/message-text';
import { ForwardedMessageBlock } from './forwarded-message-block';
import { getForwardedMessageFromItem, hasForwardComment } from '@/utils/forward-message';
import { useDataContext } from '@/store/useDataContext';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ShowNotify } from '@/components/ui/toast';
import { AudioMessagePlayer } from './audio-message-player';
import { ChatFileAttachmentCard, ChatFilePreviewModal } from './chat-file-attachment';
import { isVoiceMessageMedia } from '@/utils/voice-message';
import { isVideoFile } from '@/utils/file-helpers';


const { width } = Dimensions.get('window');

const MessageItem = ({ item, index, messages, onLongPress, editMsgId, onEdit }: any) => {
    const [viewerVisible, setViewerVisible] = React.useState(false);
    const [selectedMedia, setSelectedMedia] = React.useState<any>(null);
    const [filePreviewVisible, setFilePreviewVisible] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<any>(null);
    const navigation = useNavigation();
    const { state, dispatch } = useDataContext()

    const forwardData = getForwardedMessageFromItem(item);
    const showForwardComment = hasForwardComment(item);

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


    // handle reply
    const handleThread = () => {
        dispatch({ type: ACTIONS.SELECTED_MSG, payload: item })
        dispatch({ type: ACTIONS.REPLY_CHAT, payload: { data: item.preview_reply, page: 1 } })

        navigation.navigate("ChatStack", { screen: "ChatThreadScreen", params: { thread_id: item?.thread_id, channel_id: item?.channels_id } })
        dispatch({ type: ACTIONS.LOAD_THREAD, payload: !state.loadThreadCallback });
    }

    // render media section
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

    // render reaction section
    const renderReactions = () => {
        if (!item.reactions || item.reactions.length === 0) return null;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={[
                    styles.reactionBadge,
                    item.sent ? styles.sentReactionPos : styles.receivedReactionPos
                ]}
            >
                <View style={styles.reactionEmojiRow}>
                    {item.reactions.slice(0, 3).map((r: any, i: number) => (
                        <AppText
                            key={r.reaction_id || i}
                            style={[
                                styles.reactionEmoji,
                                { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -1 }
                            ]}
                        >
                            {r.reaction}
                        </AppText>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    // reply participants rendering (max 3 avatars + count)
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
            </TouchableOpacity>
        );
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
                            <AppText key={key} style={styles.mentionText}>
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

            <TouchableOpacity
                activeOpacity={0.5}
                onLongPress={() => onLongPress(item)}
                // delayLongPress={200}
                style={[
                    styles.messageWrapper,
                    item.sent ? styles.sentWrapper : styles.receivedWrapper,

                ]}
            >
                <View style={[styles.bubble, item.sent ? styles.sentBubble : styles.receivedBubble, editMsgId === item.thread_id && onEdit
                    ? { backgroundColor: Colors.lightYellow }
                    : undefined]}>

                    {!forwardData && item.media && item.media.length > 0 && (
                        <View style={styles.verticalMediaStack}>
                            {item.media.map((m: any) => (
                                <View key={m.id || m.url}>
                                    {renderMediaItem(m)}
                                </View>
                            ))}
                        </View>
                    )}

                    {forwardData
                        ? showForwardComment && renderMessageContent()
                        : item.message && item.message !== '<p></p>' && renderMessageContent()}

                    {forwardData ? <ForwardedMessageBlock data={forwardData} /> : null}

                    <View style={styles.messageFooter}>
                        <AppText size={10} style={styles.timeText}>{moment(item.created_at).format("LT")}</AppText>
                    </View>
                    {item.edited && <AppText size={10} style={styles.timeText}>Edited</AppText>}

                    {renderReactions()}
                </View>
            </TouchableOpacity>

            {item.message_count > 0 && renderReplyParticipants()}

            {selectedMedia &&
                <MediaViewer
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    media={selectedMedia}
                    username={item?.username}
                    fullName={item?.full_name}
                />}

            <ChatFilePreviewModal
                visible={filePreviewVisible}
                file={selectedFile}
                onClose={() => {
                    setFilePreviewVisible(false);
                    setSelectedFile(null);
                }}
            />
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
        backgroundColor: '#F7F7F8',
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
    messageWrapper: { maxWidth: '85%' },
    sentWrapper: { alignSelf: 'flex-end' },
    receivedWrapper: { alignSelf: 'flex-start' },
    bubble: { padding: 4, borderRadius: 12, elevation: 0.5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 1 },
    sentBubble: { backgroundColor: Colors.topNavigation, borderTopRightRadius: 2 },
    receivedBubble: { backgroundColor: Colors.white, borderTopLeftRadius: 2 },
    verticalMediaStack: { flexDirection: 'column', gap: 4, marginBottom: 2 },
    mediaContainer: { position: 'relative', backgroundColor: Colors.border, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 10 },
    videoWrapper: { width: width * 0.75, height: 220, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
    mediaImage: { width: width * 0.75, height: 220, borderRadius: 10 },
    videoPlayOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
    playIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
    mediaTimeOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    mediaTimeText: { color: 'white' },
    receiptIconSmall: { width: 14, height: 14, marginLeft: 3, tintColor: '#53bdeb' },
    voiceContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.72, paddingVertical: 10, paddingHorizontal: 6 },
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
    complexFileWrapper: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: 10, width: width * 0.75, marginBottom: 4 },
    fileMainRow: { flexDirection: 'row', alignItems: 'center' },
    fileIconBox: { width: 42, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center', elevation: 1 },
    fileExtText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    fileInfo: { flex: 1, marginLeft: 12 },
    fileNameText: { fontSize: 14, color: '#111B21', fontWeight: '500' },
    fileMetaText: { color: '#667781', marginTop: 2 },
    messageText: { color: '#111B21', fontSize: normalize(15), lineHeight: normalize(21), paddingHorizontal: 8, paddingVertical: 4 },
    mentionText: { color: Colors.primary, fontSize: normalize(15), lineHeight: normalize(21) },
    linkText: { color: Colors.primary, fontSize: normalize(15), lineHeight: normalize(21), textDecorationLine: 'underline' },
    messageFooter: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginTop: 2, paddingRight: 8, paddingBottom: 4 },
    timeText: { color: '#667781' },
    receiptIcon: { width: 16, height: 16, marginLeft: 4, tintColor: '#53bdeb' },
    dateHeader: { alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginVertical: 15 },
    dateText: { color: '#54656F', fontSize: 12, fontWeight: '500' },
    reactionBadge: {
        position: 'absolute',
        bottom: -12,
        backgroundColor: '#F0F2F5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sentReactionPos: { right: 10 },
    receivedReactionPos: { left: 10 },
    reactionEmojiRow: { flexDirection: 'row', alignItems: 'center' },
    reactionEmoji: { fontSize: 13, backgroundColor: '#F0F2F5', borderRadius: 10 },
    reactionCountText: { marginLeft: 2, color: '#667781', fontWeight: '600' },
});

export default MessageItem;