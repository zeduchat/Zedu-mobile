import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import moment from 'moment';
import { normalize } from '@/utils/normalize';
import { ensureHttpsUrl } from '@/utils/link-url';
import MediaViewer from '../chat/media-viewer';
import { useDataContext } from '@/store/useDataContext';
import ReactionDetailsSheet from '../chat/reaction-details';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ShowNotify } from '@/components/ui/toast';
import { AudioMessagePlayer } from '../chat/audio-message-player';
import { parseMessageTextWithLinks } from '@/utils/message-text';
import { ForwardedMessageBlock } from '../chat/forwarded-message-block';
import {
  getForwardedMessageFromItem,
  hasForwardComment,
} from '@/utils/forward-message';
import {
  ChatFileAttachmentCard,
  ChatFilePreviewModal,
} from '../chat/chat-file-attachment';
import { isVoiceMessageMedia } from '@/utils/voice-message';
import { isVideoFile } from '@/utils/file-helpers';

const { width } = Dimensions.get('window');

const MessageItem = ({
  item,
  index,
  messages,
  onLongPress,
  onMentionUser,
  editMsgId,
  onEdit,
}: any) => {
  const isReceived = !item.sent;
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [filePreviewVisible, setFilePreviewVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const { state, dispatch } = useDataContext();
  const [reactionSheetVisible, setReactionSheetVisible] = useState(false);
  const [_usernames, _setUsernames] = useState(null);
  const navigation = useNavigation();

  const forwardData = getForwardedMessageFromItem(item);
  const showForwardComment = hasForwardComment(item);

  const showDateHeader =
    index === messages.length - 1 ||
    moment(messages[index + 1].created_at).format('YYYY-MM-DD') !==
      moment(item.created_at).format('YYYY-MM-DD');

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
    dispatch({ type: ACTIONS.SELECTED_MSG, payload: item });
    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: { data: item.preview_reply, page: 1 },
    });

    navigation.navigate('ChatStack', {
      screen: 'GroupChatThreadScreen',
      params: {
        thread_id: item?.thread_id,
        channel_id: item?.channels_id,
      },
    });
    dispatch({ type: ACTIONS.LOAD_THREAD, payload: !state.loadThreadCallback });
  };

  // render media section
  const renderMediaItem = (mediaItem: any) => {
    const type = mediaItem?.file_type?.toLowerCase();

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(
      type,
    );
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
          <FastImage
            source={{ uri: mediaItem.file_link }}
            style={styles.mediaImage}
          />
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
        activeOpacity={0.8}
        onPress={() => setReactionSheetVisible(true)}
        style={[
          styles.reactionBadge,
          !item.sent ? styles.sentReactionPos : styles.receivedReactionPos,
        ]}
      >
        <View style={styles.reactionEmojiRow}>
          {item.reactions.slice(0, 3).map((r: any, i: number) => (
            <AppText
              key={i}
              style={[
                styles.reactionEmoji,
                { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -2 },
              ]}
            >
              {r.reaction}
            </AppText>
          ))}
          {item.reactions.length > 1 && (
            <AppText size={12} style={styles.reactionCountText}>
              {item.reactions.length}
            </AppText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReplyParticipants = () => {
    const replies = Array.isArray(item?.messages) ? item.messages : [];
    const replyCount = item.message_count;
    if (replyCount === 0) return null;

    const visibleParticipants = replies.slice(0, 3);
    const remaining = replyCount - visibleParticipants.length;

    // Dynamic alignment for reply bar
    const replyBarStyle = [
      styles.slackThreadContainer,
      item.sent ? styles.replyBarSent : styles.replyBarReceived,
    ];

    return (
      <TouchableOpacity
        style={replyBarStyle}
        activeOpacity={0.8}
        onPress={handleThread}
      >
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
          <AppText size={11} style={styles.threadCountExtra}>
            +{remaining}
          </AppText>
        )}
        <Ionicons
          name="chevron-forward"
          size={14}
          color={Colors.primary}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    );
  };

  const openMessageLink = async (url: string) => {
    if (!url) return;

    const href = ensureHttpsUrl(url);

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
    const rawText = item.message || '';
    const parts = rawText.split(/(<span.*?<\/span>)/g);

    return (
      <AppText style={styles.messageText}>
        {parts.map((part: string, partIndex: number) => {
          if (!part) return null;

          if (part.startsWith('<span')) {
            const labelMatch = part.match(/data-label="(.*?)"/);
            const idMatch = part.match(/data-id="(.*?)"/);
            const label = labelMatch ? labelMatch[1] : '';
            const userId = idMatch ? idMatch[1] : '';

            return (
              <AppText
                key={`mention-${partIndex}`}
                style={styles.mentionText}
                onPress={() => onMentionUser?.(userId)}
              >
                @{label}
              </AppText>
            );
          }

          return parseMessageTextWithLinks(part).map(
            (segment, segmentIndex) => {
              const key = `text-${partIndex}-${segmentIndex}`;

              if (segment.type === 'link' && segment.url) {
                return (
                  <AppText
                    key={key}
                    style={styles.linkText}
                    onPress={() => openMessageLink(segment.url!)}
                  >
                    {segment.content}
                  </AppText>
                );
              }

              return (
                <React.Fragment key={key}>{segment.content}</React.Fragment>
              );
            },
          );
        })}
      </AppText>
    );
  };

  //

  return (
    <View>
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <AppText style={styles.dateText}>
            {moment(item.created_at).calendar(null, {
              sameDay: '[Today]',
              lastDay: '[Yesterday]',
              lastWeek: 'MMMM D, YYYY',
              sameElse: 'MMMM D, YYYY',
            })}
          </AppText>
        </View>
      )}

      <View
        style={[
          styles.rowContainer,
          isReceived ? styles.receivedRow : styles.sentRow,
        ]}
      >
        {isReceived && (
          <TouchableOpacity
            style={styles.groupAvatarContainer}
            onPress={() => onMentionUser(item.user_id)}
          >
            <Image
              source={{
                uri: item.avatar_url
                  ? item.avatar_url
                  : item.default_avatar_url,
              }}
              style={styles.groupSenderAvatar}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => onLongPress(item)}
          delayLongPress={200}
          style={[
            styles.messageWrapper,
            !item.sent ? styles.sentWrapper : styles.receivedWrapper,
            isReceived && { maxWidth: '80%' },
          ]}
        >
          <View
            style={[
              styles.bubble,
              !item.sent ? styles.sentBubble : styles.receivedBubble,
              editMsgId === item.thread_id && onEdit
                ? { backgroundColor: Colors.lightYellow }
                : undefined,
            ]}
          >
            {isReceived && (
              <AppText
                size={13}
                variant="bold"
                style={[
                  styles.senderNameLabel,
                  { color: item.senderColor || Colors.primary },
                ]}
              >
                {item.username}
              </AppText>
            )}

            {!forwardData && item.media && item.media.length > 0 && (
              <View style={styles.verticalMediaStack}>
                {item.media.map((m: any) => (
                  <View key={m.id || m.url}>{renderMediaItem(m)}</View>
                ))}
              </View>
            )}

            {item.replyTo && (
              <View style={styles.replyContainer}>
                <AppText size={12} style={{ color: Colors.primary }}>
                  {item.replyToName || 'You'}
                </AppText>
                <AppText size={13} numberOfLines={1}>
                  {item.replyTo}
                </AppText>
              </View>
            )}

            {forwardData
              ? showForwardComment && renderMessageContent()
              : item.message &&
                item.message !== '<p></p>' &&
                renderMessageContent()}

            {forwardData ? (
              <ForwardedMessageBlock
                data={forwardData}
                onMentionUser={onMentionUser}
              />
            ) : null}

            <View style={styles.messageFooter}>
              <AppText size={10} style={styles.timeText}>
                {moment(item.created_at).format('LT')}
              </AppText>
            </View>

            {item.edited && (
              <AppText size={10} style={styles.timeText}>
                Edited
              </AppText>
            )}

            {renderReactions()}
          </View>

          <TouchableOpacity style={styles.threadAction}>
            {item.message_count > 0 && renderReplyParticipants()}
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Reusable Full Screen Component */}
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

      <ReactionDetailsSheet
        visible={reactionSheetVisible}
        onClose={() => setReactionSheetVisible(false)}
        reactions={item.reactions || []}
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
  rowContainer: { flexDirection: 'row' },
  receivedRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 10,
    marginTop: 15,
  },
  sentRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 10,
    marginTop: 15,
  },
  groupAvatarContainer: { marginRight: 8 },
  groupSenderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    objectFit: 'contain',
  },
  senderNameLabel: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2 },
  messageWrapper: { maxWidth: '85%' },
  sentWrapper: { alignSelf: 'flex-end' },
  receivedWrapper: { alignSelf: 'flex-start' },
  verticalMediaStack: { flexDirection: 'column', gap: 4, marginBottom: 2 },
  bubble: {
    padding: 4,
    borderRadius: 12,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 1,
  },
  sentBubble: {
    backgroundColor: Colors.topNavigation,
    borderTopRightRadius: 2,
  },
  receivedBubble: { backgroundColor: Colors.white, borderTopLeftRadius: 2 },
  mediaContainer: {
    position: 'relative',
    backgroundColor: Colors.border,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  videoWrapper: {
    width: width * 0.75,
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  mediaImage: { width: width * 0.75, height: 220, borderRadius: 10 },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  videoDurationLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mediaTimeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaTimeText: { color: 'white' },
  receiptIconSmall: {
    width: 14,
    height: 14,
    marginLeft: 3,
    tintColor: '#53bdeb',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.65,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  playBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: '#8696A0' },
  waveformContainer: {
    flex: 1,
    height: 35,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  waveformLine: {
    height: 2,
    backgroundColor: '#B6B9BB',
    width: '100%',
    borderRadius: 1,
  },
  playbackThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    left: '0%',
  },
  voiceDuration: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    color: '#667781',
  },
  voiceAvatarContainer: {
    position: 'relative',
    width: 36,
    height: 36,
    marginLeft: 4,
  },
  voiceAvatar: { width: 36, height: 36, borderRadius: 18 },
  micBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMic: { width: 8, height: 8, tintColor: '#FFF' },
  complexFileWrapper: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    padding: 10,
    width: width * 0.65,
    marginBottom: 4,
  },
  fileMainRow: { flexDirection: 'row', alignItems: 'center' },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  fileExtText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileNameText: { fontSize: 14, color: '#111B21', fontWeight: '500' },
  fileMetaText: { color: '#667781', marginTop: 2 },
  replyContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 5,
    marginHorizontal: 4,
    marginTop: 4,
  },
  messageText: {
    color: '#111B21',
    fontSize: normalize(15),
    lineHeight: normalize(21),
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mentionText: {
    color: Colors.primary,
    fontSize: normalize(15),
    lineHeight: normalize(21),
  },
  linkText: {
    color: Colors.primary,
    fontSize: normalize(15),
    lineHeight: normalize(21),
    textDecorationLine: 'underline',
  },
  messageFooter: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    paddingRight: 8,
    paddingBottom: 4,
  },
  timeText: { color: '#667781' },
  receiptIcon: { width: 16, height: 16, marginLeft: 4, tintColor: '#53bdeb' },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 15,
  },
  dateText: { color: '#54656F', fontSize: 12, fontWeight: '500' },
  threadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -20,
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
