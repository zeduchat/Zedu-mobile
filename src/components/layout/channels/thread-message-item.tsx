import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MediaViewer from '../chat/media-viewer';
import Video from 'react-native-video';
import moment from 'moment';
import { ChannelChat } from '@/types/channel';
import Markdown from 'react-native-markdown-display';
import FastImage from 'react-native-fast-image';
import { UserStatusIcon } from '@/components/ui/user-status-icon';
import { truncateUsernameForChannel } from '@/utils/truncate-username';
import { isVideoFile } from '@/utils/file-helpers';
import { isVoiceMessageMedia } from '@/utils/voice-message';
import { AudioMessagePlayer } from '../chat/audio-message-player';

const { width } = Dimensions.get('window');

const ThreadMessageItem = ({
  item,
  index,
  messages,
  onLongPress,
  isGroup,
  inverted = false,
}: any) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const markdownStyles = {
    text: { color: '#111B21', fontSize: 15 },
    paragraph: { marginVertical: 0 },
    strong: { fontWeight: 'bold' as const, color: '#111B21' },
    em: { fontStyle: 'italic' as const, color: '#111B21' },
  };

  let showDateHeader = false;
  try {
    if (inverted) {
      // For inverted lists the visual previous item is at index + 1
      showDateHeader =
        index === messages.length - 1 ||
        (messages[index + 1] &&
          moment(messages[index + 1].created_at).format('YYYY-MM-DD') !==
            moment(item.created_at).format('YYYY-MM-DD'));
    } else {
      // Normal lists: show header when the previous item has a different date
      showDateHeader =
        index === 0 ||
        (messages[index - 1] &&
          moment(messages[index - 1].created_at).format('YYYY-MM-DD') !==
            moment(item.created_at).format('YYYY-MM-DD'));
    }
  } catch (_err) {
    showDateHeader = false;
  }

  const getFileTheme = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { color: '#FF5722', label: 'PDF' };
    if (ext === 'doc' || ext === 'docx')
      return { color: '#2B579A', label: 'DOC' };
    if (ext === 'xls' || ext === 'xlsx')
      return { color: '#217346', label: 'XLS' };
    return { color: '#607D8B', label: 'FILE' };
  };

  const handleMediaPress = (media: any) => {
    setSelectedMedia(media);
    setViewerVisible(true);
  };

  const handlePress = (item: ChannelChat) => {
    if (item?.type === 'system') return;
    onLongPress(item);
  };

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
      const theme = getFileTheme(mediaItem.file_name);
      return (
        <View key={mediaItem.id} style={styles.complexFileWrapper}>
          <View style={styles.fileMainRow}>
            <View
              style={[styles.fileIconBox, { backgroundColor: theme.color }]}
            >
              <AppText style={styles.fileExtText}>{theme.label}</AppText>
            </View>
            <View style={styles.fileInfo}>
              <AppText numberOfLines={1} style={styles.fileNameText}>
                {mediaItem.file_name}
              </AppText>
              <AppText size={11} style={styles.fileMetaText}>
                {(mediaItem.size / 1024).toFixed(1)} KB • {theme.label}
              </AppText>
            </View>
          </View>
        </View>
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

      <View style={[styles.rowContainer]}>
        <UserStatusIcon user={item} style={styles.threadStatusIcon} />
        <View style={styles.groupAvatarContainer}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={styles.groupSenderAvatar}
            />
          ) : (
            <Image
              source={require('@/assets/images/user.png')}
              style={styles.groupSenderAvatar}
            />
          )}
        </View>

        <View style={styles.messageColumn}>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handlePress(item)}
            delayLongPress={200}
            style={[styles.messageWrapper, isGroup && { maxWidth: '100%' }]}
          >
            <View>
              <View style={styles.senderRow}>
                <AppText
                  size={13}
                  variant="bold"
                  numberOfLines={1}
                  style={{
                    color: item.senderColor,
                    flex: 1,
                    minWidth: 0,
                    marginRight: 4,
                  }}
                >
                  {truncateUsernameForChannel(item.username)}
                </AppText>
                <AppText size={10} style={styles.timeText}>
                  {moment(item.created_at).format('h:mm a')}
                </AppText>
              </View>

              {item.media && item.media.length > 0 && (
                <View style={styles.verticalMediaStack}>
                  {item.media.map((m: any) => (
                    <View key={m.id || m.url}>{renderMediaItem(m)}</View>
                  ))}
                </View>
              )}

              {/* TEXT LOGIC */}
              {item.text !== '' && (
                <Markdown style={markdownStyles}>
                  {item.text?.replace(/<[^>]*>?/gm, '') || ''}
                </Markdown>
              )}

              {item?.reactions?.length > 0 && (
                <View style={styles.reactionContainer}>
                  {item?.reactions?.map((reaction: any, rIdx: number) => (
                    <TouchableOpacity
                      key={rIdx}
                      style={[
                        styles.reactionBadge,
                        reaction.userReacted && styles.reactionBadgeActive,
                      ]}
                    >
                      <AppText size={12}>{reaction.reaction}</AppText>
                      <AppText
                        size={11}
                        style={[
                          styles.reactionCount,
                          reaction.userReacted && styles.reactionTextActive,
                        ]}
                      >
                        {reaction.reaction_count}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 10,
    marginBottom: 20,
  },
  messageColumn: { flex: 1, minWidth: 0, paddingRight: 10 },
  groupAvatarContainer: { marginRight: 5 },
  threadStatusIcon: { marginRight: 4, alignSelf: 'center' },
  groupSenderAvatar: { width: 35, height: 35, borderRadius: 50 },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  messageWrapper: { maxWidth: '100%', marginTop: -3 },
  mediaContainer: { position: 'relative' },
  videoWrapper: {
    width: width * 0.75,
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  verticalMediaStack: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 2,
    marginTop: 5,
    backgroundColor: Colors.border,
    borderRadius: 10,
  },
  mediaImage: {
    width: width * 0.75,
    height: 220,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
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
  messageText: {
    color: '#111B21',
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: { color: '#667781', marginLeft: 8, flexShrink: 0 },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 15,
  },
  dateText: { color: '#54656F', fontSize: 12, fontWeight: '500' },

  // SLACK SPECIFIC STYLES
  reactionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionBadgeActive: { backgroundColor: '#E8F5FE', borderColor: '#007AFF' },
  reactionCount: { marginLeft: 4, color: '#667781' },
  reactionTextActive: { color: '#007AFF', fontWeight: 'bold' },
  slackThreadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 6,
    paddingVertical: 4,
  },
  participantStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  threadAvatar: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  threadText: { color: Colors.primary, marginLeft: 4 },
  threadCountExtra: { color: '#8696A0', marginLeft: 4 },
});

export default ThreadMessageItem;
